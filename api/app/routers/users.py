import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, require_role
from app.core.errors import AppError
from app.db import get_db
from app.models.enums import CreditTransactionType, UserRole
from app.models.user import User
from app.schemas.credit import AdminGrantCreditRequest
from app.schemas.user import UserRead, UserUpdate
from app.services.credit_service import grant_credit
from app.storage.local import get_storage_backend

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
async def list_users(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.exec(select(User).order_by(User.created_at.desc()))
    return list(result.all())


@router.patch("/me", response_model=UserRead)
async def update_me(payload: UserUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    updates = payload.model_dump(exclude_unset=True, by_alias=False)
    if not updates:
        return current_user
    for field, value in updates.items():
        setattr(current_user, field, value)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserRead)
async def upload_my_avatar(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    storage = get_storage_backend()
    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    key = f"avatars/{current_user.id}{extension}"
    await storage.save(file, key)
    current_user.avatar_key = key
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/{user_id}/credits", response_model=UserRead)
async def grant_user_credit(
    user_id: uuid.UUID,
    payload: AdminGrantCreditRequest,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if user is None:
        raise AppError("NOT_FOUND", "User not found.", status.HTTP_404_NOT_FOUND)
    await grant_credit(db, user, payload.amount, CreditTransactionType.ADMIN_GRANT)
    await db.commit()
    await db.refresh(user)
    return user
