import asyncio
import json
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app import admin_store
from app.database import get_db
from app.main import app
from app.models import Event, ForumPost, Innovation, SearchLog, User
from app.models import TestReport as ModelTestReport
from app.models import Tester as ModelTester

client = TestClient(app)
ADMIN = {"X-Dev-Admin": "true"}


def _innovation(id_: int, title: str, status: str, tags: list[str]) -> Innovation:
    return Innovation(
        id=id_, title=title, short_desc=f"{title} — opis", full_desc=f"{title} — pełny opis", status=status,
        category="test", cost_level="low", where_implemented="Kraków", tags=json.dumps(tags, ensure_ascii=False),
        embedding_id=str(id_),
    )


async def _seed() -> None:
    now = datetime.now()
    async with get_db() as db:
        db.add_all([
            _innovation(1, "Seniorzy online", "active", ["seniorzy", "wykluczenie_cyfrowe"]),
            _innovation(2, "Klub seniora", "active", ["seniorzy", "samotność"]),
            _innovation(3, "Nowe zgłoszenie", "pending", ["dzieci"]),
            User(id=1, name="Admin ROPS", role="admin", session_token="t-admin"),
            User(id=2, name="Anna", role="user", session_token="t-anna"),
            User(id=3, name="Jan", role="user", session_token="t-jan"),
            User(id=4, name="Ewa", role="user", session_token="t-ewa"),
        ])
        await db.flush()
        db.add_all([
            ModelTester(id=1, user_id=2, name="Anna", email="anna@example.org", approved=False),
            ModelTester(id=2, user_id=3, name="Jan", email="jan@example.org", approved=False),
            ModelTester(id=3, user_id=4, name="Ewa", email="ewa@example.org", approved=True),
        ])
        for days_ago, query, tags, results in [(0, "samotny senior", ["seniorzy", "samotność"], 3),
                                               (1, "senior internet", ["seniorzy"], 2),
                                               (2, "bezdomność zimą", ["bezdomność"], 0)]:
            db.add(SearchLog(query=query, tags=json.dumps(tags, ensure_ascii=False), results_count=results,
                             created_at=now - timedelta(days=days_ago)))
        await db.commit()


async def _clear() -> None:
    async with get_db() as db:
        for model in (Event, ModelTestReport, ForumPost, SearchLog, ModelTester, User, Innovation):
            await db.execute(delete(model))
        await db.commit()


@pytest.fixture(autouse=True)
def database():
    """Każdy test na świeżych danych w SQLite; po teście baza wraca do stanu pustego (inne testy na tym polegają)."""
    asyncio.run(_clear())
    asyncio.run(_seed())
    admin_store.reset()
    yield
    asyncio.run(_clear())
    admin_store.reset()


async def _get(model, id_: int):
    async with get_db() as db:
        return await db.get(model, id_)


def test_requires_admin():
    assert client.get("/api/admin/stats").status_code == 403


def test_innovation_moderation():
    pending = client.get("/api/admin/innovations?status=pending", headers=ADMIN).json()["data"]
    assert pending["total"] == 1
    innovation_id = pending["items"][0]["id"]

    approved = client.post(f"/api/admin/innovations/{innovation_id}/approve", headers=ADMIN).json()["data"]
    assert approved["status"] == "active"
    client.post(f"/api/admin/innovations/{innovation_id}/flag-unmaintained", headers=ADMIN)
    client.post(f"/api/admin/innovations/{innovation_id}/archive", headers=ADMIN)
    assert asyncio.run(_get(Innovation, innovation_id)).status == "archived"

    assert client.post("/api/admin/innovations/9999/approve", headers=ADMIN).status_code == 404


