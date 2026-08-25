import { prisma } from '../../../src/config/database';

/**
 * Vide toutes les tables dans l'ordre des clés étrangères (enfants avant
 * parents) pour repartir d'un état déterministe entre chaque test.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.driverScore.deleteMany();
  await prisma.report.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.geofenceEvent.deleteMany();
  await prisma.geofence.deleteMany();
  await prisma.fuelRecord.deleteMany();
  await prisma.drivingEvent.deleteMany();
  await prisma.gpsPosition.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.device.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
