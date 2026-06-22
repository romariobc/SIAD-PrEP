# Arquitetura — SIAD-PrEP

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **ORM:** Prisma + PostgreSQL
- **Auth:** JWT com dois tokens separados — access token (15 min, `type: 'access'`) e refresh token (30 dias, `type: 'refresh'`); Google OAuth 2.0 via `google-auth-library`
- **Validação:** Zod (schemas em controllers)
- **Testes:** Jest (unit em `tests/unit/`, integration em `tests/integration/`)
- **Infra local:** Docker Compose (`docker-compose.dev.yml`)
- **Deploy:** GCP Cloud Run + Cloud SQL (região `southamerica-east1`); CI/CD via GitHub Actions + Workload Identity Federation
- **Observabilidade:** morgan HTTP logging (dev/combined/silent por NODE_ENV); rate limiting via `express-rate-limit` (20 req/15 min em `/api/auth`)
- **Documentação:** OpenAPI 3.0 via `swagger-ui-express` em `/api/docs`

## Fluxo MVC

```
Routes → Controllers → Services → Prisma (DB)
```

- `src/routes/` — Express Router por domínio; aplica middlewares, delega ao controller
- `src/controllers/` — recebe req/res, chama service, retorna JSON; sem lógica de negócio
- `src/services/` — toda lógica de negócio; sem conhecimento HTTP; lança `AppError` para falhas previsíveis
- `src/database/` — Prisma client singleton + schema
- `src/middlewares/` — `authenticate`, `authorize`, `validate`, `errorMiddleware`
- `src/config/env.ts` — variáveis de ambiente validadas com Zod; app encerra se inválidas

## Decisões registradas

| Decisão | Motivo |
|---|---|
| Monolito MVC | Escopo inicial controlado; frontend React planejado para fase futura |
| Soft delete em dados pessoais | LGPD — dados de saúde não podem ser destruídos sem processo formal |
| Zod para validação | Tipagem em runtime alinhada ao TypeScript estático |
| JWT stateless com dois tokens | Access token curto (15 min) + refresh token longo (30 dias); claim `type` evita confusão de tokens |
| Google OAuth sem senha | `passwordHash` nullable; contas OAuth-only retornam 400 se tentar login por senha |
