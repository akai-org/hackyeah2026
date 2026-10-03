from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, cast, func, or_
from sqlmodel import Session, select

from app.zasobnik.db import get_session
from app.zasobnik.models import (
    Resource,
    ResourceAreaLink,
    ResourcePage,
    ResourceRead,
    ResourceType,
    SearchLog,
)
from app.zasobnik.services import area_by_slug, resource_read

router = APIRouter(prefix="/resources", tags=["zasoby"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("")
def list_resources(
    session: SessionDep,
    type: ResourceType | None = None,
    area: Annotated[str | None, Query(description="slug obszaru")] = None,
    q: Annotated[str | None, Query(max_length=200, description="szukana fraza")] = None,
    tag: str | None = None,
    region: str | None = None,
    sort: Literal["newest", "popular"] = "newest",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ResourcePage:
    """Przeglądanie i wyszukiwanie zasobów. Każde wyszukiwanie (q) jest zapisywane do analizy potrzeb."""
    stmt = select(Resource).where(Resource.published)
    area_obj = None
    if type:
        stmt = stmt.where(Resource.type == type)
    if area:
        area_obj = area_by_slug(session, area)
        stmt = stmt.where(
            Resource.id.in_(
                select(ResourceAreaLink.resource_id).where(ResourceAreaLink.area_id == area_obj.id)
            )
        )
    if region:
        # Zasoby bez regionu dotyczą całej Małopolski, więc też pasują.
        stmt = stmt.where(or_(Resource.region.is_(None), Resource.region.ilike(region)))
    if tag:
        stmt = stmt.where(cast(Resource.tags, String).ilike(f'%"{tag}"%'))
    query = q.strip() if q else ""
    if query:
        pattern = f"%{query}%"
        stmt = stmt.where(
            or_(
                Resource.title.ilike(pattern),
                Resource.summary.ilike(pattern),
                Resource.content.ilike(pattern),
                cast(Resource.tags, String).ilike(pattern),
            )
        )

    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    order = Resource.views.desc() if sort == "popular" else Resource.updated_at.desc()
    items = session.exec(stmt.order_by(order, Resource.id.desc()).offset(offset).limit(limit)).all()

    if query and offset == 0:
        session.add(SearchLog(query=query.lower(), area_id=area_obj.id if area_obj else None, results=total))
        session.commit()

    return ResourcePage(items=[resource_read(r) for r in items], total=total)


@router.get("/{resource_id}")
def get_resource(resource_id: int, session: SessionDep) -> ResourceRead:
    resource = session.get(Resource, resource_id)
    if resource is None or not resource.published:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nie ma takiego zasobu")
    resource.views += 1
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource_read(resource)
