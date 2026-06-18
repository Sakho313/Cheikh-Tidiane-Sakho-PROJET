import 'dotenv/config';
import {
  PrismaClient,
  Role,
  Sector,
  EntityType,
  ComplianceStatus,
  IncidentSeverity,
  IncidentStatus,
  RiskCategory,
  RiskStatus,
  AuditType,
  AuditStatus,
  FindingSeverity,
  FindingStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
      'Organizations must implement incident handling procedures covering detection, analysis, containment, eradication, and recovery. This includes processes for classifying incidents and escalating to competent authorities within NIS2 timeframes (24-hour initial report, 72-hour detailed report).',
  },
  {
    article: 'Article 21(2)(c)',
    domain: 'Business Continuity',
    requirement: 'Business continuity and crisis management',
    description:
      'Organizations must implement business continuity measures including backup management, disaster recovery, and crisis management to ensure continuity of critical services during and after incidents.',
  },
  {
    article: 'Article 21(2)(c)',
    domain: 'Business Continuity',
    requirement: 'Backup management and disaster recovery',
    description:
      'Organizations must implement comprehensive backup management procedures including regular backups, backup testing, and disaster recovery plans with defined recovery time objectives (RTO) and recovery point objectives (RPO).',
  },
  {
    article: 'Article 21(2)(d)',
    domain: 'Supply Chain Security',
    requirement: 'Supply chain security and third-party risk management',
    description:
      'Organizations must assess and manage security risks arising from their supply chain, including evaluating security practices of direct suppliers and service providers and establishing contractual security requirements.',
  },
  {
    article: 'Article 21(2)(e)',
    domain: 'Network Security',
    requirement: 'Security in network and information systems acquisition, development, and maintenance',
    description:
      'Organizations must implement security measures throughout the lifecycle of network and information systems, including vulnerability handling, secure development practices, and security testing.',
  },
  {
    article: 'Article 21(2)(f)',
    domain: 'Security Assessment',
    requirement: 'Policies to assess effectiveness of cybersecurity risk-management measures',
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
    requirement: 'Policies and procedures regarding the use of cryptography and encryption',
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
    requirement: 'Vulnerability handling and coordinated disclosure policies',
    description:
      'Organizations must establish processes for identifying, tracking, and remediating vulnerabilities in their network and information systems. This includes patch management, vulnerability scanning, and coordinated vulnerability disclosure.',
  },
];

async function seedControls(): Promise<string[]> {
  console.log('Seeding NIS2 compliance controls...');

  const existing = await prisma.complianceControl.findMany();
  if (existing.length > 0) {
    console.log(`  ${existing.length} controls already exist — skipping`);
    return existing.map((c) => c.id);
  }

  await prisma.complianceControl.createMany({ data: NIS2_CONTROLS });
  const created = await prisma.complianceControl.findMany();
  console.log(`  Created ${created.length} NIS2 Article 21 controls`);
  return created.map((c) => c.id);
}

async function seedOrganization(): Promise<string> {
  console.log('Seeding demo organisation...');

  const existing = await prisma.organization.findFirst({
    where: { contactEmail: 'contact@nexia-infra.fr' },
  });
  if (existing) {
    console.log(`  Organisation "${existing.name}" already exists — skipping`);
    return existing.id;
  }

  const org = await prisma.organization.create({
    data: {
      name: 'Nexia Infrastructure France',
      sector: Sector.DIGITAL_INFRASTRUCTURE,
      entityType: EntityType.ESSENTIAL,
      country: 'France',
      contactEmail: 'contact@nexia-infra.fr',
      contactPhone: '+33 1 44 00 12 34',
      address: '14 Avenue de l'Opéra, 75001 Paris, France',
      website: 'https://nexia-infra.fr',
    },
  });

  console.log(`  Created organisation: ${org.name} (${org.id})`);
  return org.id;
}

async function seedAdminUser(organizationId: string): Promise<string> {
  console.log('Seeding admin user...');

  const existing = await prisma.user.findUnique({ where: { email: 'admin@nis2.example.com' } });
  if (existing) {
    console.log(`  Admin user "${existing.email}" already exists — skipping`);
    return existing.id;
  }

  const password = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@nis2.example.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.ADMIN,
      organizationId,
      isActive: true,
    },
  });

  console.log(`  Created admin user: ${admin.email}`);
  return admin.id;
}

