# CLAUDE.md

## Harness de referência

Este projeto opera sob o harness de engenharia de contexto em:
**https://github.com/romariobc/dev_flow_create_harness** (branch: `dominio/saude`)

Antes de qualquer tarefa, leia no harness:
- `dev-flow-harness/01-identidade-memoria/persona.md`
- `dev-flow-harness/04-guardrails-seguranca/checklist-seguranca-llm.md`
- `dev-flow-harness/04-guardrails-seguranca/dados-sensiveis-saude.md`
- `dev-flow-harness/05-harness-evals/ciclo-de-sessao.md` — leia **antes** de tocar em código
- `dev-flow-harness/05-harness-evals/criterios-aceite-padrao.md`
- `dev-flow-harness/05-harness-evals/estado-e-progresso.md`

Divergências deste projeto em relação ao harness estão documentadas em `context/adaptacoes.md`.

---


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SIAD-PrEP is a Brazilian public health platform for HIV Pre-Exposure Prophylaxis (PrEP) management. It is a **monolithic MVC application** built with Node.js + Express + TypeScript, using PostgreSQL via Prisma ORM. The frontend (React) is planned for a future phase (`client/`).

## Commands

### Install dependencies

```bash
npm install
```

### Local infrastructure (PostgreSQL + pgAdmin)

```bash
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
```

### Development server

```bash
npm run dev          # tsx watch — hot reload on http://localhost:3000
```

### Build

```bash
npm run build        # tsc → dist/
npm start            # node dist/server.js
```

### Testing

```bash
npm test             # Jest (all tests)
npm run test:watch   # Jest watch mode
npm run test:coverage
```

Tests live in `tests/unit/` and `tests/integration/`.

### Database (Prisma)

```bash
# First time / after schema changes
npm run db:migrate          # prisma migrate dev
npm run db:generate         # prisma generate (after editing schema.prisma)
npm run db:studio           # Prisma Studio GUI
npm run db:seed             # run src/database/seed.ts
```

Schema file: `src/database/prisma/schema.prisma`

### Environment

Copy `.env.example` to `.env` and fill in values before starting.

```bash
cp .env.example .env
```

## Architecture

### MVC Flow

```
Routes → Controllers → Services → Prisma (DB)
```

- **`src/routes/`** — Express Router per domain; apply middlewares, call controller methods.
- **`src/controllers/`** — Receive req/res, call service, return JSON. No business logic here.
- **`src/services/`** — All business logic. No HTTP knowledge. Throw `AppError` for business failures.
- **`src/database/`** — Prisma client singleton + schema.
- **`src/middlewares/`** — `authenticate`, `authorize`, `validate`, `errorMiddleware`.
- **`src/config/env.ts`** — Zod-validated env variables. App exits if env is invalid.
- **`src/app.ts`** — Express app factory (no `listen`). Used by server and tests.

### Domains and Routes

| Domain       | Base route             |
|--------------|------------------------|
| Auth         | `/api/auth`            |
| Patients     | `/api/patients`        |
| Appointments | `/api/appointments`    |
| Medications  | `/api/medications`     |
| Professionals| `/api/professionals`   |

Health check: `GET /health`

### Error handling

Throw `AppError(statusCode, message)` for predictable failures. The global `errorMiddleware` catches it and returns `{ error: message }`. Zod validation errors are caught automatically by `validate` middleware.

### Roles

`PATIENT`, `PROFESSIONAL`, `ADMIN`. Stored in JWT payload (`role` field). Use `authorize(...roles)` middleware to restrict routes.

## Commit Convention

Conventional Commits:

```
feat(auth): add refresh token endpoint
fix(patient): handle duplicate CPF on create
test(appointment): add cancellation unit test
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Key Compliance Notes

- **LGPD**: Patients use soft delete (`deletedAt`) — never hard delete. `consentGiven` + `consentDate` required. CPF is sensitive — never log it.
- Secrets go in `.env` (local) or a secrets manager (production) — never in code or committed files.

## .claude/ Reference

- `.claude/agents/` — Custom Claude agent configurations
- `.claude/skills/` — Reusable skill definitions
- `.claude/tasks/` — Task tracking
