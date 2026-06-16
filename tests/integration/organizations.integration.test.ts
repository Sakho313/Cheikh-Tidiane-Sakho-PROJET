import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import { resetDatabase, disconnect } from './helpers/db';
import { createUser, authHeader, SeededUser } from './helpers/auth';

const NEW_ORG = {
  name: 'Acme Energy SA',
  sector: 'ENERGY',
  entityType: 'ESSENTIAL',
  country: 'France',
  contactEmail: 'security@acme-energy.test',
  contactPhone: '+33123456789',
  website: 'https://acme-energy.test',
};

describe('Organizations integration', () => {
  let admin: SeededUser;
  let viewer: SeededUser;
  let orgId: string;

  beforeAll(async () => {
    await resetDatabase();
    admin = await createUser(Role.ADMIN);
    viewer = await createUser(Role.VIEWER);
  });

  afterAll(async () => {
    await disconnect();
  });

  it('POST /api/v1/organizations creates an organization (201)', async () => {
    const res = await request(app)
      .post('/api/v1/organizations')
      .set(authHeader(admin.accessToken))
      .send(NEW_ORG);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name: NEW_ORG.name,
      sector: 'ENERGY',
      entityType: 'ESSENTIAL',
      country: 'France',
    });
    expect(res.body.data.id).toEqual(expect.any(String));
    orgId = res.body.data.id;
  });

  it('POST /api/v1/organizations rejects an invalid sector (400)', async () => {
    const res = await request(app)
      .post('/api/v1/organizations')
      .set(authHeader(admin.accessToken))
      .send({ ...NEW_ORG, sector: 'NOT_A_SECTOR' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('GET /api/v1/organizations returns a paginated list (200)', async () => {
    const res = await request(app).get('/api/v1/organizations').set(authHeader(viewer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it('GET /api/v1/organizations/:id returns the organization (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/organizations/${orgId}`)
      .set(authHeader(viewer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(orgId);
    expect(res.body.data.name).toBe(NEW_ORG.name);
  });

  it('GET /api/v1/organizations/:id returns 404 for an unknown id', async () => {
    const res = await request(app)
      .get('/api/v1/organizations/00000000-0000-0000-0000-000000000000')
      .set(authHeader(viewer.accessToken));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/organizations/:id/stats returns counters (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/organizations/${orgId}/stats`)
      .set(authHeader(viewer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      incidents: { total: expect.any(Number) },
      risks: { total: expect.any(Number) },
      audits: { total: expect.any(Number) },
      compliance: { totalAssessments: expect.any(Number) },
    });
  });

  it('PUT /api/v1/organizations/:id updates the organization (200)', async () => {
    const res = await request(app)
      .put(`/api/v1/organizations/${orgId}`)
      .set(authHeader(admin.accessToken))
      .send({ name: 'Acme Energy Renamed', country: 'Belgium' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Acme Energy Renamed');
    expect(res.body.data.country).toBe('Belgium');
  });

  it('DELETE /api/v1/organizations/:id is forbidden for a non-ADMIN (403)', async () => {
    const res = await request(app)
      .delete(`/api/v1/organizations/${orgId}`)
      .set(authHeader(viewer.accessToken));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /api/v1/organizations/:id succeeds for an ADMIN (200)', async () => {
    const res = await request(app)
      .delete(`/api/v1/organizations/${orgId}`)
      .set(authHeader(admin.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // The organization is really gone.
    const after = await request(app)
      .get(`/api/v1/organizations/${orgId}`)
      .set(authHeader(admin.accessToken));
    expect(after.status).toBe(404);
  });
});
