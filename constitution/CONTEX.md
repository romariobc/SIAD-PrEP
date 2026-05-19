---
# CONTEX.md — Constituição do Projeto
# Lido por toda LLM que trabalha neste repositório.
# Atualizar este arquivo antes de iniciar qualquer sessão de desenvolvimento assistida.
llm_context_version: "1.0.0"
project_id: siad-prep
updated_by: "⚠ PENDENTE — Tech Lead deve preencher com seu handle"
updated_at: "2026-05-19"
---

# CONTEX.md — SIAD-PrEP

<!-- Este arquivo é a fonte-primária de contexto para LLMs.
     Ele descreve O QUE o projeto é, PARA QUEM, com QUAL stack,
     e QUAIS são as restrições absolutas. Toda LLM deve ler este
     arquivo antes de qualquer tarefa. -->

## 1. Contexto de Negócio

```yaml
product_name: SIAD-PrEP
description: >
  Plataforma brasileira de saúde pública para gestão da Profilaxia Pré-Exposição (PrEP)
  ao HIV. Permite o cadastro e acompanhamento de pacientes em uso de PrEP, o agendamento
  de consultas com profissionais de saúde, o registro de prescrições e dispensações de
  medicamentos antirretrovirais.

sector: Saúde Pública — Sistema Único de Saúde (SUS)
country: Brasil
language: pt-BR

status: MVP — não está em produção. Fase de desenvolvimento inicial.

business_goals:
  - Registrar e acompanhar pacientes em tratamento PrEP
  - Controlar dispensações de medicamentos (Tenofovir + Emtricitabina / Lamivudina)
  - Registrar consultas entre profissionais de saúde e pacientes
  - Garantir conformidade com a LGPD no tratamento de dados sensíveis de saúde

future_phases:
  - Frontend React (client/ — planejado, não iniciado)
  - Integração com SICLOM (sistema de controle logístico de medicamentos)
  - Integração com e-SUS APS
  - Integração com login gov.br
  - Telemedicina (tipo de consulta já modelado no schema)
  - Notificações de dispensação e lembretes de consulta
  - Relatórios e analytics
```

---

## 2. Stack Técnica

```yaml
# NÃO altere dependências sem atualizar este bloco.
# LLMs devem usar EXATAMENTE as versões declaradas — nunca sugerir upgrades de versão
# sem validação explícita do Tech Lead.

runtime:
  engine: Node.js
  version: ">=20.0.0"

language:
  name: TypeScript
  version: "5.7.x"
  mode: strict  # noUnusedLocals, noImplicitReturns, noFallthroughCasesInSwitch ATIVADOS

framework:
  name: Express
  version: "4.21.x"

orm:
  name: Prisma
  version: "5.22.x"
  client: "@prisma/client"

database:
  engine: PostgreSQL
  version: "16"
  local_infra: Docker Compose (docker-compose.dev.yml)
  schema_file: src/database/prisma/schema.prisma

auth:
  tokens: JWT (jsonwebtoken 9.0.x)
  password_hash: bcryptjs (2.4.x, 12 rounds default)
  token_lifetime: 7d (env JWT_EXPIRES_IN)

validation:
  library: Zod
  version: "3.23.x"
  layer: routes (via validate middleware)

security_headers:
  library: helmet
  version: "8.0.x"

cors:
  library: cors
  version: "2.8.x"
  current_config: "⚠ ABERTO (sem allowlist) — restringir antes de produção"

testing:
  framework: Jest
  version: "29.7.x"
  http_assertions: supertest (7.0.x)
  preset: ts-jest
  runner: "--runInBand (serial)"

dev_server:
  tool: tsx watch
  entry: src/server.ts
  port: 3000
```

---

## 3. Padrão Arquitetural

