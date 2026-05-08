import { MedicationService } from '../../../src/services/medication.service';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('../../../src/database/client', () => ({
  prisma: {
    medication: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    dispense: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/database/client';

const mockMedication = prisma.medication as jest.Mocked<typeof prisma.medication>;
const mockDispense = prisma.dispense as jest.Mocked<typeof prisma.dispense>;

const fakeMedication = {
  id: 'med-id-1',
  patientId: 'patient-id-1',
  regimen: 'TENOFOVIR_EMTRICITABINA' as const,
  startDate: new Date('2026-01-01'),
  endDate: null,
  prescribedBy: 'professional-id-1',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeDispense = {
  id: 'dispense-id-1',
  medicationId: 'med-id-1',
  quantity: 30,
  dispensedAt: new Date(),
  createdAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MedicationService.list', () => {
  it('returns medications with patient info', async () => {
    mockMedication.findMany.mockResolvedValue([fakeMedication] as any);

    const result = await MedicationService.list();

    expect(result).toHaveLength(1);
    expect(mockMedication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: expect.any(Object) }),
    );
  });
});

describe('MedicationService.getById', () => {
  it('returns medication when found', async () => {
    mockMedication.findUnique.mockResolvedValue(fakeMedication as any);

    const result = await MedicationService.getById('med-id-1');

    expect(result.id).toBe('med-id-1');
  });

  it('throws 404 when medication is not found', async () => {
    mockMedication.findUnique.mockResolvedValue(null);

    await expect(MedicationService.getById('unknown-id')).rejects.toThrow(
      new AppError(404, 'Medication record not found'),
    );
  });
});

describe('MedicationService.create', () => {
  it('creates a medication record', async () => {
    mockMedication.create.mockResolvedValue(fakeMedication as any);

    await MedicationService.create({
      patientId: 'patient-id-1',
      regimen: 'TENOFOVIR_EMTRICITABINA',
      startDate: '2026-01-01T00:00:00Z',
      prescribedBy: 'professional-id-1',
    });

    expect(mockMedication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isActive: true,
          regimen: 'TENOFOVIR_EMTRICITABINA',
        }),
      }),
    );
  });

  it('sets endDate to null when not provided', async () => {
    mockMedication.create.mockResolvedValue(fakeMedication as any);

    await MedicationService.create({
      patientId: 'patient-id-1',
      regimen: 'TENOFOVIR_LAMIVUDINA',
      startDate: '2026-01-01T00:00:00Z',
      prescribedBy: 'professional-id-1',
    });

    expect(mockMedication.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ endDate: null }) }),
    );
  });
});

describe('MedicationService.dispense', () => {
  it('creates dispense record for existing medication', async () => {
    mockMedication.findUnique.mockResolvedValue(fakeMedication as any);
    mockDispense.create.mockResolvedValue(fakeDispense as any);

    await MedicationService.dispense('med-id-1', { quantity: 30 });

    expect(mockDispense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          medicationId: 'med-id-1',
          quantity: 30,
          dispensedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('uses provided dispensedAt date', async () => {
    mockMedication.findUnique.mockResolvedValue(fakeMedication as any);
    mockDispense.create.mockResolvedValue(fakeDispense as any);

    await MedicationService.dispense('med-id-1', {
      quantity: 30,
      dispensedAt: '2026-05-01T00:00:00Z',
    });

    expect(mockDispense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dispensedAt: new Date('2026-05-01T00:00:00Z'),
        }),
      }),
    );
  });

  it('throws 404 when medication not found', async () => {
    mockMedication.findUnique.mockResolvedValue(null);

    await expect(MedicationService.dispense('unknown-id', { quantity: 30 })).rejects.toThrow(
      new AppError(404, 'Medication record not found'),
    );
  });
});
