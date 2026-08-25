import type {
  AlertSeverity,
  AlertStatus,
  EventType,
  FuelRecordType,
  VehicleStatus,
  TripStatus,
  Role,
  GeofenceCategory,
} from '@/types';

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  ACTIVE: 'Actif',
  MAINTENANCE: 'En entretien',
  INACTIVE: 'Inactif',
  RETIRED: 'Réformé',
};

export const tripStatusLabels: Record<TripStatus, string> = {
  ONGOING: 'En cours',
  COMPLETED: 'Terminé',
  INVALID: 'Invalide',
};

export const eventTypeLabels: Record<EventType, string> = {
  HARSH_BRAKING: 'Freinage brusque',
  HARSH_ACCELERATION: 'Accélération brusque',
  HARSH_CORNERING: 'Virage brusque',
  SPEEDING: 'Excès de vitesse',
  EXCESSIVE_IDLING: 'Ralenti excessif',
  FATIGUE_DRIVING: 'Conduite en fatigue',
  PHONE_USE: 'Usage du téléphone',
  NO_SEATBELT: 'Sans ceinture',
};

export const fuelTypeLabels: Record<FuelRecordType, string> = {
  REFUEL: 'Plein',
  CONSUMPTION: 'Consommation',
  THEFT_SUSPECTED: 'Vol suspecté',
  ADJUSTMENT: 'Ajustement',
};

export const alertStatusLabels: Record<AlertStatus, string> = {
  OPEN: 'Ouverte',
  ACKNOWLEDGED: 'Acquittée',
  RESOLVED: 'Résolue',
};

export const geofenceCategoryLabels: Record<GeofenceCategory, string> = {
  DEPOT: 'Dépôt',
  CUSTOMER: 'Client',
  RESTRICTED: 'Zone restreinte',
  SERVICE_AREA: "Zone d'intervention",
  OTHER: 'Autre',
};

export const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrateur',
  FLEET_MANAGER: 'Gestionnaire de flotte',
  DISPATCHER: 'Répartiteur',
  ANALYST: 'Analyste',
  DRIVER: 'Chauffeur',
  VIEWER: 'Observateur',
};

export const severityClasses: Record<AlertSeverity, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export const severityColors: Record<AlertSeverity, string> = {
  LOW: '#64748b',
  MEDIUM: '#d97706',
  HIGH: '#ea580c',
  CRITICAL: '#dc2626',
};

/** Couleur d'un score de conduite (0-100). */
export function scoreColor(score: number): string {
  if (score >= 85) return '#16a34a';
  if (score >= 70) return '#ca8a04';
  if (score >= 50) return '#ea580c';
  return '#dc2626';
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatNumber(value?: number | null, digits = 0): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('fr-FR', { maximumFractionDigits: digits });
}
