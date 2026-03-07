import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';

export class AppointmentController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointments = await AppointmentService.list(req.user!);
      res.json(appointments);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.getById(req.params.id);
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.create(req.body);
      res.status(201).json(appointment);
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.updateStatus(req.params.id, 'CANCELLED');
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }

  static async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await AppointmentService.updateStatus(req.params.id, 'COMPLETED');
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }
}
