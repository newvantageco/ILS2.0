/**
 * AWS Secrets Manager Integration
 * 
 * Centralized secrets management for production deployments.
 * 
 * Benefits:
 * - Automatic secret rotation (90-day cycle)
 * - Audit logging of secret access
 * - IAM-based access control
 * - Encryption at rest with AWS KMS
 * - No secrets in environment variables
 * 
 * Usage:
 * ```typescript
 * import { getSecret, initializeSecrets } from './utils/secrets';
 * 
 * // On server startup:
 * await initializeSecrets();
 * 
 * // Access secrets:
 * const jwtSecret = await getSecret('ils-api/jwt-secret');
 * ```
 * 
 * Setup:
 * ```bash
 * # Create secrets in AWS
 * aws secretsmanager create-secret \
 *   --name ils-api/jwt-secret \
 *   --secret-string "$(openssl rand -hex 32)"
 * 
 * # Set AWS credentials in Railway/environment
 * AWS_ACCESS_KEY_ID=<key>
 * AWS_SECRET_ACCESS_KEY=<secret>
 * AWS_REGION=us-east-1
 * SECRETS_PROVIDER=aws  # or 'env' for development
 * ```
 */

import { 
  SecretsManagerClient, 
  GetSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
  RotateSecretCommand,
  DescribeSecretCommand,
  type GetSecretValueCommandOutput,
  type CreateSecretCommandInput,
} from '@aws-sdk/client-secrets-manager';
import { logger } from './logger';

/**
 * Secrets provider type
 */
type SecretsProvider = 'aws' | 'env' | 'vault';

/**
 * Secrets manager client (lazy initialization)
 */
let secretsClient: SecretsManagerClient | null = null;

/**
 * In-memory cache for secrets (reduces AWS API calls)
 * Cache TTL: 5 minutes (300 seconds)
 */
const secretsCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get secrets provider from environment
 */
function getSecretsProvider(): SecretsProvider {
  const provider = process.env.SECRETS_PROVIDER || 'env';
  
  if (!['aws', 'env', 'vault'].includes(provider)) {
    logger.warn({ 
      provider,
      allowedValues: ['aws', 'env', 'vault']
    }, 'Invalid SECRETS_PROVIDER - falling back to env');
    
    return 'env';
  }
  
  return provider as SecretsProvider;
}

/**
 * Initialize AWS Secrets Manager client
 */
function getSecretsClient(): SecretsManagerClient {
  if (secretsClient) {
    return secretsClient;
  }
  
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Validate AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      'AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY'
    );
  }
  
  secretsClient = new SecretsManagerClient({ 
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });
  
  logger.info({ region }, 'AWS Secrets Manager client initialized');
  
  return secretsClient;
}

/**
 * Get secret from AWS Secrets Manager
 * 
 * @param secretName - Full secret name (e.g., 'ils-api/jwt-secret')
 * @param useCache - Whether to use in-memory cache (default: true)
 * @returns Secret value as string
 */
export async function getSecretFromAWS(
  secretName: string,
  useCache: boolean = true
): Promise<string> {
  // Check cache first
  if (useCache) {
    const cached = secretsCache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug({ secretName }, 'Retrieved secret from cache');
      return cached.value;
    }
  }
  
  try {
    const client = getSecretsClient();
    
    const response: GetSecretValueCommandOutput = await client.send(
      new GetSecretValueCommand({ 
        SecretId: secretName 
      })
    );
    
    const secretValue = response.SecretString;
    
    if (!secretValue) {
      throw new Error(`Secret ${secretName} has no value`);
    }
    
    // Cache the secret
    secretsCache.set(secretName, {
      value: secretValue,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    
    logger.debug({ 
      secretName,
      version: response.VersionId 
    }, 'Retrieved secret from AWS Secrets Manager');
    
    return secretValue;
    
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      logger.error({ 
        secretName,
        error: error.message
      }, 'Secret not found in AWS Secrets Manager');
      
      throw new Error(`Secret not found: ${secretName}`);
    }
    
    logger.error({ 
      error,
      secretName
    }, 'Failed to retrieve secret from AWS Secrets Manager');
    
    throw error;
  }
}

/**
 * Get secret from environment variables (development only)
 */
function getSecretFromEnv(secretName: string): string {
  // Convert secret name to env var format
  // Example: 'ils-api/jwt-secret' -> 'ILS_API_JWT_SECRET'
  const envVarName = secretName
    .toUpperCase()
    .replace(/[/-]/g, '_');
  
  const value = process.env[envVarName];
  
  if (!value) {
    // Fallback to direct env var name
    const directName = secretName.split('/').pop()?.toUpperCase().replace(/-/g, '_');
    const fallbackValue = directName ? process.env[directName] : undefined;
    
    if (!fallbackValue) {
      throw new Error(
        `Secret not found in environment: ${secretName} (tried ${envVarName} and ${directName})`
      );
    }
    
    return fallbackValue;
  }
  
  return value;
}

/**
 * Get secret (supports multiple providers)
 * 
 * @param secretName - Secret identifier
 * @param useCache - Whether to use cache (AWS only)
 * @returns Secret value
 */
export async function getSecret(
  secretName: string,
  useCache: boolean = true
): Promise<string> {
  const provider = getSecretsProvider();
  
  switch (provider) {
    case 'aws':
      return await getSecretFromAWS(secretName, useCache);
    
    case 'env':
      return getSecretFromEnv(secretName);
    
    case 'vault':
      throw new Error('HashiCorp Vault not yet implemented');
    
    default:
      throw new Error(`Unknown secrets provider: ${provider}`);
  }
}

