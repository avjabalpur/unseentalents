# Secret Whiz — Product & Technical Spec

## 1. Overview

Secret Whiz is a social media platform for reality-show style talent competitions
(dancing, singing, painting, makup etc.). Admins configure events with multiple elimination
stages and time windows; users upload one video per event and canvass votes
from other users to advance through stages until a winner is declared.

## 2. Goals

- Configurable event → stage → time-slot model (not hardcoded per competition type).
- Fast, abuse-resistant public voting (this is the highest-traffic, highest-risk part of the system).
- Free/open-source technology across the stack, minimal paid infrastructure during development.
- Room to add AI features later (moderation, fraud detection, highlight generation) without a stack rewrite.
- A credit-based monetization model: users get free welcome credits to upload, then buy more or receive them via admin/coupon grants — this is the app's primary revenue mechanism.

## 3. Modules & Roles

### 3.1 Admin
- Create/manage **Event Types** (Singing, Dancing, Acting, Photography, Painting, ... — extensible), including a cover **image** per event type.
- Create **Events**, each with an ordered set of **Stages** (Submission, Main Stage, Top 50, Top 10, Top 5, Winner, ...).
- Configure each Stage's **time window** (start/end) and **advancement rule**:
  - `AUTO_TOP_N` — top N by vote count auto-advance when the stage closes.
  - `ADMIN_CURATED` — admin manually finalizes the advancing list using vote counts as a signal.
- Manage users, roles, and auth tokens.
- Moderate uploaded videos (approve/reject before public voting).
- Configure the **welcome credit amount** given to new users.
- Issue **coupon codes** (fixed credit value, optional expiry/redemption limit) and **grant credits directly** to a user.

### 3.2 User
- Register/login — receive a **welcome credit balance** automatically.
- Browse events and competitions.
- Upload **one submission per event** during that event's active submission/stage window, **consuming 1 credit** per upload.
- Redeem a **coupon code** or **purchase additional credits** once the welcome balance is used up.
- Share their video to request votes.
- Vote on other users' videos (one vote per user per video per stage) — voting itself stays free/unlimited (rate-limited, not credit-gated).
- Track their own progress across stages (advanced / eliminated / winner).

## 4. Data Model

```
User
 - id, name, email, phone, password_hash, role (ADMIN | USER), status, created_at
 - credit_balance             -- denormalized cache, always updated in the same
                               -- DB transaction as a CreditTransaction insert

EventType
 - id, name (SINGING | DANCING | ACTING | PHOTOGRAPHY | PAINTING | ...), description
 - image_key                  -- cover image, admin-uploaded, via StorageBackend

Event
 - id, name, description, event_type_id, created_by (admin user_id), status

Stage                        (belongs to Event, ordered)
 - id, event_id, name (SUBMISSION | MAIN | TOP_50 | TOP_10 | TOP_5 | WINNER)
 - order_index
 - start_at, end_at
 - advance_mode (AUTO_TOP_N | ADMIN_CURATED)
 - advance_count (nullable, used when AUTO_TOP_N)

Participation                (a user entering a specific Event)
 - id, event_id, user_id, current_stage_id, status (ACTIVE | ELIMINATED | WINNER)
 - UNIQUE(event_id, user_id)

Submission                   (formerly "Video" — generalized to support image-based categories)
 - id, participation_id, stage_id, media_type (VIDEO | IMAGE)
 - storage_key, playback_url or image_url
 - thumbnail_key
 - processing_status (PENDING | PROCESSING | READY | FAILED)   -- thumbnail generation state
 - status (PENDING_MODERATION | APPROVED | REJECTED), uploaded_at
 - UNIQUE(participation_id, stage_id)      -- one submission per user per stage
   -- media_type is driven by the parent EventType (e.g. Singing/Dancing/Acting → VIDEO,
   -- Photography/Painting → IMAGE); enforced in the API layer, not the DB.

Vote
 - id, submission_id, voter_user_id, stage_id, created_at
 - UNIQUE(submission_id, voter_user_id, stage_id)  -- one vote per user per submission per stage

StageResult                  (materialized when a stage closes)
 - id, stage_id, participation_id, vote_count, rank, advanced (bool)

CreditTransaction            (immutable ledger — the source of truth for credit_balance)
 - id, user_id, amount (signed int), balance_after
 - type (WELCOME_BONUS | ADMIN_GRANT | COUPON_REDEEM | PURCHASE | UPLOAD_SPEND | REFUND)
 - reference_id (nullable — points at a Coupon, Payment, or Submission depending on type)
 - created_at

Coupon
 - id, code (UNIQUE), credit_value, max_redemptions, redemptions_count
 - expires_at (nullable), status (ACTIVE | EXPIRED | DISABLED), created_by (admin user_id)

CouponRedemption
 - id, coupon_id, user_id, created_at
 - UNIQUE(coupon_id, user_id)   -- one redemption per user per coupon

Payment                       (real-money credit purchase)
 - id, user_id, credits_purchased, amount_paid, currency
 - gateway (RAZORPAY), gateway_order_id, gateway_payment_id
 - status (PENDING | SUCCESS | FAILED), created_at
```

