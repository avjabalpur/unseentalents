import logging

from sqlmodel import select

from app.db import async_session_factory
from app.models.enums import ProcessingStatus
from app.models.submission import Submission
from app.services.submission_service import process_thumbnail

logger = logging.getLogger(__name__)


async def sweep_pending_thumbnails() -> None:
    async with async_session_factory() as db:
        result = await db.exec(
            select(Submission).where(
                Submission.processing_status.in_([ProcessingStatus.PENDING, ProcessingStatus.PROCESSING])
            )
        )
        submissions = list(result.all())
        for submission in submissions:
            try:
                await process_thumbnail(db, submission)
            except Exception:
                logger.exception("Failed to process thumbnail for submission %s", submission.id)
