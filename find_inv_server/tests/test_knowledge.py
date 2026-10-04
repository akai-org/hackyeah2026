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
    page = c.get("/api/innovations?limit=5").json()["data"]
    items = page["innovations"]
    assert len(items) == 5 and page["total"] > 5  # total liczy wszystkie trafienia, nie tylko stronę
    seniors = c.get("/api/innovations?tags=seniorzy&limit=50").json()["data"]["innovations"]
    assert seniors and all("seniorzy" in i["tags"] for i in seniors)
    assert c.get("/api/innovations?search=BaWita").json()["data"]["innovations"][0]["title"] == "BaWita"

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
        page = c.get("/api/innovations?limit=200").json()["data"]
        assert len(page["innovations"]) == 114 and page["total"] == 114


def test_challenges_map_gap_pulse():
    with TestClient(app) as c:
        m = c.get("/api/challenges/map").json()["data"]
        assert len(m) == 22 and "gap_score" in m[0]["gap_index"]
        gap = c.get("/api/innovation-gap").json()["data"]
        assert gap[0]["gap_score"] >= gap[-1]["gap_score"]
        p = c.get("/api/gmina-pulse/limanowski").json()["data"]
        assert len(p["top_challenges"]) == 3 and len(p["matching_innovations"]) == 3
        assert c.get("/api/gmina-pulse/xyz").status_code == 404
        assert len(c.get("/api/challenges?powiat=miechowski").json()["data"]) == 3


def test_gus_data_is_real_malopolska():
    from data import challenges as ch

    assert len(ch.POWIATY) == 22 and "żywiecki" not in ch.POWIATY  # żywiecki jest w śląskim
    with TestClient(app) as c:
        stats = c.get("/api/stats/malopolska").json()["data"]
        assert len(stats["indicators"]) == 4 and all(i["source"].startswith("GUS") for i in stats["indicators"])
        assert all(x["source"].startswith("GUS") for x in c.get("/api/challenges").json()["data"])


def test_innovations_total_allows_paging():
    """Regresja: bez `total` Biblioteka pokazywała zawsze tylko pierwsze 12 innowacji."""
    with TestClient(app) as c:
        first = c.get("/api/innovations?limit=12&offset=0").json()["data"]
        second = c.get("/api/innovations?limit=12&offset=12").json()["data"]
        assert first["total"] > 12 and len(first["innovations"]) == 12
        assert second["total"] == first["total"]
        assert {i["id"] for i in first["innovations"]}.isdisjoint(i["id"] for i in second["innovations"])


def test_library_filters_narrow_results():
    """Regresja: koszt był ignorowany, a dwa tagi dawały więcej wyników niż jeden (OR zamiast AND)."""
    with TestClient(app) as c:
        def page(**params):
            return c.get("/api/innovations", params={"limit": 200, **params}).json()["data"]

        everything = page()["total"]
        cheap = page(cost_level="low")
        assert 0 < cheap["total"] < everything
        assert all(i["cost_level"] == "low" for i in cheap["innovations"])

        one = page(tags="seniorzy", tags_mode="all")["total"]
        both = page(tags="seniorzy,wykluczenie_cyfrowe", tags_mode="all")
        assert both["total"] <= one
        assert all({"seniorzy", "wykluczenie_cyfrowe"} <= set(i["tags"]) for i in both["innovations"])
        # domyślnie (bez tags_mode) zostaje „dowolny tag” — podobne innowacje na karcie z tego korzystają
        assert page(tags="seniorzy,wykluczenie_cyfrowe")["total"] >= one

        visible = page(include_archived="false")
        assert all(i["status"] != "archived" for i in visible["innovations"])
        assert visible["total"] == len(visible["innovations"])


def test_tags_lists_whole_taxonomy_with_counts():
    from app.utils import TAXONOMY_TAGS

    with TestClient(app) as c:
        tags = c.get("/api/tags").json()["data"]
    assert [t["tag"] for t in tags] != [] and {t["tag"] for t in tags} == set(TAXONOMY_TAGS)
    counts = [t["count"] for t in tags]
    assert counts == sorted(counts, reverse=True) and all(isinstance(n, int) and n >= 0 for n in counts)
