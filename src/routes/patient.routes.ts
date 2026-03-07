import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const createPatientSchema = z.object({
  cpf: z.string().length(11),
  dateOfBirth: z.string().datetime(),
  phone: z.string().optional(),
  address: z.string().optional(),
  consentGiven: z.boolean(),
});

router.get('/', authorize('PROFESSIONAL', 'ADMIN'), PatientController.list);
router.get('/:id', PatientController.getById);
router.post('/', validate(createPatientSchema), PatientController.create);
router.patch('/:id', PatientController.update);
router.delete('/:id', authorize('ADMIN'), PatientController.softDelete);

export { router as patientRoutes };
