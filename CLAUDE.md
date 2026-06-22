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

SIAD-PrEP é uma plataforma brasileira de saúde pública para gestão da Profilaxia Pré-Exposição (PrEP) ao HIV. É uma **aplicação monolítica MVC** construída com Node.js + Express + TypeScript, usando PostgreSQL via Prisma ORM. O frontend (React) está planejado para uma fase futura (`client/`).

## Commands

### Instalar dependências

```bash
npm install
```

### Infraestrutura local (PostgreSQL + pgAdmin)

```bash
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
```

### Servidor de desenvolvimento

```bash
npm run dev          # tsx watch — hot reload em http://localhost:3000
```

### Build

```bash
npm run build        # tsc → dist/
npm start            # node dist/server.js
```

### Testes

```bash
npm test             # Jest (todos os testes)
npm run test:watch   # Jest modo watch
npm run test:coverage
```

Testes ficam em `tests/unit/` e `tests/integration/`.

### Banco de dados (Prisma)

```bash
# Primeira vez / após mudanças no schema
npm run db:migrate          # prisma migrate dev
npm run db:generate         # prisma generate (após editar schema.prisma)
npm run db:studio           # Prisma Studio GUI
npm run db:seed             # executa src/database/seed.ts
```

Schema: `src/database/prisma/schema.prisma`

### Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores antes de iniciar.

```bash
cp .env.example .env
```

Variáveis obrigatórias: `DATABASE_URL`, `JWT_SECRET` (≥32 chars), `GOOGLE_CLIENT_ID`.

## Architecture

### Fluxo MVC

```
Routes → Controllers → Services → Prisma (DB)
```

- **`src/routes/`** — Express Router por domínio; aplica middlewares, chama métodos do controller.
- **`src/controllers/`** — Recebe req/res, chama service, retorna JSON. Sem lógica de negócio.
- **`src/services/`** — Toda a lógica de negócio. Sem conhecimento HTTP. Lança `AppError` para falhas.
- **`src/database/`** — Singleton do cliente Prisma + schema.
- **`src/middlewares/`** — `authenticate`, `authorize`, `validate`, `errorMiddleware`, rate limiting.
- **`src/config/env.ts`** — Variáveis de ambiente validadas com Zod. App encerra se env for inválido.
- **`src/app.ts`** — Factory do Express app (sem `listen`). Usado pelo servidor e pelos testes.
- **`src/docs/swagger.ts`** — Documentação OpenAPI 3.0. UI disponível em `/api/docs`.

### Domínios e Rotas

| Domínio       | Rota base              |
|---------------|------------------------|
| Auth          | `/api/auth`            |
| Patients      | `/api/patients`        |
| Appointments  | `/api/appointments`    |
| Medications   | `/api/medications`     |
| Professionals | `/api/professionals`   |

Health check: `GET /health`  
Documentação: `GET /api/docs`

### Endpoints de Autenticação

| Método | Rota                  | Descrição                              |
|--------|-----------------------|----------------------------------------|
| POST   | `/api/auth/register`  | Cadastro com email + senha             |
| POST   | `/api/auth/login`     | Login com email + senha                |
| POST   | `/api/auth/refresh`   | Renovação de access token              |
| POST   | `/api/auth/google`    | Login/cadastro via Google OAuth 2.0    |

### Autenticação e Tokens JWT

Dois tokens separados com claim `type`:

- **Access token** (`type: 'access'`): expira em 15 minutos. Usado no header `Authorization: Bearer`.
- **Refresh token** (`type: 'refresh'`): expira em 30 dias. Enviado apenas no endpoint `/refresh`.

O middleware `authenticate` rejeita qualquer token onde `type !== 'access'` (401).  
O endpoint `/refresh` rejeita tokens onde `type !== 'refresh'` (401).

### Google OAuth 2.0

Fluxo via `google-auth-library` — verificação de ID Token no servidor:

