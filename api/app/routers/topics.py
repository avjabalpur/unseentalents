import uuid

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.dependencies import require_role
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.topic import TopicCreate, TopicRead, TopicUpdate
from app.services import topic_service

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("", response_model=list[TopicRead])
async def list_topics(featured: bool = Query(False), db: AsyncSession = Depends(get_db)):
    return await topic_service.list_published_topics(db, featured_only=featured)


@router.get("/admin/all", response_model=list[TopicRead])
async def list_all_topics(
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await topic_service.list_all_topics(db)


@router.get("/{key}", response_model=TopicRead)
async def get_topic(key: str, db: AsyncSession = Depends(get_db)):
    return await topic_service.get_published_topic_by_key(db, key)


@router.post("", response_model=TopicRead)
async def create_topic(
    payload: TopicCreate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await topic_service.create_topic(db, payload, admin)


@router.patch("/{topic_id}", response_model=TopicRead)
async def update_topic(
    topic_id: uuid.UUID,
    payload: TopicUpdate,
    admin: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    topic = await topic_service.get_topic_or_404(db, topic_id)
    return await topic_service.update_topic(db, topic, payload)
