/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password) for enhanced account security
 */

import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 1 time step before/after for clock drift
  step: 30, // 30-second time step
};

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class TwoFactorAuthService {
  private readonly APP_NAME = 'ILS 2.0';

  /**
   * Generate a new 2FA secret and QR code for a user
   */
  async setup(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    // Generate a new secret
    const secret = authenticator.generateSecret();

    // Generate OTP auth URL
    const otpauth = authenticator.keyuri(userEmail, this.APP_NAME, secret);

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    // Generate backup codes (10 codes, 8 characters each)
    const backupCodes = this.generateBackupCodes(10);

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Enable 2FA for a user after verifying the initial token
   */
  async enable(
    userId: string,
    secret: string,
    token: string,
    backupCodes: string[]
  ): Promise<boolean> {
    // Verify the token before enabling
    const isValid = this.verifyToken(secret, token);

    if (!isValid) {
      return false;
    }

    // Hash backup codes before storing
    const hashedBackupCodes = backupCodes.map(code =>
      this.hashBackupCode(code)
    );

    // Store secret and backup codes in database
    await db
      .update(users)
      .set({
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
        twoFactorEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return true;
  }

  /**
   * Disable 2FA for a user
   */
  async disable(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        twoFactorEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  /**
   * Verify a TOTP token for a user
   */
  async verify(userId: string, token: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return this.verifyToken(user.twoFactorSecret, token);
  }

  /**
   * Verify a backup code for a user
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.twoFactorEnabled || !user.twoFactorBackupCodes) {
      return false;
    }

    const hashedCode = this.hashBackupCode(code);
    const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes);

    const codeIndex = backupCodes.indexOf(hashedCode);

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);

    await db
      .update(users)
      .set({
        twoFactorBackupCodes: JSON.stringify(backupCodes),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return true;
  }

  /**
   * Check if user has 2FA enabled
   */
  async isEnabled(userId: string): Promise<boolean> {
    const [user] = await db
      .select({ twoFactorEnabled: users.twoFactorEnabled })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.twoFactorEnabled ?? false;
  }

  /**
   * Generate new backup codes for a user
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(code =>
      this.hashBackupCode(code)
    );

    await db
      .update(users)
      .set({
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return backupCodes;
  }

  /**
   * Get remaining backup codes count
   */
  async getRemainingBackupCodesCount(userId: string): Promise<number> {
    const [user] = await db
      .select({ twoFactorBackupCodes: users.twoFactorBackupCodes })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.twoFactorBackupCodes) {
      return 0;
    }

    const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
    return backupCodes.length;
  }

  // Private helper methods

  private verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('2FA token verification error:', error);
      return false;
    }
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = this.generateRandomCode(8);
      codes.push(code);
    }

    return codes;
  }

  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  private hashBackupCode(code: string): string {
    // Use crypto.createHash for hashing backup codes
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }
}

// Export singleton instance
export const twoFactorAuthService = new TwoFactorAuthService();
