# Prompt para o Claude Design — Frontend do SIAD-PrEP

> Cole o texto abaixo no claude.ai/design ao iniciar/evoluir o Design System Project do SIAD-PrEP.
> Este prompt descreve **objetivo, funcionalidades já implementadas no backend, comportamento esperado e sugestão de componentes** — deliberadamente sem definir paleta de cores, tipografia ou estilo visual, para que isso seja definido no Design System.

---

## Objetivo do sistema

SIAD-PrEP é uma plataforma pública de saúde para gestão da Profilaxia Pré-Exposição (PrEP) ao HIV. Ela conecta três tipos de usuário — **pacientes**, **profissionais de saúde** e **administradores** — em torno de quatro fluxos centrais: cadastro/autenticação, cadastro e acompanhamento de pacientes, agendamento de consultas, e prescrição/dispensação de medicação.

É um sistema de uso real em contexto clínico: precisa transmitir **confiança, clareza e seriedade**, reduzir erros de entrada de dados sensíveis, e ser utilizável tanto por profissionais de saúde operando rapidamente durante o expediente quanto por pacientes leigos em tecnologia.

O backend (API REST em Node.js/Express) já está implementado e é a fonte de verdade para tudo abaixo. O frontend ainda não existe — esta é a primeira versão.

---

## Perfis de usuário (roles)

| Papel | Quem é | O que pode fazer |
|---|---|---|
| **PATIENT** | Paciente em acompanhamento de PrEP | Ver e editar seus próprios dados, ver suas próprias consultas e medicações, agendar consulta |
| **PROFESSIONAL** | Médico/profissional de saúde (identificado por CRM) | Ver e gerenciar pacientes, consultas e medicações de forma ampla; prescrever e dispensar medicação |
| **ADMIN** | Administrador do sistema | Tudo que PROFESSIONAL pode, mais: excluir (soft delete) pacientes, cadastrar profissionais |

O autorregistro público só permite criar conta como PATIENT ou PROFESSIONAL — nunca como ADMIN (isso é bloqueado deliberadamente no backend por segurança).

Cada tela deve deixar claro **em nome de quem** a ação está sendo feita e esconder ações que o papel atual não pode executar (o backend já rejeita no servidor, mas a interface não deve nem oferecer o botão).

---

## Funcionalidades já implementadas (o que a UI precisa cobrir)

### 1. Autenticação
- **Cadastro** (nome, e-mail, senha, papel PATIENT/PROFESSIONAL)
- **Login** (e-mail + senha)
- Sessão baseada em token de acesso de curta duração + token de renovação de longa duração (renovação automática esperada, transparente para o usuário)
- Após login, cada papel deve cair numa "home" diferente (ex.: paciente vê seus próprios dados; profissional/admin vê uma visão de trabalho com listas)

### 2. Pacientes
- **Cadastro de paciente** vinculado à própria conta (CPF, data de nascimento, telefone opcional, endereço opcional, **consentimento explícito de tratamento de dados** — obrigatório, é um checkbox real de consentimento LGPD, não pode ser pré-marcado)
- **Listagem de pacientes** (somente PROFESSIONAL/ADMIN) — precisa suportar volume real (paginação/busca, não só uma lista estática)
- **Perfil/detalhe do paciente** — paciente só vê o próprio; profissional/admin vê qualquer um
- **Edição de dados do paciente** (telefone, endereço, data de nascimento, consentimento) — CPF **não é editável** depois do cadastro
- **Revogar/conceder consentimento** deve ser uma ação visível e explícita, não escondida num formulário genérico — é dado LGPD sensível
- **Exclusão de paciente** (somente ADMIN) — é soft delete (o registro é desativado, não apagado); a UI deve deixar claro que é uma ação de "desativar", com confirmação forte, não um delete instantâneo

### 3. Consultas (agendamentos)
- **Listagem de consultas** — cada papel vê um recorte diferente automaticamente (paciente: só as suas; profissional: só as que são dele; admin: todas), ordenadas por data
- **Detalhe de uma consulta** (paciente, profissional, data/hora, tipo, status, observações)
- **Tipos de consulta**: Inicial, Retorno, Resultado de exame, Telemedicina
- **Status possíveis**: Agendada, Concluída, Cancelada — precisa de indicação visual clara e rápida de reconhecer (ex.: um paciente olhando a lista precisa identificar em menos de 1 segundo o que já passou, o que é cancelado, o que está por vir)
- **Agendar nova consulta** (escolher paciente, profissional, data/hora, tipo, observações opcionais)
- **Cancelar consulta** / **Marcar consulta como concluída** — ações rápidas, idealmente sem sair da lista (ex.: botão de ação direto no item)

