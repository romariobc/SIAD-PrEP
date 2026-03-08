import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { api } from '../api/client'

interface AuthUser {
  id: string
  name: string
  email: string
  role: 'PATIENT' | 'PROFESSIONAL' | 'ADMIN'
}

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { id: payload.sub, name: payload.name ?? '', email: payload.email ?? '', role: payload.role }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem('token')
    return token ? parseToken(token) : null
  })

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string }>('/api/auth/login', { email, password })
    localStorage.setItem('token', res.token)
    setUser(parseToken(res.token))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
