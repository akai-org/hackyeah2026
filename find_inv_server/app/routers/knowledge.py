import json
import uuid
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import and_, func, or_, select

from app import knowledge_store as store
from app.database import get_db
from app.models import Innovation
from data import challenges as ch

router = APIRouter(prefix="/api", tags=["knowledge"])

# Pola spoza tabeli innovations, które dokładamy do karty szczegółów z parsed_innovations.json.
EXTRA_FIELDS = ("video_url", "materials_url", "who_can_use", "authors", "project", "categories")


def _row(inn: Innovation, *, full: bool = False) -> dict:
    out = {
        "id": inn.id,
        "title": inn.title,
        "short_desc": inn.short_desc,
        "category": inn.category,
        "area": inn.area,
        "target_group": inn.target_group,
        "location": inn.location,
        "status": inn.status,
        "cost_level": inn.cost_level,
        "testers_count": inn.testers_count,
        "where_implemented": inn.where_implemented,
        "source_url": inn.source_url,
        "tags": inn.tags_list(),
        "is_unmaintained": inn.status == "unmaintained",
    }
    if full:
        out["full_desc"] = inn.full_desc
        out["implementation_time_months"] = inn.implementation_time_months
        extra = next((i for i in store.load_innovations() if i.get("source_url") == inn.source_url), None)
        if extra:
            out.update({k: extra.get(k) for k in EXTRA_FIELDS})
    return out


@router.get("/innovations")
async def list_innovations(
    search: str = "",
    tags: str = "",
    category: str = "",
    area: str = "",
    status: str = "",
    cost_level: str = "",
    tags_mode: Literal["any", "all"] = Query("any", description="any: dowolny z tagów, all: wszystkie tagi"),
    include_archived: bool = True,
    limit: int = 20,
    offset: int = 0,
):
    tag_filter = [t.strip() for t in tags.split(",") if t.strip()]
    try:
        async with get_db() as db:
            q = select(Innovation).order_by(Innovation.id)
            if search:
                q = q.where(or_(
                    Innovation.title.ilike(f"%{search}%"),
                    Innovation.short_desc.ilike(f"%{search}%"),
                    Innovation.full_desc.ilike(f"%{search}%"),
                    Innovation.tags.ilike(f"%{search}%"),
                ))
            if status:
                q = q.where(Innovation.status == status)
            if not include_archived:
                q = q.where(Innovation.status != "archived")
            if cost_level:
                q = q.where(Innovation.cost_level == cost_level)
            if category:
                q = q.where(Innovation.category.ilike(f"%{category}%"))
            if area:
                q = q.where(Innovation.area.ilike(f"%{area}%"))
            if tag_filter:
                # tagi trzymane jako JSON string – dopasowanie z cudzysłowami, żeby "OPS" nie trafiał w "DOPS"
                conditions = [Innovation.tags.ilike(f'%"{t}"%') for t in tag_filter]
                q = q.where(and_(*conditions) if tags_mode == "all" else or_(*conditions))
            items = (await db.execute(q.offset(offset).limit(limit))).scalars().all()
            # total z tymi samymi filtrami, bez limit/offset — frontend potrzebuje go do „Pokaż więcej”.
            total = (await db.execute(select(func.count()).select_from(q.order_by(None).subquery()))).scalar_one()
            has_data = items or (await db.execute(select(Innovation.id).limit(1))).first()
        if has_data:
            return {"data": _page([_row(i) for i in items], total, limit, offset)}
    except Exception:
        pass

    # Fallback bez bazy: te same 114 innowacji ROPS z parsed_innovations.json
    found = store.search_innovations(
        search or None, tag_filter or None, category or None, area or None, status or None, cost_level or None
    )
    if tag_filter and tags_mode == "all":
        found = [i for i in found if set(tag_filter) <= set(i.get("tags", []))]
    if not include_archived:
        found = [i for i in found if i.get("status") != "archived"]
    return {"data": _page([store.public(i) for i in found[offset : offset + limit]], len(found), limit, offset)}


