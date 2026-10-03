import uuid

from fastapi import APIRouter, HTTPException

from data.mock_data import (
    MOCK_CHALLENGES,
    MOCK_GAP_INDEX,
    MOCK_INNOVATIONS,
    MOCK_STATS_MALOPOLSKA,
)

router = APIRouter(prefix="/api", tags=["knowledge"])


@router.get("/innovations")
async def list_innovations(
    search: str = "",
    tags: str = "",
    category: str = "",
    area: str = "",
    status: str = "",
    limit: int = 20,
    offset: int = 0,
):
    try:
        from app.database import get_db
        from app.models import Innovation
        from sqlalchemy import select, or_

        async with get_db() as db:
            q = select(Innovation)
            if search:
                q = q.where(
                    or_(
                        Innovation.title.ilike(f"%{search}%"),
                        Innovation.short_desc.ilike(f"%{search}%"),
                    )
                )
            if status:
                q = q.where(Innovation.status == status)
            if category:
                q = q.where(Innovation.category.ilike(f"%{category}%"))
            if area:
                q = q.where(Innovation.area.ilike(f"%{area}%"))
            q = q.offset(offset).limit(limit)
            rows = await db.execute(q)
            items = rows.scalars().all()

        if not items:
            raise ValueError("empty DB")

        tag_filter = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

        result = []
        for inn in items:
            inn_tags = inn.tags_list()
            if tag_filter and not any(t in inn_tags for t in tag_filter):
                continue
            result.append({
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
                "tags": inn_tags,
                "is_unmaintained": inn.status == "unmaintained",
            })
        return {"data": result}

    except Exception:
        return {"data": MOCK_INNOVATIONS}


@router.get("/innovations/{innovation_id}")
async def get_innovation(innovation_id: int):
    try:
        from app.database import get_db
        from app.models import Innovation
        from sqlalchemy import select
        from fastapi import HTTPException

        async with get_db() as db:
            row = await db.execute(select(Innovation).where(Innovation.id == innovation_id))
            inn = row.scalar_one_or_none()

        if inn is None:
            raise HTTPException(status_code=404, detail="Innowacja nie znaleziona")

        return {"data": {
            "id": inn.id,
            "title": inn.title,
            "short_desc": inn.short_desc,
            "full_desc": inn.full_desc,
            "category": inn.category,
            "area": inn.area,
            "target_group": inn.target_group,
            "location": inn.location,
            "status": inn.status,
            "cost_level": inn.cost_level,
            "implementation_time_months": inn.implementation_time_months,
            "testers_count": inn.testers_count,
            "where_implemented": inn.where_implemented,
            "source_url": inn.source_url,
            "tags": inn.tags_list(),
            "is_unmaintained": inn.status == "unmaintained",
        }}
    except Exception as e:
        if "404" in str(e):
            raise
        item = next((i for i in MOCK_INNOVATIONS if i["id"] == innovation_id), None)
        if item is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Innowacja nie znaleziona")
        return {"data": item}


@router.get("/challenges")
async def list_challenges(powiat: str = "", area: str = ""):
    items = MOCK_CHALLENGES
    if powiat:
        items = [c for c in items if c.get("powiat", "") == powiat]
    if area:
        items = [c for c in items if area.lower() in c.get("area", "").lower()]
    return {"data": items}


@router.get("/challenges/map")
async def challenges_map():
    powiats: dict = {}
    for c in MOCK_CHALLENGES:
        p = c.get("powiat", "nieznany")
        if p not in powiats:
            gap = next((g for g in MOCK_GAP_INDEX if g["powiat"] == p), None)
            powiats[p] = {"powiat": p, "challenges": [], "gap_index": gap}
        powiats[p]["challenges"].append(c)
    return {"data": list(powiats.values())}


@router.get("/stats/malopolska")
async def stats_malopolska():
    return {"data": MOCK_STATS_MALOPOLSKA}


@router.get("/gmina-pulse/{powiat}")
async def gmina_pulse(powiat: str):
    challenges = [c for c in MOCK_CHALLENGES if c.get("powiat") == powiat][:3]
    innovations = MOCK_INNOVATIONS[:3]
    return {"data": {"powiat": powiat, "top_challenges": challenges, "matching_innovations": innovations}}


@router.get("/innovation-gap")
async def innovation_gap():
    return {"data": MOCK_GAP_INDEX}


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
