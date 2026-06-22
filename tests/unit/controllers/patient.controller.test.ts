import { PatientController } from '../../../src/controllers/patient.controller';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('../../../src/services/patient.service', () => ({
  PatientService: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
}));

import { PatientService } from '../../../src/services/patient.service';
const mock = PatientService as jest.Mocked<typeof PatientService>;

const res = () => {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  r.send = jest.fn().mockReturnValue(r);
  return r;
};
const next = jest.fn();
const fakeUser = { sub: 'user-1', role: 'PROFESSIONAL' as const, type: 'access' };

beforeEach(() => jest.clearAllMocks());

const fakePatient = { id: 'pat-1', name: 'João', cpf: '000.000.000-00' };

describe('PatientController.list', () => {
  it('retorna lista de pacientes', async () => {
    mock.list.mockResolvedValue([fakePatient] as any);
    const r = res();
    await PatientController.list({} as any, r, next);
    expect(r.json).toHaveBeenCalledWith([fakePatient]);
  });

  it('repassa erro ao next', async () => {
    mock.list.mockRejectedValue(new AppError(500, 'fail'));
    await PatientController.list({} as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('PatientController.getById', () => {
  it('retorna paciente por id', async () => {
    mock.getById.mockResolvedValue(fakePatient as any);
    const r = res();
    await PatientController.getById({ params: { id: 'pat-1' } } as any, r, next);
    expect(r.json).toHaveBeenCalledWith(fakePatient);
  });

  it('repassa erro ao next', async () => {
    mock.getById.mockRejectedValue(new AppError(404, 'Not found'));
    await PatientController.getById({ params: { id: 'x' } } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('PatientController.create', () => {
  it('retorna 201 com paciente criado', async () => {
    mock.create.mockResolvedValue(fakePatient as any);
    const r = res();
    await PatientController.create({ user: fakeUser, body: {} } as any, r, next);
    expect(mock.create).toHaveBeenCalledWith('user-1', {});
    expect(r.status).toHaveBeenCalledWith(201);
    expect(r.json).toHaveBeenCalledWith(fakePatient);
  });

  it('repassa erro ao next', async () => {
    mock.create.mockRejectedValue(new AppError(409, 'CPF já cadastrado'));
    await PatientController.create({ user: fakeUser, body: {} } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('PatientController.update', () => {
  it('retorna paciente atualizado', async () => {
    const updated = { ...fakePatient, name: 'João Updated' };
    mock.update.mockResolvedValue(updated as any);
    const r = res();
    await PatientController.update({ params: { id: 'pat-1' }, body: { name: 'João Updated' } } as any, r, next);
    expect(mock.update).toHaveBeenCalledWith('pat-1', { name: 'João Updated' });
    expect(r.json).toHaveBeenCalledWith(updated);
  });

  it('repassa erro ao next', async () => {
    mock.update.mockRejectedValue(new AppError(404, 'Not found'));
    await PatientController.update({ params: { id: 'x' }, body: {} } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('PatientController.softDelete', () => {
  it('retorna 204 ao deletar paciente', async () => {
    mock.softDelete.mockResolvedValue(undefined as any);
    const r = res();
    await PatientController.softDelete({ params: { id: 'pat-1' } } as any, r, next);
    expect(mock.softDelete).toHaveBeenCalledWith('pat-1');
    expect(r.status).toHaveBeenCalledWith(204);
    expect(r.send).toHaveBeenCalled();
  });

  it('repassa erro ao next', async () => {
    mock.softDelete.mockRejectedValue(new AppError(404, 'Not found'));
    await PatientController.softDelete({ params: { id: 'x' } } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});
