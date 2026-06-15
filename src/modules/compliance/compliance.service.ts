import { prisma } from '../../config/database';
import { ComplianceStatus } from '@prisma/client';
import { UpsertAssessmentInput, UpdateAssessmentInput } from './compliance.schemas';

const NIS2_CONTROLS = [
  {
    article: 'Article 21(2)(a)',
    domain: 'Risk Management',
    requirement: 'Risk analysis and information system security policies',
    description:
      'Organizations must establish and maintain policies on risk analysis and information system security. This includes identifying assets, threats, vulnerabilities, and implementing appropriate security measures proportionate to the risks.',
  },
  {
    article: 'Article 21(2)(b)',
    domain: 'Incident Handling',
    requirement: 'Incident handling procedures',
    description:
      'Organizations must implement incident handling procedures covering detection, analysis, containment, eradication, and recovery. This includes processes for classifying incidents and escalating to competent authorities within NIS2 timeframes.',
  },
  {
    article: 'Article 21(2)(c)',
    domain: 'Business Continuity',
    requirement: 'Business continuity and crisis management',
    description:
      'Organizations must implement business continuity measures including backup management, disaster recovery, and crisis management to ensure continuity of critical services during and after incidents.',
  },
  {
    article: 'Article 21(2)(d)',
    domain: 'Supply Chain Security',
    requirement:
      'Supply chain security including security aspects of relationships with direct suppliers and service providers',
    description:
      'Organizations must assess and manage security risks arising from their supply chain, including evaluating security practices of direct suppliers and service providers and establishing contractual security requirements.',
  },
  {
    article: 'Article 21(2)(e)',
    domain: 'Network Security',
    requirement:
      'Security in network and information systems acquisition, development, and maintenance',
    description:
      'Organizations must implement security measures throughout the lifecycle of network and information systems, including vulnerability handling, secure development practices, and security testing.',
  },
  {
    article: 'Article 21(2)(f)',
    domain: 'Security Assessment',
    requirement:
      'Policies and procedures to assess the effectiveness of cybersecurity risk-management measures',
    description:
      'Organizations must establish processes to regularly assess the effectiveness of their security measures, including security audits, penetration testing, and continuous monitoring of the security posture.',
  },
  {
    article: 'Article 21(2)(g)',
    domain: 'Security Awareness',
    requirement: 'Basic cyber hygiene practices and cybersecurity training',
    description:
      'Organizations must implement basic cybersecurity hygiene practices and provide regular cybersecurity training to their staff, covering phishing awareness, password management, and safe computing practices.',
  },
  {
    article: 'Article 21(2)(h)',
    domain: 'Cryptography',
    requirement:
      'Policies and procedures regarding the use of cryptography and, where appropriate, encryption',
    description:
      'Organizations must establish policies for the use of cryptography including encryption of data at rest and in transit, key management procedures, and appropriate cryptographic standards aligned with current best practices.',
  },
  {
    article: 'Article 21(2)(i)',
    domain: 'Access Control',
    requirement: 'Human resources security, access control policies, and asset management',
    description:
      'Organizations must implement human resources security measures and access control policies based on the principle of least privilege, including user lifecycle management, privilege access management, and asset inventory.',
  },
  {
    article: 'Article 21(2)(j)',
    domain: 'Multi-Factor Authentication',
    requirement: 'Use of multi-factor authentication or continuous authentication solutions',
    description:
      'Organizations must implement multi-factor authentication (MFA) or continuous authentication solutions for access to network and information systems, particularly for privileged accounts and remote access.',
  },
  {
    article: 'Article 21(2)(j)',
    domain: 'Vulnerability Management',
    requirement: 'Vulnerability handling and disclosure policies',
    description:
      'Organizations must establish processes for identifying, tracking, and remediating vulnerabilities in their network and information systems. This includes patch management, vulnerability scanning, and coordinated vulnerability disclosure.',
  },
  {
    article: 'Article 21(2)(c)',
    domain: 'Business Continuity',
    requirement: 'Backup management and disaster recovery',
    description:
      'Organizations must implement comprehensive backup management procedures including regular backups, backup testing, and disaster recovery plans with defined recovery time objectives (RTO) and recovery point objectives (RPO).',
  },
];

