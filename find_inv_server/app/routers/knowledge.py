from fastapi import APIRouter, HTTPException, Query

from app import knowledge_store as store
from data import challenges as ch
from data.mock_data import MOCK_STATS_MALOPOLSKA

router = APIRouter(prefix="/api", tags=["knowledge"])


def ok(data):
    return {"data": data, "error": None}


@router.get("/innovations")
def list_innovations(
    search: str | None = None,
    tags: str | None = Query(None, description="tagi po przecinku"),
    category: str | None = None,
    area: str | None = None,
    status: str | None = None,
    cost_level: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    found = store.search_innovations(search, tag_list, category, area, status, cost_level)
    page = found[offset : offset + limit]
    return ok({"innovations": [store.public(i) for i in page], "total": len(found), "limit": limit, "offset": offset})


@router.get("/innovations/{innovation_id}")
def get_innovation(innovation_id: int):
    innov = store.get_innovation(innovation_id)
    if not innov:
        raise HTTPException(404, "Nie znaleziono innowacji")
    return ok(store.public(innov, full=True))


@router.get("/challenges")
def list_challenges(powiat: str | None = None, area: str | None = None):
    items = store.all_challenges()
    if powiat:
        items = [c for c in items if c["powiat"].lower() == powiat.lower()]
    if area:
        items = [c for c in items if c["area"].lower() == area.lower()]
    return ok({"challenges": items, "total": len(items)})


@router.get("/challenges/map")
def challenges_map():
    by_powiat: dict[str, list[dict]] = {}
    for c in store.all_challenges():
        by_powiat.setdefault(c["powiat"], []).append(c)
    return ok([
        {"powiat": p, "challenges": cs, "gap_index": store.powiat_gap(p)["gap_score"]}
        for p, cs in by_powiat.items()
    ])


@router.get("/stats/malopolska")
def stats_malopolska():
    return ok({**MOCK_STATS_MALOPOLSKA, "innovations_total": len(store.load_innovations())})


@router.get("/innovation-gap")
def innovation_gap():
    gaps = [store.powiat_gap(p) for p in ch.POWIATY]
    return ok(sorted(gaps, key=lambda g: -g["gap_score"]))


@router.get("/gmina-pulse/{powiat}")
def gmina_pulse(powiat: str):
    name = next((p for p in ch.POWIATY if p.lower() == powiat.lower()), None)
    if not name:
        raise HTTPException(404, "Nieznany powiat")
    top = sorted((c for c in store.all_challenges() if c["powiat"] == name), key=lambda c: -c["severity"])[:3]
    hints = {t for c in top for t in ch.AREAS[c["area"]][3]}
    matching = store.innovations_for_area(top[0]["area"], list(hints), limit=3)
    return ok({
        "powiat": name,
        "top_challenges": top,
        "innovations": [store.public(i) for i in matching],
        "gap": store.powiat_gap(name),
    })
