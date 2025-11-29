/**
 * Field-Level Encryption Utilities
 * 
 * Provides AES-256-GCM encryption for sensitive PHI/PII data in compliance with:
 * - HIPAA Security Rule (45 CFR §164.312(a)(2)(iv))
 * - GDPR Article 32 (Security of processing)
 * - NHS Data Security and Protection Toolkit
 * 
 * Features:
 * - AES-256-GCM authenticated encryption
 * - Unique IV per encryption operation
 * - Authentication tags to prevent tampering
 * - Key rotation support via versioning
 * - Constant-time comparison to prevent timing attacks
 * 
 * Usage:
 * ```typescript
 * const encrypted = encryptField('NHS1234567890');
 * const decrypted = decryptField(encrypted);
 * ```
 */

import { 
  createCipheriv, 
  createDecipheriv, 
  randomBytes,
  timingSafeEqual,
  scrypt
} from 'crypto';
import { promisify } from 'util';
import { logger } from './logger';

const scryptAsync = promisify(scrypt);

/**
 * Encryption key configuration
 * 
 * SECURITY: In production, use AWS Secrets Manager or HashiCorp Vault
 * DO NOT store encryption keys in environment variables long-term
 */
const ENCRYPTION_KEY_BASE64 = process.env.DB_ENCRYPTION_KEY;
const ENCRYPTION_KEY_VERSION = process.env.DB_ENCRYPTION_KEY_VERSION || 'v1';

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Lazy-load encryption key (only when needed)
 */
let cachedEncryptionKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }
  
  if (!ENCRYPTION_KEY_BASE64) {
    const error = new Error(
      'DB_ENCRYPTION_KEY environment variable not set. ' +
      'Generate with: openssl rand -base64 32'
    );
    
    logger.fatal({ 
      error,
      severity: 'critical',
      compliance: 'HIPAA violation - encryption at rest not configured'
    }, 'Encryption key not configured');
    
    throw error;
  }
  
  // Validate key length
  const key = Buffer.from(ENCRYPTION_KEY_BASE64, 'base64');
  
  if (key.length !== KEY_LENGTH) {
    const error = new Error(
      `Invalid encryption key length: ${key.length} bytes (expected ${KEY_LENGTH})`
    );
    
    logger.fatal({ error }, 'Invalid encryption key configuration');
    throw error;
  }
  
  cachedEncryptionKey = key;
  
  logger.info({ 
    keyVersion: ENCRYPTION_KEY_VERSION,
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH * 8
  }, 'Encryption key loaded successfully');
  
  return key;
}

/**
 * Encrypt sensitive field data
 * 
 * Format: version:iv:authTag:encryptedData
 * All components are hex-encoded for database storage
 * 
 * @param plaintext - Data to encrypt (string)
 * @returns Encrypted data in versioned format
 * 
 * @example
 * ```typescript
 * const encrypted = encryptField('sensitive-data');
 * // Returns: "v1:0a1b2c3d...:4e5f6g7h...:8i9j0k1l..."
 * ```
 */
export function encryptField(plaintext: string): string {
  if (!plaintext || plaintext.trim() === '') {
    return ''; // Don't encrypt empty strings
  }
  
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Versioned format: version:iv:authTag:ciphertext
    const result = [
      ENCRYPTION_KEY_VERSION,
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted
    ].join(':');
    
    return result;
    
  } catch (error) {
    logger.error({ 
      error,
      fieldLength: plaintext.length,
      severity: 'high'
    }, 'Field encryption failed');
    
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive field data
 * 
 * @param ciphertext - Encrypted data in versioned format
 * @returns Decrypted plaintext
 * 
 * @throws Error if decryption fails (tampered data, wrong key, or version mismatch)
 */
export function decryptField(ciphertext: string): string {
  if (!ciphertext || ciphertext.trim() === '') {
    return ''; // Empty input returns empty output
  }
  
  try {
    const parts = ciphertext.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [version, ivHex, authTagHex, encryptedData] = parts;
    
    // Check version compatibility
    if (version !== ENCRYPTION_KEY_VERSION) {
      logger.warn({ 
        dataVersion: version,
        currentVersion: ENCRYPTION_KEY_VERSION
      }, 'Encryption key version mismatch - key rotation needed');
      
      // In production, implement key rotation logic here
      // For now, attempt decryption with current key
    }
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error) {
    logger.error({ 
      error,
      ciphertextLength: ciphertext?.length,
      severity: 'high'
    }, 'Field decryption failed - possible tampering or key mismatch');
    
    throw new Error('Decryption failed - data may be tampered or key is incorrect');
  }
}

/**
 * Encrypt multiple fields in an object
 * 
 * @param data - Object containing fields to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @returns New object with encrypted fields
 * 
 * @example
 * ```typescript
 * const encrypted = encryptFields(
 *   { nhsNumber: '1234567890', name: 'John Doe' },
 *   ['nhsNumber']
 * );
 * // Returns: { nhsNumber: 'v1:...', name: 'John Doe' }
 * ```
 */
export function encryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of fieldsToEncrypt) {
    const value = data[field];
    
    if (value && typeof value === 'string') {
      result[field] = encryptField(value) as any;
    }
  }
  
  return result;
}