1. Cliente obtém `idToken` do Google Sign-In no frontend.
2. `POST /api/auth/google` com `{ idToken }`.
3. `AuthGoogleService.loginOrRegister` executa 3 casos em ordem:
   - Usuário encontrado por `googleId` → login direto.
   - Usuário encontrado por e-mail → vincula `googleId` + login.
   - Nenhuma conta → cria usuário (`role: PATIENT`, `passwordHash: null`).
4. Retorna `{ accessToken, refreshToken, user }`.

Usuários criados via Google não têm senha. Tentar login por senha com essas contas retorna 400.

### Tratamento de Erros

Lance `AppError(statusCode, message)` para falhas previsíveis. O `errorMiddleware` global captura e retorna `{ error: message }`. Erros de validação Zod são capturados automaticamente pelo middleware `validate`.

### Roles

`PATIENT`, `PROFESSIONAL`, `ADMIN`. Armazenados no payload do JWT (campo `role`). Use `authorize(...roles)` para restringir rotas.

Restrições importantes:
- `GET /api/patients/:id` e `PATCH /api/patients/:id` requerem `PROFESSIONAL` ou `ADMIN`.
- `PATCH /api/appointments/:id/complete` requer `PROFESSIONAL` ou `ADMIN`.

### Rate Limiting

`express-rate-limit` aplicado em `/api/auth`: 20 requisições por 15 minutos por IP.

### HTTP Logging

`morgan` configurado por ambiente: `dev` (desenvolvimento), `combined` (produção), desativado em `test`.

## Deploy — GCP Cloud Run

O deploy em produção usa **Google Cloud Run + Cloud SQL (PostgreSQL)** na região `southamerica-east1` (São Paulo).

### Workflows GitHub Actions

| Arquivo                         | Gatilho               | Função                                  |
|---------------------------------|-----------------------|-----------------------------------------|
| `.github/workflows/ci.yml`      | PRs e push em `main`  | Lint (tsc), build e testes unitários    |
| `.github/workflows/deploy.yml`  | Push em `main`        | Build Docker, push para Artifact Registry, deploy no Cloud Run |

### Secrets necessários no GitHub

| Secret                           | Descrição                                      |
|----------------------------------|------------------------------------------------|
| `GCP_PROJECT_ID`                 | ID do projeto GCP                              |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Provider Workload Identity Federation          |
| `GCP_SERVICE_ACCOUNT`            | Email da service account de deploy             |

Credenciais de runtime (DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID) são lidas do **Secret Manager** do GCP, não de secrets do GitHub.

### Dockerfile

Multi-stage: `builder` (compila TypeScript + gera Prisma client) → `runner` (imagem mínima de produção). Porta exposta: `8080`.

## Convenção de Commits

Conventional Commits em português:

```
feat(auth): adicionar endpoint de refresh token
fix(patient): tratar CPF duplicado no cadastro
test(appointment): adicionar teste de cancelamento
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Conformidade LGPD

- Pacientes usam soft delete (`deletedAt`) — nunca hard delete.
- `consentGiven` + `consentDate` são obrigatórios no cadastro de pacientes.
- CPF é dado sensível — nunca logar, nunca expor em respostas de lista.
- Secrets ficam em `.env` (local) ou Secret Manager (produção) — nunca em código ou arquivos commitados.

## Seed

`npm run db:seed` popula o banco com dados de desenvolvimento (idempotente via `upsert`):

- 1 admin, 1 profissional (CRM-SP-123456 / Infectologia)
- 2 pacientes com consentimento LGPD
- 3 consultas (1 concluída no passado, 2 futuras)
- 1 medicamento ativo com 2 dispensações

## Estrutura de Testes

```
tests/
  setup.ts              # Variáveis de env para Jest (sem banco de dados)
  unit/
    middlewares/        # validate, auth
    services/           # auth, auth.google, patient, appointment, medication, professional
  integration/          # (a implementar — requer banco real)
```

Todos os testes unitários mockam o Prisma client — nenhum banco de dados necessário para `npm test`.

## .claude/ Reference

- `.claude/agents/` — Configurações de agentes Claude personalizados
- `.claude/skills/` — Definições de skills reutilizáveis
- `.claude/tasks/` — Rastreamento de tarefas
