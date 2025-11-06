# Guia de Desenvolvimento SIAD-PrEP

## 🚀 Começando

### Pré-requisitos

#### Ferramentas Obrigatórias
- **.NET 8.0 SDK** - [Download](https://dotnet.microsoft.com/download)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/downloads)
- **Visual Studio 2022** ou **VS Code** com C# extension

#### Ferramentas Recomendadas
- **Azure CLI** - Para deployment
- **SQL Server Management Studio (SSMS)** - Para gerenciar bancos de dados
- **Postman** ou **Insomnia** - Para testar APIs
- **Azure Storage Explorer** - Para gerenciar storage

### Configuração do Ambiente

#### 1. Clone o Repositório
```bash
git clone https://github.com/your-org/SIAD-PrEP.git
cd SIAD-PrEP
```

#### 2. Instale as Dependências
```bash
# Restaurar pacotes NuGet
dotnet restore

# Instalar ferramentas locais
dotnet tool restore
```

#### 3. Configure os Secrets
```bash
# Inicialize o user secrets para cada serviço
cd src/services/Identity.API
dotnet user-secrets init

# Adicione as configurações necessárias
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=SiadPrepIdentity;..."
```

#### 4. Docker Compose para Desenvolvimento
```bash
# Inicie os serviços de infraestrutura
docker-compose -f docker-compose.dev.yml up -d
```

Isso iniciará:
- SQL Server
- Redis
- Azure Storage Emulator
- Service Bus Emulator (opcional)

## 🏗️ Estrutura de Projeto

### Criando um Novo Microserviço

```bash
# Exemplo: criando o serviço UserPortal
cd src/services

# Domain Layer
dotnet new classlib -n UserPortal.Domain
cd UserPortal.Domain
dotnet add package MediatR

# Application Layer
cd ..
dotnet new classlib -n UserPortal.Application
cd UserPortal.Application
dotnet add reference ../UserPortal.Domain
dotnet add package MediatR
dotnet add package FluentValidation
dotnet add package AutoMapper

# Infrastructure Layer
cd ..
dotnet new classlib -n UserPortal.Infrastructure
cd UserPortal.Infrastructure
dotnet add reference ../UserPortal.Domain
dotnet add reference ../UserPortal.Application
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design

# API Layer
cd ..
dotnet new webapi -n UserPortal.API
cd UserPortal.API
dotnet add reference ../UserPortal.Application
dotnet add reference ../UserPortal.Infrastructure
dotnet add package Swashbuckle.AspNetCore
dotnet add package Serilog.AspNetCore
```

### Estrutura de Pastas do Microserviço

```
UserPortal.Domain/
├── Entities/
│   ├── Patient.cs
│   └── Appointment.cs
├── ValueObjects/
│   ├── Email.cs
│   └── PhoneNumber.cs
├── Aggregates/
│   └── PatientAggregate.cs
├── Events/
│   ├── PatientCreatedEvent.cs
│   └── AppointmentScheduledEvent.cs
├── Exceptions/
│   └── PatientNotFoundException.cs
├── Interfaces/
│   └── IPatientRepository.cs
└── Services/
    └── PatientDomainService.cs

UserPortal.Application/
├── Commands/
│   ├── CreatePatient/
│   │   ├── CreatePatientCommand.cs
│   │   ├── CreatePatientCommandHandler.cs
│   │   └── CreatePatientCommandValidator.cs
│   └── ScheduleAppointment/
│       ├── ScheduleAppointmentCommand.cs
│       └── ScheduleAppointmentCommandHandler.cs
├── Queries/
│   ├── GetPatientById/
│   │   ├── GetPatientByIdQuery.cs
│   │   └── GetPatientByIdQueryHandler.cs
│   └── GetPatients/
│       └── GetPatientsQuery.cs
├── DTOs/
│   ├── PatientDto.cs
│   └── AppointmentDto.cs
├── Mappings/
│   └── PatientMappingProfile.cs
└── Interfaces/
    └── IPatientReadRepository.cs

UserPortal.Infrastructure/
├── Data/
│   ├── ApplicationDbContext.cs
│   ├── Configurations/
│   │   ├── PatientConfiguration.cs
│   │   └── AppointmentConfiguration.cs
│   └── Migrations/
├── Repositories/
│   ├── PatientRepository.cs
│   └── PatientReadRepository.cs
├── ExternalServices/
│   └── NotificationServiceClient.cs
└── Messaging/
    └── ServiceBusPublisher.cs

UserPortal.API/
├── Controllers/
│   └── PatientsController.cs
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs
├── Filters/
│   └── ValidationFilter.cs
├── Extensions/
│   └── ServiceCollectionExtensions.cs
├── appsettings.json
├── appsettings.Development.json
└── Program.cs
```

## 💻 Desenvolvimento Local

### Executando um Microserviço

```bash
# Navegue até o projeto da API
cd src/services/UserPortal.API

# Execute
dotnet run

# Ou com hot reload
dotnet watch run
```

### Executando Múltiplos Microserviços

Use o Tye para gerenciar múltiplos serviços:

```bash
# Instale o Tye globalmente
dotnet tool install -g Microsoft.Tye --version "0.11.0-*"

# Execute todos os serviços
tye run
```

### Migrations

```bash
# Criar uma nova migration
cd src/services/UserPortal.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../UserPortal.API

# Aplicar migrations
dotnet ef database update --startup-project ../UserPortal.API

# Reverter uma migration
dotnet ef database update PreviousMigrationName --startup-project ../UserPortal.API

# Remover última migration não aplicada
dotnet ef migrations remove --startup-project ../UserPortal.API
```

### Testando APIs

#### Swagger UI
Acesse `https://localhost:5001/swagger` quando o serviço estiver rodando.

#### Exemplos com cURL

```bash
# Criar um paciente
curl -X POST https://localhost:5001/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "birthDate": "1990-01-01"
  }'

# Buscar um paciente
curl -X GET https://localhost:5001/api/v1/patients/{id} \
  -H "Authorization: Bearer {token}"
```

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
dotnet test

# Apenas unit tests
dotnet test --filter "Category=Unit"

# Apenas integration tests
dotnet test --filter "Category=Integration"

# Com coverage
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover
```

### Criando Testes Unitários

```bash
# Criar projeto de testes
cd tests/unit
dotnet new xunit -n UserPortal.Tests.Unit
cd UserPortal.Tests.Unit

# Adicionar dependências
dotnet add reference ../../../src/services/UserPortal.Domain
dotnet add package FluentAssertions
dotnet add package Moq
dotnet add package AutoFixture
```

### Criando Testes de Integração

```bash
# Criar projeto de testes de integração
cd tests/integration
dotnet new xunit -n UserPortal.Tests.Integration
cd UserPortal.Tests.Integration

# Adicionar dependências
dotnet add reference ../../../src/services/UserPortal.API
dotnet add package Microsoft.AspNetCore.Mvc.Testing
dotnet add package Testcontainers
```

## 📦 Pacotes NuGet Principais

### Shared Packages (Todos os Serviços)

```xml
<!-- MediatR para CQRS -->
<PackageReference Include="MediatR" Version="12.0.0" />

<!-- Logging -->
<PackageReference Include="Serilog.AspNetCore" Version="7.0.0" />
<PackageReference Include="Serilog.Sinks.ApplicationInsights" Version="4.0.0" />

<!-- Validação -->
<PackageReference Include="FluentValidation.AspNetCore" Version="11.3.0" />

<!-- Mapeamento -->
<PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.0" />
```

### Infrastructure Packages

```xml
<!-- Entity Framework Core -->
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />

<!-- Azure -->
<PackageReference Include="Azure.Identity" Version="1.10.0" />
<PackageReference Include="Azure.Storage.Blobs" Version="12.19.0" />
<PackageReference Include="Azure.Messaging.ServiceBus" Version="7.17.0" />
<PackageReference Include="StackExchange.Redis" Version="2.7.0" />

<!-- Resiliência -->
<PackageReference Include="Polly" Version="8.0.0" />
<PackageReference Include="Polly.Extensions.Http" Version="3.0.0" />
```

### API Packages

```xml
<!-- Swagger/OpenAPI -->
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />

<!-- Autenticação -->
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
<PackageReference Include="Microsoft.Identity.Web" Version="2.15.0" />

<!-- Versionamento de API -->
<PackageReference Include="Asp.Versioning.Mvc" Version="8.0.0" />

<!-- Health Checks -->
<PackageReference Include="AspNetCore.HealthChecks.SqlServer" Version="7.0.0" />
<PackageReference Include="AspNetCore.HealthChecks.Redis" Version="7.0.0" />
```

## 🐛 Debugging

### Visual Studio
1. Configure múltiplos projetos de startup
2. Right-click na solution → Properties → Startup Project
3. Selecione "Multiple startup projects"
4. Escolha os serviços que deseja executar

### VS Code
Configure `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "UserPortal.API",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build",
      "program": "${workspaceFolder}/src/services/UserPortal.API/bin/Debug/net8.0/UserPortal.API.dll",
      "args": [],
      "cwd": "${workspaceFolder}/src/services/UserPortal.API",
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  ]
}
```

### Logs
Os logs são estruturados usando Serilog:

```csharp
// Em desenvolvimento, logs vão para o console
_logger.LogInformation("Patient created: {PatientId}", patientId);

