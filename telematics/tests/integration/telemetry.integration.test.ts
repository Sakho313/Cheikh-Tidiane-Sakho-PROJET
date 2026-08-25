import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../src/app';
import { resetDatabase, disconnect } from './helpers/db';
import { createOrg, createUserWithToken, bearer } from './helpers/auth';

beforeEach(resetDatabase);
afterAll(disconnect);

async function setupVehicle(): Promise<{ token: string; vehicleId: string }> {
  const org = await createOrg();
  const { token } = await createUserWithToken(org.id, Role.ADMIN);
  const created = await request(app)
    .post('/api/v1/vehicles')
    .set('Authorization', bearer(token))
    .send({ plate: 'DK-7777-GP', make: 'Mercedes', model: 'Sprinter', fuelType: 'DIESEL' });
  return { token, vehicleId: created.body.data.id as string };
}

describe('Telemetry ingestion (integration)', () => {
  it('ingests a position via device API key and exposes it on the live map', async () => {
    const { token, vehicleId } = await setupVehicle();

    const ingest = await request(app)
      .post('/api/v1/telemetry/ingest')
      .set('x-api-key', 'test-ingest-key')
      .send({ positions: [{ vehicleId, latitude: 14.7167, longitude: -17.4677, speedKmh: 40 }] });
    expect([200, 201]).toContain(ingest.status);
    expect(ingest.body.data.ingested).toBe(1);

    const live = await request(app).get('/api/v1/telemetry/live').set('Authorization', bearer(token));
    expect(live.status).toBe(200);
    const row = (live.body.data as Array<{ vehicle: { id: string }; position: unknown }>).find(
      (r) => r.vehicle.id === vehicleId,
    );
    expect(row).toBeTruthy();
    expect(row?.position).toBeTruthy();
  });

  it('detects speeding and raises a driving event + alert', async () => {
    const { token, vehicleId } = await setupVehicle();

    // Pas de maxSpeedKmh sur le véhicule → limite par défaut 90 km/h ; 130 = excès.
    const ingest = await request(app)
      .post('/api/v1/telemetry/ingest')
      .set('Authorization', bearer(token))
      .send({ vehicleId, latitude: 14.72, longitude: -17.46, speedKmh: 130 });
    expect([200, 201]).toContain(ingest.status);

    const events = await request(app)
      .get('/api/v1/events')
      .query({ vehicleId })
      .set('Authorization', bearer(token));
    expect(events.status).toBe(200);
    const types = (events.body.data.data as Array<{ type: string }>).map((e) => e.type);
    expect(types).toContain('SPEEDING');

    const alerts = await request(app)
      .get('/api/v1/alerts')
      .query({ vehicleId })
      .set('Authorization', bearer(token));
    expect(alerts.status).toBe(200);
    expect(alerts.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('rejects ingestion without device key or token', async () => {
    const { vehicleId } = await setupVehicle();
    const r = await request(app)
      .post('/api/v1/telemetry/ingest')
      .send({ vehicleId, latitude: 14.7, longitude: -17.4, speedKmh: 10 });
    expect(r.status).toBe(401);
  });
});
