---
# domain-professionals.md — Domínio de Profissionais
llm_context_version: "1.0.0"
project_id: siad-prep
domain_id: professionals
updated_by: "⚠ PENDENTE — Tech Lead deve preencher com seu handle"
updated_at: "2026-05-19"
---

# Domínio: Profissionais (`/api/professionals`)

<!-- Gerencia o cadastro de profissionais de saúde vinculados ao
     sistema. Profissionais são criados apenas por ADMIN.
     CRM é o identificador único do profissional. -->

---

## 1. Descrição

```yaml
label: "Gestão de Profissionais de Saúde"
description: >
  Gerencia o cadastro e perfil de profissionais de saúde (médicos,
  enfermeiros, farmacêuticos) que atendem pacientes PrEP no sistema.
  Profissional é vinculado a um User com role=PROFESSIONAL.
  CRM é obrigatório e único.
base_route: /api/professionals
files:
  route: src/routes/professional.routes.ts
  controller: src/controllers/professional.controller.ts
  service: src/services/professional.service.ts
```

---

## 2. Entidades Envolvidas

```yaml
entities:
  - model: Professional
    schema_fields:
      - id: UUID (PK, auto)
      - userId: String (FK → User, unique)
      - crm: String (unique, min 4 chars)
      - specialty: String (min 2 chars)
      - phone: String? (opcional)
      - createdAt: DateTime
      - updatedAt: DateTime
    relations:
      - User (1:1, via userId)
      - Appointment[] (1:N)
    note: >
      Professional não tem deletedAt — não há soft-delete implementado.
      LGPD se aplica apenas ao Patient (dado sensível de saúde).
      ⚠ PENDENTE: definir política de desativação de profissional
      (via User.isActive=false ou soft-delete em Professional).
```

---

## 3. Endpoints

```yaml
endpoints:

  - method: GET
    path: /api/professionals
    description: "Lista todos os profissionais com dados de usuário"
    auth: authenticate
    authorization: "Qualquer autenticado"
    response_200: "Array de Professional com { user: { name, email } }"
    note: "⚠ PENDENTE: paginação"

  - method: GET
    path: /api/professionals/:id
    description: "Busca profissional por ID"
    auth: authenticate
    authorization: "Qualquer autenticado"
    response_200: "Professional"
    response_404: "Professional not found"

  - method: POST
    path: /api/professionals
    description: "Cria perfil de profissional para usuário existente"
    auth: authenticate
    authorization: authorize('ADMIN')
    body_schema: |
      {
        crm: z.string().min(4),
        specialty: z.string().min(2),
        phone: z.string().optional()
      }
    response_201: "Professional criado"
    response_409: "CRM already registered"
    note: >
      userId é extraído do JWT (req.user.sub) — não aceito no body.
      Fluxo esperado: ADMIN cria usuário com role=PROFESSIONAL via
      /api/auth/register, depois cria perfil via este endpoint.

  - method: PATCH
    path: /api/professionals/:id
    description: "Atualiza dados do profissional"
    auth: authenticate
    authorization: authorize('ADMIN', 'PROFESSIONAL')
    body_schema: "⚠ PENDENTE — sem validação Zod atualmente"
    response_200: "Professional atualizado"
    risk: >
      ⚠ MÉDIO — PROFESSIONAL pode atualizar qualquer profissional,
      não apenas o seu próprio perfil. Sem verificação de ownership.
```

---

## 4. Regras de Negócio

```yaml
business_rules:

  - id: BR-PRO-01
    rule: >
      CRM deve ser único no sistema. Tentativa de cadastro com
      CRM existente retorna 409 Conflict.
    enforced_in: ProfessionalService.create()

  - id: BR-PRO-02
    rule: >
      Apenas ADMIN pode criar perfis de profissional.
      Criação de Professional pressupõe que o User correspondente
      (role=PROFESSIONAL) já foi criado via /api/auth/register.
    enforced_in: authorize('ADMIN') na rota POST

  - id: BR-PRO-03
    rule: >
      userId é sempre extraído do JWT — um ADMIN cria o perfil
      associado à sua própria conta. ⚠ INCONSISTÊNCIA: o fluxo
      implica que ADMIN cria o perfil usando seu próprio userId,
      não o userId do profissional alvo.
      Correção pendente: receber userId no body (com authorize ADMIN)
      ou criar fluxo de self-registration para PROFESSIONAL.
    enforced_in: ProfessionalController.create() → ProfessionalService.create(req.user!.sub, body)
    risk: "⚠ ALTO — ver PENDING-PRO-01"

  - id: BR-PRO-04
    rule: >
      CRM não é validado contra o registro oficial do Conselho Regional
      de Medicina. Apenas formato (min 4 chars) é verificado.
      ⚠ PENDENTE: validação opcional contra API pública do CFM.
    enforced_in: "⚠ PENDENTE"
```

