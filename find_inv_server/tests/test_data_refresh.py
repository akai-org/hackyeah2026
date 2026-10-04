import asyncio
import json
import time
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import delete, select

from app import data_refresh
from app.database import get_db
from app.models import Innovation

URL = "https://rops.krakow.pl/x,test-refresh"


def _item(title: str, short: str = "opis", url: str = URL) -> dict:
    return {"title": title, "short_desc": short, "full_desc": "pełny", "source_url": url, "status": "active", "tags": ["seniorzy"]}


async def _rows(url: str) -> list[Innovation]:
    async with get_db() as db:
        return (await db.execute(select(Innovation).where(Innovation.source_url == url))).scalars().all()


@pytest.fixture(autouse=True)
def _cleanup():
    yield

    async def wipe():
        async with get_db() as db:
            await db.execute(delete(Innovation).where(Innovation.source_url.like(URL + "%")))
            await db.commit()

    asyncio.run(wipe())


def test_sync_upserts_and_keeps_admin_status():
    asyncio.run(data_refresh._sync_innovations([_item("Refresh A")]))
    (row,) = asyncio.run(_rows(URL))

    async def archive():
        async with get_db() as db:
            (await db.get(Innovation, row.id)).status = "archived"
            await db.commit()

    asyncio.run(archive())
    report = asyncio.run(data_refresh._sync_innovations([_item("Refresh A", short="nowy opis"), _item("Refresh B", url=URL + "-b")]))

    (same,) = asyncio.run(_rows(URL))
    assert same.id == row.id
    assert same.short_desc == "nowy opis"
    assert same.status == "archived"  # decyzja admina przeżywa scrape
    assert report["added"] == 1 and report["updated"] == 1


def test_validate_rops_rejects_shrunken_scrape():
    with pytest.raises(ValueError):
        data_refresh._validate_rops([_item("tylko jedna")])


def test_due_sources(monkeypatch, tmp_path):
    monkeypatch.setattr(data_refresh.settings, "data_refresh_state_path", str(tmp_path / "state.json"))
    old = (datetime.now(timezone.utc) - timedelta(days=31)).isoformat()
    fresh = datetime.now(timezone.utc).isoformat()
    state = {"rops": {"last_success": old}, "gus": {"last_success": fresh}}
    assert data_refresh.due_sources(state) == ["rops"]


def test_failed_source_keeps_old_data_and_records_error(monkeypatch, tmp_path):
    monkeypatch.setattr(data_refresh.settings, "data_refresh_state_path", str(tmp_path / "state.json"))

    async def boom():
        raise RuntimeError("ROPS nie odpowiada")

    async def ok():
        return {"powiaty": 22}

    monkeypatch.setattr(data_refresh, "_REFRESHERS", {"rops": boom, "gus": ok})
    report = asyncio.run(data_refresh.run_refresh(force=True))

    assert "ROPS nie odpowiada" in report["rops"]["last_error"]
    assert "last_success" not in report["rops"]
    assert report["gus"]["result"] == {"powiaty": 22}
    assert json.loads((tmp_path / "state.json").read_text())["gus"]["last_error"] is None


# ---------- harmonogram w tle ----------


def _run_scheduler_briefly(monkeypatch, due: list[str]) -> list[bool]:
    calls: list[bool] = []

    async def fake_refresh(force: bool = False):
        calls.append(force)
        return {}

    monkeypatch.setattr(data_refresh, "STARTUP_DELAY_SECONDS", 0)
    monkeypatch.setattr(data_refresh, "CHECK_EVERY_SECONDS", 0.01)
    monkeypatch.setattr(data_refresh, "due_sources", lambda state=None: due)
    monkeypatch.setattr(data_refresh, "run_refresh", fake_refresh)

    async def run():
        task = asyncio.create_task(data_refresh.scheduler())
        await asyncio.sleep(0.05)
        task.cancel()

    asyncio.run(run())
    return calls


