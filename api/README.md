# Secret Whiz API

FastAPI backend for Secret Whiz — built with FastAPI, SQLModel, PostgreSQL, Redis, and Alembic. Dependencies are managed with [uv](https://docs.astral.sh/uv/).

## Prerequisites

- Python 3.12 (see `.python-version`)
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Docker (to run PostgreSQL and Redis via the root `docker-compose.yml`), or your own local instances

## Setup

1. **Start PostgreSQL and Redis** (from the repo root):

   ```bash
   docker compose up -d
   ```

   This starts Postgres on `localhost:5433` and Redis on `localhost:6379` (see `docker-compose.yml`).

2. **Configure environment variables**

   ```bash
   cd api
   cp .env.example .env
   ```

   Adjust values in `.env` if needed — the defaults already match the docker-compose services. See [Environment variables](#environment-variables) below.

3. **Install dependencies**

   ```bash
   uv sync
   ```

4. **Run the dev server**

   ```bash
   uv run uvicorn app.main:app --reload --port 8000
   ```

   On startup the app automatically runs Alembic migrations and seeds initial data (see [Database migrations & seed data](#database-migrations--seed-data)) before it starts accepting requests.

The API is then available at `http://localhost:8000`:

- Interactive docs (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- All application routes are mounted under the `/api/v1` prefix (`api_prefix` setting in `app/core/config.py`)

## Database migrations & seed data

Migrations live in `app/alembic/` and run automatically every time the app starts (see the `lifespan` handler in `app/main.py`). Initial reference data (event types, an admin user, etc.) is seeded the same way via `app/seed.py`.

A default admin account is seeded automatically in development:

- Email: `admin@secretwhiz.com`
- Password: `Admin@12345`

You can also run migrations manually:

```bash
# Apply migrations
uv run alembic upgrade head

# Create a new migration after changing models
uv run alembic revision --autogenerate -m "describe your change"
```

## Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `ENVIRONMENT` | Runtime environment name | `development` |
| `DATABASE_URL` | Async Postgres connection string (asyncpg) | `postgresql+asyncpg://secretwhiz:secretwhiz@localhost:5433/secretwhiz` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `JWT_SECRET` | Secret used to sign JWTs — change in production | `dev-secret-change-me` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime (minutes) | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime (days) | `7` |
| `CORS_ORIGINS` | JSON list of allowed CORS origins | `["http://localhost:3333"]` |
| `STORAGE_BACKEND` | Media storage backend | `local` |
| `WELCOME_CREDIT_AMOUNT` | Credits granted to new users | `2` |

## Project layout

```
api/
├── app/
│   ├── alembic/    # Migrations
│   ├── core/       # Config, security, error handling
│   ├── jobs/       # Scheduled jobs (APScheduler)
│   ├── models/     # SQLModel entities
│   ├── routers/    # FastAPI routers (one per resource)
│   ├── schemas/    # Pydantic request/response schemas
│   ├── services/   # Business logic
│   ├── db.py       # Session/engine setup
│   ├── main.py     # App entrypoint (FastAPI instance, lifespan, routers)
│   └── seed.py     # Migration runner + initial data seeding
└── storage/        # Local media storage (when STORAGE_BACKEND=local)
```
