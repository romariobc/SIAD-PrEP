import { MedicationController } from '../../../src/controllers/medication.controller';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('../../../src/services/medication.service', () => ({
  MedicationService: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    dispense: jest.fn(),
  },
}));

import { MedicationService } from '../../../src/services/medication.service';
const mock = MedicationService as jest.Mocked<typeof MedicationService>;

const res = () => {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
};
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

const fakeMed = { id: 'med-1', name: 'Tenofovir' };

describe('MedicationController.list', () => {
  it('retorna lista de medicamentos', async () => {
    mock.list.mockResolvedValue([fakeMed] as any);
    const r = res();
    await MedicationController.list({} as any, r, next);
    expect(r.json).toHaveBeenCalledWith([fakeMed]);
  });

  it('repassa erro ao next', async () => {
    mock.list.mockRejectedValue(new AppError(500, 'fail'));
    await MedicationController.list({} as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('MedicationController.getById', () => {
  it('retorna medicamento por id', async () => {
    mock.getById.mockResolvedValue(fakeMed as any);
    const r = res();
    await MedicationController.getById({ params: { id: 'med-1' } } as any, r, next);
    expect(r.json).toHaveBeenCalledWith(fakeMed);
  });

  it('repassa erro ao next', async () => {
    mock.getById.mockRejectedValue(new AppError(404, 'Not found'));
    await MedicationController.getById({ params: { id: 'x' } } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('MedicationController.create', () => {
  it('retorna 201 com medicamento criado', async () => {
    mock.create.mockResolvedValue(fakeMed as any);
    const r = res();
    await MedicationController.create({ body: {} } as any, r, next);
    expect(r.status).toHaveBeenCalledWith(201);
    expect(r.json).toHaveBeenCalledWith(fakeMed);
  });

  it('repassa erro ao next', async () => {
    mock.create.mockRejectedValue(new AppError(400, 'fail'));
    await MedicationController.create({ body: {} } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('MedicationController.dispense', () => {
  it('retorna resultado da dispensação', async () => {
    const fakeDispense = { id: 'disp-1', medicationId: 'med-1' };
    mock.dispense.mockResolvedValue(fakeDispense as any);
    const r = res();
    await MedicationController.dispense({ params: { id: 'med-1' }, body: {} } as any, r, next);
    expect(mock.dispense).toHaveBeenCalledWith('med-1', {});
    expect(r.json).toHaveBeenCalledWith(fakeDispense);
  });

  it('repassa erro ao next', async () => {
    mock.dispense.mockRejectedValue(new AppError(404, 'Not found'));
    await MedicationController.dispense({ params: { id: 'x' }, body: {} } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});
