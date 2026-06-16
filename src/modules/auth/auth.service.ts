import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { generateTokens, verifyRefreshToken } from '../../shared/utils/jwt';
import { RegisterInput, LoginInput } from './auth.schemas';
import { AuthPayload } from '../../shared/types';

export class AuthService {
  async register(data: RegisterInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      organizationId: string | null;
    };
  }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const error = new Error('A user with this email address already exists');
      Object.assign(error, { statusCode: 409 });
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId: data.organizationId ?? null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
    });

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const tokens = generateTokens(payload);

    return { ...tokens, user };
  }

  async login(data: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      organizationId: string | null;
      organization: { id: string; name: string } | null;
    };
  }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isActive: true,
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      const error = new Error('Invalid email or password');
      Object.assign(error, { statusCode: 401 });
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Your account has been deactivated');
      Object.assign(error, { statusCode: 403 });
      throw error;
    }

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      const error = new Error('Invalid email or password');
      Object.assign(error, { statusCode: 401 });
      throw error;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const tokens = generateTokens(payload);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return { ...tokens, user: userWithoutPassword };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      const error = new Error('User not found or account is inactive');
      Object.assign(error, { statusCode: 401 });
      throw error;
    }

    // `verifyRefreshToken` returns the decoded token, which also carries the
    // JWT registered claims (`iat`, `exp`). Re-signing that object would make
    // `jsonwebtoken` throw ("payload already has an exp property") because
    // `generateTokens` also passes `expiresIn`. Rebuild a clean AuthPayload
    // with only the domain claims before issuing new tokens.
    const newPayload: AuthPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    };

    const tokens = generateTokens(newPayload);
    return { accessToken: tokens.accessToken };
  }

  async getProfile(userId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    organization: {
      id: string;
      name: string;
      sector: string;
      entityType: string;
    } | null;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            sector: true,
            entityType: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error('User not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return user;
  }
}

export default new AuthService();
