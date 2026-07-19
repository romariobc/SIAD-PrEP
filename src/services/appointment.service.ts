import { prisma } from '../database/client';
import { AppError } from '../middlewares/error.middleware';
import { AuthPayload } from '../middlewares/auth.middleware';

interface CreateAppointmentInput {
  patientId: string;
  professionalId: string;
  scheduledAt: string;
  type: 'INITIAL' | 'FOLLOWUP' | 'LAB_RESULT' | 'TELEMEDICINE';
  notes?: string;
}

type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export class AppointmentService {
  static async list(user: AuthPayload) {
    const where =
      user.role === 'PATIENT'
        ? { patient: { userId: user.sub } }
        : user.role === 'PROFESSIONAL'
          ? { professional: { userId: user.sub } }
          : {};

    return prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { user: { select: { name: true } } } },
        professional: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  static async getById(id: string, actor: AuthPayload) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { userId: true } },
        professional: { select: { userId: true } },
      },
    });
    if (!appointment) throw new AppError(404, 'Appointment not found');

    const isOwner =
      actor.role === 'ADMIN' ||
      (actor.role === 'PATIENT' && appointment.patient.userId === actor.sub) ||
      (actor.role === 'PROFESSIONAL' && appointment.professional.userId === actor.sub);

    if (!isOwner) throw new AppError(404, 'Appointment not found');
    return appointment;
  }

  static async create(input: CreateAppointmentInput) {
    return prisma.appointment.create({
      data: {
        patientId: input.patientId,
        professionalId: input.professionalId,
        scheduledAt: new Date(input.scheduledAt),
        type: input.type,
        notes: input.notes,
        status: 'SCHEDULED',
      },
    });
  }

  static async updateStatus(id: string, actor: AuthPayload, status: AppointmentStatus) {
    await AppointmentService.getById(id, actor);
    return prisma.appointment.update({ where: { id }, data: { status } });
  }
}
