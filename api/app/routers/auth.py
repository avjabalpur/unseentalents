import uuid

from fastapi import APIRouter, Depends, Request, Response, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import CurrentUser
from app.core.errors import AppError
from app.core.security import REFRESH_TOKEN_TYPE, create_access_token, create_refresh_token, decode_token
from app.db import get_db
from app.models.enums import UserStatus
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest, LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

REFRESH_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path=f"{settings.api_prefix}/auth",
    )


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register_user(
        db, payload.name, payload.username, payload.email, payload.password, payload.phone
    )
    access_token, refresh_token = auth_service.issue_tokens(user)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await auth_service.authenticate_user(db, payload.email, payload.password)
    access_token, refresh_token = auth_service.issue_tokens(user)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not token:
        raise AppError("UNAUTHENTICATED", "No refresh token provided.", status.HTTP_401_UNAUTHORIZED)
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise AppError("UNAUTHENTICATED", "Invalid or expired refresh token.", status.HTTP_401_UNAUTHORIZED) from exc
    if payload.get("type") != REFRESH_TOKEN_TYPE:
        raise AppError("UNAUTHENTICATED", "Invalid token type.", status.HTTP_401_UNAUTHORIZED)

    user_id = uuid.UUID(payload["sub"])
    user = await auth_service.get_user_or_401(db, user_id)
    if user.status != UserStatus.ACTIVE:
        response.delete_cookie(REFRESH_COOKIE_NAME, path=f"{settings.api_prefix}/auth")
        raise AppError("ACCOUNT_SUSPENDED", "Your account has been suspended.", status.HTTP_403_FORBIDDEN)

    access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)
    _set_refresh_cookie(response, new_refresh_token)
    return TokenResponse(access_token=access_token)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(REFRESH_COOKIE_NAME, path=f"{settings.api_prefix}/auth")
    return {"success": True}


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser):
    return current_user


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    await auth_service.change_password(db, current_user, payload.current_password, payload.new_password)
    return {"success": True}
