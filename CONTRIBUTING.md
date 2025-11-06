# Guia de Contribuição - SIAD-PrEP

Obrigado por considerar contribuir para o SIAD-PrEP! Este é um projeto de saúde pública que visa melhorar o acesso à PrEP no Brasil.

## 📋 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e colaborativo.

## 🚀 Como Contribuir

### 1. Setup do Ambiente

```bash
# Clone o repositório
git clone https://github.com/your-org/SIAD-PrEP.git
cd SIAD-PrEP

# Instale as dependências
dotnet restore

# Configure o ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Crie uma Branch

```bash
# Para features
git checkout -b feature/nome-da-feature

# Para bugs
git checkout -b bugfix/nome-do-bug

# Para hotfixes
git checkout -b hotfix/nome-do-hotfix
```

### 3. Faça suas Alterações

- Siga os [padrões de código](docs/technical/CODING-STANDARDS.md)
- Adicione/atualize testes
- Adicione/atualize documentação
- Faça commits descritivos

### 4. Commit

Usamos Conventional Commits:

```bash
# Formato
<tipo>(<escopo>): <descrição>

# Exemplos
feat(userportal): add appointment scheduling
fix(identity): resolve token expiration issue
docs(readme): update installation instructions
test(medication): add unit tests for stock management
refactor(analytics): improve prediction algorithm
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação de código
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção

### 5. Push e Pull Request

```bash
# Push da sua branch
git push origin feature/nome-da-feature

# Crie um Pull Request no GitHub
# - Descreva as mudanças
# - Referencie issues relacionadas
# - Adicione screenshots se aplicável
```

## ✅ Checklist de PR

Antes de submeter um PR, verifique:

- [ ] Código segue os padrões do projeto
- [ ] Testes adicionados/atualizados e passando
- [ ] Documentação atualizada
- [ ] Sem warnings de compilação
- [ ] Code coverage mantido/melhorado
- [ ] PR description completa
- [ ] Branch atualizada com a base
- [ ] Commits seguem Conventional Commits

## 🧪 Executando Testes

```bash
# Todos os testes
dotnet test

# Apenas unit tests
dotnet test --filter "Category=Unit"

# Com coverage
dotnet test /p:CollectCoverage=true
```

## 📝 Padrões de Código

### C# Style Guide

Seguimos as [convenções do projeto](docs/technical/CODING-STANDARDS.md):

```csharp
// ✅ BOM
public class PatientService
{
    private readonly IPatientRepository _repository;

    public PatientService(IPatientRepository repository)
    {
        _repository = repository;
    }

    public async Task<Patient> GetPatientAsync(Guid id)
    {
        return await _repository.GetByIdAsync(id);
    }
}

// ❌ RUIM
public class patientService
{
    private IPatientRepository repository;

    public patientService(IPatientRepository repo)
    {
        repository = repo;
    }

    public Patient GetPatient(Guid id)
    {
        return repository.GetByIdAsync(id).Result;
    }
}
```

### Git Commit Messages

```bash
# ✅ BOM
feat(userportal): add appointment cancellation feature

Allows users to cancel their scheduled appointments up to 24 hours
before the appointment time.

Closes #123

# ❌ RUIM
fixed stuff
updated code
```

## 🏗️ Arquitetura

Ao adicionar novas funcionalidades:

1. **Comece pelo domínio** - Modele entidades e value objects
2. **Application layer** - Crie commands/queries
3. **Infrastructure** - Implemente repositórios
4. **API** - Exponha endpoints

Sempre siga DDD e Clean Architecture.

## 🐛 Reportando Bugs

Use o template de issue para bugs:

1. Descrição clara do problema
2. Passos para reproduzir
3. Comportamento esperado vs atual
4. Screenshots/logs se aplicável
5. Ambiente (OS, versão do .NET, etc)

## 💡 Sugerindo Features

Use o template de issue para features:

1. Problema que resolve
2. Solução proposta
3. Alternativas consideradas
4. Impacto esperado

## 📚 Documentação

Contribuições de documentação são muito bem-vindas:

- Tutoriais
- Guias de uso
- Melhorias no README
- Exemplos de código
- Traduções

## 🔒 Segurança

Se encontrar uma vulnerabilidade de segurança:

**NÃO** abra uma issue pública. Envie para:
- Email: security@siadprep.saude.gov.br
- Seguir processo de disclosure responsável

## 📞 Dúvidas

- Abra uma [Discussion](https://github.com/your-org/SIAD-PrEP/discussions)
- Entre no nosso canal no Slack (link)
- Email: projeto.siadprep@saude.gov.br

## 🎉 Reconhecimento

Contribuidores serão reconhecidos em:
- README.md
- Release notes
- Hall of Fame

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a Apache License 2.0.

---

Obrigado por contribuir com o SIAD-PrEP! 💚
