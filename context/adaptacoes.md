# Adaptações deste projeto em relação ao harness

## Stack

O harness global declara Python · LangChain · LangGraph · LangSmith como stack padrão.
Este projeto usa **Node.js · TypeScript · Express · Prisma · PostgreSQL**.

**Motivo:** SIAD-PrEP é um sistema de agendamento e gestão clínica — uma API REST
transacional, não um sistema de orquestração de agentes. A stack Node/TypeScript é mais
adequada para esse perfil (ecosistema maduro para APIs REST, tipagem nativa, Prisma para
esquema relacional).

**Impacto:** Recomendações de código do harness que assumem Python não se aplicam aqui.
Toda sugestão de agente ou RAG futura deve ser avaliada neste contexto antes de adoção.

## Convenções de código

Seguir `dev-flow-harness/03-convencoes-padroes/` no espírito (clareza, sem over-engineering,
sem comentários desnecessários), mas aplicado a TypeScript — não Python.

## Guardrails de dados sensíveis

`dev-flow-harness/04-guardrails-seguranca/dados-sensiveis-saude.md` aplica-se integralmente.
Adicionalmente, este projeto segue LGPD explicitamente:
- Pacientes usam soft delete (`deletedAt`) — nunca hard delete
- `consentGiven` + `consentDate` obrigatórios
- CPF é dado sensível — nunca logar, nunca expor em resposta de erro
