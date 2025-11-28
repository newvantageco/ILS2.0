/**
 * NHS Digital API Authentication Service
 * 
 * Implements NHS Digital's signed JWT authentication pattern for application-restricted APIs.
 * Reference: https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/application-restricted-restful-apis-signed-jwt-authentication
 * 
 * Features:
 * - RS512 signed JWT generation
 * - OAuth 2.0 token exchange (client credentials flow)
 * - Token caching and refresh
 * - Multiple environment support (sandbox, integration, production)
 * - Key rotation support
 */

import crypto from 'crypto';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('nhs-api-auth');

// NHS API environments
export const NHS_API_ENVIRONMENTS = {
  sandbox: {
    baseUrl: 'https://sandbox.api.service.nhs.uk',
    tokenUrl: 'https://sandbox.api.service.nhs.uk/oauth2/token',
    audienceUrl: 'https://sandbox.api.service.nhs.uk/oauth2/token',
  },
  integration: {
    baseUrl: 'https://int.api.service.nhs.uk',
    tokenUrl: 'https://int.api.service.nhs.uk/oauth2/token',
    audienceUrl: 'https://int.api.service.nhs.uk/oauth2/token',
  },
  production: {
    baseUrl: 'https://api.service.nhs.uk',
    tokenUrl: 'https://api.service.nhs.uk/oauth2/token',
    audienceUrl: 'https://api.service.nhs.uk/oauth2/token',
  },
} as const;

export type NhsEnvironment = keyof typeof NHS_API_ENVIRONMENTS;

interface NhsApiCredentials {
  apiKey: string;           // Client ID from NHS API Platform
  privateKey: string;       // RSA private key (PEM format)
  keyId: string;           // Key ID (kid) for key selection
  environment: NhsEnvironment;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
}

interface JwtHeader {
  alg: 'RS512';
  typ: 'JWT';
  kid: string;
}

interface JwtPayload {
  iss: string;
  sub: string;
  aud: string;
  jti: string;
  exp: number;
}

/**
 * NHS API Authentication Service
 * Handles JWT generation and OAuth 2.0 token exchange for NHS Digital APIs
 */
export class NhsApiAuthService {
  private tokenCache: Map<string, CachedToken> = new Map();
  private credentials: NhsApiCredentials | null = null;

  constructor() {
    this.loadCredentialsFromEnv();
  }

  /**
   * Load NHS API credentials from environment variables
   */
  private loadCredentialsFromEnv(): void {
    const apiKey = process.env.NHS_API_KEY;
    const privateKey = process.env.NHS_PRIVATE_KEY;
    const keyId = process.env.NHS_KEY_ID || 'ils-key-1';
    const environment = (process.env.NHS_API_ENVIRONMENT || 'sandbox') as NhsEnvironment;

    if (apiKey && privateKey) {
      this.credentials = {
        apiKey,
        privateKey: this.normalizePrivateKey(privateKey),
        keyId,
        environment,
      };
      logger.info({ environment, keyId }, 'NHS API credentials loaded');
    } else {
      logger.warn('NHS API credentials not configured - some features will be unavailable');
    }
  }

  /**
   * Normalize private key (handle escaped newlines from env vars)
   */
  private normalizePrivateKey(key: string): string {
    // Replace literal \n with actual newlines
    return key.replace(/\\n/g, '\n');
  }

  /**
   * Set credentials programmatically (for testing or per-company configs)
   */
  setCredentials(credentials: NhsApiCredentials): void {
    this.credentials = {
      ...credentials,
      privateKey: this.normalizePrivateKey(credentials.privateKey),
    };
    // Clear token cache when credentials change
    this.tokenCache.clear();
  }

  /**
   * Get current environment configuration
   */
  getEnvironmentConfig(): typeof NHS_API_ENVIRONMENTS[NhsEnvironment] {
    const env = this.credentials?.environment || 'sandbox';
    return NHS_API_ENVIRONMENTS[env];
  }

