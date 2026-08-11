import uuid
from pathlib import Path

from fastapi import BackgroundTasks, UploadFile, status
from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.media.thumbnail import generate_image_thumbnail, generate_video_thumbnail
from app.models.enums import MediaType, ProcessingStatus, SubmissionStatus, UserStatus
from app.models.event_type import EventType
from app.models.participation import Participation
from app.models.submission import Submission
from app.models.user import User
from app.models.vote import Vote
from app.services import activity_log_service, stage_service
from app.services.credit_service import spend_upload_credit
from app.storage.local import get_storage_backend

_VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".mkv"}
_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


async def get_submission_or_404(db: AsyncSession, submission_id: uuid.UUID) -> Submission:
    submission = await db.get(Submission, submission_id)
    if submission is None:
        raise AppError("NOT_FOUND", "Submission not found.", status.HTTP_404_NOT_FOUND)
    return submission


async def list_submissions_for_stage(
    db: AsyncSession, stage_id: uuid.UUID, approved_only: bool = True
) -> list[Submission]:
    # Suspended users' entries are excluded from every public listing (event pages, leaderboards).
    query = (
        select(Submission)
        .join(Participation, Participation.id == Submission.participation_id)
        .join(User, User.id == Participation.user_id)
        .where(Submission.stage_id == stage_id, User.status == UserStatus.ACTIVE)
    )
    if approved_only:
        query = query.where(Submission.status == SubmissionStatus.APPROVED)
    result = await db.exec(query.order_by(Submission.uploaded_at.desc()))
    return list(result.all())


async def list_pending_moderation(db: AsyncSession, limit: int | None = None, offset: int = 0) -> list[Submission]:
    query = (
        select(Submission)
        .where(Submission.status == SubmissionStatus.PENDING_MODERATION)
        .order_by(Submission.uploaded_at)
        .offset(offset)
    )
    if limit is not None:
        query = query.limit(limit)
    result = await db.exec(query)
    return list(result.all())


async def list_all_submissions(db: AsyncSession) -> list[Submission]:
    result = await db.exec(select(Submission).order_by(Submission.uploaded_at.desc()))
    return list(result.all())


async def count_votes(db: AsyncSession, submission_id: uuid.UUID) -> int:
    result = await db.exec(select(func.count(Vote.id)).where(Vote.submission_id == submission_id))
    return result.one()


async def get_owner(db: AsyncSession, submission: Submission) -> User | None:
    participation = await db.get(Participation, submission.participation_id)
    if participation is None:
        return None
    return await db.get(User, participation.user_id)


async def moderate_submission(
    db: AsyncSession,
    submission: Submission,
    approve: bool,
    reason: str | None = None,
    actor_id: uuid.UUID | None = None,
) -> Submission:
    submission.status = SubmissionStatus.APPROVED if approve else SubmissionStatus.REJECTED
    submission.rejection_reason = None if approve else reason
    db.add(submission)
    activity_log_service.record(
        db,
        "SUBMISSION",
        submission.id,
        "APPROVED" if approve else "REJECTED",
        actor_id=actor_id,
        metadata={"reason": reason} if reason else None,
    )
    await db.commit()
    await db.refresh(submission)
    return submission


async def list_submissions_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[tuple[Submission, str, uuid.UUID]]:
    """Returns (submission, event_name, event_id) tuples for every submission the user has made,
    newest first — used by the upload page's "your uploads" sidebar."""
    from app.models.event import Event

    result = await db.exec(
        select(Submission, Event.name, Event.id)
        .join(Participation, Participation.id == Submission.participation_id)
        .join(Event, Event.id == Participation.event_id)
        .where(Participation.user_id == user_id)
        .order_by(Submission.uploaded_at.desc())
    )
    return [(row[0], row[1], row[2]) for row in result.all()]