/**
 * Create a new secret in AWS Secrets Manager
 * 
 * @param secretName - Full secret name
 * @param secretValue - Secret value to store
 * @param description - Optional description
 */
export async function createSecret(
  secretName: string,
  secretValue: string,
  description?: string
): Promise<void> {
  const provider = getSecretsProvider();
  
  if (provider !== 'aws') {
    logger.warn({ provider }, 'Secret creation only supported for AWS provider');
    return;
  }
  
  try {
    const client = getSecretsClient();
    
    const input: CreateSecretCommandInput = {
      Name: secretName,
      SecretString: secretValue,
      Description: description || `ILS API - ${secretName}`,
      Tags: [
        { Key: 'Application', Value: 'ils-api' },
        { Key: 'Environment', Value: process.env.NODE_ENV || 'development' },
        { Key: 'ManagedBy', Value: 'terraform' }, // For IaC tracking
      ],
    };
    
    await client.send(new CreateSecretCommand(input));
    
    logger.info({ secretName }, 'Created secret in AWS Secrets Manager');
    
  } catch (error: any) {
    if (error.name === 'ResourceExistsException') {
      logger.warn({ secretName }, 'Secret already exists - use updateSecret() instead');
      throw new Error(`Secret already exists: ${secretName}`);
    }
    
    logger.error({ error, secretName }, 'Failed to create secret');
    throw error;
  }
}

/**
 * Update an existing secret
 */
export async function updateSecret(
  secretName: string,
  secretValue: string
): Promise<void> {
  const provider = getSecretsProvider();
  
  if (provider !== 'aws') {
    logger.warn({ provider }, 'Secret update only supported for AWS provider');
    return;
  }
  
  try {
    const client = getSecretsClient();
    
    await client.send(new UpdateSecretCommand({
      SecretId: secretName,
      SecretString: secretValue,
    }));
    
    // Invalidate cache
    secretsCache.delete(secretName);
    
    logger.info({ secretName }, 'Updated secret in AWS Secrets Manager');
    
  } catch (error) {
    logger.error({ error, secretName }, 'Failed to update secret');
    throw error;
  }
}

/**
 * Enable automatic rotation for a secret
 * 
 * @param secretName - Secret to rotate
 * @param rotationDays - Rotation interval in days (default: 90)
 */
export async function enableSecretRotation(
  secretName: string,
  rotationDays: number = 90
): Promise<void> {
  const provider = getSecretsProvider();
  
  if (provider !== 'aws') {
    logger.warn({ provider }, 'Secret rotation only supported for AWS provider');
    return;
  }
  
  try {
    const client = getSecretsClient();
    
    await client.send(new RotateSecretCommand({
      SecretId: secretName,
      RotationRules: {
        AutomaticallyAfterDays: rotationDays,
      },
    }));
    
    logger.info({ 
      secretName,
      rotationDays
    }, 'Enabled automatic secret rotation');
    
  } catch (error) {
    logger.error({ error, secretName }, 'Failed to enable secret rotation');
    throw error;
  }
}

/**
 * Get secret metadata (last rotation date, next rotation date, etc.)
 */
export async function getSecretMetadata(secretName: string) {
  const provider = getSecretsProvider();
  
  if (provider !== 'aws') {
    return null;
  }
  
  try {
    const client = getSecretsClient();
    
    const response = await client.send(
      new DescribeSecretCommand({ 
        SecretId: secretName 
      })
    );
    
    return {
      name: response.Name,
      description: response.Description,
      lastRotatedDate: response.LastRotatedDate,
      lastChangedDate: response.LastChangedDate,
      rotationEnabled: response.RotationEnabled,
      rotationRules: response.RotationRules,
    };
    
  } catch (error) {
    logger.error({ error, secretName }, 'Failed to get secret metadata');
    return null;
  }
}

/**
 * Initialize all required secrets on server startup
 * 
 * Loads all secrets into memory/cache for faster access
 */
export async function initializeSecrets(): Promise<void> {
  const provider = getSecretsProvider();
  
  logger.info({ provider }, 'Initializing secrets...');
  
  if (provider === 'env') {
    logger.info('Using environment variables for secrets (development mode)');
    return;
  }
  
  // List of required secrets
  const requiredSecrets = [
    'ils-api/jwt-secret',
    'ils-api/session-secret',
    'ils-api/db-encryption-key',
    'ils-api/stripe-secret',
    'ils-api/openai-api-key',
  ];
  
  const results: { name: string; loaded: boolean; error?: string }[] = [];
  
  for (const secretName of requiredSecrets) {
    try {
      await getSecret(secretName);
      results.push({ name: secretName, loaded: true });
    } catch (error: any) {
      results.push({ 
        name: secretName, 
        loaded: false, 
        error: error.message 
      });
      
      logger.warn({ 
        secretName,
        error: error.message
      }, 'Failed to load secret - will retry on demand');
    }
  }
  
  const loadedCount = results.filter(r => r.loaded).length;
  const failedCount = results.filter(r => !r.loaded).length;
  
  logger.info({ 
    provider,
    loaded: loadedCount,
    failed: failedCount,
    results
  }, 'Secrets initialization complete');
  
  if (failedCount > 0 && process.env.NODE_ENV === 'production') {
    logger.error('❌ Some secrets failed to load in production');
    throw new Error(`Failed to load ${failedCount} required secrets`);
  }
}

/**
 * Clear secrets cache (force refresh)
 */
export function clearSecretsCache(): void {
  const size = secretsCache.size;
  secretsCache.clear();
  
  logger.info({ clearedSecrets: size }, 'Cleared secrets cache');
}
