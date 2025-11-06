// Bicep template para infraestrutura Azure do SIAD-PrEP
// Este é um exemplo inicial - será expandido durante a implementação

targetScope = 'subscription'

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string

@description('Azure region for resources')
param location string = 'brazilsouth'

@description('Project name')
param projectName string = 'siadprep'

@description('Tags to apply to all resources')
param tags object = {
  Project: 'SIAD-PrEP'
  Environment: environment
  ManagedBy: 'Bicep'
}

// Variables
var resourceGroupName = '${projectName}-${environment}-rg'
var containerAppsEnvName = '${projectName}-${environment}-cae'
var logAnalyticsName = '${projectName}-${environment}-law'
var appInsightsName = '${projectName}-${environment}-ai'
var keyVaultName = '${projectName}${environment}kv'
var sqlServerName = '${projectName}-${environment}-sql'
var cosmosDbName = '${projectName}-${environment}-cosmos'
var redisCacheName = '${projectName}-${environment}-redis'
var serviceBusName = '${projectName}-${environment}-sb'
var storageAccountName = '${projectName}${environment}st'
var containerRegistryName = '${projectName}${environment}acr'

// Resource Group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// Log Analytics Workspace
module logAnalytics './modules/log-analytics.bicep' = {
  scope: resourceGroup
  name: 'logAnalytics'
  params: {
    name: logAnalyticsName
    location: location
    tags: tags
  }
}

// Application Insights
module appInsights './modules/app-insights.bicep' = {
  scope: resourceGroup
  name: 'appInsights'
  params: {
    name: appInsightsName
    location: location
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
    tags: tags
  }
}

// Key Vault
module keyVault './modules/key-vault.bicep' = {
  scope: resourceGroup
  name: 'keyVault'
  params: {
    name: keyVaultName
    location: location
    tags: tags
  }
}

// Container Apps Environment
module containerAppsEnv './modules/container-apps-env.bicep' = {
  scope: resourceGroup
  name: 'containerAppsEnv'
  params: {
    name: containerAppsEnvName
    location: location
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
    tags: tags
  }
}

// Container Registry
module containerRegistry './modules/container-registry.bicep' = {
  scope: resourceGroup
  name: 'containerRegistry'
  params: {
    name: containerRegistryName
    location: location
    tags: tags
  }
}

// SQL Server
module sqlServer './modules/sql-server.bicep' = {
  scope: resourceGroup
  name: 'sqlServer'
  params: {
    name: sqlServerName
    location: location
    administratorLogin: 'sqladmin'
    tags: tags
  }
}

// Cosmos DB
module cosmosDb './modules/cosmos-db.bicep' = {
  scope: resourceGroup
  name: 'cosmosDb'
  params: {
    name: cosmosDbName
    location: location
    tags: tags
  }
}

// Redis Cache
module redisCache './modules/redis-cache.bicep' = {
  scope: resourceGroup
  name: 'redisCache'
  params: {
    name: redisCacheName
    location: location
    tags: tags
  }
}

// Service Bus
module serviceBus './modules/service-bus.bicep' = {
  scope: resourceGroup
  name: 'serviceBus'
  params: {
    name: serviceBusName
    location: location
    tags: tags
  }
}

// Storage Account
module storageAccount './modules/storage-account.bicep' = {
  scope: resourceGroup
  name: 'storageAccount'
  params: {
    name: storageAccountName
    location: location
    tags: tags
  }
}

// Outputs
output resourceGroupName string = resourceGroup.name
output containerAppsEnvId string = containerAppsEnv.outputs.id
output keyVaultName string = keyVault.outputs.name
output sqlServerFqdn string = sqlServer.outputs.fullyQualifiedDomainName
output cosmosDbEndpoint string = cosmosDb.outputs.endpoint
output serviceBusNamespace string = serviceBus.outputs.namespace
output storageAccountName string = storageAccount.outputs.name
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
