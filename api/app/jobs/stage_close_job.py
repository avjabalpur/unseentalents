import logging

from app.db import async_session_factory
from app.services import stage_service

logger = logging.getLogger(__name__)


async def close_due_stages() -> None:
    async with async_session_factory() as db:
        due_stages = await stage_service.get_due_stages(db)
        for stage in due_stages:
            try:
                await stage_service.close_stage(db, stage)
                logger.info("Closed stage %s", stage.id)
            except Exception:
                logger.exception("Failed to close stage %s", stage.id)
