from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, select

from app.db import get_session
from app.models import (
    Area,
    AreaDetail,
    AreaRead,
    AreaSummary,
    Resource,
    ResourceAreaLink,
    ResourceType,
)
from app.services import area_by_slug, resource_read

router = APIRouter(prefix="/areas", tags=["obszary"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("")
def list_areas(session: SessionDep) -> list[AreaSummary]:
    """Lista kwestii społecznych z liczbą opublikowanych zasobów każdego typu."""
    rows = session.exec(
        select(ResourceAreaLink.area_id, Resource.type, func.count())
        .join(Resource, Resource.id == ResourceAreaLink.resource_id)
        .where(Resource.published)
        .group_by(ResourceAreaLink.area_id, Resource.type)
    ).all()
    counts: dict[int, dict[ResourceType, int]] = {}
    for area_id, rtype, n in rows:
        counts.setdefault(area_id, {})[rtype] = n

    areas = session.exec(select(Area).order_by(Area.name)).all()
    return [
        AreaSummary.model_validate(
            area, update={"counts": {t: counts.get(area.id, {}).get(t, 0) for t in ResourceType}}
        )
        for area in areas
    ]


@router.get("/{slug}")
def get_area(slug: str, session: SessionDep) -> AreaDetail:
    """Wszystko o danej kwestii: wyzwania, sprawdzone innowacje i materiały edukacyjne."""
    area = area_by_slug(session, slug)
    resources = sorted(
        (r for r in area.resources if r.published), key=lambda r: r.updated_at, reverse=True
    )
    by_type = {t: [resource_read(r) for r in resources if r.type == t] for t in ResourceType}

    # Obszary powiązane = te, które dzielą zasoby z bieżącym.
    related: dict[int, Area] = {}
    for r in resources:
        for a in r.areas:
            if a.id != area.id:
                related[a.id] = a

    return AreaDetail.model_validate(
        area,
        update={
            "challenges": by_type[ResourceType.challenge],
            "innovations": by_type[ResourceType.innovation],
            "education": by_type[ResourceType.education],
            "related_areas": [AreaRead.model_validate(a) for a in related.values()],
        },
    )
