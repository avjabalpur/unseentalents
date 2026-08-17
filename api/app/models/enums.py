from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"
    ORGANIZER = "ORGANIZER"
    USER = "USER"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"


class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class StageName(str, Enum):
    """Mirrors the round pipeline used on unseentalents.com: entries start in
    Backstage, move to the Mainstage, then narrow through Top 60 down to Top 5
    before a Winner is crowned. Events can use any subset/order via order_index."""

    BACKSTAGE = "BACKSTAGE"
    MAINSTAGE = "MAINSTAGE"
    TOP_60 = "TOP_60"
    TOP_50 = "TOP_50"
    TOP_40 = "TOP_40"
    TOP_30 = "TOP_30"
    TOP_15 = "TOP_15"
    TOP_5 = "TOP_5"
    WINNER = "WINNER"


class AdvanceMode(str, Enum):
    AUTO_TOP_N = "AUTO_TOP_N"
    ADMIN_CURATED = "ADMIN_CURATED"


class ParticipationStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ELIMINATED = "ELIMINATED"
    WINNER = "WINNER"


class MediaType(str, Enum):
    VIDEO = "VIDEO"
    IMAGE = "IMAGE"


class ProcessingStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class SubmissionStatus(str, Enum):
    PENDING_MODERATION = "PENDING_MODERATION"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CreditTransactionType(str, Enum):
    WELCOME_BONUS = "WELCOME_BONUS"
    ADMIN_GRANT = "ADMIN_GRANT"
    COUPON_REDEEM = "COUPON_REDEEM"
    PURCHASE = "PURCHASE"
    UPLOAD_SPEND = "UPLOAD_SPEND"
    REFUND = "REFUND"


class CouponStatus(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    DISABLED = "DISABLED"


class TopicStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class ReportTargetType(str, Enum):
    SUBMISSION = "SUBMISSION"
    USER = "USER"


class ReportStatus(str, Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    DISMISSED = "DISMISSED"


class OrganizerApplicationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
