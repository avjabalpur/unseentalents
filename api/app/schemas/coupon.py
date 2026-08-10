import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import CouponStatus
from app.schemas.base import CamelModel


class CouponCreate(CamelModel):
    code: str
    credit_value: int = Field(gt=0)
    max_redemptions: int = Field(gt=0)
    expires_at: datetime | None = None


class CouponUpdate(CamelModel):
    credit_value: int | None = Field(default=None, gt=0)
    max_redemptions: int | None = Field(default=None, gt=0)
    expires_at: datetime | None = None
    status: CouponStatus | None = None


class CouponRead(CamelModel):
    id: uuid.UUID
    code: str
    credit_value: int
    max_redemptions: int
    redemptions_count: int
    expires_at: datetime | None
    status: CouponStatus


class CouponRedeemRequest(CamelModel):
    code: str
