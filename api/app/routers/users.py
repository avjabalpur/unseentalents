import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, require_role
from app.core.errors import AppError
from app.db import get_db
from app.models.credit_transaction import CreditTransaction
from app.models.enums import CreditTransactionType, UserRole, UserStatus
from app.models.user import User
from app.schemas.credit import AdminGrantCreditRequest, CreditTransactionRead
from app.schemas.submission import SubmissionRead
from app.schemas.user import BulkUserStatusUpdate, UserRead, UserRoleUpdate, UserStatusUpdate, UserUpdate
from app.services import activity_log_service, submission_service
from app.services.credit_service import grant_credit
from app.storage.local import get_storage_backend

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
async def list_users(
    limit: int | None = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).order_by(User.created_at.desc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    result = await db.exec(query)
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


@router.patch("/{user_id}/status", response_model=UserRead)
async def update_user_status(
    user_id: uuid.UUID,
    payload: UserStatusUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if user is None:
        raise AppError("NOT_FOUND", "User not found.", status.HTTP_404_NOT_FOUND)
    if user.id == admin.id:
        raise AppError(
            "CANNOT_SUSPEND_SELF", "You cannot change your own account status.", status.HTTP_400_BAD_REQUEST
        )
    user.status = payload.status
    db.add(user)
    activity_log_service.record(
        db,
        "USER",
        user.id,
        "BLOCKED" if payload.status == UserStatus.SUSPENDED else "UNBLOCKED",
        actor_id=admin.id,
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/bulk-status", response_model=list[UserRead])
async def bulk_update_user_status(
    payload: BulkUserStatusUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    updated: list[User] = []
    for user_id in payload.user_ids:
        if user_id == admin.id:
            continue
        user = await db.get(User, user_id)
        if user is None:
            continue
        user.status = payload.status
        db.add(user)
        activity_log_service.record(
            db,
            "USER",
            user.id,
            "BLOCKED" if payload.status == UserStatus.SUSPENDED else "UNBLOCKED",
            actor_id=admin.id,
        )
        updated.append(user)
    await db.commit()
    for user in updated:
        await db.refresh(user)
    return updated


@router.patch("/{user_id}/role", response_model=UserRead)
async def update_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if user is None:
        raise AppError("NOT_FOUND", "User not found.", status.HTTP_404_NOT_FOUND)
    if user.id == admin.id:
        raise AppError("CANNOT_CHANGE_OWN_ROLE", "You cannot change your own role.", status.HTTP_400_BAD_REQUEST)
    previous_role = user.role
    user.role = payload.role
    db.add(user)
    activity_log_service.record(
        db,
        "USER",
        user.id,
        "ROLE_CHANGED",
        actor_id=admin.id,
        metadata={"from": previous_role.value, "to": payload.role.value},
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}/submissions", response_model=list[SubmissionRead])
async def list_user_submissions(
    user_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    rows = await submission_service.list_submissions_for_user(db, user_id)
    reads = []
    for submission, event_name, event_id in rows:
        vote_count = await submission_service.count_votes(db, submission.id)
        data = SubmissionRead.model_validate(submission)
        data.vote_count = vote_count
        data.event_name = event_name
        data.event_id = event_id
        reads.append(data)
    return reads


@router.get("/{user_id}/credits", response_model=list[CreditTransactionRead])
async def list_user_credit_transactions(
    user_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.exec(
        select(CreditTransaction)
        .where(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.created_at.desc())
    )
    return list(result.all())


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
    await grant_credit(db, user, payload.amount, CreditTransactionType.ADMIN_GRANT, actor_id=admin.id)
    await db.commit()
    await db.refresh(user)
    return user