def _page(innovations: list[dict], total: int, limit: int, offset: int) -> dict:
    """Strona wyników z łączną liczbą trafień — bez `total` lista nie wie, że jest coś poza pierwszą stroną."""
    return {"innovations": innovations, "total": total, "limit": limit, "offset": offset}


@router.get("/innovations/{innovation_id}")
async def get_innovation(innovation_id: int):
    try:
        async with get_db() as db:
            inn = (await db.execute(select(Innovation).where(Innovation.id == innovation_id))).scalar_one_or_none()
            any_rows = inn is not None or (await db.execute(select(Innovation.id).limit(1))).first()
        if inn is not None:
            return {"data": _row(inn, full=True)}
        if any_rows:
            raise HTTPException(status_code=404, detail="Innowacja nie znaleziona")
    except HTTPException:
        raise
    except Exception:
        pass

    item = store.get_innovation(innovation_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Innowacja nie znaleziona")
    return {"data": store.public(item, full=True)}


@router.get("/challenges")
async def list_challenges(powiat: str = "", area: str = ""):
    items = store.all_challenges()
    if powiat:
        items = [c for c in items if c["powiat"].lower() == powiat.lower()]
    if area:
        items = [c for c in items if area.lower() in c["area"].lower()]
    return {"data": items}


@router.get("/challenges/map")
async def challenges_map():
    by_powiat: dict[str, list[dict]] = {}
    for c in store.all_challenges():
        by_powiat.setdefault(c["powiat"], []).append(c)
    return {"data": [
        {"powiat": p, "challenges": cs, "gap_index": store.powiat_gap(p)}
        for p, cs in by_powiat.items()
    ]}


def _pl(num: float, digits: int = 1) -> str:
    return f"{num:.{digits}f}".replace(".", ",")


@router.get("/stats/malopolska")
async def stats_malopolska():
    reg = ch.GUS["region"]
    aging, aid, unemp, disabled = (reg[k] for k in ("pct_65_plus", "social_aid_per_10k", "unemployment_rate", "disabled_2011"))
    return {"data": {
        "aging_pct": aging["value"],
        "poverty_per_10k": aid["value"],
        "unemployment_pct": unemp["value"],
        "disability_count": disabled["value"],
        "source_year": aging["year"],
        "source": ch.SOURCE,
        "innovations_total": len(store.load_innovations()),
        # gotowe kafelki dla strony głównej – każdy z własnym rokiem danych
        "indicators": [
            {"value": f"{_pl(aging['value'])}%", "label": "mieszkańców ma 65 lat lub więcej", "source": f"GUS {aging['year']}"},
            {"value": str(aid["value"]), "label": "na 10 tys. osób korzysta z pomocy społecznej", "source": f"GUS {aid['year']}"},
            {"value": f"{_pl(unemp['value'])}%", "label": "stopa bezrobocia rejestrowanego", "source": f"GUS {unemp['year']}"},
            {"value": f"{disabled['value'] / 1000:.0f} tys.", "label": "osób z niepełnosprawnością", "source": f"GUS, spis {disabled['year']}"},
        ],
    }}


@router.get("/gmina-pulse/{powiat}")
async def gmina_pulse(powiat: str):
    name = next((p for p in ch.POWIATY if p.lower() == powiat.lower()), None)
    if not name:
        raise HTTPException(status_code=404, detail="Nieznany powiat")
    top = sorted((c for c in store.all_challenges() if c["powiat"] == name), key=lambda c: -c["severity"])[:3]
    hints = list(dict.fromkeys(t for c in top for t in ch.AREAS[c["area"]]["tags"]))
    matching = store.innovations_for_area(hints, limit=3)
    return {"data": {
        "powiat": name,
        "top_challenges": top,
        "matching_innovations": [store.public(i) for i in matching],
        "gap": store.powiat_gap(name),
    }}


@router.get("/innovation-gap")
async def innovation_gap():
    gaps = [store.powiat_gap(p) for p in ch.POWIATY]
    return {"data": sorted(gaps, key=lambda g: -g["gap_score"])}


@router.post("/ideas")
async def submit_idea(body: dict):
    title = (body.get("title") or "").strip()
    essence = (body.get("essence") or "").strip()
    if not title or not essence:
        raise HTTPException(status_code=400, detail="Tytuł i opis są wymagane")

    try:
        from app.database import get_db
        from app.models import Idea

        async with get_db() as db:
            idea = Idea(
                title=title,
                essence=essence,
                for_whom=(body.get("for_whom") or "").strip() or None,
                tags=json.dumps(body.get("tags") or [], ensure_ascii=False),
                author_name=(body.get("author_name") or "").strip() or None,
                author_email=(body.get("author_email") or "").strip() or None,
                status="pending",
            )
            db.add(idea)
            await db.commit()
            await db.refresh(idea)

        return {"data": {"id": idea.id, "message": "Pomysł przyjęty — dziękujemy!"}}
    except HTTPException:
        raise
    except Exception:
        return {"data": {"id": None, "message": "Pomysł przyjęty (demo)"}}


@router.get("/forum")
async def list_forum_posts():
    try:
        from app.database import get_db
        from app.models import ForumPost
        from sqlalchemy import select

        async with get_db() as db:
            rows = await db.execute(select(ForumPost).order_by(ForumPost.created_at.asc()))
            posts = rows.scalars().all()

        return {"data": [
            {
                "id": p.id,
                "parentId": p.parent_id,
                "content": p.content,
                "authorName": p.author_name,
                "badge": p.badge,
                "createdAt": p.created_at.isoformat() if p.created_at else None,
            }
            for p in posts
        ]}
    except Exception:
        from data.mock_data import MOCK_FORUM_POSTS
        return {"data": MOCK_FORUM_POSTS}


@router.post("/forum")
async def create_forum_post(body: dict):
    content = (body.get("content") or "").strip()
    if not content or len(content) > 2000:
        raise HTTPException(status_code=400, detail="Treść jest wymagana (max 2000 znaków)")

    author_name = (body.get("authorName") or "Gość").strip()[:128]
    badge = body.get("badge", "user")
    if badge not in {"user", "tester", "admin", "consultant"}:
        badge = "user"
    parent_id = body.get("parentId") or None

    try:
        from app.database import get_db
        from app.models import ForumPost

        async with get_db() as db:
            post = ForumPost(
                parent_id=parent_id,
                content=content,
                author_name=author_name,
                badge=badge,
            )
            db.add(post)
            await db.commit()
            await db.refresh(post)

        return {"data": {
            "id": post.id,
            "parentId": post.parent_id,
            "content": post.content,
            "authorName": post.author_name,
            "badge": post.badge,
            "createdAt": post.created_at.isoformat() if post.created_at else None,
        }}
    except HTTPException:
        raise
    except Exception:
        import time
        return {"data": {
            "id": int(time.time() * 1000),
            "parentId": parent_id,
            "content": content,
            "authorName": author_name,
            "badge": badge,
            "createdAt": None,
        }}


@router.post("/testerzy")
async def apply_as_tester(body: dict):
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip()
    organization = (body.get("organization") or "").strip() or None
    expertise = (body.get("expertise") or "").strip() or None

    if not name or not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Imię i adres e-mail są wymagane")

    try:
        from app.database import get_db
        from app.models import User, Tester

        async with get_db() as db:
            user = User(name=name, role="tester", session_token=str(uuid.uuid4()))
            db.add(user)
            await db.flush()

            tester = Tester(
                user_id=user.id,
                name=name,
                email=email,
                organization=organization,
                expertise=expertise,
                approved=False,
            )
            db.add(tester)
            await db.commit()
            tester_id = tester.id

        return {"data": {"id": tester_id, "message": "Zgłoszenie przyjęte"}}
    except HTTPException:
        raise
    except Exception:
        return {"data": {"id": None, "message": "Zgłoszenie przyjęte (demo)"}}
