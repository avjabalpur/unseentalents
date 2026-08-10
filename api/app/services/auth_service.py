from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.enums import CreditTransactionType, UserRole, UserStatus
from app.models.user import User
from app.services import settings_service
from app.services.credit_service import grant_credit


async def register_user(
    db: AsyncSession, name: str, username: str, email: str, password: str, phone: str | None
) -> User:
    existing_email = await db.exec(select(User).where(User.email == email))
    if existing_email.first() is not None:
        raise AppError("EMAIL_TAKEN", "An account with this email already exists.", status.HTTP_409_CONFLICT)

    existing_username = await db.exec(select(User).where(User.username == username))
    if existing_username.first() is not None:
        raise AppError("USERNAME_TAKEN", "This username is already taken.", status.HTTP_409_CONFLICT)

    # Fetched before the user row is added: get_or_create_settings commits internally
    # the first time it seeds the singleton row, which would otherwise prematurely
    # commit the not-yet-fully-built user below.
    site_settings = await settings_service.get_or_create_settings(db)

    user = User(
        name=name,
        username=username,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        role=UserRole.USER,
    )
    db.add(user)
    await db.flush()

    if site_settings.welcome_credit_amount > 0:
        await grant_credit(db, user, site_settings.welcome_credit_amount, CreditTransactionType.WELCOME_BONUS)

    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    result = await db.exec(select(User).where(User.email == email))
    user = result.first()
    if user is None or not verify_password(password, user.password_hash):
        raise AppError("INVALID_CREDENTIALS", "Incorrect email or password.", status.HTTP_401_UNAUTHORIZED)
    if user.status != UserStatus.ACTIVE:
        raise AppError("ACCOUNT_SUSPENDED", "Your account has been suspended.", status.HTTP_403_FORBIDDEN)
    return user


def issue_tokens(user: User) -> tuple[str, str]:
    return create_access_token(user.id), create_refresh_token(user.id)


async def change_password(db: AsyncSession, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.password_hash):
        raise AppError("INVALID_CREDENTIALS", "Current password is incorrect.", status.HTTP_401_UNAUTHORIZED)
    user.password_hash = hash_password(new_password)
    db.add(user)
    await db.commit()
