import { AuthController } from '../../../src/controllers/auth.controller';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('../../../src/services/auth.service', () => ({
  AuthService: {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
  },
}));

jest.mock('../../../src/services/auth.google.service', () => ({
  AuthGoogleService: {
    loginOrRegister: jest.fn(),
  },
}));

import { AuthService } from '../../../src/services/auth.service';
import { AuthGoogleService } from '../../../src/services/auth.google.service';

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockGoogleService = AuthGoogleService as jest.Mocked<typeof AuthGoogleService>;

const res = () => {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
};
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

const fakeTokens = { accessToken: 'acc', refreshToken: 'ref', user: { id: '1', email: 'a@b.com', name: 'A', role: 'PATIENT' as const, createdAt: new Date() } };

describe('AuthController.register', () => {
  it('retorna 201 com tokens ao registrar', async () => {
    mockAuthService.register.mockResolvedValue(fakeTokens);
    const r = res();
    await AuthController.register({ body: { email: 'a@b.com' } } as any, r, next);
    expect(r.status).toHaveBeenCalledWith(201);
    expect(r.json).toHaveBeenCalledWith(fakeTokens);
  });

  it('repassa erro ao next', async () => {
    const err = new AppError(409, 'Email already in use');
    mockAuthService.register.mockRejectedValue(err);
    await AuthController.register({ body: {} } as any, res(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('AuthController.login', () => {
  it('retorna tokens ao fazer login', async () => {
    mockAuthService.login.mockResolvedValue(fakeTokens);
    const r = res();
    await AuthController.login({ body: {} } as any, r, next);
    expect(r.json).toHaveBeenCalledWith(fakeTokens);
  });

  it('repassa erro ao next', async () => {
    const err = new AppError(401, 'Invalid credentials');
    mockAuthService.login.mockRejectedValue(err);
    await AuthController.login({ body: {} } as any, res(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('AuthController.refresh', () => {
  it('retorna novo accessToken', async () => {
    mockAuthService.refresh.mockResolvedValue({ accessToken: 'new-acc' });
    const r = res();
    await AuthController.refresh({ body: { refreshToken: 'ref' } } as any, r, next);
    expect(r.json).toHaveBeenCalledWith({ accessToken: 'new-acc' });
  });

  it('repassa erro ao next', async () => {
    const err = new AppError(401, 'Invalid or expired refresh token');
    mockAuthService.refresh.mockRejectedValue(err);
    await AuthController.refresh({ body: { refreshToken: 'bad' } } as any, res(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('AuthController.loginWithGoogle', () => {
  it('retorna tokens ao autenticar com Google', async () => {
    mockGoogleService.loginOrRegister.mockResolvedValue(fakeTokens);
    const r = res();
    await AuthController.loginWithGoogle({ body: { idToken: 'google-token' } } as any, r, next);
    expect(r.json).toHaveBeenCalledWith(fakeTokens);
  });

  it('repassa erro ao next', async () => {
    const err = new AppError(401, 'Token Google inválido');
    mockGoogleService.loginOrRegister.mockRejectedValue(err);
    await AuthController.loginWithGoogle({ body: { idToken: 'bad' } } as any, res(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
