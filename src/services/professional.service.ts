import { prisma } from '../database/client';
import { AppError } from '../middlewares/error.middleware';

interface CreateProfessionalInput {
  crm: string;
  specialty: string;
  phone?: string;
}

export class ProfessionalService {
  static async list() {
    return prisma.professional.findMany({
      include: { user: { select: { name: true, email: true } } },
    });
  }

  static async getById(id: string) {
    const professional = await prisma.professional.findUnique({ where: { id } });
    if (!professional) throw new AppError(404, 'Professional not found');
    return professional;
  }

  static async create(userId: string, input: CreateProfessionalInput) {
    const existing = await prisma.professional.findUnique({ where: { crm: input.crm } });
    if (existing) throw new AppError(409, 'CRM already registered');

    return prisma.professional.create({
      data: { userId, crm: input.crm, specialty: input.specialty, phone: input.phone },
    });
  }

  static async update(id: string, data: Partial<CreateProfessionalInput>) {
    await ProfessionalService.getById(id);
    return prisma.professional.update({ where: { id }, data });
  }
}
