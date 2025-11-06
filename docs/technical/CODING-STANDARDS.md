# Padrões de Código SIAD-PrEP

## 🎯 Objetivo

Este documento define os padrões de código, convenções e boas práticas para o desenvolvimento do projeto SIAD-PrEP.

## 📋 Convenções Gerais

### Nomenclatura

#### **PascalCase**
Classes, interfaces, métodos públicos, propriedades, namespaces:
```csharp
public class PatientService
public interface IRepository<T>
public void ScheduleAppointment()
public string PatientName { get; set; }
namespace SiadPrep.UserPortal.Domain
```

#### **camelCase**
Parâmetros, variáveis locais, campos privados (com _):
```csharp
public void Method(string patientId)
var appointmentDate = DateTime.Now;
private readonly ILogger _logger;
```

#### **UPPER_CASE**
Constantes:
```csharp
public const int MAX_RETRY_ATTEMPTS = 3;
private const string API_BASE_URL = "https://api.example.com";
```

### Organização de Código

#### **Ordem de Membros em Classes**
1. Constantes
2. Campos privados
3. Propriedades públicas
4. Construtores
5. Métodos públicos
6. Métodos privados

```csharp
public class Patient
{
    // 1. Constantes
    private const int MAX_AGE = 120;

    // 2. Campos privados
    private readonly ILogger<Patient> _logger;
    private string _internalId;

    // 3. Propriedades públicas
    public Guid Id { get; private set; }
    public string Name { get; private set; }

    // 4. Construtores
    public Patient(string name, ILogger<Patient> logger)
    {
        Name = name;
        _logger = logger;
    }

    // 5. Métodos públicos
    public void UpdateName(string newName)
    {
        ValidateName(newName);
        Name = newName;
    }

    // 6. Métodos privados
    private void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty");
    }
}
```

## 🏛️ Domain-Driven Design (DDD)

### Entidades

```csharp
namespace SiadPrep.UserPortal.Domain.Entities
{
    public class Patient : Entity
    {
        // Propriedades não podem ser setadas externamente
        public string Name { get; private set; }
        public Email Email { get; private set; }
        public DateOnly BirthDate { get; private set; }

        // Coleções somente leitura
        private readonly List<Appointment> _appointments = new();
        public IReadOnlyCollection<Appointment> Appointments => _appointments.AsReadOnly();

        // Construtor privado para EF Core
        private Patient() { }

        // Factory method
        public static Patient Create(string name, Email email, DateOnly birthDate)
        {
            var patient = new Patient
            {
                Id = Guid.NewGuid(),
                Name = name,
                Email = email,
                BirthDate = birthDate,
                CreatedAt = DateTime.UtcNow
            };

            patient.AddDomainEvent(new PatientCreatedEvent(patient.Id));
            return patient;
        }

        // Métodos de negócio
        public void ScheduleAppointment(DateTime dateTime, string reason)
        {
            if (dateTime <= DateTime.UtcNow)
                throw new DomainException("Appointment must be in the future");

            var appointment = Appointment.Create(Id, dateTime, reason);
            _appointments.Add(appointment);

            AddDomainEvent(new AppointmentScheduledEvent(appointment.Id, Id));
        }
    }
}
```

### Value Objects

```csharp
namespace SiadPrep.Shared.Domain.ValueObjects
{
    public class Email : ValueObject
    {
        public string Value { get; private set; }

        private Email() { } // EF Core

        private Email(string value)
        {
            Value = value;
        }

        public static Result<Email> Create(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return Result.Fail<Email>("Email cannot be empty");

            if (!IsValidEmail(email))
                return Result.Fail<Email>("Invalid email format");

            return Result.Ok(new Email(email.ToLowerInvariant()));
        }

        private static bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        protected override IEnumerable<object> GetEqualityComponents()
        {
            yield return Value;
        }
    }
}
```

### Aggregates

