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

// CRITICAL: Fail fast if using default secret in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'change-this-secret-in-production') {
  logger.error('CRITICAL: JWT_SECRET environment variable is not set in production!');
  throw new Error('JWT_SECRET environment variable must be set in production. Cannot start with insecure default.');
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

  // ============================================
  // TOKEN REVOCATION / BLACKLIST
  // ============================================
  // In-memory storage for development. In production, use Redis.
  // Tokens are stored with their JTI or hash and auto-expire

  private revokedTokens: Map<string, number> = new Map();
  private revokedUsers: Map<string, number> = new Map();

  /**
   * Revoke a specific token (add to blacklist)
   * Called when user logs out
   *
   * @param token - The JWT token to revoke
   */
  revokeToken(token: string): void {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        logger.warn('Cannot revoke token: invalid or missing expiry');
        return;
      }

      const expiryMs = decoded.exp * 1000;
      const now = Date.now();

      // Only store if token hasn't already expired
      if (expiryMs > now) {
        // Use a hash of the token for storage efficiency
        const tokenHash = this.hashToken(token);
        this.revokedTokens.set(tokenHash, expiryMs);

        // Schedule cleanup when token naturally expires
        const ttl = expiryMs - now;
        setTimeout(() => {
          this.revokedTokens.delete(tokenHash);
        }, ttl);

        logger.info(`Token revoked for user: ${decoded.userId}, expires in ${Math.floor(ttl / 1000)}s`);
      }
    } catch (error) {
      logger.error('Failed to revoke token:', error);
    }
  }

  /**
   * Revoke all tokens for a user
   * Called on password change, account compromise, or admin action
   *
   * @param userId - The user ID whose tokens should be revoked
   * @param expiresInMs - How long to keep the revocation active (default: 30 days)
   */
  revokeAllUserTokens(userId: string, expiresInMs: number = 30 * 24 * 60 * 60 * 1000): void {
    const expiryTime = Date.now() + expiresInMs;
    this.revokedUsers.set(userId, expiryTime);

    // Schedule cleanup
    setTimeout(() => {
      this.revokedUsers.delete(userId);
    }, expiresInMs);

    logger.info(`All tokens revoked for user: ${userId}`);
  }

  /**
   * Check if a token has been revoked
   *
   * @param token - The JWT token to check
   * @returns true if revoked, false otherwise
   */
  isTokenRevoked(token: string): boolean {
    try {
      // Check token-level revocation
      const tokenHash = this.hashToken(token);
      if (this.revokedTokens.has(tokenHash)) {
        const expiryMs = this.revokedTokens.get(tokenHash)!;
        if (Date.now() < expiryMs) {
          return true;
        }
        // Clean up expired entry
        this.revokedTokens.delete(tokenHash);
      }

      // Check user-level revocation
      const decoded = this.decodeToken(token);
      if (decoded) {
        const userRevocationTime = this.revokedUsers.get(decoded.userId);
        if (userRevocationTime) {
          // Token issued before revocation time is invalid
          const tokenIssuedAt = (decoded.iat || 0) * 1000;
          if (tokenIssuedAt < userRevocationTime - (30 * 24 * 60 * 60 * 1000)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking token revocation:', error);
      return false; // Fail open for availability, but log the error
    }
  }

  /**
   * Simple hash function for token storage
   * Uses first and last portions plus length for uniqueness
   */
  private hashToken(token: string): string {
    // Use a simple but effective hash: prefix + suffix + length
    const prefix = token.substring(0, 20);
    const suffix = token.substring(token.length - 20);
    return `${prefix}...${suffix}:${token.length}`;
  }

  /**
   * Get revocation stats (for monitoring)
   */
  getRevocationStats() {
    return {
      revokedTokens: this.revokedTokens.size,
      revokedUsers: this.revokedUsers.size
    };
  }
}

// Singleton instance
export const jwtService = new JWTService();
