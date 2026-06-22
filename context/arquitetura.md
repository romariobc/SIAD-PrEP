# Arquitetura — SIAD-PrEP

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **ORM:** Prisma + PostgreSQL
- **Auth:** JWT (access token no header `Authorization: Bearer`)
- **Validação:** Zod (schemas em controllers)
- **Testes:** Jest (unit em `tests/unit/`, integration em `tests/integration/`)
- **Infra local:** Docker Compose (`docker-compose.dev.yml`)

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
| JWT stateless | Simplicidade operacional; refresh token planejado para fase futura |
