import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../../src/middlewares/auth.middleware';
import { AppError } from '../../../src/middlewares/error.middleware';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../../src/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
  },
}));

import jwt from 'jsonwebtoken';
const mockJwt = jwt as jest.Mocked<typeof jwt>;

function makeReq(overrides: Partial<Request> = {}): Request {
  return { headers: {}, ...overrides } as unknown as Request;
}

function makeRes(): Response {
  return {} as Response;
}

function makeNext(): jest.MockedFunction<NextFunction> {
  return jest.fn();
}

beforeEach(() => jest.clearAllMocks());

describe('authenticate', () => {
  it('sets req.user and calls next() on valid token', () => {
    const payload = { sub: 'user-id-1', role: 'PATIENT', type: 'access' };
    (mockJwt.verify as jest.Mock).mockReturnValue(payload);

    const req = makeReq({ headers: { authorization: 'Bearer valid-token' } });
    const next = makeNext();

    authenticate(req, makeRes(), next);

    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(AppError 401) when Authorization header is missing', () => {
    const req = makeReq({ headers: {} });
    const next = makeNext();

    authenticate(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0] as unknown as AppError;
    expect(err.statusCode).toBe(401);
  });

  it('calls next(AppError 401) when header does not start with Bearer', () => {
    const req = makeReq({ headers: { authorization: 'Basic abc123' } });
    const next = makeNext();

    authenticate(req, makeRes(), next);

    const err = next.mock.calls[0][0] as unknown as AppError;
    expect(err.statusCode).toBe(401);
  });

  it('calls next(AppError 401) when a refresh token is used in authenticate', () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 'user-id-1', role: 'PATIENT', type: 'refresh' });

    const req = makeReq({ headers: { authorization: 'Bearer refresh-token' } });
    const next = makeNext();

    authenticate(req, makeRes(), next);

    const err = next.mock.calls[0][0] as unknown as AppError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid token type');
  });

  it('calls next(AppError 401) when token verification fails', () => {
    (mockJwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

    const req = makeReq({ headers: { authorization: 'Bearer bad-token' } });
    const next = makeNext();

    authenticate(req, makeRes(), next);

    const err = next.mock.calls[0][0] as unknown as AppError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid or expired token');
  });
});

describe('authorize', () => {
  it('calls next() when user has required role', () => {
    const req = makeReq() as Request & { user: { sub: string; role: string } };
    req.user = { sub: 'user-id-1', role: 'ADMIN', type: 'access' };
    const next = makeNext();

    authorize('ADMIN', 'PROFESSIONAL')(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(AppError 403) when user role is not in the allowed list', () => {
    const req = makeReq() as Request & { user: { sub: string; role: string } };
    req.user = { sub: 'user-id-1', role: 'PATIENT', type: 'access' };
    const next = makeNext();

    authorize('ADMIN', 'PROFESSIONAL')(req, makeRes(), next);

    const err = next.mock.calls[0][0] as unknown as AppError;
    expect(err.statusCode).toBe(403);
  });

  it('calls next(AppError 403) when req.user is not set', () => {
    const req = makeReq() as Request;
    req.user = undefined;
    const next = makeNext();

    authorize('ADMIN')(req, makeRes(), next);

    const err = next.mock.calls[0][0] as unknown as AppError;
    expect(err.statusCode).toBe(403);
  });
});
