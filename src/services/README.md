# Microserviços SIAD-PrEP

Esta pasta contém todos os microserviços do sistema SIAD-PrEP, organizados seguindo os princípios de Domain-Driven Design (DDD).

## 📦 Microserviços

### 1. **Identity** - Identidade e Autenticação
Gerencia autenticação, autorização e controle de acesso.

**Responsabilidades:**
- Autenticação de usuários (SSO)
- Gestão de perfis e permissões (RBAC)
- Integração com Azure AD B2C e gov.br
- Tokens JWT

**Portas:**
- HTTP: 5001
- HTTPS: 5002

### 2. **UserPortal** - Portal do Usuário
Interface e lógica de negócio para usuários finais (pacientes).

**Responsabilidades:**
- Agendamento de consultas
- Histórico médico pessoal
- Acompanhamento de tratamento PrEP
- Conteúdo educativo

**Portas:**
- HTTP: 5003
- HTTPS: 5004

### 3. **ProfessionalPanel** - Painel Profissional
Interface e lógica para profissionais de saúde.

**Responsabilidades:**
- Dashboard analítico
- Gestão de pacientes
- Prontuário eletrônico
- Teleconsulta

**Portas:**
- HTTP: 5005
- HTTPS: 5006

### 4. **MedicationManagement** - Gestão de Medicamentos
Controle de estoque e distribuição de PrEP.

**Responsabilidades:**
- Controle de estoque
- Previsão de demanda (ML)
- Rastreabilidade
- Integração com SICLOM

**Portas:**
- HTTP: 5007
- HTTPS: 5008

### 5. **Analytics** - Analytics e IA
Análise de dados e inteligência artificial.

**Responsabilidades:**
- Predição de abandono
- Identificação de vulneráveis
- Dashboards e relatórios
- Machine Learning

**Portas:**
- HTTP: 5009
- HTTPS: 5010

### 6. **Notification** - Notificações
Sistema de notificações e alertas.

**Responsabilidades:**
- Lembretes de consultas
- Alertas de medicação
- Push/SMS/Email
- Campanhas educativas

**Portas:**
- HTTP: 5011
- HTTPS: 5012

### 7. **Integration** - Integrações
Integração com sistemas externos.

**Responsabilidades:**
- SICLOM
- e-SUS APS
- DATASUS
- Sistemas estaduais/municipais

**Portas:**
- HTTP: 5013
- HTTPS: 5014

## 🏗️ Estrutura de Cada Microserviço

Cada microserviço segue a estrutura DDD em camadas:

```
{ServiceName}/
├── {ServiceName}.Domain/          # Camada de Domínio
│   ├── Entities/                  # Entidades
│   ├── ValueObjects/              # Value Objects
│   ├── Aggregates/                # Agregados
│   ├── Events/                    # Domain Events
│   ├── Exceptions/                # Domain Exceptions
│   ├── Interfaces/                # Repository Interfaces
│   └── Services/                  # Domain Services
│
├── {ServiceName}.Application/     # Camada de Aplicação
│   ├── Commands/                  # Commands (CQRS)
│   ├── Queries/                   # Queries (CQRS)
│   ├── DTOs/                      # Data Transfer Objects
│   ├── Mappings/                  # AutoMapper Profiles
│   ├── Validators/                # FluentValidation
│   └── Interfaces/                # Application Interfaces
│
├── {ServiceName}.Infrastructure/  # Camada de Infraestrutura
│   ├── Data/                      # EF Core DbContext
│   │   ├── Configurations/        # Entity Configurations
│   │   └── Migrations/            # Database Migrations
│   ├── Repositories/              # Repository Implementations
│   ├── ExternalServices/          # External API Clients
│   └── Messaging/                 # Service Bus Integration
│
└── {ServiceName}.API/             # Camada de API
    ├── Controllers/               # API Controllers
    ├── Middleware/                # Custom Middleware
    ├── Filters/                   # Action Filters
    ├── Extensions/                # DI Extensions
    ├── Program.cs                 # Entry Point
    └── appsettings.json           # Configuration
```

## 🚀 Desenvolvimento

### Criar um Novo Microserviço

```bash
# 1. Criar projetos
./scripts/create-microservice.sh {ServiceName}

# 2. Adicionar à solution
dotnet sln add src/services/{ServiceName}.Domain
dotnet sln add src/services/{ServiceName}.Application
dotnet sln add src/services/{ServiceName}.Infrastructure
dotnet sln add src/services/{ServiceName}.API

# 3. Configurar referências entre projetos
# (Feito automaticamente pelo script)

# 4. Implementar o domínio
# 5. Implementar a aplicação
# 6. Implementar a infraestrutura
# 7. Implementar a API
```

### Executar Localmente

```bash
# Executar um serviço específico
cd src/services/{ServiceName}.API
dotnet run

# Ou executar todos os serviços
tye run
```

### Criar Migration

```bash
cd src/services/{ServiceName}.Infrastructure
dotnet ef migrations add MigrationName --startup-project ../{ServiceName}.API
dotnet ef database update --startup-project ../{ServiceName}.API
```

## 🧪 Testes

Cada microserviço deve ter:
- **Unit Tests** em `tests/unit/{ServiceName}.Tests.Unit`
- **Integration Tests** em `tests/integration/{ServiceName}.Tests.Integration`

```bash
# Executar testes de um serviço
dotnet test tests/unit/{ServiceName}.Tests.Unit
dotnet test tests/integration/{ServiceName}.Tests.Integration
```

## 📚 Documentação

Cada microserviço deve manter:
- README.md com overview
- Swagger/OpenAPI documentation
- Architecture Decision Records (ADRs)

## 🔗 Comunicação Entre Serviços

### Comunicação Síncrona
Use HTTP/REST para consultas em tempo real:
```csharp
// Exemplo
var client = _httpClientFactory.CreateClient("UserPortalClient");
var response = await client.GetAsync("/api/patients/{id}");
```

### Comunicação Assíncrona
Use Azure Service Bus para eventos:
```csharp
// Publicar evento
await _serviceBusPublisher.PublishAsync(new PatientCreatedEvent(patientId));

// Consumir evento
public class PatientCreatedEventHandler : IEventHandler<PatientCreatedEvent>
{
    public async Task Handle(PatientCreatedEvent @event)
    {
        // Processar evento
    }
}
```

## 🔐 Segurança

Todos os microserviços devem:
- Validar tokens JWT
- Implementar autorização baseada em roles/claims
- Usar HTTPS
- Sanitizar inputs
- Proteger contra OWASP Top 10

## 📊 Observabilidade

Todos os microserviços incluem:
- Structured logging (Serilog)
- Application Insights integration
- Health checks
- Distributed tracing

## 🐳 Docker

Cada serviço tem seu Dockerfile em:
`infrastructure/docker/Dockerfile.{ServiceName}`

Build:
```bash
docker build -t siadprep/{servicename}:latest -f infrastructure/docker/Dockerfile.{ServiceName} .
```

---

**Status:** Em planejamento - Nenhum microserviço implementado ainda
**Próximo passo:** Implementar Identity Service (MVP)
