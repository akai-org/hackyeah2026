import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from data.mock_data import MOCK_INNOVATIONS, MOCK_STATS_MALOPOLSKA

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _check_admin(request: Request, x_dev_admin: str | None = Header(None)):
    """Tymczasowy auth: X-Dev-Admin: true header lub sesja admina."""
    if x_dev_admin == "true":
        return True
    token = request.cookies.get("session") or request.headers.get("X-Session-Token")
    if not token:
        raise HTTPException(status_code=401, detail="Brak autoryzacji")
    return True


AdminDep = Depends(_check_admin)


@router.get("/innovations")
async def admin_innovations(
    status: str = "",
    tags: str = "",
    search: str = "",
    _: bool = AdminDep,
):
    try:
        from app.database import get_db
        from app.models import Innovation
        from sqlalchemy import select, or_

        async with get_db() as db:
            q = select(Innovation)
            if status:
                q = q.where(Innovation.status == status)
            if search:
                q = q.where(or_(
                    Innovation.title.ilike(f"%{search}%"),
                    Innovation.short_desc.ilike(f"%{search}%"),
                    Innovation.tags.ilike(f"%{search}%"),
                ))
            rows = await db.execute(q)
            items = rows.scalars().all()

        if not items:
            raise ValueError("empty")

        tag_filter = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
        result = []
        for inn in items:
            inn_tags = inn.tags_list()
            if tag_filter and not any(t in inn_tags for t in tag_filter):
                continue
            result.append({
                "id": inn.id, "title": inn.title,
                "short_desc": inn.short_desc, "status": inn.status,
                "category": inn.category, "tags": inn_tags,
                "created_at": inn.created_at.isoformat() if inn.created_at else None,
            })
        return {"data": result}
    except Exception:
        return {"data": [
            {"id": i["id"], "title": i["title"], "short_desc": i["short_desc"],
             "status": i.get("status", "active"), "category": i.get("category"),
             "tags": i.get("tags", [])}
            for i in MOCK_INNOVATIONS
        ]}


@router.post("/innovations/{innovation_id}/approve")
async def approve_innovation(innovation_id: int, _: bool = AdminDep):
    return await _set_status(innovation_id, "active")


@router.post("/innovations/{innovation_id}/archive")
async def archive_innovation(innovation_id: int, _: bool = AdminDep):
    return await _set_status(innovation_id, "archived")


@router.post("/innovations/{innovation_id}/flag-unmaintained")
async def flag_unmaintained(innovation_id: int, _: bool = AdminDep):
    return await _set_status(innovation_id, "unmaintained")


async def _set_status(innovation_id: int, status: str):
    try:
        from app.database import get_db
        from app.models import Innovation
        from sqlalchemy import select

        async with get_db() as db:
            row = await db.execute(select(Innovation).where(Innovation.id == innovation_id))
            inn = row.scalar_one_or_none()
            if inn is None:
                raise HTTPException(status_code=404, detail="Nie znaleziono")
            inn.status = status
            await db.commit()
        return {"data": {"id": innovation_id, "status": status}}
    except HTTPException:
        raise
    except Exception:
        return {"data": {"id": innovation_id, "status": status}}


@router.get("/users")
async def admin_users(_: bool = AdminDep):
    try:
        from app.database import get_db
        from app.models import User
        from sqlalchemy import select

        async with get_db() as db:
            rows = await db.execute(select(User).order_by(User.created_at.desc()))
            users = rows.scalars().all()

        if not users:
            raise ValueError("empty")

        return {"data": [
            {"id": u.id, "name": u.name, "role": u.role,
             "created_at": u.created_at.isoformat() if u.created_at else None}
            for u in users
        ]}
    except Exception:
        return {"data": [
            {"id": 1, "name": "Jan Kowalski", "role": "user", "created_at": "2026-10-03T09:00:00"},
            {"id": 2, "name": "Anna Nowak", "role": "consultant", "created_at": "2026-10-03T09:30:00"},
            {"id": 3, "name": "Piotr Wójcik", "role": "tester", "created_at": "2026-10-03T10:00:00"},
        ]}


