import uuid

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.contact_message import ContactMessage
from app.schemas.contact import ContactMessageCreate


async def create_message(db: AsyncSession, data: ContactMessageCreate) -> ContactMessage:
    message = ContactMessage(**data.model_dump())
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def list_messages(db: AsyncSession) -> list[ContactMessage]:
    result = await db.exec(select(ContactMessage).order_by(ContactMessage.created_at.desc()))
    return list(result.all())


async def get_message_or_404(db: AsyncSession, message_id: uuid.UUID) -> ContactMessage:
    message = await db.get(ContactMessage, message_id)
    if message is None:
        raise AppError("NOT_FOUND", "Message not found.", status.HTTP_404_NOT_FOUND)
    return message


async def mark_read(db: AsyncSession, message: ContactMessage) -> ContactMessage:
    message.is_read = True
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message
