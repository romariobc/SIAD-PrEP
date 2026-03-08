# Deploy do SIAD-PrEP no Azure Web App

Este guia cobre o deploy completo do SIAD-PrEP (Node.js + Express + TypeScript + Prisma + PostgreSQL) no **Azure Web App** usando containers Docker e CI/CD via GitHub Actions.

---

## Recursos Azure necessários

| Recurso | Finalidade | SKU recomendado |
|---------|-----------|-----------------|
| **Azure Web App** | Hospeda a API | B2 (Basic) ou superior |
| **Azure Database for PostgreSQL Flexible Server** | Banco de dados gerenciado | Burstable B1ms (dev) / General Purpose (prod) |
| **Azure Container Registry (ACR)** ou GitHub Container Registry | Armazena a imagem Docker | Basic |
| **Azure Key Vault** *(opcional, mas recomendado)* | Gerencia segredos em produção | Standard |

---

## Pré-requisitos

- [Azure CLI](https://learn.microsoft.com/pt-br/cli/azure/install-azure-cli) instalado e autenticado (`az login`)
- Docker instalado localmente
- Conta GitHub com o repositório SIAD-PrEP
- Node.js 20+ instalado localmente

---

## Passo 1 — Criar a infraestrutura no Azure

### 1.1 Variáveis de ambiente do script

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

### 1.2 Criar Resource Group

```bash
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION"
```

### 1.3 Criar banco de dados PostgreSQL (Flexible Server)

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

# Criar o banco de dados da aplicação
az postgres flexible-server db create \
  --resource-group "$RESOURCE_GROUP" \
  --server-name "$POSTGRES_SERVER" \
  --database-name "$POSTGRES_DB"
```

> **Nota de segurança:** Em produção, use `--public-access` com IPs específicos ou configure uma Virtual Network (VNet) para comunicação privada entre o Web App e o PostgreSQL.

### 1.4 Criar App Service Plan (Linux, para containers)

```bash
az appservice plan create \
  --name "$APP_SERVICE_PLAN" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --is-linux \
  --sku B2
```

### 1.5 Criar Azure Web App (para container)

```bash
az webapp create \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_SERVICE_PLAN" \
  --deployment-container-image-name "ghcr.io/<seu-usuario-github>/<seu-repositorio>:latest"
```

---

## Passo 2 — Configurar as variáveis de ambiente no Web App

As variáveis de ambiente substituem o arquivo `.env` em produção. Configure-as via Azure CLI ou pelo portal Azure (Configuração → Configurações do aplicativo).

```bash
# Montar a DATABASE_URL com a string de conexão do PostgreSQL
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER}.postgres.database.azure.com:5432/${POSTGRES_DB}?sslmode=require"

# Gerar um JWT_SECRET forte
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

> **WEBSITES_PORT=8080** instrui o Azure a rotear o tráfego para a porta 8080, que é a porta exposta no Dockerfile.

---

## Passo 3 — Configurar o GitHub Actions (CI/CD)

O arquivo `.github/workflows/azure-deploy.yml` já foi criado neste repositório. Você precisa configurar os seguintes **GitHub Secrets**:

### 3.1 Criar o Service Principal do Azure

```bash
az ad sp create-for-rbac \
  --name "sp-siadprep-deploy" \
  --role Contributor \
  --scopes "/subscriptions/<subscription-id>/resourceGroups/$RESOURCE_GROUP" \
  --sdk-auth
```

Copie o JSON retornado — ele será o valor do secret `AZURE_CREDENTIALS`.

### 3.2 Adicionar os secrets no GitHub

Acesse: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `AZURE_CREDENTIALS` | JSON retornado pelo comando acima |

> O `GITHUB_TOKEN` já é provido automaticamente pelo GitHub Actions para autenticação no GitHub Container Registry (GHCR).

### 3.3 Ajustar o nome do Web App no workflow

Edite `.github/workflows/azure-deploy.yml` e altere:

```yaml
env:
  AZURE_WEBAPP_NAME: siad-prep-app   # ← coloque o nome exato do seu Web App
```

### 3.4 Fluxo do pipeline

