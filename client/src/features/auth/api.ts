import { apiRequest } from '@/api/client';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: 'PATIENT' | 'PROFESSIONAL';
}

interface AuthTokens {
  token: string;
  refreshToken: string;
}

export function login(input: LoginInput) {
  return apiRequest<AuthTokens>('/api/auth/login', {
    method: 'POST',
    body: input,
    skipAuth: true,
  });
}

export function register(input: RegisterInput) {
  return apiRequest<AuthTokens & { user: { id: string; email: string; name: string; role: string } }>(
    '/api/auth/register',
    { method: 'POST', body: input, skipAuth: true },
  );
}
