import { Request, Response, NextFunction } from 'express';
import { MedicationService } from '../services/medication.service';

export class MedicationController {
  static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medications = await MedicationService.list();
      res.json(medications);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medication = await MedicationService.getById(req.params.id);
      res.json(medication);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medication = await MedicationService.create(req.body);
      res.status(201).json(medication);
    } catch (err) {
      next(err);
    }
  }

  static async dispense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MedicationService.dispense(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
