# SUNTECH PROJECTS Backend

FastAPI and SQLModel API for residential and commercial solar referrals.

## Endpoints

- `POST /api/v1/leads/` — Create a lead.
- `GET /api/v1/leads/` — List leads; supports `status`, `user_type`, `limit`,
  and `offset` query parameters.
- `GET /api/v1/leads/{id}` — Retrieve a lead.
- `PATCH /api/v1/leads/{id}` — Edit customer-provided lead details.
- `PATCH /api/v1/leads/{id}/status` — Update the workflow status.
- `DELETE /api/v1/leads/{id}` — Delete a lead.
- `GET /api/v1/testimonials/public` — Approved testimonials for the website
  (public; pending/rejected items never appear).
- `POST /api/v1/testimonials/` — Record a verified testimonial (admin;
  always starts `pending`).
- `GET /api/v1/testimonials/` — List testimonials with workflow status
  (admin; supports `status`, `limit`, `offset`).
- `PATCH /api/v1/testimonials/{id}` — Edit text and/or approve/reject
  (admin; approve with `{"status": "approved"}`).
- `POST /api/v1/testimonials/{id}/photo` — Attach or replace the photo
  (admin; multipart `photo` field, JPEG/PNG/WebP, max 5 MB).
- `DELETE /api/v1/testimonials/{id}` — Delete a testimonial and its stored
  photo file (admin).
- `GET /health` — Health check.
- `GET /` — Welcome message.

## Media (admin-uploaded testimonial photos)

- Uploaded photos live in the directory configured by the `MEDIA_DIR`
  environment variable (default `media/`, i.e. `backend/media/` in dev) and
  are served at `/media/...`. The directory is backed up with the database:
  a DB row references a server-relative path, so restoring one without the
  other loses photos.
- Every upload is verified against real image content, re-encoded
  (EXIF/GPS metadata stripped, max 1600 px, JPEG q85) and stored under a
  random filename before it ever touches disk. SVG is refused.
- Deleting a testimonial (or replacing its photo) removes the old file
  automatically. The one ops gap: a crash between DB commit and file
  deletion can leave an orphan; periodically clean files in `MEDIA_DIR`
  that no row references (e.g. a nightly script comparing filenames to
  `testimonial.photo_path`).

## Development

From this directory:

1. Install dependencies: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and set `POSTGRES_URL`.
3. Run database migrations: `alembic upgrade head`
4. Start the server: `uvicorn app.main:app --reload`
5. Run tests: `pytest`