export class ComplianceService {
  async getAllControls() {
    return prisma.complianceControl.findMany({
      where: { isActive: true },
      orderBy: [{ domain: 'asc' }, { article: 'asc' }],
    });
  }

  async getAssessments(orgId: string, filters?: { domain?: string; status?: ComplianceStatus }) {
    const where: Record<string, unknown> = { organizationId: orgId };

    if (filters?.status) {
      where['status'] = filters.status;
    }

    if (filters?.domain) {
      where['control'] = { domain: filters.domain };
    }

    return prisma.complianceAssessment.findMany({
      where,
      include: {
        control: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsertAssessment(data: UpsertAssessmentInput) {
    const existing = await prisma.complianceAssessment.findUnique({
      where: {
        organizationId_controlId: {
          organizationId: data.organizationId,
          controlId: data.controlId,
        },
      },
    });

    const reviewedAt =
      data.status === ComplianceStatus.COMPLIANT || data.status === ComplianceStatus.NOT_APPLICABLE
        ? new Date()
        : (existing?.reviewedAt ?? undefined);

    return prisma.complianceAssessment.upsert({
      where: {
        organizationId_controlId: {
          organizationId: data.organizationId,
          controlId: data.controlId,
        },
      },
      create: {
        organizationId: data.organizationId,
        controlId: data.controlId,
        status: data.status,
        evidence: data.evidence,
        notes: data.notes,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate,
        reviewedAt,
      },
      update: {
        status: data.status,
        evidence: data.evidence,
        notes: data.notes,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate,
        reviewedAt,
      },
      include: {
        control: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async updateAssessmentById(id: string, data: UpdateAssessmentInput) {
    const existing = await prisma.complianceAssessment.findUnique({
      where: { id },
    });

    if (!existing) {
      const error = new Error('Assessment not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    const reviewedAt =
      data.status === ComplianceStatus.COMPLIANT || data.status === ComplianceStatus.NOT_APPLICABLE
        ? new Date()
        : (existing.reviewedAt ?? undefined);

    return prisma.complianceAssessment.update({
      where: { id },
      data: {
        ...data,
        reviewedAt,
      },
      include: {
        control: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async getComplianceScore(orgId: string) {
    const assessments = await prisma.complianceAssessment.findMany({
      where: { organizationId: orgId },
      include: { control: { select: { domain: true } } },
    });

    const controls = await prisma.complianceControl.findMany({
      where: { isActive: true },
      select: { domain: true },
    });

    const domains = [...new Set(controls.map((c) => c.domain))];

    const domainScores: Record<string, { compliant: number; total: number; score: number }> = {};

    for (const domain of domains) {
      const domainAssessments = assessments.filter((a) => a.control.domain === domain);
      const applicable = domainAssessments.filter(
        (a) => a.status !== ComplianceStatus.NOT_APPLICABLE,
      );
      const compliant = applicable.filter((a) => a.status === ComplianceStatus.COMPLIANT);

      domainScores[domain] = {
        compliant: compliant.length,
        total: applicable.length,
        score: applicable.length > 0 ? Math.round((compliant.length / applicable.length) * 100) : 0,
      };
    }

    const allApplicable = assessments.filter((a) => a.status !== ComplianceStatus.NOT_APPLICABLE);
    const allCompliant = allApplicable.filter((a) => a.status === ComplianceStatus.COMPLIANT);
    const overallScore =
      allApplicable.length > 0 ? Math.round((allCompliant.length / allApplicable.length) * 100) : 0;

    const statusBreakdown: Record<string, number> = {};
    for (const status of Object.values(ComplianceStatus)) {
      statusBreakdown[status] = assessments.filter((a) => a.status === status).length;
    }

    return {
      overallScore,
      totalControls: assessments.length,
      applicableControls: allApplicable.length,
      compliantControls: allCompliant.length,
      domainScores,
      statusBreakdown,
    };
  }

  async seedControls(): Promise<void> {
    const existing = await prisma.complianceControl.count();
    if (existing > 0) {
      return;
    }

    await prisma.complianceControl.createMany({
      data: NIS2_CONTROLS,
    });
  }
}

export default new ComplianceService();
