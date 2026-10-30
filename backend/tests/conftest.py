import os

# Configure auth settings BEFORE the app (and its settings object) is
# imported, so tests exercise the real login flow end to end.
os.environ.setdefault("ADMIN_USERNAME", "admin")
os.environ.setdefault(
    "ADMIN_PASSWORD",
    "test-admin-password-0123456789-abcdefghij",  # >= 32 bytes for HMAC
)

import pytest
from fastapi import Request
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine

from app.main import app
from app.core.database import get_session
from app.core.rate_limit import check_lead_create_rate_limit
from app.core.rate_limit import SlidingWindowRateLimiter

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(scope="function")
def session():
    """Create a fresh database session for each test."""
    SQLModel.metadata.create_all(engine)
    try:
        with Session(engine) as session:
            yield session
    finally:
        SQLModel.metadata.drop_all(engine)


@pytest.fixture
def client(session):
    """TestClient with an isolated DB and a per-test rate limiter."""
    def override_get_session():
        yield session

    def unlimited(request: Request) -> None:
        return None

    previous_session = app.dependency_overrides.get(get_session)
    previous_limit = app.dependency_overrides.get(check_lead_create_rate_limit)
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[check_lead_create_rate_limit] = unlimited
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        for dependency, previous in (
            (get_session, previous_session),
            (check_lead_create_rate_limit, previous_limit),
        ):
            if previous is None:
                app.dependency_overrides.pop(dependency, None)
            else:
                app.dependency_overrides[dependency] = previous


@pytest.fixture
def admin_headers(client):
    """Obtain a real token via the login endpoint."""
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "admin", "password": "test-admin-password-0123456789-abcdefghij"},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
