import uuid

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import CurrentUser, Pagination, require_role
from app.db import get_db
from app.models.enums import OrganizerApplicationStatus, UserRole
from app.models.user import User
from app.schemas.organizer_application import OrganizerApplicationRead, OrganizerApplicationResolve
from app.services import organizer_application_service

router = APIRouter(tags=["organizer-applications"])


@router.post("/organizer-applications", response_model=OrganizerApplicationRead)
async def submit_organizer_application(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
    legal_name: str = Form(...),
    address: str = Form(...),
    id_document_type: str = Form(...),
    id_document_number: str = Form(...),
    organization_name: str | None = Form(None),
    reason: str | None = Form(None),
):
    application = await organizer_application_service.create_application(
        db, current_user, file, legal_name, address, id_document_type, id_document_number, organization_name, reason
    )
    return await organizer_application_service.to_read(db, application)


@router.get("/organizer-applications/me", response_model=OrganizerApplicationRead | None)
async def my_organizer_application(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    application = await organizer_application_service.get_latest_for_user(db, current_user.id)
    if application is None:
        return None
    return await organizer_application_service.to_read(db, application)


@router.get("/admin/organizer-applications", response_model=list[OrganizerApplicationRead])
async def list_organizer_applications(
    status: OrganizerApplicationStatus | None = None,
    pagination: Pagination = Depends(Pagination),
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    applications = await organizer_application_service.list_applications(db, pagination, status_filter=status)
    return [await organizer_application_service.to_read(db, a) for a in applications]


@router.patch("/admin/organizer-applications/{application_id}", response_model=OrganizerApplicationRead)
async def resolve_organizer_application(
    application_id: uuid.UUID,
    payload: OrganizerApplicationResolve,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    application = await organizer_application_service.get_application_or_404(db, application_id)
    updated = await organizer_application_service.resolve_application(
        db, application, payload.status, admin, payload.rejection_reason
    )
    return await organizer_application_service.to_read(db, updated)


@router.get("/admin/organizer-applications/{application_id}/document")
async def get_organizer_application_document(
    application_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    application = await organizer_application_service.get_application_or_404(db, application_id)
    path = organizer_application_service.get_document_path(application)
    return FileResponse(path)
