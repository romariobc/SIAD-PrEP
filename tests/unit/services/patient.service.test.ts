import { PatientService } from '../../../src/services/patient.service';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('../../../src/database/client', () => ({
  prisma: {
    patient: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/database/client';

const mockPatient = prisma.patient as jest.Mocked<typeof prisma.patient>;

const fakePatient = {
  id: 'patient-id-1',
  userId: 'user-id-1',
  cpf: '12345678901',
  dateOfBirth: new Date('1990-01-01'),
  phone: '11999999999',
  address: 'Rua Teste, 1',
  consentGiven: true,
  consentDate: new Date(),
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PatientService.list', () => {
  it('returns all non-deleted patients', async () => {
    mockPatient.findMany.mockResolvedValue([fakePatient] as any);

    const result = await PatientService.list();

    expect(result).toHaveLength(1);
    expect(mockPatient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } }),
    );
  });
});

describe('PatientService.getById', () => {
  it('returns patient when found', async () => {
    mockPatient.findFirst.mockResolvedValue(fakePatient as any);

    const result = await PatientService.getById('patient-id-1');

    expect(result.id).toBe('patient-id-1');
    expect(mockPatient.findFirst).toHaveBeenCalledWith({
      where: { id: 'patient-id-1', deletedAt: null },
    });
  });

  it('throws 404 when patient is not found', async () => {
    mockPatient.findFirst.mockResolvedValue(null);

    await expect(PatientService.getById('unknown-id')).rejects.toThrow(
      new AppError(404, 'Patient not found'),
    );
  });
});

describe('PatientService.create', () => {
  it('creates patient when CPF is unique', async () => {
    mockPatient.findUnique.mockResolvedValue(null);
    mockPatient.create.mockResolvedValue(fakePatient as any);

    const result = await PatientService.create('user-id-1', {
      cpf: '12345678901',
      dateOfBirth: '1990-01-01T00:00:00.000Z',
      consentGiven: true,
    });

    expect(result.cpf).toBe('12345678901');
    expect(mockPatient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cpf: '12345678901',
          consentGiven: true,
          consentDate: expect.any(Date),
        }),
      }),
    );
  });

  it('sets consentDate to null when consentGiven is false', async () => {
    mockPatient.findUnique.mockResolvedValue(null);
    mockPatient.create.mockResolvedValue({ ...fakePatient, consentGiven: false, consentDate: null } as any);

    await PatientService.create('user-id-1', {
      cpf: '12345678901',
      dateOfBirth: '1990-01-01T00:00:00.000Z',
      consentGiven: false,
    });

    expect(mockPatient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ consentDate: null }),
      }),
    );
  });

  it('throws 409 when CPF already exists', async () => {
    mockPatient.findUnique.mockResolvedValue(fakePatient as any);

    await expect(
      PatientService.create('user-id-1', {
        cpf: '12345678901',
        dateOfBirth: '1990-01-01T00:00:00.000Z',
        consentGiven: true,
      }),
    ).rejects.toThrow(new AppError(409, 'CPF already registered'));
  });
});

describe('PatientService.update', () => {
  it('updates patient when found', async () => {
    mockPatient.findFirst.mockResolvedValue(fakePatient as any);
    mockPatient.update.mockResolvedValue({ ...fakePatient, phone: '11888888888' } as any);

    await PatientService.update('patient-id-1', { phone: '11888888888' });

    expect(mockPatient.update).toHaveBeenCalledWith({
      where: { id: 'patient-id-1' },
      data: { phone: '11888888888' },
    });
  });

  it('throws 404 when patient not found', async () => {
    mockPatient.findFirst.mockResolvedValue(null);

    await expect(PatientService.update('unknown-id', { phone: '11888888888' })).rejects.toThrow(
      new AppError(404, 'Patient not found'),
    );
  });
});

describe('PatientService.softDelete', () => {
  it('sets deletedAt when patient is found', async () => {
    mockPatient.findFirst.mockResolvedValue(fakePatient as any);
    mockPatient.update.mockResolvedValue({ ...fakePatient, deletedAt: new Date() } as any);

    await PatientService.softDelete('patient-id-1');

    expect(mockPatient.update).toHaveBeenCalledWith({
      where: { id: 'patient-id-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('throws 404 when patient not found', async () => {
    mockPatient.findFirst.mockResolvedValue(null);

    await expect(PatientService.softDelete('unknown-id')).rejects.toThrow(
      new AppError(404, 'Patient not found'),
    );
  });
});
