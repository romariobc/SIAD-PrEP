import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/client';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: 'PATIENT' | 'PROFESSIONAL' | 'ADMIN';
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, 'Email already in use');

    const hashedPassword = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: hashedPassword,
        name: input.name,
        role: input.role,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const accessToken = AuthService.signToken(user.id, user.role, 'access');
    const refreshToken = AuthService.signToken(user.id, user.role, 'refresh');
    return { user, accessToken, refreshToken };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError(401, 'Invalid credentials');

    if (!user.passwordHash) throw new AppError(400, 'This account uses Google login. Please sign in with Google.');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    if (!user.isActive) throw new AppError(403, 'Account is inactive');

    const accessToken = AuthService.signToken(user.id, user.role, 'access');
    const refreshToken = AuthService.signToken(user.id, user.role, 'refresh');
    return { accessToken, refreshToken };
  }

  static async refresh(refreshToken: string) {
    if (!refreshToken) throw new AppError(400, 'Refresh token required');

    try {
      const payload = jwt.verify(refreshToken, env.JWT_SECRET) as { sub: string; role: string; type: string };
      if (payload.type !== 'refresh') throw new AppError(401, 'Invalid token type');
      const accessToken = AuthService.signToken(payload.sub, payload.role, 'access');
      return { accessToken };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(401, 'Invalid or expired refresh token');
    }
  }

  static issueAccessToken(userId: string, role: string): string {
    return AuthService.signToken(userId, role, 'access');
  }

  static issueRefreshToken(userId: string, role: string): string {
    return AuthService.signToken(userId, role, 'refresh');
  }

  private static signToken(userId: string, role: string, type: 'access' | 'refresh'): string {
    const expiresIn = type === 'refresh' ? '30d' : (env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']);
    return jwt.sign({ sub: userId, role, type }, env.JWT_SECRET, { expiresIn });
  }
}
