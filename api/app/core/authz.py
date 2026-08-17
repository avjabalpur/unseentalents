import uuid

from fastapi import status

from app.core.errors import AppError
from app.models.enums import UserRole
from app.models.user import User


def assert_owner_or_staff(actor: User, owner_id: uuid.UUID) -> None:
    if actor.role in (UserRole.ADMIN, UserRole.MODERATOR):
        return
    if actor.role == UserRole.ORGANIZER and actor.id == owner_id:
        return
    raise AppError("FORBIDDEN", "You do not have permission to perform this action.", status.HTTP_403_FORBIDDEN)