def test_archived_innovation_disappears_from_library_and_results():
    """Zadanie 1: archiwizacja w panelu zapisuje się w SQLite, więc znika z Biblioteki i z wyników matchmakingu."""
    library = lambda: [i["id"] for i in client.get("/api/innovations?include_archived=false&limit=50").json()["data"]["innovations"]]  # noqa: E731
    matched = lambda: [i["id"] for i in client.post("/api/match", json={"text": "seniorzy online internet", "tags": ["seniorzy"]}).json()["data"]["innovations"]]  # noqa: E731
    assert 1 in library() and 1 in matched()

    client.post("/api/admin/innovations/1/archive", headers=ADMIN)

    assert asyncio.run(_get(Innovation, 1)).status == "archived"
    assert 1 not in library()
    assert 1 not in matched()
    # restart serwera (kopia w pamięci od nowa) nie przywraca innowacji — źródłem prawdy jest baza
    admin_store.reset()
    assert 1 not in matched()


def test_filters():
    items = client.get("/api/admin/innovations?tags=seniorzy&search=senior", headers=ADMIN).json()["data"]["items"]
    assert {i["id"] for i in items} == {1, 2}
    assert all("seniorzy" in i["tags"] for i in items)


def test_roles_and_testers():
    pending = client.get("/api/admin/testers?approved=false", headers=ADMIN).json()["data"]
    assert {t["id"] for t in pending} == {1, 2}
    users = {u["id"]: u for u in client.get("/api/admin/users", headers=ADMIN).json()["data"]}
    assert users[2]["tester_pending"] and not users[4]["tester_pending"]

    user = client.post("/api/admin/users/4/set-role", json={"role": "consultant"}, headers=ADMIN).json()["data"]
    assert user["role"] == "consultant"
    assert asyncio.run(_get(User, 4)).role == "consultant"
    assert client.post("/api/admin/users/1/set-role", json={"role": "user"}, headers=ADMIN).status_code == 409
    assert client.post("/api/admin/users/4/set-role", json={"role": "admin"}, headers=ADMIN).status_code == 422
    assert client.post("/api/admin/users/999/set-role", json={"role": "user"}, headers=ADMIN).status_code == 404


def test_approving_tester_sets_flag_and_role():
    """Zadanie 6: zatwierdzenie zmienia testers.approved=true i users.role="tester" w bazie."""
    result = client.post("/api/admin/testers/1/approve", headers=ADMIN).json()["data"]
    assert result["approved"] is True
    assert asyncio.run(_get(ModelTester, 1)).approved is True
    assert asyncio.run(_get(User, 2)).role == "tester"
    assert client.post("/api/admin/testers/999/approve", headers=ADMIN).status_code == 404


def test_trends_and_stats_from_database():
    """Zadanie 5: liczniki i trendy z SQLite, nie z danych demo w pamięci."""
    trends = client.get("/api/admin/search-trends", headers=ADMIN).json()["data"]
    assert len(trends["by_day"]) == 14 and trends["total"] == 3
    assert trends["top_tags"][0] == {"tag": "seniorzy", "count": 2}
    assert trends["zero_result_queries"] == [{"query": "bezdomność zimą", "count": 1}]

    stats = client.get("/api/admin/stats", headers=ADMIN).json()["data"]
    assert stats == {**stats, "innovations": 3, "users": 4, "testers": 1, "pending_testers": 2, "searches": 3,
                     "searches_today": 1}
    assert stats["innovations_by_status"]["pending"] == 1

    client.post("/api/match", json={"text": "klub seniora", "tags": []})  # nowe wyszukiwanie trafia do search_logs
    assert client.get("/api/admin/stats", headers=ADMIN).json()["data"]["searches"] == 4


CARD = {
    "title": "Banki czasu dla seniorów", "short_desc": "Sąsiedzi wymieniają się godzinami pomocy.",
    "full_desc": "Pełny opis", "category": "usługi społeczne", "area": "wsparcie społeczne",
    "target_group": "seniorzy", "location": "Tarnów", "status": "active", "cost_level": "low",
    "implementation_time_months": 4, "where_implemented": "Tarnów", "source_url": "https://example.org",
    "tags": ["seniorzy", "wolontariat"],
}


