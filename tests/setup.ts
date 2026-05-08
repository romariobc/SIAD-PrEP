process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long!!';
process.env.JWT_EXPIRES_IN = '7d';
process.env.BCRYPT_ROUNDS = '10';
process.env.PORT = '3001';
