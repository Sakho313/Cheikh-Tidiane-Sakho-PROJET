import request from 'supertest';
import app from '../../src/app';
import { resetDatabase, disconnect } from './helpers/db';

beforeEach(resetDatabase);
afterAll(disconnect);

describe('Auth (integration)', () => {
  const creds = { email: 'driver@test.local', password: 'Passw0rd!' };

  it('registers, logs in and returns the profile', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...creds, firstName: 'Awa', lastName: 'Diop' });
    expect(reg.status).toBe(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.accessToken).toBeTruthy();

    const login = await request(app).post('/api/v1/auth/login').send(creds);
    expect(login.status).toBe(200);
    const token = login.body.data.accessToken as string;

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(creds.email);
  });

  it('rejects a weak password at registration', async () => {
    const r = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'weak@test.local', password: 'weak', firstName: 'A', lastName: 'B' });
    expect(r.status).toBe(400);
    expect(r.body.success).toBe(false);
  });

  it('rejects invalid credentials', async () => {
    const r = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.local', password: 'Whatever1!' });
    expect(r.status).toBe(401);
  });

  it('requires a token for /auth/me', async () => {
    const r = await request(app).get('/api/v1/auth/me');
    expect(r.status).toBe(401);
  });
});
