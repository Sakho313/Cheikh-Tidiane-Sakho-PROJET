import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import { resetDatabase, disconnect, prisma } from './helpers/db';
import { createUser, authHeader, SeededUser } from './helpers/auth';

describe('Compliance integration', () => {
  let admin: SeededUser;
  let orgId: string;
  let controlId: string;

  beforeAll(async () => {
    await resetDatabase();
    admin = await createUser(Role.ADMIN);

    const org = await prisma.organization.create({
      data: {
        name: 'Compliance Org',
        sector: 'BANKING',
        entityType: 'IMPORTANT',
        country: 'France',
        contactEmail: 'compliance@org.test',
      },
    });
    orgId = org.id;
  });

  afterAll(async () => {
    await disconnect();
  });

  it('POST /api/v1/compliance/seed-controls seeds the NIS2 controls (ADMIN)', async () => {
    const res = await request(app)
      .post('/api/v1/compliance/seed-controls')
      .set(authHeader(admin.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/compliance/controls returns the seeded controls (200)', async () => {
    const res = await request(app)
      .get('/api/v1/compliance/controls')
      .set(authHeader(admin.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toMatchObject({
      id: expect.any(String),
      article: expect.any(String),
      domain: expect.any(String),
      requirement: expect.any(String),
    });

    controlId = res.body.data[0].id;
  });

  it('POST /api/v1/compliance/assessments upserts an assessment (200)', async () => {
    const res = await request(app)
      .post('/api/v1/compliance/assessments')
      .set(authHeader(admin.accessToken))
      .send({
        organizationId: orgId,
        controlId,
        status: 'COMPLIANT',
        evidence: 'Policy document v1.2 approved by the board.',
        notes: 'Reviewed during the Q2 audit.',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      organizationId: orgId,
      controlId,
      status: 'COMPLIANT',
    });
    // COMPLIANT assessments get a reviewedAt timestamp set by the service.
    expect(res.body.data.reviewedAt).not.toBeNull();
  });

  it('POST /api/v1/compliance/assessments is idempotent on (org, control) (200)', async () => {
    const res = await request(app)
      .post('/api/v1/compliance/assessments')
      .set(authHeader(admin.accessToken))
      .send({
        organizationId: orgId,
        controlId,
        status: 'PARTIAL',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.data.status).toBe('PARTIAL');

    // Still a single assessment for this (org, control) pair.
    const count = await prisma.complianceAssessment.count({
      where: { organizationId: orgId, controlId },
    });
    expect(count).toBe(1);
  });

  it('GET /api/v1/compliance/score/:orgId returns overall and domain scores (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/compliance/score/${orgId}`)
      .set(authHeader(admin.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      overallScore: expect.any(Number),
      totalControls: expect.any(Number),
      applicableControls: expect.any(Number),
      compliantControls: expect.any(Number),
    });
    expect(typeof res.body.data.domainScores).toBe('object');
    expect(res.body.data.domainScores).not.toBeNull();
  });
});
