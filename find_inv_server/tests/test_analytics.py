from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
ADMIN = {"X-Dev-Admin": "true"}


def _views(innovation_id: int) -> int:
    items = client.get("/api/admin/analytics/innovations?days=1&limit=200", headers=ADMIN).json()["data"]["items"]
    return next((i["views"] for i in items if i["id"] == innovation_id), 0)


def test_event_is_counted():
    before = _views(7)
    assert client.post("/api/events", json={"type": "innovation_view", "innovation_id": 7, "anon_id": "a"}).status_code == 204
    assert _views(7) == before + 1


def test_unknown_event_is_ignored():
    before = client.get("/api/admin/analytics/overview?days=1", headers=ADMIN).json()["data"]["metrics"]
    client.post("/api/events", json={"type": "card_impression", "innovation_id": 7})  # tylko backend
    client.post("/api/events", json={"type": "cta_click", "innovation_id": 7, "meta": {"button": "hack"}})
    after = client.get("/api/admin/analytics/overview?days=1", headers=ADMIN).json()["data"]["metrics"]
    assert after["impressions"]["value"] == before["impressions"]["value"]
    assert after["cta_clicks"]["value"] == before["cta_clicks"]["value"]


def test_innovation_comments_are_separate_from_forum():
    client.post("/api/forum", json={"content": "Komentarz pod kartą", "innovationId": 7})
    under_card = client.get("/api/forum?innovation_id=7").json()["data"]
    assert any(p["content"] == "Komentarz pod kartą" for p in under_card)
    general = client.get("/api/forum").json()["data"]
    assert all(p.get("innovationId") is None for p in general)

    overview = client.get("/api/admin/analytics/overview?days=1", headers=ADMIN).json()["data"]
    assert overview["metrics"]["comments"]["value"] >= 1


def test_timeseries_and_funnel_shapes():
    series = client.get("/api/admin/analytics/timeseries?days=7", headers=ADMIN).json()["data"]
    assert len(series) == 7 and {"date", "views", "comments"} <= set(series[0])
    funnel = client.get("/api/admin/analytics/funnel", headers=ADMIN).json()["data"]
    assert funnel["steps"][0]["step"] == "views"
    demand = client.get("/api/admin/analytics/demand", headers=ADMIN).json()["data"]
    assert "items" in demand
