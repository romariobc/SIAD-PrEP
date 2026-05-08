import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../../src/middlewares/validate.middleware';

function makeReq(body: unknown): Request {
  return { body } as Request;
}

function makeRes(): Response {
  return {} as Response;
}

const schema = z.object({
  name: z.string().min(2),
  age: z.number().int().positive(),
});

describe('validate middleware', () => {
  it('passes valid body to next and replaces req.body with parsed value', () => {
    const req = makeReq({ name: 'Ana', age: 30 });
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    validate(schema)(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Ana', age: 30 });
  });

  it('throws ZodError when body is invalid', () => {
    const req = makeReq({ name: 'A', age: -1 });
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    expect(() => validate(schema)(req, makeRes(), next)).toThrow();
    expect(next).not.toHaveBeenCalled();
  });

  it('throws ZodError when required field is missing', () => {
    const req = makeReq({ name: 'Valid Name' });
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    expect(() => validate(schema)(req, makeRes(), next)).toThrow();
  });
});