Constraints doing the heavy lifting:
- `UNIQUE(participation_id, stage_id)` on Submission → enforces one submission per user per stage.
- `UNIQUE(submission_id, voter_user_id, stage_id)` on Vote → enforces one vote per user per submission per stage, checked server-side (never trust the client).

**Initial Event Types (seed data):** Singing, Dancing, Acting, Photography, Painting — Photography/Painting submissions are IMAGE, the rest are VIDEO. More types can be added by the admin at any time without code changes.

## 5. Core Flows

**Upload:** user submits a video or image (media_type determined by the event's EventType) during an active stage window (`now BETWEEN stage.start_at AND stage.end_at`, validated server-side) → check `credit_balance >= 1`, else reject with `402/403 INSUFFICIENT_CREDITS` → atomically deduct 1 credit (`CreditTransaction` type `UPLOAD_SPEND`) and create the submission in the same DB transaction → status `PENDING_MODERATION` → admin approves → submission becomes visible for public voting.

**Credits & monetization:** on registration, a `CreditTransaction` (type `WELCOME_BONUS`) grants the configured welcome amount. Once spent, a user can: redeem a **coupon code** (`POST /coupons/redeem` → validates active/not-expired/not-already-redeemed-by-this-user → `CouponRedemption` + `CreditTransaction` type `COUPON_REDEEM`), have an **admin grant credits directly** (`CreditTransaction` type `ADMIN_GRANT`), or **purchase a credit pack** via Razorpay (`POST /payments/checkout` creates a Razorpay order → on successful payment, a webhook — verified via Razorpay's signature, not user auth — creates the `Payment` record and a `CreditTransaction` type `PURCHASE`). Every balance change is a ledger row, never a bare balance update, so the balance is always reconstructable/auditable.

**Vote:** request hits FastAPI → check stage is currently active → check unique constraint (submission, voter, stage) → increment Redis counter for the live leaderboard → async write-through to Postgres. Redis absorbs the burst; Postgres stays consistent without being hit on every single vote.

**Stage close:** APScheduler job fires at `stage.end_at` → computes `StageResult` from vote counts → if `AUTO_TOP_N`, marks top N `advanced = true` and creates their next-stage `Participation` automatically; if `ADMIN_CURATED`, notifies admin to review and finalize → eliminated users get notified.

**Thumbnail generation:** immediately after a Submission is saved, a FastAPI `BackgroundTask` generates its thumbnail without blocking the upload response — video uses **FFmpeg** to extract a frame (~1–2s in, not frame 0), images use **Pillow** to produce a resized copy. Result is saved via the same `StorageBackend` and `thumbnail_key`/`processing_status` are updated. A periodic **APScheduler sweep job** finds any Submission stuck in `PENDING`/`PROCESSING` (e.g. after a crash) and retries — this avoids needing a dedicated task queue for something this lightweight. Admin moderation UI shows a "processing" placeholder until `processing_status = READY`.

## 6. Technology Stack

This is the required stack for the project — components should not be swapped without updating this document.

| Component | Technology | Reason |
|---|---|---|
| Frontend | **Next.js (React)** | SSR for public event/leaderboard pages, fast first paint, good SEO for shareable video pages |
| UI styling | **Tailwind CSS** + **shadcn/ui** | Free, fast to build with; shadcn/ui gives accessible form/table/dialog components for the CRUD-heavy Admin module without hand-building them |
| Backend API | **Python FastAPI** | Async-native (needed for vote-burst throughput), automatic OpenAPI docs, same language as future AI features |
| ORM | **SQLModel** (SQLAlchemy 2.0 async core) | One schema shared between Pydantic validation and DB models, async query support |
| Migrations | **Alembic** | Standard with SQLAlchemy/SQLModel |
| Database | **PostgreSQL** | Relational integrity for stage ordering, unique vote/upload constraints; free/open-source |
| Admin CRUD screens | **SQLAdmin** (optional, evaluate during scaffold) | Auto-generates admin CRUD from SQLModel classes — avoids hand-building basic Admin CRUD in Next.js |
| Cache & live counters | **Redis** | Absorbs vote-burst writes, powers live leaderboard reads without hammering Postgres |
| Scheduled jobs (stage auto-close) | **APScheduler** (Postgres-backed job store) | No extra infrastructure beyond the DB you already run; ideal for time-window-driven stage transitions. Single-instance only — revisit before running multiple API replicas |
| Lightweight async side-effects | **FastAPI `BackgroundTasks`** | Zero-setup, in-request notifications (e.g. "vote received") + thumbnail generation trigger |
| Thumbnail generation | **FFmpeg** (video frame extract) + **Pillow** (image resize) | Both free/open-source; FFmpeg binary bundled in the API Docker image, Pillow as a Python dependency — no new infra |
| Task queue (future/heavier jobs) | **Celery + Redis** (added later, not in MVP) | For transcoding callbacks, AI moderation jobs, retries — introduced only once actually needed |
| File storage (MVP/dev) | **Local server filesystem**, behind a swappable `StorageBackend` interface (`save`/`get_url`/`delete`), mounted as a Docker volume | Zero cost, zero extra infra during development; served via Starlette `StaticFiles` for Range-request support (video seeking) |
| File storage (future) | **AWS S3** as the first drop-in replacement (same interface, new backend); Cloudflare R2 or a CDN in front as a later cost-optimization once egress volume matters | S3 has a 12-month free tier but charges egress — fine for the traffic level right after launch, revisit before viral-scale voting traffic |
| Auth | **JWT (access + refresh)** via FastAPI dependencies, RBAC guards | Stateless, works well with async API |
| Payment gateway | **Razorpay** | Standard for Indian users (UPI/cards/netbanking), free sandbox/test mode for development — the one component with an inherent real-money transaction fee in production, unavoidable when handling actual payments |
| Hosting (MVP) | Single Docker Compose stack on a low-cost VPS or free-tier host (Railway/Render/Fly) | Avoid managed-service costs until real traffic justifies them |
| AI (future) | In-process Python (PyTorch/HF) or a separate inference microservice called from FastAPI | Moderation, vote-fraud/anomaly detection, auto-highlight generation |

All components above are free and open-source for development; the only future paid cost is storage egress/CDN once traffic is real.

## 7. Performance ("speed") Strategy

Speed is a first-class requirement, particularly around voting, since traffic will spike sharply near stage deadlines.

- **Async everywhere in the API path**: FastAPI + async SQLAlchemy + async Redis client — no blocking I/O in the vote/upload endpoints.
- **Redis as the vote hot path**: votes increment a Redis counter (and are deduped there via a `SETNX`-style check) before being persisted to Postgres asynchronously in batches — the user-facing request never waits on a Postgres write.
- **Leaderboards read from Redis**, not Postgres, to keep public "current standings" pages fast under load.
- **Database indexing**: composite indexes on `(event_id, user_id)`, `(submission_id, voter_user_id, stage_id)`, `(stage_id)` for all high-frequency lookups.
- **Video/image delivery via CDN** once storage moves off local disk (see storage rows in the tech stack), never served directly from the API process.
- **Stateless API instances** behind a load balancer so the backend can be horizontally scaled during vote-deadline traffic spikes.
- **Rate limiting** (Redis-backed) on vote and upload endpoints to protect against both abuse and accidental self-inflicted load.

## 8. MVP Scope vs Phase 2

**MVP:**
- Event/EventType/Stage/Participation/Submission/Vote core flow.
- Admin-curated stage advancement (simpler than auto-rules).
- Basic submission moderation (manual approve/reject).
- JWT auth + RBAC (Admin/User).
- APScheduler-driven stage windows.
- Redis-backed voting with rate limiting.
- Credit ledger: welcome bonus, admin grants, coupon redemption, upload-spend — all without needing a live payment gateway.

**Phase 2:**
- `AUTO_TOP_N` automatic advancement rules.
- Celery-based task queue for transcoding callbacks and notifications at scale.
- AI-assisted content moderation and vote-fraud/anomaly detection.
- **Razorpay purchase flow** for buying credit packs with real money — deferred slightly past MVP mainly because payment-gateway business KYC/approval takes real-world lead time independent of the code; the ledger/coupon system already lets you monetize via manually-sold coupon codes or sponsorships before this is wired up.
- Paid/token-based voting or premium features.
- Real-time leaderboard via WebSockets.

## 9. Related Documents

Detailed architecture/convention docs, kept in sync with this spec — read
these before implementing the corresponding layer:

- [`docs/ui-architecture.md`](docs/ui-architecture.md) — Next.js structure, component
  patterns (shared vs admin vs user), naming, state management, styling.
- [`docs/api-architecture.md`](docs/api-architecture.md) — REST/JSON/JWT protocol,
  URL conventions, error format, FastAPI project layout, layered architecture.
- [`docs/database-architecture.md`](docs/database-architecture.md) — table/column
  conventions, primary key strategy, enum strategy, indexing, migrations.
