# API Architecture — FastAPI Backend

## 1. Application Protocol

- **REST over HTTPS**, JSON request and response bodies.
- **Base path versioning**: every route lives under `/api/v1/...` so breaking
  changes later can ship as `/api/v2` without disrupting existing clients.
- **Auth**: JWT Bearer tokens. Access token (~15 min expiry) sent as
  `Authorization: Bearer <token>`; refresh token (~7 day expiry) issued as an
  httpOnly cookie, exchanged via `POST /api/v1/auth/refresh`. Never store the
  refresh token in `localStorage`.
- **Field casing**: Python/DB stay `snake_case` (idiomatic); Pydantic schemas
  use `alias_generator` to emit/accept `camelCase` over the wire, so the
  Next.js frontend gets idiomatic JS naming without the backend compromising
  its own conventions.
- **Success responses**: return the resource directly for single-item
  endpoints; list endpoints return an envelope:
  ```json
  { "items": [ ... ], "total": 132, "limit": 20, "offset": 0 }
  ```
- **Error responses**: one consistent envelope across every endpoint —
  ```json
  { "error": { "code": "STAGE_CLOSED", "message": "This stage is no longer accepting submissions.", "details": {} } }
  ```
  paired with the correct HTTP status (`400` validation, `401` unauthenticated,
  `403` forbidden/role, `404` not found, `409` conflict e.g. duplicate vote,
  `422` schema validation, `500` unexpected). `code` is a stable machine-readable
  string the frontend can switch on; `message` is human-readable fallback text.
- **Idempotency on vote/upload endpoints**: rely on the DB unique constraints
  (`submission_id + voter_user_id + stage_id`, `participation_id + stage_id`)
  and surface violations as `409 DUPLICATE_VOTE` / `409 SUBMISSION_EXISTS`
  rather than silently succeeding twice.

### CORS & Cross-Origin

The Next.js frontend calls FastAPI **directly from the browser** — there is no
Next.js API layer/proxy in front of it (see `ui-architecture.md`). This means:

- **Local development ports**: Next.js runs on **3333**, FastAPI on **9999**
  (`next dev -p 3333`, `uvicorn app.main:app --port 9999 --reload`) —
  intentionally non-default so they don't collide with other projects running
  locally. `NEXT_PUBLIC_API_URL=http://localhost:9999`.
- FastAPI's CORS middleware must allow the frontend origin **explicitly**
  (`https://app.secretwhiz.com`, and `http://localhost:3333` in dev) with
  `allow_credentials=True`. Never use `allow_origins=["*"]` once credentials
  are involved — browsers reject wildcard origins on credentialed requests.
- **Deploy the frontend and API under the same parent (registrable) domain**
  — e.g. `app.secretwhiz.com` (Next.js) and `api.secretwhiz.com` (FastAPI) —
  so the httpOnly refresh-token cookie can be scoped to `Domain=secretwhiz.com`
  and sent cross-subdomain under `SameSite=Lax`. If frontend and API ever end
  up on unrelated domains, this cookie-based refresh flow breaks and needs to
  be redesigned (e.g. moved to a token-rotation-on-access endpoint) — avoid
  that by keeping them on one parent domain from the start.
- In local development, `localhost:3333` and `localhost:9999` are same-site
  (same registrable host, different port), so the refresh cookie still works
  under `SameSite=Lax` — only the explicit CORS origin allowlist needs the
  dev URL added.
- **Exception — payment webhooks**: `POST /api/v1/payments/webhook` is called
  server-to-server by Razorpay, not the browser, so it's exempt from both CORS
  and JWT auth. It's instead authenticated by verifying Razorpay's HMAC
  signature header on every request — treat an invalid/missing signature as a
  `401`, never process an unsigned payload.

## 2. URL & Resource Conventions

- Plural nouns, kebab-case in the path, nested only one level deep:
  - `GET/POST /api/v1/event-types`
  - `GET/POST /api/v1/events`
  - `GET /api/v1/events/{event_id}/stages`
  - `POST /api/v1/stages/{stage_id}/submissions`
  - `POST /api/v1/submissions/{submission_id}/votes`
  - `GET /api/v1/stages/{stage_id}/leaderboard`
  - `GET /api/v1/users/me/credits` — current balance + transaction history
  - `POST /api/v1/coupons` (admin) / `POST /api/v1/coupons/redeem` (user)
  - `POST /api/v1/payments/checkout` — creates a Razorpay order for a credit pack
  - `POST /api/v1/payments/webhook` — Razorpay callback (see CORS section for its auth exception)
  - `POST /api/v1/admin/users/{user_id}/credits` — admin direct credit grant