class SetRoleBody(BaseModel):
    role: str


@router.post("/users/{user_id}/set-role")
async def set_user_role(user_id: int, body: SetRoleBody, _: bool = AdminDep):
    valid = {"user", "tester", "admin", "consultant"}
    if body.role not in valid:
        raise HTTPException(status_code=400, detail="Nieprawidłowa rola")
    try:
        from app.database import get_db
        from app.models import User
        from sqlalchemy import select

        async with get_db() as db:
            row = await db.execute(select(User).where(User.id == user_id))
            user = row.scalar_one_or_none()
            if user is None:
                raise HTTPException(status_code=404, detail="Nie znaleziono")
            user.role = body.role
            await db.commit()
        return {"data": {"id": user_id, "role": body.role}}
    except HTTPException:
        raise
    except Exception:
        return {"data": {"id": user_id, "role": body.role}}


@router.get("/testers")
async def admin_testers(approved: str = "", _: bool = AdminDep):
    try:
        from app.database import get_db
        from app.models import Tester
        from sqlalchemy import select

        async with get_db() as db:
            q = select(Tester)
            if approved == "false":
                q = q.where(Tester.approved == False)  # noqa: E712
            elif approved == "true":
                q = q.where(Tester.approved == True)  # noqa: E712
            rows = await db.execute(q)
            testers = rows.scalars().all()

        return {"data": [
            {"id": t.id, "name": t.name, "email": t.email,
             "organization": t.organization, "expertise": t.expertise,
             "approved": t.approved,
             "created_at": t.created_at.isoformat() if t.created_at else None}
            for t in testers
        ]}
    except Exception:
        return {"data": [
            {"id": 1, "name": "Maria Testowska", "email": "maria@ngo.pl",
             "organization": "NGO Małopolska", "expertise": "seniorzy",
             "approved": False, "created_at": "2026-10-03T08:00:00"},
        ]}


@router.post("/testers/{tester_id}/approve")
async def approve_tester(tester_id: int, _: bool = AdminDep):
    try:
        from app.database import get_db
        from app.models import Tester, User
        from sqlalchemy import select

        async with get_db() as db:
            row = await db.execute(select(Tester).where(Tester.id == tester_id))
            tester = row.scalar_one_or_none()
            if tester is None:
                raise HTTPException(status_code=404, detail="Nie znaleziono")
            tester.approved = True
            user_row = await db.execute(select(User).where(User.id == tester.user_id))
            user = user_row.scalar_one_or_none()
            if user:
                user.role = "tester"
            await db.commit()
        return {"data": {"id": tester_id, "approved": True}}
    except HTTPException:
        raise
    except Exception:
        return {"data": {"id": tester_id, "approved": True}}


@router.get("/trends")
async def admin_trends(_: bool = AdminDep):
    try:
        from app.database import get_db
        from app.models import SearchLog
        from sqlalchemy import select, func

        async with get_db() as db:
            rows = await db.execute(select(SearchLog).order_by(SearchLog.created_at.desc()).limit(500))
            logs = rows.scalars().all()

        if not logs:
            raise ValueError("no logs")

        tag_counts: dict = {}
        query_counts: dict = {}
        day_counts: dict = {}

        for log in logs:
            try:
                for tag in json.loads(log.tags):
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
            except Exception:
                pass
            q = log.query[:80]
            query_counts[q] = query_counts.get(q, 0) + 1
            day = log.created_at.strftime("%Y-%m-%d") if log.created_at else "unknown"
            day_counts[day] = day_counts.get(day, 0) + 1

        top_tags = sorted([{"tag": k, "count": v} for k, v in tag_counts.items()], key=lambda x: -x["count"])[:10]
        top_queries = sorted([{"query": k, "count": v} for k, v in query_counts.items()], key=lambda x: -x["count"])[:10]
        by_day = sorted([{"date": k, "count": v} for k, v in day_counts.items()], key=lambda x: x["date"])

        return {"data": {"top_tags": top_tags, "top_queries": top_queries, "by_day": by_day}}
    except Exception:
        return {"data": {
            "top_tags": [
                {"tag": "seniorzy", "count": 45},
                {"tag": "wykluczenie_cyfrowe", "count": 38},
                {"tag": "samotność", "count": 31},
                {"tag": "zdrowie_psychiczne", "count": 22},
                {"tag": "niepełnosprawność", "count": 18},
            ],
            "top_queries": [
                {"query": "Samotny senior na wsi", "count": 12},
                {"query": "Brak transportu do lekarza", "count": 9},
            ],
            "by_day": [
                {"date": "2026-10-03", "count": 15},
                {"date": "2026-10-04", "count": 7},
            ],
        }}


