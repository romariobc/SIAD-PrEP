import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  patientId: z.string().uuid(),
  professionalId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  type: z.enum(['INITIAL', 'FOLLOWUP', 'LAB_RESULT', 'TELEMEDICINE']),
  notes: z.string().optional(),
});

router.get('/', AppointmentController.list);
router.get('/:id', AppointmentController.getById);
router.post('/', validate(createSchema), AppointmentController.create);
router.patch('/:id/cancel', AppointmentController.cancel);
router.patch('/:id/complete', authorize('PROFESSIONAL', 'ADMIN'), AppointmentController.complete);

export { router as appointmentRoutes };
