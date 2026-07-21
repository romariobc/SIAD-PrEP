export interface JwtPayload {
  sub: string;
  role: 'PATIENT' | 'PROFESSIONAL' | 'ADMIN';
  type?: 'access' | 'refresh';
  exp?: number;
}

/**
 * Decodes a JWT payload client-side for UI purposes (role-based nav, display).
 * This does NOT verify the signature — the API is the only source of truth for
 * authorization. Never trust this for anything security-sensitive.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}
