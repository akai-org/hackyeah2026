"""Endpointy administratora: szybka aktualizacja treści oraz dane o potrzebach.

Wszystkie wymagają nagłówka X-Admin-Token (wartość ADMIN_TOKEN z .env).
Ścieżki /api/zasobnik/admin/*, żeby nie kolidować z panelem admina rdzenia (/api/admin/*).
"""

from collections import Counter
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func
from sqlmodel import Session, select

from app.zasobnik.auth import require_admin
from app.zasobnik.db import get_session
from app.zasobnik.models import (
    Area,
    AreaCreate,
    AreaRead,
    AreaTrend,
    AreaUpdate,
    CountItem,
    ImportResult,
    MonthPoint,
    Need,
    NeedRead,
    NeedUpdate,
    Resource,
    ResourceCreate,
    ResourcePage,
    ResourceRead,
    ResourceType,
    ResourceUpdate,
    SearchLog,
    TrendsReport,
    utcnow,
)
from app.zasobnik.services import (
    area_by_slug,
    create_resource,
    need_read,
    resource_read,
    update_resource,
)

router = APIRouter(prefix="/zasobnik/admin", tags=["zasobnik-admin"], dependencies=[Depends(require_admin)])

SessionDep = Annotated[Session, Depends(get_session)]


# ---------- obszary ----------


@router.post("/areas", status_code=status.HTTP_201_CREATED)
def create_area(data: AreaCreate, session: SessionDep) -> AreaRead:
    if session.exec(select(Area).where(Area.slug == data.slug)).first():
        raise HTTPException(status.HTTP_409_CONFLICT, f"Obszar '{data.slug}' już istnieje")
    area = Area.model_validate(data)
    session.add(area)
    session.commit()
    session.refresh(area)
    return AreaRead.model_validate(area)


@router.patch("/areas/{slug}")
def update_area(slug: str, data: AreaUpdate, session: SessionDep) -> AreaRead:
    area = area_by_slug(session, slug)
    area.sqlmodel_update(data.model_dump(exclude_unset=True))
    session.add(area)
    session.commit()
    session.refresh(area)
    return AreaRead.model_validate(area)


