import { Request, Response, NextFunction } from 'express';
import { ProfessionalService } from '../services/professional.service';

export class ProfessionalController {
  static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const professionals = await ProfessionalService.list();
      res.json(professionals);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const professional = await ProfessionalService.getById(req.params.id);
      res.json(professional);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const professional = await ProfessionalService.create(req.user!.sub, req.body);
      res.status(201).json(professional);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const professional = await ProfessionalService.update(req.params.id, req.body);
      res.json(professional);
    } catch (err) {
      next(err);
    }
  }
}
