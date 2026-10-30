from fastapi.testclient import TestClient
from app.main import app


def test_root_endpoint():
    """Root endpoint returns welcome message."""
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Welcome to SUNTECH PROJECTS API"


def test_health_endpoint():
    """Health check returns healthy status."""
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"