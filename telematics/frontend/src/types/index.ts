// ─── Enums (mirror of the Prisma telematics backend) ────────────────────────

export type Role = 'ADMIN' | 'FLEET_MANAGER' | 'DISPATCHER' | 'ANALYST' | 'DRIVER' | 'VIEWER';

export type FuelType = 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'HYBRID' | 'LPG' | 'CNG';

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'RETIRED';

export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'FAULTY';

export type DriverStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export type TripStatus = 'ONGOING' | 'COMPLETED' | 'INVALID';

export type EventType =
  | 'HARSH_BRAKING'
  | 'HARSH_ACCELERATION'
  | 'HARSH_CORNERING'
  | 'SPEEDING'
  | 'EXCESSIVE_IDLING'
  | 'FATIGUE_DRIVING'
  | 'PHONE_USE'
  | 'NO_SEATBELT';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FuelRecordType = 'REFUEL' | 'CONSUMPTION' | 'THEFT_SUSPECTED' | 'ADJUSTMENT';

export type GeofenceType = 'CIRCLE' | 'POLYGON';

export type GeofenceCategory = 'DEPOT' | 'CUSTOMER' | 'RESTRICTED' | 'SERVICE_AREA' | 'OTHER';

export type GeofenceEventType = 'ENTER' | 'EXIT';

export type AlertType =
  | 'SPEEDING'
  | 'GEOFENCE_VIOLATION'
  | 'HARSH_DRIVING'
  | 'FUEL_THEFT'
  | 'FUEL_DROP'
  | 'MAINTENANCE_DUE'
  | 'DEVICE_OFFLINE'
  | 'IDLE'
  | 'SOS';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type MaintenanceType = 'OIL_CHANGE' | 'TIRE' | 'BRAKES' | 'INSPECTION' | 'REPAIR' | 'OTHER';

export type MaintenanceStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED';

export type ReportType =
  | 'DRIVER_BEHAVIOR'
  | 'FUEL'
  | 'FLEET_UTILIZATION'
  | 'TRIP'
  | 'SAFETY'
  | 'MAINTENANCE'
  | 'EXECUTIVE';

// ─── API envelope ───────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface OrganizationRef {
  id: string;
  name: string;
  country?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  organization?: OrganizationRef | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Domain entities ─────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  organizationId: string;
  plate: string;
  make: string;
  model: string;
  year?: number | null;
  vin?: string | null;
  color?: string | null;
  fuelType: FuelType;
  tankCapacityL?: number | null;
  avgConsumptionL100?: number | null;
  odometerKm: number;
  maxSpeedKmh?: number | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
  device?: Device | null;
}

export interface VehicleStats {
  tripCount: number;
  totalDistanceKm: number;
  totalFuelL: number;
  eventCount: number;
  openAlerts: number;
}

export interface Device {
  id: string;
  organizationId: string;
  serialNumber: string;
  model?: string | null;
  simNumber?: string | null;
  firmwareVersion?: string | null;
  vehicleId?: string | null;
  status: DeviceStatus;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: Pick<Vehicle, 'id' | 'plate'> | null;
}

