import uuid

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select

from app.auth import get_current_user
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

VALID_ROLES = {"user", "tester", "admin", "consultant"}


class SessionBody(BaseModel):
    name: str = "Gość"
    role: str = "user"


class SetRoleBody(BaseModel):
    role: str


@router.post("/session")
async def create_session(body: SessionBody, response: Response):
    role = body.role if body.role in VALID_ROLES else "user"
    async with get_db() as db:
        # Ta sama nazwa + rola = to samo konto. Bez tego każde logowanie tworzyło nowego usera
        # i np. tester tracił testy przypisane mu przez admina.
        user = (await db.execute(
            select(User).where(User.name == body.name, User.role == role).order_by(User.id).limit(1)
        )).scalar_one_or_none()
        if user is None:
            user = User(name=body.name, role=role, session_token=str(uuid.uuid4()))
            db.add(user)
            await db.commit()
            await db.refresh(user)
    response.set_cookie("session", user.session_token, httponly=True, samesite="lax")
    return {"data": {"session_token": user.session_token, "role": user.role, "id": user.id, "name": user.name}}


@router.post("/set-role")
async def set_role(body: SetRoleBody, current_user: User | None = Depends(get_current_user)):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Nie zalogowany")
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Nieprawidłowa rola")
    async with get_db() as db:
        result = await db.execute(select(User).where(User.id == current_user.id))
        user = result.scalar_one()
        user.role = body.role
        await db.commit()
    return {"data": {"role": body.role}}


@router.get("/me")
async def me(current_user: User | None = Depends(get_current_user)):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Nie zalogowany")
    return {"data": {"id": current_user.id, "name": current_user.name, "role": current_user.role}}
