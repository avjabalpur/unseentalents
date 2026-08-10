export type UserRole = "ADMIN" | "MODERATOR" | "USER";
export type UserStatus = "ACTIVE" | "SUSPENDED";
export type MediaType = "VIDEO" | "IMAGE";
export type EventStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ComputedEventStatus = "UPCOMING" | "ONGOING" | "CLOSED";
export type StageName =
  | "BACKSTAGE"
  | "MAINSTAGE"
  | "TOP_60"
  | "TOP_50"
  | "TOP_40"
  | "TOP_30"
  | "TOP_15"
  | "TOP_5"
  | "WINNER";
export type AdvanceMode = "AUTO_TOP_N" | "ADMIN_CURATED";
export type ParticipationStatus = "ACTIVE" | "ELIMINATED" | "WINNER";
export type ProcessingStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type SubmissionStatus = "PENDING_MODERATION" | "APPROVED" | "REJECTED";
export type CreditTransactionType =
  | "WELCOME_BONUS"
  | "ADMIN_GRANT"
  | "COUPON_REDEEM"
  | "PURCHASE"
  | "UPLOAD_SPEND"
  | "REFUND";
export type CouponStatus = "ACTIVE" | "EXPIRED" | "DISABLED";
export type TopicStatus = "DRAFT" | "PUBLISHED";
export type ReportTargetType = "SUBMISSION" | "USER";
export type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  creditBalance: number;
  createdAt: string;
  avatarKey: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
}

export interface EventType {
  id: string;
  name: string;
  description: string | null;
  imageKey: string | null;
  submissionMediaType: MediaType;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  eventTypeId: string;
  status: EventStatus;
  createdAt: string;
  computedStatus: ComputedEventStatus | null;
  currentStageName: StageName | null;
  firstStageStartAt: string | null;
  finalStageEndAt: string | null;
  stages: Stage[];
}

export interface Stage {
  id: string;
  eventId: string;
  name: StageName;
  orderIndex: number;
  startAt: string;
  endAt: string;
  advanceMode: AdvanceMode;
  advanceCount: number | null;
}

export interface Prize {
  id: string;
  eventId: string;
  rank: number;
  title: string;
  reward: string;
}

export interface Participation {
  id: string;
  eventId: string;
  userId: string;
  currentStageId: string;
  status: ParticipationStatus;
}

export interface Vote {
  id: string;
  submissionId: string;
  stageId: string;
}

export interface Submission {
  id: string;
  participationId: string;
  stageId: string;
  mediaType: MediaType;
  storageKey: string;
  thumbnailKey: string | null;
  title: string | null;
  notes: string | null;
  processingStatus: ProcessingStatus;
  status: SubmissionStatus;
  rejectionReason: string | null;
  uploadedAt: string;
  voteCount: number;
  ownerName: string | null;
  ownerUsername: string | null;
  eventId: string | null;
  eventName: string | null;
}

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  actorName: string | null;
  actorUsername: string | null;
  action: string;
  logMetadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string | null;
  reporterUsername: string | null;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  notes: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface SiteSettings {
  id: string;
  welcomeCreditAmount: number;
  maxUploadSizeMb: number;
  maintenanceMode: boolean;
  updatedAt: string;
}

export interface Comment {
  id: string;
  submissionId: string;
  content: string;
  createdAt: string;
  authorName: string | null;
  authorUsername: string | null;
}

export interface StageResult {
  id: string;
  stageId: string;
  participationId: string;
  voteCount: number;
  rank: number;
  advanced: boolean;
}

export interface CreditBalance {
  creditBalance: number;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  type: CreditTransactionType;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  creditValue: number;
  maxRedemptions: number;
  redemptionsCount: number;
  expiresAt: string | null;
  status: CouponStatus;
}

export interface CountItem {
  label: string;
  count: number;
}

export interface PublicSummary {
  eventsCount: number;
  categoriesCount: number;
  submissionsCount: number;
  prizesCount: number;
}

export interface AdminStats {
  submissionsByEvent: CountItem[];
  submissionsByEventType: CountItem[];
  submissionsByStatus: CountItem[];
  votesByEvent: CountItem[];
  usersByRole: CountItem[];
  eventsByStatus: CountItem[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Topic {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  htmlContent: string;
  featured: boolean;
  status: TopicStatus;
  updatedAt: string;
}

export interface Slide {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageKey: string;
  mobileImageKey: string | null;
  linkUrl: string | null;
  orderIndex: number;
  active: boolean;
  updatedAt: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
