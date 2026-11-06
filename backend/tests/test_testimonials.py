import io
from uuid import uuid4

from PIL import Image

from app.core.config import settings


def _png_bytes(size: tuple[int, int] = (240, 120), color=(0, 120, 60)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format="PNG")
    return buffer.getvalue()


def _data_url(filename: str, data: bytes) -> dict:
    return {"photo": (filename, data, "image/png")}


def _create_testimonial(client, admin_headers, **overrides) -> dict:
    payload = {
        "name": "Adamma Okafor",
        "location": "Independence Layout, Enugu",
        "project_type": "Residential · 3.5 kW",
        "quote": "The panels were sized around what my house actually needs.",
        **overrides,
    }
    response = client.post("/api/v1/testimonials/", json=payload, headers=admin_headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_testimonial_endpoints_require_auth(client):
    assert client.get("/api/v1/testimonials/").status_code == 401
    assert (
        client.post(
            "/api/v1/testimonials/",
            json={
                "name": "Anon User",
                "location": "Enugu",
                "project_type": "Residential",
                "quote": "Completely unauthenticated submission attempt.",
            },
        ).status_code
        == 401
    )


def test_public_list_serves_only_approved(client, admin_headers):
    created = _create_testimonial(client, admin_headers)
    assert created["status"] == "pending"

    pending_feed = client.get("/api/v1/testimonials/public")
    assert pending_feed.status_code == 200
    assert pending_feed.json() == []

    status = client.patch(
        f"/api/v1/testimonials/{created['id']}",
        json={"status": "approved"},
        headers=admin_headers,
    )
    assert status.status_code == 200
    assert status.json()["status"] == "approved"

    approved_feed = client.get("/api/v1/testimonials/public")
    assert approved_feed.status_code == 200
    assert len(approved_feed.json()) == 1
    entry = approved_feed.json()[0]
    assert entry["name"] == "Adamma Okafor"
    assert "status" not in entry  # workflow internals stay private
    assert "created_at" not in entry


def test_rejected_and_edited_quotes_never_publish(client, admin_headers):
    created = _create_testimonial(client, admin_headers)

    client.patch(
        f"/api/v1/testimonials/{created['id']}",
        json={"status": "rejected"},
        headers=admin_headers,
    )
    assert len(client.get("/api/v1/testimonials/public").json()) == 0


def test_create_validates_content(client, admin_headers):
    base = {
        "name": "Adamma Okafor",
        "location": "Independence Layout, Enugu",
        "project_type": "Residential · 3.5 kW",
    }
    assert (
        client.post(
            "/api/v1/testimonials/",
            json={**base, "quote": "too short"},
            headers=admin_headers,
        ).status_code
        == 422
    )  # < 10 chars
    assert (
        client.post(
            "/api/v1/testimonials/",
            json={**base, "quote": "a" * 1001},
            headers=admin_headers,
        ).status_code
        == 422
    )  # > 1000 chars
    assert (
        client.post(
            "/api/v1/testimonials/",
            json={"name": "X", "location": "Enugu", "quote": "a" * 30, "project_type": "R"},
            headers=admin_headers,
        ).status_code
        == 422
    )


def test_photo_upload_sanitises_and_replaces(client, admin_headers, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_DIR", str(tmp_path))

    created = _create_testimonial(client, admin_headers)
    testimonial_id = created["id"]

    first = client.post(
        f"/api/v1/testimonials/{testimonial_id}/photo",
        files=_data_url("customer-photo.png", _png_bytes()),
        headers=admin_headers,
    )
    assert first.status_code == 200, first.text
    first_photo = first.json()["photo_path"]
    assert first_photo.startswith("/media/testimonial-")
    first_file = tmp_path / first_photo.removeprefix("/media/")
    assert first_file.is_file()

    second = client.post(
        f"/api/v1/testimonials/{testimonial_id}/photo",
        files=_data_url("replacement.jpg", _png_bytes()),
        headers=admin_headers,
    )
    assert second.status_code == 200
    second_photo = second.json()["photo_path"]
    assert second_photo != first_photo
    assert not first_file.is_file()  # replaced file removed, no orphans


def test_photo_upload_rejects_fakes(client, admin_headers, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_DIR", str(tmp_path))

    created = _create_testimonial(client, admin_headers)

    # Text masquerading as an image must be refused, not stored.
    response = client.post(
        f"/api/v1/testimonials/{created['id']}/photo",
        files=_data_url("not-an-image.png", "definitely not an image".encode()),
        headers=admin_headers,
    )
    assert response.status_code == 415

    response = client.post(
        f"/api/v1/testimonials/{created['id']}/photo",
        files=_data_url("empty.png", _png_bytes()),
        headers=admin_headers,
    )
    assert response.status_code == 200  # control: a real PNG passes

    missing = client.post(
        f"/api/v1/testimonials/{uuid4()}/photo",
        files=_data_url("image.png", _png_bytes()),
        headers=admin_headers,
    )
    assert missing.status_code == 404
    assert len(list(tmp_path.iterdir())) == 1  # the accepted control photo only


def test_delete_removes_row_and_photo_file(client, admin_headers, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "MEDIA_DIR", str(tmp_path))

    created = _create_testimonial(client, admin_headers)
    testimonial_id = created["id"]
    uploaded = client.post(
        f"/api/v1/testimonials/{testimonial_id}/photo",
        files=_data_url("photo.png", _png_bytes()),
        headers=admin_headers,
    ).json()["photo_path"]
    photo_file = tmp_path / uploaded.removeprefix("/media/")
    assert photo_file.is_file()

    deleted = client.delete(f"/api/v1/testimonials/{testimonial_id}", headers=admin_headers)
    assert deleted.status_code == 200
    assert not photo_file.is_file()
    assert (
        client.get("/api/v1/testimonials/", headers=admin_headers).json() == []
    )


def test_no_photo_is_fine(client, admin_headers):
    created = _create_testimonial(client, admin_headers)
    assert created["photo_path"] is None
    client.patch(
        f"/api/v1/testimonials/{created['id']}",
        json={"status": "approved"},
        headers=admin_headers,
    )
    feed = client.get("/api/v1/testimonials/public").json()
    assert feed[0]["photo_path"] is None
