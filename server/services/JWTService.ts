/**
 * JWT Service - Token-based Authentication
 *
 * Provides JWT token generation, verification, and refresh capabilities.
 * Improves scalability by eliminating server-side session storage.
 */

import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('JWTService');

// Configuration from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const JWT_ISSUER = 'ils-platform';
const JWT_AUDIENCE = 'ils-api';

// Warn if using default secret in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'change-this-secret-in-production') {
  logger.warn('⚠️  Using default JWT_SECRET in production! Please set a secure secret.');
}

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  permissions: string[];
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Token pair (access + refresh)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT Service for token-based authentication
 */
export class JWTService {
  /**
   * Generate an access token
   *
   * @param payload - Token payload (user info)
   * @returns JWT access token
   */
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): string {
    try {
      const tokenPayload: JWTPayload = {
        ...payload,
        type: 'access'
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });

      logger.debug(`Generated access token for user: ${payload.userId}`);
      return token;

    } catch (error) {
      logger.error('Failed to generate access token:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate a refresh token
   *
   * @param payload - Token payload (user info)
   * @returns JWT refresh token
   */
  generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): string {
    try {
      const tokenPayload: JWTPayload = {
        ...payload,
        type: 'refresh'
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });

      logger.debug(`Generated refresh token for user: ${payload.userId}`);
      return token;

    } catch (error) {
      logger.error('Failed to generate refresh token:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate both access and refresh tokens
   *
   * @param payload - Token payload (user info)
   * @returns Token pair with expiry info
   */
  generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Calculate expiry time in seconds
    const expiresIn = this.parseExpiry(JWT_EXPIRES_IN);

    logger.info(`Generated token pair for user: ${payload.userId}`);

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  /**
   * Verify and decode a JWT token
   *
   * @param token - JWT token string
   * @returns Decoded payload
   * @throws Error if token is invalid or expired
   */
  verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      }) as JWTPayload;

      logger.debug(`Verified token for user: ${payload.userId}`);
      return payload;

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Token expired');
        throw new Error('TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid token');
        throw new Error('TOKEN_INVALID');
      } else if (error instanceof jwt.NotBeforeError) {
        logger.debug('Token not yet valid');
        throw new Error('TOKEN_NOT_YET_VALID');
      }

      logger.error('Token verification failed:', error);
      throw new Error('TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Refresh an access token using a refresh token
   *
   * @param refreshToken - Valid refresh token
   * @returns New token pair
   * @throws Error if refresh token is invalid
   */
  refreshTokens(refreshToken: string): TokenPair {
    try {
      // Verify the refresh token
      const payload = this.verifyToken(refreshToken);

      // Ensure it's actually a refresh token
      if (payload.type !== 'refresh') {
        throw new Error('TOKEN_INVALID');
      }

      // Remove iat, exp, and type from payload
      const { iat, exp, type, ...tokenData } = payload;

      // Generate new token pair
      const newTokens = this.generateTokenPair(tokenData);

      logger.info(`Refreshed tokens for user: ${payload.userId}`);
      return newTokens;

    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging)
   *
   * @param token - JWT token string
   * @returns Decoded payload or null
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      logger.error('Token decode failed:', error);
      return null;
    }
  }

  /**
   * Check if a token is expired without throwing
   *
   * @param token - JWT token string
   * @returns true if expired, false otherwise
   */
  isTokenExpired(token: string): boolean {
    try {
      this.verifyToken(token);
      return false;
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        return true;
      }
      return false;
    }
  }

  /**
   * Get token expiry time
   *
   * @param token - JWT token string
   * @returns Expiry time as Date or null
   */
  getTokenExpiry(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  }

  /**
   * Parse expiry string to seconds
   * Supports formats like: '7d', '24h', '60m', '3600s', '3600'
   *
   * @param expiry - Expiry string
   * @returns Expiry time in seconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([dhms]?)$/);
    if (!match) {
      return 604800; // Default to 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || 's';

    switch (unit) {
      case 'd': return value * 86400;
      case 'h': return value * 3600;
      case 'm': return value * 60;
      case 's': return value;
      default: return value;
    }
  }

  /**
   * Get JWT configuration info
   */
  getConfig() {
    return {
      expiresIn: JWT_EXPIRES_IN,
      refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      secretConfigured: JWT_SECRET !== 'change-this-secret-in-production'
    };
  }
}

// Singleton instance
export const jwtService = new JWTService();
