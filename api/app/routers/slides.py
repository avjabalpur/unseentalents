import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.slide import SlideCreate, SlideRead, SlideUpdate
from app.services import slide_service

router = APIRouter(prefix="/slides", tags=["slides"])


@router.get("", response_model=list[SlideRead])
async def list_slides(db: AsyncSession = Depends(get_db)):
    return await slide_service.list_active_slides(db)


@router.get("/admin/all", response_model=list[SlideRead])
async def list_all_slides(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await slide_service.list_all_slides(db)


@router.post("", response_model=SlideRead)
async def create_slide(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
    title: str | None = Form(None),
    subtitle: str | None = Form(None),
    link_url: str | None = Form(None),
    order_index: int = Form(0),
    active: bool = Form(True),
    image: UploadFile = File(...),
    mobile_image: UploadFile | None = File(None),
):
    data = SlideCreate(
        title=title, subtitle=subtitle, link_url=link_url, order_index=order_index, active=active
    )
    return await slide_service.create_slide(db, data, image, mobile_image, admin)


@router.patch("/{slide_id}", response_model=SlideRead)
async def update_slide(
    slide_id: uuid.UUID,
    payload: SlideUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    slide = await slide_service.get_slide_or_404(db, slide_id)
    return await slide_service.update_slide(db, slide, payload)


@router.delete("/{slide_id}")
async def delete_slide(
    slide_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    slide = await slide_service.get_slide_or_404(db, slide_id)
    await slide_service.delete_slide(db, slide)
    return {"success": True}
