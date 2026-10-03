import asyncio
import os
import tempfile

# Osobna baza i ChromaDB dla testów – ustawione przed importem app.
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_tmp}/test.db"
os.environ["CHROMA_PATH"] = f"{_tmp}/chroma"
os.environ["OPENROUTER_API_KEY"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def _check_contract(c: TestClient) -> None:
    items = c.get("/api/innovations?limit=5").json()["data"]
    assert isinstance(items, list) and len(items) == 5
    seniors = c.get("/api/innovations?tags=seniorzy&limit=50").json()["data"]
    assert seniors and all("seniorzy" in i["tags"] for i in seniors)
    assert c.get("/api/innovations?search=BaWita").json()["data"][0]["title"] == "BaWita"

    detail = c.get(f"/api/innovations/{items[0]['id']}").json()["data"]
    assert detail["full_desc"] and "who_can_use" in detail
    assert c.get("/api/innovations/99999").status_code == 404


def test_fallback_without_seed():
    with TestClient(app) as c:  # pusta baza -> dane z parsed_innovations.json
        _check_contract(c)


def test_after_seed():
    from data.seed_innovations import seed

    asyncio.run(seed())
    with TestClient(app) as c:
        _check_contract(c)
        assert len(c.get("/api/innovations?limit=200").json()["data"]) == 114


def test_challenges_map_gap_pulse():
    with TestClient(app) as c:
        m = c.get("/api/challenges/map").json()["data"]
        assert len(m) >= 20 and "gap_score" in m[0]["gap_index"]
        gap = c.get("/api/innovation-gap").json()["data"]
        assert gap[0]["gap_score"] >= gap[-1]["gap_score"]
        p = c.get("/api/gmina-pulse/limanowski").json()["data"]
        assert len(p["top_challenges"]) == 3 and len(p["matching_innovations"]) == 3
        assert c.get("/api/gmina-pulse/xyz").status_code == 404
        assert len(c.get("/api/challenges?powiat=miechowski").json()["data"]) == 3
