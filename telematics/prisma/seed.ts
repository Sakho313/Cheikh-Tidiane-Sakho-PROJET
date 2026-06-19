/**
 * Seed idempotent de la plateforme télématique.
 *
 * Crée une organisation de démonstration, des comptes (admin/manager/analyste),
 * un parc de véhicules + boîtiers GPS, des chauffeurs, des géofences, puis —
 * si aucune position n'existe encore — un trajet de démonstration complet
 * (positions GPS, événements de conduite, pleins de carburant, alertes).
 *
 * Lancement : `npm run seed`
 */
import { PrismaClient, Role, FuelType, VehicleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_ORG_ID = '00000000-0000-4000-a000-000000000001';
const DEPOT = { lat: 14.7167, lng: -17.4677 }; // Dakar

/** Distance Haversine (km) — inline pour éviter toute dépendance de chemin. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function main(): Promise<void> {
  console.info('🌱 Seed télématique…');

  // ─── Organisation ───────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    update: {},
    create: {
      id: DEMO_ORG_ID,
      name: 'SAO Transport & Logistique',
      contactEmail: 'contact@sao-transport.sn',
      contactPhone: '+221 33 800 00 00',
      country: 'Sénégal',
      timezone: 'Africa/Dakar',
      address: 'Zone industrielle, Dakar',
    },
  });

  // ─── Utilisateurs ─────────────────────────────────────────────────────────--
  const adminPassword = process.env['ADMIN_PASSWORD'] ?? 'Admin@1234';
  const users: Array<{ email: string; firstName: string; lastName: string; role: Role; pwd: string }> =
    [
      { email: 'admin@telematics.example.com', firstName: 'Admin', lastName: 'SAO', role: Role.ADMIN, pwd: adminPassword },
      { email: 'manager@telematics.example.com', firstName: 'Awa', lastName: 'Diop', role: Role.FLEET_MANAGER, pwd: 'Manager@1234' },
      { email: 'analyste@telematics.example.com', firstName: 'Mamadou', lastName: 'Fall', role: Role.ANALYST, pwd: 'Analyst@1234' },
    ];
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.pwd, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, organizationId: org.id },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        organizationId: org.id,
      },
    });
  }

  // ─── Véhicules + boîtiers ─────────────────────────────────────────────────--
  const vehicleSpecs = [
    { plate: 'DK-1234-AA', make: 'Toyota', model: 'Hilux', fuelType: FuelType.DIESEL, tankCapacityL: 80, avgConsumptionL100: 9.5, maxSpeedKmh: 100 },
    { plate: 'DK-5678-BB', make: 'Renault', model: 'Master', fuelType: FuelType.DIESEL, tankCapacityL: 100, avgConsumptionL100: 11, maxSpeedKmh: 90 },
    { plate: 'DK-9012-CC', make: 'Mercedes', model: 'Sprinter', fuelType: FuelType.DIESEL, tankCapacityL: 75, avgConsumptionL100: 10.5, maxSpeedKmh: 110 },
    { plate: 'DK-3456-DD', make: 'Hyundai', model: 'H1', fuelType: FuelType.GASOLINE, tankCapacityL: 65, avgConsumptionL100: 12, maxSpeedKmh: 120 },
  ];
  const vehicles = [];
  for (let i = 0; i < vehicleSpecs.length; i++) {
    const s = vehicleSpecs[i]!;
    const vehicle = await prisma.vehicle.upsert({
      where: { organizationId_plate: { organizationId: org.id, plate: s.plate } },
      update: {},
      create: {
        organizationId: org.id,
        plate: s.plate,
        make: s.make,
        model: s.model,
        year: 2021,
        fuelType: s.fuelType,
        tankCapacityL: s.tankCapacityL,
        avgConsumptionL100: s.avgConsumptionL100,
        maxSpeedKmh: s.maxSpeedKmh,
        odometerKm: 50000 + i * 12000,
        status: VehicleStatus.ACTIVE,
      },
    });
    vehicles.push(vehicle);
    await prisma.device.upsert({
      where: { serialNumber: `GPS-${1000 + i}` },
      update: { vehicleId: vehicle.id },
      create: {
        organizationId: org.id,
        serialNumber: `GPS-${1000 + i}`,
        model: 'Teltonika FMB920',
        simNumber: `+2217700000${i}`,
        vehicleId: vehicle.id,
      },
    });
  }

  // ─── Chauffeurs ───────────────────────────────────────────────────────────--
  const driverSpecs = [
    { firstName: 'Cheikh', lastName: 'Ndiaye', licenseNumber: 'SN-DRV-0001', score: 92 },
    { firstName: 'Fatou', lastName: 'Sarr', licenseNumber: 'SN-DRV-0002', score: 78 },
    { firstName: 'Ibrahima', lastName: 'Ba', licenseNumber: 'SN-DRV-0003', score: 64 },
    { firstName: 'Aïssatou', lastName: 'Sow', licenseNumber: 'SN-DRV-0004', score: 88 },
  ];
  const drivers = [];
  for (const d of driverSpecs) {
    const driver = await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: { behaviorScore: d.score },
      create: {
        organizationId: org.id,
        firstName: d.firstName,
        lastName: d.lastName,
        licenseNumber: d.licenseNumber,
        licenseCategory: 'C',
        phone: '+221 77 000 00 00',
        behaviorScore: d.score,
      },
    });
    drivers.push(driver);
  }

  // ─── Géofences ────────────────────────────────────────────────────────────--
  await prisma.geofence.upsert({
    where: { id: '00000000-0000-4000-a000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-4000-a000-000000000010',
      organizationId: org.id,
      name: 'Dépôt principal',
      type: 'CIRCLE',
      category: 'DEPOT',
      centerLat: DEPOT.lat,
      centerLng: DEPOT.lng,
      radiusM: 300,
      color: '#16a34a',
    },
  });
  await prisma.geofence.upsert({
    where: { id: '00000000-0000-4000-a000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-4000-a000-000000000011',
      organizationId: org.id,
      name: 'Zone portuaire (restreinte)',
      type: 'CIRCLE',
      category: 'RESTRICTED',
      centerLat: 14.6845,
      centerLng: -17.428,
      radiusM: 500,
      color: '#dc2626',
    },
  });

  // ─── Télémétrie de démonstration (créée une seule fois) ──────────────────────
  const existingPositions = await prisma.gpsPosition.count({ where: { organizationId: org.id } });
  if (existingPositions === 0) {
    const vehicle = vehicles[0]!;
    const driver = drivers[0]!;
    const start = new Date(Date.now() - 2 * 60 * 60 * 1000); // il y a 2 h

    const trip = await prisma.trip.create({
      data: {
        organizationId: org.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        startTime: start,
        startLat: DEPOT.lat,
        startLng: DEPOT.lng,
        status: 'ONGOING',
      },
    });

    // Trace simple vers l'est depuis le dépôt (~20 points).
    const points: Array<{ lat: number; lng: number; speed: number; t: Date }> = [];
    let lat = DEPOT.lat;
    let lng = DEPOT.lng;
    for (let i = 0; i < 20; i++) {
      lng += 0.004;
      lat += 0.0008 * Math.sin(i / 3);
      const speed = 30 + Math.round(40 * Math.abs(Math.sin(i / 2))); // 30–70 km/h
      points.push({ lat, lng, speed, t: new Date(start.getTime() + i * 90 * 1000) });
    }

    let distanceKm = 0;
    let maxSpeed = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!;
      if (i > 0) {
        const prev = points[i - 1]!;
        distanceKm += haversineKm(prev.lat, prev.lng, p.lat, p.lng);
      }
      maxSpeed = Math.max(maxSpeed, p.speed);
      await prisma.gpsPosition.create({
        data: {
          organizationId: org.id,
          vehicleId: vehicle.id,
          tripId: trip.id,
          timestamp: p.t,
          latitude: p.lat,
          longitude: p.lng,
          speedKmh: p.speed,
          ignition: true,
          fuelLevelL: 70 - i * 0.6,
        },
      });
    }

    // Quelques événements de conduite.
    const mid = points[10]!;
    await prisma.drivingEvent.create({
      data: {
        organizationId: org.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        tripId: trip.id,
        type: 'SPEEDING',
        severity: 'HIGH',
        timestamp: mid.t,
        latitude: mid.lat,
        longitude: mid.lng,
        speedKmh: 105,
        speedLimitKmh: 90,
        value: 15,
        penaltyPoints: 3,
      },
    });
    await prisma.drivingEvent.create({
      data: {
        organizationId: org.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        tripId: trip.id,
        type: 'HARSH_BRAKING',
        severity: 'MEDIUM',
        timestamp: points[15]!.t,
        latitude: points[15]!.lat,
        longitude: points[15]!.lng,
        value: -4.2,
        penaltyPoints: 3,
      },
    });

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        distanceKm: Math.round(distanceKm * 10) / 10,
        maxSpeedKmh: maxSpeed,
        avgSpeedKmh: 48,
        durationS: 20 * 90,
        harshEvents: 2,
        status: 'COMPLETED',
        endTime: points[points.length - 1]!.t,
        endLat: points[points.length - 1]!.lat,
        endLng: points[points.length - 1]!.lng,
      },
    });

    // Pleins de carburant.
    await prisma.fuelRecord.create({
      data: {
        organizationId: org.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        type: 'REFUEL',
        timestamp: new Date(start.getTime() - 7 * 24 * 3600 * 1000),
        liters: 60,
        pricePerLiter: 990,
        totalCost: 59400,
        currency: 'XOF',
        odometerKm: vehicle.odometerKm - 800,
        stationName: 'Total Liberté 6',
      },
    });
    await prisma.fuelRecord.create({
      data: {
        organizationId: org.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        type: 'REFUEL',
        timestamp: new Date(start.getTime() - 2 * 24 * 3600 * 1000),
        liters: 55,
        pricePerLiter: 990,
        totalCost: 54450,
        currency: 'XOF',
        odometerKm: vehicle.odometerKm - 100,
        stationName: 'Shell VDN',
      },
    });

    // Alertes.
    await prisma.alert.create({
      data: {
        organizationId: org.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        type: 'SPEEDING',
        severity: 'HIGH',
        status: 'OPEN',
        title: 'Excès de vitesse détecté',
        message: '105 km/h sur une zone limitée à 90 km/h',
        latitude: mid.lat,
        longitude: mid.lng,
        timestamp: mid.t,
      },
    });

    console.info('   ✔ Trajet de démonstration + télémétrie créés');
  }

  console.info('✅ Seed terminé.');
  console.info(`   Admin : admin@telematics.example.com / ${adminPassword === 'Admin@1234' ? 'Admin@1234' : '(ADMIN_PASSWORD)'}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
