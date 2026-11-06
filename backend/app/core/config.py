from typing import ClassVar

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database. POSTGRES_URL is the canonical setting (Render deployment);
    # DATABASE_URL is Neon-managed — written to the project-root .env.local
    # by `neon deploy` and used as a fallback when POSTGRES_URL is default.
    LOCAL_POSTGRES_DEFAULT: ClassVar[str] = (
        "postgresql+psycopg://user:password@localhost:5432/suntech_db"
    )
    POSTGRES_URL: str = LOCAL_POSTGRES_DEFAULT
    DATABASE_URL: str = ""

    # FastAPI
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"

    # CORS (frontend origins allowed to call this API)
    BACKEND_CORS_ORIGINS: list[str] = Field(default_factory=list)

    # Auth — single-operator (admin) account for the MVP back office.
    # When shared customer/staff accounts arrive, move to a users table
    # with hashed passwords; until then compare_digest against env values.
    SECRET_KEY: str = ""  # empty => ephemeral key (tokens die on restart)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = ""  # empty => nobody can log in (locked by default)

    # Rate limiting (public lead submission)
    RATE_LIMIT_LEAD_CREATE_PER_MINUTE: int = 10

    # Media (admin-uploaded testimonial photos)
    MEDIA_DIR: str = "media"
    MAX_UPLOAD_MB: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()


def get_database_url() -> str:
    """Resolve the SQLAlchemy database URL.

    POSTGRES_URL wins when it was explicitly configured (e.g. the Render
    deployment); otherwise the Neon-provided DATABASE_URL fallback is used.
    Plain ``postgresql://`` URLs (as supplied by Neon) are rewritten to the
    SQLAlchemy psycopg (v3) driver scheme, so a Neon connection string
    works as-is.
    """
    url = settings.POSTGRES_URL
    if url == settings.LOCAL_POSTGRES_DEFAULT and settings.DATABASE_URL:
        url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url
