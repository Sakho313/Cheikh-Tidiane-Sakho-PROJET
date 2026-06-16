// Mock the env module BEFORE importing jwt.ts (jwt.ts reads secrets from `../../config/env`).
// We must NOT load a real `.env` — provide deterministic test secrets here.
jest.mock('../../src/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-at-least-32-chars-long-xx',
    JWT_REFRESH_SECRET: 'test-refresh-secret-32-chars-long-xx',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

import jwt from 'jsonwebtoken';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../../src/shared/utils/jwt';
import { AuthPayload } from '../../src/shared/types';

const payload: AuthPayload = {
  userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'alice@example.com',
  role: 'ADMIN',
  organizationId: 'b2c3d4e5-f6a7-8901-bcde-f01234567891',
};

describe('jwt utilities', () => {
  // ─── generateTokens() ──────────────────────────────────────────────────────

  describe('generateTokens()', () => {
    it('should return both an access token and a refresh token', () => {
      const tokens = generateTokens(payload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken.length).toBeGreaterThan(0);
      expect(tokens.refreshToken.length).toBeGreaterThan(0);
    });

    it('should produce distinct access and refresh tokens (signed with different secrets)', () => {
      const tokens = generateTokens(payload);
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });
  });

  // ─── verifyAccessToken() (round-trip) ────────────────────────────────────────

  describe('verifyAccessToken()', () => {
    it('should verify a freshly generated access token and return the original payload', () => {
      const { accessToken } = generateTokens(payload);

      const decoded = verifyAccessToken(accessToken);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.organizationId).toBe(payload.organizationId);
    });

    it('should throw on a malformed / invalid token', () => {
      expect(() => verifyAccessToken('not.a.valid.token')).toThrow();
    });

    it('should throw when verifying an access token signed with the wrong secret', () => {
      // A refresh token is signed with JWT_REFRESH_SECRET, so verifying it as an
      // access token (JWT_SECRET) must fail with an invalid-signature error.
      const { refreshToken } = generateTokens(payload);
      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });

    it('should throw on an expired access token', () => {
      const expiredToken = jwt.sign(payload, 'test-secret-at-least-32-chars-long-xx', {
        expiresIn: '-1s',
      });
      expect(() => verifyAccessToken(expiredToken)).toThrow();
    });
  });

  // ─── verifyRefreshToken() (round-trip) ───────────────────────────────────────

  describe('verifyRefreshToken()', () => {
    it('should verify a freshly generated refresh token and return the original payload', () => {
      const { refreshToken } = generateTokens(payload);

      const decoded = verifyRefreshToken(refreshToken);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.organizationId).toBe(payload.organizationId);
    });

    it('should throw on a malformed / invalid token', () => {
      expect(() => verifyRefreshToken('garbage-token')).toThrow();
    });

    it('should throw when verifying a refresh token signed with the wrong secret', () => {
      const { accessToken } = generateTokens(payload);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });

    it('should throw on an expired refresh token', () => {
      const expiredToken = jwt.sign(payload, 'test-refresh-secret-32-chars-long-xx', {
        expiresIn: '-1s',
      });
      expect(() => verifyRefreshToken(expiredToken)).toThrow();
    });
  });
});
