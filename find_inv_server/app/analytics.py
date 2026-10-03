"""Zbieranie zdarzeń analitycznych do tabeli events. Zapis nigdy nie psuje odpowiedzi endpointu."""

import json
import logging

log = logging.getLogger(__name__)

# Zdarzenia, które może wysłać frontend przez POST /api/events.
CLIENT_EVENT_TYPES = {
    "innovation_view",  # wejście na /innowacje/[id]
    "card_click",  # klik karty w wynikach / mapie; meta: source, position
    "cta_click",  # klik przycisku na karcie; meta: button
}
# Zdarzenia zapisywane tylko przez backend.
SERVER_EVENT_TYPES = {
    "card_impression",  # innowacja pokazana w wynikach /api/match; meta: position
    "middleman_start",
    "middleman_plan",
}
EVENT_TYPES = CLIENT_EVENT_TYPES | SERVER_EVENT_TYPES

CTA_BUTTONS = {"wdrozenie", "zostan_testerem", "zrodlo", "materialy", "film", "zobacz_karte"}
CARD_SOURCES = {"wyniki", "mapa", "biblioteka", "forum", "inne"}


def _clean_meta(meta: dict | None) -> str:
    """Tylko krótkie wartości proste — meta nie może urosnąć w śmietnik."""
    if not meta:
        return "{}"
    clean = {
        str(k)[:32]: (v[:64] if isinstance(v, str) else v)
        for k, v in list(meta.items())[:8]
        if isinstance(v, (str, int, float, bool))
    }
    return json.dumps(clean, ensure_ascii=False)


async def log_events(rows: list[dict]) -> None:
    """rows: [{type, innovation_id?, user_id?, anon_id?, meta?}]"""
    if not rows:
        return
    try:
        from app.database import get_db
        from app.models import Event

        async with get_db() as db:
            for row in rows:
                db.add(
                    Event(
                        type=row["type"],
                        innovation_id=row.get("innovation_id"),
                        user_id=row.get("user_id"),
                        anon_id=row.get("anon_id"),
                        meta=_clean_meta(row.get("meta")),
                    )
                )
            await db.commit()
    except Exception:
        log.exception("events insert failed")


async def log_event(type: str, innovation_id: int | None = None, **extra) -> None:
    await log_events([{"type": type, "innovation_id": innovation_id, **extra}])


def as_int(value) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
