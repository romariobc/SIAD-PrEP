import { prisma } from '../database/client';
import { AppError } from '../middlewares/error.middleware';
import { AuthPayload } from '../middlewares/auth.middleware';
import { findOrThrow } from '../utils/findOrThrow';

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
        ? { patient: { userId: user.sub, deletedAt: null } }
        : user.role === 'PROFESSIONAL'
          ? { professional: { userId: user.sub }, patient: { deletedAt: null } }
          : { patient: { deletedAt: null } };

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
    const appointment = await findOrThrow(
      () =>
        prisma.appointment.findUnique({
          where: { id },
          include: {
            patient: { select: { userId: true, deletedAt: true } },
            professional: { select: { userId: true } },
          },
        }),
      'Appointment not found',
    );
    if (appointment.patient.deletedAt) {
      throw new AppError(404, 'Appointment not found');
    }

    const isOwner =
      actor.role === 'ADMIN' ||
      (actor.role === 'PATIENT' && appointment.patient.userId === actor.sub) ||
      (actor.role === 'PROFESSIONAL' && appointment.professional.userId === actor.sub);

    if (!isOwner) throw new AppError(404, 'Appointment not found');
    return appointment;
  }

  static async create(input: CreateAppointmentInput) {
    await findOrThrow(
      () => prisma.patient.findFirst({ where: { id: input.patientId, deletedAt: null } }),
      'Patient not found',
    );

    await findOrThrow(
      () => prisma.professional.findUnique({ where: { id: input.professionalId } }),
      'Professional not found',
    );

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