```csharp
namespace SiadPrep.UserPortal.Domain.Aggregates
{
    // O Aggregate Root controla o acesso às entidades internas
    public class PatientAggregate : AggregateRoot
    {
        public Patient Patient { get; private set; }
        private readonly List<MedicalHistory> _medicalHistory = new();

        public IReadOnlyCollection<MedicalHistory> MedicalHistory =>
            _medicalHistory.AsReadOnly();

        // Invariantes do agregado são mantidas
        public void AddMedicalRecord(string description, DateTime date)
        {
            if (date > DateTime.UtcNow)
                throw new DomainException("Medical record cannot be in the future");

            var record = MedicalHistory.Create(Patient.Id, description, date);
            _medicalHistory.Add(record);

            // Eventos de domínio
            AddDomainEvent(new MedicalRecordAddedEvent(record.Id, Patient.Id));
        }
    }
}
```

### Domain Events

```csharp
namespace SiadPrep.UserPortal.Domain.Events
{
    public class PatientCreatedEvent : DomainEvent
    {
        public Guid PatientId { get; }

        public PatientCreatedEvent(Guid patientId)
        {
            PatientId = patientId;
        }
    }
}
```

### Domain Services

```csharp
namespace SiadPrep.UserPortal.Domain.Services
{
    public interface IPatientDomainService
    {
        Task<bool> CanScheduleAppointmentAsync(Guid patientId, DateTime dateTime);
    }

    public class PatientDomainService : IPatientDomainService
    {
        private readonly IPatientRepository _patientRepository;

        public PatientDomainService(IPatientRepository patientRepository)
        {
            _patientRepository = patientRepository;
        }

        public async Task<bool> CanScheduleAppointmentAsync(Guid patientId, DateTime dateTime)
        {
            var patient = await _patientRepository.GetByIdAsync(patientId);
            if (patient == null) return false;

            // Lógica de negócio complexa que envolve múltiplas entidades
            var existingAppointments = patient.Appointments
                .Where(a => a.DateTime.Date == dateTime.Date)
                .ToList();

            return existingAppointments.Count < 1; // Máximo 1 agendamento por dia
        }
    }
}
```

## 📦 Application Layer

### Commands (CQRS)

```csharp
namespace SiadPrep.UserPortal.Application.Commands
{
    public class CreatePatientCommand : IRequest<Result<Guid>>
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public DateOnly BirthDate { get; set; }
    }

    public class CreatePatientCommandHandler : IRequestHandler<CreatePatientCommand, Result<Guid>>
    {
        private readonly IPatientRepository _repository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<CreatePatientCommandHandler> _logger;

        public CreatePatientCommandHandler(
            IPatientRepository repository,
            IUnitOfWork unitOfWork,
            ILogger<CreatePatientCommandHandler> logger)
        {
            _repository = repository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Result<Guid>> Handle(
            CreatePatientCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Validação
                var emailResult = Email.Create(request.Email);
                if (emailResult.IsFailure)
                    return Result.Fail<Guid>(emailResult.Error);

                // Criação da entidade
                var patient = Patient.Create(
                    request.Name,
                    emailResult.Value,
                    request.BirthDate);

                // Persistência
                await _repository.AddAsync(patient);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Patient created: {PatientId}", patient.Id);

                return Result.Ok(patient.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating patient");
                return Result.Fail<Guid>("Error creating patient");
            }
        }
    }
}
```

### Queries (CQRS)

```csharp
namespace SiadPrep.UserPortal.Application.Queries
{
    public class GetPatientByIdQuery : IRequest<Result<PatientDto>>
    {
        public Guid PatientId { get; set; }
    }

    public class GetPatientByIdQueryHandler : IRequestHandler<GetPatientByIdQuery, Result<PatientDto>>
    {
        private readonly IPatientReadRepository _repository;
        private readonly IMapper _mapper;

        public GetPatientByIdQueryHandler(
            IPatientReadRepository repository,
            IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<Result<PatientDto>> Handle(
            GetPatientByIdQuery request,
            CancellationToken cancellationToken)
        {
            var patient = await _repository.GetByIdAsync(request.PatientId);

            if (patient == null)
                return Result.Fail<PatientDto>("Patient not found");

            var dto = _mapper.Map<PatientDto>(patient);
            return Result.Ok(dto);
        }
    }
}
```

### Validators

