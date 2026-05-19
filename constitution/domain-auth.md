---
# domain-auth.md — Domínio de Autenticação
llm_context_version: "1.0.0"
project_id: siad-prep
domain_id: auth
updated_by: "⚠ PENDENTE — Tech Lead deve preencher com seu handle"
updated_at: "2026-05-19"
---

# Domínio: Autenticação (`/api/auth`)

<!-- Descreve as regras de negócio, endpoints, entidades e invariantes
     do domínio de autenticação. Toda LLM trabalhando neste domínio
     deve ler este arquivo. -->

---

## 1. Descrição

```yaml
label: "Autenticação e Gestão de Identidade"
description: >
  Responsável pelo registro de usuários, autenticação via JWT e
  emissão de tokens de acesso. Gerencia o ciclo de vida de sessão
  de PATIENTs, PROFESSIONALs e ADMINs.
base_route: /api/auth
files:
  route: src/routes/auth.routes.ts
  controller: src/controllers/auth.controller.ts
  service: src/services/auth.service.ts
```

---

## 2. Entidades Envolvidas

```yaml
entities:
  - model: User
    schema_fields:
      - id: UUID (PK, auto)
      - email: String (unique)
      - passwordHash: String (bcryptjs, 12 rounds)
      - name: String
      - role: UserRole (PATIENT | PROFESSIONAL | ADMIN)
      - isActive: Boolean (default true)
      - createdAt: DateTime
      - updatedAt: DateTime
    relations:
      - Patient? (1:1)
      - Professional? (1:1)
    sensitive_fields:
      - passwordHash: "NUNCA expor em response — usar select:{} sempre"
      - email: "Dado pessoal — não logar"
```

---

## 3. Endpoints

```yaml
endpoints:

  - method: POST
    path: /api/auth/register
    description: "Cria novo usuário com role especificado"
    auth: public
    body_schema: |
      {
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        role: z.enum(['PATIENT', 'PROFESSIONAL', 'ADMIN']).default('PATIENT')
      }
    response_201: |
      { user: { id, email, name, role, createdAt }, token: string }
    response_409: "Email already in use"
    risk: >
      ⚠ CRÍTICO — campo role aceita ADMIN sem restrição.
      Ver risk_zone AUTH_ESCALATION em CONTEX.md.
      Correção pendente: remover ADMIN do enum público.

  - method: POST
    path: /api/auth/login
    description: "Autentica usuário e retorna JWT"
    auth: public
    body_schema: |
      {
        email: z.string().email(),
        password: z.string()
      }
    response_200: |
      { token: string }
    response_401: "Invalid credentials"
    response_403: "Account is inactive"
    note: >
      Mensagem genérica 'Invalid credentials' é intencional —
      não revelar se o email existe ou não (prevenção de user enumeration).

  - method: POST
    path: /api/auth/refresh
    description: "Renova token JWT a partir de token atual"
    auth: public
    body_schema: |
      { refreshToken: string }
    response_200: |
      { token: string }
    response_401: "Invalid or expired refresh token"
    risk: >
      ⚠ MÉDIO — o mecanismo atual reutiliza o mesmo JWT como refresh token.
      Não há token rotation, storage ou revogação.
      Implementação de refresh token real está pendente.
```

---

## 4. Regras de Negócio

```yaml
business_rules:

  - id: BR-AUTH-01
    rule: >
      Email deve ser único no sistema. Tentativa de registro com
      email existente retorna 409 Conflict.
    enforced_in: AuthService.register()

  - id: BR-AUTH-02
    rule: >
      Senha é hasheada com bcryptjs usando env.BCRYPT_ROUNDS (default 12)
      antes de persistir. A senha em texto-claro NUNCA é armazenada.
    enforced_in: AuthService.register() + bcrypt.hash()

  - id: BR-AUTH-03
    rule: >
      Usuário com isActive=false não pode autenticar.
      Login retorna 403 'Account is inactive'.
    enforced_in: AuthService.login()

  - id: BR-AUTH-04
    rule: >
      JWT payload contém { sub: userId, role }.
      Expiração definida por env.JWT_EXPIRES_IN (default '7d').
    enforced_in: AuthService.signToken()

  - id: BR-AUTH-05
    rule: >
      Comparação de senha SEMPRE usa bcrypt.compare() — nunca comparação
      direta de strings. Tempo constante para prevenir timing attacks.
    enforced_in: AuthService.login()

  - id: BR-AUTH-06
    rule: >
      Response de register inclui { user, token }.
      Response de login inclui apenas { token }.
      passwordHash NUNCA aparece em nenhum response.
    enforced_in: AuthService.register() via select:{}
```

