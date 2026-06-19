import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from './db';
import { generateTokens } from '../../../src/shared/utils/jwt';

export async function createOrg(name = 'Test Fleet') {
  return prisma.organization.create({
    data: { name, contactEmail: 'fleet@test.local' },
  });
}

/**
 * Crée un utilisateur du rôle demandé (ADMIN par défaut) rattaché à
 * l'organisation, et renvoie un access token signé prêt à l'emploi.
 */
export async function createUserWithToken(organizationId: string | null, role: Role = Role.ADMIN) {
  const email = `user-${crypto.randomUUID()}@test.local`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('Passw0rd!', 4),
      firstName: 'Test',
      lastName: 'User',
      role,
      organizationId,
    },
  });
  const { accessToken } = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  });
  return { user, token: accessToken };
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}