@router.delete("/areas/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_area(slug: str, session: SessionDep) -> Response:
    area = area_by_slug(session, slug)
    # Potrzeby i wyszukiwania zostają w statystykach, tylko tracą obszar.
    for need in session.exec(select(Need).where(Need.area_id == area.id)):
        need.area_id = None
        session.add(need)
    for log in session.exec(select(SearchLog).where(SearchLog.area_id == area.id)):
        log.area_id = None
        session.add(log)
    session.delete(area)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- zasoby ----------


@router.get("/resources")
def list_all_resources(
    session: SessionDep,
    type: ResourceType | None = None,
    published: bool | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ResourcePage:
    """Wszystkie zasoby, także nieopublikowane (szkice)."""
    stmt = select(Resource)
    if type:
        stmt = stmt.where(Resource.type == type)
    if published is not None:
        stmt = stmt.where(Resource.published == published)
    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    items = session.exec(stmt.order_by(Resource.updated_at.desc()).offset(offset).limit(limit)).all()
    return ResourcePage(items=[resource_read(r) for r in items], total=total)


@router.post("/resources", status_code=status.HTTP_201_CREATED)
def add_resource(data: ResourceCreate, session: SessionDep) -> ResourceRead:
    resource = create_resource(session, data)
    session.commit()
    session.refresh(resource)
    return resource_read(resource)


@router.patch("/resources/{resource_id}")
def edit_resource(resource_id: int, data: ResourceUpdate, session: SessionDep) -> ResourceRead:
    """Zmiana tylko podanych pól – np. {"published": false} ukrywa zasób."""
    resource = session.get(Resource, resource_id)
    if resource is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nie ma takiego zasobu")
    update_resource(session, resource, data)
    session.commit()
    session.refresh(resource)
    return resource_read(resource)


@router.delete("/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(resource_id: int, session: SessionDep) -> Response:
    resource = session.get(Resource, resource_id)
    if resource is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nie ma takiego zasobu")
    session.delete(resource)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/resources/import")
def import_resources(items: list[ResourceCreate], session: SessionDep) -> ImportResult:
    """Hurtowe wgranie/aktualizacja zasobów (np. z arkusza lub scrapera).

    Zasób o tym samym typie i tytule jest aktualizowany, nowy – dodawany.
    Całość w jednej transakcji: błąd w jednym elemencie nie zapisuje niczego.
    """
    created = updated = 0
    for data in items:
        existing = session.exec(
            select(Resource).where(Resource.type == data.type, Resource.title == data.title)
        ).first()
        if existing:
            update_resource(session, existing, data)
            updated += 1
        else:
            create_resource(session, data)
            created += 1
        session.flush()
    session.commit()
    return ImportResult(created=created, updated=updated)


# ---------- potrzeby i trendy ----------


@router.get("/needs")
def list_needs(
    session: SessionDep,
    area: Annotated[str | None, Query(description="slug obszaru albo 'none' dla nieprzypisanych")] = None,
    region: str | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[NeedRead]:
    stmt = select(Need, Area).join(Area, isouter=True)
    if area == "none":
        stmt = stmt.where(Need.area_id.is_(None))
    elif area:
        stmt = stmt.where(Need.area_id == area_by_slug(session, area).id)
    if region:
        stmt = stmt.where(Need.region.ilike(region))
    rows = session.exec(stmt.order_by(Need.created_at.desc()).offset(offset).limit(limit)).all()
    return [need_read(need, area_obj) for need, area_obj in rows]


@router.patch("/needs/{need_id}")
def categorize_need(need_id: int, data: NeedUpdate, session: SessionDep) -> NeedRead:
    """Przypisanie zgłoszenia do obszaru (lub odpięcie: area_slug = null)."""
    need = session.get(Need, need_id)
    if need is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nie ma takiego zgłoszenia")
    area = area_by_slug(session, data.area_slug) if data.area_slug else None
    need.area_id = area.id if area else None
    session.add(need)
    session.commit()
    session.refresh(need)
    return need_read(need, area)


def _months_back(until: datetime, months: int) -> list[str]:
    year, month = until.year, until.month
    keys = []
    for _ in range(months):
        keys.append(f"{year:04d}-{month:02d}")
        year, month = (year, month - 1) if month > 1 else (year - 1, 12)
    return keys[::-1]


def _trend(last: int, prev: int) -> tuple[str, float | None]:
    if prev == 0:
        return ("new" if last else "flat"), None
    change = round((last - prev) / prev * 100, 1)
    if change > 10:
        return "up", change
    if change < -10:
        return "down", change
    return "flat", change


@router.get("/trends")
def trends(
    session: SessionDep,
    months: Annotated[int, Query(ge=1, le=36, description="ile ostatnich miesięcy analizować")] = 6,
    top: Annotated[int, Query(ge=1, le=100)] = 10,
) -> TrendsReport:
    """Agregacja potrzeb i wyszukiwań per obszar, miesiąc i region, z trendem 30 dni vs poprzednie 30."""
    until = utcnow()
    month_keys = _months_back(until, months)
    since = until.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(months - 1):
        since = (since - timedelta(days=1)).replace(day=1)
    last_30 = until - timedelta(days=30)
    prev_30 = until - timedelta(days=60)

    needs = session.exec(select(Need).where(Need.created_at >= min(since, prev_30))).all()
    searches = session.exec(select(SearchLog).where(SearchLog.created_at >= since)).all()
    areas = session.exec(select(Area)).all()

    views: Counter[int] = Counter()
    for resource in session.exec(select(Resource)).all():
        for a in resource.areas:
            views[a.id] += resource.views

    def area_trend(area: Area | None) -> AreaTrend:
        area_id = area.id if area else None
        own_needs = [n for n in needs if n.area_id == area_id]
        in_period = [n for n in own_needs if n.created_at >= since]
        own_searches = [s for s in searches if s.area_id == area_id] if area else []
        last = sum(1 for n in own_needs if n.created_at >= last_30)
        prev = sum(1 for n in own_needs if prev_30 <= n.created_at < last_30)
        trend, change = _trend(last, prev)
        need_months = Counter(n.created_at.strftime("%Y-%m") for n in in_period)
        search_months = Counter(s.created_at.strftime("%Y-%m") for s in own_searches)
        return AreaTrend(
            area=AreaRead.model_validate(area) if area else None,
            needs=len(in_period),
            searches=len(own_searches),
            resource_views=views[area_id] if area else 0,
            needs_last_30d=last,
            needs_prev_30d=prev,
            change_pct=change,
            trend=trend,
            monthly=[MonthPoint(month=m, needs=need_months[m], searches=search_months[m]) for m in month_keys],
        )

    area_trends = sorted((area_trend(a) for a in areas), key=lambda t: (-t.needs_last_30d, -t.needs))
    unassigned = area_trend(None)
    if unassigned.needs or unassigned.needs_last_30d:
        area_trends.append(unassigned)

    period_needs = [n for n in needs if n.created_at >= since]

    def counts(counter: Counter[str]) -> list[CountItem]:
        return [CountItem(key=k, count=c) for k, c in counter.most_common(top)]

    return TrendsReport(
        since=since,
        until=until,
        total_needs=len(period_needs),
        total_searches=len(searches),
        areas=area_trends,
        by_region=counts(Counter((n.region or "nie podano").strip() for n in period_needs)),
        by_reporter_type=counts(Counter(n.reporter_type.value for n in period_needs)),
        top_queries=counts(Counter(s.query for s in searches)),
        zero_result_queries=counts(Counter(s.query for s in searches if s.results == 0)),
    )
