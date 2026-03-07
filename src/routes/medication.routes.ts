import { Router } from 'express';
import { MedicationController } from '../controllers/medication.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  patientId: z.string().uuid(),
  regimen: z.enum(['TENOFOVIR_EMTRICITABINA', 'TENOFOVIR_LAMIVUDINA']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  prescribedBy: z.string().uuid(),
});

const dispenseSchema = z.object({
  quantity: z.number().int().positive(),
  dispensedAt: z.string().datetime().optional(),
});

router.get('/', authorize('PROFESSIONAL', 'ADMIN'), MedicationController.list);
router.get('/:id', MedicationController.getById);
router.post('/', authorize('PROFESSIONAL', 'ADMIN'), validate(createSchema), MedicationController.create);
router.post('/:id/dispense', authorize('PROFESSIONAL', 'ADMIN'), validate(dispenseSchema), MedicationController.dispense);

export { router as medicationRoutes };