async function seedComplianceOfficer(organizationId: string): Promise<string> {
  console.log('Seeding compliance officer user...');

  const existing = await prisma.user.findUnique({ where: { email: 'officer@nis2.example.com' } });
  if (existing) {
    console.log(`  User "${existing.email}" already exists — skipping`);
    return existing.id;
  }

  const password = process.env.OFFICER_PASSWORD ?? 'Officer@1234';
  const passwordHash = await bcrypt.hash(password, 12);

  const officer = await prisma.user.create({
    data: {
      email: 'officer@nis2.example.com',
      passwordHash,
      firstName: 'Marie',
      lastName: 'Dupont',
      role: Role.COMPLIANCE_OFFICER,
      organizationId,
      isActive: true,
    },
  });

  console.log(`  Created compliance officer: ${officer.email}`);
  return officer.id;
}

async function seedDemoUser(organizationId: string): Promise<void> {
  console.log('Seeding shared demo user...');

  const email = process.env.DEMO_EMAIL || 'demo@sao-nis2.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  Demo user "${existing.email}" already exists — skipping`);
    return;
  }

  const password = process.env.DEMO_PASSWORD || 'Demo2024NIS2!';
  const passwordHash = await bcrypt.hash(password, 12);

  const demo = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Accès',
      lastName: 'Démonstration',
      role: Role.VIEWER,
      organizationId,
      isActive: true,
    },
  });

  console.log(`  Created demo (read-only) user: ${demo.email}`);
}

async function seedComplianceAssessments(
  organizationId: string,
  controlIds: string[],
  officerId: string,
): Promise<void> {
  console.log('Seeding compliance assessments...');

  const existing = await prisma.complianceAssessment.count({ where: { organizationId } });
  if (existing > 0) {
    console.log(`  ${existing} assessments already exist for this org — skipping`);
    return;
  }

  // Realistic mix: 4 COMPLIANT, 4 PARTIAL, 3 NON_COMPLIANT, 1 PENDING
  const statuses: ComplianceStatus[] = [
    ComplianceStatus.COMPLIANT,
    ComplianceStatus.COMPLIANT,
    ComplianceStatus.PARTIAL,
    ComplianceStatus.PARTIAL,
    ComplianceStatus.NON_COMPLIANT,
    ComplianceStatus.PARTIAL,
    ComplianceStatus.NON_COMPLIANT,
    ComplianceStatus.COMPLIANT,
    ComplianceStatus.PARTIAL,
    ComplianceStatus.COMPLIANT,
    ComplianceStatus.PARTIAL,
    ComplianceStatus.NON_COMPLIANT,
  ];

  const notes = [
    'Analyse des risques formalisée selon EBIOS RM. Mise à jour annuelle planifiée.',
    'Procédure de gestion des incidents documentée. Circuit 72h en cours de test.',
    'PCA validé par la direction. Tests de reprise à planifier au T3.',
    'Sauvegardes journalières en place. RPO/RTO définis mais non testés depuis 18 mois.',
    'Registre fournisseurs incomplet. Clauses SSI absentes de la plupart des contrats.',
    'Politique SDLC définie. Tests de sécurité non systématiques sur les projets.',
    "Aucun audit d'efficacité formalisé. Revue ad hoc uniquement.",
    'Plan de sensibilisation annuel en place. Taux de complétion : 78 %.',
    'Politique de chiffrement définie pour les données en transit. Données au repos non couvertes.',
    'Contrôle d'accès basé sur les rôles implémenté. Revue des habilitations annuelle.',
    'MFA déployé sur les acctes à privilèges. Déploiement en cours pour les utilisateurs standard (62%).',
    "Processus de gestion des vulnérabilités défini mais sans SLA formalisé.",
  ];

  const data = controlIds.slice(0, 12).map((controlId, i) => ({
    organizationId,
    controlId,
    status: statuses[i] ?? ComplianceStatus.PENDING,
    notes: notes[i] ?? null,
    assignedToId: officerId,
    dueDate: new Date(Date.now() + (i % 3 === 0 ? 30 : 90) * 24 * 60 * 60 * 1000),
    reviewedAt: statuses[i] === ComplianceStatus.COMPLIANT ? new Date() : null,
  }));

  await prisma.complianceAssessment.createMany({ data });
  console.log(`  Created ${data.length} compliance assessments`);
}

