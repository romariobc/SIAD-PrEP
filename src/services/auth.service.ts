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

    const token = AuthService.signToken(user.id, user.role);
    return { user, token };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError(401, 'Invalid credentials');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    if (!user.isActive) throw new AppError(403, 'Account is inactive');

    const token = AuthService.signToken(user.id, user.role);
    return { token };
  }

  static async refresh(refreshToken: string) {
    if (!refreshToken) throw new AppError(400, 'Refresh token required');

    try {
      const payload = jwt.verify(refreshToken, env.JWT_SECRET) as { sub: string; role: string };
      const token = AuthService.signToken(payload.sub, payload.role);
      return { token };
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }
  }

  private static signToken(userId: string, role: string): string {
    return jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }
}
