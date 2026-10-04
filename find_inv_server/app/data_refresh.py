"""Comiesięczne odświeżanie danych scrapowanych: Biblioteka Innowacji ROPS + wskaźniki GUS BDL.

Harmonogram startuje w lifespan aplikacji (app/main.py): co kilka godzin sprawdza, czy od ostatniego
udanego pobrania danego źródła minęło `data_refresh_interval_days` dni — jeśli tak, scrapuje je od nowa.
Ręcznie: `python -m app.data_refresh [--force]` albo POST /api/admin/data-refresh.

Bezpieczeństwo danych:
- scrape idzie do katalogu tymczasowego; pliki w data/ podmieniamy dopiero po walidacji
  (np. awaria strony ROPS, która zwróci 3 innowacje zamiast 139, niczego nie nadpisze),
- tabela innovations jest synchronizowana upsertem (klucz: source_url + tytuł), nie kasowana —
  status ustawiony w panelu admina, liczba testerów i powiązania (forum, zgłoszenia testerów) zostają,
- innowacje, które zniknęły ze strony ROPS, nie są usuwane — trafiają tylko do raportu.
"""

import asyncio
import importlib
import json
import logging
import shutil
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select

from app.config import settings

log = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
INNOVATIONS_FILE = DATA_DIR / "parsed_innovations.json"
GUS_FILE = DATA_DIR / "gus_indicators.json"
ROPS_RAW = DATA_DIR / "rops_raw"

CHECK_EVERY_SECONDS = 6 * 3600
STARTUP_DELAY_SECONDS = 60
# Nowy scrape musi mieć co najmniej tyle (ułamek) rekordów co obecne dane — inaczej uznajemy go za zepsuty.
MIN_KEEP_RATIO = 0.8

SOURCES = ("rops", "gus")

_lock: asyncio.Lock | None = None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _state_path() -> Path:
    return Path(settings.data_refresh_state_path)


