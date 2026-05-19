---
# domain-appointments.md — Domínio de Consultas
llm_context_version: "1.0.0"
project_id: siad-prep
domain_id: appointments
updated_by: "⚠ PENDENTE — Tech Lead deve preencher com seu handle"
updated_at: "2026-05-19"
---

# Domínio: Consultas (`/api/appointments`)

<!-- Gerencia agendamentos entre pacientes e profissionais.
     Suporta consultas presenciais e telemedicina (tipo enum).
     Autofiltro por role na listagem. -->

---

## 1. Descrição

```yaml
label: "Gestão de Consultas"
description: >
  Gerencia o agendamento, acompanhamento e encerramento de consultas
  entre pacientes PrEP e profissionais de saúde. Suporta os tipos:
  consulta inicial, retorno, resultado de exame laboratorial e
  telemedicina.
base_route: /api/appointments
files:
  route: src/routes/appointment.routes.ts
  controller: src/controllers/appointment.controller.ts
  service: src/services/appointment.service.ts
```

---

## 2. Entidades Envolvidas

```yaml
entities:
  - model: Appointment
    schema_fields:
      - id: UUID (PK, auto)
      - patientId: String (FK → Patient)
      - professionalId: String (FK → Professional)
      - scheduledAt: DateTime
      - type: AppointmentType (INITIAL | FOLLOWUP | LAB_RESULT | TELEMEDICINE)
      - status: AppointmentStatus (SCHEDULED | COMPLETED | CANCELLED, default SCHEDULED)
      - notes: String? (opcional)
      - createdAt: DateTime
      - updatedAt: DateTime
    relations:
      - Patient (N:1)
      - Professional (N:1)

enums:
  AppointmentType:
    - INITIAL: "Consulta inicial de avaliação para PrEP"
    - FOLLOWUP: "Consulta de retorno/acompanhamento"
    - LAB_RESULT: "Consulta para discussão de resultados laboratoriais"
    - TELEMEDICINE: "Consulta remota por videoconferência (tipo definido, integração pendente)"

  AppointmentStatus:
    - SCHEDULED: "Consulta agendada — estado inicial"
    - COMPLETED: "Consulta realizada"
    - CANCELLED: "Consulta cancelada"
```

---

## 3. Endpoints

```yaml
endpoints:

  - method: GET
    path: /api/appointments
    description: "Lista consultas — filtradas automaticamente por role"
    auth: authenticate
    authorization: "Qualquer autenticado (filtro por role no service)"
    role_filter:
      PATIENT: "Apenas consultas onde patient.userId = JWT.sub"
      PROFESSIONAL: "Apenas consultas onde professional.userId = JWT.sub"
      ADMIN: "Todas as consultas"
    response_200: "Array de Appointment com patient.name e professional.name"
    ordering: "scheduledAt ASC"
    note: "⚠ PENDENTE: paginação e filtro por data/status/tipo"

  - method: GET
    path: /api/appointments/:id
    description: "Busca consulta por ID"
    auth: authenticate
    authorization: "Qualquer autenticado — sem verificação de ownership"
    response_200: "Appointment"
    response_404: "Appointment not found"
    risk: >
      ⚠ MÉDIO — PATIENT pode buscar consultas de outros pacientes via :id.
      Correção pendente: verificar ownership por role.

  - method: POST
    path: /api/appointments
    description: "Cria nova consulta"
    auth: authenticate
    authorization: "Qualquer autenticado"
    body_schema: |
      {
        patientId: z.string().uuid(),
        professionalId: z.string().uuid(),
        scheduledAt: z.string().datetime(),
        type: z.enum(['INITIAL', 'FOLLOWUP', 'LAB_RESULT', 'TELEMEDICINE']),
        notes: z.string().optional()
      }
    response_201: "Appointment criado com status=SCHEDULED"
    risk: >
      ⚠ MÉDIO — PATIENT pode criar consulta usando qualquer patientId
      (não necessariamente o seu próprio). Sem verificação de ownership.

  - method: PATCH
    path: /api/appointments/:id/cancel
    description: "Cancela consulta (status → CANCELLED)"
    auth: authenticate
    authorization: "⚠ Qualquer autenticado — sem restrição de role ou ownership"
    response_200: "Appointment com status=CANCELLED"
    risk: >
      ⚠ MÉDIO — qualquer usuário pode cancelar qualquer consulta.
      Regra de negócio a definir: quem pode cancelar?

  - method: PATCH
    path: /api/appointments/:id/complete
    description: "Marca consulta como realizada (status → COMPLETED)"
    auth: authenticate
    authorization: "⚠ Qualquer autenticado — sem restrição de role"
    response_200: "Appointment com status=COMPLETED"
    risk: >
      ⚠ MÉDIO — PATIENT não deveria poder marcar consulta como completa.
      Correção pendente: restrict to PROFESSIONAL e ADMIN.
```

---

## 4. Regras de Negócio

