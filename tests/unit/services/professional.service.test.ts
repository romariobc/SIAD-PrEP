import { ProfessionalService } from '../../../src/services/professional.service';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('../../../src/database/client', () => ({
  prisma: {
    professional: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/database/client';

const mockProfessional = prisma.professional as jest.Mocked<typeof prisma.professional>;

const fakeProfessional = {
  id: 'prof-id-1',
  userId: 'user-id-2',
  crm: 'CRM-SP-12345',
  specialty: 'Infectologia',
  phone: '11988887777',
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProfessionalService.list', () => {
  it('returns professionals with user info', async () => {
    mockProfessional.findMany.mockResolvedValue([fakeProfessional] as any);

    const result = await ProfessionalService.list();

    expect(result).toHaveLength(1);
    expect(mockProfessional.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: expect.any(Object) }),
    );
  });
});

describe('ProfessionalService.getById', () => {
  it('returns professional when found', async () => {
    mockProfessional.findUnique.mockResolvedValue(fakeProfessional as any);

    const result = await ProfessionalService.getById('prof-id-1');

    expect(result.id).toBe('prof-id-1');
  });

  it('throws 404 when professional not found', async () => {
    mockProfessional.findUnique.mockResolvedValue(null);

    await expect(ProfessionalService.getById('unknown-id')).rejects.toThrow(
      new AppError(404, 'Professional not found'),
    );
  });
});

describe('ProfessionalService.create', () => {
  it('creates professional when CRM is unique', async () => {
    mockProfessional.findUnique.mockResolvedValue(null);
    mockProfessional.create.mockResolvedValue(fakeProfessional as any);

    const result = await ProfessionalService.create('user-id-2', {
      crm: 'CRM-SP-12345',
      specialty: 'Infectologia',
      phone: '11988887777',
    });

    expect(result.crm).toBe('CRM-SP-12345');
    expect(mockProfessional.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-id-2',
          crm: 'CRM-SP-12345',
        }),
      }),
    );
  });

  it('throws 409 when CRM already exists', async () => {
    mockProfessional.findUnique.mockResolvedValue(fakeProfessional as any);

    await expect(
      ProfessionalService.create('user-id-2', { crm: 'CRM-SP-12345', specialty: 'Infectologia' }),
    ).rejects.toThrow(new AppError(409, 'CRM already registered'));
  });
});

describe('ProfessionalService.update', () => {
  it('updates professional when found', async () => {
    mockProfessional.findUnique.mockResolvedValue(fakeProfessional as any);
    mockProfessional.update.mockResolvedValue({ ...fakeProfessional, specialty: 'Clínica Geral' } as any);

    await ProfessionalService.update('prof-id-1', { specialty: 'Clínica Geral' });

    expect(mockProfessional.update).toHaveBeenCalledWith({
      where: { id: 'prof-id-1' },
      data: { specialty: 'Clínica Geral' },
    });
  });

  it('throws 404 when professional not found', async () => {
    mockProfessional.findUnique.mockResolvedValue(null);

    await expect(ProfessionalService.update('unknown-id', { specialty: 'X' })).rejects.toThrow(
      new AppError(404, 'Professional not found'),
    );
  });
});
