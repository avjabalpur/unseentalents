import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.core.rate_limit import rate_limiter
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.contact import ContactMessageCreate, ContactMessageRead
from app.services import contact_service

router = APIRouter(prefix="/contact", tags=["contact"])

_contact_rate_limit = rate_limiter("contact", limit=5, window_seconds=300)


@router.post("", response_model=ContactMessageRead)
async def submit_contact_message(
    payload: ContactMessageCreate,
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(_contact_rate_limit),
):
    return await contact_service.create_message(db, payload)


@router.get("/admin/all", response_model=list[ContactMessageRead])
async def list_contact_messages(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await contact_service.list_messages(db)


@router.post("/{message_id}/read", response_model=ContactMessageRead)
async def mark_contact_message_read(
    message_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    message = await contact_service.get_message_or_404(db, message_id)
    return await contact_service.mark_read(db, message)
