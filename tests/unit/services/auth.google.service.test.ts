import { AuthGoogleService } from '../../../src/services/auth.google.service';
import { AppError } from '../../../src/middlewares/error.middleware';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

jest.mock('../../../src/database/client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../src/config/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
    JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
    JWT_EXPIRES_IN: '7d',
  },
}));

jest.mock('../../../src/services/auth.service', () => ({
  AuthService: {
    issueAccessToken: jest.fn().mockReturnValue('mock-access-token'),
    issueRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  },
}));

import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../../src/database/client';

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

// A instância é criada uma única vez no carregamento do módulo — capturamos em beforeAll
let googleInstance: { verifyIdToken: jest.Mock };

beforeAll(() => {
  const MockClass = OAuth2Client as unknown as jest.Mock;
  googleInstance = MockClass.mock.results[0].value as { verifyIdToken: jest.Mock };
});

const fakeGooglePayload = {
  sub: 'google-uid-123',
  email: 'joao@gmail.com',
  name: 'João Silva',
  picture: 'https://lh3.googleusercontent.com/photo.jpg',
  email_verified: true,
};

const fakeUser = {
  id: 'user-id-1',
  email: 'joao@gmail.com',
  name: 'João Silva',
  role: 'PATIENT' as const,
  googleId: 'google-uid-123',
  passwordHash: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function mockGoogleToken(payload: typeof fakeGooglePayload | null) {
  googleInstance.verifyIdToken.mockResolvedValue({ getPayload: () => payload });
}

beforeEach(() => {
  googleInstance.verifyIdToken.mockReset();
  mockPrismaUser.findUnique.mockReset();
  mockPrismaUser.create.mockReset();
  mockPrismaUser.update.mockReset();
});

// ── verifyIdToken ─────────────────────────────────────────────────────────────

describe('AuthGoogleService.verifyIdToken', () => {
  it('retorna payload quando o token é válido', async () => {
    mockGoogleToken(fakeGooglePayload);

    const result = await AuthGoogleService.verifyIdToken('valid-id-token');

    expect(result.sub).toBe('google-uid-123');
    expect(result.email).toBe('joao@gmail.com');
    expect(result.name).toBe('João Silva');
  });

  it('lança 401 quando getPayload retorna null', async () => {
    mockGoogleToken(null);

    await expect(AuthGoogleService.verifyIdToken('bad-token')).rejects.toThrow(
      new AppError(401, 'Token Google inválido'),
    );
  });

  it('lança 401 quando e-mail não está verificado', async () => {
    mockGoogleToken({ ...fakeGooglePayload, email_verified: false });

    await expect(AuthGoogleService.verifyIdToken('unverified')).rejects.toThrow(
      new AppError(401, 'E-mail Google não verificado'),
    );
  });

  it('lança 401 quando google-auth-library lança exceção', async () => {
    googleInstance.verifyIdToken.mockRejectedValue(new Error('invalid signature'));

    await expect(AuthGoogleService.verifyIdToken('garbage')).rejects.toThrow(
      new AppError(401, 'Falha ao verificar token Google'),
    );
  });
});

// ── loginOrRegister ───────────────────────────────────────────────────────────

describe('AuthGoogleService.loginOrRegister', () => {
  it('faz login de usuário existente pelo googleId', async () => {
    mockGoogleToken(fakeGooglePayload);
    mockPrismaUser.findUnique.mockResolvedValueOnce(fakeUser as any);

    const result = await AuthGoogleService.loginOrRegister('valid-token');

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
    expect(result.user.email).toBe('joao@gmail.com');
    expect(mockPrismaUser.create).not.toHaveBeenCalled();
    expect(mockPrismaUser.update).not.toHaveBeenCalled();
  });

  it('vincula googleId a conta local existente pelo e-mail', async () => {
    mockGoogleToken(fakeGooglePayload);
    mockPrismaUser.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...fakeUser, googleId: null } as any);
    mockPrismaUser.update.mockResolvedValue(fakeUser as any);

    const result = await AuthGoogleService.loginOrRegister('valid-token');

    expect(mockPrismaUser.update).toHaveBeenCalledWith({
      where: { id: fakeUser.id },
      data: { googleId: 'google-uid-123' },
    });
    expect(result.accessToken).toBe('mock-access-token');
  });

  it('cria novo usuário quando nenhuma conta é encontrada', async () => {
    mockGoogleToken(fakeGooglePayload);
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue(fakeUser as any);

    const result = await AuthGoogleService.loginOrRegister('valid-token');

    expect(mockPrismaUser.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'joao@gmail.com',
        googleId: 'google-uid-123',
        passwordHash: null,
        role: 'PATIENT',
      }),
    });
    expect(result.user.email).toBe('joao@gmail.com');
  });

  it('lança 403 quando conta está inativa', async () => {
    mockGoogleToken(fakeGooglePayload);
    mockPrismaUser.findUnique.mockResolvedValueOnce({ ...fakeUser, isActive: false } as any);

    await expect(AuthGoogleService.loginOrRegister('valid-token')).rejects.toThrow(
      new AppError(403, 'Conta inativa'),
    );
  });

  it('lança 401 quando token Google é inválido', async () => {
    googleInstance.verifyIdToken.mockRejectedValue(new Error('bad token'));

    await expect(AuthGoogleService.loginOrRegister('garbage')).rejects.toThrow(
      new AppError(401, 'Falha ao verificar token Google'),
    );
  });
});
