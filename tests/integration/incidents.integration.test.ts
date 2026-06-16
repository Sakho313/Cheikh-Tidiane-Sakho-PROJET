import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import { resetDatabase, disconnect, prisma } from './helpers/db';
import { createUser, authHeader, SeededUser } from './helpers/auth';

describe('Incidents integration', () => {
  let officer: SeededUser;
  let orgId: string;
  let incidentId: string;

  beforeAll(async () => {
    await resetDatabase();
    officer = await createUser(Role.COMPLIANCE_OFFICER);

    const org = await prisma.organization.create({
      data: {
        name: 'Incident Org',
        sector: 'DIGITAL_INFRASTRUCTURE',
        entityType: 'ESSENTIAL',
        country: 'France',
        contactEmail: 'soc@incident.test',
      },
    });
    orgId = org.id;
  });

  afterAll(async () => {
    await disconnect();
  });

  it('POST /api/v1/incidents creates an incident (201)', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .set(authHeader(officer.accessToken))
      .send({
        organizationId: orgId,
        title: 'Ransomware on file server',
        description: 'Encryption activity detected on the primary file server.',
        severity: 'HIGH',
        incidentType: 'Ransomware',
        detectedAt: new Date().toISOString(),
        affectedSystems: ['file-server-01', 'backup-node-02'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      organizationId: orgId,
      title: 'Ransomware on file server',
      severity: 'HIGH',
      reportedToAuthority: false,
    });
    expect(res.body.data.id).toEqual(expect.any(String));
    incidentId = res.body.data.id;
  });

  it('POST /api/v1/incidents rejects an invalid body (400)', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .set(authHeader(officer.accessToken))
      .send({
        organizationId: orgId,
        title: 'Missing fields',
        // missing description, severity, incidentType, detectedAt, affectedSystems
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('GET /api/v1/incidents/org/:orgId returns a paginated list (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/incidents/org/${orgId}`)
      .set(authHeader(officer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data.data.some((i: { id: string }) => i.id === incidentId)).toBe(true);
  });

  it('POST /api/v1/incidents/:id/report-to-authority flags the incident (200)', async () => {
    const res = await request(app)
      .post(`/api/v1/incidents/${incidentId}/report-to-authority`)
      .set(authHeader(officer.accessToken))
      .send({ authorityReference: 'ANSSI-2026-0001' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reportedToAuthority).toBe(true);
    expect(res.body.data.reportedAt).not.toBeNull();
    expect(res.body.data.status).toBe('REPORTED_INITIAL');
    expect(res.body.data.authorityReference).toBe('ANSSI-2026-0001');
  });

  it('POST /api/v1/incidents/:id/report-to-authority is rejected when already reported (409)', async () => {
    const res = await request(app)
      .post(`/api/v1/incidents/${incidentId}/report-to-authority`)
      .set(authHeader(officer.accessToken))
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/incidents/stats/:orgId returns aggregated stats (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/incidents/stats/${orgId}`)
      .set(authHeader(officer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      total: expect.any(Number),
      totalUnreported: expect.any(Number),
    });
    expect(Array.isArray(res.body.data.bySeverity)).toBe(true);
    expect(Array.isArray(res.body.data.byStatus)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });
});
