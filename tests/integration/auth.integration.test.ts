import request from 'supertest';
import app from '../../src/app';
import { resetDatabase, disconnect } from './helpers/db';

const VALID_USER = {
  email: 'auth.user@nis2.test',
  password: 'Str0ng@Pass1',
  firstName: 'Alice',
  lastName: 'Martin',
};

describe('Auth integration', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('creates a user and returns tokens + user (201)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(VALID_USER);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.refreshToken).toEqual(expect.any(String));
      expect(res.body.data.user).toMatchObject({
        email: VALID_USER.email,
        firstName: VALID_USER.firstName,
        lastName: VALID_USER.lastName,
        role: 'VIEWER',
      });
      expect(res.body.data.user.id).toEqual(expect.any(String));
      // The password hash must never leak in the response.
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('rejects a duplicate email (409)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(VALID_USER);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects an invalid body with field-level errors (400)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'not-an-email',
        password: 'weak',
        firstName: '',
        lastName: '',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
      const fields = res.body.errors.map((e: { field: string }) => e.field);
      expect(fields).toEqual(expect.arrayContaining(['email', 'password']));
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials (200 + tokens)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: VALID_USER.email,
        password: VALID_USER.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.refreshToken).toEqual(expect.any(String));
      expect(res.body.data.user.email).toBe(VALID_USER.email);
    });

    it('rejects a wrong password (401)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: VALID_USER.email,
        password: 'WrongP@ssw0rd',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns the profile with a valid token (200)', async () => {
      const login = await request(app).post('/api/v1/auth/login').send({
        email: VALID_USER.email,
        password: VALID_USER.password,
      });
      const token = login.body.data.accessToken;

      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(VALID_USER.email);
      expect(res.body.data.role).toBe('VIEWER');
      expect(res.body.data.passwordHash).toBeUndefined();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('issues a new access token from a valid refresh token (200)', async () => {
      const login = await request(app).post('/api/v1/auth/login').send({
        email: VALID_USER.email,
        password: VALID_USER.password,
      });
      const refreshToken = login.body.data.refreshToken;

      const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
    });

    it('rejects a missing refresh token (400)', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
