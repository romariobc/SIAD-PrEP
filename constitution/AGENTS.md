---
# AGENTS.md — Configuração de Agentes e Sinais de Risco
# Define agentes especializados, sinais de risco do vocabulário do negócio
# e regras de escalada automática para este projeto.
llm_context_version: "1.0.0"
project_id: siad-prep
updated_by: "⚠ PENDENTE — Tech Lead deve preencher com seu handle"
updated_at: "2026-05-19"
---

# AGENTS.md — SIAD-PrEP

<!-- Define agentes LLM especializados por função, os sinais de risco
     que devem disparar escalada automática, e as regras de contexto
     que cada agente deve carregar. -->

---

## 1. Agentes Disponíveis

```yaml
agents:

  - id: backend-dev
    label: "Desenvolvedor Backend"
    description: >
      Agente principal de desenvolvimento. Implementa features seguindo
      o padrão MVC, escreve testes, corrige bugs. Opera dentro das
      permissões definidas em LLMROLES.md.
    load_context:
      - CONTEX.md
      - LLMROLES.md
      - "domain-[id].md do domínio sendo trabalhado"
    capabilities:
      - Implementar endpoints (route + controller + service)
      - Escrever testes unitários e de integração
      - Adicionar validações Zod
      - Implementar paginação e filtros
      - Corrigir bugs em services e controllers
    cannot:
      - Editar schema.prisma autonomamente
      - Adicionar dependências não aprovadas
      - Hard-deletar Patient
      - Modificar middlewares de autenticação/autorização

  - id: security-reviewer
    label: "Revisor de Segurança"
    description: >
      Agente de revisão focado em vulnerabilidades e compliance.
      Analisa PRs e código existente em busca de violações de segurança
      e LGPD. Não gera código de produção — apenas aponta problemas.
    load_context:
      - CONTEX.md (seções: risk_zones, compliance, absolute_rules)
      - LLMROLES.md (seção: prohibited)
    capabilities:
      - Revisar código em busca de risk_signals
      - Verificar autorização em cada endpoint
      - Verificar que passwordHash não é exposto
      - Verificar que CPF não é logado
      - Verificar que soft-delete está sendo respeitado
      - Verificar que validate() está aplicado em todos os bodies
    output_format: >
      Lista de achados com: severity (CRITICAL|HIGH|MEDIUM|LOW),
      location (file:line), description, suggested_fix

  - id: test-writer
    label: "Escritor de Testes"
    description: >
      Agente especializado em escrever testes Jest para o projeto.
      Usa mocks do PrismaClient para testes unitários e
      supertest + createApp() para testes de integração.
    load_context:
      - CONTEX.md (seção: stack)
      - "domain-[id].md do domínio sendo testado"
    capabilities:
      - Escrever testes unitários para Services (prisma mockado)
      - Escrever testes de integração para endpoints (supertest)
      - Criar fixtures de dados de teste
      - Configurar beforeEach/afterEach de cleanup
    test_conventions:
      location_unit: "tests/unit/[domain].service.test.ts"
      location_integration: "tests/integration/[domain].test.ts"
      mock_prisma: "jest.mock('../database/client')"
      describe_pattern: "'[EntityName]Service.methodName()'"
      it_pattern: "'[resultado esperado] quando [condição]'"

  - id: schema-reviewer
    label: "Revisor de Schema"
    description: >
      Agente ativado APENAS quando mudanças em schema.prisma são necessárias.
      Analisa impacto de migrations, relações e índices.
      NUNCA executa — apenas propõe e documenta.
    load_context:
      - CONTEX.md (seções: stack, risk_zones)
      - src/database/prisma/schema.prisma (leitura obrigatória antes de qualquer proposta)
    capabilities:
      - Analisar impacto de adicionar/remover campos
      - Identificar necessidade de índices (performance)
      - Verificar relações e integridade referencial
      - Propor migration name descritivo
    output_format: >
      Proposta de mudança com: campo afetado, tipo de impacto
      (additive|breaking|data_migration), reversibilidade,
      índices necessários, migration name sugerido.
    escalation: "SEMPRE requer aprovação do Tech Lead antes de executar migrate dev"
```

---

## 2. Sinais de Risco (Risk Signals)

