from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.enums import CreditTransactionType, UserRole
from app.models.user import User
from app.services.credit_service import grant_credit

settings = get_settings()


async def register_user(
    db: AsyncSession, name: str, username: str, email: str, password: str, phone: str | None
) -> User:
    existing_email = await db.exec(select(User).where(User.email == email))
    if existing_email.first() is not None:
        raise AppError("EMAIL_TAKEN", "An account with this email already exists.", status.HTTP_409_CONFLICT)

    existing_username = await db.exec(select(User).where(User.username == username))
    if existing_username.first() is not None:
        raise AppError("USERNAME_TAKEN", "This username is already taken.", status.HTTP_409_CONFLICT)

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

    if settings.welcome_credit_amount > 0:
        await grant_credit(db, user, settings.welcome_credit_amount, CreditTransactionType.WELCOME_BONUS)

    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    result = await db.exec(select(User).where(User.email == email))
    user = result.first()
    if user is None or not verify_password(password, user.password_hash):
        raise AppError("INVALID_CREDENTIALS", "Incorrect email or password.", status.HTTP_401_UNAUTHORIZED)
    return user


def issue_tokens(user: User) -> tuple[str, str]:
    return create_access_token(user.id), create_refresh_token(user.id)
