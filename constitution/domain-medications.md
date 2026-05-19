---
# domain-medications.md — Domínio de Medicamentos
llm_context_version: "1.0.0"
project_id: siad-prep
domain_id: medications
updated_by: "⚠ PENDENTE — Tech Lead deve preencher com seu handle"
updated_at: "2026-05-19"
---

# Domínio: Medicamentos (`/api/medications`)

<!-- Gerencia prescrições de ARVs para PrEP e o registro de
     dispensações. Domínio crítico para rastreabilidade clínica
     e futura integração com SICLOM. -->

---

## 1. Descrição

```yaml
label: "Gestão de Medicamentos e Dispensações"
description: >
  Controla as prescrições de regimes antirretrovirais (ARV) para
  profilaxia PrEP e registra cada dispensação realizada ao paciente.
  Os dois regimes suportados são os preconizados pelo Ministério da
  Saúde para PrEP oral.
base_route: /api/medications
files:
  route: src/routes/medication.routes.ts
  controller: src/controllers/medication.controller.ts
  service: src/services/medication.service.ts
future_integration: SICLOM (Sistema de Controle Logístico de Medicamentos)
```

---

## 2. Entidades Envolvidas

```yaml
entities:
  - model: Medication
    schema_fields:
      - id: UUID (PK, auto)
      - patientId: String (FK → Patient)
      - regimen: MedicationRegimen (enum)
      - startDate: DateTime
      - endDate: DateTime? (opcional — null = tratamento em curso)
      - prescribedBy: String (UUID do profissional — ⚠ String livre, não FK)
      - isActive: Boolean (default true)
      - createdAt: DateTime
      - updatedAt: DateTime
    relations:
      - Patient (N:1)
      - Dispense[] (1:N)

  - model: Dispense
    schema_fields:
      - id: UUID (PK, auto)
      - medicationId: String (FK → Medication)
      - quantity: Int (quantidade dispensada)
      - dispensedAt: DateTime (default now())
    relations:
      - Medication (N:1)

enums:
  MedicationRegimen:
    TENOFOVIR_EMTRICITABINA: >
      Tenofovir Disoproxil Fumarato 300mg + Emtricitabina 200mg —
      regime padrão PrEP oral (TDF/FTC)
    TENOFOVIR_LAMIVUDINA: >
      Tenofovir Disoproxil Fumarato 300mg + Lamivudina 300mg —
      regime alternativo PrEP oral (TDF/3TC)
```

---

## 3. Endpoints

```yaml
endpoints:

  - method: GET
    path: /api/medications
    description: "Lista todas as prescrições com dados do paciente"
    auth: authenticate
    authorization: authorize('PROFESSIONAL', 'ADMIN')
    response_200: "Array de Medication com patient.user.name"
    risk: >
      ⚠ MÉDIO — PATIENT não pode acessar esta rota, mas não há
      endpoint para PATIENT listar suas próprias medicações.
      Correção pendente: criar GET /api/medications/me ou
      adicionar filtro de role no service (similar a appointments).

  - method: GET
    path: /api/medications/:id
    description: "Busca prescrição por ID"
    auth: authenticate
    authorization: "Qualquer autenticado — sem restrição de role"
    response_200: "Medication"
    response_404: "Medication record not found"

  - method: POST
    path: /api/medications
    description: "Cria nova prescrição de medicamento"
    auth: authenticate
    authorization: authorize('PROFESSIONAL', 'ADMIN')
    body_schema: |
      {
        patientId: z.string().uuid(),
        regimen: z.enum(['TENOFOVIR_EMTRICITABINA', 'TENOFOVIR_LAMIVUDINA']),
        startDate: z.string().datetime(),
        endDate: z.string().datetime().optional(),
        prescribedBy: z.string().uuid()
      }
    response_201: "Medication criada com isActive=true"
    risk: >
      ⚠ MENOR — prescribedBy é String livre (UUID) sem validação de FK
      contra a tabela Professional. Pode referenciar UUID inexistente.

  - method: POST
    path: /api/medications/:id/dispense
    description: "Registra dispensação de medicamento ao paciente"
    auth: authenticate
    authorization: authorize('PROFESSIONAL', 'ADMIN')
    body_schema: |
      {
        quantity: z.number().int().positive(),
        dispensedAt: z.string().datetime().optional()
      }
    response_200: "Dispense registrado"
    response_404: "Medication record not found"
    note: >
      dispensedAt é opcional — se omitido, usa now().
      Não valida se a medicação está ativa (isActive=true) antes de dispensar.
      ⚠ PENDENTE: bloquear dispensação em medicação isActive=false.
```

---

## 4. Regras de Negócio

