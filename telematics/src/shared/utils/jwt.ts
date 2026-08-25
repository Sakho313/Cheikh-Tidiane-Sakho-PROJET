import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthPayload } from '../types';

export function generateTokens(payload: AuthPayload): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  return decoded as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return decoded as AuthPayload;
}
