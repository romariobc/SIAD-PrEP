import { Router } from 'express';
import { ProfessionalController } from '../controllers/professional.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  crm: z.string().min(4),
  specialty: z.string().min(2),
  phone: z.string().optional(),
});

router.get('/', ProfessionalController.list);
router.get('/:id', ProfessionalController.getById);
router.post('/', authorize('ADMIN'), validate(createSchema), ProfessionalController.create);
router.patch('/:id', authorize('ADMIN', 'PROFESSIONAL'), ProfessionalController.update);

export { router as professionalRoutes };
