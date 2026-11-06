from datetime import datetime
from uuid import uuid4

from fastapi import Request, HTTPException

from app.core.rate_limit import SlidingWindowRateLimiter


def test_create_lead(client):
    """Public lead submission works without authentication."""
    response = client.post(
        "/api/v1/leads/",
        json={
            "name": "Adamma Okafor",
            "email": "adamma@example.com",
            "phone": "+2348012345678",
            "user_type": "residential",
            "budget_range": "medium",
            "system_size_kw": 3.5,
            "city": "Enugu South",
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "Adamma Okafor"
    assert data["email"] == "adamma@example.com"
    assert data["user_type"] == "residential"


def test_public_response_hides_internal_fields(client):
    """The public submission response must not leak operator data."""
    response = client.post(
        "/api/v1/leads/",
        json={"name": "Ify Nnaji", "phone": "+2348012345678"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "status" not in data
    assert "notes" not in data
    assert "updated_at" not in data
    assert "created_at" in data


def test_clients_cannot_set_internal_fields(client):
    """Internal fields are rejected, not silently ignored."""
    base = {"name": "Chidi Benson", "phone": "+2348012345678"}

    assert client.post("/api/v1/leads/", json={**base, "status": "closed"}).status_code == 422
    assert client.post("/api/v1/leads/", json={**base, "notes": "call me"}).status_code == 422


def test_phone_is_normalised_and_validated(client):
    """Separators are stripped; junk is rejected."""
    response = client.post(
        "/api/v1/leads/",
        json={"name": "Adamma Okafor", "phone": "+234 801 234-5678"},
    )
    assert response.status_code == 201
    assert response.json()["phone"] == "+2348012345678"

    local = client.post(
        "/api/v1/leads/",
        json={"name": "Ngozi Eze", "phone": "0801-234-5678"},
    )
    assert local.status_code == 201
    assert local.json()["phone"] == "08012345678"

    assert (
        client.post("/api/v1/leads/", json={"name": "Bad", "phone": "abcdefghij"}).status_code
        == 422
    )


def test_email_must_be_a_valid_address(client):
    response = client.post(
        "/api/v1/leads/",
        json={"name": "Adamma Okafor", "phone": "+2348012345678", "email": "not-an-email"},
    )
    assert response.status_code == 422

    ok = client.post(
        "/api/v1/leads/",
        json={"name": "Adamma Okafor", "phone": "+2348012345678", "email": "a@b.com"},
    )
    assert ok.status_code == 201


def test_budget_range_is_an_enum(client):
    base = {"name": "Chidi Benson", "phone": "+2348012345678"}
    assert client.post("/api/v1/leads/", json={**base, "budget_range": "huge"}).status_code == 422
    assert client.post("/api/v1/leads/", json={**base, "budget_range": "high"}).status_code == 201


def test_upgrade_inquiry_with_system_details(client):
    """The upgrade category stores goals and existing-system specifics."""
    response = client.post(
        "/api/v1/leads/",
        json={
            "name": "Blessing Ude",
            "phone": "+2348023456789",
            "user_type": "upgrade",
            "city": "Independence Layout",
            "budget_range": "medium",
            "improvement_goals": ["batteries", "backup"],
            "existing_inverter_kw": 5,
            "existing_battery_type": "tubular",
            "existing_battery_capacity": "100 Ah",
            "existing_system_notes": "5kVA system struggles to run the freezer overnight.",
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["user_type"] == "upgrade"
    assert data["improvement_goals"] == ["batteries", "backup"]
    assert data["existing_inverter_kw"] == 5
    assert data["existing_battery_type"] == "tubular"
    assert data["existing_battery_capacity"] == "100 Ah"


def test_upgrade_accepts_unknown_technical_specs(client):
    """'I don't know' specs are simply omitted — nothing is invented."""
    response = client.post(
        "/api/v1/leads/",
        json={
            "name": "Halima Sule",
            "phone": "08054563218",
            "user_type": "upgrade",
            "improvement_goals": ["performance"],
            "existing_system_notes": "Lights flicker and the inverter trips at night.",
        },
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["existing_inverter_kw"] is None
    assert data["existing_battery_type"] is None
    assert data["existing_battery_capacity"] is None


def test_upgrade_requires_goals_and_description(client):
    base = {"name": "Blessing Ude", "phone": "+2348023456789", "user_type": "upgrade"}

    assert (
        client.post(
            "/api/v1/leads/",
            json={
                **base,
                "existing_system_notes": "Panels shaded by a new building wing.",
            },
        ).status_code
        == 422
    )  # no improvement_goalss  # noqa: E501
    assert (
        client.post(
            "/api/v1/leads/",
            json={**base, "improvement_goals": ["batteries"]},
        ).status_code
        == 422
    )  # no description


def test_upgrade_rejects_unknown_goal(client):
    response = client.post(
        "/api/v1/leads/",
        json={
            "name": "Blessing Ude",
            "phone": "+2348023456789",
            "user_type": "upgrade",
            "improvement_goals": ["pool"],
            "existing_system_notes": "Batteries were drained within an hour.",
        },
    )
    assert response.status_code == 422


def test_non_upgrade_rejects_upgrade_specific_fields(client):
    """Existing-system fields on residential/commercial leads are refused,
    never silently discarded."""
    response = client.post(
        "/api/v1/leads/",
        json={
            "name": "Chidi Benson",
            "phone": "+2348012345678",
            "user_type": "residential",
            "improvement_goals": ["batteries"],
        },
    )
    assert response.status_code == 422


def test_upgrade_rejects_unknown_battery_type(client):
    response = client.post(
        "/api/v1/leads/",
        json={
            "name": "Blessing Ude",
            "phone": "+2348023456789",
            "user_type": "upgrade",
            "improvement_goals": ["batteries"],
            "existing_battery_type": "mystery",
            "existing_system_notes": "Batteries bulging and hot after noon.",
        },
    )
    assert response.status_code == 422


def test_list_leads_requires_auth(client):
    """Back-office listing is admin-only."""
    assert client.get("/api/v1/leads/").status_code == 401


def test_get_lead_requires_auth(client):
    assert client.get(f"/api/v1/leads/{uuid4()}").status_code == 401


def test_patch_lead_requires_auth(client):
    lead_id = client.post(
        "/api/v1/leads/", json={"name": "Ify Nnaji", "phone": "+2348012345678"}
    ).json()["id"]
    assert (
        client.patch(f"/api/v1/leads/{lead_id}", json={"city": "Awka"}).status_code == 401
    )


def test_delete_lead_requires_auth(client):
    lead_id = client.post(
        "/api/v1/leads/", json={"name": "Ify Nnaji", "phone": "+2348012345678"}
    ).json()["id"]
    assert client.delete(f"/api/v1/leads/{lead_id}").status_code == 401


def test_wrong_password_is_rejected(client):
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "admin", "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_invalid_token_is_rejected(client):
    assert (
        client.get(
            "/api/v1/leads/", headers={"Authorization": "Bearer not-a-jwt"}
        ).status_code
        == 401
    )


def test_admin_can_use_back_office(client, admin_headers):
    """Real login -> token -> full CRUD flow with the bearer token."""
    create = client.post(
        "/api/v1/leads/",
        json={
            "name": "Chidi Benson",
            "phone": "+2348012345678",
            "user_type": "commercial",
        },
    )
    assert create.status_code == 201
    lead_id = create.json()["id"]

    listed = client.get("/api/v1/leads/", headers=admin_headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["status"] == "pending"  # admin sees internal fields

    assert (
        client.get(f"/api/v1/leads/{lead_id}", headers=admin_headers).status_code == 200
    )

    patched = client.patch(
        f"/api/v1/leads/{lead_id}", json={"city": "Enugu"}, headers=admin_headers
    )
    assert patched.status_code == 200
    assert patched.json()["city"] == "Enugu"

    status = client.patch(
        f"/api/v1/leads/{lead_id}/status",
        json={"status": "contacted"},
        headers=admin_headers,
    )
    assert status.status_code == 200
    assert status.json()["status"] == "contacted"

    deleted = client.delete(f"/api/v1/leads/{lead_id}", headers=admin_headers)
    assert deleted.status_code == 200
    assert (
        client.get(f"/api/v1/leads/{lead_id}", headers=admin_headers).status_code == 404
    )


def test_status_is_managed_by_dedicated_endpoint(client, admin_headers):
    """Status changes go through the dedicated endpoint only."""
    create = client.post(
        "/api/v1/leads/", json={"name": "Chidi Benson", "phone": "+2348012345678"}
    )
    lead_id = create.json()["id"]

    assert (
        client.patch(
            f"/api/v1/leads/{lead_id}", json={"status": "closed"}, headers=admin_headers
        ).status_code
        == 422
    )

    status = client.patch(
        f"/api/v1/leads/{lead_id}/status",
        json={"status": "contacted"},
        headers=admin_headers,
    )
    assert status.status_code == 200
    assert status.json()["status"] == "contacted"


def test_filters_and_pagination(client, admin_headers):
    for name in ("Lead One", "Lead Two", "Lead Three"):
        response = client.post(
            "/api/v1/leads/",
            json={"name": name, "phone": "+2348012345678", "user_type": "residential"},
        )
        assert response.status_code == 201

    first_page = client.get("/api/v1/leads/?limit=2&user_type=residential", headers=admin_headers)
    second_page = client.get(
        "/api/v1/leads/?limit=2&offset=2&user_type=residential", headers=admin_headers
    )

    assert first_page.status_code == 200
    assert second_page.status_code == 200
    assert len(first_page.json()) == 2
    assert len(second_page.json()) == 1
    assert not {
        lead["id"] for lead in first_page.json()
    }.intersection(lead["id"] for lead in second_page.json())


def test_update_rejects_nulling_required_fields(client, admin_headers):
    lead_id = client.post(
        "/api/v1/leads/", json={"name": "Ify Nnaji", "phone": "+2348012345678"}
    ).json()["id"]
    assert (
        client.patch(
            f"/api/v1/leads/{lead_id}", json={"name": None}, headers=admin_headers
        ).status_code
        == 422
    )


def test_update_refreshes_updated_at(client, admin_headers):
    create = client.post(
        "/api/v1/leads/", json={"name": "Ify Nnaji", "phone": "+2348012345678"}
    )
    lead_id = create.json()["id"]
    # The public response carries no updated_at; read it via the admin endpoint.
    before = client.get(f"/api/v1/leads/{lead_id}", headers=admin_headers).json()
    old_updated_at = datetime.fromisoformat(before["updated_at"])

    response = client.patch(
        f"/api/v1/leads/{lead_id}", json={"city": "Awka"}, headers=admin_headers
    )
    assert response.status_code == 200
    new_updated_at = datetime.fromisoformat(response.json()["updated_at"])
    assert new_updated_at > old_updated_at


def test_delete_lead(client, admin_headers):
    create = client.post(
        "/api/v1/leads/",
        json={"name": "Ify Nnaji", "email": "ify@example.com", "phone": "+2348012345678"},
    )
    assert create.status_code == 201
    lead_id = create.json()["id"]

    assert client.delete(f"/api/v1/leads/{lead_id}", headers=admin_headers).status_code == 200
    assert client.get(f"/api/v1/leads/{lead_id}", headers=admin_headers).status_code == 404


def test_rate_limit_rejects_spam(client):
    """The public form is throttled per IP."""
    from fastapi import Request

    from app.core.rate_limit import SlidingWindowRateLimiter, check_lead_create_rate_limit
    from app.main import app

    tiny_limiter = SlidingWindowRateLimiter(max_requests=1, window_seconds=60.0)

    def limited(request: Request):
        host = request.client.host if request.client else "unknown"
        tiny_limiter.hit(host)

    app.dependency_overrides[check_lead_create_rate_limit] = limited
    try:
        first = client.post(
            "/api/v1/leads/", json={"name": "First Lead", "phone": "+2348012345678"}
        )
        assert first.status_code == 201

        second = client.post(
            "/api/v1/leads/", json={"name": "Second Lead", "phone": "+2348012345678"}
        )
        assert second.status_code == 429
        assert "Retry-After" in second.headers
    finally:
        app.dependency_overrides.pop(check_lead_create_rate_limit, None)