```
push to main
  └─► Job: test
        └─► PostgreSQL service container
        └─► npm ci + prisma generate + prisma migrate deploy + npm test
  └─► Job: build (após test)
        └─► docker build + push → ghcr.io/<repo>:latest
  └─► Job: deploy (após build)
        └─► az webapp deploy → Azure Web App
```

---

## Passo 4 — Primeira migração do banco de dados

A imagem Docker já executa `npx prisma migrate deploy` no `CMD` antes de iniciar o servidor. Isso garante que o schema esteja sempre atualizado no primeiro boot e em deploys subsequentes.

Para verificar o status das migrações remotamente:

```bash
az webapp ssh --name "$WEBAPP_NAME" --resource-group "$RESOURCE_GROUP"
# dentro do container:
npx prisma migrate status
```

---

## Passo 5 — Verificar o deploy

```bash
# Verificar se a API está respondendo
curl https://${WEBAPP_NAME}.azurewebsites.net/health

# Resposta esperada:
# {"status":"ok"}

# Ver logs em tempo real
az webapp log tail \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP"
```

---

## Configuração de domínio personalizado (opcional)

```bash
# Adicionar domínio personalizado
az webapp config hostname add \
  --webapp-name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --hostname "api.seudominio.gov.br"

# Habilitar TLS/SSL gerenciado pelo Azure (gratuito)
az webapp config ssl bind \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --certificate-thumbprint "<thumbprint>" \
  --ssl-type SNI
```

---

## Segurança em produção

### Variáveis sensíveis com Azure Key Vault

```bash
# Criar Key Vault
az keyvault create \
  --name "kv-siadprep" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION"

# Salvar secrets
az keyvault secret set --vault-name "kv-siadprep" --name "JWT-SECRET" --value "$JWT_SECRET"
az keyvault secret set --vault-name "kv-siadprep" --name "DATABASE-URL" --value "$DATABASE_URL"

# Habilitar identidade gerenciada no Web App
az webapp identity assign \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP"

# Dar permissão de leitura ao Web App no Key Vault
WEBAPP_PRINCIPAL=$(az webapp identity show \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query principalId -o tsv)

az keyvault set-policy \
  --name "kv-siadprep" \
  --object-id "$WEBAPP_PRINCIPAL" \
  --secret-permissions get list

# Referenciar secrets do Key Vault nas App Settings
az webapp config appsettings set \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    JWT_SECRET="@Microsoft.KeyVault(VaultName=kv-siadprep;SecretName=JWT-SECRET)" \
    DATABASE_URL="@Microsoft.KeyVault(VaultName=kv-siadprep;SecretName=DATABASE-URL)"
```

### Regras de firewall para o PostgreSQL

```bash
# Permitir apenas o IP de saída do Web App
WEBAPP_OUTBOUND_IPS=$(az webapp show \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query outboundIpAddresses -o tsv)

# Adicionar cada IP como regra de firewall
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

## Checklist de deploy

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

---

## Estimativa de custos (região Brazil South)

| Recurso | SKU | Custo estimado/mês |
|---------|-----|--------------------|
| App Service Plan B2 | 2 vCore, 3.5 GB RAM | ~USD 75 |
| PostgreSQL Flexible Server B1ms | 1 vCore, 2 GB RAM | ~USD 25 |
| Container Registry Basic | 10 GB storage | ~USD 5 |
| **Total estimado** | | **~USD 105/mês** |

> Preços aproximados. Consulte a [Calculadora de Preços Azure](https://azure.microsoft.com/pt-br/pricing/calculator/) para valores atualizados.

---

## Referências

- [Azure Web App for Containers — Documentação oficial](https://learn.microsoft.com/pt-br/azure/app-service/tutorial-custom-container)
- [Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/pt-br/azure/postgresql/flexible-server/)
- [GitHub Actions para Azure Web Apps](https://learn.microsoft.com/pt-br/azure/app-service/deploy-github-actions)
- [Azure Key Vault com App Service](https://learn.microsoft.com/pt-br/azure/app-service/app-service-key-vault-references)
- [Prisma deploy em produção](https://www.prisma.io/docs/orm/prisma-migrate/workflows/production-and-testing)
