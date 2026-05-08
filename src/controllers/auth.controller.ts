import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthGoogleService } from '../services/auth.google.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await AuthService.refresh(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async loginWithGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body as { idToken: string };
      const result = await AuthGoogleService.loginOrRegister(idToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
