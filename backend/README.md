# neVo — CRM SaaS Backend

Production-ready foundation for **neVo**, a CRM SaaS, built with Node.js, Express, TypeScript, Prisma, and MySQL.

> This is the **foundation only** — authentication and database models are intentionally not yet implemented.

---

## Tech Stack

| Layer        | Tech                          |
| ------------ | ----------------------------- |
| Runtime      | Node.js ≥ 18                  |
| Framework    | Express 4                     |
| Language     | TypeScript (strict mode)      |
| ORM          | Prisma                        |
| Database     | MySQL                         |
| Validation   | Zod                           |
| Auth (later) | JWT + bcrypt                  |
| Security     | Helmet, CORS, express-rate-limit |

## Project Structure

```
nevo/
├── prisma/
│   ├── schema.prisma           # generator + datasource only (no models yet)
│   └── seed.ts
├── src/
│   ├── app.ts                  # Express app factory
│   ├── server.ts               # Process entry point + graceful shutdown
│   ├── config/                 # env, cors, rate-limit, constants
│   ├── lib/                    # Prisma singleton, logger
│   ├── middlewares/            # errorHandler, notFoundHandler, validate, requestId
│   ├── controllers/            # Thin HTTP layer
│   ├── services/               # Business logic
│   ├── routes/                 # Express routers
│   ├── validators/             # Zod schemas
│   ├── utils/                  # ApiError, ApiResponse, asyncHandler
│   └── types/                  # Shared types + Express augmentations
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy and edit your env file
cp .env.example .env

# 3. Generate Prisma client (no models yet — but the client must exist)
npm run db:generate

# 4. Start the dev server (hot reload via tsx)
npm run dev
```

The API will be available at `http://localhost:4000` with the health check at:

```
GET http://localhost:4000/api/v1/health
```

## npm Scripts

| Script               | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `npm run dev`        | Start dev server with hot reload (`tsx watch`)     |
| `npm run build`      | Compile TypeScript → `dist/`                       |
| `npm start`          | Run the compiled production build                  |
| `npm run db:migrate` | Apply Prisma migrations (development)              |
| `npm run db:generate`| Generate Prisma client                             |
| `npm run db:seed`    | Run the seed script                                |
| `npm run db:studio`  | Open Prisma Studio                                 |
| `npm run typecheck`  | Type-check without emitting                        |

## Architecture Notes

- **Clean architecture layering**: `routes → controllers → services → lib (prisma)`. Controllers stay thin; business logic lives in services.
- **Validated env**: `process.env` is parsed once via Zod at boot — boot fails fast if anything is missing.
- **Prisma singleton**: A single `PrismaClient` instance is reused across hot reloads via `globalThis`.
- **Uniform API envelope**: Every response follows `{ success, data | error, meta? }` via `ApiResponse` helpers.
- **Typed errors**: Throw `ApiError.notFound(...)`, `ApiError.badRequest(...)`, etc. — the global error handler translates them (plus Zod and Prisma errors) into the envelope.
- **Strict TypeScript**: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noImplicitReturns` are all on.

## Next Steps

1. Define Prisma models (`User`, `Account`, `Contact`, `Lead`, `Deal`, ...) in `prisma/schema.prisma` and run `npm run db:migrate`.
2. Build the auth module (`auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, JWT + bcrypt).
3. Add an `authenticate` middleware that populates `req.user`.
