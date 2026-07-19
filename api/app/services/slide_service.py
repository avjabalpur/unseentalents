import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.slide import Slide
from app.models.user import User
from app.schemas.slide import SlideCreate, SlideUpdate
from app.storage.local import get_storage_backend


async def list_active_slides(db: AsyncSession) -> list[Slide]:
    result = await db.exec(select(Slide).where(Slide.active.is_(True)).order_by(Slide.order_index))
    return list(result.all())


async def list_all_slides(db: AsyncSession) -> list[Slide]:
    result = await db.exec(select(Slide).order_by(Slide.order_index))
    return list(result.all())


async def get_slide_or_404(db: AsyncSession, slide_id: uuid.UUID) -> Slide:
    slide = await db.get(Slide, slide_id)
    if slide is None:
        raise AppError("NOT_FOUND", "Slide not found.", status.HTTP_404_NOT_FOUND)
    return slide


async def create_slide(
    db: AsyncSession, data: SlideCreate, image: UploadFile, mobile_image: UploadFile | None, admin: User
) -> Slide:
    storage = get_storage_backend()
    slide_id = uuid.uuid4()

    ext = Path(image.filename or "").suffix.lower() or ".jpg"
    image_key = f"slides/{slide_id}-desktop{ext}"
    await storage.save(image, image_key)

    mobile_image_key = None
    if mobile_image is not None and mobile_image.filename:
        mobile_ext = Path(mobile_image.filename).suffix.lower() or ".jpg"
        mobile_image_key = f"slides/{slide_id}-mobile{mobile_ext}"
        await storage.save(mobile_image, mobile_image_key)

    slide = Slide(
        id=slide_id,
        image_key=image_key,
        mobile_image_key=mobile_image_key,
        created_by=admin.id,
        **data.model_dump(),
    )
    db.add(slide)
    await db.commit()
    await db.refresh(slide)
    return slide


async def update_slide(db: AsyncSession, slide: Slide, data: SlideUpdate) -> Slide:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(slide, field, value)
    slide.updated_at = datetime.now(timezone.utc)
    db.add(slide)
    await db.commit()
    await db.refresh(slide)
    return slide


async def delete_slide(db: AsyncSession, slide: Slide) -> None:
    storage = get_storage_backend()
    storage.delete(slide.image_key)
    if slide.mobile_image_key:
        storage.delete(slide.mobile_image_key)
    await db.delete(slide)
    await db.commit()