```yaml
business_rules:

  - id: BR-APT-01
    rule: >
      Toda consulta é criada com status=SCHEDULED.
      A transição de status é unidirecional:
      SCHEDULED → COMPLETED ou SCHEDULED → CANCELLED.
      Consultas COMPLETED ou CANCELLED não podem ser revertidas.
    enforced_in: AppointmentService.create() + AppointmentService.updateStatus()
    note: >
      ⚠ Transição reversa não está impedida no código atual.
      PENDING-APT-01 cobre esta correção.

  - id: BR-APT-02
    rule: >
      Listagem de consultas é sempre filtrada por role:
      - PATIENT vê apenas suas consultas (patient.userId = JWT.sub)
      - PROFESSIONAL vê apenas suas consultas (professional.userId = JWT.sub)
      - ADMIN vê todas
    enforced_in: AppointmentService.list(user: AuthPayload)

  - id: BR-APT-03
    rule: >
      scheduledAt deve ser uma data/hora futura no momento da criação.
      ⚠ Validação não implementada — PENDENTE.
    enforced_in: "⚠ PENDENTE — AppointmentService.create()"

  - id: BR-APT-04
    rule: >
      patientId e professionalId devem referenciar entidades existentes
      no banco. Prisma garante integridade referencial via FK constraint.
    enforced_in: Prisma FK constraint (erro P2003 propagado como 500 — ver PENDING-APT-03)
```

---

## 5. Invariantes

```yaml
invariants:
  - "Toda consulta é criada com status=SCHEDULED"
  - "Consulta nunca é hard-deletada (não há endpoint de DELETE)"
  - "scheduledAt é imutável após criação (não há PATCH de data)"
  - "type é imutável após criação"
  - "patientId e professionalId são imutáveis após criação"
```

---

## 6. Pendências e Melhorias Conhecidas

```yaml
pending:

  - id: PENDING-APT-01
    priority: HIGH
    description: >
      Implementar validação de transição de status:
      - COMPLETED e CANCELLED não podem ser revertidos
      - Consulta CANCELLED não pode ser marcada como COMPLETED
    suggested_fix: |
      // Em AppointmentService.updateStatus()
      if (appointment.status !== 'SCHEDULED') {
        throw new AppError(409, 'Only scheduled appointments can be updated');
      }

  - id: PENDING-APT-02
    priority: HIGH
    description: >
      Restringir quem pode cancelar e completar consultas:
      - cancel: PATIENT (seu próprio) ou PROFESSIONAL/ADMIN
      - complete: apenas PROFESSIONAL e ADMIN

  - id: PENDING-APT-03
    priority: HIGH
    description: >
      Tratar erro Prisma P2003 (FK violation) quando patientId ou
      professionalId não existem — retornar 404 em vez de 500.

  - id: PENDING-APT-04
    priority: MEDIUM
    description: >
      Validar que scheduledAt é uma data futura no momento da criação.
    suggested_fix: |
      scheduledAt: z.string().datetime().refine(
        (v) => new Date(v) > new Date(),
        { message: 'scheduledAt must be a future date' }
      )

  - id: PENDING-APT-05
    priority: MEDIUM
    description: >
      Implementar filtros na listagem: ?status=SCHEDULED&from=2026-06-01&to=2026-06-30

  - id: PENDING-APT-06
    priority: MEDIUM
    description: >
      Implementar paginação em GET /.

  - id: PENDING-APT-07
    priority: LOW
    description: >
      Integração com sistema de notificações para lembretes de consulta.
      Tipo TELEMEDICINE requer integração com plataforma de videoconferência.

  - id: PENDING-APT-08
    priority: LOW
    description: >
      Adicionar campo cancelReason (String?) para registrar motivo
      do cancelamento quando status → CANCELLED.
```

---

## 7. Testes Necessários

```yaml
tests_needed:
  unit:
    - "AppointmentService.list() com role=PATIENT — retorna apenas consultas do paciente"
    - "AppointmentService.list() com role=PROFESSIONAL — retorna apenas consultas do profissional"
    - "AppointmentService.list() com role=ADMIN — retorna todas"
    - "AppointmentService.getById() — retorna 404 para ID inexistente"
    - "AppointmentService.create() — cria com status=SCHEDULED"
    - "AppointmentService.updateStatus() — atualiza para CANCELLED"
    - "AppointmentService.updateStatus() — atualiza para COMPLETED"

  integration:
    - "GET /api/appointments → 200 com array filtrado por role"
    - "POST /api/appointments → 201 com dados válidos"
    - "POST /api/appointments → 400 com body inválido"
    - "POST /api/appointments → 400 com scheduledAt no passado (quando implementado)"
    - "PATCH /api/appointments/:id/cancel → 200 com status=CANCELLED"
    - "PATCH /api/appointments/:id/complete → 200 com status=COMPLETED"
    - "PATCH /api/appointments/:id/cancel → 409 para consulta já COMPLETED (quando implementado)"
```
