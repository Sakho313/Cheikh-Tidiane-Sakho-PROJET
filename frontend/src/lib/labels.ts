import type {
  AuditStatus,
  AuditType,
  ComplianceStatus,
  EntityType,
  FindingSeverity,
  FindingStatus,
  IncidentSeverity,
  IncidentStatus,
  ReportType,
  RiskCategory,
  RiskLevel,
  RiskStatus,
  Role,
  Sector,
} from '@/types';

export type BadgeTone = 'green' | 'orange' | 'red' | 'gray' | 'blue' | 'yellow';

// ─── French labels ──────────────────────────────────────────────────────────

export const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrateur',
  COMPLIANCE_OFFICER: 'Responsable conformité',
  AUDITOR: 'Auditeur',
  VIEWER: 'Lecteur',
};

export const sectorLabels: Record<Sector, string> = {
  ENERGY: 'Énergie',
  TRANSPORT: 'Transport',
  BANKING: 'Banque',
  FINANCIAL_MARKETS: 'Marchés financiers',
  HEALTH: 'Santé',
  DRINKING_WATER: 'Eau potable',
  WASTEWATER: 'Eaux usées',
  DIGITAL_INFRASTRUCTURE: 'Infrastructure numérique',
  ICT_SERVICE: 'Services TIC',
  PUBLIC_ADMIN: 'Administration publique',
  SPACE: 'Espace',
  POSTAL: 'Services postaux',
  WASTE_MANAGEMENT: 'Gestion des déchets',
  CHEMICAL: 'Chimie',
  FOOD: 'Alimentation',
  MANUFACTURING: 'Industrie manufacturière',
  DIGITAL_PROVIDERS: 'Fournisseurs numériques',
  RESEARCH: 'Recherche',
};

export const entityTypeLabels: Record<EntityType, string> = {
  ESSENTIAL: 'Essentielle',
  IMPORTANT: 'Importante',
};

export const complianceStatusLabels: Record<ComplianceStatus, string> = {
  COMPLIANT: 'Conforme',
  PARTIAL: 'Partiel',
  NON_COMPLIANT: 'Non conforme',
  NOT_APPLICABLE: 'Non applicable',
  PENDING: 'En attente',
};

export const incidentSeverityLabels: Record<IncidentSeverity, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Élevée',
  CRITICAL: 'Critique',
};

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  DRAFT: 'Brouillon',
  DETECTED: 'Détecté',
  REPORTED_INITIAL: 'Notification initiale',
  INVESTIGATING: 'Investigation',
  REPORTED_FINAL: 'Rapport final',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
};

export const riskCategoryLabels: Record<RiskCategory, string> = {
  NETWORK: 'Réseau',
  SUPPLY_CHAIN: "Chaîne d'approvisionnement",
  HUMAN: 'Humain',
  PHYSICAL: 'Physique',
  SOFTWARE: 'Logiciel',
  HARDWARE: 'Matériel',
  DATA: 'Données',
  LEGAL: 'Juridique',
  OPERATIONAL: 'Opérationnel',
};

export const riskStatusLabels: Record<RiskStatus, string> = {
  IDENTIFIED: 'Identifié',
  ASSESSED: 'Évalué',
  MITIGATING: 'Traitement en cours',
  MITIGATED: 'Traité',
  ACCEPTED: 'Accepté',
  CLOSED: 'Clôturé',
};

export const riskLevelLabels: Record<RiskLevel, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
  CRITICAL: 'Critique',
};

export const auditTypeLabels: Record<AuditType, string> = {
  INTERNAL: 'Interne',
  EXTERNAL: 'Externe',
  REGULATORY: 'Réglementaire',
  SUPPLIER: 'Fournisseur',
};

export const auditStatusLabels: Record<AuditStatus, string> = {
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

export const findingSeverityLabels: Record<FindingSeverity, string> = {
  OBSERVATION: 'Observation',
  MINOR: 'Mineure',
  MAJOR: 'Majeure',
  CRITICAL: 'Critique',
};

export const findingStatusLabels: Record<FindingStatus, string> = {
  OPEN: 'Ouverte',
  IN_REMEDIATION: 'En remédiation',
  REMEDIATED: 'Remédiée',
  ACCEPTED: 'Acceptée',
  CLOSED: 'Clôturée',
};

export const reportTypeLabels: Record<ReportType, string> = {
  COMPLIANCE: 'Conformité',
  INCIDENT: 'Incidents',
  RISK: 'Risques',
  AUDIT: 'Audits',
  EXECUTIVE: 'Synthèse exécutive',
};

// ─── Status -> badge tone maps ──────────────────────────────────────────────

export const complianceStatusTone: Record<ComplianceStatus, BadgeTone> = {
  COMPLIANT: 'green',
  PARTIAL: 'orange',
  NON_COMPLIANT: 'red',
  NOT_APPLICABLE: 'gray',
  PENDING: 'yellow',
};

export const incidentSeverityTone: Record<IncidentSeverity, BadgeTone> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const incidentStatusTone: Record<IncidentStatus, BadgeTone> = {
  DRAFT: 'gray',
  DETECTED: 'yellow',
  REPORTED_INITIAL: 'orange',
  INVESTIGATING: 'blue',
  REPORTED_FINAL: 'orange',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

export const riskStatusTone: Record<RiskStatus, BadgeTone> = {
  IDENTIFIED: 'yellow',
  ASSESSED: 'blue',
  MITIGATING: 'orange',
  MITIGATED: 'green',
  ACCEPTED: 'gray',
  CLOSED: 'gray',
};

export const riskLevelTone: Record<RiskLevel, BadgeTone> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export const auditStatusTone: Record<AuditStatus, BadgeTone> = {
  PLANNED: 'blue',
  IN_PROGRESS: 'orange',
  COMPLETED: 'green',
  CANCELLED: 'gray',
};

export const findingSeverityTone: Record<FindingSeverity, BadgeTone> = {
  OBSERVATION: 'gray',
  MINOR: 'yellow',
  MAJOR: 'orange',
  CRITICAL: 'red',
};

// ─── Formatting helpers ─────────────────────────────────────────────────────

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