```yaml
business_rules:

  - id: BR-MED-01
    rule: >
      Toda prescrição é criada com isActive=true.
      isActive=false indica tratamento encerrado (não é soft-delete
      pois a prescrição continua acessível para histórico).
    enforced_in: MedicationService.create()

  - id: BR-MED-02
    rule: >
      endDate é opcional. null = tratamento em curso (sem data prevista
      de encerramento). Quando endDate é definido, indica data planejada.
    enforced_in: Schema Zod + MedicationService.create()

  - id: BR-MED-03
    rule: >
      Dispensações são registros imutáveis de entrega de medicamento.
      Não existe endpoint de remoção ou atualização de Dispense.
      Cada Dispense é um fato clínico registrado.
    enforced_in: "Ausência de endpoints DELETE/PATCH para Dispense"

  - id: BR-MED-04
    rule: >
      Apenas PROFESSIONAL e ADMIN podem prescrever e dispensar.
      PATIENT só pode consultar suas próprias prescrições.
      ⚠ PENDENTE: endpoint de auto-consulta para PATIENT.
    enforced_in: authorize('PROFESSIONAL', 'ADMIN') nos endpoints POST

  - id: BR-MED-05
    rule: >
      prescribedBy deve referenciar um Professional existente no sistema.
      ⚠ PENDENTE: esta validação não está implementada — campo é String livre.
      Correção: mudar prescribedBy para FK de Professional.id no schema.
    enforced_in: "⚠ PENDENTE"
```

---

## 5. Invariantes

```yaml
invariants:
  - "Medication nunca é hard-deletada — isActive=false para encerramento"
  - "Dispense é imutável — representa fato clínico"
  - "quantity em Dispense é sempre > 0 (z.number().int().positive())"
  - "regimen é sempre um dos dois valores enum — não aceita string livre"
  - "startDate ≤ endDate (quando ambos definidos) — ⚠ não validado no código"
```

---

## 6. Pendências e Melhorias Conhecidas

```yaml
pending:

  - id: PENDING-MED-01
    priority: HIGH
    description: >
      Transformar prescribedBy de String livre para FK real de Professional.id.
      Atualmente aceita qualquer UUID sem validar existência do profissional.
    suggested_fix: |
      // schema.prisma
      prescribedBy   String
      professional   Professional @relation(fields: [prescribedBy], references: [id])
      // Requer migration e ajuste no service

  - id: PENDING-MED-02
    priority: HIGH
    description: >
      Implementar filtro de role na listagem. PATIENT deve poder listar
      suas próprias medicações sem expor as de outros pacientes.
    suggested_fix: |
      // MedicationService.list(user: AuthPayload)
      const where = user.role === 'PATIENT'
        ? { patient: { userId: user.sub } }
        : {};

  - id: PENDING-MED-03
    priority: MEDIUM
    description: >
      Bloquear dispensação em medicação com isActive=false.
      Farmacêutico não deve poder dispensar medicamento encerrado.
    suggested_fix: |
      // MedicationService.dispense()
      const medication = await MedicationService.getById(medicationId);
      if (!medication.isActive) {
        throw new AppError(409, 'Cannot dispense inactive medication');
      }

  - id: PENDING-MED-04
    priority: MEDIUM
    description: >
      Validar que startDate ≤ endDate quando ambos são fornecidos.

  - id: PENDING-MED-05
    priority: MEDIUM
    description: >
      Implementar endpoint PATCH /api/medications/:id para encerrar
      tratamento (setar isActive=false e endDate) sem hard-deletar.

  - id: PENDING-MED-06
    priority: LOW
    description: >
      Incluir histórico de dispensações no GET /:id
      (Medication com Dispense[] incluído).

  - id: PENDING-MED-07
    priority: LOW
    description: >
      Preparar modelo de dados para integração com SICLOM.
      SICLOM usa campos específicos (código RNDS, lote, etc.)
      que precisam ser mapeados.
```

---

## 7. Testes Necessários

```yaml
tests_needed:
  unit:
    - "MedicationService.list() — retorna lista com dados de paciente"
    - "MedicationService.getById() — retorna 404 para ID inexistente"
    - "MedicationService.create() — cria com isActive=true"
    - "MedicationService.create() — endDate=null quando não fornecido"
    - "MedicationService.dispense() — cria Dispense com quantity correto"
    - "MedicationService.dispense() — usa now() quando dispensedAt omitido"
    - "MedicationService.dispense() — retorna 404 para medicationId inexistente"

  integration:
    - "GET /api/medications → 403 para PATIENT"
    - "GET /api/medications → 200 para PROFESSIONAL"
    - "GET /api/medications/:id → 200 para qualquer autenticado"
    - "POST /api/medications → 201 para PROFESSIONAL com dados válidos"
    - "POST /api/medications → 403 para PATIENT"
    - "POST /api/medications → 400 com regimen inválido"
    - "POST /api/medications/:id/dispense → 200 com quantity positivo"
    - "POST /api/medications/:id/dispense → 400 com quantity=0"
    - "POST /api/medications/:id/dispense → 404 para medicationId inexistente"
```