- Admin-only routes are **not** a separate `/admin/*` API prefix — they're the
  same resources, gated by role via a dependency (`require_role(Role.ADMIN)`),
  so there's one source of truth per resource instead of duplicated admin/user
  endpoints.
- Pagination via `?limit=&offset=` query params on every list endpoint,
  defaulting to `limit=20`.

## 3. Project Structure

```
api/
  app/
    main.py                  # FastAPI() instance, router registration, middleware, CORS
    core/
      config.py               # pydantic-settings, reads env vars (DB url, JWT secret, storage backend)
      security.py              # JWT encode/decode, password hashing (passlib)
      dependencies.py          # get_db, get_current_user, require_role, pagination params
    models/                   # SQLModel table models — one file per entity
      user.py
      event_type.py
      event.py
      stage.py
      participation.py
      submission.py
      vote.py
      stage_result.py
      credit_transaction.py
      coupon.py
      payment.py
    schemas/                  # Pydantic request/response schemas, not DB models
      event.py                 # EventCreate, EventUpdate, EventRead
      submission.py
      vote.py
      credit.py
      coupon.py
      payment.py
      ...
    routers/                  # one file per resource, thin — validation + delegate to services
      auth.py
      event_types.py
      events.py
      stages.py
      submissions.py
      votes.py
      users.py
      coupons.py
      payments.py
    services/                 # business logic — the only place rules like
      stage_service.py         # "is this stage open", "compute StageResult" live
      submission_service.py    # enforce one-per-stage, trigger thumbnail job
      vote_service.py          # enforce one-per-user, Redis counter + async DB write-through
      credit_service.py        # the only place credit_balance is mutated — always
                                # inside a DB transaction alongside a CreditTransaction row
      payment_service.py       # Razorpay order creation + webhook signature verification
    storage/
      base.py                  # StorageBackend interface (save/get_url/delete)
      local.py                 # filesystem implementation (MVP)
      s3.py                     # S3 implementation (future)
    jobs/                     # APScheduler job definitions
      stage_close_job.py
      thumbnail_sweep_job.py
    media/
      thumbnail.py              # FFmpeg / Pillow thumbnail generation functions
    alembic/                  # migrations
  tests/
    test_events.py
    test_votes.py
    ...
```

## 4. Layered Architecture

**Router → Service → Model (DB).** Routers are intentionally thin: parse/validate
the request (Pydantic does this automatically), call a service function, return
its result. All business rules — "is the stage currently open," "has this user
already voted," "compute stage results" — live in `services/`, never in a
router body and never in a React component. This keeps the rules testable
without spinning up HTTP, and keeps routers readable as a map of the API surface.

This split is enforced strictly, not just as a style preference: **no router
function may call `db.exec`, `db.get`, `db.add`, `db.commit`, `db.refresh`, or
`db.delete`.** Even a single-row lookup used only to enrich a response (e.g.
resolving an actor's name for an activity-log entry) goes through a service
function. A router's job ends at parsing the request, resolving the URL, calling
service function(s), mapping the result onto the response schema, and
translating domain errors to HTTP status codes.

Within services, the transaction boundary follows one convention: a **top-level
service function** — one called directly by a router — owns the unit of work
and calls `await db.commit()` (+ `db.refresh()`) before returning. A
**composable/leaf service function** — one called by another service function
rather than by a router — calls `db.flush()` only, never commits, so it can be
combined inside a caller's larger transaction. `credit_service.grant_credit()`
is the reference example: it flushes so it can be reused inside
`submission_service.upload_submission()`'s larger transaction, while
`user_service.grant_credit()` (called directly by the router) wraps it and
commits.

## 5. Naming Conventions (Python)

| Item | Convention | Example |
|---|---|---|
| Files, functions, variables | `snake_case` | `submission_service.py`, `get_active_stage()` |
| Classes (models, schemas) | `PascalCase` | `class Submission(SQLModel, table=True)` |
| Pydantic schema suffixes | `{Entity}Create`, `{Entity}Update`, `{Entity}Read` | `EventCreate`, `EventRead` |
| Router prefix/tag | matches resource plural | `router = APIRouter(prefix="/events", tags=["events"])` |
| Enum values | `UPPER_SNAKE_CASE` | `PENDING_MODERATION`, `AUTO_TOP_N` |

## 6. Auth & Roles

- Two roles for MVP: `ADMIN`, `USER`. Enforced via a FastAPI dependency
  (`require_role(Role.ADMIN)`) applied per-route, not per-router, so a router
  file can mix public, user, and admin-only endpoints for the same resource
  when that's the natural grouping (e.g. `events.py` has a public `GET` list
  and an admin-only `POST`).
- Ownership checks (a user can only vote once, can only upload their own
  submission) happen in the service layer against `current_user.id`, never
  trusted from a request body.
