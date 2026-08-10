import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import Pagination
from app.models.activity_log import ActivityLog


def record(
    db: AsyncSession,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
    actor_id: uuid.UUID | None = None,
    metadata: dict | None = None,
) -> None:
    """Queue an activity log row on the current session. Callers commit as part of
    their existing transaction — this never commits itself."""
    db.add(
        ActivityLog(
            entity_type=entity_type,
            entity_id=entity_id,
            actor_id=actor_id,
            action=action,
            log_metadata=metadata,
        )
    )


async def list_for_entity(db: AsyncSession, entity_type: str, entity_id: uuid.UUID) -> list[ActivityLog]:
    result = await db.exec(
        select(ActivityLog)
        .where(ActivityLog.entity_type == entity_type, ActivityLog.entity_id == entity_id)
        .order_by(ActivityLog.created_at)
    )
    return list(result.all())


async def list_all(
    db: AsyncSession,
    pagination: Pagination,
    entity_type: str | None = None,
    actor_id: uuid.UUID | None = None,
) -> list[ActivityLog]:
    query = select(ActivityLog)
    if entity_type is not None:
        query = query.where(ActivityLog.entity_type == entity_type)
    if actor_id is not None:
        query = query.where(ActivityLog.actor_id == actor_id)
    query = query.order_by(ActivityLog.created_at.desc()).limit(pagination.limit).offset(pagination.offset)
    result = await db.exec(query)
    return list(result.all())
