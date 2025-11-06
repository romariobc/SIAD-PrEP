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
- [Guia de Deploy](docs/technical/DEPLOYMENT.md) *(em construção)*

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

**Desenvolvido com 💚 para o SUS Digital**