```yaml
# Quando qualquer destes termos/padrões aparecer em código, comentário,
# ou instrução de tarefa, a LLM deve PARAR, identificar o risco,
# e aguardar confirmação humana antes de prosseguir.

risk_signals:

  # === LGPD / Dados Sensíveis ===
  - signal: "hard delete"
    severity: CRITICAL
    context: "Tentativa de remover registro de Patient permanentemente"
    action: "Recusar. Explicar soft delete. Propor softDelete()."

  - signal: "delete patient"
    severity: CRITICAL
    context: "Operação de deleção em Patient (sem prefixo 'soft')"
    action: "Verificar se é softDelete(). Se for hard delete, recusar."

  - signal: "deleteMany"
    severity: CRITICAL
    context: "Deleção em massa — risco de perda de dados de saúde"
    action: "Verificar modelo afetado. Se Patient, recusar imediatamente."

  - signal: "prisma.patient.delete"
    severity: CRITICAL
    context: "Chamada direta de hard delete na API Prisma para Patient"
    action: "Recusar. Redirecionar para softDelete()."

  - signal: "console.log(cpf"
    severity: HIGH
    context: "CPF sendo logado — violação LGPD"
    action: "Remover. CPF nunca deve aparecer em logs."

  - signal: "log.*cpf"
    severity: HIGH
    context: "CPF sendo logado via qualquer mecanismo"
    action: "Remover. CPF nunca deve aparecer em logs."

  - signal: "passwordHash"
    severity: HIGH
    context: >
      Se passwordHash aparece em response ou log (não em query interna),
      é exposição de credencial
    action: "Verificar contexto. Se em response: remover imediatamente com select:{}."

  - signal: "consentGiven: false"
    severity: MEDIUM
    context: "Criação de paciente sem consentimento registrado"
    action: >
      Verificar se é intencional. Regra de negócio pode permitir
      registro sem consentimento inicial, mas deve ser documentado.

  # === Autenticação / Autorização ===
  - signal: "role: ADMIN"
    severity: CRITICAL
    context: "No contexto de registro público ou schema Zod de registro"
    action: >
      ADMIN não deve ser auto-atribuível. Remover do schema de registro
      público. Criar endpoint específico protegido por authorize('ADMIN').

  - signal: "authenticate"
    severity: HIGH
    context: "Remoção ou comentário do middleware authenticate em rota protegida"
    action: "Recusar. Toda rota de dados exige authenticate."

  - signal: "authorize"
    severity: HIGH
    context: "Remoção do middleware authorize em rota sensível"
    action: "Verificar se a rota deve ser pública. Se não, manter authorize."

  - signal: "jwt.sign.*expiresIn.*never"
    severity: CRITICAL
    context: "Token JWT sem expiração"
    action: "Recusar. Tokens devem sempre ter expiração definida."

  # === Schema e Banco de Dados ===
  - signal: "schema.prisma"
    severity: HIGH
    context: "Edição do schema do banco"
    action: "Identificar mudança, avaliar impacto, aguardar aprovação do Tech Lead."

  - signal: "migrate reset"
    severity: CRITICAL
    context: "Destruição de todas as migrations e dados"
    action: "Recusar. Nunca executar migrate reset sem instrução explícita."

  - signal: "db push"
    severity: HIGH
    context: "Aplicar schema sem criar migration versionada"
    action: >
      Em development pode ser aceitável para prototipagem.
      Em produção: proibido. Usar migrate dev.

  - signal: "drop table"
    severity: CRITICAL
    context: "SQL direto para remover tabela"
    action: "Recusar. Toda mudança de schema via Prisma + migrations."

  # === Código e Arquitetura ===
  - signal: "new PrismaClient"
    severity: HIGH
    context: "Instanciação de novo cliente Prisma fora de client.ts"
    action: "Remover. Importar { prisma } from '../database/client'."

  - signal: "process.env"
    severity: MEDIUM
    context: "Acesso direto a variável de ambiente sem validação"
    action: "Substituir por importação de { env } from '../config/env'."

  - signal: "any"
    severity: LOW
    context: "Uso de tipo any em TypeScript (TypeScript strict violado)"
    action: "Propor tipo adequado. Usar unknown + type guard se necessário."

  - signal: "--no-verify"
    severity: HIGH
    context: "Bypass de hooks de Git/CI"
    action: "Recusar. Corrigir a causa raiz do erro."

  # === Negócio / Clínico ===
  - signal: "isActive: false"
    severity: MEDIUM
    context: "Desativação de medicação ativa sem registro clínico"
    action: >
      Verificar se há nota clínica associada. Desativar medicação
      sem motivo pode impactar acompanhamento do paciente.

  - signal: "CANCELLED"
    severity: LOW
    context: "Cancelamento de consulta"
    action: >
      Verificar se há lógica de notificação ao paciente prevista.
      Por ora, apenas registra status — sinalizar ao PM que
      notificações são funcionalidade futura pendente.
```

---

## 3. Contexto por Tarefa

```yaml
# Qual contexto cada tipo de tarefa deve carregar automaticamente.

task_context_map:

  - task_type: "nova feature em domínio existente"
    load:
      - CONTEX.md
      - LLMROLES.md
      - "domain-[id-do-domínio].md"
    check_risk_signals: true

  - task_type: "novo domínio"
    load:
      - CONTEX.md
      - LLMROLES.md
      - "domain-[id].md do domínio mais próximo (referência)"
    escalate: "Criar novo domain-[id].md e aguardar revisão do Tech Lead"

  - task_type: "mudança de schema"
    load:
      - CONTEX.md (seção: risk_zones)
      - "src/database/prisma/schema.prisma"
    agent: schema-reviewer
    escalate: "OBRIGATÓRIO — aprovação do Tech Lead antes de executar"

  - task_type: "revisão de segurança"
    load:
      - CONTEX.md (risk_zones + compliance)
      - LLMROLES.md (prohibited)
      - AGENTS.md (risk_signals)
    agent: security-reviewer

  - task_type: "escrita de testes"
    load:
      - CONTEX.md (seção: stack)
      - "domain-[id].md do domínio"
    agent: test-writer

  - task_type: "correção de bug"
    load:
      - CONTEX.md
      - LLMROLES.md
      - "domain-[id].md relevante"
    check_risk_signals: true
    note: "Preferir correção mínima — não refatorar além do necessário"
```

---

## 4. Limites de Autonomia

```yaml
autonomy_levels:

  - level: FULL
    description: "LLM pode executar sem confirmação humana"
    applies_to:
      - Adicionar método a Service existente
      - Adicionar rota a Router existente com middlewares corretos
      - Escrever testes
      - Corrigir tipos TypeScript
      - Adicionar validação Zod a campo existente

  - level: PROPOSE_FIRST
    description: "LLM deve propor e aguardar aprovação antes de executar"
    applies_to:
      - Mudança em schema.prisma
      - Nova dependência no package.json
      - Novo middleware
      - Mudança em lógica de autenticação/autorização
      - Qualquer operação em risk_zones

  - level: NEVER
    description: "LLM nunca executa — requer ação humana direta"
    applies_to:
      - Hard delete de Patient
      - prisma migrate reset
      - Remoção de campo consentGiven ou deletedAt
      - Push para branch main/master
      - Remoção de middleware authenticate de rota protegida
```
