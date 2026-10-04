"""Panel admina ROPS (A5): moderacja innowacji, role użytkowników, testerzy, trendy, liczniki.

Ścieżki nie kolidują z adminem Zasobnika (A2: /api/admin/areas|resources|needs|trends),
dlatego trendy wyszukiwań są pod /api/admin/search-trends.

Auth: dopóki A1 nie wystawi app.auth.get_current_user, wpuszczamy nagłówek X-Dev-Admin: true.
Gdy get_current_user jest dostępny, wystarczy też sesja z rolą "admin" (cookie/X-Session-Token).
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, or_, select

from app import admin_store, data_refresh
from app.config import settings
from app.database import get_db
from app.models import ForumPost, Innovation, SearchLog, Tester, User
from app.utils import TAXONOMY_TAGS

log = logging.getLogger(__name__)

try:  # A1 Push 2
    from app.auth import get_current_user
except ImportError:
    get_current_user = None


def _forbidden() -> HTTPException:
    return HTTPException(status.HTTP_403_FORBIDDEN, "Panel dostępny tylko dla roli admin")


def _dev_admin(x_dev_admin: str | None) -> bool:
    return bool(x_dev_admin) and x_dev_admin.lower() == "true"


if get_current_user is not None:
    # FastAPI sam rozwiąże zależności get_current_user (Request, sesja DB…) — niezależnie od jego sygnatury.
    async def require_panel_admin(
        x_dev_admin: Annotated[str | None, Header()] = None,
        user=Depends(get_current_user),
    ) -> None:
        if _dev_admin(x_dev_admin) or getattr(user, "role", None) == "admin":
            return
        raise _forbidden()

else:

    async def require_panel_admin(x_dev_admin: Annotated[str | None, Header()] = None) -> None:
        if not _dev_admin(x_dev_admin):
            raise _forbidden()


router = APIRouter(prefix="/api/admin", tags=["admin-panel"], dependencies=[Depends(require_panel_admin)])


def _ok(data):
    return {"data": data, "error": None}


def _not_found(what: str):
    raise HTTPException(status.HTTP_404_NOT_FOUND, f"Nie znaleziono: {what}")


# Źródło prawdy to SQLite (te same tabele czytają Biblioteka, matchmaking i karta innowacji). admin_store
# w pamięci zostaje tylko jako zapas, gdy bazy nie da się otworzyć — wtedy panel nadal da się pokazać.


def _iso(value) -> str | None:
    return value.isoformat(timespec="seconds") if value else None


def _innovation_row(innov) -> dict:
    return {
        "id": innov.id,
        "title": innov.title,
        "short_desc": innov.short_desc,
        "category": innov.category,
        "target_group": innov.target_group,
        "location": innov.location,
        "status": innov.status,
        "cost_level": innov.cost_level,
        "where_implemented": innov.where_implemented,
        "tags": innov.tags_list(),
        "created_at": _iso(innov.created_at),
        "updated_at": _iso(innov.updated_at),
    }


# ── Innowacje ────────────────────────────────────────────


@router.get("/innovations")
async def list_innovations(
    status_: Annotated[str | None, Query(alias="status")] = None,
    tags: str | None = None,
    search: str | None = None,
):
    tag_list = [t for t in (tags or "").split(",") if t]
    try:
        query = select(Innovation)
        if status_:
            query = query.where(Innovation.status == status_)
        if search:
            needle = f"%{search}%"
            query = query.where(
                or_(Innovation.title.ilike(needle), Innovation.short_desc.ilike(needle),
                    Innovation.where_implemented.ilike(needle))
            )
        for tag in tag_list:  # tagi trzymane jako JSON — cudzysłowy, żeby „OPS” nie trafiał w „DOPS”
            query = query.where(Innovation.tags.ilike(f'%"{tag}"%'))
        async with get_db() as db:
            rows = (await db.execute(query)).scalars().all()
    except Exception:
        log.exception("admin innovations from SQLite failed, using memory store")
        items = admin_store.list_innovations(status=status_ or None, tags=tag_list, search=search or None)
        return _ok({"items": items, "total": len(items)})
    items = [_innovation_row(row) for row in rows]
    # Najpierw oczekujące na weryfikację, potem od najnowszych.
    items.sort(key=lambda i: i["updated_at"] or "", reverse=True)
    items.sort(key=lambda i: i["status"] != "pending")
    return _ok({"items": items, "total": len(items)})


async def _set_status(innovation_id: int, new_status: str):
    item = await admin_store.set_innovation_status_persisted(innovation_id, new_status)
    if item is None:
        _not_found(f"innowacja {innovation_id}")
    return _ok(item)


@router.post("/innovations/{innovation_id}/approve")
async def approve_innovation(innovation_id: int):
    return await _set_status(innovation_id, "active")


@router.post("/innovations/{innovation_id}/archive")
async def archive_innovation(innovation_id: int):
    return await _set_status(innovation_id, "archived")


@router.post("/innovations/{innovation_id}/flag-unmaintained")
async def flag_unmaintained(innovation_id: int):
    return await _set_status(innovation_id, "unmaintained")


# ── CMS innowacji (zadanie 3) ────────────────────────────


class InnovationIn(BaseModel):
    """Wszystkie pola karty innowacji, które edytuje admin."""

    title: str = Field(min_length=3, max_length=256)
    short_desc: str = Field(min_length=10, max_length=2000)
    full_desc: str | None = None
    category: str | None = Field(default=None, max_length=128)
    area: str | None = Field(default=None, max_length=128)
    target_group: str | None = Field(default=None, max_length=256)
    location: str | None = Field(default=None, max_length=256)
    status: Literal["pending", "active", "archived", "unmaintained"] = "active"
    cost_level: Literal["low", "medium", "high"] | None = None
    implementation_time_months: int | None = Field(default=None, ge=0, le=120)
    where_implemented: str | None = Field(default=None, max_length=512)
    source_url: str | None = Field(default=None, max_length=512)
    tags: list[str] = Field(default_factory=list)

    @field_validator("tags")
    @classmethod
    def only_taxonomy(cls, tags: list[str]) -> list[str]:
        unknown = [tag for tag in tags if tag not in TAXONOMY_TAGS]
        if unknown:
            raise ValueError(f"Tagi spoza taksonomii: {', '.join(unknown)}")
        return list(dict.fromkeys(tags))

    @field_validator("title", "short_desc", "full_desc", "category", "area", "target_group", "location",
                     "where_implemented", "source_url")
    @classmethod
    def strip(cls, value: str | None) -> str | None:
        return value.strip() or None if isinstance(value, str) else value


def _innovation_full(innov) -> dict:
    return {
        **_innovation_row(innov),
        "full_desc": innov.full_desc,
        "area": innov.area,
        "implementation_time_months": innov.implementation_time_months,
        "source_url": innov.source_url,
        "testers_count": innov.testers_count,
    }


async def _reindex(innov) -> str:
    """Przelicza wektor innowacji w ChromaDB. Bez klucza OpenRouter embeddingu nie da się policzyć —
    wtedy usuwamy stary wektor (żeby wyszukiwanie semantyczne nie znajdowało nieaktualnej treści)."""
    if not settings.openrouter_api_key:
        _drop_vector(innov.id)
        return "skipped"
    try:
        from app.embeddings import embed_and_store

        text = f"{innov.title} {innov.short_desc or ''} {innov.full_desc or ''}"
        await embed_and_store(str(innov.id), text, {"innovation_id": innov.id})
        return "updated"
    except Exception:
        log.exception("reindex of innovation %s failed", innov.id)
        _drop_vector(innov.id)
        return "failed"


def _drop_vector(innovation_id: int) -> None:
    try:
        from app.embeddings import get_collection

        get_collection().delete(ids=[str(innovation_id)])
    except Exception:
        log.exception("deleting vector of innovation %s failed", innovation_id)


async def _detach_references(db, table_name: str, row_id: int) -> dict[str, int]:
    """Sprząta wiersze wskazujące na usuwany rekord — w każdej tabeli z kluczem obcym do `table_name`.
    Treść (komentarze, zgłoszenia, oceny, przypisania) jest usuwana; zdarzenia analityczne zostają
    bez powiązania, żeby statystyki się nie zmieniły. Działa też dla tabel dodanych później (np. przez A3)."""
    from app.database import Base

    removed: dict[str, int] = {}
    for table in reversed(Base.metadata.sorted_tables):
        for column in table.columns:
            if not any(fk.column.table.name == table_name for fk in column.foreign_keys):
                continue
            if table.name == "events" and column.nullable:
                await db.execute(table.update().where(column == row_id).values({column.name: None}))
                continue
            if table.name == "forum_posts":  # najpierw odpowiedzi na usuwane wpisy
                ids = select(table.c.id).where(column == row_id).scalar_subquery()
                await db.execute(table.delete().where(table.c.parent_id.in_(ids)))
            result = await db.execute(table.delete().where(column == row_id))
            if result.rowcount:
                removed[table.name] = removed.get(table.name, 0) + result.rowcount
    return removed


@router.get("/innovations/{innovation_id}")
async def get_innovation(innovation_id: int):
    async with get_db() as db:
        innov = await db.get(Innovation, innovation_id)
    if innov is None:
        _not_found(f"innowacja {innovation_id}")
    return _ok(_innovation_full(innov))


@router.post("/innovations", status_code=status.HTTP_201_CREATED)
async def create_innovation(body: InnovationIn):
    async with get_db() as db:
        innov = Innovation(**body.model_dump(exclude={"tags"}), tags=json.dumps(body.tags, ensure_ascii=False))
        db.add(innov)
        await db.flush()
        innov.embedding_id = str(innov.id)
        await db.commit()
        await db.refresh(innov)
    embedding = await _reindex(innov)
    return _ok({**_innovation_full(innov), "embedding": embedding})


@router.put("/innovations/{innovation_id}")
async def update_innovation(innovation_id: int, body: InnovationIn):
    async with get_db() as db:
        innov = await db.get(Innovation, innovation_id)
        if innov is None:
            _not_found(f"innowacja {innovation_id}")
        for field, value in body.model_dump(exclude={"tags"}).items():
            setattr(innov, field, value)
        innov.tags = json.dumps(body.tags, ensure_ascii=False)
        innov.embedding_id = str(innov.id)
        innov.updated_at = datetime.now()
        await db.commit()
        await db.refresh(innov)
    admin_store.set_innovation_status(innovation_id, innov.status)
    embedding = await _reindex(innov)
    return _ok({**_innovation_full(innov), "embedding": embedding})


@router.delete("/innovations/{innovation_id}")
async def delete_innovation(innovation_id: int):
    async with get_db() as db:
        innov = await db.get(Innovation, innovation_id)
        if innov is None:
            _not_found(f"innowacja {innovation_id}")
        removed = await _detach_references(db, "innovations", innovation_id)
        await db.delete(innov)
        await db.commit()
    _drop_vector(innovation_id)
    return _ok({"id": innovation_id, "deleted": True, "removed": removed})


# ── Moderacja forum (zadanie 4) ──────────────────────────


@router.get("/forum")
async def list_forum_posts(limit: Annotated[int, Query(ge=1, le=500)] = 200):
    async with get_db() as db:
        posts = (await db.execute(select(ForumPost).order_by(ForumPost.created_at.desc()).limit(limit))).scalars().all()
        titles = dict((await db.execute(select(Innovation.id, Innovation.title))).all())
    return _ok([
        {
            "id": post.id,
            "parent_id": post.parent_id,
            "innovation_id": post.innovation_id,
            "innovation_title": titles.get(post.innovation_id),
            "author_name": post.author_name,
            "badge": post.badge,
            "content": post.content,
            "created_at": _iso(post.created_at),
        }
        for post in posts
    ])


@router.delete("/forum/{post_id}")
async def delete_forum_post(post_id: int):
    """Usuwa wpis razem z odpowiedziami na niego."""
    async with get_db() as db:
        post = await db.get(ForumPost, post_id)
        if post is None:
            _not_found(f"wpis forum {post_id}")
        replies = (await db.execute(ForumPost.__table__.delete().where(ForumPost.parent_id == post_id))).rowcount
        await db.delete(post)
        await db.commit()
    return _ok({"id": post_id, "deleted": True, "replies_deleted": replies})


# ── Zgłoszone potrzeby (zadanie 7) ───────────────────────
# Dane z Zasobnika wiedzy (/api/zasobnik/admin/needs i /trends). Tamte endpointy wymagają ADMIN_TOKEN, którego
# nie można trzymać w przeglądarce — panel woła te same funkcje pod swoją autoryzacją (rola admin).


@router.get("/needs")
def list_reported_needs(
    area: str | None = None,
    region: str | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
):
    from sqlmodel import Session

    from app.zasobnik.db import engine
    from app.zasobnik.routers import admin as zasobnik_admin

    with Session(engine) as session:
        needs = zasobnik_admin.list_needs(session=session, area=area, region=region, limit=limit, offset=0)
    return _ok([need.model_dump(mode="json") for need in needs])


@router.get("/needs/trends")
def reported_needs_trends(months: Annotated[int, Query(ge=1, le=36)] = 6):
    from sqlmodel import Session

    from app.zasobnik.db import engine
    from app.zasobnik.routers import admin as zasobnik_admin

    with Session(engine) as session:
        report = zasobnik_admin.trends(session=session, months=months, top=10)
    return _ok(report.model_dump(mode="json"))


# ── Użytkownicy ──────────────────────────────────────────


class SetRoleBody(BaseModel):
    role: Literal["user", "tester", "consultant"]


def _user_row(user, pending: set[int]) -> dict:
    return {"id": user.id, "name": user.name, "role": user.role, "created_at": _iso(user.created_at),
            "tester_pending": user.id in pending}


@router.get("/users")
async def list_users():
    try:
        async with get_db() as db:
            users = (await db.execute(select(User).order_by(User.id))).scalars().all()
            pending = set((await db.execute(select(Tester.user_id).where(Tester.approved.is_(False)))).scalars())
    except Exception:
        log.exception("admin users from SQLite failed, using memory store")
        return _ok(admin_store.list_users())
    return _ok([_user_row(user, pending) for user in users])


@router.post("/users/{user_id}/set-role")
async def set_role(user_id: int, body: SetRoleBody):
    async with get_db() as db:
        user = await db.get(User, user_id)
        if user is None:
            _not_found(f"użytkownik {user_id}")
        if user.role == "admin":
            raise HTTPException(status.HTTP_409_CONFLICT, "Roli administratora nie zmienia się z panelu")
        user.role = body.role
        await db.commit()
        pending = set((await db.execute(select(Tester.user_id).where(Tester.approved.is_(False)))).scalars())
        return _ok(_user_row(user, pending))


@router.delete("/users/{user_id}")
async def delete_user(user_id: int):
    """Usuwa konto razem ze zgłoszeniem testera i jego zgłoszeniami do innowacji. Konta admina nie usuwa się z panelu."""
    async with get_db() as db:
        user = await db.get(User, user_id)
        if user is None:
            _not_found(f"użytkownik {user_id}")
        if user.role == "admin":
            raise HTTPException(status.HTTP_409_CONFLICT, "Konta administratora nie usuwa się z panelu")
        removed = await _detach_references(db, "users", user_id)
        await db.delete(user)
        await db.commit()
    return _ok({"id": user_id, "deleted": True, "removed": removed})


# ── Testerzy ─────────────────────────────────────────────


def _tester_row(tester) -> dict:
    return {
        "id": tester.id,
        "user_id": tester.user_id,
        "name": tester.name,
        "email": tester.email,
        "organization": tester.organization or "",
        "expertise": tester.expertise or "",
        "approved": bool(tester.approved),
        "created_at": _iso(tester.created_at),
    }


@router.get("/testers")
async def list_testers(approved: bool | None = None):
    try:
        query = select(Tester).order_by(Tester.created_at.desc())
        if approved is not None:
            query = query.where(Tester.approved.is_(approved))
        async with get_db() as db:
            testers = (await db.execute(query)).scalars().all()
    except Exception:
        log.exception("admin testers from SQLite failed, using memory store")
        return _ok(admin_store.list_testers(approved))
    return _ok([_tester_row(tester) for tester in testers])


@router.post("/testers/{tester_id}/approve")
async def approve_tester(tester_id: int):
    """Zatwierdzenie = testers.approved=true ORAZ users.role="tester" (admin zostaje adminem)."""
    async with get_db() as db:
        tester = await db.get(Tester, tester_id)
        if tester is None:
            _not_found(f"tester {tester_id}")
        tester.approved = True
        user = await db.get(User, tester.user_id)
        if user is not None and user.role != "admin":
            user.role = "tester"
        await db.commit()
        return _ok(_tester_row(tester))


# ── Trendy i liczniki ────────────────────────────────────


@router.get("/search-trends")
async def search_trends(days: Annotated[int, Query(ge=1, le=90)] = 14):
    first_day = (datetime.now() - timedelta(days=days - 1)).date()
    try:
        async with get_db() as db:
            rows = (
                await db.execute(select(SearchLog).where(SearchLog.created_at >= datetime.combine(first_day, datetime.min.time())))
            ).scalars().all()
    except Exception:
        log.exception("admin trends from SQLite failed, using memory store")
        return _ok(admin_store.trends(days))
    logs = [
        {"query": row.query, "tags": json.loads(row.tags or "[]"), "results_count": row.results_count,
         "created_at": _iso(row.created_at) or ""}
        for row in rows
    ]
    return _ok(admin_store.summarize_trends(logs, days))


@router.get("/stats")
async def stats():
    try:
        async with get_db() as db:
            async def count(query) -> int:
                return (await db.execute(query)).scalar_one()

            by_status = dict((await db.execute(select(Innovation.status, func.count()).group_by(Innovation.status))).all())
            today = datetime.combine(datetime.now().date(), datetime.min.time())
            data = {
                "innovations": sum(by_status.values()),
                "innovations_by_status": {s: by_status.get(s, 0) for s in admin_store.INNOVATION_STATUSES},
                "users": await count(select(func.count()).select_from(User)),
                "testers": await count(select(func.count()).select_from(Tester).where(Tester.approved.is_(True))),
                "pending_testers": await count(select(func.count()).select_from(Tester).where(Tester.approved.is_(False))),
                "searches": await count(select(func.count()).select_from(SearchLog)),
                "searches_today": await count(select(func.count()).select_from(SearchLog).where(SearchLog.created_at >= today)),
            }
    except Exception:
        log.exception("admin stats from SQLite failed, using memory store")
        return _ok(admin_store.stats())
    return _ok(data)


@router.post("/demo-reset")
def demo_reset():
    """Przywraca dane startowe — przydatne przed kolejnym pokazem dla jury."""
    admin_store.reset()
    return _ok({"reset": True})


# ---------- Odświeżanie danych scrapowanych (ROPS + GUS) ----------

_refresh_task: asyncio.Task | None = None


def _refresh_status() -> dict:
    return {
        "running": data_refresh.is_running(),
        "interval_days": settings.data_refresh_interval_days,
        "due": data_refresh.due_sources(),
        "sources": data_refresh.load_state(),
    }


@router.get("/data-refresh")
def data_refresh_status():
    """Kiedy ostatnio pobrano dane ROPS i GUS, z jakim wynikiem i co czeka na odświeżenie."""
    return _ok(_refresh_status())


@router.post("/data-refresh", status_code=status.HTTP_202_ACCEPTED)
async def data_refresh_now(force: bool = True):
    """Uruchamia scrape w tle (domyślnie wszystkie źródła, ?force=false tylko te z minionym terminem)."""
    global _refresh_task
    if data_refresh.is_running():
        raise HTTPException(status.HTTP_409_CONFLICT, "Odświeżanie danych już trwa")
    _refresh_task = asyncio.create_task(data_refresh.run_refresh(force=force))
    await asyncio.sleep(0)  # task bierze lock, zanim oddamy status
    return _ok(_refresh_status())
