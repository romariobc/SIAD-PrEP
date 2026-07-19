jest.mock('../../src/database/client', () => ({
  prisma: {
    patient: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '../../src/database/client';
import { PatientService } from '../../src/services/patient.service';
import { AuthPayload } from '../../src/middlewares/auth.middleware';

const mockedPrisma = prisma as unknown as {
  patient: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
};

describe('PatientService.getById', () => {
  const patientRecord = { id: 'p1', userId: 'user-owner', deletedAt: null };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows a patient to read their own record', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue(patientRecord);
    const actor: AuthPayload = { sub: 'user-owner', role: 'PATIENT' };

    await expect(PatientService.getById('p1', actor)).resolves.toEqual(patientRecord);
  });

  it('blocks a patient from reading another patient record (IDOR)', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue(patientRecord);
    const actor: AuthPayload = { sub: 'someone-else', role: 'PATIENT' };

    await expect(PatientService.getById('p1', actor)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('allows a PROFESSIONAL to read any patient record', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue(patientRecord);
    const actor: AuthPayload = { sub: 'prof-1', role: 'PROFESSIONAL' };

    await expect(PatientService.getById('p1', actor)).resolves.toEqual(patientRecord);
  });

  it('throws 404 when the patient does not exist', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue(null);
    const actor: AuthPayload = { sub: 'user-owner', role: 'PATIENT' };

    await expect(PatientService.getById('missing', actor)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('PatientService.update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.patient.findFirst.mockResolvedValue({
      id: 'p1',
      userId: 'user-owner',
      deletedAt: null,
    });
  });

  it('sets consentDate when consentGiven turns true', async () => {
    mockedPrisma.patient.update.mockResolvedValue({});
    const actor: AuthPayload = { sub: 'user-owner', role: 'PATIENT' };

    await PatientService.update('p1', actor, { consentGiven: true });

    expect(mockedPrisma.patient.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: expect.objectContaining({ consentGiven: true, consentDate: expect.any(Date) }),
    });
  });

  it('clears consentDate when consentGiven turns false', async () => {
    mockedPrisma.patient.update.mockResolvedValue({});
    const actor: AuthPayload = { sub: 'user-owner', role: 'PATIENT' };

    await PatientService.update('p1', actor, { consentGiven: false });

    expect(mockedPrisma.patient.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: expect.objectContaining({ consentGiven: false, consentDate: null }),
    });
  });

  it('rejects an update attempted by a non-owner patient (IDOR)', async () => {
    const actor: AuthPayload = { sub: 'attacker', role: 'PATIENT' };

    await expect(PatientService.update('p1', actor, { phone: '11999999999' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(mockedPrisma.patient.update).not.toHaveBeenCalled();
  });
});

describe('PatientService.create', () => {
  const input = {
    cpf: '12345678900',
    dateOfBirth: '1990-01-01T00:00:00.000Z',
    consentGiven: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects creation when the CPF belongs to an active patient', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(PatientService.create('user-1', input)).rejects.toMatchObject({ statusCode: 409 });
    expect(mockedPrisma.patient.create).not.toHaveBeenCalled();
    expect(mockedPrisma.patient.findFirst).toHaveBeenCalledWith({
      where: { cpf: input.cpf, deletedAt: null },
    });
  });

  it('allows re-registering a CPF that only belongs to a soft-deleted patient', async () => {
    mockedPrisma.patient.findFirst.mockResolvedValue(null);
    mockedPrisma.patient.create.mockResolvedValue({ id: 'new-patient' });

    await PatientService.create('user-1', input);

    expect(mockedPrisma.patient.create).toHaveBeenCalled();
  });
});
