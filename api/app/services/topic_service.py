import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import AppError
from app.models.enums import TopicStatus
from app.models.topic import Topic
from app.models.user import User
from app.schemas.topic import TopicCreate, TopicUpdate


async def list_published_topics(db: AsyncSession, featured_only: bool = False) -> list[Topic]:
    query = select(Topic).where(Topic.status == TopicStatus.PUBLISHED)
    if featured_only:
        query = query.where(Topic.featured.is_(True))
    result = await db.exec(query.order_by(Topic.updated_at.desc()))
    return list(result.all())


async def list_all_topics(db: AsyncSession) -> list[Topic]:
    result = await db.exec(select(Topic).order_by(Topic.updated_at.desc()))
    return list(result.all())


async def get_published_topic_by_key(db: AsyncSession, key: str) -> Topic:
    result = await db.exec(select(Topic).where(Topic.key == key, Topic.status == TopicStatus.PUBLISHED))
    topic = result.first()
    if topic is None:
        raise AppError("NOT_FOUND", "Page not found.", status.HTTP_404_NOT_FOUND)
    return topic


async def get_topic_or_404(db: AsyncSession, topic_id: uuid.UUID) -> Topic:
    topic = await db.get(Topic, topic_id)
    if topic is None:
        raise AppError("NOT_FOUND", "Topic not found.", status.HTTP_404_NOT_FOUND)
    return topic


async def create_topic(db: AsyncSession, data: TopicCreate, admin: User) -> Topic:
    existing = await db.exec(select(Topic).where(Topic.key == data.key))
    if existing.first() is not None:
        raise AppError("TOPIC_KEY_TAKEN", "A page with this key already exists.", status.HTTP_409_CONFLICT)

    topic = Topic(**data.model_dump(), created_by=admin.id)
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return topic


async def update_topic(db: AsyncSession, topic: Topic, data: TopicUpdate) -> Topic:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(topic, field, value)
    topic.updated_at = datetime.now(timezone.utc)
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return topic