---

## 5. Invariantes

```yaml
invariants:
  - "CRM é único — um CRM por profissional"
  - "userId é único — um perfil Professional por User"
  - "Profissional não é removido do sistema (sem endpoint DELETE)"
  - "specialty é imutável via POST — pode ser alterado via PATCH"
```

---

## 6. Pendências e Melhorias Conhecidas

```yaml
pending:

  - id: PENDING-PRO-01
    priority: CRITICAL
    description: >
      Inconsistência no fluxo de criação de profissional:
      ProfessionalService.create(req.user!.sub, ...) usa o userId
      do usuário autenticado (o ADMIN), não o userId do profissional
      sendo cadastrado.
      
      Fluxo correto deveria ser:
      1. ADMIN cria usuário PROFESSIONAL via /api/auth/register
      2. ADMIN chama POST /api/professionals com o userId do PROFESSIONAL
      
      Correção: aceitar userId no body do POST (com validação de que
      existe e tem role=PROFESSIONAL) quando chamado por ADMIN.
    suggested_fix: |
      // Adicionar userId ao body schema (apenas para ADMIN)
      const createSchema = z.object({
        userId: z.string().uuid(), // ID do User com role=PROFESSIONAL
        crm: z.string().min(4),
        specialty: z.string().min(2),
        phone: z.string().optional(),
      });

  - id: PENDING-PRO-02
    priority: HIGH
    description: >
      Adicionar validação de ownership no PATCH /:id.
      PROFESSIONAL deve poder editar apenas seu próprio perfil.
      ADMIN pode editar qualquer profissional.
    suggested_fix: |
      // Em ProfessionalService.update(id, data, user)
      if (user.role === 'PROFESSIONAL' && professional.userId !== user.sub) {
        throw new AppError(403, 'You can only update your own profile');
      }

  - id: PENDING-PRO-03
    priority: HIGH
    description: >
      Adicionar validação Zod ao PATCH /:id.
    suggested_fix: |
      const updateProfessionalSchema = z.object({
        specialty: z.string().min(2).optional(),
        phone: z.string().optional(),
      });

  - id: PENDING-PRO-04
    priority: MEDIUM
    description: >
      Implementar desativação de profissional (via User.isActive=false)
      em vez de ausência de delete. ADMIN deve poder desativar acesso
      de um profissional sem remover histórico de consultas/prescrições.

  - id: PENDING-PRO-05
    priority: MEDIUM
    description: >
      Implementar endpoint GET /api/professionals/me para profissional
      autenticado consultar seu próprio perfil sem conhecer o UUID.

  - id: PENDING-PRO-06
    priority: LOW
    description: >
      Validação de CRM: verificar formato regional (número + UF, ex: 12345/SP).
      Validação opcional contra API pública do CFM.
```

---

## 7. Testes Necessários

```yaml
tests_needed:
  unit:
    - "ProfessionalService.list() — retorna array com user.name e user.email"
    - "ProfessionalService.getById() — retorna 404 para ID inexistente"
    - "ProfessionalService.create() — cria com dados corretos"
    - "ProfessionalService.create() — lança AppError(409) se CRM duplicado"
    - "ProfessionalService.update() — atualiza campos parcialmente"
    - "ProfessionalService.update() — lança 404 para ID inexistente"

  integration:
    - "GET /api/professionals → 200 para qualquer autenticado"
    - "GET /api/professionals/:id → 200 para ID existente"
    - "GET /api/professionals/:id → 404 para ID inexistente"
    - "POST /api/professionals → 201 para ADMIN com dados válidos"
    - "POST /api/professionals → 403 para PROFESSIONAL"
    - "POST /api/professionals → 403 para PATIENT"
    - "POST /api/professionals → 409 com CRM duplicado"
    - "PATCH /api/professionals/:id → 200 para ADMIN"
    - "PATCH /api/professionals/:id → 200 para PROFESSIONAL (seu próprio — quando implementado)"
    - "PATCH /api/professionals/:id → 403 para PROFESSIONAL tentando editar outro (quando implementado)"
```