```yaml
pattern: Monolithic MVC

# Fluxo obrigatório para TODA feature:
flow: "Routes → Controllers → Services → Prisma (DB)"

layers:
  routes:
    path: src/routes/
    responsibility: >
      Definir endpoints, aplicar middlewares (authenticate, authorize, validate),
      delegar para controller. ZERO lógica de negócio.

  controllers:
    path: src/controllers/
    responsibility: >
      Receber req/res, chamar service, retornar JSON.
      ZERO lógica de negócio. ZERO acesso direto ao Prisma.

  services:
    path: src/services/
    responsibility: >
      Toda lógica de negócio. ZERO conhecimento de HTTP (req/res).
      Lançar AppError para falhas de negócio.

  database:
    path: src/database/
    files:
      - client.ts: singleton PrismaClient — importar de cá, NUNCA instanciar novo PrismaClient
      - prisma/schema.prisma: fonte única da verdade do schema

  middlewares:
    path: src/middlewares/
    files:
      - auth.middleware.ts: authenticate (JWT), authorize (RBAC)
      - error.middleware.ts: AppError class + errorMiddleware global
      - validate.middleware.ts: factory validate(ZodSchema)

  config:
    path: src/config/env.ts
    description: >
      Variáveis de ambiente validadas via Zod na inicialização.
      App aborta se env inválida. NUNCA acessar process.env diretamente —
      importar de env.ts.

app_factory:
  file: src/app.ts
  description: >
    createApp() retorna Express app sem chamar listen().
    Usado por server.ts e pelos testes. Nunca juntar listen() com createApp().
```

---

## 4. Endpoints e Domínios

```yaml
health_check: "GET /health"

domains:
  - id: auth
    base: /api/auth
    domain_file: domain-auth.md

  - id: patients
    base: /api/patients
    domain_file: domain-patients.md

  - id: appointments
    base: /api/appointments
    domain_file: domain-appointments.md

  - id: medications
    base: /api/medications
    domain_file: domain-medications.md

  - id: professionals
    base: /api/professionals
    domain_file: domain-professionals.md
```

---

## 5. Atores e Personas

```yaml
actors:
  - id: PATIENT
    description: >
      Paciente em uso ou candidato ao uso de PrEP.
      Acessa apenas seus próprios dados (consultas, medicamentos).
      Não pode ver dados de outros pacientes.

  - id: PROFESSIONAL
    description: >
      Profissional de saúde (médico, enfermeiro, farmacêutico).
      Identificado por CRM único. Pode listar pacientes, prescrever
      medicamentos, registrar consultas e dispensações.

  - id: ADMIN
    description: >
      Administrador do sistema. Acesso total. Pode criar profissionais,
      soft-deletar pacientes, gerenciar usuários. NÃO deve ser
      auto-atribuído via registro público — ver risk_zones.
```

---

## 6. Zonas de Risco

```yaml
# Estas zonas exigem revisão humana OBRIGATÓRIA antes de merge.
# LLMs NÃO devem tomar decisões autônomas nas áreas abaixo.

risk_zones:
  - id: LGPD
    description: >
      Dados de saúde são dados sensíveis sob a LGPD (Lei 13.709/2018).
      Qualquer alteração no schema de Patient, consentGiven, deletedAt
      ou no tratamento de CPF exige revisão do DPO / Tech Lead.
    signals:
      - "hard delete de Patient"
      - "remover campo deletedAt"
      - "remover campo consentGiven"
      - "logar CPF"
      - "expor CPF em response sem autorização"

  - id: AUTH_ESCALATION
    description: >
      O campo role no registro público permite auto-promoção para ADMIN.
      Qualquer mudança no fluxo de autenticação/autorização exige revisão.
    signals:
      - "role: ADMIN em registro público"
      - "remover authorize middleware"
      - "bypassar authenticate"
      - "JWT sem expiração"

  - id: SCHEMA_CHANGE
    description: >
      Alterações no schema.prisma afetam migrations de produção.
      Toda mudança de schema requer aprovação do Tech Lead e
      geração de migration versionada.
    signals:
      - "editar schema.prisma"
      - "prisma migrate reset"
      - "drop table"
      - "deleteMany sem where"

  - id: SENSITIVE_FIELDS
    description: >
      Campos que NUNCA devem aparecer em logs, responses ou console.log.
    fields:
      - passwordHash
      - cpf (apenas em contexto autorizado)
      - JWT_SECRET
      - DATABASE_URL
```

