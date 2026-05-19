---
# LLMROLES.md — Papéis e Permissões de LLMs
# Define o que LLMs PODEM e NÃO PODEM fazer neste projeto.
# Este arquivo complementa o CONTEX.md e deve ser lido em conjunto.
llm_context_version: "1.0.0"
project_id: siad-prep
updated_by: "⚠ PENDENTE — Tech Lead deve preencher com seu handle"
updated_at: "2026-05-19"
---

# LLMROLES.md — SIAD-PrEP

<!-- Define responsabilidades, permissões e proibições para LLMs
     atuando como assistentes de desenvolvimento neste projeto.
     Toda LLM deve ler e aplicar estas regras antes de gerar código. -->

---

## 1. Papel Principal

```yaml
role_id: dev-assistant
label: "Assistente de Desenvolvimento Backend"
scope: >
  Auxiliar o desenvolvimento da API REST em Node.js + TypeScript,
  seguindo rigorosamente o padrão MVC e as restrições de compliance
  (LGPD) definidas neste projeto.
```

---

## 2. O que a LLM PODE fazer (autonomamente)

```yaml
allowed:
  code_generation:
    - Criar métodos em Services seguindo o padrão existente
    - Criar Controllers delegando para Services (sem lógica de negócio)
    - Criar rotas em Routes aplicando middlewares authenticate/authorize/validate
    - Criar schemas Zod para validação de body em rotas
    - Criar testes unitários para Services (jest + mocks do PrismaClient)
    - Criar testes de integração com supertest + createApp()
    - Adicionar campos opcionais a schemas Zod existentes
    - Adicionar filtros a queries Prisma existentes (where, orderBy, include)
    - Implementar paginação (cursor-based ou offset) em métodos list()
    - Lançar AppError com statusCode e message adequados
    - Adicionar tratamento de erros em try/catch em Controllers

  refactoring:
    - Extrair lógica duplicada entre services para funções privadas
    - Melhorar tipagem TypeScript (interfaces, tipos utilitários)
    - Adicionar validações Zod mais precisas a schemas existentes
    - Corrigir violações do TypeScript strict mode

  documentation:
    - Documentar regras de negócio em comentários de service
    - Gerar exemplos de request/response em comentários de rota
    - Atualizar CLAUDE.md com novos comandos ou domínios

  infrastructure:
    - Criar scripts npm adicionais no package.json
    - Adicionar variáveis de ambiente ao .env.example (sem valores sensíveis)
    - Configurar Jest (jest.config.ts) para novos módulos de teste
```

---

## 3. O que a LLM NÃO PODE fazer (requer aprovação humana)

```yaml
prohibited:
  - id: NO_HARD_DELETE
    action: "Remover registros de Patient com delete() ou deleteMany()"
    consequence: >
      Viola LGPD — dados de saúde de pacientes devem ser preservados.
      Hard delete de Patient é proibição absoluta.
    correct_action: "Usar PatientService.softDelete() — atualiza deletedAt"

  - id: NO_SCHEMA_CHANGE_AUTONOMOUS
    action: "Editar src/database/prisma/schema.prisma sem instrução explícita"
    consequence: >
      Mudanças de schema geram migrations irreversíveis em produção.
      Requer análise de impacto e aprovação do Tech Lead.
    correct_action: "Propor a mudança em comentário e aguardar aprovação"

  - id: NO_ADMIN_SELF_PROMOTION
    action: >
      Manter o campo role no schema de registro público como ENUM
      permitindo ADMIN sem restrição
    consequence: >
      Qualquer usuário pode se tornar ADMIN via POST /api/auth/register.
      Falha crítica de segurança.
    correct_action: >
      Remover role do schema de registro público. ADMIN deve ser
      atribuído apenas por outro ADMIN via endpoint específico.

  - id: NO_EXPOSE_PASSWORD_HASH
    action: "Retornar campo passwordHash em qualquer response"
    consequence: "Exposição de credencial hasheada — risco de cracking offline"
    correct_action: "Usar select:{} no Prisma para excluir passwordHash explicitamente"

  - id: NO_LOG_SENSITIVE
    action: "Logar CPF, passwordHash, JWT_SECRET, DATABASE_URL em console.log ou logger"
    consequence: "Violação LGPD e exposição de credenciais em logs"
    correct_action: "Nunca incluir campos sensíveis em mensagens de log"

  - id: NO_BYPASS_AUTH
    action: "Remover middleware authenticate ou authorize de rotas protegidas"
    consequence: "Exposição de dados sensíveis de saúde sem autenticação"
    correct_action: "Toda rota de dados deve ter router.use(authenticate)"

  - id: NO_DIRECT_PRISMA_OUTSIDE_SERVICES
    action: "Instanciar PrismaClient ou chamar prisma.* fora de src/services/"
    consequence: "Viola separação de responsabilidades — Controllers ficam acoplados ao DB"
    correct_action: "Toda query ao banco deve estar em um Service"

  - id: NO_PROCESS_ENV_DIRECT
    action: "Acessar process.env.QUALQUER_COISA diretamente no código"
    consequence: >
      Variáveis de ambiente não validadas podem causar comportamento
      indefinido. A validação Zod em env.ts deve ser a única entrada.
    correct_action: "Importar { env } from '../config/env' e usar env.VARIAVEL"

  - id: NO_NEW_DEPENDENCY_AUTONOMOUS
    action: "Adicionar nova dependência ao package.json sem instrução explícita"
    consequence: >
      Novas dependências ampliam superfície de ataque e precisam de
      análise de licença e segurança.
    correct_action: "Propor a dependência com justificativa e aguardar aprovação"

  - id: NO_MIGRATION_RESET
    action: "Executar prisma migrate reset ou prisma db push em vez de migrate dev"
    consequence: "Destruição de dados e histórico de migrations"
    correct_action: "Usar prisma migrate dev para criar migrations versionadas"

  - id: NO_OPEN_CORS
    action: "Manter cors() sem configuração de origin em ambiente de produção"
    consequence: "Qualquer origem pode fazer requisições à API"
    correct_action: >
      Configurar cors({ origin: env.ALLOWED_ORIGINS }) com variável
      de ambiente explícita

  - id: NO_CI_SKIP
    action: "Usar --no-verify, --force ou qualquer mecanismo que bypasse hooks de CI"
    consequence: "Código sem validação pode introduzir regressões ou vulnerabilidades"
    correct_action: "Corrigir a causa raiz do erro de CI"
```