def test_scheduler_refreshes_when_due(monkeypatch):
    calls = _run_scheduler_briefly(monkeypatch, due=["rops"])
    assert calls and calls[0] is False  # harmonogram nie wymusza, odświeża tylko źródła z minionym terminem


def test_scheduler_idle_when_nothing_due(monkeypatch):
    assert _run_scheduler_briefly(monkeypatch, due=[]) == []


def test_scheduler_survives_refresh_error(monkeypatch):
    calls: list[int] = []

    async def failing(force: bool = False):
        calls.append(1)
        raise RuntimeError("baza zablokowana")

    monkeypatch.setattr(data_refresh, "STARTUP_DELAY_SECONDS", 0)
    monkeypatch.setattr(data_refresh, "CHECK_EVERY_SECONDS", 0.01)
    monkeypatch.setattr(data_refresh, "due_sources", lambda state=None: ["gus"])
    monkeypatch.setattr(data_refresh, "run_refresh", failing)

    async def run():
        task = asyncio.create_task(data_refresh.scheduler())
        await asyncio.sleep(0.05)
        assert not task.done()  # pętla żyje mimo wyjątku
        task.cancel()

    asyncio.run(run())
    assert len(calls) > 1  # i próbuje ponownie przy kolejnym sprawdzeniu


def test_lifespan_starts_scheduler_only_when_enabled(monkeypatch):
    from fastapi.testclient import TestClient

    from app.main import app

    started: list[bool] = []

    async def fake_scheduler():
        started.append(True)

    monkeypatch.setattr(data_refresh, "scheduler", fake_scheduler)

    monkeypatch.setattr(data_refresh.settings, "data_refresh_enabled", False)
    with TestClient(app):
        pass
    assert started == []

    monkeypatch.setattr(data_refresh.settings, "data_refresh_enabled", True)
    with TestClient(app) as c:
        c.get("/api/health")
    assert started == [True]


# ---------- endpoint panelu admina ----------


def test_admin_endpoint_runs_refresh(monkeypatch, tmp_path):
    from fastapi.testclient import TestClient

    from app.main import app

    monkeypatch.setattr(data_refresh.settings, "data_refresh_enabled", False)
    monkeypatch.setattr(data_refresh.settings, "data_refresh_state_path", str(tmp_path / "state.json"))

    async def slow_ok():
        await asyncio.sleep(0.2)
        return {"count": 139}

    monkeypatch.setattr(data_refresh, "_REFRESHERS", {"rops": slow_ok, "gus": slow_ok})
    admin = {"X-Dev-Admin": "true"}

    with TestClient(app) as c:
        assert c.post("/api/admin/data-refresh").status_code == 403

        r = c.post("/api/admin/data-refresh", headers=admin)
        assert r.status_code == 202
        assert r.json()["data"]["running"] is True

        assert c.post("/api/admin/data-refresh", headers=admin).status_code == 409  # drugi raz równolegle nie

        for _ in range(100):
            status = c.get("/api/admin/data-refresh", headers=admin).json()["data"]
            if not status["running"]:
                break
            time.sleep(0.05)

    assert status["running"] is False
    assert status["due"] == []
    assert status["sources"]["rops"]["result"] == {"count": 139}
    assert status["sources"]["gus"]["last_error"] is None


def test_replace_raw_pages_keeps_other_files(monkeypatch, tmp_path):
    raw, new = tmp_path / "rops_raw", tmp_path / "new"
    raw.mkdir()
    new.mkdir()
    (raw / "innovations.json").write_text("{}")  # plik śledzony w repo — scrape nie może go ruszyć
    (raw / "item__stara__x.html").write_text("stara")
    (new / "item__nowa__y.html").write_text("nowa")
    monkeypatch.setattr(data_refresh, "ROPS_RAW", raw)

    data_refresh._replace_raw_pages(new)

    assert sorted(p.name for p in raw.iterdir()) == ["innovations.json", "item__nowa__y.html"]
