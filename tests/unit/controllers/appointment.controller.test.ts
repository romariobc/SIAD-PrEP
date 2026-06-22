import { AppointmentController } from '../../../src/controllers/appointment.controller';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('../../../src/services/appointment.service', () => ({
  AppointmentService: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  },
}));

import { AppointmentService } from '../../../src/services/appointment.service';
const mock = AppointmentService as jest.Mocked<typeof AppointmentService>;

const res = () => {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
};
const next = jest.fn();
const fakeUser = { sub: 'user-1', role: 'PATIENT' as const, type: 'access' };

beforeEach(() => jest.clearAllMocks());

const fakeAppt = { id: 'appt-1', status: 'SCHEDULED' };

describe('AppointmentController.list', () => {
  it('retorna lista de agendamentos', async () => {
    mock.list.mockResolvedValue([fakeAppt] as any);
    const r = res();
    await AppointmentController.list({ user: fakeUser } as any, r, next);
    expect(r.json).toHaveBeenCalledWith([fakeAppt]);
  });

  it('repassa erro ao next', async () => {
    mock.list.mockRejectedValue(new AppError(500, 'fail'));
    await AppointmentController.list({ user: fakeUser } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('AppointmentController.getById', () => {
  it('retorna agendamento por id', async () => {
    mock.getById.mockResolvedValue(fakeAppt as any);
    const r = res();
    await AppointmentController.getById({ params: { id: 'appt-1' } } as any, r, next);
    expect(r.json).toHaveBeenCalledWith(fakeAppt);
  });

  it('repassa erro ao next', async () => {
    mock.getById.mockRejectedValue(new AppError(404, 'Not found'));
    await AppointmentController.getById({ params: { id: 'x' } } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('AppointmentController.create', () => {
  it('retorna 201 com agendamento criado', async () => {
    mock.create.mockResolvedValue(fakeAppt as any);
    const r = res();
    await AppointmentController.create({ body: {} } as any, r, next);
    expect(r.status).toHaveBeenCalledWith(201);
    expect(r.json).toHaveBeenCalledWith(fakeAppt);
  });

  it('repassa erro ao next', async () => {
    mock.create.mockRejectedValue(new AppError(400, 'fail'));
    await AppointmentController.create({ body: {} } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('AppointmentController.cancel', () => {
  it('retorna agendamento cancelado', async () => {
    mock.updateStatus.mockResolvedValue({ ...fakeAppt, status: 'CANCELLED' } as any);
    const r = res();
    await AppointmentController.cancel({ params: { id: 'appt-1' } } as any, r, next);
    expect(mock.updateStatus).toHaveBeenCalledWith('appt-1', 'CANCELLED');
    expect(r.json).toHaveBeenCalled();
  });

  it('repassa erro ao next', async () => {
    mock.updateStatus.mockRejectedValue(new AppError(404, 'Not found'));
    await AppointmentController.cancel({ params: { id: 'x' } } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('AppointmentController.complete', () => {
  it('retorna agendamento concluído', async () => {
    mock.updateStatus.mockResolvedValue({ ...fakeAppt, status: 'COMPLETED' } as any);
    const r = res();
    await AppointmentController.complete({ params: { id: 'appt-1' } } as any, r, next);
    expect(mock.updateStatus).toHaveBeenCalledWith('appt-1', 'COMPLETED');
    expect(r.json).toHaveBeenCalled();
  });

  it('repassa erro ao next', async () => {
    mock.updateStatus.mockRejectedValue(new AppError(404, 'Not found'));
    await AppointmentController.complete({ params: { id: 'x' } } as any, res(), next);
    expect(next).toHaveBeenCalled();
  });
});