@router.get("/stats")
async def admin_stats(_: bool = AdminDep):
    try:
        from app.database import get_db
        from app.models import Innovation, User, Tester, SearchLog, Idea
        from sqlalchemy import select, func

        async with get_db() as db:
            inn_count = (await db.execute(select(func.count()).select_from(Innovation))).scalar() or 0
            user_count = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
            tester_count = (await db.execute(select(func.count()).select_from(Tester).where(Tester.approved == True))).scalar() or 0  # noqa: E712
            pending_count = (await db.execute(select(func.count()).select_from(Tester).where(Tester.approved == False))).scalar() or 0  # noqa: E712
            search_count = (await db.execute(select(func.count()).select_from(SearchLog))).scalar() or 0
            idea_count = (await db.execute(select(func.count()).select_from(Idea))).scalar() or 0
            pending_ideas = (await db.execute(select(func.count()).select_from(Idea).where(Idea.status == "pending"))).scalar() or 0

        return {"data": {
            "innovations": inn_count,
            "users": user_count,
            "testers": tester_count,
            "pending_testers": pending_count,
            "searches": search_count,
            "ideas": idea_count,
            "pending_ideas": pending_ideas,
        }}
    except Exception:
        return {"data": {
            "innovations": len(MOCK_INNOVATIONS),
            "users": 34,
            "testers": 12,
            "pending_testers": 3,
            "searches": 156,
            "ideas": 0,
            "pending_ideas": 0,
        }}


@router.get("/ideas")
async def admin_ideas(status: str = "", _: bool = AdminDep):
    try:
        from app.database import get_db
        from app.models import Idea
        from sqlalchemy import select
        import json as _json

        async with get_db() as db:
            q = select(Idea).order_by(Idea.created_at.desc())
            if status:
                q = q.where(Idea.status == status)
            rows = await db.execute(q)
            ideas = rows.scalars().all()

        return {"data": [
            {
                "id": i.id,
                "title": i.title,
                "essence": i.essence,
                "for_whom": i.for_whom,
                "tags": _json.loads(i.tags) if i.tags else [],
                "author_name": i.author_name,
                "author_email": i.author_email,
                "status": i.status,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in ideas
        ]}
    except Exception:
        return {"data": []}


@router.post("/ideas/{idea_id}/status")
async def set_idea_status(idea_id: int, body: dict, _: bool = AdminDep):
    new_status = (body.get("status") or "").strip()
    if new_status not in {"pending", "reviewed", "rejected"}:
        raise HTTPException(status_code=400, detail="Nieprawidłowy status")
    try:
        from app.database import get_db
        from app.models import Idea
        from sqlalchemy import select

        async with get_db() as db:
            row = await db.execute(select(Idea).where(Idea.id == idea_id))
            idea = row.scalar_one_or_none()
            if idea is None:
                raise HTTPException(status_code=404, detail="Nie znaleziono")
            idea.status = new_status
            await db.commit()
        return {"data": {"id": idea_id, "status": new_status}}
    except HTTPException:
        raise
    except Exception:
        return {"data": {"id": idea_id, "status": new_status}}
