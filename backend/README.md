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
- `GET /health` — Health check.
- `GET /` — Welcome message.

## Development

From this directory:

1. Install dependencies: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and set `POSTGRES_URL`.
3. Run database migrations: `alembic upgrade head`
4. Start the server: `uvicorn app.main:app --reload`
5. Run tests: `pytest`