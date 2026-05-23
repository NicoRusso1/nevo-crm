# neVo — Frontend

Placeholder for the neVo web client. Not implemented yet.

## Suggested next steps

Pick a framework and scaffold inside this folder:

```bash
# Option A — React + Vite + TypeScript
npm create vite@latest . -- --template react-ts

# Option B — Next.js (App Router) + TypeScript
npx create-next-app@latest . --typescript --app

# Option C — Vue 3 + Vite + TypeScript
npm create vue@latest .
```

## Conventions to keep aligned with the backend

- **API base URL**: read from `VITE_API_URL` (or `NEXT_PUBLIC_API_URL`) and point to the backend `API_PREFIX` (default `http://localhost:4000/api/v1`).
- **Response envelope**: every backend response is `{ success, data | error, meta? }` — write a typed fetcher that unwraps it once.
- **Auth**: JWT in `Authorization: Bearer <token>` once the auth module lands on the backend.
- **CORS**: the backend whitelists `CORS_ORIGIN` (comma-separated). Add your dev URL there.
