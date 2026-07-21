import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { ApiError } from '@/api/client';
import { decodeJwtPayload, type JwtPayload } from '@/lib/jwt';
import { tokenStorage } from '@/lib/token-storage';
import { login as loginRequest } from './api';

interface AuthUser {
  sub: string;
  role: JwtPayload['role'];
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromStoredToken(): AuthUser | null {
  const token = tokenStorage.getAccessToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return { sub: payload.sub, role: payload.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => userFromStoredToken());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token, refreshToken } = await loginRequest({ email, password });
      tokenStorage.setTokens(token, refreshToken);
      const payload = decodeJwtPayload(token);
      if (!payload) throw new Error('Token de acesso inválido recebido da API.');
      setUser({ sub: payload.sub, role: payload.role });
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível entrar. Tente novamente.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, isLoading, error, login, logout }),
    [user, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