---

## 4. Padrões de Código Obrigatórios

```yaml
code_standards:
  error_handling:
    rule: >
      Services SEMPRE lançam AppError(statusCode, message) para falhas de negócio.
      Controllers SEMPRE delegam erros para next(err).
    example: |
      // Service
      if (!patient) throw new AppError(404, 'Patient not found');

      // Controller
      } catch (err) {
        next(err);
      }

  prisma_selects:
    rule: >
      Ao retornar User, SEMPRE usar select:{} para excluir passwordHash.
    example: |
      select: { id: true, email: true, name: true, role: true, createdAt: true }

  soft_delete:
    rule: >
      Queries sobre Patient SEMPRE incluem where: { deletedAt: null }
      (ou findFirst/findMany com esse filtro). O método softDelete()
      atualiza deletedAt, nunca chama delete().
    example: |
      // List
      prisma.patient.findMany({ where: { deletedAt: null } })

      // Get by ID
      prisma.patient.findFirst({ where: { id, deletedAt: null } })

      // Soft delete
      prisma.patient.update({ where: { id }, data: { deletedAt: new Date() } })

  zod_validation:
    rule: >
      Todo endpoint que recebe body usa validate(schema) na rota.
      O schema Zod fica definido na própria route file.
    example: |
      const createSchema = z.object({
        cpf: z.string().length(11),
        consentGiven: z.boolean(),
      });
      router.post('/', validate(createSchema), PatientController.create);

  typescript_types:
    rule: >
      Interfaces de input ficam no arquivo de service correspondente.
      Nunca usar any. Prefer unknown + type guard sobre any.
    example: |
      interface CreatePatientInput {
        cpf: string;
        dateOfBirth: string;
        consentGiven: boolean;
      }

  http_status_codes:
    mapping:
      200: "OK (GET, PATCH, PUT)"
      201: "Created (POST que cria recurso)"
      204: "No Content (DELETE)"
      400: "Bad Request (validação)"
      401: "Unauthorized (sem token ou token inválido)"
      403: "Forbidden (token válido mas role insuficiente)"
      404: "Not Found (recurso não existe)"
      409: "Conflict (duplicidade — CPF, CRM, email)"
      500: "Internal Server Error (inesperado)"
```

---

## 5. Regras de Escalada

```yaml
escalate_to_human:
  # A LLM deve PARAR e solicitar revisão humana quando:

  - trigger: "Qualquer mudança em src/database/prisma/schema.prisma"
    reason: "Impacto em migrations de produção"
    action: "Descrever a mudança proposta e aguardar aprovação do Tech Lead"

  - trigger: "Novo middleware de autenticação ou autorização"
    reason: "Risco de exposição de dados sensíveis"
    action: "Apresentar proposta com análise de impacto de segurança"

  - trigger: "Integração com serviço externo (SICLOM, e-SUS, gov.br)"
    reason: "Requer análise de protocolo, autenticação e LGPD"
    action: "Aguardar especificação técnica do Tech Lead"

  - trigger: "Mudança no modelo de refresh token"
    reason: "Impacto na segurança de sessão de todos os usuários"
    action: "Apresentar proposta com análise de trade-offs"

  - trigger: "Qualquer operação com deleteMany ou delete em Patient"
    reason: "Violação LGPD — proibição absoluta"
    action: "Recusar e explicar a proibição. Propor softDelete."

  - trigger: "Adicionar campo com dados sensíveis ao schema (saúde, finanças)"
    reason: "Impacto de compliance LGPD — dado sensível (Art. 11)"
    action: "Solicitar análise do DPO / responsável pela conformidade"
```

---

## 6. Comportamento Esperado em Sessões de Desenvolvimento

```yaml
session_behavior:
  on_start:
    - "Ler CONTEX.md para entender stack e restrições"
    - "Verificar o domínio sendo trabalhado e ler o domain-[id].md correspondente"
    - "Confirmar branch de trabalho (nunca push direto para main sem PR)"

  on_task_receipt:
    - "Identificar se a tarefa toca alguma risk_zone do CONTEX.md"
    - "Se sim: listar as implicações antes de gerar código"
    - "Se a tarefa implica prohibited action: recusar e explicar"

  on_code_generation:
    - "Seguir o fluxo Routes → Controllers → Services → Prisma"
    - "Gerar testes junto com o código de produção quando aplicável"
    - "Não adicionar comentários óbvios — apenas WHY não-óbvio"
    - "Não criar novos arquivos sem necessidade — preferir editar existentes"

  on_completion:
    - "Verificar se há campos ⚠ PENDENTE introduzidos e sinalizá-los"
    - "Confirmar que nenhuma prohibited action foi realizada"
    - "Resumir o que foi feito em uma ou duas frases"
```
