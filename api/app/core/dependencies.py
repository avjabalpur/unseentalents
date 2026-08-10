import uuid
from typing import Annotated

from fastapi import Depends, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.db import get_db
from app.models.enums import UserRole, UserStatus
from app.models.user import User

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if credentials is None:
        raise AppError("UNAUTHENTICATED", "Authentication required.", status.HTTP_401_UNAUTHORIZED)

    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise AppError("UNAUTHENTICATED", "Invalid or expired token.", status.HTTP_401_UNAUTHORIZED) from exc

    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise AppError("UNAUTHENTICATED", "Invalid token type.", status.HTTP_401_UNAUTHORIZED)

    user_id = uuid.UUID(payload["sub"])
    user = await db.get(User, user_id)
    if user is None:
        raise AppError("UNAUTHENTICATED", "Invalid or expired token.", status.HTTP_401_UNAUTHORIZED)
    if user.status != UserStatus.ACTIVE:
        raise AppError("ACCOUNT_SUSPENDED", "Your account has been suspended.", status.HTTP_403_FORBIDDEN)

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: UserRole):
    async def _dependency(user: CurrentUser) -> User:
        if user.role not in roles:
            raise AppError("FORBIDDEN", "You do not have permission to perform this action.", status.HTTP_403_FORBIDDEN)
        return user

    return _dependency


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != ACCESS_TOKEN_TYPE:
            return None
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, KeyError):
        return None
    return await db.get(User, user_id)


class Pagination:
    def __init__(self, limit: int = 20, offset: int = 0):
        self.limit = min(max(limit, 1), 100)
        self.offset = max(offset, 0)