def test_cms_create_update_delete(monkeypatch):
    """Zadanie 3: dodanie, edycja wszystkich pól i usunięcie innowacji; wektor w ChromaDB idzie za rekordem."""
    from app.routers import admin_panel

    dropped: list[int] = []
    monkeypatch.setattr(admin_panel, "_drop_vector", dropped.append)
    monkeypatch.setattr(admin_panel.settings, "openrouter_api_key", "")

    created = client.post("/api/admin/innovations", json=CARD, headers=ADMIN)
    assert created.status_code == 201
    item = created.json()["data"]
    assert item["tags"] == ["seniorzy", "wolontariat"] and item["implementation_time_months"] == 4
    assert item["embedding"] == "skipped"
    new_id = item["id"]
    assert asyncio.run(_get(Innovation, new_id)).embedding_id == str(new_id)

    updated = client.put(f"/api/admin/innovations/{new_id}", json={**CARD, "title": "Bank czasu", "status": "unmaintained",
                                                                    "tags": ["seniorzy"]}, headers=ADMIN).json()["data"]
    assert updated["title"] == "Bank czasu" and updated["status"] == "unmaintained" and updated["tags"] == ["seniorzy"]
    assert client.get(f"/api/admin/innovations/{new_id}", headers=ADMIN).json()["data"]["full_desc"] == "Pełny opis"

    assert client.post("/api/admin/innovations", json={**CARD, "tags": ["kosmos"]}, headers=ADMIN).status_code == 422
    assert client.put("/api/admin/innovations/9999", json=CARD, headers=ADMIN).status_code == 404

    async def _attach():
        async with get_db() as db:
            post = ForumPost(innovation_id=new_id, content="komentarz")
            db.add(post)
            await db.flush()
            db.add_all([ForumPost(parent_id=post.id, content="odpowiedź"),
                        ModelTestReport(user_id=2, innovation_id=new_id),
                        Event(type="view", innovation_id=new_id)])
            await db.commit()
    asyncio.run(_attach())

    deleted = client.delete(f"/api/admin/innovations/{new_id}", headers=ADMIN).json()["data"]
    assert deleted["deleted"] and deleted["removed"] == {"forum_posts": 1, "test_reports": 1}
    assert asyncio.run(_get(Innovation, new_id)) is None
    assert dropped[-1] == new_id
    assert client.delete(f"/api/admin/innovations/{new_id}", headers=ADMIN).status_code == 404

    async def _leftovers():
        async with get_db() as db:
            posts = (await db.execute(select(ForumPost))).scalars().all()
            events = (await db.execute(select(Event))).scalars().all()
        return posts, events
    posts, events = asyncio.run(_leftovers())
    assert posts == [] and [e.innovation_id for e in events] == [None]  # statystyki zostają


def test_delete_forum_post_and_user():
    """Zadanie 4: moderacja forum i usuwanie kont (bez kont admina)."""
    async def _post():
        async with get_db() as db:
            post = ForumPost(content="spam", author_name="Bot")
            db.add(post)
            await db.flush()
            db.add(ForumPost(parent_id=post.id, content="odpowiedź na spam"))
            await db.commit()
            return post.id
    post_id = asyncio.run(_post())
    posts = client.get("/api/admin/forum", headers=ADMIN).json()["data"]
    assert {p["content"] for p in posts} == {"spam", "odpowiedź na spam"}
    result = client.delete(f"/api/admin/forum/{post_id}", headers=ADMIN).json()["data"]
    assert result["replies_deleted"] == 1
    assert client.get("/api/admin/forum", headers=ADMIN).json()["data"] == []

    removed = client.delete("/api/admin/users/2", headers=ADMIN).json()["data"]["removed"]
    assert removed == {"testers": 1}
    assert asyncio.run(_get(User, 2)) is None
    assert client.delete("/api/admin/users/1", headers=ADMIN).status_code == 409
    assert client.delete("/api/admin/users/999", headers=ADMIN).status_code == 404
    assert client.delete("/api/admin/users/3").status_code == 403

