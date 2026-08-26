import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service';

export class PatientController {
  static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patients = await PatientService.list();
      res.json(patients);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const patient = await PatientService.getById(id);
      res.json(patient);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await PatientService.create(req.user!.sub, req.body);
      res.status(201).json(patient);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const patient = await PatientService.update(id, req.body);
      res.json(patient);
    } catch (err) {
      next(err);
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await PatientService.softDelete(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
