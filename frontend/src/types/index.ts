// ─── Enums (mirror of the Prisma backend) ──────────────────────────────────

export type Role = 'ADMIN' | 'COMPLIANCE_OFFICER' | 'AUDITOR' | 'VIEWER';

export type Sector =
  | 'ENERGY'
  | 'TRANSPORT'
  | 'BANKING'
  | 'FINANCIAL_MARKETS'
  | 'HEALTH'
  | 'DRINKING_WATER'
  | 'WASTEWATER'
  | 'DIGITAL_INFRASTRUCTURE'
  | 'ICT_SERVICE'
  | 'PUBLIC_ADMIN'
  | 'SPACE'
  | 'POSTAL'
  | 'WASTE_MANAGEMENT'
  | 'CHEMICAL'
  | 'FOOD'
  | 'MANUFACTURING'
  | 'DIGITAL_PROVIDERS'
  | 'RESEARCH';

export type EntityType = 'ESSENTIAL' | 'IMPORTANT';

export type ComplianceStatus =
  | 'COMPLIANT'
  | 'PARTIAL'
  | 'NON_COMPLIANT'
  | 'NOT_APPLICABLE'
  | 'PENDING';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'DRAFT'
  | 'DETECTED'
  | 'REPORTED_INITIAL'
  | 'INVESTIGATING'
  | 'REPORTED_FINAL'
  | 'RESOLVED'
  | 'CLOSED';

export type RiskCategory =
  | 'NETWORK'
  | 'SUPPLY_CHAIN'
  | 'HUMAN'
  | 'PHYSICAL'
  | 'SOFTWARE'
  | 'HARDWARE'
  | 'DATA'
  | 'LEGAL'
  | 'OPERATIONAL';

export type RiskStatus =
  | 'IDENTIFIED'
  | 'ASSESSED'
  | 'MITIGATING'
  | 'MITIGATED'
  | 'ACCEPTED'
  | 'CLOSED';

export type AuditType = 'INTERNAL' | 'EXTERNAL' | 'REGULATORY' | 'SUPPLIER';

export type AuditStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type FindingSeverity = 'OBSERVATION' | 'MINOR' | 'MAJOR' | 'CRITICAL';

export type FindingStatus =
  | 'OPEN'
  | 'IN_REMEDIATION'
  | 'REMEDIATED'
  | 'ACCEPTED'
  | 'CLOSED';

export type ReportType = 'COMPLIANCE' | 'INCIDENT' | 'RISK' | 'AUDIT' | 'EXECUTIVE';

// ─── API envelope ───────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Domain entities ─────────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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
  organization?: {
    id: string;
    name: string;
    sector?: Sector;
    entityType?: EntityType;
  } | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface OrganizationCounts {
  users: number;
  incidents: number;
  risks: number;
  audits: number;
  complianceAssessments?: number;
}

export interface Organization {
  id: string;
  name: string;
  sector: Sector;
  entityType: EntityType;
  country: string;
  contactEmail: string;
  contactPhone?: string | null;
  address?: string | null;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: OrganizationCounts;
}

export interface ComplianceControl {
  id: string;
  article: string;
  domain: string;
  requirement: string;
  description: string;
  isActive: boolean;
}

export interface ComplianceAssessment {
  id: string;
  organizationId: string;
  controlId: string;
  status: ComplianceStatus;
  evidence?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
  dueDate?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  control?: ComplianceControl;
  assignedTo?: UserSummary | null;
}

export interface Incident {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  incidentType: string;
  detectedAt: string;
  reportedAt?: string | null;
  resolvedAt?: string | null;
  affectedSystems: string[];
  impactDescription?: string | null;
  reportedToAuthority: boolean;
  authorityReference?: string | null;
  estimatedUsers?: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary;
  organization?: { id: string; name: string };
}

export interface Risk {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  category: RiskCategory;
  likelihood: number;
  impact: number;
  riskScore: number;
  status: RiskStatus;
  mitigationPlan?: string | null;
  ownerId?: string | null;
  reviewDate?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: UserSummary | null;
  organization?: { id: string; name: string };
}

export interface AuditFinding {
  id: string;
  auditId: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  controlId?: string | null;
  recommendation?: string | null;
  dueDate?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  control?: {
    id: string;
    article: string;
    domain: string;
    requirement: string;
  } | null;
}

