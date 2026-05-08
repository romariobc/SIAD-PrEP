import { AuthService } from '../../../src/services/auth.service';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('../../../src/database/client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('../../../src/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
    JWT_EXPIRES_IN: '7d',
    BCRYPT_ROUNDS: 10,
  },
}));

import { prisma } from '../../../src/database/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mockUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

const fakeUser = {
  id: 'user-id-1',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  name: 'Test User',
  role: 'PATIENT' as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthService.register', () => {
  it('creates a user and returns token when email is new', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockUser.create.mockResolvedValue({
      id: fakeUser.id,
      email: fakeUser.email,
      name: fakeUser.name,
      role: fakeUser.role,
      createdAt: fakeUser.createdAt,
    } as any);
    (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (mockJwt.sign as jest.Mock).mockReturnValue('signed-token');

    const result = await AuthService.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'PATIENT',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.refreshToken).toBe('signed-token');
    expect(result.user.email).toBe('test@example.com');
    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
  });

  it('throws 409 when email already exists', async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser);

    await expect(
      AuthService.register({ email: 'test@example.com', password: 'pass', name: 'X', role: 'PATIENT' }),
    ).rejects.toThrow(new AppError(409, 'Email already in use'));
  });
});

describe('AuthService.login', () => {
  it('returns token when credentials are valid', async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser);
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockJwt.sign as jest.Mock).mockReturnValue('access-token');

    const result = await AuthService.login({ email: fakeUser.email, password: 'password123' });

    expect(result.accessToken).toBe('access-token');
    expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', fakeUser.passwordHash);
  });

  it('throws 401 when user is not found', async () => {
    mockUser.findUnique.mockResolvedValue(null);

    await expect(AuthService.login({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(
      new AppError(401, 'Invalid credentials'),
    );
  });

  it('throws 401 when password is wrong', async () => {
    mockUser.findUnique.mockResolvedValue(fakeUser);
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(AuthService.login({ email: fakeUser.email, password: 'wrong' })).rejects.toThrow(
      new AppError(401, 'Invalid credentials'),
    );
  });

  it('throws 403 when account is inactive', async () => {
    mockUser.findUnique.mockResolvedValue({ ...fakeUser, isActive: false });
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(AuthService.login({ email: fakeUser.email, password: 'password123' })).rejects.toThrow(
      new AppError(403, 'Account is inactive'),
    );
  });
});

describe('AuthService.refresh', () => {
  it('returns a new access token when refresh token is valid', async () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 'user-id-1', role: 'PATIENT', type: 'refresh' });
    (mockJwt.sign as jest.Mock).mockReturnValue('new-token');

    const result = await AuthService.refresh('valid-refresh-token');

    expect(result.accessToken).toBe('new-token');
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-secret-at-least-32-chars-long!!');
  });

  it('throws 401 when an access token is used as refresh token', async () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 'user-id-1', role: 'PATIENT', type: 'access' });

    await expect(AuthService.refresh('access-token-used-as-refresh')).rejects.toThrow(
      new AppError(401, 'Invalid token type'),
    );
  });

  it('throws 400 when refresh token is empty', async () => {
    await expect(AuthService.refresh('')).rejects.toThrow(new AppError(400, 'Refresh token required'));
  });

  it('throws 401 when refresh token is invalid', async () => {
    (mockJwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

    await expect(AuthService.refresh('bad-token')).rejects.toThrow(
      new AppError(401, 'Invalid or expired refresh token'),
    );
  });
});