async function seedIncidents(organizationId: string, createdById: string): Promise<void> {
  console.log('Seeding demo incidents...');

  const existing = await prisma.incident.count({ where: { organizationId } });
  if (existing > 0) {
    console.log(`  ${existing} incidents already exist — skipping`);
    return;
  }

  const incidents = [
    {
      organizationId,
      createdById,
      title: 'Tentative de phishing ciblé — comptes dirigeants',
      description:
        "Campagne de spear-phishing détectée ciblant les adresses e-mail des membres du COMEX. 3 utilisateurs ont cliqué sur le lien malveillant. Aucun compte compromis confirmé à ce stade.",
      severity: IncidentSeverity.HIGH,
      status: IncidentStatus.RESOLVED,
      incidentType: 'Phishing / Ingénierie sociale',
      detectedAt: new Date('2026-04-12T08:30:00Z'),
      reportedAt: new Date('2026-04-12T09:15:00Z'),
      resolvedAt: new Date('2026-04-13T17:00:00Z'),
      affectedSystems: ['Messagerie Exchange Online', 'Postes Windows'],
      impactDescription: 'Aucune compromission confirmée. Réinitialisation préventive des mots de passe.',
      reportedToAuthority: true,
      authorityReference: 'ANSSI-2026-PHISH-0412',
      estimatedUsers: 3,
    },
    {
      organizationId,
      createdById,
      title: 'Indisponibilité du service VPN — accès distants bloqués',
      description:
        "Panne du concentrateur VPN principal suite à une mise à jour firmware. Accès distants indisponibles pendant 4h. Bascule sur le concentrateur de secours effectuée manuellement.",
      severity: IncidentSeverity.MEDIUM,
      status: IncidentStatus.CLOSED,
      incidentType: 'Disponibilité / Infrastructure',
      detectedAt: new Date('2026-05-03T06:00:00Z'),
      reportedAt: new Date('2026-05-03T06:20:00Z'),
      resolvedAt: new Date('2026-05-03T10:00:00Z'),
      affectedSystems: ['VPN Palo Alto GlobalProtect', 'Accès distants'],
      impactDescription: '~200 collaborateurs en télétravail bloqués pendant 4h. Aucune perte de données.',
      reportedToAuthority: false,
      estimatedUsers: 200,
    },
    {
      organizationId,
      createdById,
      title: 'Alerte ransomware — exécution bloquée par EDR',
      description:
        "L'EDR a détecté et bloqué l'exécution d'un payload de type ransomware sur un poste utilisateur. Analyse forensique en cours pour déterminer le vecteur d'infection initial.",
      severity: IncidentSeverity.CRITICAL,
      status: IncidentStatus.INVESTIGATING,
      incidentType: 'Malware / Ransomware',
      detectedAt: new Date('2026-06-10T14:22:00Z'),
      reportedAt: new Date('2026-06-10T14:35:00Z'),
      affectedSystems: ['Poste Windows — Finance', 'Active Directory'],
      impactDescription: 'Poste isolé. Analyse en cours. Aucune propagation confirmée.',
      reportedToAuthority: true,
      authorityReference: 'ANSSI-2026-RANSOM-0610',
      estimatedUsers: 1,
    },
  ];

  await prisma.incident.createMany({ data: incidents });
  console.log(`  Created ${incidents.length} demo incidents`);
}

