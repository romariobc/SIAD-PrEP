# Azure Infrastructure

Esta pasta contém os templates Bicep para provisionamento da infraestrutura Azure do SIAD-PrEP.

## 📁 Estrutura

```
azure/
├── main.bicep              # Template principal
├── modules/                # Módulos reutilizáveis
│   ├── container-apps-env.bicep
│   ├── container-registry.bicep
│   ├── sql-server.bicep
│   ├── cosmos-db.bicep
│   ├── redis-cache.bicep
│   ├── service-bus.bicep
│   ├── storage-account.bicep
│   ├── key-vault.bicep
│   ├── log-analytics.bicep
│   └── app-insights.bicep
└── parameters/             # Arquivos de parâmetros por ambiente
    ├── dev.parameters.json
    ├── staging.parameters.json
    └── prod.parameters.json
```

## 🚀 Deployment

### Pré-requisitos

1. Azure CLI instalado
2. Autenticação configurada (`az login`)
3. Permissões adequadas na subscription

### Deploy de Infraestrutura

```bash
# Deploy para DEV
az deployment sub create \
  --location brazilsouth \
  --template-file main.bicep \
  --parameters parameters/dev.parameters.json

# Deploy para STAGING
az deployment sub create \
  --location brazilsouth \
  --template-file main.bicep \
  --parameters parameters/staging.parameters.json

# Deploy para PROD
az deployment sub create \
  --location brazilsouth \
  --template-file main.bicep \
  --parameters parameters/prod.parameters.json
```

### Validar Template

```bash
az deployment sub validate \
  --location brazilsouth \
  --template-file main.bicep \
  --parameters parameters/dev.parameters.json
```

### What-If (Preview de Mudanças)

```bash
az deployment sub what-if \
  --location brazilsouth \
  --template-file main.bicep \
  --parameters parameters/dev.parameters.json
```

## 🔐 Secrets Management

Secrets sensíveis devem ser armazenados no Azure Key Vault:

```bash
# Adicionar SQL password ao Key Vault
az keyvault secret set \
  --vault-name siadprepdevkv \
  --name "SqlServerPassword" \
  --value "YourStrongPassword123!"

# Adicionar connection string ao Key Vault
az keyvault secret set \
  --vault-name siadprepdevkv \
  --name "SqlConnectionString" \
  --value "Server=tcp:siadprep-dev-sql.database.windows.net,1433;..."
```

## 📊 Recursos Provisionados

### Compute
- **Azure Container Apps Environment** - Hospedagem de microserviços
- **Container Registry** - Registry privado de imagens Docker

### Data
- **Azure SQL Database** - Banco de dados relacional
- **Cosmos DB** - Banco NoSQL para analytics
- **Azure Cache for Redis** - Cache distribuído
- **Storage Account** - Blob storage para arquivos

### Messaging
- **Service Bus** - Mensageria assíncrona

### Security
- **Key Vault** - Gerenciamento de secrets
- **Managed Identities** - Autenticação entre serviços

### Monitoring
- **Log Analytics** - Agregação de logs
- **Application Insights** - APM e monitoring

## 💰 Estimativa de Custos

### Ambiente DEV (mensal)
- Container Apps: ~$50
- SQL Database (Basic): ~$5
- Redis (Basic): ~$17
- Service Bus (Basic): ~$10
- Storage: ~$5
- **Total: ~$87/mês**

### Ambiente PROD (mensal)
- Container Apps: ~$200
- SQL Database (Standard S2): ~$150
- Redis (Standard C1): ~$75
- Service Bus (Standard): ~$10
- Storage: ~$20
- **Total: ~$455/mês**

*Valores aproximados, verificar preços atuais no Azure Pricing Calculator*

## 🔄 CI/CD

A infraestrutura é provisionada automaticamente via Azure DevOps / GitHub Actions.
Ver pipeline em `/.github/workflows/infrastructure.yml` ou `azure-pipelines.yml`

## 📚 Referências

- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Container Apps](https://docs.microsoft.com/azure/container-apps/)
- [Azure Architecture Center](https://docs.microsoft.com/azure/architecture/)
