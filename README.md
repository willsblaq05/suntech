# SUNTECH PROJECTS

Solar installation referral platform for customers in Enugu, Nigeria.

## Project layout

- `backend/` — FastAPI, SQLModel, PostgreSQL, and Alembic.
- `frontend/` — React, TypeScript, Vite, and Tailwind CSS.

## Run locally

Start the backend from `backend/`:

1. Install dependencies: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and set the database and application values.
3. Apply migrations: `alembic upgrade head`
4. Start the API: `uvicorn app.main:app --reload`

Start the frontend from `frontend/`:

1. Install dependencies: `npm install`
2. Start the frontend: `npm run dev`

The frontend development server proxies API requests to the local backend.

## Admin portal

The internal lead-management workspace lives at `/admin/login` (and
`/admin/dashboard`, `/admin/inquiries` after sign-in).

1. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env` (both empty
   means nobody can sign in), plus a permanent `SECRET_KEY`.
2. Start the backend and frontend as above and open
   `http://localhost:5173/admin/login`.

Capabilities mapped to the existing API only:

- List / filter / search inquiries — `GET /api/v1/leads` (search and stats
  are computed client-side; the backend has no text-search or total-count
  parameter yet).
- Inquiry detail incl. internal notes — `GET /api/v1/leads/{id}`.
- Workflow status updates — `PATCH /api/v1/leads/{id}/status`.

Not yet available in the backend, so not implemented in the UI: note
editing (`LeadUpdate` does not accept `notes`), customer-detail editing
from the portal, email-based login (the API uses the configured admin
username), and a dedicated statistics endpoint. If the API is unreachable,
the login page offers a clearly-labelled demo preview powered by sample
data (`src/data/demoAdmin.ts`).

## Checks

From `frontend/`: `npm run lint`, `npm test`, `npm run build`.

From `backend/`: `pytest`.
