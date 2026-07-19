# Database Architecture — PostgreSQL

## 1. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Table names | `snake_case`, plural | `event_types`, `stages`, `submissions` |
| Column names | `snake_case` | `created_at`, `event_type_id` |
| Foreign key columns | `{referenced_table_singular}_id` | `event_id`, `stage_id`, `participation_id` |
| Primary key | always `id` | — |
| Enum types | Postgres native `ENUM`, `UPPER_SNAKE_CASE` values | `role`, `submission_status`, `media_type` |
| Indexes | `ix_{table}_{columns}` | `ix_votes_submission_voter_stage` |
| Migration files (Alembic) | timestamp + short slug | `2026_07_20_1030_add_submission_media_type.py` |

## 2. Primary Keys

Use **UUID (v4)** primary keys, not auto-incrementing integers, on every table.
Reason: submission/event/vote IDs are exposed in public URLs and share links
("vote for my video") — sequential integer IDs let anyone enumerate every
submission/user in the system by incrementing a number. UUIDs cost a small
amount of index size in exchange for not leaking scale/enumerable data.

## 3. Standard Columns

Every table includes:
```
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()   -- bumped by app layer on update
```

## 4. Core Tables

```sql
users
  id, name, username UNIQUE, email UNIQUE, phone, password_hash,
  role            user_role ENUM('ADMIN','USER'),
  status          user_status ENUM('ACTIVE','SUSPENDED'),
  credit_balance  INT NOT NULL DEFAULT 0,   -- denormalized cache of credit_transactions
  created_at, updated_at

event_types
  id, name UNIQUE, description, image_key,
  created_at, updated_at

events
  id, name, description,
  event_type_id   FK -> event_types.id,
  created_by      FK -> users.id,
  status          event_status ENUM('DRAFT','PUBLISHED','ARCHIVED'),
  created_at, updated_at

stages
  id, event_id FK -> events.id,
  name            stage_name ENUM('SUBMISSION','MAIN','TOP_50','TOP_10','TOP_5','WINNER'),
  order_index     INT,
  start_at, end_at TIMESTAMPTZ,
  advance_mode    advance_mode ENUM('AUTO_TOP_N','ADMIN_CURATED'),
  advance_count   INT NULL,
  created_at, updated_at
  UNIQUE(event_id, order_index)

participations
  id, event_id FK -> events.id, user_id FK -> users.id,
  current_stage_id FK -> stages.id,
  status          participation_status ENUM('ACTIVE','ELIMINATED','WINNER'),
  created_at, updated_at
  UNIQUE(event_id, user_id)

submissions
  id, participation_id FK -> participations.id, stage_id FK -> stages.id,
  media_type       media_type ENUM('VIDEO','IMAGE'),
  storage_key, thumbnail_key,
  processing_status submission_processing_status ENUM('PENDING','PROCESSING','READY','FAILED'),
  status           submission_status ENUM('PENDING_MODERATION','APPROVED','REJECTED'),
  uploaded_at TIMESTAMPTZ,
  created_at, updated_at
  UNIQUE(participation_id, stage_id)

votes
  id, submission_id FK -> submissions.id, voter_user_id FK -> users.id,
  stage_id FK -> stages.id,
  created_at
  UNIQUE(submission_id, voter_user_id, stage_id)

stage_results
  id, stage_id FK -> stages.id, participation_id FK -> participations.id,
  vote_count INT, rank INT, advanced BOOLEAN,
  created_at
  UNIQUE(stage_id, participation_id)

credit_transactions             -- immutable ledger; never UPDATE or DELETE a row
  id, user_id FK -> users.id,
  amount          INT,           -- signed: positive = credit, negative = debit
  balance_after   INT,           -- snapshot of users.credit_balance post-transaction
  type            credit_transaction_type ENUM(
                    'WELCOME_BONUS','ADMIN_GRANT','COUPON_REDEEM',
                    'PURCHASE','UPLOAD_SPEND','REFUND'),
  reference_id    UUID NULL,      -- coupon_id / payment_id / submission_id depending on type
  created_at

coupons
  id, code UNIQUE, credit_value INT,
  max_redemptions INT, redemptions_count INT DEFAULT 0,
  expires_at      TIMESTAMPTZ NULL,
  status          coupon_status ENUM('ACTIVE','EXPIRED','DISABLED'),
  created_by      FK -> users.id,
  created_at, updated_at

coupon_redemptions
  id, coupon_id FK -> coupons.id, user_id FK -> users.id,
  created_at
  UNIQUE(coupon_id, user_id)

payments
  id, user_id FK -> users.id,
  credits_purchased INT, amount_paid NUMERIC(10,2), currency VARCHAR(3) DEFAULT 'INR',
  gateway            payment_gateway ENUM('RAZORPAY'),
  gateway_order_id, gateway_payment_id,
  status             payment_status ENUM('PENDING','SUCCESS','FAILED'),
  created_at, updated_at
```

**Credit balance integrity:** `users.credit_balance` is a denormalized cache —
every write to it happens in the *same* DB transaction as the
`credit_transactions` insert that justifies it (welcome bonus, spend, grant,
redemption, purchase). Never update `credit_balance` on its own. This keeps
the ledger authoritative: balance can always be recomputed as
`SUM(amount) WHERE user_id = ...` if the cache and ledger ever disagree.

## 5. Enum Strategy

Use **native Postgres `ENUM` types**, not free-text `VARCHAR` + app-level
checks. Reasoning: these value sets (roles, statuses, stage names, media
types) are small, stable, and their integrity matters (a typo'd status string
should be impossible, not just unlikely). Managed through Alembic
(`op.execute("CREATE TYPE ...")` / `sa.Enum(...)`), and adding a new enum
value later is a normal, low-risk migration.

## 6. Soft Delete vs Hard Delete

- **`events` and `event_types`**: never hard-deleted — use `status = ARCHIVED`.
  Reasoning: historical events/results need to remain viewable/auditable even
  after a competition ends; hard-deleting would break past winner records.
- **`submissions` rejected in moderation**: hard-delete is acceptable after a
  retention window (e.g. 30 days), since rejected content has no downstream
  reference once the moderation decision is made.
- **`users`**: soft-delete via `status = SUSPENDED`, never hard-deleted while
  they have any `participations`/`votes` referencing them (FK integrity).

## 7. Indexing Strategy

Postgres automatically indexes `UNIQUE` constraints, which already cover the
hottest lookups:
- `(event_id, user_id)` on `participations`
- `(participation_id, stage_id)` on `submissions`
- `(submission_id, voter_user_id, stage_id)` on `votes`

Additional indexes to add explicitly:
- `stages(event_id, order_index)` — used every time a stage pipeline is rendered.
- `submissions(stage_id, status)` — the moderation queue and public "approved
  submissions for this stage" queries both filter on this pair.
- `votes(stage_id)` — used when aggregating vote counts per stage at stage-close.
- `credit_transactions(user_id, created_at)` — used for a user's transaction history and for reconstructing/verifying `credit_balance`.
- `payments(user_id, status)` — used to look up a user's purchase history and pending payments.

## 8. Migrations

- **Alembic**, one migration per logical schema change — never hand-edit a
  migration that has already been applied to any shared environment; create a
  new one instead.
- Every migration must be reversible (`downgrade()` implemented), even in
  early development, so the team can safely experiment with schema changes.
