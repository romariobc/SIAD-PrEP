# Arquitetura SIAD-PrEP

## 📐 Visão Geral da Arquitetura

O SIAD-PrEP segue uma arquitetura de **microserviços** baseada em **Domain-Driven Design (DDD)**, projetada para escalabilidade, manutenibilidade e resiliência.

## 🎯 Princípios Arquiteturais

### 1. **Separação de Responsabilidades**
Cada microserviço é responsável por um domínio de negócio específico e opera de forma independente.

### 2. **Domain-Driven Design**
- Modelagem rica do domínio
- Bounded Contexts bem definidos
- Linguagem ubíqua em cada contexto
- Aggregates para garantir consistência

### 3. **SOLID Principles**
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

### 4. **Clean Architecture**
- Independência de frameworks
- Testabilidade
- Independência de UI
- Independência de banco de dados
- Independência de agentes externos

### 5. **CQRS (Command Query Responsibility Segregation)**
Separação entre operações de leitura e escrita para otimização e escalabilidade.

### 6. **Event-Driven Architecture**
Comunicação assíncrona entre microserviços através de eventos de domínio.

## 🏛️ Diagrama de Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Web Portal  │  │ Mobile Apps  │  │ Professional Panel  │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Azure API Mgmt)                  │
│  - Roteamento          - Rate Limiting        - Autenticação    │
│  - Load Balancing      - Caching              - Monitoramento   │
└────────────────────────────┬────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
┌───────────────────┐ ┌──────────────┐ ┌─────────────────┐
│   Identity        │ │  User Portal │ │  Professional   │
│   Service         │ │  Service     │ │  Panel Service  │
│                   │ │              │ │                 │
│ - Auth/SSO        │ │ - Scheduling │ │ - Dashboard     │
│ - Azure AD B2C    │ │ - History    │ │ - EHR           │
│ - RBAC            │ │ - Education  │ │ - Telemedicine  │
└───────────────────┘ └──────────────┘ └─────────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
┌───────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  Medication       │ │  Analytics   │ │  Notification   │
│  Management       │ │  Service     │ │  Service        │
│                   │ │              │ │                 │
│ - Inventory       │ │ - ML Models  │ │ - Push/SMS      │
│ - Demand Predict  │ │ - Dashboards │ │ - Email         │
│ - SICLOM Sync     │ │ - Reports    │ │ - Reminders     │
└───────────────────┘ └──────────────┘ └─────────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Integration Service                            │
│  - SICLOM  - e-SUS APS  - DATASUS  - External Systems          │
└─────────────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
┌───────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  Azure Service    │ │  Data Layer  │ │  Observability  │
│  Bus              │ │              │ │                 │
│                   │ │ - SQL DB     │ │ - App Insights  │
│ - Queues          │ │ - Cosmos DB  │ │ - Log Analytics │
│ - Topics/Subs     │ │ - Redis      │ │ - Monitoring    │
│ - Event Grid      │ │ - Blob       │ │ - Alerting      │
└───────────────────┘ └──────────────┘ └─────────────────┘
```

## 🧩 Bounded Contexts

### 1. **User Management Context**
**Microserviço:** Identity Service
- Entidades: User, Role, Permission, Session
- Agregados: User Aggregate
- Eventos: UserRegistered, UserAuthenticated, RoleAssigned

### 2. **Patient Portal Context**
**Microserviço:** UserPortal Service
- Entidades: Patient, Appointment, MedicalHistory, EducationalContent
- Agregados: Patient Aggregate, Appointment Aggregate
- Eventos: AppointmentScheduled, AppointmentCancelled, HistoryUpdated

### 3. **Professional Management Context**
**Microserviço:** ProfessionalPanel Service
- Entidades: HealthProfessional, MedicalRecord, Consultation, Prescription
- Agregados: MedicalRecord Aggregate, Consultation Aggregate
- Eventos: ConsultationCompleted, PrescriptionIssued, RecordUpdated

### 4. **Medication Management Context**
**Microserviço:** MedicationManagement Service
- Entidades: Medication, Stock, Distribution, Batch, Supplier
- Agregados: Stock Aggregate, Distribution Aggregate
- Eventos: StockUpdated, MedicationDistributed, ExpirationAlert

### 5. **Analytics and Intelligence Context**
**Microserviço:** Analytics Service
- Entidades: Metric, Prediction, Report, Dashboard
- Agregados: Analytics Aggregate
- Eventos: PredictionGenerated, ReportCreated, AlertTriggered

### 6. **Notification Context**
**Microserviço:** Notification Service
- Entidades: Notification, Template, Schedule, Channel
- Agregados: Notification Aggregate
- Eventos: NotificationSent, NotificationDelivered, NotificationFailed

### 7. **Integration Context**
**Microserviço:** Integration Service
- Entidades: ExternalSystem, SyncJob, DataMapping
- Agregados: Integration Aggregate
- Eventos: DataSynchronized, SyncFailed, SystemConnected

## 🔄 Comunicação Entre Microserviços

### Comunicação Síncrona (HTTP/REST)
Utilizada para operações que requerem resposta imediata:
- Consultas de dados em tempo real
- Validações críticas
- Operações transacionais diretas

**Padrões:**
- REST API com HTTP/HTTPS
- Retry policies com Polly
- Circuit Breaker para resiliência
- Timeout configurável

### Comunicação Assíncrona (Event-Driven)
Utilizada para operações que não requerem resposta imediata:
- Notificações
- Sincronização de dados
- Processamento em background
- Eventos de domínio

**Tecnologia:**
- Azure Service Bus (Queues e Topics)
- Azure Event Grid (para eventos de infraestrutura)

**Padrões:**
- Publish/Subscribe
- Command/Event pattern
- Saga pattern para transações distribuídas
- Outbox pattern para consistência eventual

## 🗄️ Estratégia de Persistência

### Database per Service
Cada microserviço possui seu próprio banco de dados para garantir isolamento e autonomia.

### Tecnologias de Dados

#### **Azure SQL Database**
Usado para dados transacionais que requerem ACID:
- Identity Service
- UserPortal Service
- ProfessionalPanel Service
- MedicationManagement Service

**Padrões:**
- Repository Pattern
- Unit of Work
- Specification Pattern
- Soft Delete para auditoria

#### **Azure Cosmos DB**
Usado para dados não relacionais e alta escala:
- Analytics Service (séries temporais)
- Notification Service (logs de notificações)
- Integration Service (dados de sincronização)

**Características:**
- Particionamento eficiente
- Global distribution
- Alta disponibilidade

#### **Azure Redis Cache**
Caching distribuído para performance:
- Cache de sessões
- Cache de consultas frequentes
- Rate limiting
- Distributed locks

**Estratégias:**
- Cache-Aside pattern
- Write-Through pattern
- TTL configurável por contexto

#### **Azure Blob Storage**
Armazenamento de arquivos:
- Documentos médicos
- Imagens e anexos
- Backups
- Logs de longa duração

## 🔐 Segurança

### Autenticação e Autorização

#### **Azure AD B2C**
- Autenticação de usuários finais
- Integração com gov.br
- MFA (Multi-Factor Authentication)
- Social logins (opcional)

#### **Azure Managed Identity**
- Autenticação entre serviços Azure
- Acesso seguro a recursos
- Zero secrets em código

#### **JWT Tokens**
- Access Tokens (curta duração)
- Refresh Tokens (longa duração)
- Claims-based authorization

### Controle de Acesso

#### **RBAC (Role-Based Access Control)**
Papéis definidos:
- **Admin:** Acesso total ao sistema
- **HealthProfessional:** Acesso ao painel profissional
- **Patient:** Acesso ao portal do usuário
- **Pharmacist:** Gestão de medicamentos
- **Analyst:** Analytics e relatórios
- **Integrator:** Integrações externas

#### **ABAC (Attribute-Based Access Control)**
Controle fino baseado em atributos:
- Localização geográfica
- Unidade de saúde
- Especialização profissional
- Nível de sensibilidade dos dados

### Proteção de Dados (LGPD)

- **Criptografia em trânsito:** TLS 1.3
- **Criptografia em repouso:** Azure Storage Encryption
- **Anonimização:** Dados analíticos anonimizados
- **Pseudonimização:** Dados sensíveis pseudonimizados
- **Auditoria:** Logs completos de acesso a dados sensíveis
- **Data Retention:** Políticas de retenção configuráveis
- **Right to be Forgotten:** Processo de exclusão de dados

### Secrets Management

**Azure Key Vault:**
- Connection strings
- API keys
- Certificados
- Chaves de criptografia
- Rotação automática de secrets

## 🚦 API Gateway

### Funcionalidades

#### **Roteamento**
- Path-based routing
- Host-based routing
- Header-based routing

#### **Rate Limiting**
- Por usuário
- Por IP
- Por API key
- Políticas customizadas

#### **Caching**
- Response caching
- Cache invalidation
- Distributed caching

#### **Transformação**
- Request/Response transformation
- Protocol translation
- Header manipulation

#### **Segurança**
- Token validation
- CORS configuration
- IP whitelisting/blacklisting
- Request throttling

#### **Monitoramento**
- Request logging
- Performance metrics
- Error tracking
- Analytics

### Tecnologias

**Opção 1: Azure API Management**
- Solução gerenciada completa
- Portal do desenvolvedor
- Políticas avançadas
- Analytics integrado

**Opção 2: Ocelot**
- Open source .NET
- Flexível e customizável
- Menor custo
- Maior controle

## 📊 Observabilidade

### Application Insights

#### **Application Performance Monitoring (APM)**
- Request tracking
- Dependency tracking
- Exception tracking
- Custom metrics

#### **Distributed Tracing**
- Correlation IDs
- Trace context propagation
- End-to-end transaction tracking

#### **Logging**
- Structured logging com Serilog
- Log levels apropriados
- Correlation de logs
- Log aggregation

### Métricas

#### **Business Metrics**
- Número de agendamentos
- Taxa de adesão
- Taxa de abandono
- Tempo médio de atendimento

#### **Technical Metrics**
- Response time
- Throughput (requests/sec)
- Error rate
- Availability (SLA)
- Resource utilization

### Alerting

**Alertas Críticos:**
- Serviços inativos (downtime)
- Taxa de erro elevada (>5%)
- Tempo de resposta alto (>2s p95)
- Recursos próximos do limite

**Alertas de Aviso:**
- Taxa de erro moderada (2-5%)
- Tempo de resposta elevado (>1s p95)
- Uso de recursos elevado (>80%)

### Dashboards

- **Operations Dashboard:** Status geral dos serviços
- **Business Dashboard:** Métricas de negócio
- **Security Dashboard:** Eventos de segurança
- **Performance Dashboard:** Performance técnica

## 🔄 Resiliência

### Padrões de Resiliência (Polly)

#### **Retry Pattern**
```csharp
// Retry transiente para falhas temporárias
Policy
  .Handle<HttpRequestException>()
  .WaitAndRetryAsync(3, retryAttempt =>
    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))
  );
