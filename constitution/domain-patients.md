---
# domain-patients.md — Domínio de Pacientes
llm_context_version: "1.0.0"
project_id: siad-prep
domain_id: patients
updated_by: "⚠ PENDENTE — Tech Lead deve preencher com seu handle"
updated_at: "2026-05-19"
---

# Domínio: Pacientes (`/api/patients`)

<!-- Domínio com mais restrições LGPD do projeto. Toda LLM
     deve ler integralmente antes de qualquer modificação aqui.
     Regra #1: NUNCA hard-deletar Patient. -->

---

## 1. Descrição

```yaml
label: "Gestão de Pacientes PrEP"
description: >
  Gerencia o cadastro, atualização e ciclo de vida de pacientes em
  acompanhamento PrEP. Dados de saúde — classificados como dados
  sensíveis pela LGPD (Art. 11). Deleção física PROIBIDA.
base_route: /api/patients
files:
  route: src/routes/patient.routes.ts
  controller: src/controllers/patient.controller.ts
  service: src/services/patient.service.ts
lgpd_classification: DADOS SENSÍVEIS (Art. 11 — dados de saúde)
```

---

## 2. Entidades Envolvidas

```yaml
entities:
  - model: Patient
    schema_fields:
      - id: UUID (PK, auto)
      - userId: String (FK → User, unique)
      - cpf: String (unique, 11 dígitos)
      - dateOfBirth: DateTime
      - phone: String? (opcional)
      - address: String? (opcional)
      - consentGiven: Boolean (default false) [LGPD obrigatório]
      - consentDate: DateTime? (preenchido quando consentGiven=true)
      - createdAt: DateTime
      - updatedAt: DateTime
      - deletedAt: DateTime? [SOFT DELETE — NUNCA null em hard delete]
    relations:
      - User (1:1, via userId)
      - Appointment[] (1:N)
      - Medication[] (1:N)
    sensitive_fields:
      - cpf: "Identificador único pessoal — NUNCA logar. Retornar apenas para ADMIN/PROFESSIONAL."
      - dateOfBirth: "Dado pessoal — tratar com cuidado em logs"
      - address: "Dado pessoal"
      - phone: "Dado pessoal"
```

---

## 3. Endpoints

```yaml
endpoints:

  - method: GET
    path: /api/patients
    description: "Lista todos os pacientes ativos (deletedAt = null)"
    auth: authenticate
    authorization: authorize('PROFESSIONAL', 'ADMIN')
    response_200: "Array de Patient com { user: { name, email } }"
    note: >
      PATIENT não pode listar todos os pacientes.
      ⚠ PENDENTE: implementar paginação — sem limite pode retornar
      volume excessivo de dados sensíveis.

  - method: GET
    path: /api/patients/:id
    description: "Busca paciente por ID"
    auth: authenticate
    authorization: "⚠ Qualquer usuário autenticado — sem restrição de role"
    response_200: "Patient"
    response_404: "Patient not found"
    risk: >
      ⚠ MÉDIO — PATIENT pode buscar dados de outro paciente via :id.
      Correção pendente: verificar se req.user.sub corresponde ao userId
      do paciente (exceto para PROFESSIONAL e ADMIN).

  - method: POST
    path: /api/patients
    description: "Cria perfil de paciente para usuário autenticado"
    auth: authenticate
    authorization: "Qualquer usuário autenticado (userId vem do JWT)"
    body_schema: |
      {
        cpf: z.string().length(11),
        dateOfBirth: z.string().datetime(),
        phone: z.string().optional(),
        address: z.string().optional(),
        consentGiven: z.boolean()
      }
    response_201: "Patient criado"
    response_409: "CPF already registered"
    note: "userId é extraído do JWT (req.user.sub) — não aceito no body"

  - method: PATCH
    path: /api/patients/:id
    description: "Atualiza dados parciais do paciente"
    auth: authenticate
    authorization: "⚠ Qualquer usuário autenticado — sem restrição de role"
    body_schema: "⚠ PENDENTE — sem validação Zod atualmente"
    response_200: "Patient atualizado"
    risk: >
      ⚠ ALTO — sem validação de body e sem restrição de ownership.
      Qualquer autenticado pode atualizar qualquer paciente.
      Correção pendente: adicionar validate(updateSchema) e
      verificar ownership (exceto ADMIN).

  - method: DELETE
    path: /api/patients/:id
    description: "Soft-deleta paciente (LGPD — nunca hard delete)"
    auth: authenticate
    authorization: authorize('ADMIN')
    response_204: "No Content"
    critical: >
      ⚠ CRÍTICO — esta rota executa SOFT DELETE, não hard delete.
      PatientService.softDelete() atualiza deletedAt = now().
      NUNCA substituir por prisma.patient.delete().
```

---

## 4. Regras de Negócio

