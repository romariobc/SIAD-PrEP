import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('POST /api/auth/register', () => {
  it('rejects self-registration as ADMIN (privilege escalation)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'attacker@example.com',
      password: 'supersecret1',
      name: 'Attacker',
      role: 'ADMIN',
    });

    expect(res.status).toBe(400);
  });
});
