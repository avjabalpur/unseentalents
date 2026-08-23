import uuid

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_db
from app.schemas.organizer_directory import OrganizerProfileRead, OrganizerPublicRead
from app.services import organizer_directory_service

router = APIRouter(prefix="/organizers", tags=["organizers"])


@router.get("", response_model=list[OrganizerPublicRead])
async def list_organizers(db: AsyncSession = Depends(get_db)):
    return await organizer_directory_service.list_organizers(db)


@router.get("/{organizer_id}", response_model=OrganizerProfileRead)
async def get_organizer_profile(organizer_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await organizer_directory_service.get_organizer_profile(db, organizer_id)
