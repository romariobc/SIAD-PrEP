jest.mock('../../src/database/client', () => ({
  prisma: {
    medication: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    patient: {
      findFirst: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/database/client';
import { MedicationService } from '../../src/services/medication.service';
import { AuthPayload } from '../../src/middlewares/auth.middleware';

const mockedPrisma = prisma as unknown as {
  medication: { findUnique: jest.Mock; create: jest.Mock };
  patient: { findFirst: jest.Mock };
};

describe('MedicationService.getById', () => {
  const medication = { id: 'm1', patient: { userId: 'owner', deletedAt: null } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows the owning patient to read their medication record', async () => {
    mockedPrisma.medication.findUnique.mockResolvedValue(medication);
    const actor: AuthPayload = { sub: 'owner', role: 'PATIENT' };

    await expect(MedicationService.getById('m1', actor)).resolves.toEqual(medication);
  });

  it('blocks another patient from reading the record (IDOR)', async () => {
    mockedPrisma.medication.findUnique.mockResolvedValue(medication);
    const actor: AuthPayload = { sub: 'attacker', role: 'PATIENT' };

    await expect(MedicationService.getById('m1', actor)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('allows a PROFESSIONAL to read any medication record', async () => {
    mockedPrisma.medication.findUnique.mockResolvedValue(medication);
    const actor: AuthPayload = { sub: 'prof-1', role: 'PROFESSIONAL' };

    await expect(MedicationService.getById('m1', actor)).resolves.toEqual(medication);
  });

  it('hides the record once the patient has been soft-deleted', async () => {
    mockedPrisma.medication.findUnique.mockResolvedValue({
      ...medication,
      patient: { userId: 'owner', deletedAt: new Date() },
    });
    const actor: AuthPayload = { sub: 'prof-1', role: 'PROFESSIONAL' };

    await expect(MedicationService.getById('m1', actor)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('MedicationService.create', () => {
  const input = {
    patientId: 'p1',
    regimen: 'TENOFOVIR_EMTRICITABINA' as const,
    startDate: '2026-01-01T00:00:00.000Z',
    prescribedBy: 'prof-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects creation when the patient does not exist or is soft-deleted', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue(null);

    await expect(MedicationService.create(input)).rejects.toMatchObject({ statusCode: 404 });
    expect(mockedPrisma.medication.create).not.toHaveBeenCalled();
  });

  it('creates the medication when the patient exists', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue({ id: 'p1' });
    mockedPrisma.medication.create.mockResolvedValue({ id: 'med-1' });

    await MedicationService.create(input);

    expect(mockedPrisma.medication.create).toHaveBeenCalled();
  });
});
