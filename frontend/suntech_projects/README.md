# SUNTECH PROJECTS frontend

React, TypeScript, Vite, and Tailwind CSS frontend.

## Development

From the `frontend` directory:

1. Install dependencies: `npm install`
2. Start the backend at `http://127.0.0.1:8000`.
3. Start the frontend: `npm run dev`.

The workspace manifest at this directory level forwards `dev`, `build`,
`lint`, `test`, and `preview` commands to this app.

The Vite development server proxies `/api` requests to the local backend. For
production, either serve the API under the same origin at `/api`, or set
`VITE_API_URL` to the backend origin before building.

## Checks

- `npm run lint`
- `npm test`
- `npm run build`
