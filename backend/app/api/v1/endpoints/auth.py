from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.security import create_access_token

from secrets import compare_digest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token", summary="Admin login (OAuth2 password flow)")
def login_for_access_token(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> dict[str, str]:
    """Exchange admin credentials for a JWT bearer token.

    Uses the OAuth2 password flow so the Swagger /docs page exposes its
    built-in "Authorize" button for the operator.
    """
    if not settings.ADMIN_PASSWORD:
        # Locked by default: no credentials configured, nobody gets in.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account is not configured",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username_ok = compare_digest(form.username, settings.ADMIN_USERNAME)
    password_ok = compare_digest(form.password, settings.ADMIN_PASSWORD)
    if not (username_ok and password_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": create_access_token(subject=form.username),
        "token_type": "bearer",
    }