```

#### **Circuit Breaker**
```csharp
// Previne cascading failures
Policy
  .Handle<HttpRequestException>()
  .CircuitBreakerAsync(5, TimeSpan.FromMinutes(1));
```

#### **Timeout**
```csharp
// Timeout configurável
Policy
  .TimeoutAsync(TimeSpan.FromSeconds(10));
```

#### **Bulkhead Isolation**
```csharp
// Isolamento de recursos
Policy
  .BulkheadAsync(maxParallelization: 10, maxQueuingActions: 20);
```

### Health Checks

Endpoints de health check em todos os serviços:
- `/health` - Status básico
- `/health/ready` - Pronto para receber tráfego
- `/health/live` - Serviço vivo

**Verificações:**
- Database connectivity
- External dependencies
- Disk space
- Memory usage

### Disaster Recovery

#### **Backup Strategy**
- **RPO (Recovery Point Objective):** 1 hora
- **RTO (Recovery Time Objective):** 4 horas
- Backups automatizados diários
- Backups manuais antes de releases
- Geo-redundância

#### **High Availability**
- Multi-region deployment
- Active-Active ou Active-Passive
- Automatic failover
- Load balancing

## 📈 Escalabilidade

### Horizontal Scaling
- **Stateless services:** Fácil escalonamento horizontal
- **Auto-scaling:** Baseado em métricas (CPU, memória, requests)
- **Load balancing:** Azure Load Balancer

### Vertical Scaling
- Ajuste de recursos por container
- Otimização de queries
- Otimização de código

### Database Scaling
- Read replicas para queries
- Sharding para grandes volumes
- Partitioning por tenant
- Connection pooling

### Caching Strategy
- **L1 Cache:** In-memory cache por instância
- **L2 Cache:** Redis distribuído
- **CDN:** Para conteúdo estático

## 🧪 Estratégia de Testes

### Pirâmide de Testes

```
        ┌────────────┐
       ╱  E2E Tests  ╲
      ╱   (Poucos)    ╲
     ┌─────────────────┐
    ╱ Integration Tests ╲
   ╱      (Alguns)       ╲
  ┌──────────────────────┐
 ╱    Unit Tests          ╲
