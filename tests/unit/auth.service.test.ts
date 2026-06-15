import { AuthService } from '../../src/modules/auth/auth.service';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock JWT utilities
jest.mock('../../src/shared/utils/jwt', () => ({
  generateTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

import { prisma } from '../../src/config/database';
import bcrypt from 'bcryptjs';
import { generateTokens, verifyRefreshToken } from '../../src/shared/utils/jwt';

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockGenerateTokens = generateTokens as jest.MockedFunction<typeof generateTokens>;
const mockVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>;

const USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const ORG_ID = 'b2c3d4e5-f6a7-8901-bcde-f01234567891';
const ACCESS_TOKEN = 'mock.access.token';
const REFRESH_TOKEN = 'mock.refresh.token';

const mockTokens = { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN };

const mockUserRow = {
  id: USER_ID,
  email: 'alice@example.com',
  passwordHash: '$2a$12$hashedpassword',
  firstName: 'Alice',
  lastName: 'Dupont',
  role: 'ADMIN' as const,
  organizationId: ORG_ID,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  organization: { id: ORG_ID, name: 'Acme Corp' },
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
    mockGenerateTokens.mockReturnValue(mockTokens);
  });

  // ─── register() ────────────────────────────────────────────────────────────

  describe('register()', () => {
    const registerInput = {
      email: 'alice@example.com',
      password: 'Password123!',
      firstName: 'Alice',
      lastName: 'Dupont',
      organizationId: ORG_ID,
    };

    const createdUser = {
      id: USER_ID,
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Dupont',
      role: 'ADMIN' as const,
      organizationId: ORG_ID,
    };

    it('should hash the password and create a user, then return tokens and user', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashedpassword');
      mockPrismaUser.create.mockResolvedValue(createdUser as never);

      const result = await service.register(registerInput);

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: registerInput.email },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(registerInput.password, 12);
      expect(mockPrismaUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: registerInput.email,
            passwordHash: '$2a$12$hashedpassword',
            firstName: registerInput.firstName,
            lastName: registerInput.lastName,
          }),
        }),
      );
      expect(mockGenerateTokens).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          email: 'alice@example.com',
        }),
      );
      expect(result).toEqual({
        accessToken: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN,
        user: createdUser,
      });
    });

    it('should throw 409 error if email is already taken', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUserRow as never);

      await expect(service.register(registerInput)).rejects.toMatchObject({
        message: 'A user with this email address already exists',
        statusCode: 409,
      });

      expect(mockPrismaUser.create).not.toHaveBeenCalled();
    });
  });

  // ─── login() ───────────────────────────────────────────────────────────────

  describe('login()', () => {
    const loginInput = {
      email: 'alice@example.com',
      password: 'Password123!',
    };

    it('should return tokens and user profile on valid credentials', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUserRow as never);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaUser.update.mockResolvedValue(mockUserRow as never);

      const result = await service.login(loginInput);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        loginInput.password,
        mockUserRow.passwordHash,
      );
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
      expect(result.accessToken).toBe(ACCESS_TOKEN);
      expect(result.refreshToken).toBe(REFRESH_TOKEN);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe('alice@example.com');
      expect(result.user.organization).toEqual({ id: ORG_ID, name: 'Acme Corp' });
    });

    it('should throw 401 error if user does not exist', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.login(loginInput)).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401,
      });

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw 401 error if password is incorrect', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(mockUserRow as never);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginInput)).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401,
      });

      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });

    it('should throw 403 error if account is deactivated', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        ...mockUserRow,
        isActive: false,
      } as never);

      await expect(service.login(loginInput)).rejects.toMatchObject({
        message: 'Your account has been deactivated',
        statusCode: 403,
      });
    });
  });

  // ─── refresh() ─────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    const refreshPayload = {
      userId: USER_ID,
      email: 'alice@example.com',
      role: 'ADMIN' as const,
      organizationId: ORG_ID,
    };

    it('should return a new access token when refresh token is valid', async () => {
      mockVerifyRefreshToken.mockReturnValue(refreshPayload);
      mockPrismaUser.findUnique.mockResolvedValue({
        id: USER_ID,
        isActive: true,
      } as never);

      const result = await service.refresh(REFRESH_TOKEN);

      expect(mockVerifyRefreshToken).toHaveBeenCalledWith(REFRESH_TOKEN);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: { id: true, isActive: true },
      });
      expect(result).toEqual({ accessToken: ACCESS_TOKEN });
    });

    it('should throw 401 error if user is not found', async () => {
      mockVerifyRefreshToken.mockReturnValue(refreshPayload);
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.refresh(REFRESH_TOKEN)).rejects.toMatchObject({
        message: 'User not found or account is inactive',
        statusCode: 401,
      });
    });

    it('should throw 401 error if account is inactive', async () => {
      mockVerifyRefreshToken.mockReturnValue(refreshPayload);
      mockPrismaUser.findUnique.mockResolvedValue({
        id: USER_ID,
        isActive: false,
      } as never);

      await expect(service.refresh(REFRESH_TOKEN)).rejects.toMatchObject({
        message: 'User not found or account is inactive',
        statusCode: 401,
      });
    });
  });

  // ─── getProfile() ──────────────────────────────────────────────────────────

  describe('getProfile()', () => {
    const profileRow = {
      id: USER_ID,
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Dupont',
      role: 'ADMIN' as const,
      organizationId: ORG_ID,
      isActive: true,
      lastLoginAt: new Date('2024-06-01T08:00:00Z'),
      createdAt: new Date('2024-01-15T10:00:00Z'),
      organization: {
        id: ORG_ID,
        name: 'Acme Corp',
        sector: 'ENERGY',
        entityType: 'ESSENTIAL',
      },
    };

    it('should return the full user profile with organisation', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(profileRow as never);

      const result = await service.getProfile(USER_ID);

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: expect.objectContaining({
          id: true,
          email: true,
          organization: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              sector: true,
              entityType: true,
            }),
          }),
        }),
      });
      expect(result).toEqual(profileRow);
      expect(result.organization?.sector).toBe('ENERGY');
    });

    it('should throw 404 error if user is not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-id')).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
      });
    });
  });
});
