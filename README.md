# SIAD-PrEP

**Sistema Integrado de Agendamento e Distribuição de Profilaxia Pré-Exposição ao HIV**

[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg)](https://dotnet.microsoft.com/)
[![Azure](https://img.shields.io/badge/Azure-Container%20Apps-blue.svg)](https://azure.microsoft.com/)
[![Architecture](https://img.shields.io/badge/Architecture-Microservices%20DDD-orange.svg)]()

## 📋 Sobre o Projeto

O SIAD-PrEP é uma plataforma digital inovadora que visa revolucionar o acesso à Profilaxia Pré-Exposição (PrEP) no Brasil através do Sistema Único de Saúde (SUS). Com potencial para aumentar em 40% o número de usuários PrEP e reduzir em 25% as novas infecções por HIV nos próximos 5 anos.

### 🎯 Objetivos Principais

- Aumentar o acesso à PrEP nas populações vulneráveis
- Reduzir a taxa de abandono do tratamento preventivo
- Otimizar a gestão e distribuição de medicamentos
- Promover equidade no acesso à prevenção do HIV
- Gerar economia de R$ 142M em 5 anos

### 📊 Impacto Esperado

- **+40%** Aumento de usuários PrEP
- **-25%** Redução de novas infecções
- **100%** Cobertura digital dos municípios
- **3.000** Infecções evitadas em 5 anos
- **258%** ROI em 5 anos

## 🏗️ Arquitetura

O projeto segue uma arquitetura de **microserviços** utilizando **Domain-Driven Design (DDD)** com as seguintes características:

- **Linguagem:** C# / .NET 8.0
- **Arquitetura:** Microserviços com DDD
- **Infraestrutura:** Azure Container Apps
- **Banco de Dados:** Azure SQL Database, Cosmos DB
- **Mensageria:** Azure Service Bus
- **Cache:** Azure Redis Cache
- **Storage:** Azure Blob Storage
- **API Gateway:** Azure API Management / Ocelot

## 📁 Estrutura do Repositório

```
SIAD-PrEP/
├── docs/                              # Documentação do projeto
│   ├── executive/                     # Documentos executivos
│   ├── architecture/                  # Documentação de arquitetura
│   └── technical/                     # Documentação técnica
│
├── src/                               # Código fonte
│   ├── services/                      # Microserviços
│   │   ├── UserPortal.*              # Portal do Usuário
│   │   ├── ProfessionalPanel.*       # Painel Profissional
│   │   ├── MedicationManagement.*    # Gestão de Medicamentos
│   │   ├── Analytics.*               # Analytics e IA
│   │   ├── Identity.*                # Autenticação e Autorização
│   │   ├── Notification.*            # Notificações e Alertas
│   │   └── Integration.*             # Integrações Externas
│   │
│   ├── shared/                        # Componentes compartilhados
│   │   ├── SiadPrep.Shared.Domain/   # Domain compartilhado
│   │   ├── SiadPrep.Shared.Application/ # Application compartilhado
│   │   └── SiadPrep.Shared.Infrastructure/ # Infrastructure compartilhado
│   │
│   └── gateway/                       # API Gateway
│       └── SiadPrep.Gateway/
│
├── tests/                             # Testes
│   ├── unit/                          # Testes unitários
│   ├── integration/                   # Testes de integração
│   └── e2e/                          # Testes end-to-end
│
├── infrastructure/                    # Infraestrutura como código
│   ├── azure/                         # Templates Azure (Bicep/ARM)
│   ├── docker/                        # Dockerfiles
│   └── kubernetes/                    # Manifests K8s (opcional)
│
└── scripts/                           # Scripts utilitários
    ├── setup/                         # Scripts de configuração
    ├── deployment/                    # Scripts de deploy
    └── migration/                     # Scripts de migração
```

## 🧩 Microserviços

### 1. **UserPortal** - Portal do Usuário
Gerencia a experiência do usuário final (paciente)
- Agendamento de consultas
- Histórico médico pessoal
- Acompanhamento de tratamento
- Conteúdo educativo personalizado

**Stack:** ASP.NET Core Web API, Entity Framework Core

### 2. **ProfessionalPanel** - Painel Profissional
Interface para profissionais de saúde
- Dashboard analítico em tempo real
- Gestão de pacientes
- Prontuário eletrônico
- Ferramentas de teleconsulta

**Stack:** ASP.NET Core Web API, SignalR, Entity Framework Core

### 3. **MedicationManagement** - Gestão de Medicamentos
Controle inteligente de estoque e distribuição
- Controle de estoque
- Previsão de demanda com IA
- Rastreabilidade completa
- Integração com SICLOM

**Stack:** ASP.NET Core Web API, ML.NET, Entity Framework Core

### 4. **Analytics** - Analytics e IA
Inteligência artificial e análise de dados
- Predição de abandono
- Identificação de populações vulneráveis
- Análise de tendências epidemiológicas
- Dashboards e relatórios

**Stack:** ASP.NET Core Web API, ML.NET, Azure Cognitive Services

### 5. **Identity** - Identidade e Acesso
Gerenciamento de autenticação e autorização
- Single Sign-On (SSO)
- Autenticação multi-fator
- Controle de acesso baseado em papéis (RBAC)
- Integração com gov.br

**Stack:** ASP.NET Core Identity, IdentityServer, Azure AD B2C

### 6. **Notification** - Notificações
Sistema de notificações e lembretes
- Lembretes de consultas
- Alertas de medicação
- Notificações push/SMS/email
- Campanhas educativas

**Stack:** ASP.NET Core Web API, Azure Service Bus, SendGrid, Twilio

### 7. **Integration** - Integrações
Integração com sistemas externos
- SICLOM (Sistema de Controle Logístico de Medicamentos)
- e-SUS APS
- DATASUS
- Sistemas estaduais e municipais

**Stack:** ASP.NET Core Web API, Azure Service Bus

## 🔧 Stack Tecnológica

### Backend
- **.NET 8.0** - Framework principal
- **ASP.NET Core** - Web API
- **Entity Framework Core** - ORM
- **MediatR** - CQRS e Mediator Pattern
- **FluentValidation** - Validações
- **AutoMapper** - Mapeamento de objetos
- **Polly** - Resiliência e retry policies
- **Serilog** - Logging estruturado

### Frontend (Planejado)
- **Blazor WebAssembly** ou **React** - Portal web
- **React Native** ou **MAUI** - Aplicativos mobile
- **SignalR** - Comunicação em tempo real

### Infraestrutura Azure
- **Azure Container Apps** - Hospedagem de containers
- **Azure SQL Database** - Banco de dados relacional
- **Azure Cosmos DB** - Banco NoSQL para analytics
- **Azure Service Bus** - Mensageria assíncrona
- **Azure Redis Cache** - Cache distribuído
- **Azure Blob Storage** - Armazenamento de arquivos
- **Azure API Management** - API Gateway
- **Azure Application Insights** - Monitoramento e APM
- **Azure Key Vault** - Gestão de segredos
- **Azure AD B2C** - Autenticação de usuários

### DevOps
- **Azure DevOps** ou **GitHub Actions** - CI/CD
- **Docker** - Containerização
- **Bicep** ou **Terraform** - Infrastructure as Code
- **SonarQube** - Análise de código
- **OWASP ZAP** - Testes de segurança

## 🏛️ Domain-Driven Design (DDD)

Cada microserviço segue a estrutura DDD em camadas:

### **Domain Layer**
- **Entities:** Objetos com identidade única
- **Value Objects:** Objetos imutáveis sem identidade
- **Aggregates:** Cluster de entidades e value objects
- **Domain Events:** Eventos do domínio
- **Domain Services:** Lógica de negócio complexa
- **Repository Interfaces:** Contratos de persistência

### **Application Layer**
- **Use Cases / Commands / Queries:** Casos de uso da aplicação
- **DTOs:** Data Transfer Objects
- **Application Services:** Orquestração de casos de uso
- **Validators:** Validações de entrada
- **Mappers:** Mapeamento entre camadas

### **Infrastructure Layer**
- **Repository Implementations:** Implementação de repositórios
- **Data Context:** Entity Framework DbContext
- **External Services:** Integrações externas
- **Messaging:** Implementação de mensageria
- **Caching:** Implementação de cache

### **API Layer**
- **Controllers:** Endpoints da API
- **Middleware:** Pipeline de requisições
- **Filters:** Filtros e interceptadores
- **Configuration:** Configurações da aplicação

## 🚀 Roadmap de Desenvolvimento

### **Fase 1: Fundação (Q1 2026)**
- [x] Estruturação do repositório
- [ ] Setup da infraestrutura Azure
- [ ] Configuração de CI/CD
- [ ] Implementação do Shared Kernel
- [ ] Identity Service (MVP)
- [ ] API Gateway básico

### **Fase 2: MVP Core Services (Q2 2026)**
- [ ] UserPortal Service (funcionalidades básicas)
- [ ] ProfessionalPanel Service (funcionalidades básicas)
- [ ] MedicationManagement Service (controle básico)
- [ ] Notification Service
- [ ] Implementação de testes unitários

### **Fase 3: Piloto (Q3 2026)**
- [ ] Integration Service (SICLOM, e-SUS)
- [ ] Analytics Service (relatórios básicos)
- [ ] Aplicativo mobile (MVP)
- [ ] Implementação em 3 municípios piloto
- [ ] Testes de integração e e2e

### **Fase 4: Refinamento (Q4 2026)**
- [ ] Machine Learning para predição
- [ ] Otimizações de performance
- [ ] Melhorias de UX baseadas em feedback
- [ ] Compliance LGPD e segurança
- [ ] Documentação completa

### **Fase 5: Expansão (2027)**
- [ ] Escalabilidade para 5 estados
- [ ] Features avançadas de IA
- [ ] Integrações adicionais
- [ ] Monitoramento avançado

### **Fase 6: Nacional (2028)**
- [ ] Deployment nacional
- [ ] Alta disponibilidade
- [ ] Disaster recovery
- [ ] Otimização contínua

## 📚 Documentação

- [Documento Executivo](docs/executive/siad-prep-executive-doc.html)
- [Arquitetura de Solução](docs/architecture/ARCHITECTURE.md) *(em construção)*
- [Guia de Desenvolvimento](docs/technical/DEVELOPMENT.md) *(em construção)*
- [Padrões de Código](docs/technical/CODING-STANDARDS.md) *(em construção)*
- [Guia de Deploy Azure](docs/azure-deployment.md)

## 🤝 Contribuindo

Este é um projeto de saúde pública. Contribuições são bem-vindas! Por favor, leia nosso guia de contribuição antes de submeter PRs.

## 📄 Licença

Este projeto está licenciado sob a Apache License 2.0 - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Contato

- **Email:** projeto.siadprep@saude.gov.br
- **Website:** www.siadprep.saude.gov.br

## 🏆 Parceiros

- Ministério da Saúde
- UNAIDS Brasil
- Fiocruz
- CONASS / CONASEMS
- Sociedade Civil Organizada

---

## 🚀 Deploy no Azure Web App

Este projeto está configurado para deploy no **Azure Web App** via containers Docker com CI/CD automatizado pelo GitHub Actions.

### Recursos Azure utilizados

| Recurso | Finalidade | SKU recomendado |
|---------|-----------|-----------------|
| **Azure Web App** | Hospeda a API | B2 (Basic) ou superior |
| **Azure Database for PostgreSQL Flexible Server** | Banco de dados gerenciado | Burstable B1ms (dev) / General Purpose (prod) |
| **GitHub Container Registry (GHCR)** | Armazena a imagem Docker | Incluído no GitHub |
| **Azure Key Vault** *(recomendado)* | Gerencia segredos em produção | Standard |

### Pré-requisitos

- [Azure CLI](https://learn.microsoft.com/pt-br/cli/azure/install-azure-cli) instalado e autenticado (`az login`)
- Docker instalado localmente
- Conta GitHub com o repositório SIAD-PrEP
- Node.js 20+ instalado localmente

---

### Passo 1 — Criar a infraestrutura no Azure

#### 1.1 Variáveis do script

```bash
RESOURCE_GROUP="rg-siadprep-prod"
LOCATION="brazilsouth"
WEBAPP_NAME="siad-prep-app"           # deve ser globalmente único
POSTGRES_SERVER="siadprep-db-server"  # deve ser globalmente único
POSTGRES_DB="siadprep"
POSTGRES_USER="siadprepAdmin"
POSTGRES_PASSWORD="<senha-forte-aqui>"
APP_SERVICE_PLAN="asp-siadprep"
```

#### 1.2 Criar Resource Group

```bash
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION"
```

#### 1.3 Criar banco de dados PostgreSQL (Flexible Server)

```bash
az postgres flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --location "$LOCATION" \
  --admin-user "$POSTGRES_USER" \
  --admin-password "$POSTGRES_PASSWORD" \
  --sku-name "Standard_B1ms" \
  --tier "Burstable" \
  --version "16" \
  --storage-size 32 \
  --public-access "0.0.0.0"

az postgres flexible-server db create \
  --resource-group "$RESOURCE_GROUP" \
  --server-name "$POSTGRES_SERVER" \
  --database-name "$POSTGRES_DB"
```

> **Nota de segurança:** Em produção, restrinja `--public-access` a IPs específicos ou use uma Virtual Network (VNet).

#### 1.4 Criar App Service Plan (Linux)

```bash
az appservice plan create \
  --name "$APP_SERVICE_PLAN" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --is-linux \
  --sku B2
```

#### 1.5 Criar Azure Web App (container)

```bash
az webapp create \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_SERVICE_PLAN" \
  --deployment-container-image-name "ghcr.io/<seu-usuario-github>/<seu-repositorio>:latest"
```

---

### Passo 2 — Configurar variáveis de ambiente

```bash
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}.postgres.database.azure.com:5432/${POSTGRES_DB}?sslmode=require"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

az webapp config appsettings set \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    NODE_ENV="production" \
    DATABASE_URL="$DATABASE_URL" \
    JWT_SECRET="$JWT_SECRET" \
    JWT_EXPIRES_IN="7d" \
    BCRYPT_ROUNDS="12" \
    WEBSITES_PORT="8080"
```

> `WEBSITES_PORT=8080` instrui o Azure a rotear o tráfego para a porta exposta no `Dockerfile`.

---

### Passo 3 — Configurar o GitHub Actions (CI/CD)

O pipeline está em `.github/workflows/azure-deploy.yml` e executa 3 jobs em sequência:

```
push to main
  └─► test    → testes com PostgreSQL em container
  └─► build   → docker build + push → ghcr.io/<repo>:latest
  └─► deploy  → az webapp deploy → Azure Web App
```

#### 3.1 Criar Service Principal

```bash
az ad sp create-for-rbac \
  --name "sp-siadprep-deploy" \
  --role Contributor \
  --scopes "/subscriptions/<subscription-id>/resourceGroups/$RESOURCE_GROUP" \
  --sdk-auth
```

#### 3.2 Adicionar secret no GitHub

Acesse **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor |
|--------|-------|
| `AZURE_CREDENTIALS` | JSON retornado pelo comando acima |

#### 3.3 Atualizar o nome do Web App no workflow

```yaml
# .github/workflows/azure-deploy.yml
env:
  AZURE_WEBAPP_NAME: siad-prep-app   # ← nome exato do seu Web App
```

---

### Passo 4 — Migrações do banco de dados

O `Dockerfile` já executa `npx prisma migrate deploy` automaticamente no boot. Para verificar o status remotamente:

```bash
az webapp ssh --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP"
# dentro do container:
npx prisma migrate status
```

---

### Passo 5 — Verificar o deploy

```bash
# Health check
curl https://${WEBAPP_NAME}.azurewebsites.net/health
# Resposta esperada: {"status":"ok"}

# Logs em tempo real
az webapp log tail \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP"
```

---

### Segurança em produção

#### Azure Key Vault para secrets

```bash
az keyvault create --name "kv-siadprep" --resource-group "$RESOURCE_GROUP" --location "$LOCATION"

az keyvault secret set --vault-name "kv-siadprep" --name "JWT-SECRET" --value "$JWT_SECRET"
az keyvault secret set --vault-name "kv-siadprep" --name "DATABASE-URL" --value "$DATABASE_URL"

az webapp identity assign --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP"

WEBAPP_PRINCIPAL=$(az webapp identity show \
  --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" --query principalId -o tsv)

az keyvault set-policy --name "kv-siadprep" \
  --object-id "$WEBAPP_PRINCIPAL" --secret-permissions get list

az webapp config appsettings set \
  --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" \
  --settings \
    JWT_SECRET="@Microsoft.KeyVault(VaultName=kv-siadprep;SecretName=JWT-SECRET)" \
    DATABASE_URL="@Microsoft.KeyVault(VaultName=kv-siadprep;SecretName=DATABASE-URL)"
```

#### Regras de firewall para o PostgreSQL

```bash
WEBAPP_OUTBOUND_IPS=$(az webapp show \
  --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP" \
  --query outboundIpAddresses -o tsv)

for IP in $(echo $WEBAPP_OUTBOUND_IPS | tr ',' ' '); do
  az postgres flexible-server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$POSTGRES_SERVER" \
    --rule-name "allow-webapp-$IP" \
    --start-ip-address "$IP" \
    --end-ip-address "$IP"
done
```

---

### Checklist de deploy

- [ ] Resource Group criado
- [ ] PostgreSQL Flexible Server criado e acessível
- [ ] App Service Plan Linux criado
- [ ] Azure Web App criado com suporte a containers
- [ ] Variáveis de ambiente configuradas (`NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, `WEBSITES_PORT`)
- [ ] Secret `AZURE_CREDENTIALS` adicionado no GitHub
- [ ] `AZURE_WEBAPP_NAME` atualizado no workflow
- [ ] Push para `main` disparou o pipeline com sucesso
- [ ] `GET /health` retornando `{"status":"ok"}`
- [ ] Migrações Prisma aplicadas
- [ ] Regras de firewall do PostgreSQL configuradas
- [ ] Key Vault configurado com secrets sensíveis *(recomendado para produção)*

### Estimativa de custos (região Brazil South)

| Recurso | SKU | Custo estimado/mês |
|---------|-----|--------------------|
| App Service Plan B2 | 2 vCore, 3.5 GB RAM | ~USD 75 |
| PostgreSQL Flexible Server B1ms | 1 vCore, 2 GB RAM | ~USD 25 |
| Container Registry Basic | 10 GB storage | ~USD 5 |
| **Total estimado** | | **~USD 105/mês** |

> Preços aproximados. Consulte a [Calculadora de Preços Azure](https://azure.microsoft.com/pt-br/pricing/calculator/) para valores atualizados.

Guia completo e detalhado: [docs/azure-deployment.md](docs/azure-deployment.md)

---

**Desenvolvido com 💚 para o SUS Digital**
