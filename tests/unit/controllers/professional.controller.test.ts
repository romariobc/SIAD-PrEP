import { ProfessionalController } from '../../../src/controllers/professional.controller';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('../../../src/services/professional.service', () => ({
  ProfessionalService: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

import { ProfessionalService } from '../../../src/services/professional.service';
const mock = ProfessionalService as jest.Mocked<typeof ProfessionalService>;

const res = () => {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
};
const next = jest.fn();
const fakeUser = { sub: 'user-1', role: 'ADMIN' as const, type: 'access' };

beforeEach(() => jest.clearAllMocks());

const fakePro = { id: 'pro-1', name: 'Dr. Ana', crm: 'CRM-SP-123456' };

describe('ProfessionalController.list', () => {
  it('retorna lista de profissionais', async () => {
    mock.list.mockResolvedValue([fakePro] as any);
    const r = res();
    await ProfessionalController.list({} as any, r, next);
    expect(r.json).toHaveBeenCalledWith([fakePro]);
  });

  it('repassa erro ao next', async () => {
    mock.list.mockRejectedValue(new AppError(500, 'fail'));
    await ProfessionalController.list({} as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('ProfessionalController.getById', () => {
  it('retorna profissional por id', async () => {
    mock.getById.mockResolvedValue(fakePro as any);
    const r = res();
    await ProfessionalController.getById({ params: { id: 'pro-1' } } as any, r, next);
    expect(r.json).toHaveBeenCalledWith(fakePro);
  });

  it('repassa erro ao next', async () => {
    mock.getById.mockRejectedValue(new AppError(404, 'Not found'));
    await ProfessionalController.getById({ params: { id: 'x' } } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('ProfessionalController.create', () => {
  it('retorna 201 com profissional criado', async () => {
    mock.create.mockResolvedValue(fakePro as any);
    const r = res();
    await ProfessionalController.create({ user: fakeUser, body: {} } as any, r, next);
    expect(mock.create).toHaveBeenCalledWith('user-1', {});
    expect(r.status).toHaveBeenCalledWith(201);
    expect(r.json).toHaveBeenCalledWith(fakePro);
  });

  it('repassa erro ao next', async () => {
    mock.create.mockRejectedValue(new AppError(409, 'CRM já cadastrado'));
    await ProfessionalController.create({ user: fakeUser, body: {} } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('ProfessionalController.update', () => {
  it('retorna profissional atualizado', async () => {
    const updated = { ...fakePro, name: 'Dr. Ana Updated' };
    mock.update.mockResolvedValue(updated as any);
    const r = res();
    await ProfessionalController.update({ params: { id: 'pro-1' }, body: { name: 'Dr. Ana Updated' } } as any, r, next);
    expect(mock.update).toHaveBeenCalledWith('pro-1', { name: 'Dr. Ana Updated' });
    expect(r.json).toHaveBeenCalledWith(updated);
  });

  it('repassa erro ao next', async () => {
    mock.update.mockRejectedValue(new AppError(404, 'Not found'));
    await ProfessionalController.update({ params: { id: 'x' }, body: {} } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});
