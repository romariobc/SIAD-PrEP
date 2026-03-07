import { prisma } from '../database/client';
import { AppError } from '../middlewares/error.middleware';

interface CreateMedicationInput {
  patientId: string;
  regimen: 'TENOFOVIR_EMTRICITABINA' | 'TENOFOVIR_LAMIVUDINA';
  startDate: string;
  endDate?: string;
  prescribedBy: string;
}

interface DispenseInput {
  quantity: number;
  dispensedAt?: string;
}

export class MedicationService {
  static async list() {
    return prisma.medication.findMany({
      include: { patient: { include: { user: { select: { name: true } } } } },
    });
  }

  static async getById(id: string) {
    const medication = await prisma.medication.findUnique({ where: { id } });
    if (!medication) throw new AppError(404, 'Medication record not found');
    return medication;
  }

  static async create(input: CreateMedicationInput) {
    return prisma.medication.create({
      data: {
        patientId: input.patientId,
        regimen: input.regimen,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        prescribedBy: input.prescribedBy,
        isActive: true,
      },
    });
  }

  static async dispense(medicationId: string, input: DispenseInput) {
    await MedicationService.getById(medicationId);
    return prisma.dispense.create({
      data: {
        medicationId,
        quantity: input.quantity,
        dispensedAt: input.dispensedAt ? new Date(input.dispensedAt) : new Date(),
      },
    });
  }
}