// Use structured logging
_logger.LogWarning("Appointment conflict for Patient: {PatientId} on {Date}",
    patientId, appointmentDate);
```

## 🔧 Ferramentas Úteis

### Code Formatting

```bash
# Instalar dotnet-format
dotnet tool install -g dotnet-format

# Formatar código
dotnet format
```

### Code Analysis

```bash
# Executar análise
dotnet build /p:RunAnalyzers=true

# Tratar warnings como erros
dotnet build /p:TreatWarningsAsErrors=true
```

### Database Tools

```bash
# Visualizar dados do EF Core
dotnet tool install --global dotnet-ef

# Script SQL de migration
dotnet ef migrations script --output migration.sql
```

## 🔐 Segurança Local

### User Secrets
Nunca commite secrets! Use User Secrets:

```bash
# Configurar connection string
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;..."

# Configurar API key
dotnet user-secrets set "ExternalServices:NotificationApi:ApiKey" "your-key"
```

### Certificados SSL Local
```bash
# Confiar no certificado de desenvolvimento
dotnet dev-certs https --trust
```

## 📊 Monitoramento Local

### Application Insights (Opcional)
Para desenvolvimento local, você pode desabilitar o Application Insights:

```json
// appsettings.Development.json
{
  "ApplicationInsights": {
    "InstrumentationKey": "",
    "EnableAdaptiveSampling": false
  }
}
```

### Health Checks
Acesse os health checks:
- `https://localhost:5001/health` - Status geral
- `https://localhost:5001/health/ready` - Ready probe
- `https://localhost:5001/health/live` - Liveness probe

