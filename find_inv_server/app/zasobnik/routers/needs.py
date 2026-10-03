from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.zasobnik.db import get_session
from app.zasobnik.models import Need, NeedCreate, NeedRead
from app.zasobnik.services import area_by_slug, need_read

router = APIRouter(prefix="/needs", tags=["potrzeby"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.post("", status_code=status.HTTP_201_CREATED)
def report_need(data: NeedCreate, session: SessionDep) -> NeedRead:
    """Zgłoszenie potrzeby przez użytkownika. Zgłoszenia są widoczne tylko dla administratora."""
    area = area_by_slug(session, data.area_slug) if data.area_slug else None
    need = Need.model_validate(data.model_dump(exclude={"area_slug"}), update={"area_id": area.id if area else None})
    session.add(need)
    session.commit()
    session.refresh(need)
    return need_read(need, area)
