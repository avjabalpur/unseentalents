import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from sqlmodel import Field, SQLModel, UniqueConstraint

from app.models.enums import CouponStatus


class Coupon(SQLModel, table=True):
    __tablename__ = "coupons"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(unique=True, index=True)
    credit_value: int
    max_redemptions: int
    redemptions_count: int = Field(default=0)
    expires_at: datetime | None = Field(default=None, sa_type=sa.DateTime(timezone=True))
    status: CouponStatus = Field(default=CouponStatus.ACTIVE)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))


class CouponRedemption(SQLModel, table=True):
    __tablename__ = "coupon_redemptions"
    __table_args__ = (UniqueConstraint("coupon_id", "user_id", name="uq_coupon_redemption_coupon_user"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    coupon_id: uuid.UUID = Field(foreign_key="coupons.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=sa.DateTime(timezone=True))
