from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_innovations_list_and_search():
    r = client.get("/api/innovations?limit=5")
    d = r.json()
    assert d["error"] is None and len(d["data"]["innovations"]) == 5 and d["data"]["total"] > 50
    s = client.get("/api/innovations?tags=seniorzy").json()["data"]
    assert all("seniorzy" in i["tags"] for i in s["innovations"])


def test_innovation_detail():
    first = client.get("/api/innovations?limit=1").json()["data"]["innovations"][0]
    r = client.get(f"/api/innovations/{first['id']}")
    assert r.status_code == 200 and "full_desc" in r.json()["data"]
    assert client.get("/api/innovations/99999").status_code == 404


def test_challenges_map_gap_pulse():
    assert len(client.get("/api/challenges/map").json()["data"]) >= 20
    gap = client.get("/api/innovation-gap").json()["data"]
    assert gap[0]["gap_score"] >= gap[-1]["gap_score"]
    p = client.get("/api/gmina-pulse/limanowski").json()["data"]
    assert len(p["top_challenges"]) == 3 and len(p["innovations"]) == 3
    assert client.get("/api/gmina-pulse/xyz").status_code == 404
    assert client.get("/api/challenges?powiat=miechowski").json()["data"]["total"] == 3