```csharp
namespace SiadPrep.UserPortal.Application.Validators
{
    public class CreatePatientCommandValidator : AbstractValidator<CreatePatientCommand>
    {
        public CreatePatientCommandValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required")
                .MaximumLength(100).WithMessage("Name must not exceed 100 characters");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format");

            RuleFor(x => x.BirthDate)
                .NotEmpty().WithMessage("Birth date is required")
                .Must(BeAValidAge).WithMessage("Patient must be between 0 and 120 years old");
        }

        private bool BeAValidAge(DateOnly birthDate)
        {
            var age = DateTime.Today.Year - birthDate.Year;
            return age >= 0 && age <= 120;
        }
    }
}
```

## 🗄️ Infrastructure Layer

### Repository Implementation

```csharp
namespace SiadPrep.UserPortal.Infrastructure.Repositories
{
    public class PatientRepository : IPatientRepository
    {
        private readonly ApplicationDbContext _context;

        public PatientRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Patient?> GetByIdAsync(Guid id)
        {
            return await _context.Patients
                .Include(p => p.Appointments)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task AddAsync(Patient patient)
        {
            await _context.Patients.AddAsync(patient);
        }

        public void Update(Patient patient)
        {
            _context.Patients.Update(patient);
        }

        public void Delete(Patient patient)
        {
            // Soft delete
            patient.IsDeleted = true;
            _context.Patients.Update(patient);
        }
    }
}
```

### Entity Configuration

```csharp
namespace SiadPrep.UserPortal.Infrastructure.Configurations
{
    public class PatientConfiguration : IEntityTypeConfiguration<Patient>
    {
        public void Configure(EntityTypeBuilder<Patient> builder)
        {
            builder.ToTable("Patients");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(100);

            // Value Object
            builder.OwnsOne(p => p.Email, email =>
            {
                email.Property(e => e.Value)
                    .HasColumnName("Email")
                    .IsRequired()
                    .HasMaxLength(255);
            });

            // Relacionamentos
            builder.HasMany(p => p.Appointments)
                .WithOne()
                .HasForeignKey("PatientId")
                .OnDelete(DeleteBehavior.Cascade);

            // Query Filter para Soft Delete
            builder.HasQueryFilter(p => !p.IsDeleted);

            // Índices
            builder.HasIndex(p => p.Email.Value).IsUnique();
        }
    }
}
```

## 🌐 API Layer

### Controllers

```csharp
namespace SiadPrep.UserPortal.API.Controllers
{
    [ApiController]
    [Route("api/v{version:apiVersion}/[controller]")]
    [ApiVersion("1.0")]
    [Authorize]
    public class PatientsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<PatientsController> _logger;

        public PatientsController(IMediator mediator, ILogger<PatientsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new patient
        /// </summary>
        /// <param name="command">Patient creation data</param>
        /// <returns>Created patient ID</returns>
        [HttpPost]
        [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreatePatient([FromBody] CreatePatientCommand command)
        {
            var result = await _mediator.Send(command);

            if (result.IsFailure)
                return BadRequest(new ProblemDetails { Detail = result.Error });

            return CreatedAtAction(
                nameof(GetPatient),
                new { id = result.Value },
                result.Value);
        }

        /// <summary>
        /// Gets a patient by ID
        /// </summary>
        /// <param name="id">Patient ID</param>
        /// <returns>Patient details</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PatientDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPatient(Guid id)
        {
            var query = new GetPatientByIdQuery { PatientId = id };
            var result = await _mediator.Send(query);

            if (result.IsFailure)
                return NotFound(new ProblemDetails { Detail = result.Error });

            return Ok(result.Value);
        }
    }
}
```

### Middleware

