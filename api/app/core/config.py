from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Secret Whiz API"
    environment: str = "development"

    database_url: str = "postgresql+asyncpg://secretwhiz:secretwhiz@localhost:5433/secretwhiz"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    cors_origins: list[str] = ["http://localhost:3333"]

    storage_backend: str = "local"
    storage_root: Path = Path(__file__).resolve().parents[2] / "storage"
    # Never mounted as static — holds files that must only ever be served through an
    # authenticated route (e.g. organizer identity documents).
    private_storage_root: Path = Path(__file__).resolve().parents[2] / "private_storage"

    welcome_credit_amount: int = 2

    api_prefix: str = "/api/v1"

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "+psycopg2")


@lru_cache
def get_settings() -> Settings:
    return Settings()
