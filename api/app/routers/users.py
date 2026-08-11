import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.credit import AdminGrantCreditRequest, CreditTransactionRead
from app.schemas.submission import SubmissionRead
from app.schemas.user import BulkUserStatusUpdate, UserRead, UserRoleUpdate, UserStatusUpdate, UserUpdate
from app.services import credit_service, submission_service, user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
async def list_users(
    limit: int | None = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.list_users(db, limit=limit, offset=offset)


@router.patch("/me", response_model=UserRead)
async def update_me(payload: UserUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    updates = payload.model_dump(exclude_unset=True, by_alias=False)
    return await user_service.update_profile(db, current_user, updates)


@router.post("/me/avatar", response_model=UserRead)
async def upload_my_avatar(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    return await user_service.update_avatar(db, current_user, file)


@router.patch("/{user_id}/status", response_model=UserRead)
async def update_user_status(
    user_id: uuid.UUID,
    payload: UserStatusUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.update_status(db, user_id, payload.status, admin)


@router.post("/bulk-status", response_model=list[UserRead])
async def bulk_update_user_status(
    payload: BulkUserStatusUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.bulk_update_status(db, payload.user_ids, payload.status, admin)


@router.patch("/{user_id}/role", response_model=UserRead)
async def update_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.update_role(db, user_id, payload.role, admin)


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
    return await credit_service.list_transactions_for_user(db, user_id)


@router.post("/{user_id}/credits", response_model=UserRead)
async def grant_user_credit(
    user_id: uuid.UUID,
    payload: AdminGrantCreditRequest,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.grant_credit(db, user_id, payload.amount, admin)