### 4. Medicação (regime PrEP)
- Visível só para PROFESSIONAL/ADMIN na listagem geral; paciente só vê a própria
- **Registro de medicação**: paciente vinculado, regime (dois esquemas possíveis: Tenofovir+Entricitabina ou Tenofovir+Lamivudina), data de início, data de fim opcional, profissional prescritor
- **Histórico de dispensação**: cada medicação pode ter múltiplos registros de dispensação (quantidade entregue + data) — pense nisso como uma linha do tempo/histórico dentro do detalhe da medicação
- **Registrar nova dispensação** (quantidade, data opcional — default é agora)
- Por ser dado de saúde altamente sensível (revela status de uso de PrEP), esta é a área que mais precisa de cuidado com quem vê o quê — a UI deve reforçar visualmente que está numa área confidencial

### 5. Profissionais
- **Listagem de profissionais** (visível a todos os papéis autenticados — é informação pública dentro do sistema, ex.: para escolher quem agendar)
- **Cadastro de profissional** (somente ADMIN): CRM, especialidade, telefone opcional
- **Edição de profissional** (ADMIN ou o próprio profissional): especialidade, telefone

---

## Regras de negócio que a interface precisa respeitar (vêm do backend, não são negociáveis)

- Um paciente **nunca** deve conseguir navegar para o dado de outro paciente — mesmo que a interface tente, o backend bloqueia com "não encontrado" (não "sem permissão", propositalmente, para não confirmar que o registro existe). A UI deve tratar esse erro de forma amigável, não como um bug.
- Toda ação de escrita (cadastro, edição, agendamento, prescrição) deve mostrar validação de campo **antes** de submeter (o backend também valida e retorna erros por campo — a UI precisa saber mapear esses erros de volta para o campo certo do formulário)
- Login/cadastro têm limite de tentativas (rate limiting) — a UI precisa de um estado de erro claro para "muitas tentativas, aguarde" que não pareça um erro genérico de sistema
- Paciente excluído (soft delete) nunca deve aparecer em listas, buscas ou seleção de paciente em novos formulários — como se não existisse

---

## Resultado desejado

Uma aplicação web (React) que:
1. Deixa óbvio, a qualquer momento, **quem está logado e com que papel**
2. Reduz erro de digitação em dados sensíveis (CPF, datas, quantidades de medicação) com máscaras/formatos e validação em tempo real
3. Torna rápido o trabalho repetitivo do profissional de saúde (listar → abrir → agir, sem passos extras)
4. Torna claro e não-intimidador o fluxo do paciente (poucos campos por vez, linguagem simples, sem jargão técnico desnecessário)
5. Comunica estados vazios, de carregamento e de erro de forma explícita em todas as listas e formulários (nunca uma tela em branco sem explicação)
6. É responsiva (profissionais podem usar em tablet durante atendimento; pacientes majoritariamente em celular)

## Sugestão de componentes para o Design System

- Formulário de autenticação (login / cadastro com seleção de papel)
- Shell de navegação consciente de papel (menu que muda conforme PATIENT / PROFESSIONAL / ADMIN)
- Card de paciente (resumo) + tela de detalhe/perfil de paciente
- Toggle/indicador de consentimento LGPD (estado ligado/desligado bem distinto)
- Lista/tabela com paginação e busca (reutilizável para pacientes, consultas, profissionais, medicações)
- Badge de status de consulta (Agendada / Concluída / Cancelada) — variantes visualmente distinguíveis sem depender só de cor (ícone ou texto também)
- Badge/indicador de tipo de consulta (Inicial / Retorno / Resultado de exame / Telemedicina)
- Formulário de agendamento de consulta (seleção de paciente + profissional + data/hora)
- Ações rápidas inline em item de lista (cancelar / concluir consulta)
- Timeline/histórico de dispensação de medicação
- Formulário de prescrição de medicação e de registro de dispensação
- Modal/diálogo de confirmação forte para ações destrutivas (excluir paciente)
- Estado vazio (lista sem itens), estado de carregamento (skeleton), estado de erro (incluindo "não encontrado" tratado de forma amigável e "muitas tentativas, aguarde")
- Mensagens de erro de validação vinculadas a campo específico de formulário