╱       (Muitos)           ╲
────────────────────────────
```

### Unit Tests
- **Coverage mínimo:** 80%
- **Frameworks:** xUnit, NUnit
- **Mocking:** Moq, NSubstitute
- **Testes de domínio:** 100% coverage

### Integration Tests
- Testes de API endpoints
- Testes de integração com banco de dados
- Testes de mensageria
- TestContainers para dependências

### E2E Tests
- Selenium ou Playwright
- Testes de fluxos críticos
- Ambiente de staging

### Performance Tests
- JMeter ou k6
- Load testing
- Stress testing
- Spike testing

## 🚀 Deployment Strategy

### Container Deployment

**Azure Container Apps:**
- Serverless containers
- Auto-scaling
- Zero-downtime deployments
- Built-in ingress

### CI/CD Pipeline

```
Code Push → Build → Unit Tests → Container Build →
  → Push to ACR → Deploy to Dev → Integration Tests →
  → Deploy to Staging → E2E Tests → Manual Approval →
  → Deploy to Production → Smoke Tests → Monitor
```

### Deployment Patterns

#### **Blue-Green Deployment**
- Zero downtime
- Rollback rápido
- Custos duplicados temporariamente

#### **Canary Deployment**
- Deployment gradual
- Menor risco
- Validação progressiva

#### **Rolling Deployment**
- Atualização gradual
- Sem downtime
- Rollback complexo

## 📋 Compliance e Conformidade

### LGPD (Lei Geral de Proteção de Dados)
- Consentimento explícito
- Portabilidade de dados
- Direito ao esquecimento
- Auditoria completa
- Data Protection Officer (DPO)

### Padrões de Saúde
- **HL7 FHIR:** Interoperabilidade
- **DICOM:** Imagens médicas (futuro)
- **IHE:** Integração de sistemas de saúde

### Normas Técnicas
- **ISO/IEC 27001:** Segurança da informação
- **ISO 9241-210:** Usabilidade
- **WCAG 2.1:** Acessibilidade

## 🎓 Próximos Passos

1. ✅ Estruturação do repositório
2. ⏳ Setup da infraestrutura Azure
3. ⏳ Implementação dos projetos .NET
4. ⏳ Configuração de CI/CD
5. ⏳ Desenvolvimento do Identity Service
6. ⏳ Desenvolvimento dos demais microserviços

---

**Última atualização:** 2025-11-06
