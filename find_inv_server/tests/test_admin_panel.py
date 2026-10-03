import pytest
from fastapi.testclient import TestClient

from app import admin_store
from app.main import app

client = TestClient(app)
ADMIN = {"X-Dev-Admin": "true"}


@pytest.fixture(autouse=True)
def fresh_store():
    admin_store.reset()


def test_requires_admin():
    assert client.get("/api/admin/stats").status_code == 403


def test_innovation_moderation():
    pending = client.get("/api/admin/innovations?status=pending", headers=ADMIN).json()["data"]
    assert pending["total"] > 0
    innovation_id = pending["items"][0]["id"]

    approved = client.post(f"/api/admin/innovations/{innovation_id}/approve", headers=ADMIN).json()["data"]
    assert approved["status"] == "active"
    client.post(f"/api/admin/innovations/{innovation_id}/flag-unmaintained", headers=ADMIN)
    client.post(f"/api/admin/innovations/{innovation_id}/archive", headers=ADMIN)
    assert admin_store.get_innovation(innovation_id)["status"] == "archived"

    assert client.post("/api/admin/innovations/9999/approve", headers=ADMIN).status_code == 404


def test_filters():
    items = client.get("/api/admin/innovations?tags=seniorzy&search=senior", headers=ADMIN).json()["data"]["items"]
    assert items and all("seniorzy" in i["tags"] for i in items)


def test_roles_and_testers():
    tester = client.get("/api/admin/testers?approved=false", headers=ADMIN).json()["data"][0]
    client.post(f"/api/admin/testers/{tester['id']}/approve", headers=ADMIN)
    assert admin_store.get_user(tester["user_id"])["role"] == "tester"

    user = client.post("/api/admin/users/4/set-role", json={"role": "consultant"}, headers=ADMIN).json()["data"]
    assert user["role"] == "consultant"
    assert client.post("/api/admin/users/1/set-role", json={"role": "user"}, headers=ADMIN).status_code == 409
    assert client.post("/api/admin/users/4/set-role", json={"role": "admin"}, headers=ADMIN).status_code == 422


def test_trends_and_stats():
    trends = client.get("/api/admin/search-trends", headers=ADMIN).json()["data"]
    assert len(trends["by_day"]) == 14
    assert trends["top_tags"][0]["count"] >= trends["top_tags"][-1]["count"]
    before = client.get("/api/admin/stats", headers=ADMIN).json()["data"]["searches"]
    admin_store.log_search("test", ["seniorzy"], 3)
    stats = client.get("/api/admin/stats", headers=ADMIN).json()["data"]
    assert stats["searches"] == before + 1
    assert stats["pending_testers"] == 3
