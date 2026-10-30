"""JWT helpers for the single-admin MVP auth system."""

import logging
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from .config import settings

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"

# Fallback secret used only when SECRET_KEY is not configured. It is
# ephemeral (per-process) so tokens are invalidated on every restart —
# a safe default that still fails visibly in logs.
_ephemeral_key: str | None = None


def get_secret_key() -> str:
    """Return the configured signing key, or a generated ephemeral one."""
    global _ephemeral_key
    if settings.SECRET_KEY:
        return settings.SECRET_KEY
    if _ephemeral_key is None:
        _ephemeral_key = secrets.token_hex(32)
        logger.warning(
            "SECRET_KEY is not set — using an ephemeral key. "
            "Issued tokens will stop working when the server restarts."
        )
    return _ephemeral_key


def create_access_token(subject: str) -> str:
    """Create a signed, expiring JWT for the given subject."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, get_secret_key(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Return the token subject if valid, otherwise None."""
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    subject = payload.get("sub")
    return subject if isinstance(subject, str) else None
