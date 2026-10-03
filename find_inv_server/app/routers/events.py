"""POST /api/events — zdarzenia z frontendu (wyświetlenia kart, kliknięcia). Fire-and-forget, zawsze 204."""

from fastapi import APIRouter, BackgroundTasks, Depends, Response
from pydantic import BaseModel, Field

from app.analytics import CARD_SOURCES, CLIENT_EVENT_TYPES, CTA_BUTTONS, log_event
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/api", tags=["events"])


class EventBody(BaseModel):
    type: str
    innovation_id: int | None = None
    anon_id: str | None = Field(default=None, max_length=64)
    meta: dict = Field(default_factory=dict)


@router.post("/events", status_code=204)
async def track(body: EventBody, background: BackgroundTasks, user: User | None = Depends(get_current_user)):
    meta = body.meta
    valid = body.type in CLIENT_EVENT_TYPES and (
        body.type != "cta_click" or meta.get("button") in CTA_BUTTONS
    )
    # Nieznane zdarzenia po cichu odrzucamy — tracking nie może sypać błędami w konsoli.
    if valid:
        if body.type == "card_click" and meta.get("source") not in CARD_SOURCES:
            meta = {**meta, "source": "inne"}
        background.add_task(
            log_event,
            body.type,
            body.innovation_id,
            user_id=user.id if user else None,
            anon_id=body.anon_id,
            meta=meta,
        )
    return Response(status_code=204)
