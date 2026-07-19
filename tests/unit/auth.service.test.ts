import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/services/auth.service';
import { env } from '../../src/config/env';

describe('AuthService.refresh', () => {
  it('rejects an access token used as a refresh token', async () => {
    const accessToken = jwt.sign({ sub: 'user-1', role: 'PATIENT', type: 'access' }, env.JWT_SECRET, {
      expiresIn: '1h',
    });

    await expect(AuthService.refresh(accessToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects a token with no type claim', async () => {
    const legacyToken = jwt.sign({ sub: 'user-1', role: 'PATIENT' }, env.JWT_SECRET, { expiresIn: '1h' });

    await expect(AuthService.refresh(legacyToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('issues a fresh access token for a valid refresh token', async () => {
    const refreshToken = jwt.sign({ sub: 'user-1', role: 'PATIENT', type: 'refresh' }, env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const result = await AuthService.refresh(refreshToken);
    const decoded = jwt.verify(result.token, env.JWT_SECRET) as { type: string };

    expect(decoded.type).toBe('access');
  });
});