async function seedRisks(organizationId: string, ownerId: string): Promise<void> {
  console.log('Seeding demo risks...');

  const existing = await prisma.risk.count({ where: { organizationId } });
  if (existing > 0) {
    console.log(`  ${existing} risks already exist — skipping`);
    return;
  }

  const risks = [
    {
      organizationId,
      ownerId,
      title: 'Rançongiciel chiffrant le SI de production',
      description: "Un attaquant déploie un ransomware via un email de phishing ou une vulnérabilité VPN. Chiffrement des serveurs de production et des sauvegardes connectées.",
      category: RiskCategory.SOFTWARE,
      likelihood: 3,
      impact: 5,
      riskScore: 15,
      status: RiskStatus.MITIGATING,
      mitigationPlan: "Déploiement EDR sur 100% des postes. Sauvegardes offline testées. Exercice de crise planifié T3 2026.",
      reviewDate: new Date('2026-09-30'),
    },
    {
      organizationId,
      ownerId,
      title: "Compromission de l'Active Directory",
      description: "Escalade de privilèges par un attaquant interne ou externe. Accès aux comptes administrateurs du domaine.",
      category: RiskCategory.NETWORK,
      likelihood: 2,
      impact: 5,
      riskScore: 10,
      status: RiskStatus.MITIGATING,
      mitigationPlan: "MFA sur comptes admin. Tiering AD en cours. Surveillance des connexions privilégiées.",
      reviewDate: new Date('2026-08-15'),
    },
    {
      organizationId,
      ownerId,
      title: 'Indisponibilité majeure du fournisseur cloud',
      description: "Panne prolongée du datacenter hébergeant les applications métier critiques. Durée estimée > 8h.",
      category: RiskCategory.SUPPLY_CHAIN,
      likelihood: 2,
      impact: 4,
      riskScore: 8,
      status: RiskStatus.ASSESSED,
      mitigationPlan: "Clause SLA 99.95% contractualisée. PRA validé mais non testé. Test prévu Q4 2026.",
      reviewDate: new Date('2026-10-01'),
    },
    {
      organizationId,
      ownerId,
      title: 'Fuite de données personnelles clients',
      description: "Exfiltration de données personnelles par un tiers malveillant ou une erreur de configuration (bucket S3 public).",
      category: RiskCategory.DATA,
      likelihood: 2,
      impact: 4,
      riskScore: 8,
      status: RiskStatus.MITIGATING,
      mitigationPlan: "Audit des permissions S3. DLP en cours de déploiement. Notification CNIL testée.",
      reviewDate: new Date('2026-07-31'),
    },
    {
      organizationId,
      ownerId,
      title: "Rupture d'un prestataire d'infogérance critique",
      description: "Défaillance ou cessation d'activité d'un prestataire assurant la gestion des infrastructures réseau.",
      category: RiskCategory.SUPPLY_CHAIN,
      likelihood: 1,
      impact: 4,
      riskScore: 4,
      status: RiskStatus.ACCEPTED,
      mitigationPlan: "Clause de réversibilité contractuelle. Cartographie des alternatives identifiées.",
      reviewDate: new Date('2026-12-31'),
    },
  ];

  await prisma.risk.createMany({ data: risks });
  console.log(`  Created ${risks.length} demo risks`);
}