---

## 5. Invariantes

```yaml
invariants:
  - "email é imutável após registro (não há endpoint de alteração de email)"
  - "role é imutável após registro (não há endpoint de alteração de role)"
  - "passwordHash nunca aparece em qualquer response da API"
  - "token JWT sempre tem expiração — nunca assinar sem expiresIn"
  - "isActive=false bloqueia autenticação sem remover o usuário"
```

---

## 6. Pendências e Melhorias Conhecidas

```yaml
pending:

  - id: PENDING-AUTH-01
    priority: CRITICAL
    description: >
      Bloquear auto-atribuição de role ADMIN no registro público.
      Solução: remover ADMIN do enum Zod de registro. Criar endpoint
      POST /api/auth/admin (protegido por authorize('ADMIN')) para
      promoção de usuários.

  - id: PENDING-AUTH-02
    priority: HIGH
    description: >
      Implementar rate limiting no login e registro para prevenir
      brute-force. Biblioteca sugerida: express-rate-limit.
      Config: máximo 5 tentativas em 15 minutos por IP.

  - id: PENDING-AUTH-03
    priority: HIGH
    description: >
      Implementar refresh token real:
      - Gerar refresh token separado (mais longa duração, ex: 30d)
      - Armazenar hash do refresh token no banco (tabela RefreshToken)
      - Revogar refresh token no logout
      - Implementar token rotation (emitir novo refresh a cada uso)

  - id: PENDING-AUTH-04
    priority: MEDIUM
    description: >
      Adicionar endpoint GET /api/auth/me para retornar dados do
      usuário autenticado (sub do JWT → buscar User + perfil associado).

  - id: PENDING-AUTH-05
    priority: MEDIUM
    description: >
      Adicionar endpoint POST /api/auth/logout que invalida o
      refresh token (quando PENDING-AUTH-03 for implementado).

  - id: PENDING-AUTH-06
    priority: MEDIUM
    description: >
      Implementar fluxo de recuperação de senha:
      POST /api/auth/forgot-password (envia token por email)
      POST /api/auth/reset-password (valida token e atualiza senha)

  - id: PENDING-AUTH-07
    priority: LOW
    description: >
      Adicionar política de complexidade de senha além de min(8):
      exigir pelo menos 1 maiúscula, 1 número, 1 caractere especial.
```

---

## 7. Testes Necessários

```yaml
tests_needed:
  unit:
    - "AuthService.register() — usuário criado com dados corretos"
    - "AuthService.register() — lança AppError(409) se email duplicado"
    - "AuthService.register() — passwordHash != password original"
    - "AuthService.register() — response não contém passwordHash"
    - "AuthService.login() — retorna token para credenciais válidas"
    - "AuthService.login() — lança AppError(401) para senha errada"
    - "AuthService.login() — lança AppError(401) para email inexistente"
    - "AuthService.login() — lança AppError(403) para isActive=false"
    - "AuthService.signToken() — token tem campo sub e role"

  integration:
    - "POST /api/auth/register → 201 com { user, token }"
    - "POST /api/auth/register → 409 com email duplicado"
    - "POST /api/auth/register → 400 com body inválido (email mal-formatado)"
    - "POST /api/auth/login → 200 com token"
    - "POST /api/auth/login → 401 com credenciais erradas"
    - "POST /api/auth/refresh → 200 com novo token"
    - "POST /api/auth/refresh → 401 com token inválido"
```
