import { AppointmentService } from '../../../src/services/appointment.service';
import { AppError } from '../../../src/middlewares/error.middleware';
import { AuthPayload } from '../../../src/middlewares/auth.middleware';

jest.mock('../../../src/database/client', () => ({
  prisma: {
    appointment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/database/client';

const mockAppointment = prisma.appointment as jest.Mocked<typeof prisma.appointment>;

const fakeAppointment = {
  id: 'appt-id-1',
  patientId: 'patient-id-1',
  professionalId: 'professional-id-1',
  scheduledAt: new Date('2026-06-01T10:00:00Z'),
  type: 'INITIAL' as const,
  status: 'SCHEDULED' as const,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AppointmentService.list', () => {
  it('returns all appointments for ADMIN', async () => {
    mockAppointment.findMany.mockResolvedValue([fakeAppointment] as any);
    const admin: AuthPayload = { sub: 'admin-id', role: 'ADMIN', type: 'access' };

    await AppointmentService.list(admin);

    expect(mockAppointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('filters by patient userId for PATIENT role', async () => {
    mockAppointment.findMany.mockResolvedValue([fakeAppointment] as any);
    const patient: AuthPayload = { sub: 'user-id-1', role: 'PATIENT', type: 'access' };

    await AppointmentService.list(patient);

    expect(mockAppointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { patient: { userId: 'user-id-1' } } }),
    );
  });

  it('filters by professional userId for PROFESSIONAL role', async () => {
    mockAppointment.findMany.mockResolvedValue([fakeAppointment] as any);
    const professional: AuthPayload = { sub: 'user-id-2', role: 'PROFESSIONAL', type: 'access' };

    await AppointmentService.list(professional);

    expect(mockAppointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { professional: { userId: 'user-id-2' } } }),
    );
  });
});

describe('AppointmentService.getById', () => {
  it('returns appointment when found', async () => {
    mockAppointment.findUnique.mockResolvedValue(fakeAppointment as any);

    const result = await AppointmentService.getById('appt-id-1');

    expect(result.id).toBe('appt-id-1');
  });

  it('throws 404 when appointment is not found', async () => {
    mockAppointment.findUnique.mockResolvedValue(null);

    await expect(AppointmentService.getById('unknown-id')).rejects.toThrow(
      new AppError(404, 'Appointment not found'),
    );
  });
});

describe('AppointmentService.create', () => {
  it('creates appointment with SCHEDULED status', async () => {
    mockAppointment.create.mockResolvedValue(fakeAppointment as any);

    await AppointmentService.create({
      patientId: 'patient-id-1',
      professionalId: 'professional-id-1',
      scheduledAt: '2026-06-01T10:00:00Z',
      type: 'INITIAL',
    });

    expect(mockAppointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SCHEDULED' }),
      }),
    );
  });
});

describe('AppointmentService.updateStatus', () => {
  it('updates status to CANCELLED', async () => {
    mockAppointment.findUnique.mockResolvedValue(fakeAppointment as any);
    mockAppointment.update.mockResolvedValue({ ...fakeAppointment, status: 'CANCELLED' } as any);

    await AppointmentService.updateStatus('appt-id-1', 'CANCELLED');

    expect(mockAppointment.update).toHaveBeenCalledWith({
      where: { id: 'appt-id-1' },
      data: { status: 'CANCELLED' },
    });
  });

  it('updates status to COMPLETED', async () => {
    mockAppointment.findUnique.mockResolvedValue(fakeAppointment as any);
    mockAppointment.update.mockResolvedValue({ ...fakeAppointment, status: 'COMPLETED' } as any);

    await AppointmentService.updateStatus('appt-id-1', 'COMPLETED');

    expect(mockAppointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'COMPLETED' } }),
    );
  });

  it('throws 404 when appointment not found', async () => {
    mockAppointment.findUnique.mockResolvedValue(null);

    await expect(AppointmentService.updateStatus('unknown-id', 'CANCELLED')).rejects.toThrow(
      new AppError(404, 'Appointment not found'),
    );
  });
});
