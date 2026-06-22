import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { errorMiddleware, AppError } from '../../../src/middlewares/error.middleware';

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

const req = {} as Request;
const next = jest.fn() as unknown as NextFunction;

describe('errorMiddleware', () => {
  it('returns status and message for AppError', () => {
    const err = new AppError(404, 'Not found');
    const res = makeRes();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('returns 400 with field errors for ZodError', () => {
    const schema = z.object({ name: z.string() });
    let zodErr!: ZodError;
    try {
      schema.parse({ name: 123 });
    } catch (e) {
      zodErr = e as ZodError;
    }

    const res = makeRes();
    errorMiddleware(zodErr, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation error', details: expect.any(Object) }),
    );
  });

  it('returns 500 for unknown errors', () => {
    const err = new Error('Something broke');
    const res = makeRes();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('AppError', () => {
  it('stores statusCode and message correctly', () => {
    const err = new AppError(422, 'Unprocessable');
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe('Unprocessable');
    expect(err.name).toBe('AppError');
    expect(err).toBeInstanceOf(Error);
  });
});
