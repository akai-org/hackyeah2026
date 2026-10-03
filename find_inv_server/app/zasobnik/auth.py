import secrets
from typing import Annotated

from fastapi import Header, HTTPException, status

from app.config import settings


def require_admin(x_admin_token: Annotated[str | None, Header()] = None) -> None:
    """Wpuszcza tylko żądania z poprawnym nagłówkiem X-Admin-Token."""
    if x_admin_token is None or not secrets.compare_digest(x_admin_token, settings.admin_token):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Brak lub błędny X-Admin-Token")
