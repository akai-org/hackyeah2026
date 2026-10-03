from fastapi import Depends, HTTPException, Request
from sqlalchemy import select

from app.database import get_db
from app.models import User


async def get_current_user(request: Request) -> User | None:
    token = request.cookies.get("session") or request.headers.get("X-Session-Token")
    if not token:
        return None
    async with get_db() as db:
        result = await db.execute(select(User).where(User.session_token == token))
        return result.scalar_one_or_none()


def require_role(*roles: str):
    async def dep(user: User | None = Depends(get_current_user)) -> User:
        if user is None:
            raise HTTPException(status_code=401, detail="Nie zalogowany")
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Brak uprawnień")
        return user
    return dep
