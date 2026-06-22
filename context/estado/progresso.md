# Progresso — SIAD-PrEP

## Última sessão

**Data:** 2026-06-22
**O que foi feito:** Implementação completa do backend — Google OAuth, tokens JWT, testes, CI/CD GCP, documentação.

- `src/services/auth.google.service.ts` — Google OAuth 2.0 via `google-auth-library`; fluxo de 3 casos (login, vinculação, cadastro)
- `src/services/auth.service.ts` — tokens JWT separados (`type: access/refresh`), `passwordHash` nullable para contas OAuth
- `src/middlewares/auth.middleware.ts` — rejeita refresh tokens usados como access
- `src/routes/auth.routes.ts` + `src/controllers/auth.controller.ts` — `POST /api/auth/google`
- `src/database/prisma/schema.prisma` — campo `googleId` adicionado ao User
- `src/database/prisma/migrations/` — migrations versionadas no git (init + google_oauth)
- `src/database/seed.ts` — seed idempotente com dados realistas de desenvolvimento
- `src/docs/swagger.ts` — documentação OpenAPI 3.0 completa em `/api/docs`
- `src/app.ts` — rate limiting (20 req/15 min em `/api/auth`), morgan HTTP logging
- `.github/workflows/ci.yml` + `deploy.yml` — CI/CD para GCP Cloud Run (São Paulo)
- `Dockerfile` — multi-stage build para produção
- `tests/unit/` — 69 testes passando; cobertura: 74% statements, 83% branches
- `CLAUDE.md` — atualizado com estado real do projeto em português
- `tsconfig.json` — removidas opções depreciadas (`baseUrl`, `moduleResolution: node`)

**Próximo passo:** Atingir 80% de cobertura em statements (feature 002) — adicionar testes para controllers.

**Decisões pendentes de ADR:** Nenhuma.

---

## Sessão anterior

**Data:** 2026-06-22
**O que foi feito:** Bootstrap do harness `dev_flow_create_harness` (branch `dominio/saude`) neste repositório.
- `CLAUDE.md` atualizado com referência ao harness
- `context/adaptacoes.md` — divergência de stack documentada (Node.js/TS vs Python)
- `context/dominio.md` — contexto de domínio PrEP preenchido
- `context/arquitetura.md` — decisões de arquitetura registradas
- `context/estado/feature_list.json` — features mapeadas; feature 001 marcada como done

---