```csharp
namespace SiadPrep.Shared.Infrastructure.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (DomainException ex)
            {
                _logger.LogWarning(ex, "Domain exception occurred");
                await HandleExceptionAsync(context, ex, StatusCodes.Status400BadRequest);
            }
            catch (UnauthorizedException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access attempt");
                await HandleExceptionAsync(context, ex, StatusCodes.Status401Unauthorized);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred");
                await HandleExceptionAsync(context, ex, StatusCodes.Status500InternalServerError);
            }
        }

        private static async Task HandleExceptionAsync(
            HttpContext context,
            Exception exception,
            int statusCode)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/problem+json";

            var problemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = GetTitle(statusCode),
                Detail = exception.Message,
                Instance = context.Request.Path
            };

            await context.Response.WriteAsJsonAsync(problemDetails);
        }

        private static string GetTitle(int statusCode) => statusCode switch
        {
            StatusCodes.Status400BadRequest => "Bad Request",
            StatusCodes.Status401Unauthorized => "Unauthorized",
            StatusCodes.Status404NotFound => "Not Found",
            _ => "Internal Server Error"
        };
    }
}
```

## 🧪 Testes

### Unit Tests

```csharp
namespace SiadPrep.UserPortal.Tests.Unit.Domain
{
    public class PatientTests
    {
        [Fact]
        public void Create_WithValidData_ShouldCreatePatient()
        {
            // Arrange
            var name = "John Doe";
            var email = Email.Create("john@example.com").Value;
            var birthDate = new DateOnly(1990, 1, 1);

            // Act
            var patient = Patient.Create(name, email, birthDate);

            // Assert
            patient.Should().NotBeNull();
            patient.Name.Should().Be(name);
            patient.Email.Should().Be(email);
            patient.BirthDate.Should().Be(birthDate);
        }

        [Fact]
        public void ScheduleAppointment_WithPastDate_ShouldThrowException()
        {
            // Arrange
            var patient = CreateValidPatient();
            var pastDate = DateTime.UtcNow.AddDays(-1);

            // Act
            Action act = () => patient.ScheduleAppointment(pastDate, "Checkup");

            // Assert
            act.Should().Throw<DomainException>()
                .WithMessage("Appointment must be in the future");
        }

        private Patient CreateValidPatient()
        {
            return Patient.Create(
                "John Doe",
                Email.Create("john@example.com").Value,
                new DateOnly(1990, 1, 1));
        }
    }
}
```

### Integration Tests

```csharp
namespace SiadPrep.UserPortal.Tests.Integration.API
{
    public class PatientsControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public PatientsControllerTests(WebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task CreatePatient_WithValidData_ShouldReturnCreated()
        {
            // Arrange
            var command = new CreatePatientCommand
            {
                Name = "John Doe",
                Email = "john@example.com",
                BirthDate = new DateOnly(1990, 1, 1)
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/v1/patients", command);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var patientId = await response.Content.ReadFromJsonAsync<Guid>();
            patientId.Should().NotBeEmpty();
        }
    }
}
```

## 📝 Comentários e Documentação

### XML Documentation
Sempre documentar APIs públicas:
```csharp
/// <summary>
/// Schedules a new appointment for the patient
/// </summary>
/// <param name="dateTime">The date and time of the appointment</param>
/// <param name="reason">The reason for the appointment</param>
/// <exception cref="DomainException">Thrown when the date is in the past</exception>
public void ScheduleAppointment(DateTime dateTime, string reason)
{
    // Implementation
}
```

### Inline Comments
Use comentários apenas quando necessário para explicar "porquê", não "o quê":
```csharp
// BAD - comentário óbvio
// Incrementa o contador
counter++;

// GOOD - explica o raciocínio
// We need to wait 5 seconds due to API rate limiting
await Task.Delay(TimeSpan.FromSeconds(5));
```

## ✅ Code Review Checklist

- [ ] Código segue as convenções de nomenclatura
- [ ] Classes e métodos seguem o princípio de responsabilidade única
- [ ] Não há código duplicado
- [ ] Tratamento adequado de exceções
- [ ] Logging apropriado
- [ ] Testes unitários adicionados/atualizados
- [ ] Documentação XML para APIs públicas
- [ ] Sem hardcoded values (usar configuração)
- [ ] Validações de entrada implementadas
- [ ] Performance considerada (queries N+1, etc.)
- [ ] Segurança considerada (SQL injection, XSS, etc.)
- [ ] Compliance com LGPD (dados sensíveis)

---

**Última atualização:** 2025-11-06