async function seedAudits(
  organizationId: string,
  auditorId: string,
  controlIds: string[],
): Promise<void> {
  console.log('Seeding demo audits...');

  const existing = await prisma.audit.count({ where: { organizationId } });
  if (existing > 0) {
    console.log(`  ${existing} audits already exist — skipping`);
    return;
  }

  const audit = await prisma.audit.create({
    data: {
      organizationId,
      auditorId,
      title: 'Audit interne NIS2 — Évaluation initiale de maturité',
      type: AuditType.INTERNAL,
      status: AuditStatus.COMPLETED,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-28'),
      scope: "Périmètre : ensemble du SI de production. Référentiel : Article 21 NIS2 + ReCyF ANSSI. Évaluation des 12 mesures de sécurité obligatoires.",
      methodology: "Entretiens avec les responsables métier et techniques. Revue documentaire (PSSI, PCA, procédures). Tests de configuration sur un échantillon de systèmes.",
      summary: "Maturité globale évaluée à 43%. Points forts : gouvernance, sensibilisation, contrôle d'accès. Points d'amélioration majeurs : gestion des fournisseurs, évaluation de l'efficacité, notification des incidents.",
    },
  });

  const findings = [
    {
      auditId: audit.id,
      controlId: controlIds[4], // Supply Chain
      title: "Absence de clauses SSI dans les contrats fournisseurs",
      description: "Sur 24 contrats fournisseurs examinés, aucun ne contient de clauses spécifiques relatives à la sécurité de l'information conformément à l'Article 21(2)(d) NIS2.",
      severity: FindingSeverity.MAJOR,
      status: FindingStatus.IN_REMEDIATION,
      recommendation: "Intégrer des clauses SSI standardisées dans tous les nouveaux contrats et les renouvellements. Prévoir un avenant pour les contrats critiques en cours.",
      dueDate: new Date('2026-09-30'),
    },
    {
      auditId: audit.id,
      controlId: controlIds[6], // Security Assessment
      title: "Absence de processus formel d'évaluation de l'efficacité des mesures",
      description: "Aucun audit d'efficacité des mesures de cybersécurité n'a été réalisé au cours des 24 derniers mois. Exigence Article 21(2)(f) non couverte.",
      severity: FindingSeverity.MAJOR,
      status: FindingStatus.OPEN,
      recommendation: "Planifier un audit d'efficacité annuel. Définir des KPIs de sécurité mesurables et les intégrer dans le tableau de bord RSSI.",
      dueDate: new Date('2026-10-31'),
    },
    {
      auditId: audit.id,
      controlId: controlIds[1], // Incident Handling
      title: "Circuit de notification 72h non testé",
      description: "La procédure de notification aux autorités (ANSSI) dans les délais NIS2 (24h initial, 72h détaillé) n'a pas été testée. Risque de non-conformité en cas d'incident réel.",
      severity: FindingSeverity.MINOR,
      status: FindingStatus.IN_REMEDIATION,
      recommendation: "Organiser un exercice de simulation de notification dans les 3 prochains mois. Documenter les contacts ANSSI et les modèles de rapports.",
      dueDate: new Date('2026-07-31'),
    },
    {
      auditId: audit.id,
      controlId: controlIds[10], // MFA
      title: "Couverture MFA insuffisante — comptes standard non couverts",
      description: "Le MFA est déployé sur les comptes administrateurs (100%) mais seulement 62% des comptes utilisateurs standards disposent du MFA. L'Article 21(2)(j) exige une couverture complète.",
      severity: FindingSeverity.OBSERVATION,
      status: FindingStatus.IN_REMEDIATION,
      recommendation: "Déployer le MFA sur l'ensemble des comptes d'ici fin Q3 2026. Prioriser les accès aux applications métier critiques.",
      dueDate: new Date('2026-09-30'),
    },
  ];

  await prisma.auditFinding.createMany({ data: findings });
  console.log(`  Created audit "${audit.title}" with ${findings.length} findings`);
}

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  SAO Pilotage NIS2 — Database Seeder          ');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  try {
    const controlIds = await seedControls();
    console.log('');

    const organizationId = await seedOrganization();
    console.log('');

    const adminId = await seedAdminUser(organizationId);
    console.log('');

    const officerId = await seedComplianceOfficer(organizationId);
    console.log('');

    await seedDemoUser(organizationId);
    console.log('');

    await seedComplianceAssessments(organizationId, controlIds, officerId);
    console.log('');

    await seedIncidents(organizationId, adminId);
    console.log('');

    await seedRisks(organizationId, officerId);
    console.log('');

    await seedAudits(organizationId, officerId, controlIds);
    console.log('');

    console.log('═══════════════════════════════════════════════');
    console.log('  Seeding complete!');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('  Admin credentials:');
    console.log('    Email   : admin@nis2.example.com');
    console.log(
      process.env.ADMIN_PASSWORD
        ? '    Password: (defined via ADMIN_PASSWORD)'
        : '    Password: Admin@1234',
    );
    console.log('');
    console.log('  Officer credentials:');
    console.log('    Email   : officer@nis2.example.com');
    console.log(
      process.env.OFFICER_PASSWORD
        ? '    Password: (defined via OFFICER_PASSWORD)'
        : '    Password: Officer@1234',
    );
    console.log('');
    console.log('  Demo (read-only) credentials — share with prospects:');
    console.log(`    Email   : ${process.env.DEMO_EMAIL || 'demo@sao-nis2.com'}`);
    console.log(
      process.env.DEMO_PASSWORD
        ? '    Password: (defined via DEMO_PASSWORD)'
        : '    Password: Demo2024NIS2!',
    );
    console.log('');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
