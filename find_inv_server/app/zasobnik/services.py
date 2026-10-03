"""Logika wspólna dla routerów publicznych i administracyjnych."""

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.zasobnik.models import (
    Area,
    AreaRead,
    Need,
    NeedRead,
    Resource,
    ResourceCreate,
    ResourceRead,
    ResourceUpdate,
    utcnow,
)


def area_by_slug(session: Session, slug: str) -> Area:
    area = session.exec(select(Area).where(Area.slug == slug)).first()
    if area is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Nie ma obszaru '{slug}'")
    return area


def areas_by_slugs(session: Session, slugs: list[str]) -> list[Area]:
    if not slugs:
        return []
    areas = session.exec(select(Area).where(Area.slug.in_(slugs))).all()
    missing = set(slugs) - {a.slug for a in areas}
    if missing:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, f"Nieznane obszary: {', '.join(sorted(missing))}"
        )
    return list(areas)


def resource_read(resource: Resource) -> ResourceRead:
    return ResourceRead.model_validate(
        resource, update={"areas": [AreaRead.model_validate(a) for a in resource.areas]}
    )


def need_read(need: Need, area: Area | None) -> NeedRead:
    return NeedRead.model_validate(need, update={"area": AreaRead.model_validate(area) if area else None})


def create_resource(session: Session, data: ResourceCreate) -> Resource:
    resource = Resource.model_validate(data.model_dump(exclude={"area_slugs"}))
    resource.areas = areas_by_slugs(session, data.area_slugs)
    session.add(resource)
    return resource


def update_resource(session: Session, resource: Resource, data: ResourceUpdate | ResourceCreate) -> None:
    changes = data.model_dump(exclude_unset=True)
    area_slugs = changes.pop("area_slugs", None)
    for field, value in changes.items():
        setattr(resource, field, value)
    if area_slugs is not None:
        resource.areas = areas_by_slugs(session, area_slugs)
    resource.updated_at = utcnow()
    session.add(resource)
