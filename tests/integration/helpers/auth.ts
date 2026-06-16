import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../../../src/app';
import { prisma } from '../../../src/config/database';

export interface SeededUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

let userCounter = 0;

/**
 * Registers a new user via the public endpoint, optionally elevates its role
 * directly in the database (register always creates a VIEWER), then logs in
 * again so the returned access token carries the up-to-date role claim.
 */
export async function createUser(
  role: Role = Role.VIEWER,
  overrides: Partial<{ email: string; password: string; organizationId: string }> = {},
): Promise<SeededUser> {
  userCounter += 1;
  const email = overrides.email ?? `user${userCounter}.${Date.now()}@nis2.test`;
  const password = overrides.password ?? 'Str0ng@Pass1';

  const registerBody: Record<string, unknown> = {
    email,
    password,
    firstName: 'Test',
    lastName: 'User',
  };
  if (overrides.organizationId) {
    registerBody.organizationId = overrides.organizationId;
  }

  const registerRes = await request(app).post('/api/v1/auth/register').send(registerBody);

  const userId: string = registerRes.body.data.user.id;

  if (role !== Role.VIEWER) {
    await prisma.user.update({ where: { id: userId }, data: { role } });
  }

  // Re-login so the JWT reflects the (possibly elevated) role.
  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password });

  return {
    id: userId,
    email,
    accessToken: loginRes.body.data.accessToken,
    refreshToken: loginRes.body.data.refreshToken,
  };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