  /**
   * Generate a signed JWT for NHS API authentication
   * 
   * JWT Structure:
   * - Header: { alg: "RS512", typ: "JWT", kid: "<key-id>" }
   * - Payload: { iss, sub, aud, jti, exp }
   * - Signature: RS512 signed with private key
   */
  generateSignedJwt(): string {
    if (!this.credentials) {
      throw new Error('NHS API credentials not configured');
    }

    const envConfig = this.getEnvironmentConfig();
    const now = Math.floor(Date.now() / 1000);

    // JWT Header
    const header: JwtHeader = {
      alg: 'RS512',
      typ: 'JWT',
      kid: this.credentials.keyId,
    };

    // JWT Payload
    const payload: JwtPayload = {
      iss: this.credentials.apiKey,
      sub: this.credentials.apiKey,
      aud: envConfig.audienceUrl,
      jti: crypto.randomUUID(),
      exp: now + 300, // 5 minutes from now
    };

    // Base64URL encode header and payload
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

    // Create signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const sign = crypto.createSign('RSA-SHA512');
    sign.update(signatureInput);
    const signature = sign.sign(this.credentials.privateKey, 'base64url');

    // Assemble JWT
    const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;

    logger.debug({ jti: payload.jti, exp: payload.exp }, 'Generated signed JWT for NHS API');

    return jwt;
  }

  /**
   * Base64URL encoding (URL-safe base64 without padding)
   */
  private base64UrlEncode(data: string): string {
    return Buffer.from(data)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Exchange signed JWT for an access token
   * 
   * POST to /oauth2/token with:
   * - grant_type: client_credentials
   * - client_assertion_type: urn:ietf:params:oauth:client-assertion-type:jwt-bearer
   * - client_assertion: <signed JWT>
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    if (!this.credentials) {
      throw new Error('NHS API credentials not configured');
    }

    const cacheKey = `${this.credentials.apiKey}:${this.credentials.environment}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.tokenCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now() + 60000) { // 1 minute buffer
        logger.debug('Using cached NHS API access token');
        return cached.accessToken;
      }
    }

    // Generate new signed JWT
    const signedJwt = this.generateSignedJwt();
    const envConfig = this.getEnvironmentConfig();

    // Exchange JWT for access token
    const response = await fetch(envConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: signedJwt,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ 
        status: response.status, 
        error: errorBody 
      }, 'NHS API token exchange failed');
      throw new Error(`NHS API token exchange failed: ${response.status} - ${errorBody}`);
    }

    const tokenResponse = await response.json() as {
      access_token: string;
      expires_in: string | number;
      token_type: string;
    };

    // Cache the token
    const expiresIn = typeof tokenResponse.expires_in === 'string' 
      ? parseInt(tokenResponse.expires_in, 10) 
      : tokenResponse.expires_in;

    const cachedToken: CachedToken = {
      accessToken: tokenResponse.access_token,
      expiresAt: Date.now() + (expiresIn * 1000),
      tokenType: tokenResponse.token_type,
    };

    this.tokenCache.set(cacheKey, cachedToken);

    logger.info({ 
      expiresIn, 
      environment: this.credentials.environment 
    }, 'NHS API access token obtained');

    return tokenResponse.access_token;
  }

  /**
   * Make an authenticated request to an NHS API
   */
  async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    const envConfig = this.getEnvironmentConfig();
    
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${envConfig.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json',
        'X-Request-ID': crypto.randomUUID(),
      },
    });

    // Handle token expiry - retry once with fresh token
    if (response.status === 401) {
      logger.warn('NHS API returned 401, refreshing token and retrying');
      const freshToken = await this.getAccessToken(true);
      
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${freshToken}`,
          'Accept': 'application/fhir+json',
          'X-Request-ID': crypto.randomUUID(),
        },
      });

      if (!retryResponse.ok) {
        throw new Error(`NHS API request failed after retry: ${retryResponse.status}`);
      }

      return retryResponse.json() as Promise<T>;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ 
        status: response.status, 
        url,
        error: errorBody 
      }, 'NHS API request failed');
      throw new Error(`NHS API request failed: ${response.status} - ${errorBody}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Test the NHS API connection
   */
  async testConnection(): Promise<{
    success: boolean;
    environment: NhsEnvironment;
    message: string;
    timestamp: string;
  }> {
    try {
      if (!this.credentials) {
        return {
          success: false,
          environment: 'sandbox',
          message: 'NHS API credentials not configured',
          timestamp: new Date().toISOString(),
        };
      }

      // Try to get an access token
      await this.getAccessToken(true);

      return {
        success: true,
        environment: this.credentials.environment,
        message: 'Successfully connected to NHS API',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        environment: this.credentials?.environment || 'sandbox',
        message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if credentials are configured
   */
  isConfigured(): boolean {
    return this.credentials !== null;
  }

  /**
   * Get current environment
   */
  getCurrentEnvironment(): NhsEnvironment {
    return this.credentials?.environment || 'sandbox';
  }

  /**
   * Clear token cache (for testing or credential rotation)
   */
  clearCache(): void {
    this.tokenCache.clear();
  }
}

// Singleton instance
export const nhsApiAuthService = new NhsApiAuthService();
