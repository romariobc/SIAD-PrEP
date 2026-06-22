import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../database/client';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import { AuthService } from './auth.service';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

interface GoogleTokenPayload {
  sub: string;   // Google user ID
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export class AuthGoogleService {
  static async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) throw new AppError(401, 'Token Google inválido');
      if (!payload.email_verified) throw new AppError(401, 'E-mail Google não verificado');

      return {
        sub: payload.sub,
        email: payload.email!,
        name: payload.name ?? payload.email!,
        picture: payload.picture,
        email_verified: payload.email_verified,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(401, 'Falha ao verificar token Google');
    }
  }

  static async loginOrRegister(idToken: string) {
    const googlePayload = await AuthGoogleService.verifyIdToken(idToken);

    // Busca por googleId primeiro (login recorrente)
    let user = await prisma.user.findUnique({ where: { googleId: googlePayload.sub } });

    if (!user) {
      // Busca por e-mail (conta local existente → vincula googleId)
      const existingByEmail = await prisma.user.findUnique({ where: { email: googlePayload.email } });

      if (existingByEmail) {
        // Vincula o Google ID à conta local existente
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: googlePayload.sub },
        });
      } else {
        // Novo usuário via Google — cria conta com role PATIENT
        user = await prisma.user.create({
          data: {
            email: googlePayload.email,
            name: googlePayload.name,
            googleId: googlePayload.sub,
            passwordHash: null,
            role: 'PATIENT',
          },
        });
      }
    }

    if (!user.isActive) throw new AppError(403, 'Conta inativa');

    const accessToken = AuthService.issueAccessToken(user.id, user.role);
    const refreshToken = AuthService.issueRefreshToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }
}
