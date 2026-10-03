"""Panel admina ROPS (A5): moderacja innowacji, role użytkowników, testerzy, trendy, liczniki.

Ścieżki nie kolidują z adminem Zasobnika (A2: /api/admin/areas|resources|needs|trends),
dlatego trendy wyszukiwań są pod /api/admin/search-trends.

Auth: dopóki A1 nie wystawi app.auth.get_current_user, wpuszczamy nagłówek X-Dev-Admin: true.
Gdy get_current_user jest dostępny, wystarczy też sesja z rolą "admin" (cookie/X-Session-Token).
"""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import BaseModel

from app import admin_store

try:  # A1 Push 2
    from app.auth import get_current_user
except ImportError:
    get_current_user = None


async def require_panel_admin(
    request: Request, x_dev_admin: Annotated[str | None, Header()] = None
) -> None:
    if x_dev_admin and x_dev_admin.lower() == "true":
        return
    if get_current_user is not None:
        user = get_current_user(request)
        if hasattr(user, "__await__"):
            user = await user
        if user is not None and getattr(user, "role", None) == "admin":
            return
    raise HTTPException(status.HTTP_403_FORBIDDEN, "Panel dostępny tylko dla roli admin")


router = APIRouter(prefix="/api/admin", tags=["admin-panel"], dependencies=[Depends(require_panel_admin)])


def _ok(data):
    return {"data": data, "error": None}


def _not_found(what: str):
    raise HTTPException(status.HTTP_404_NOT_FOUND, f"Nie znaleziono: {what}")


# ── Innowacje ────────────────────────────────────────────


@router.get("/innovations")
def list_innovations(
    status_: Annotated[str | None, Query(alias="status")] = None,
    tags: str | None = None,
    search: str | None = None,
):
    tag_list = [t for t in (tags or "").split(",") if t]
    items = admin_store.list_innovations(status=status_ or None, tags=tag_list, search=search or None)
    return _ok({"items": items, "total": len(items)})


def _set_status(innovation_id: int, new_status: str):
    item = admin_store.set_innovation_status(innovation_id, new_status)
    if item is None:
        _not_found(f"innowacja {innovation_id}")
    return _ok(item)


@router.post("/innovations/{innovation_id}/approve")
def approve_innovation(innovation_id: int):
    return _set_status(innovation_id, "active")


@router.post("/innovations/{innovation_id}/archive")
def archive_innovation(innovation_id: int):
    return _set_status(innovation_id, "archived")


@router.post("/innovations/{innovation_id}/flag-unmaintained")
def flag_unmaintained(innovation_id: int):
    return _set_status(innovation_id, "unmaintained")


# ── Użytkownicy ──────────────────────────────────────────


class SetRoleBody(BaseModel):
    role: Literal["user", "tester", "consultant"]


@router.get("/users")
def list_users():
    return _ok(admin_store.list_users())


@router.post("/users/{user_id}/set-role")
def set_role(user_id: int, body: SetRoleBody):
    user = admin_store.get_user(user_id)
    if user is None:
        _not_found(f"użytkownik {user_id}")
    if user["role"] == "admin":
        raise HTTPException(status.HTTP_409_CONFLICT, "Roli administratora nie zmienia się z panelu")
    return _ok(admin_store.set_user_role(user_id, body.role))


# ── Testerzy ─────────────────────────────────────────────


@router.get("/testers")
def list_testers(approved: bool | None = None):
    return _ok(admin_store.list_testers(approved))


@router.post("/testers/{tester_id}/approve")
def approve_tester(tester_id: int):
    tester = admin_store.approve_tester(tester_id)
    if tester is None:
        _not_found(f"tester {tester_id}")
    return _ok(tester)


# ── Trendy i liczniki ────────────────────────────────────


@router.get("/search-trends")
def search_trends(days: Annotated[int, Query(ge=1, le=90)] = 14):
    return _ok(admin_store.trends(days))


@router.get("/stats")
def stats():
    return _ok(admin_store.stats())


@router.post("/demo-reset")
def demo_reset():
    """Przywraca dane startowe — przydatne przed kolejnym pokazem dla jury."""
    admin_store.reset()
    return _ok({"reset": True})
