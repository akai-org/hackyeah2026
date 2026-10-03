import json

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
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


@router.get("/recent")
async def admin_recent(_: bool = AdminDep):
    try:
        from app.database import get_db
        from app.models import SearchLog, ForumPost, Idea
        from sqlalchemy import select
        import json as _json

        async with get_db() as db:
            search_rows = await db.execute(select(SearchLog).order_by(SearchLog.created_at.desc()).limit(5))
            searches = search_rows.scalars().all()

            forum_rows = await db.execute(select(ForumPost).order_by(ForumPost.created_at.desc()).limit(5))
            posts = forum_rows.scalars().all()

            idea_rows = await db.execute(select(Idea).order_by(Idea.created_at.desc()).limit(5))
            ideas = idea_rows.scalars().all()

        return {"data": {
            "searches": [
                {"query": s.query, "tags": _json.loads(s.tags) if s.tags else [], "created_at": s.created_at.isoformat() if s.created_at else None}
                for s in searches
            ],
            "forum_posts": [
                {"content": p.content[:80], "author_name": p.author_name, "badge": p.badge, "created_at": p.created_at.isoformat() if p.created_at else None}
                for p in posts
            ],
            "ideas": [
                {"title": i.title, "status": i.status, "created_at": i.created_at.isoformat() if i.created_at else None}
                for i in ideas
            ],
        }}
    except Exception:
        return {"data": {"searches": [], "forum_posts": [], "ideas": []}}


