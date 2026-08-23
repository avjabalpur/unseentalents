import uuid
from pathlib import Path

from fastapi import UploadFile, status
from sqlalchemy import or_
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.services import activity_log_service, credit_service
from app.storage.local import get_storage_backend


async def get_user_or_404(db: AsyncSession, user_id: uuid.UUID) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise AppError("NOT_FOUND", "User not found.", status.HTTP_404_NOT_FOUND)
    return user


async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await db.get(User, user_id)


async def list_users(db: AsyncSession, limit: int | None = None, offset: int = 0) -> list[User]:
    query = select(User).order_by(User.created_at.desc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    result = await db.exec(query)
    return list(result.all())


async def search_users(db: AsyncSession, query_text: str, limit: int = 10) -> list[User]:
    pattern = f"%{query_text}%"
    result = await db.exec(
        select(User)
        .where(User.status == UserStatus.ACTIVE, or_(User.username.ilike(pattern), User.name.ilike(pattern)))
        .order_by(User.name)
        .limit(limit)
    )
    return list(result.all())


async def update_profile(db: AsyncSession, user: User, updates: dict) -> User:
    if not updates:
        return user
    for field, value in updates.items():
        setattr(user, field, value)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_avatar(db: AsyncSession, user: User, file: UploadFile) -> User:
    storage = get_storage_backend()
    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    key = f"avatars/{user.id}{extension}"
    await storage.save(file, key)
    user.avatar_key = key
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_status(db: AsyncSession, user_id: uuid.UUID, new_status: UserStatus, admin: User) -> User:
    user = await get_user_or_404(db, user_id)
    if user.id == admin.id:
        raise AppError(
            "CANNOT_SUSPEND_SELF", "You cannot change your own account status.", status.HTTP_400_BAD_REQUEST
        )
    user.status = new_status
    db.add(user)
    activity_log_service.record(
        db,
        "USER",
        user.id,
        "BLOCKED" if new_status == UserStatus.SUSPENDED else "UNBLOCKED",
        actor_id=admin.id,
    )
    await db.commit()
    await db.refresh(user)
    return user


async def bulk_update_status(
    db: AsyncSession, user_ids: list[uuid.UUID], new_status: UserStatus, admin: User
) -> list[User]:
    updated: list[User] = []
    for user_id in user_ids:
        if user_id == admin.id:
            continue
        user = await db.get(User, user_id)
        if user is None:
            continue
        user.status = new_status
        db.add(user)
        activity_log_service.record(
            db,
            "USER",
            user.id,
            "BLOCKED" if new_status == UserStatus.SUSPENDED else "UNBLOCKED",
            actor_id=admin.id,
        )
        updated.append(user)
    await db.commit()
    for user in updated:
        await db.refresh(user)
    return updated


async def update_role(db: AsyncSession, user_id: uuid.UUID, new_role: UserRole, admin: User) -> User:
    user = await get_user_or_404(db, user_id)
    if user.id == admin.id:
        raise AppError("CANNOT_CHANGE_OWN_ROLE", "You cannot change your own role.", status.HTTP_400_BAD_REQUEST)
    previous_role = user.role
    user.role = new_role
    db.add(user)
    activity_log_service.record(
        db,
        "USER",
        user.id,
        "ROLE_CHANGED",
        actor_id=admin.id,
        metadata={"from": previous_role.value, "to": new_role.value},
    )
    await db.commit()
    await db.refresh(user)
    return user


async def grant_credit(db: AsyncSession, user_id: uuid.UUID, amount: int, admin: User) -> User:
    user = await get_user_or_404(db, user_id)
    return await credit_service.admin_grant_credit(db, user, amount, admin.id)
