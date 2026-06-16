import 'dotenv/config';
import { PrismaClient, Role, Sector, EntityType } from '@prisma/client';
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

async function seedControls(): Promise<void> {
  console.log('Seeding NIS2 compliance controls...');

  const existing = await prisma.complianceControl.count();

  if (existing > 0) {
    console.log(`  ${existing} controls already exist — skipping`);
    return;
  }

  await prisma.complianceControl.createMany({
    data: NIS2_CONTROLS,
  });

  console.log(`  Created ${NIS2_CONTROLS.length} NIS2 Article 21 controls`);
}

async function seedOrganization(): Promise<string> {
  console.log('Seeding example organization...');

  const existing = await prisma.organization.findFirst({
    where: { contactEmail: 'contact@nis2-example.eu' },
  });

  if (existing) {
    console.log(`  Organization "${existing.name}" already exists — skipping`);
    return existing.id;
  }

  const org = await prisma.organization.create({
    data: {
      name: 'NIS2 Example Organization',
      sector: Sector.DIGITAL_INFRASTRUCTURE,
      entityType: EntityType.ESSENTIAL,
      country: 'France',
      contactEmail: 'contact@nis2-example.eu',
      contactPhone: '+33 1 23 45 67 89',
      address: '1 Place du Général de Gaulle, 75001 Paris, France',
      website: 'https://nis2-example.eu',
    },
  });

  console.log(`  Created organization: ${org.name} (${org.id})`);
  return org.id;
}

async function seedAdminUser(organizationId: string): Promise<void> {
  console.log('Seeding admin user...');

  const existing = await prisma.user.findUnique({
    where: { email: 'admin@nis2.example.com' },
  });

  if (existing) {
    console.log(`  Admin user "${existing.email}" already exists — skipping`);
    return;
  }

  // Password comes from ADMIN_PASSWORD so the default demo account is never
  // exposed online; falls back to the demo password only for local dev.
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
  console.log(
    process.env.ADMIN_PASSWORD
      ? '    Password: (defined via ADMIN_PASSWORD)'
      : '    Password: Admin@1234',
  );
}

async function seedComplianceOfficer(organizationId: string): Promise<void> {
  console.log('Seeding compliance officer user...');

  const existing = await prisma.user.findUnique({
    where: { email: 'officer@nis2.example.com' },
  });

  if (existing) {
    console.log(`  User "${existing.email}" already exists — skipping`);
    return;
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
  console.log(
    process.env.OFFICER_PASSWORD
      ? '    Password: (defined via OFFICER_PASSWORD)'
      : '    Password: Officer@1234',
  );
}

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  NIS2 Compliance Platform — Database Seeder   ');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  try {
    await seedControls();
    console.log('');

    const organizationId = await seedOrganization();
    console.log('');

    await seedAdminUser(organizationId);
    console.log('');

    await seedComplianceOfficer(organizationId);
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
