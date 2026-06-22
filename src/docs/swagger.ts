import { OpenAPIV3 } from 'openapi-types';

const bearerAuth: OpenAPIV3.SecuritySchemeObject = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Access token obtido via POST /api/auth/login ou /api/auth/register',
};

export const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'SIAD-PrEP API',
    version: '0.1.0',
    description:
      'Plataforma de saúde pública brasileira para gestão da Profilaxia Pré-Exposição (PrEP) ao HIV. ' +
      'Todos os dados de pacientes são protegidos pela LGPD: exclusão suave, consentimento explícito e CPF nunca exposto em logs.',
    contact: {
      name: 'Equipe SIAD-PrEP',
    },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Desenvolvimento local' },
  ],
  tags: [
    { name: 'Auth', description: 'Registro, login e renovação de tokens' },
    { name: 'Patients', description: 'Gestão de pacientes (LGPD)' },
    { name: 'Appointments', description: 'Agendamentos de consultas' },
    { name: 'Medications', description: 'Prescrição e dispensação de PrEP' },
    { name: 'Professionals', description: 'Profissionais de saúde' },
  ],
  components: {
    securitySchemes: { bearerAuth },
    schemas: {
      // ── Common ──────────────────────────────────────────────────────────
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid credentials' },
        },
        required: ['error'],
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Validation error' },
          details: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
            example: { email: ['Invalid email'] },
          },
        },
        required: ['error', 'details'],
      },
      // ── Auth ─────────────────────────────────────────────────────────────
      UserRole: {
        type: 'string',
        enum: ['PATIENT', 'PROFESSIONAL', 'ADMIN'],
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'ana.silva@sus.gov.br' },
          password: { type: 'string', minLength: 8, example: 'SenhaSegura1!' },
          name: { type: 'string', minLength: 2, example: 'Ana Silva' },
          role: { $ref: '#/components/schemas/UserRole', default: 'PATIENT' },
        },
      },
      RegisterResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              role: { $ref: '#/components/schemas/UserRole' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'ana.silva@sus.gov.br' },
          password: { type: 'string', example: 'SenhaSegura1!' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'Token de acesso (curta duração)' },
          refreshToken: { type: 'string', description: 'Token de renovação (30 dias)' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      RefreshResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
        },
      },
      GoogleLoginRequest: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: {
            type: 'string',
            description: 'ID Token obtido pelo frontend via Google Sign-In SDK (credential.credential)',
            example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      GoogleLoginResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              role: { $ref: '#/components/schemas/UserRole' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      // ── Patient ───────────────────────────────────────────────────────────
      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          cpf: { type: 'string', minLength: 11, maxLength: 11, description: 'CPF (sensível — LGPD)' },
          dateOfBirth: { type: 'string', format: 'date-time' },
          phone: { type: 'string', nullable: true },
          address: { type: 'string', nullable: true },
          consentGiven: { type: 'boolean' },
          consentDate: { type: 'string', format: 'date-time', nullable: true },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreatePatientRequest: {
        type: 'object',
        required: ['cpf', 'dateOfBirth', 'consentGiven'],
        properties: {
          cpf: { type: 'string', minLength: 11, maxLength: 11, example: '12345678901' },
          dateOfBirth: { type: 'string', format: 'date-time', example: '1990-05-15T00:00:00.000Z' },
          phone: { type: 'string', example: '11999999999' },
          address: { type: 'string', example: 'Rua das Flores, 123, São Paulo – SP' },
          consentGiven: { type: 'boolean', example: true },
        },
      },
      UpdatePatientRequest: {
        type: 'object',
        properties: {
          phone: { type: 'string' },
          address: { type: 'string' },
          consentGiven: { type: 'boolean' },
        },
      },
      // ── Appointment ───────────────────────────────────────────────────────
      AppointmentType: {
        type: 'string',
        enum: ['INITIAL', 'FOLLOWUP', 'LAB_RESULT', 'TELEMEDICINE'],
      },
      AppointmentStatus: {
        type: 'string',
        enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          professionalId: { type: 'string', format: 'uuid' },
          scheduledAt: { type: 'string', format: 'date-time' },
          type: { $ref: '#/components/schemas/AppointmentType' },
          status: { $ref: '#/components/schemas/AppointmentStatus' },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateAppointmentRequest: {
        type: 'object',
        required: ['patientId', 'professionalId', 'scheduledAt', 'type'],
        properties: {
          patientId: { type: 'string', format: 'uuid' },
          professionalId: { type: 'string', format: 'uuid' },
          scheduledAt: { type: 'string', format: 'date-time', example: '2026-06-10T09:00:00.000Z' },
          type: { $ref: '#/components/schemas/AppointmentType' },
          notes: { type: 'string', example: 'Primeira consulta PrEP' },
        },
      },
      // ── Medication ────────────────────────────────────────────────────────
      MedicationRegimen: {
        type: 'string',
        enum: ['TENOFOVIR_EMTRICITABINA', 'TENOFOVIR_LAMIVUDINA'],
        description: 'Regime de PrEP prescrito conforme protocolo do Ministério da Saúde',
      },
      Medication: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          regimen: { $ref: '#/components/schemas/MedicationRegimen' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          prescribedBy: { type: 'string', format: 'uuid', description: 'ID do profissional prescritor' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateMedicationRequest: {
        type: 'object',
        required: ['patientId', 'regimen', 'startDate', 'prescribedBy'],
        properties: {
          patientId: { type: 'string', format: 'uuid' },
          regimen: { $ref: '#/components/schemas/MedicationRegimen' },
          startDate: { type: 'string', format: 'date-time', example: '2026-01-15T00:00:00.000Z' },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          prescribedBy: { type: 'string', format: 'uuid' },
        },
      },
      DispenseRequest: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'integer', minimum: 1, example: 30, description: 'Quantidade de comprimidos dispensados' },
          dispensedAt: { type: 'string', format: 'date-time', description: 'Data/hora da dispensação (padrão: agora)' },
        },
      },
      Dispense: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          medicationId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer' },
          dispensedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // ── Professional ──────────────────────────────────────────────────────
      Professional: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          crm: { type: 'string', example: 'CRM-SP-123456' },
          specialty: { type: 'string', example: 'Infectologia' },
          phone: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProfessionalRequest: {
        type: 'object',
        required: ['crm', 'specialty'],
        properties: {
          crm: { type: 'string', minLength: 4, example: 'CRM-SP-123456' },
          specialty: { type: 'string', minLength: 2, example: 'Infectologia' },
          phone: { type: 'string', example: '11988887777' },
        },
      },
      UpdateProfessionalRequest: {
        type: 'object',
        properties: {
          crm: { type: 'string' },
          specialty: { type: 'string' },
          phone: { type: 'string' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Token ausente, inválido ou expirado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Permissões insuficientes para este recurso',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Recurso não encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Dados de entrada inválidos',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } },
      },
    },
  },

  paths: {
    // ── Health ────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Auth'],
        summary: 'Verificação de saúde do serviço',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Serviço operacional',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Auth ──────────────────────────────────────────────────────────────
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar novo usuário',
        operationId: 'register',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          '201': {
            description: 'Usuário criado com sucesso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterResponse' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': {
            description: 'E-mail já cadastrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autenticar usuário',
        operationId: 'login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': {
            description: 'Autenticação bem-sucedida',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { description: 'Conta inativa', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Login social com Google',
        description: `Autentica ou registra um usuário via Google OAuth 2.0.

**Fluxo no frontend:**
1. Integre o [Google Identity Services](https://developers.google.com/identity/gsi/web) ou o SDK mobile
2. Após o usuário autorizar, você receberá um \`credential\` (ID Token)
3. Envie esse token para este endpoint

**Comportamento do backend:**
- Token verificado com as chaves públicas do Google
- Se \`googleId\` já existe → login direto
- Se e-mail existe (conta local) → vincula \`googleId\` à conta e faz login
- Se nenhum dos dois → cria nova conta com role \`PATIENT\``,
        operationId: 'loginWithGoogle',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GoogleLoginRequest' } } },
        },
        responses: {
          '200': {
            description: 'Autenticação bem-sucedida',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/GoogleLoginResponse' } } },
          },
          '400': { description: 'idToken ausente ou inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Token Google inválido ou e-mail não verificado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Conta inativa', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renovar access token',
        description: 'Aceita exclusivamente um **refresh token** (type=refresh). Access tokens são rejeitados.',
        operationId: 'refreshToken',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } },
        },
        responses: {
          '200': {
            description: 'Novo access token emitido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshResponse' } } },
          },
          '400': { description: 'Refresh token não fornecido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── Patients ──────────────────────────────────────────────────────────
    '/api/patients': {
      get: {
        tags: ['Patients'],
        summary: 'Listar pacientes',
        description: 'Retorna todos os pacientes não excluídos. **Roles:** PROFESSIONAL, ADMIN.',
        operationId: 'listPatients',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de pacientes',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Patient' } } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Patients'],
        summary: 'Registrar paciente',
        description: 'Cria o perfil de paciente vinculado ao usuário autenticado. Requer `consentGiven: true` para conformidade LGPD.',
        operationId: 'createPatient',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePatientRequest' } } },
        },
        responses: {
          '201': {
            description: 'Paciente criado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Patient' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '409': {
            description: 'CPF já cadastrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/patients/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Patients'],
        summary: 'Obter paciente por ID',
        description: '**Roles:** PROFESSIONAL, ADMIN.',
        operationId: 'getPatientById',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dados do paciente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Patient' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Patients'],
        summary: 'Atualizar paciente',
        description: '**Roles:** PROFESSIONAL, ADMIN.',
        operationId: 'updatePatient',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdatePatientRequest' } } },
        },
        responses: {
          '200': { description: 'Paciente atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Patient' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Patients'],
        summary: 'Excluir paciente (soft delete)',
        description: 'Define `deletedAt`; nunca remove o registro do banco (LGPD). **Roles:** ADMIN.',
        operationId: 'softDeletePatient',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Paciente marcado como excluído' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Appointments ──────────────────────────────────────────────────────
    '/api/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'Listar agendamentos',
        description: 'PATIENT vê apenas seus próprios agendamentos. PROFESSIONAL vê os seus. ADMIN vê todos.',
        operationId: 'listAppointments',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de agendamentos',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Appointment' } } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Criar agendamento',
        operationId: 'createAppointment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAppointmentRequest' } } },
        },
        responses: {
          '201': { description: 'Agendamento criado com status SCHEDULED', content: { 'application/json': { schema: { $ref: '#/components/schemas/Appointment' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/appointments/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Appointments'],
        summary: 'Obter agendamento por ID',
        operationId: 'getAppointmentById',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dados do agendamento', content: { 'application/json': { schema: { $ref: '#/components/schemas/Appointment' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/appointments/{id}/cancel': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      patch: {
        tags: ['Appointments'],
        summary: 'Cancelar agendamento',
        operationId: 'cancelAppointment',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Agendamento cancelado (status → CANCELLED)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Appointment' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/appointments/{id}/complete': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      patch: {
        tags: ['Appointments'],
        summary: 'Concluir agendamento',
        description: '**Roles:** PROFESSIONAL, ADMIN.',
        operationId: 'completeAppointment',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Agendamento concluído (status → COMPLETED)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Appointment' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Medications ───────────────────────────────────────────────────────
    '/api/medications': {
      get: {
        tags: ['Medications'],
        summary: 'Listar prescrições PrEP',
        description: '**Roles:** PROFESSIONAL, ADMIN.',
        operationId: 'listMedications',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de prescrições',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Medication' } } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Medications'],
        summary: 'Registrar prescrição PrEP',
        description: '**Roles:** PROFESSIONAL, ADMIN.',
        operationId: 'createMedication',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMedicationRequest' } } },
        },
        responses: {
          '201': { description: 'Prescrição registrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Medication' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/medications/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Medications'],
        summary: 'Obter prescrição por ID',
        operationId: 'getMedicationById',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dados da prescrição', content: { 'application/json': { schema: { $ref: '#/components/schemas/Medication' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/medications/{id}/dispense': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      post: {
        tags: ['Medications'],
        summary: 'Registrar dispensação',
        description: 'Registra a entrega física de comprimidos para o paciente. **Roles:** PROFESSIONAL, ADMIN.',
        operationId: 'dispenseMedication',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DispenseRequest' } } },
        },
        responses: {
          '200': { description: 'Dispensação registrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Dispense' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Professionals ─────────────────────────────────────────────────────
    '/api/professionals': {
      get: {
        tags: ['Professionals'],
        summary: 'Listar profissionais de saúde',
        operationId: 'listProfessionals',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de profissionais',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Professional' } } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Professionals'],
        summary: 'Cadastrar profissional',
        description: '**Roles:** ADMIN.',
        operationId: 'createProfessional',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProfessionalRequest' } } },
        },
        responses: {
          '201': { description: 'Profissional cadastrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Professional' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': {
            description: 'CRM já registrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/professionals/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Professionals'],
        summary: 'Obter profissional por ID',
        operationId: 'getProfessionalById',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dados do profissional', content: { 'application/json': { schema: { $ref: '#/components/schemas/Professional' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Professionals'],
        summary: 'Atualizar profissional',
        description: '**Roles:** ADMIN, PROFESSIONAL (próprio perfil).',
        operationId: 'updateProfessional',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfessionalRequest' } } },
        },
        responses: {
          '200': { description: 'Profissional atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Professional' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
};
