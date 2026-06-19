import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import { resetDatabase, disconnect } from './helpers/db';
import { createOrg, createUserWithToken, bearer } from './helpers/auth';

beforeEach(resetDatabase);
afterAll(disconnect);

describe('Vehicles (integration)', () => {
  it('creates and lists a vehicle as ADMIN', async () => {
    const org = await createOrg();
    const { token } = await createUserWithToken(org.id, Role.ADMIN);

    const create = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', bearer(token))
      .send({ plate: 'DK-1234-AA', make: 'Toyota', model: 'Hilux', fuelType: 'DIESEL' });
    expect(create.status).toBe(201);
    expect(create.body.data.plate).toBe('DK-1234-AA');

    const list = await request(app).get('/api/v1/vehicles').set('Authorization', bearer(token));
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(1);
  });

  it('forbids a VIEWER from creating a vehicle (RBAC 403)', async () => {
    const org = await createOrg();
    const { token } = await createUserWithToken(org.id, Role.VIEWER);

    const r = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', bearer(token))
      .send({ plate: 'DK-9999-ZZ', make: 'X', model: 'Y' });
    expect(r.status).toBe(403);
  });

  it('isolates vehicles by organization (no cross-tenant read)', async () => {
    const orgA = await createOrg('Fleet A');
    const orgB = await createOrg('Fleet B');
    const adminA = await createUserWithToken(orgA.id, Role.ADMIN);
    const adminB = await createUserWithToken(orgB.id, Role.ADMIN);

    const created = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', bearer(adminA.token))
      .send({ plate: 'DK-1111-AA', make: 'Renault', model: 'Master' });
    const vehicleId = created.body.data.id as string;

    // L'org B ne doit pas voir le véhicule de l'org A.
    const crossRead = await request(app)
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set('Authorization', bearer(adminB.token));
    expect(crossRead.status).toBe(404);

    const listB = await request(app).get('/api/v1/vehicles').set('Authorization', bearer(adminB.token));
    expect(listB.body.data.total).toBe(0);
  });

  it('returns 404 for an unknown vehicle', async () => {
    const org = await createOrg();
    const { token } = await createUserWithToken(org.id, Role.ADMIN);
    const r = await request(app)
      .get('/api/v1/vehicles/00000000-0000-4000-a000-000000000999')
      .set('Authorization', bearer(token));
    expect(r.status).toBe(404);
  });

  it('rejects unauthenticated requests', async () => {
    const r = await request(app).get('/api/v1/vehicles');
    expect(r.status).toBe(401);
  });
});