## 🚀 Build e Publicação

### Build Local

```bash
# Debug build
dotnet build

# Release build
dotnet build -c Release

# Build com testes
dotnet build && dotnet test
```

### Docker Build Local

```bash
# Build da imagem
docker build -t siadprep/userportal:dev -f src/services/UserPortal.API/Dockerfile .

# Executar container
docker run -p 8080:80 siadprep/userportal:dev
```

## 📚 Recursos Adicionais

### Documentação Oficial
- [.NET Documentation](https://docs.microsoft.com/dotnet/)
- [ASP.NET Core](https://docs.microsoft.com/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/ef/core/)
- [Azure SDK for .NET](https://docs.microsoft.com/dotnet/azure/)

### Arquitetura e Padrões
- [Microsoft Architecture eBooks](https://dotnet.microsoft.com/learn/dotnet/architecture-guides)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Comunidade
- [Stack Overflow](https://stackoverflow.com/questions/tagged/.net-core)
- [Reddit r/dotnet](https://reddit.com/r/dotnet)

## ❓ Troubleshooting

### Problemas Comuns

#### Erro: "Port already in use"
```bash
# Linux/Mac
lsof -ti:5001 | xargs kill -9

# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

#### Erro: "Unable to connect to database"
Verifique se o SQL Server está rodando:
```bash
docker ps
# Se não estiver, inicie:
docker-compose -f docker-compose.dev.yml up -d sqlserver
```

#### Erro: "Migration already applied"
```bash
# Reverta e reaplique
dotnet ef database update 0
dotnet ef database update
```

---

**Última atualização:** 2025-11-06
