import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import Pagination
from app.core.errors import AppError
from app.models.enums import OrganizerApplicationStatus, UserRole
from app.models.organizer_application import OrganizerApplication
from app.models.user import User
from app.schemas.organizer_application import OrganizerApplicationRead
from app.services import activity_log_service, user_service
from app.storage.local import LocalStorageBackend

settings = get_settings()


def _private_storage() -> LocalStorageBackend:
    return LocalStorageBackend(root=settings.private_storage_root)


async def create_application(
    db: AsyncSession,
    user: User,
    file: UploadFile,
    legal_name: str,
    address: str,
    id_document_type: str,
    id_document_number: str,
    organization_name: str | None,
    reason: str | None,
) -> OrganizerApplication:
    if user.role in (UserRole.ORGANIZER, UserRole.ADMIN, UserRole.MODERATOR):
        raise AppError(
            "ALREADY_PRIVILEGED", "Your account already has organizer or staff access.", status.HTTP_400_BAD_REQUEST
        )

    existing = await db.exec(
        select(OrganizerApplication).where(
            OrganizerApplication.user_id == user.id,
            OrganizerApplication.status == OrganizerApplicationStatus.PENDING,
        )
    )
    if existing.first() is not None:
        raise AppError(
            "APPLICATION_PENDING", "You already have an organizer application under review.", status.HTTP_409_CONFLICT
        )

    extension = Path(file.filename or "").suffix.lower() or ".bin"
    key = f"organizer-docs/{user.id}/{uuid.uuid4()}{extension}"
    await _private_storage().save(file, key)

    application = OrganizerApplication(
        user_id=user.id,
        legal_name=legal_name,
        address=address,
        id_document_type=id_document_type,
        id_document_number=id_document_number,
        id_document_key=key,
        organization_name=organization_name,
        reason=reason,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application


async def get_application_or_404(db: AsyncSession, application_id: uuid.UUID) -> OrganizerApplication:
    application = await db.get(OrganizerApplication, application_id)
    if application is None:
        raise AppError("NOT_FOUND", "Organizer application not found.", status.HTTP_404_NOT_FOUND)
    return application


async def get_latest_for_user(db: AsyncSession, user_id: uuid.UUID) -> OrganizerApplication | None:
    result = await db.exec(
        select(OrganizerApplication)
        .where(OrganizerApplication.user_id == user_id)
        .order_by(OrganizerApplication.created_at.desc())
        .limit(1)
    )
    return result.first()


async def list_applications(
    db: AsyncSession, pagination: Pagination, status_filter: OrganizerApplicationStatus | None = None
) -> list[OrganizerApplication]:
    query = select(OrganizerApplication)
    if status_filter is not None:
        query = query.where(OrganizerApplication.status == status_filter)
    query = query.order_by(OrganizerApplication.created_at.desc()).limit(pagination.limit).offset(pagination.offset)
    result = await db.exec(query)
    return list(result.all())


async def resolve_application(
    db: AsyncSession,
    application: OrganizerApplication,
    new_status: OrganizerApplicationStatus,
    admin: User,
    rejection_reason: str | None = None,
) -> OrganizerApplication:
    if application.status != OrganizerApplicationStatus.PENDING:
        raise AppError(
            "ALREADY_RESOLVED", "This application has already been reviewed.", status.HTTP_409_CONFLICT
        )

    application.status = new_status
    application.rejection_reason = rejection_reason if new_status == OrganizerApplicationStatus.REJECTED else None
    application.reviewed_by = admin.id
    application.reviewed_at = datetime.now(timezone.utc)
    application.updated_at = datetime.now(timezone.utc)
    db.add(application)

    activity_log_service.record(
        db,
        "ORGANIZER_APPLICATION",
        application.id,
        f"APPLICATION_{new_status.value}",
        actor_id=admin.id,
    )

    if new_status == OrganizerApplicationStatus.APPROVED:
        await user_service.update_role(db, application.user_id, UserRole.ORGANIZER, admin)

    await db.commit()
    await db.refresh(application)
    return application


def get_document_path(application: OrganizerApplication) -> Path:
    return _private_storage().get_path(application.id_document_key)


async def to_read(db: AsyncSession, application: OrganizerApplication) -> OrganizerApplicationRead:
    data = OrganizerApplicationRead.model_validate(application)
    applicant = await db.get(User, application.user_id)
    if applicant is not None:
        data.applicant_name = applicant.name
        data.applicant_username = applicant.username
    if application.reviewed_by is not None:
        reviewer = await db.get(User, application.reviewed_by)
        if reviewer is not None:
            data.reviewer_name = reviewer.name
    return data