```yaml
business_rules:

  - id: BR-PAT-01
    rule: >
      Paciente NUNCA é removido fisicamente do banco.
      Deleção equivale a marcar deletedAt = now().
      Dados permanecem para auditoria e conformidade LGPD.
    enforced_in: PatientService.softDelete()
    priority: CRITICAL

  - id: BR-PAT-02
    rule: >
      CPF deve ser único no sistema. Tentativa de cadastro com
      CPF existente retorna 409 Conflict.
      CPF não é validado por dígitos verificadores (apenas length=11).
      ⚠ PENDENTE: validação completa de CPF.
    enforced_in: PatientService.create()

  - id: BR-PAT-03
    rule: >
      Quando consentGiven=true, consentDate é preenchida automaticamente
      com a data atual. Quando consentGiven=false, consentDate=null.
      Consentimento é base legal LGPD para tratamento de dados de saúde.
    enforced_in: PatientService.create()

  - id: BR-PAT-04
    rule: >
      Queries de listagem e busca SEMPRE filtram por deletedAt=null.
      Pacientes soft-deletados são invisíveis para a API.
    enforced_in:
      - PatientService.list() — where: { deletedAt: null }
      - PatientService.getById() — findFirst({ where: { id, deletedAt: null } })

  - id: BR-PAT-05
    rule: >
      userId é sempre extraído do JWT (req.user.sub), nunca do body.
      Um usuário cria exatamente um perfil de Patient.
    enforced_in: PatientController.create() → PatientService.create(req.user!.sub, body)
```

---

## 5. Invariantes

```yaml
invariants:
  - "deletedAt=null significa paciente ativo; deletedAt≠null significa inativo (soft-deleted)"
  - "CPF é único — um CPF por paciente"
  - "userId é único — um perfil de Patient por User"
  - "consentDate é preenchida se e somente se consentGiven=true"
  - "Pacientes soft-deletados não aparecem em nenhuma query pública"
  - "CPF nunca aparece em logs de aplicação"
```

---

## 6. Pendências e Melhorias Conhecidas

```yaml
pending:

  - id: PENDING-PAT-01
    priority: HIGH
    description: >
      Adicionar validação de ownership em GET /:id e PATCH /:id.
      PATIENT deve acessar/editar apenas seu próprio registro.
      PROFESSIONAL e ADMIN podem acessar qualquer paciente.
    suggested_fix: |
      // Em PatientService.getById()
      if (user.role === 'PATIENT' && patient.userId !== user.sub) {
        throw new AppError(403, 'Access denied');
      }

  - id: PENDING-PAT-02
    priority: HIGH
    description: >
      Adicionar validação Zod ao PATCH /:id.
      Criar updatePatientSchema com campos opcionais e tipados.
    suggested_fix: |
      const updatePatientSchema = z.object({
        phone: z.string().optional(),
        address: z.string().optional(),
        consentGiven: z.boolean().optional(),
      });

  - id: PENDING-PAT-03
    priority: MEDIUM
    description: >
      Implementar paginação em GET /. Sem limite, pode retornar
      todos os pacientes do sistema em uma única query.
    suggested_fix: |
      // Query params: ?page=1&limit=20
      // Offset-based ou cursor-based (cursor preferido para grandes volumes)

  - id: PENDING-PAT-04
    priority: MEDIUM
    description: >
      Validação de CPF com dígitos verificadores (algoritmo oficial).
      Atualmente apenas verifica length=11.

  - id: PENDING-PAT-05
    priority: MEDIUM
    description: >
      Definir comportamento de soft-delete em cascade:
      - Consultas do paciente são canceladas automaticamente?
      - Medicações ativas são encerradas?
      - Profissional vinculado é notificado?

  - id: PENDING-PAT-06
    priority: LOW
    description: >
      Implementar endpoint de exportação de dados do paciente
      (direito de acesso LGPD — Art. 18, II).
      GET /api/patients/:id/export → JSON com todos os dados do paciente.
```

---

## 7. Testes Necessários

```yaml
tests_needed:
  unit:
    - "PatientService.list() — retorna apenas pacientes com deletedAt=null"
    - "PatientService.getById() — retorna 404 para ID inexistente"
    - "PatientService.getById() — retorna 404 para paciente soft-deletado"
    - "PatientService.create() — cria com consentDate quando consentGiven=true"
    - "PatientService.create() — consentDate=null quando consentGiven=false"
    - "PatientService.create() — lança AppError(409) se CPF duplicado"
    - "PatientService.softDelete() — atualiza deletedAt, não remove registro"
    - "PatientService.softDelete() — lança 404 para ID inexistente"

  integration:
    - "GET /api/patients → 403 para PATIENT autenticado"
    - "GET /api/patients → 200 para PROFESSIONAL"
    - "GET /api/patients/:id → 200 para paciente existente"
    - "GET /api/patients/:id → 404 para paciente soft-deletado"
    - "POST /api/patients → 201 com dados válidos"
    - "POST /api/patients → 409 com CPF duplicado"
    - "POST /api/patients → 400 com body inválido"
    - "DELETE /api/patients/:id → 204 para ADMIN"
    - "DELETE /api/patients/:id → 403 para PROFESSIONAL"
    - "DELETE /api/patients/:id — não remove registro do banco (verifica deletedAt≠null)"
```