async def list_gallery_submissions(
    db: AsyncSession,
    event_id: uuid.UUID | None = None,
    media_type: MediaType | None = None,
    limit: int | None = None,
    offset: int = 0,
) -> list[tuple[Submission, str, uuid.UUID]]:
    """Approved entries across every event, newest first — powers the public gallery.
    Returns (submission, event_name, event_id) tuples, same shape as list_submissions_for_user."""
    from app.models.event import Event

    query = (
        select(Submission, Event.name, Event.id)
        .join(Participation, Participation.id == Submission.participation_id)
        .join(Event, Event.id == Participation.event_id)
        .join(User, User.id == Participation.user_id)
        .where(Submission.status == SubmissionStatus.APPROVED, User.status == UserStatus.ACTIVE)
    )
    if event_id is not None:
        query = query.where(Event.id == event_id)
    if media_type is not None:
        query = query.where(Submission.media_type == media_type)
    query = query.order_by(Submission.uploaded_at.desc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    result = await db.exec(query)
    return [(row[0], row[1], row[2]) for row in result.all()]


async def upload_submission(
    db: AsyncSession,
    background_tasks: BackgroundTasks,
    participation: Participation,
    event_type: EventType,
    file: UploadFile,
    notes: str | None = None,
    title: str | None = None,
) -> Submission:
    stage = await stage_service.get_stage_or_404(db, participation.current_stage_id)
    if not stage_service.is_stage_open(stage):
        raise AppError(
            "STAGE_CLOSED", "This stage is not currently accepting submissions.", status.HTTP_400_BAD_REQUEST
        )

    existing = await db.exec(
        select(Submission).where(
            Submission.participation_id == participation.id,
            Submission.stage_id == stage.id,
        )
    )
    if existing.first() is not None:
        raise AppError(
            "SUBMISSION_EXISTS", "You've already submitted an entry for this stage.", status.HTTP_409_CONFLICT
        )

    extension = Path(file.filename or "").suffix.lower()
    if event_type.submission_media_type == MediaType.VIDEO:
        if extension not in _VIDEO_EXTENSIONS:
            raise AppError(
                "INVALID_FILE_TYPE",
                f"Expected a video file for this event type ({', '.join(sorted(_VIDEO_EXTENSIONS))}).",
                status.HTTP_400_BAD_REQUEST,
            )
    elif extension not in _IMAGE_EXTENSIONS:
        raise AppError(
            "INVALID_FILE_TYPE",
            f"Expected an image file for this event type ({', '.join(sorted(_IMAGE_EXTENSIONS))}).",
            status.HTTP_400_BAD_REQUEST,
        )

    submission_id = uuid.uuid4()
    folder = "videos" if event_type.submission_media_type == MediaType.VIDEO else "images"
    key = f"{folder}/{submission_id}{extension}"

    storage = get_storage_backend()
    await storage.save(file, key)

    submission = Submission(
        id=submission_id,
        participation_id=participation.id,
        stage_id=stage.id,
        media_type=event_type.submission_media_type,
        storage_key=key,
        notes=notes,
        title=title,
        status=SubmissionStatus.PENDING_MODERATION,
        processing_status=ProcessingStatus.PENDING,
    )
    db.add(submission)

    user = await db.get(User, participation.user_id)
    await spend_upload_credit(db, user, reference_id=submission.id)
    activity_log_service.record(db, "SUBMISSION", submission.id, "SUBMITTED", actor_id=user.id)

    await db.commit()
    await db.refresh(submission)

    background_tasks.add_task(process_thumbnail_by_id, submission.id)
    return submission


async def process_thumbnail_by_id(submission_id: uuid.UUID) -> None:
    from app.db import async_session_factory

    async with async_session_factory() as db:
        submission = await db.get(Submission, submission_id)
        if submission is None or submission.processing_status == ProcessingStatus.READY:
            return
        await process_thumbnail(db, submission)


async def process_thumbnail(db: AsyncSession, submission: Submission) -> None:
    storage = get_storage_backend()
    submission.processing_status = ProcessingStatus.PROCESSING
    db.add(submission)
    await db.commit()

    source_path = storage.get_path(submission.storage_key)
    thumb_key = f"thumbnails/{submission.id}.jpg"
    dest_path = storage.get_path(thumb_key)

    if submission.media_type == MediaType.IMAGE:
        success = generate_image_thumbnail(source_path, dest_path)
    else:
        success = generate_video_thumbnail(source_path, dest_path)

    submission.processing_status = ProcessingStatus.READY if success else ProcessingStatus.FAILED
    submission.thumbnail_key = thumb_key if success else None
    db.add(submission)
    activity_log_service.record(
        db, "SUBMISSION", submission.id, "THUMBNAIL_READY" if success else "THUMBNAIL_FAILED"
    )
    await db.commit()
