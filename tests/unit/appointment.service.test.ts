jest.mock('../../src/database/client', () => ({
  prisma: {
    appointment: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    patient: {
      findFirst: jest.fn(),
    },
    professional: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/database/client';
import { AppointmentService } from '../../src/services/appointment.service';
import { AuthPayload } from '../../src/middlewares/auth.middleware';

const mockedPrisma = prisma as unknown as {
  appointment: { findUnique: jest.Mock; create: jest.Mock };
  patient: { findFirst: jest.Mock };
  professional: { findUnique: jest.Mock };
};

describe('AppointmentService.getById', () => {
  const appointment = {
    id: 'a1',
    patient: { userId: 'patient-owner', deletedAt: null },
    professional: { userId: 'prof-owner' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows the owning patient to view the appointment', async () => {
    mockedPrisma.appointment.findUnique.mockResolvedValue(appointment);
    const actor: AuthPayload = { sub: 'patient-owner', role: 'PATIENT' };

    await expect(AppointmentService.getById('a1', actor)).resolves.toEqual(appointment);
  });

  it('allows the assigned professional to view the appointment', async () => {
    mockedPrisma.appointment.findUnique.mockResolvedValue(appointment);
    const actor: AuthPayload = { sub: 'prof-owner', role: 'PROFESSIONAL' };

    await expect(AppointmentService.getById('a1', actor)).resolves.toEqual(appointment);
  });

  it('blocks an unrelated patient from viewing the appointment (IDOR)', async () => {
    mockedPrisma.appointment.findUnique.mockResolvedValue(appointment);
    const actor: AuthPayload = { sub: 'other-patient', role: 'PATIENT' };

    await expect(AppointmentService.getById('a1', actor)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('blocks an unrelated professional from viewing the appointment (IDOR)', async () => {
    mockedPrisma.appointment.findUnique.mockResolvedValue(appointment);
    const actor: AuthPayload = { sub: 'other-prof', role: 'PROFESSIONAL' };

    await expect(AppointmentService.getById('a1', actor)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('allows ADMIN to view any appointment', async () => {
    mockedPrisma.appointment.findUnique.mockResolvedValue(appointment);
    const actor: AuthPayload = { sub: 'admin-1', role: 'ADMIN' };

    await expect(AppointmentService.getById('a1', actor)).resolves.toEqual(appointment);
  });

  it('hides the appointment once the patient has been soft-deleted', async () => {
    mockedPrisma.appointment.findUnique.mockResolvedValue({
      ...appointment,
      patient: { userId: 'patient-owner', deletedAt: new Date() },
    });
    const actor: AuthPayload = { sub: 'admin-1', role: 'ADMIN' };

    await expect(AppointmentService.getById('a1', actor)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('AppointmentService.create', () => {
  const input = {
    patientId: 'p1',
    professionalId: 'prof1',
    scheduledAt: '2026-01-01T00:00:00.000Z',
    type: 'INITIAL' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects creation when the patient does not exist or is soft-deleted', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue(null);

    await expect(AppointmentService.create(input)).rejects.toMatchObject({ statusCode: 404 });
    expect(mockedPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it('rejects creation when the professional does not exist', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue({ id: 'p1' });
    mockedPrisma.professional.findUnique.mockResolvedValue(null);

    await expect(AppointmentService.create(input)).rejects.toMatchObject({ statusCode: 404 });
    expect(mockedPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it('creates the appointment when both patient and professional exist', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue({ id: 'p1' });
    mockedPrisma.professional.findUnique.mockResolvedValue({ id: 'prof1' });
    mockedPrisma.appointment.create.mockResolvedValue({ id: 'appt-1' });

    await AppointmentService.create(input);

    expect(mockedPrisma.appointment.create).toHaveBeenCalled();
  });
});