def load_state() -> dict:
    try:
        return json.loads(_state_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def _save_state(state: dict) -> None:
    path = _state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def _last_success(state: dict, source: str) -> datetime | None:
    ts = state.get(source, {}).get("last_success")
    if ts:
        return datetime.fromisoformat(ts)
    # Brak stanu (świeża instalacja): dane z repo liczymy jako pobrane w chwili zapisu pliku.
    snapshot = INNOVATIONS_FILE if source == "rops" else GUS_FILE
    if snapshot.exists():
        return datetime.fromtimestamp(snapshot.stat().st_mtime, timezone.utc)
    return None


def due_sources(state: dict | None = None) -> list[str]:
    state = load_state() if state is None else state
    interval = timedelta(days=settings.data_refresh_interval_days)
    return [s for s in SOURCES if (last := _last_success(state, s)) is None or _now() - last >= interval]


def is_running() -> bool:
    return _lock is not None and _lock.locked()


# ---------- ROPS ----------


def _scrape_rops(tmp: Path) -> list[dict]:
    """Pobiera wszystko od nowa (bez cache) i parsuje — wynik w katalogu tymczasowym."""
    from data import fetch_rops, inject_edu, parse_rops

    raw = tmp / "rops_raw"
    out = tmp / "parsed_innovations.json"
    fetch_rops.main(raw)
    parse_rops.main(raw, out)
    inject_edu.main(out)
    return json.loads(out.read_text(encoding="utf-8"))


def _validate_rops(items: list[dict]) -> None:
    current = json.loads(INNOVATIONS_FILE.read_text(encoding="utf-8")) if INNOVATIONS_FILE.exists() else []
    if not items or len(items) < MIN_KEEP_RATIO * len(current):
        raise ValueError(f"scrape ROPS podejrzany: {len(items)} innowacji, obecnie {len(current)}")
    broken = [i for i in items if not i.get("title") or not i.get("short_desc")]
    if broken:
        raise ValueError(f"scrape ROPS: {len(broken)} rekordów bez tytułu/opisu")


def _innovation_key(source_url: str | None, title: str | None) -> tuple[str, str]:
    return (source_url or "", (title or "").strip().lower())


async def _sync_innovations(items: list[dict]) -> dict:
    """Upsert do tabeli innovations. Zmieniona treść = nowy wektor w ChromaDB (jeśli jest klucz OpenRouter)."""
    from app.database import get_db, init_db
    from app.models import Innovation
    from data.seed_innovations import FIELDS

    # status i testers_count należą do panelu admina / testerów — scrape ich nie nadpisuje
    content_fields = [f for f in FIELDS if f not in ("status", "testers_count")]
    text_fields = {"title", "short_desc", "full_desc"}

    await init_db()
    added, updated, to_embed = 0, 0, []
    async with get_db() as db:
        rows = (await db.execute(select(Innovation))).scalars().all()
        by_key = {_innovation_key(r.source_url, r.title): r for r in rows}
        seen: set[int] = set()

        for item in items:
            values = {k: item.get(k) for k in content_fields}
            values["tags"] = json.dumps(item.get("tags") or [], ensure_ascii=False)
            row = by_key.get(_innovation_key(item.get("source_url"), item.get("title")))

            if row is None:
                row = Innovation(**values, status=item.get("status") or "active", testers_count=0)
                db.add(row)
                await db.flush()
                row.embedding_id = str(row.id)
                added += 1
                to_embed.append(row)
            else:
                changed = {k for k, v in values.items() if getattr(row, k) != v}
                for k in changed:
                    setattr(row, k, values[k])
                if changed:
                    updated += 1
                if changed & text_fields:
                    to_embed.append(row)
            seen.add(row.id)

        missing = [r.title for r in rows if r.source_url and r.id not in seen]
        await db.commit()

    embedded = 0
    if settings.openrouter_api_key:
        from app.embeddings import embed_and_store

        for row in to_embed:
            try:
                text = f"{row.title} {row.short_desc or ''} {row.full_desc or ''}"
                await embed_and_store(str(row.id), text, {"innovation_id": row.id})
                embedded += 1
            except Exception:
                log.exception("embedding innowacji %s nieudany", row.id)

    return {"added": added, "updated": updated, "embedded": embedded, "missing_on_source": missing}


def _replace_raw_pages(new_raw: Path) -> None:
    """Podmienia tylko pobrane strony (cat__/item__*.html) — inne pliki w rops_raw/ są w repo i zostają."""
    ROPS_RAW.mkdir(exist_ok=True)
    for old in [*ROPS_RAW.glob("cat__*.html"), *ROPS_RAW.glob("item__*.html")]:
        old.unlink()
    for page in new_raw.glob("*.html"):
        shutil.copyfile(page, ROPS_RAW / page.name)


async def refresh_rops() -> dict:
    with tempfile.TemporaryDirectory(prefix="findinv-rops-") as tmp:
        items = await asyncio.to_thread(_scrape_rops, Path(tmp))
        _validate_rops(items)
        db_report = await _sync_innovations(items)
        shutil.copyfile(Path(tmp) / "parsed_innovations.json", INNOVATIONS_FILE)
        _replace_raw_pages(Path(tmp) / "rops_raw")

    from app import knowledge_store

    knowledge_store.load_innovations.cache_clear()
    return {"count": len(items), **db_report}


# ---------- GUS ----------


def _scrape_gus(tmp: Path) -> dict:
    from data import fetch_gus

    out = tmp / "gus_indicators.json"
    fetch_gus.main(out)
    return json.loads(out.read_text(encoding="utf-8"))


def _validate_gus(data: dict) -> None:
    from data import fetch_gus

    current = json.loads(GUS_FILE.read_text(encoding="utf-8"))["powiaty"] if GUS_FILE.exists() else {}
    powiaty = data.get("powiaty") or {}
    if not powiaty or len(powiaty) < len(current):
        raise ValueError(f"scrape GUS podejrzany: {len(powiaty)} powiatów, obecnie {len(current)}")
    incomplete = [p for p, v in powiaty.items() if any(k not in v for k in fetch_gus.VARIABLES)]
    if incomplete:
        raise ValueError(f"scrape GUS: brak wskaźników dla {incomplete}")


async def refresh_gus() -> dict:
    with tempfile.TemporaryDirectory(prefix="findinv-gus-") as tmp:
        data = await asyncio.to_thread(_scrape_gus, Path(tmp))
        _validate_gus(data)
        shutil.copyfile(Path(tmp) / "gus_indicators.json", GUS_FILE)

    # Routery trzymają `from data import challenges as ch` — reload podmienia atrybuty w tym samym module.
    from data import challenges

    importlib.reload(challenges)
    years = sorted({v["year"] for v in data["variables"].values()})
    return {"powiaty": len(data["powiaty"]), "years": years}


# ---------- orkiestracja ----------

_REFRESHERS = {"rops": refresh_rops, "gus": refresh_gus}


async def run_refresh(force: bool = False) -> dict:
    """Odświeża źródła, którym minął termin (albo wszystkie przy force). Błąd jednego nie blokuje drugiego."""
    global _lock
    if _lock is None:
        _lock = asyncio.Lock()
    if _lock.locked():
        return {"skipped": "odświeżanie już trwa"}

    async with _lock:
        state = load_state()
        sources = list(SOURCES) if force else due_sources(state)
        report: dict = {}
        for source in sources:
            entry = state.setdefault(source, {})
            entry["last_attempt"] = _now().isoformat()
            log.info("data refresh: %s…", source)
            try:
                result = await _REFRESHERS[source]()
                entry.update(last_success=_now().isoformat(), last_error=None, result=result)
                log.info("data refresh: %s OK %s", source, result)
            except Exception as exc:  # noqa: BLE001 — stare dane zostają, spróbujemy przy kolejnym sprawdzeniu
                entry["last_error"] = f"{type(exc).__name__}: {exc}"
                log.exception("data refresh: %s nieudany", source)
            report[source] = entry
            _save_state(state)
        return report


async def scheduler() -> None:
    """Pętla w tle: raz na CHECK_EVERY_SECONDS sprawdza, czy któreś źródło wymaga odświeżenia."""
    await asyncio.sleep(STARTUP_DELAY_SECONDS)  # nie spowalniamy startu aplikacji
    while True:
        try:
            if due_sources():
                await run_refresh()
        except Exception:  # noqa: BLE001 — pętla harmonogramu nie może umrzeć
            log.exception("data refresh scheduler")
        await asyncio.sleep(CHECK_EVERY_SECONDS)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print(json.dumps(asyncio.run(run_refresh(force="--force" in sys.argv)), ensure_ascii=False, indent=2))
