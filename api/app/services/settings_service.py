import uuid
from datetime import datetime, timezone

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings
from app.models.site_settings import SiteSettings
from app.schemas.site_settings import SiteSettingsUpdate
from app.services import activity_log_service


async def get_or_create_settings(db: AsyncSession) -> SiteSettings:
    result = await db.exec(select(SiteSettings).limit(1))
    row = result.first()
    if row is None:
        cfg = get_settings()
        row = SiteSettings(welcome_credit_amount=cfg.welcome_credit_amount)
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


async def update_settings(
    db: AsyncSession, row: SiteSettings, data: SiteSettingsUpdate, actor_id: uuid.UUID | None = None
) -> SiteSettings:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(row, field, value)
    row.updated_at = datetime.now(timezone.utc)
    db.add(row)
    activity_log_service.record(db, "SITE_SETTINGS", row.id, "SETTINGS_UPDATED", actor_id=actor_id, metadata=updates or None)
    await db.commit()
    await db.refresh(row)
    return row