export interface Driver {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseCategory?: string | null;
  licenseExpiry?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  hireDate?: string | null;
  userId?: string | null;
  status: DriverStatus;
  behaviorScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverStats {
  tripCount: number;
  totalDistanceKm: number;
  behaviorScore: number;
  eventsByType: Array<{ type: EventType; count: number }>;
  recentTrips?: Trip[];
}

export interface Trip {
  id: string;
  organizationId: string;
  vehicleId: string;
  driverId?: string | null;
  startTime: string;
  endTime?: string | null;
  startLat?: number | null;
  startLng?: number | null;
  endLat?: number | null;
  endLng?: number | null;
  startAddress?: string | null;
  endAddress?: string | null;
  distanceKm: number;
  durationS: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  idleTimeS: number;
  fuelConsumedL?: number | null;
  harshEvents: number;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'make' | 'model'> | null;
  driver?: Pick<Driver, 'id' | 'firstName' | 'lastName'> | null;
  positions?: GpsPosition[];
}

export interface GpsPosition {
  id: string;
  organizationId: string;
  vehicleId: string;
  tripId?: string | null;
  deviceId?: string | null;
  timestamp: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading?: number | null;
  altitude?: number | null;
  accuracy?: number | null;
  ignition?: boolean | null;
  fuelLevelL?: number | null;
  odometerKm?: number | null;
  satellites?: number | null;
  createdAt: string;
}

/** Live position payload emitted over Socket.IO (`vehicle:position`). */
export interface LivePosition {
  vehicleId: string;
  tripId?: string | null;
  timestamp: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading?: number | null;
  ignition?: boolean | null;
}

/** One row of GET /telemetry/live. */
export interface LiveVehicle {
  vehicle: Pick<Vehicle, 'id' | 'plate' | 'make' | 'model' | 'status'>;
  position: GpsPosition | null;
}

export interface DrivingEvent {
  id: string;
  organizationId: string;
  vehicleId: string;
  driverId?: string | null;
  tripId?: string | null;
  type: EventType;
  severity: EventSeverity;
  timestamp: string;
  latitude?: number | null;
  longitude?: number | null;
  speedKmh?: number | null;
  speedLimitKmh?: number | null;
  value?: number | null;
  penaltyPoints: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  vehicle?: Pick<Vehicle, 'id' | 'plate'> | null;
  driver?: Pick<Driver, 'id' | 'firstName' | 'lastName'> | null;
}

export interface EventStats {
  total: number;
  byType: Array<{ type: EventType; count: number }>;
  bySeverity: Array<{ severity: EventSeverity; count: number }>;
}

export interface FuelRecord {
  id: string;
  organizationId: string;
  vehicleId: string;
  driverId?: string | null;
  type: FuelRecordType;
  timestamp: string;
  liters: number;
  pricePerLiter?: number | null;
  totalCost?: number | null;
  currency: string;
  odometerKm?: number | null;
  fuelLevelBeforeL?: number | null;
  fuelLevelAfterL?: number | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  stationName?: string | null;
  isFullTank: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: Pick<Vehicle, 'id' | 'plate'> | null;
  driver?: Pick<Driver, 'id' | 'firstName' | 'lastName'> | null;
}

export interface FuelStats {
  totalLiters: number;
  totalCost: number;
  byType: Array<{ type: FuelRecordType; liters: number; cost: number }>;
  byVehicle: Array<{ vehicleId: string; liters: number; cost: number }>;
}

export interface FuelEfficiency {
  series: Array<{
    from: string;
    to: string;
    distanceKm: number;
    liters: number;
    l100: number;
  }>;
  averageL100: number | null;
  referenceL100: number | null;
}

export interface FuelTheftSuspicion {
  vehicleId: string;
  timestamp: string;
  dropLiters: number;
  latitude: number | null;
  longitude: number | null;
  type: 'LEVEL_DROP' | 'FLAGGED_RECORD';
}

export interface Geofence {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  type: GeofenceType;
  category: GeofenceCategory;
  centerLat?: number | null;
  centerLng?: number | null;
  radiusM?: number | null;
  /** Array of [lng, lat] tuples for polygon zones. */
  polygon?: Array<[number, number]> | null;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  organizationId: string;
  vehicleId?: string | null;
  driverId?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timestamp: string;
  acknowledgedAt?: string | null;
  acknowledgedById?: string | null;
  resolvedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: Pick<Vehicle, 'id' | 'plate'> | null;
  driver?: Pick<Driver, 'id' | 'firstName' | 'lastName'> | null;
}

export interface Report {
  id: string;
  organizationId: string;
  type: ReportType;
  title: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  generatedById?: string | null;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface DriverScore {
  id: string;
  organizationId: string;
  driverId: string;
  periodStart: string;
  periodEnd: string;
  score: number;
  distanceKm: number;
  tripCount: number;
  harshBraking: number;
  harshAcceleration: number;
  harshCornering: number;
  speedingCount: number;
  idlingCount: number;
  createdAt: string;
  driver?: Pick<Driver, 'id' | 'firstName' | 'lastName'> | null;
}

// ─── Analytics dashboard ──────────────────────────────────────────────────────

export interface DashboardSummary {
  vehicles: { total: number; byStatus: Partial<Record<VehicleStatus, number>> };
  activeTrips: number;
  alerts: { open: number; bySeverity: Partial<Record<AlertSeverity, number>> };
  distanceTodayKm: number;
  fuelCostThisMonth: number;
  avgDriverScore: number;
  harshEventsToday: number;
}

export interface DriverRanking {
  driverId: string;
  firstName: string;
  lastName: string;
  status: DriverStatus;
  score: number;
  distanceKm: number;
  tripCount: number;
  eventBreakdown: Record<EventType, number>;
}

export interface DriverScoresResponse {
  from: string;
  to: string;
  drivers: DriverRanking[];
}
