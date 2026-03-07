# Arquitetura SIAD-PrEP

## Visão Geral

SIAD-PrEP é uma aplicação MVC monolítica construída com Node.js + Express + TypeScript. O banco de dados é PostgreSQL, acessado via Prisma ORM.

## Stack

| Camada       | Tecnologia                        |
|--------------|-----------------------------------|
| Runtime      | Node.js >= 20                     |
| Framework    | Express 4                         |
| Linguagem    | TypeScript 5                      |
| ORM          | Prisma 5 + PostgreSQL             |
| Validação    | Zod                               |
| Autenticação | JWT (jsonwebtoken) + bcryptjs     |
| Testes       | Jest + Supertest                  |
| Frontend     | React (fase futura, `client/`)    |

## Estrutura MVC

```
Routes → Controllers → Services → Prisma (DB)
```

- **Routes** (`src/routes/`): definem endpoints e aplicam middlewares.
- **Controllers** (`src/controllers/`): recebem req/res, chamam Services, retornam JSON.
- **Services** (`src/services/`): toda lógica de negócio, sem dependência do HTTP.
- **Prisma** (`src/database/`): acesso ao banco, geração de cliente, schema.

## Domínios

| Domínio        | Rota base              | Descrição                             |
|----------------|------------------------|---------------------------------------|
| Auth           | `/api/auth`            | Registro, login, refresh token        |
| Patients       | `/api/patients`        | Cadastro e gestão de pacientes        |
| Appointments   | `/api/appointments`    | Agendamentos e consultas              |
| Medications    | `/api/medications`     | Prescrições PrEP e dispensações       |
| Professionals  | `/api/professionals`   | Cadastro de profissionais de saúde    |

## LGPD

- Pacientes usam soft delete (`deletedAt`) — nunca hard delete.
- Campo `consentGiven` + `consentDate` obrigatório no cadastro do paciente.
- CPF é dado sensível — nunca expor em logs.

## Autenticação

JWT Bearer token. Roles: `PATIENT`, `PROFESSIONAL`, `ADMIN`.

Middleware `authenticate` verifica o token. `authorize(...roles)` restringe por role.