export interface Audit {
  id: string;
  organizationId: string;
  title: string;
  type: AuditType;
  status: AuditStatus;
  startDate: string;
  endDate?: string | null;
  auditorId?: string | null;
  scope?: string | null;
  methodology?: string | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
  auditor?: UserSummary | null;
  findings?: AuditFinding[];
  _count?: { findings: number };
}

export interface Report {
  id: string;
  organizationId: string;
  type: ReportType;
  title: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  generatedById: string;
  data: unknown;
  createdAt: string;
  generatedBy?: UserSummary;
}

// ─── Aggregate / analytics shapes ──────────────────────────────────────────

export interface DomainScore {
  compliant: number;
  total: number;
  score: number;
}

export interface ComplianceScore {
  overallScore: number;
  totalControls: number;
  applicableControls: number;
  compliantControls: number;
  domainScores: Record<string, DomainScore>;
  statusBreakdown: Record<string, number>;
}

export interface IncidentStats {
  total: number;
  bySeverity: Array<{ severity: IncidentSeverity; count: number }>;
  byStatus: Array<{ status: IncidentStatus; count: number }>;
  totalUnreported: number;
  recentIncidents: Array<{
    id: string;
    title: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    detectedAt: string;
  }>;
}

export interface RiskStats {
  total: number;
  byCategory: Array<{ category: RiskCategory; count: number; avgScore: number }>;
  byStatus: Array<{ status: RiskStatus; count: number }>;
  topRisks: Array<{
    id: string;
    title: string;
    riskScore: number;
    likelihood: number;
    impact: number;
    category: RiskCategory;
    status: RiskStatus;
  }>;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskMatrixCell {
  likelihood: number;
  impact: number;
  riskScore: number;
  count: number;
  risks: Array<{
    id: string;
    title: string;
    status: RiskStatus;
    category: RiskCategory;
  }>;
  level: RiskLevel;
}

export interface RiskMatrix {
  matrix: RiskMatrixCell[][];
  byCategory: Array<{ category: RiskCategory; count: number; avgScore: number }>;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface AuditStats {
  total: number;
  byType: Array<{ type: AuditType; count: number }>;
  byStatus: Array<{ status: AuditStatus; count: number }>;
  findings: {
    bySeverity: Array<{ severity: FindingSeverity; count: number }>;
  };
  recentAudits: Array<{
    id: string;
    title: string;
    type: AuditType;
    status: AuditStatus;
    startDate: string;
  }>;
}

export interface OrganizationStats {
  incidents: {
    total: number;
    bySeverity: Array<{ severity: IncidentSeverity; count: number }>;
  };
  risks: {
    total: number;
    byStatus: Array<{ status: RiskStatus; count: number }>;
  };
  audits: {
    total: number;
    byStatus: Array<{ status: AuditStatus; count: number }>;
  };
  compliance: {
    totalAssessments: number;
    compliantCount: number;
    complianceScore: number;
  };
}

// ─── Request payloads ──────────────────────────────────────────────────────

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

export interface OrganizationPayload {
  name: string;
  sector: Sector;
  entityType: EntityType;
  country: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  website?: string;
}

export interface AssessmentPayload {
  organizationId: string;
  controlId: string;
  status: ComplianceStatus;
  evidence?: string;
  notes?: string;
  assignedToId?: string;
  dueDate?: string;
}

export interface IncidentPayload {
  organizationId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status?: IncidentStatus;
  incidentType: string;
  detectedAt: string;
  affectedSystems: string[];
  impactDescription?: string;
  estimatedUsers?: number;
}

export interface RiskPayload {
  organizationId: string;
  title: string;
  description: string;
  category: RiskCategory;
  likelihood: number;
  impact: number;
  status?: RiskStatus;
  mitigationPlan?: string;
}

export interface AuditPayload {
  organizationId: string;
  title: string;
  type: AuditType;
  status?: AuditStatus;
  startDate: string;
  endDate?: string;
  scope?: string;
  methodology?: string;
  summary?: string;
}

export interface FindingPayload {
  title: string;
  description: string;
  severity: FindingSeverity;
  status?: FindingStatus;
  controlId?: string;
  recommendation?: string;
  dueDate?: string;
}

export interface GenerateReportPayload {
  organizationId: string;
  type: ReportType;
  periodStart?: string;
  periodEnd?: string;
}
