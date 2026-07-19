import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, require_role
from app.core.errors import AppError
from app.core.rate_limit import rate_limiter
from app.db import get_db
from app.models.enums import UserRole
from app.models.submission import Submission
from app.models.user import User
from app.schemas.submission import SubmissionRead
from app.services import event_service, event_type_service, participation_service, stage_service, submission_service

router = APIRouter(tags=["submissions"])

_upload_rate_limit = rate_limiter("upload", limit=10, window_seconds=60)


async def _to_read(db: AsyncSession, submission: Submission) -> SubmissionRead:
    vote_count = await submission_service.count_votes(db, submission.id)
    owner = await submission_service.get_owner(db, submission)
    data = SubmissionRead.model_validate(submission)
    data.vote_count = vote_count
    if owner is not None:
        data.owner_name = owner.name
        data.owner_username = owner.username
    return data


@router.get("/stages/{stage_id}/submissions", response_model=list[SubmissionRead])
async def list_submissions(stage_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    submissions = await submission_service.list_submissions_for_stage(db, stage_id, approved_only=True)
    return [await _to_read(db, s) for s in submissions]


@router.get("/stages/{stage_id}/leaderboard", response_model=list[SubmissionRead])
async def leaderboard(stage_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    submissions = await submission_service.list_submissions_for_stage(db, stage_id, approved_only=True)
    reads = [await _to_read(db, s) for s in submissions]
    reads.sort(key=lambda r: r.vote_count, reverse=True)
    return reads


@router.post("/stages/{stage_id}/submissions", response_model=SubmissionRead)
async def create_submission(
    stage_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
    notes: str | None = Form(None),
    title: str | None = Form(None),
    _rate_limit: None = Depends(_upload_rate_limit),
):
    stage = await stage_service.get_stage_or_404(db, stage_id)
    event = await event_service.get_event_or_404(db, stage.event_id)
    event_type = await event_type_service.get_event_type_or_404(db, event.event_type_id)

    participation = await participation_service.get_or_create_participation(db, event.id, current_user)
    if participation.current_stage_id != stage.id:
        raise AppError(
            "NOT_ELIGIBLE_FOR_STAGE",
            "You are not currently eligible to submit for this stage.",
            status.HTTP_400_BAD_REQUEST,
        )

    submission = await submission_service.upload_submission(
        db, background_tasks, participation, event_type, file, notes, title
    )
    return await _to_read(db, submission)


@router.get("/submissions/{submission_id}", response_model=SubmissionRead)
async def get_submission(submission_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    submission = await submission_service.get_submission_or_404(db, submission_id)
    return await _to_read(db, submission)


@router.get("/users/me/submissions", response_model=list[SubmissionRead])
async def list_my_submissions(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    rows = await submission_service.list_submissions_for_user(db, current_user.id)
    reads = []
    for submission, event_name, event_id in rows:
        data = await _to_read(db, submission)
        data.event_name = event_name
        data.event_id = event_id
        reads.append(data)
    return reads


@router.get("/admin/submissions/pending", response_model=list[SubmissionRead])
async def list_pending(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    submissions = await submission_service.list_pending_moderation(db)
    return [await _to_read(db, s) for s in submissions]


@router.post("/submissions/{submission_id}/moderate", response_model=SubmissionRead)
async def moderate(
    submission_id: uuid.UUID,
    approve: bool,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    submission = await submission_service.get_submission_or_404(db, submission_id)
    updated = await submission_service.moderate_submission(db, submission, approve)
    return await _to_read(db, updated)