/**
 * Decrypt multiple fields in an object
 * 
 * @param data - Object containing encrypted fields
 * @param fieldsToDecrypt - Array of field names to decrypt
 * @returns New object with decrypted fields
 */
export function decryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of fieldsToDecrypt) {
    const value = data[field];
    
    if (value && typeof value === 'string') {
      try {
        result[field] = decryptField(value) as any;
      } catch (error) {
        logger.error({ 
          error,
          field: String(field)
        }, 'Failed to decrypt field');
        
        // Return asterisks for failed decryption (data integrity preserved)
        result[field] = '***DECRYPTION_FAILED***' as any;
      }
    }
  }
  
  return result;
}

/**
 * Hash-based encryption for one-way data (passwords, tokens)
 * Uses scrypt for key derivation (PBKDF2 alternative)
 * 
 * @param data - Data to hash
 * @param salt - Optional salt (auto-generated if not provided)
 * @returns Hash in format: algorithm:salt:hash
 */
export async function hashData(
  data: string,
  salt?: Buffer
): Promise<string> {
  const useSalt = salt || randomBytes(16);
  
  const key = await scryptAsync(data, useSalt, 64) as Buffer;
  
  return `scrypt:${useSalt.toString('hex')}:${key.toString('hex')}`;
}

/**
 * Verify hashed data (constant-time comparison)
 * 
 * @param data - Plaintext data to verify
 * @param hash - Hash to compare against
 * @returns True if data matches hash
 */
export async function verifyHash(
  data: string,
  hash: string
): Promise<boolean> {
  try {
    const parts = hash.split(':');
    
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }
    
    const salt = Buffer.from(parts[1], 'hex');
    const storedKey = Buffer.from(parts[2], 'hex');
    
    const derivedKey = await scryptAsync(data, salt, 64) as Buffer;
    
    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(derivedKey, storedKey);
    
  } catch (error) {
    logger.error({ error }, 'Hash verification failed');
    return false;
  }
}

/**
 * Generate a new encryption key
 * 
 * @returns Base64-encoded 256-bit key
 * 
 * @example
 * ```bash
 * node -e "console.log(require('./encryption').generateEncryptionKey())"
 * ```
 */
export function generateEncryptionKey(): string {
  const key = randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Rotate encryption key (for existing data re-encryption)
 * 
 * This function handles key rotation by:
 * 1. Decrypting data with old key
 * 2. Re-encrypting with new key
 * 3. Updating version number
 * 
 * @param encryptedData - Data encrypted with old key
 * @param oldKeyVersion - Version of old key
 * @param newKeyVersion - Version of new key
 * @returns Re-encrypted data with new key version
 */
export function rotateEncryptionKey(
  encryptedData: string,
  oldKeyVersion: string,
  newKeyVersion: string
): string {
  // In production, implement key rotation logic:
  // 1. Fetch old key from secrets manager (by version)
  // 2. Decrypt with old key
  // 3. Fetch new key from secrets manager
  // 4. Re-encrypt with new key
  // 5. Return re-encrypted data with new version
  
  logger.warn({
    oldKeyVersion,
    newKeyVersion
  }, 'Key rotation not yet implemented - requires secrets manager integration');
  
  throw new Error('Key rotation requires secrets manager integration');
}

/**
 * Check if data is encrypted (has version prefix)
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  
  const parts = data.split(':');
  return parts.length === 4 && parts[0].startsWith('v');
}

/**
 * Redact sensitive data for logging
 * Shows first/last 4 characters only
 */
export function redactForLogging(data: string, visible: number = 4): string {
  if (!data || data.length <= visible * 2) {
    return '***';
  }
  
  const start = data.substring(0, visible);
  const end = data.substring(data.length - visible);
  
  return `${start}...${end}`;
}

/**
 * CLI utility for generating encryption keys
 * Note: Disabled in bundled production build to avoid module format conflicts
 * To generate keys, run: node -e "import('./server/utils/encryption.js').then(m => console.log(m.generateEncryptionKey()))"
 */
// if (require.main === module) {
//   console.log('Generating new AES-256 encryption key...');
//   console.log('');
//   console.log('Add this to your .env file (or AWS Secrets Manager):');
//   console.log('');
//   console.log(`DB_ENCRYPTION_KEY=${generateEncryptionKey()}`);
//   console.log('DB_ENCRYPTION_KEY_VERSION=v1');
//   console.log('');
//   console.log('⚠️  WARNING: Store this key securely!');
//   console.log('- Never commit to version control');
//   console.log('- Use AWS Secrets Manager in production');
//   console.log('- Implement key rotation every 90 days');
// }