@router.get("/ideas")
async def admin_ideas(status: str = "", _: bool = AdminDep):
    try:
        from app.database import get_db
        from app.models import Idea, IdeaAttachment, IdeaDetails
        from sqlalchemy import select
        import json as _json

        async with get_db() as db:
            q = select(Idea).order_by(Idea.created_at.desc())
            if status:
                q = q.where(Idea.status == status)
            rows = await db.execute(q)
            ideas = rows.scalars().all()
            ids = [i.id for i in ideas]
            details = {
                d.idea_id: d
                for d in (await db.execute(select(IdeaDetails).where(IdeaDetails.idea_id.in_(ids)))).scalars()
            }
            attachments: dict[int, list] = {}
            for a in (await db.execute(
                select(IdeaAttachment).where(IdeaAttachment.idea_id.in_(ids)).order_by(IdeaAttachment.id)
            )).scalars():
                attachments.setdefault(a.idea_id, []).append(
                    {"id": a.id, "filename": a.filename, "size": a.size, "content_type": a.content_type}
                )

        def extra(idea_id: int, field: str):
            d = details.get(idea_id)
            return getattr(d, field) if d else None

        return {"data": [
            {
                "id": i.id,
                "title": i.title,
                "essence": i.essence,
                "for_whom": i.for_whom,
                "short_desc": extra(i.id, "short_desc"),
                "place": extra(i.id, "place"),
                "stage": extra(i.id, "stage"),
                "budget": extra(i.id, "budget"),
                "partners": extra(i.id, "partners"),
                "attachments": attachments.get(i.id, []),
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


@router.get("/ideas/{idea_id}/attachments/{attachment_id}")
async def download_idea_attachment(idea_id: int, attachment_id: int, _: bool = AdminDep):
    from fastapi.responses import FileResponse

    from app.database import get_db
    from app.models import IdeaAttachment
    from app.routers.ideas import uploads_dir

    async with get_db() as db:
        attachment = await db.get(IdeaAttachment, attachment_id)
    if attachment is None or attachment.idea_id != idea_id:
        raise HTTPException(status_code=404, detail="Nie znaleziono pliku")
    path = uploads_dir(idea_id) / attachment.stored_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Plik nie istnieje na dysku")
    # Zawsze jako pobranie (attachment) i bez zgadywania typu — plik od użytkownika nie otworzy się jako strona.
    return FileResponse(
        path,
        filename=attachment.filename,
        media_type="application/octet-stream",
        headers={"X-Content-Type-Options": "nosniff"},
    )


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


# ── Analityka zaangażowania: /api/admin/analytics/* ─────────────────────
# Źródła: events (wyświetlenia, kliki, Middleman), forum_posts.innovation_id (komentarze),
# test_reports (zgłoszenia testerów). Okres porównawczy = tyle samo dni wcześniej.

EVENT_METRICS = {
    "card_impression": "impressions",
    "card_click": "clicks",
    "innovation_view": "views",
    "cta_click": "cta_clicks",
    "middleman_start": "middleman_starts",
    "middleman_plan": "middleman_plans",
}
METRICS = [*EVENT_METRICS.values(), "comments", "tester_requests"]
# Lejek od otwarcia karty — wejścia bezpośrednie nie przechodzą przez wyniki, więc CTR (wynik → klik) jest osobno.
FUNNEL = [
    ("views", "Otwarta karta innowacji"),
    ("cta_clicks", "Klik w przycisk na karcie"),
    ("middleman_starts", "Start z Middlemanem"),
    ("middleman_plans", "Gotowy plan wdrożenia"),
    ("tester_requests", "Zgłoszenie testera"),
]


def _window(days: int, offset: int = 0):
    from datetime import datetime, timedelta, timezone

    # SQLite CURRENT_TIMESTAMP jest w UTC.
    until = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days * offset)
    return until - timedelta(days=days), until


async def _metric_counts(db, since, until, group: str | None = None) -> list[tuple]:
    """[(metric, group_key, count)]; group: None | "day" | "innovation"."""
    from sqlalchemy import func, select

    from app.models import Event, ForumPost, TestReport

    def grouped(model, *where):
        key = {
            None: None,
            "day": func.date(model.created_at),
            "innovation": model.innovation_id,
        }[group]
        cols = [key.label("k")] if key is not None else []
        q = select(*cols, func.count().label("n")).where(model.created_at >= since, model.created_at < until, *where)
        return q.group_by(key) if key is not None else q

    out: list[tuple] = []
    rows = await db.execute(
        grouped(Event, Event.type.in_(EVENT_METRICS)).add_columns(Event.type).group_by(Event.type)
    )
    for row in rows:
        out.append((EVENT_METRICS[row.type], row.k if group else None, row.n))
    for metric, model, where in (
        ("comments", ForumPost, [ForumPost.innovation_id.is_not(None)]),
        ("tester_requests", TestReport, []),
    ):
        for row in await db.execute(grouped(model, *where)):
            out.append((metric, row.k if group else None, row.n))
    return out


def _change_pct(now: int, before: int) -> float | None:
    if before == 0:
        return None if now == 0 else 100.0
    return round((now - before) / before * 100, 1)


@router.get("/analytics/overview")
async def analytics_overview(days: int = Query(14, ge=1, le=90), _: bool = AdminDep):
    """Liczniki z bieżącego okresu + zmiana % względem poprzedniego."""
    from sqlalchemy import distinct, func, select

    from app.database import get_db
    from app.models import Event

    async with get_db() as db:
        current = {m: 0 for m in METRICS}
        previous = {m: 0 for m in METRICS}
        for target, offset in ((current, 0), (previous, 1)):
            since, until = _window(days, offset)
            for metric, _k, n in await _metric_counts(db, since, until):
                target[metric] += n
        since, until = _window(days)
        visitors = (
            await db.execute(
                select(func.count(distinct(Event.anon_id))).where(
                    Event.created_at >= since, Event.created_at < until, Event.anon_id.is_not(None)
                )
            )
        ).scalar() or 0

    metrics = {
        m: {"value": current[m], "previous": previous[m], "change_pct": _change_pct(current[m], previous[m])}
        for m in METRICS
    }
    ctr = round(current["clicks"] / current["impressions"] * 100, 1) if current["impressions"] else None
    return {"data": {"days": days, "metrics": metrics, "ctr_pct": ctr, "unique_visitors": visitors}}


@router.get("/analytics/timeseries")
async def analytics_timeseries(days: int = Query(30, ge=1, le=90), _: bool = AdminDep):
    """[{date, views, clicks, comments, …}] — każdy dzień okresu, także z zerami (gotowe pod recharts)."""
    from datetime import timedelta

    from app.database import get_db

    since, until = _window(days)
    async with get_db() as db:
        rows = await _metric_counts(db, since, until, group="day")

    series = {}
    day = since.date() + timedelta(days=1)
    while day <= until.date():
        series[day.isoformat()] = {"date": day.isoformat(), **{m: 0 for m in METRICS}}
        day += timedelta(days=1)
    for metric, date, n in rows:
        if date in series:
            series[date][metric] += n
    return {"data": list(series.values())}


@router.get("/analytics/innovations")
async def analytics_innovations(
    days: int = Query(7, ge=1, le=90),
    sort: str = Query("views"),
    limit: int = Query(20, ge=1, le=200),
    _: bool = AdminDep,
):
    """Ranking innowacji: wyświetlenia, CTR, komentarze, Middleman, testerzy + trend vs poprzedni okres."""
    from sqlalchemy import func, select

    from app.database import get_db
    from app.models import Innovation, TestReport

    async with get_db() as db:
        stats: dict[int, dict] = {}

        def row_for(innovation_id: int) -> dict:
            return stats.setdefault(innovation_id, {m: 0 for m in METRICS} | {"views_prev": 0})

        since, until = _window(days)
        for metric, innovation_id, n in await _metric_counts(db, since, until, group="innovation"):
            if innovation_id is not None:
                row_for(innovation_id)[metric] += n
        since_prev, until_prev = _window(days, 1)
        for metric, innovation_id, n in await _metric_counts(db, since_prev, until_prev, group="innovation"):
            if metric == "views" and innovation_id is not None:
                row_for(innovation_id)["views_prev"] += n

        ids = list(stats)
        titles = dict((await db.execute(select(Innovation.id, Innovation.title).where(Innovation.id.in_(ids)))).all())
        ratings = dict(
            (
                await db.execute(
                    select(TestReport.innovation_id, func.avg(TestReport.rating))
                    .where(TestReport.innovation_id.in_(ids), TestReport.rating.is_not(None))
                    .group_by(TestReport.innovation_id)
                )
            ).all()
        )

    items = []
    for innovation_id, s in stats.items():
        items.append(
            {
                "id": innovation_id,
                "title": titles.get(innovation_id, f"Innowacja #{innovation_id}"),
                **s,
                "ctr_pct": round(s["clicks"] / s["impressions"] * 100, 1) if s["impressions"] else None,
                "trend_pct": _change_pct(s["views"], s["views_prev"]),
                "views_delta": s["views"] - s["views_prev"],
                "avg_rating": round(float(ratings[innovation_id]), 1) if innovation_id in ratings else None,
            }
        )
    sort_key = sort if sort in METRICS or sort in {"ctr_pct", "trend_pct", "views_delta"} else "views"
    items.sort(key=lambda i: (i[sort_key] is not None, i[sort_key] or 0, i["views"]), reverse=True)
    return {"data": {"days": days, "sort": sort_key, "items": items[:limit], "total": len(items)}}


@router.get("/analytics/funnel")
async def analytics_funnel(days: int = Query(30, ge=1, le=90), _: bool = AdminDep):
    """Lejek: karta → przycisk → Middleman → plan → tester. pct_of_first i pct_of_prev do opisu na wykresie."""
    from app.database import get_db

    since, until = _window(days)
    totals = {m: 0 for m in METRICS}
    async with get_db() as db:
        for metric, _k, n in await _metric_counts(db, since, until):
            totals[metric] += n

    steps, first, prev = [], None, None
    for metric, label in FUNNEL:
        value = totals[metric]
        first = value if first is None else first
        steps.append(
            {
                "step": metric,
                "label": label,
                "count": value,
                "pct_of_first": round(value / first * 100, 1) if first else None,
                "pct_of_prev": round(value / prev * 100, 1) if prev else None,
            }
        )
        prev = value
    ctr = round(totals["clicks"] / totals["impressions"] * 100, 1) if totals["impressions"] else None
    return {"data": {"days": days, "steps": steps, "impressions": totals["impressions"], "clicks": totals["clicks"], "ctr_pct": ctr}}


@router.get("/analytics/demand")
async def analytics_demand(days: int = Query(30, ge=1, le=90), _: bool = AdminDep):
    """Popyt a podaż: tagi z wyszukiwań vs liczba aktywnych innowacji z tym tagiem. gap_ratio = szukania / innowacje."""
    from sqlalchemy import select

    from app.database import get_db
    from app.models import Innovation, SearchLog

    since, until = _window(days)
    async with get_db() as db:
        logs = (await db.execute(select(SearchLog.tags).where(SearchLog.created_at >= since))).scalars().all()
        innovations = (await db.execute(select(Innovation.tags).where(Innovation.status == "active"))).scalars().all()

    def count_tags(rows) -> dict[str, int]:
        counts: dict[str, int] = {}
        for raw in rows:
            try:
                for tag in json.loads(raw or "[]"):
                    counts[tag] = counts.get(tag, 0) + 1
            except (ValueError, TypeError):
                continue
        return counts

    searches, supply = count_tags(logs), count_tags(innovations)
    items = [
        {
            "tag": tag,
            "searches": n,
            "innovations": supply.get(tag, 0),
            "gap_ratio": round(n / supply[tag], 2) if supply.get(tag) else None,
        }
        for tag, n in searches.items()
    ]
    items.sort(key=lambda i: i["searches"], reverse=True)
    return {"data": {"days": days, "items": items[:15]}}