---

## 7. Conformidade e Regulatório

```yaml
compliance:
  - id: LGPD
    law: "Lei Geral de Proteção de Dados — Lei 13.709/2018"
    applicable_data:
      - CPF (dado pessoal identificador)
      - dateOfBirth (dado pessoal)
      - Dados de saúde — uso de PrEP (dado sensível — Art. 11)
      - consentGiven + consentDate (base legal: consentimento)
    rules:
      - Pacientes NUNCA são hard-deletados — usar softDelete (deletedAt)
      - consentGiven e consentDate obrigatórios no cadastro de paciente
      - CPF não deve aparecer em logs de aplicação
      - Dados de pacientes excluídos permanecem na base (rastreabilidade)
    pending:
      - "⚠ PENDENTE — mecanismo de exportação de dados (direito de acesso)"
      - "⚠ PENDENTE — mecanismo de anonimização (direito ao esquecimento completo)"
      - "⚠ PENDENTE — política de retenção de dados"
      - "⚠ PENDENTE — DPIA (Data Protection Impact Assessment)"
      - "⚠ PENDENTE — auditoria de acesso a dados sensíveis"

  - id: SUS_DATA_STANDARDS
    description: >
      Futura integração com SICLOM e e-SUS APS impõe formatos de dados
      e protocolos de interoperabilidade governamentais.
    pending:
      - "⚠ PENDENTE — especificação de integração SICLOM"
      - "⚠ PENDENTE — especificação de integração e-SUS APS"
```

---

## 8. Glossário do Domínio

```yaml
# LLMs devem usar EXATAMENTE estes termos ao nomear variáveis, funções e endpoints.

glossary:
  PrEP: "Profilaxia Pré-Exposição — uso de antirretrovirais por pessoa HIV-negativa para prevenção"
  SICLOM: "Sistema de Controle Logístico de Medicamentos — sistema federal de dispensação de ARV"
  e-SUS_APS: "Sistema de informação da Atenção Primária à Saúde do Ministério da Saúde"
  CPF: "Cadastro de Pessoa Física — identificador nacional de pessoa física (11 dígitos)"
  CRM: "Conselho Regional de Medicina — registro profissional do médico"
  Dispensação: "Ato de entregar medicamento ao paciente — registrado no modelo Dispense"
  Regime: "Combinação de medicamentos PrEP prescrita — TENOFOVIR_EMTRICITABINA ou TENOFOVIR_LAMIVUDINA"
  Soft_Delete: "Marcar deletedAt = now() em vez de remover o registro — obrigatório para Patient (LGPD)"
  ARV: "Antirretroviral — medicamento usado na prevenção e tratamento do HIV"
  consentGiven: "Flag boolean indicando que o paciente consentiu com o tratamento de seus dados (LGPD)"
  AppError: "Classe de erro estruturado do projeto — AppError(statusCode, message) — usar SEMPRE"
  AuthPayload: "Payload do JWT — { sub: userId, role: UserRole }"
```

---

## 9. Restrições de Desenvolvimento

```yaml
# Regras absolutas. Violações bloqueiam PR.

absolute_rules:
  - "NUNCA chamar new PrismaClient() fora de src/database/client.ts"
  - "NUNCA acessar process.env diretamente — sempre importar de src/config/env.ts"
  - "NUNCA hard-deletar Patient — usar PatientService.softDelete()"
  - "NUNCA logar CPF, passwordHash ou JWT_SECRET"
  - "NUNCA expor passwordHash em response"
  - "NUNCA colocar lógica de negócio em controllers ou routes"
  - "NUNCA colocar lógica HTTP (req/res) em services"
  - "SEMPRE lançar AppError para falhas de negócio nos services"
  - "SEMPRE usar validate(ZodSchema) nas rotas que recebem body"
  - "SEMPRE aplicar authenticate antes de qualquer rota protegida"
  - "SEMPRE usar select:{} no Prisma ao retornar User para excluir passwordHash"
```
