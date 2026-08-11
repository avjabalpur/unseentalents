import uuid

from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import Pagination, require_role
from app.core.errors import AppError
from app.db import get_db
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.schemas.activity_log import ActivityLogRead
from app.services import activity_log_service, submission_service

router = APIRouter(tags=["activity"])


@router.get("/submissions/{submission_id}/history", response_model=list[ActivityLogRead])
async def get_submission_history(submission_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    submission = await submission_service.get_submission_or_404(db, submission_id)
    owner = await submission_service.get_owner(db, submission)
    if owner is None or owner.status != UserStatus.ACTIVE:
        raise AppError("NOT_FOUND", "Submission not found.", status.HTTP_404_NOT_FOUND)
    logs = await activity_log_service.list_for_entity(db, "SUBMISSION", submission_id)
    return [await activity_log_service.to_read(db, log) for log in logs]


@router.get("/admin/users/{user_id}/history", response_model=list[ActivityLogRead])
async def get_user_history(
    user_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    logs = await activity_log_service.list_for_entity(db, "USER", user_id)
    return [await activity_log_service.to_read(db, log) for log in logs]


@router.get("/admin/activity", response_model=list[ActivityLogRead])
async def list_admin_activity(
    entity_type: str | None = None,
    actor_id: uuid.UUID | None = None,
    pagination: Pagination = Depends(Pagination),
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    logs = await activity_log_service.list_all(db, pagination, entity_type=entity_type, actor_id=actor_id)
    return [await activity_log_service.to_read(db, log) for log in logs]
