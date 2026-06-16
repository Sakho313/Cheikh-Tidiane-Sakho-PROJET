import { prisma } from '../../../src/config/database';

/**
 * Empties every table in the correct foreign-key order so that integration
 * tests start from a clean, deterministic state. Children are deleted before
 * their parents to satisfy referential integrity:
 *
 *   audit_findings  -> audits
 *   compliance_assessments / reports / incidents / risks -> organizations
 *   compliance_controls (referenced by assessments & findings)
 *   users -> organizations
 *   organizations (root)
 */
export async function resetDatabase(): Promise<void> {
  await prisma.auditFinding.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.complianceAssessment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.complianceControl.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
