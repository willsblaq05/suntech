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

## Checks

From `frontend/`: `npm run lint`, `npm test`, `npm run build`.

From `backend/`: `pytest`.
