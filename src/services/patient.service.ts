import { prisma } from '../database/client';
import { AppError } from '../middlewares/error.middleware';

interface CreatePatientInput {
  cpf: string;
  dateOfBirth: string;
  phone?: string;
  address?: string;
  consentGiven: boolean;
}

export class PatientService {
  static async list() {
    return prisma.patient.findMany({
      where: { deletedAt: null },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  static async getById(id: string) {
    const patient = await prisma.patient.findFirst({ where: { id, deletedAt: null } });
    if (!patient) throw new AppError(404, 'Patient not found');
    return patient;
  }

  static async create(userId: string, input: CreatePatientInput) {
    const existing = await prisma.patient.findUnique({ where: { cpf: input.cpf } });
    if (existing) throw new AppError(409, 'CPF already registered');

    return prisma.patient.create({
      data: {
        userId,
        cpf: input.cpf,
        dateOfBirth: new Date(input.dateOfBirth),
        phone: input.phone,
        address: input.address,
        consentGiven: input.consentGiven,
        consentDate: input.consentGiven ? new Date() : null,
      },
    });
  }

  static async update(id: string, data: Partial<CreatePatientInput>) {
    await PatientService.getById(id);
    return prisma.patient.update({ where: { id }, data });
  }

  static async softDelete(id: string) {
    await PatientService.getById(id);
    await prisma.patient.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
