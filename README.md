# neVo CRM

Monorepo for **neVo**, a production-ready CRM SaaS.

```
nevo-crm/
├── backend/      # Node.js + Express + TypeScript + Prisma + MySQL
└── frontend/     # (pending) — web client
```

## Workspaces

| Path        | Stack                                                       | Status         |
| ----------- | ----------------------------------------------------------- | -------------- |
| `backend/`  | Node 18+, Express 4, TypeScript (strict), Prisma, MySQL     | Foundation ✅  |
| `frontend/` | TBD (React / Next.js / Vue — to be defined)                 | Not started    |

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env       # edit DATABASE_URL + JWT secrets
npm run db:generate
npm run dev                # → http://localhost:4000/api/v1/health
```

See [backend/README.md](backend/README.md) for full backend documentation.

### Frontend

Not implemented yet. Scaffold it inside the `frontend/` folder when ready (e.g. `npm create vite@latest .` or `npx create-next-app@latest .`).

## Git

```bash
git init                   # if not already a repo
git add .
git commit -m "chore: initial monorepo scaffold (backend foundation)"
```

Each workspace ships its own `.gitignore`; the root `.gitignore` covers cross-cutting concerns (OS files, IDE files, root-level node_modules).
