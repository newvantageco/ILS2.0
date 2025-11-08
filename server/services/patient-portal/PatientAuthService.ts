/**
 * Patient Portal Authentication Service
 *
 * Handles patient registration, login, password management,
 * and account verification for the patient portal
 */

import { loggers } from '../../utils/logger.js';
import { db } from '../../db.js';
import { patients } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const logger = loggers.api;

/**
 * Patient Account
 */
export interface PatientAccount {
  id: string;
  patientId: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    appointmentReminders: boolean;
    testResultNotifications: boolean;
  };
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Registration Request
 */
export interface PatientRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone?: string;
  mrn?: string; // If they know their MRN
}

/**
 * Login Result
 */
export interface LoginResult {
  success: boolean;
  account?: PatientAccount;
  patient?: any;
  token?: string;
  requiresTwoFactor?: boolean;
  error?: string;
}

/**
 * Patient Auth Service
 */
export class PatientAuthService {
  /**
   * In-memory patient accounts (use database in production)
   */
  private static accounts = new Map<string, PatientAccount>();

  /**
   * Session tokens (use Redis in production)
   */
  private static sessions = new Map<string, { accountId: string; expiresAt: Date }>();

  /**
   * Password requirements
   */
  private static readonly PASSWORD_MIN_LENGTH = 8;
  private static readonly PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: false,
  };

  /**
   * Security settings
   */
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCK_DURATION_MINUTES = 30;
  private static readonly SESSION_DURATION_HOURS = 24;
  private static readonly RESET_TOKEN_DURATION_HOURS = 1;
  private static readonly VERIFICATION_TOKEN_DURATION_DAYS = 7;

  /**
   * Register a new patient account
   */
  static async register(registration: PatientRegistration): Promise<{
    success: boolean;
    account?: PatientAccount;
    error?: string;
  }> {
    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registration.email)) {
        return { success: false, error: 'Invalid email address' };
      }

      // Check if email already exists
      const existing = Array.from(this.accounts.values()).find(
        (acc) => acc.email.toLowerCase() === registration.email.toLowerCase()
      );

      if (existing) {
        return { success: false, error: 'Email already registered' };
      }

      // Validate password
      const passwordValidation = this.validatePassword(registration.password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }

      // Try to find existing patient by email or MRN
      let patient = null;

      if (registration.mrn) {
        const [existingPatient] = await db
          .select()
          .from(patients)
          .where(eq(patients.mrn, registration.mrn))
          .limit(1);

        if (existingPatient) {
          patient = existingPatient;
        }
      }

      // If no patient found, create new patient record
      if (!patient) {
        const [newPatient] = await db
          .insert(patients)
          .values({
            firstName: registration.firstName,
            lastName: registration.lastName,
            dateOfBirth: registration.dateOfBirth,
            email: registration.email,
            phone: registration.phone,
            mrn: registration.mrn || `MRN-${Date.now()}`,
          })
          .returning();

        patient = newPatient;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(registration.password, 10);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date();
      verificationTokenExpiry.setDate(
        verificationTokenExpiry.getDate() + this.VERIFICATION_TOKEN_DURATION_DAYS
      );

      // Create account
      const account: PatientAccount = {
        id: crypto.randomUUID(),
        patientId: patient.id,
        email: registration.email.toLowerCase(),
        passwordHash,
        isVerified: false,
        verificationToken,
        verificationTokenExpiry,
        failedLoginAttempts: 0,
        twoFactorEnabled: false,
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          appointmentReminders: true,
          testResultNotifications: true,
        },
        createdAt: new Date(),
      };

      this.accounts.set(account.id, account);

      logger.info({ accountId: account.id, email: account.email }, 'Patient account registered');

      // In production, send verification email
      await this.sendVerificationEmail(account);

      return { success: true, account };
    } catch (error) {
      logger.error({ error }, 'Failed to register patient account');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Find account
      const account = Array.from(this.accounts.values()).find(
        (acc) => acc.email.toLowerCase() === email.toLowerCase()
      );

      if (!account) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if account is locked
      if (account.lockedUntil && account.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil(
          (account.lockedUntil.getTime() - Date.now()) / 60000
        );
        return {
          success: false,
          error: `Account locked. Try again in ${minutesLeft} minutes`,
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, account.passwordHash);

      if (!isValidPassword) {
        // Increment failed attempts
        account.failedLoginAttempts++;

        // Lock account if too many failures
        if (account.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          account.lockedUntil = new Date();
          account.lockedUntil.setMinutes(
            account.lockedUntil.getMinutes() + this.LOCK_DURATION_MINUTES
          );

          logger.warn({ accountId: account.id, email }, 'Account locked due to failed login attempts');
        }

        this.accounts.set(account.id, account);

        return { success: false, error: 'Invalid email or password' };
      }

      // Check if email is verified
      if (!account.isVerified) {
        return {
          success: false,
          error: 'Please verify your email address before logging in',
        };
      }

      // Reset failed attempts
      account.failedLoginAttempts = 0;
      account.lockedUntil = undefined;
      account.lastLoginAt = new Date();
      this.accounts.set(account.id, account);

      // Check if 2FA is enabled
      if (account.twoFactorEnabled) {
        return {
          success: true,
          requiresTwoFactor: true,
          account,
        };
      }

      // Get patient data
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, account.patientId))
        .limit(1);

      // Generate session token
      const token = this.generateSessionToken(account.id);

      logger.info({ accountId: account.id, email }, 'Patient logged in successfully');

      return {
        success: true,
        account,
        patient,
        token,
      };
    } catch (error) {
      logger.error({ error, email }, 'Login failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const account = Array.from(this.accounts.values()).find(
      (acc) => acc.verificationToken === token
    );

    if (!account) {
      return { success: false, error: 'Invalid verification token' };
    }

    if (account.verificationTokenExpiry && account.verificationTokenExpiry < new Date()) {
      return { success: false, error: 'Verification token expired' };
    }

    account.isVerified = true;
    account.verificationToken = undefined;
    account.verificationTokenExpiry = undefined;
    this.accounts.set(account.id, account);

    logger.info({ accountId: account.id }, 'Email verified successfully');

    return { success: true };
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const account = Array.from(this.accounts.values()).find(
      (acc) => acc.email.toLowerCase() === email.toLowerCase()
    );

    if (!account) {
      // Don't reveal if email exists
      return { success: true };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + this.RESET_TOKEN_DURATION_HOURS);

    account.resetToken = resetToken;
    account.resetTokenExpiry = resetTokenExpiry;
    this.accounts.set(account.id, account);

    // In production, send reset email
    await this.sendPasswordResetEmail(account, resetToken);

    logger.info({ accountId: account.id }, 'Password reset requested');

    return { success: true };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const account = Array.from(this.accounts.values()).find(
      (acc) => acc.resetToken === token
    );

    if (!account) {
      return { success: false, error: 'Invalid reset token' };
    }

    if (account.resetTokenExpiry && account.resetTokenExpiry < new Date()) {
      return { success: false, error: 'Reset token expired' };
    }

    // Validate new password
    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    // Hash new password
    account.passwordHash = await bcrypt.hash(newPassword, 10);
    account.resetToken = undefined;
    account.resetTokenExpiry = undefined;
    account.failedLoginAttempts = 0;
    account.lockedUntil = undefined;
    this.accounts.set(account.id, account);

    logger.info({ accountId: account.id }, 'Password reset successfully');

    return { success: true };
  }

  /**
   * Change password (when logged in)
   */
  static async changePassword(
    accountId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const account = this.accounts.get(accountId);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, account.passwordHash);

    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Validate new password
    const passwordValidation = this.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    // Hash new password
    account.passwordHash = await bcrypt.hash(newPassword, 10);
    account.updatedAt = new Date();
    this.accounts.set(accountId, account);

    logger.info({ accountId }, 'Password changed successfully');

    return { success: true };
  }

  /**
   * Validate password against requirements
   */
  private static validatePassword(password: string): {
    valid: boolean;
    error?: string;
  } {
    if (password.length < this.PASSWORD_REQUIREMENTS.minLength) {
      return {
        valid: false,
        error: `Password must be at least ${this.PASSWORD_REQUIREMENTS.minLength} characters`,
      };
    }

    if (this.PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }

    if (this.PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one lowercase letter',
      };
    }

    if (this.PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one number',
      };
    }

    if (this.PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one special character',
      };
    }

    return { valid: true };
  }

  /**
   * Generate session token
   */
  private static generateSessionToken(accountId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.SESSION_DURATION_HOURS);

    this.sessions.set(token, { accountId, expiresAt });

    return token;
  }

  /**
   * Validate session token
   */
  static async validateSession(token: string): Promise<PatientAccount | null> {
    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    return this.accounts.get(session.accountId) || null;
  }

  /**
   * Logout (invalidate session)
   */
  static async logout(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  /**
   * Get account by ID
   */
  static async getAccount(accountId: string): Promise<PatientAccount | null> {
    return this.accounts.get(accountId) || null;
  }

  /**
   * Update account preferences
   */
  static async updatePreferences(
    accountId: string,
    preferences: Partial<PatientAccount['preferences']>
  ): Promise<PatientAccount | null> {
    const account = this.accounts.get(accountId);

    if (!account) {
      return null;
    }

    account.preferences = {
      ...account.preferences,
      ...preferences,
    };
    account.updatedAt = new Date();

    this.accounts.set(accountId, account);

    logger.info({ accountId }, 'Account preferences updated');

    return account;
  }

  /**
   * Send verification email (mock)
   */
  private static async sendVerificationEmail(account: PatientAccount): Promise<void> {
    logger.info(
      { accountId: account.id, email: account.email },
      'Verification email sent (mock)'
    );

    // In production, would send actual email with verification link
    // const verificationLink = `${process.env.PORTAL_URL}/verify?token=${account.verificationToken}`;
  }

  /**
   * Send password reset email (mock)
   */
  private static async sendPasswordResetEmail(
    account: PatientAccount,
    resetToken: string
  ): Promise<void> {
    logger.info(
      { accountId: account.id, email: account.email },
      'Password reset email sent (mock)'
    );

    // In production, would send actual email with reset link
    // const resetLink = `${process.env.PORTAL_URL}/reset-password?token=${resetToken}`;
  }

  /**
   * Clean up expired sessions and tokens
   */
  static cleanupExpired(): number {
    const now = new Date();

    // Clean up expired sessions
    let cleanedSessions = 0;
    this.sessions.forEach((session, token) => {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
        cleanedSessions++;
      }
    });

    // Clean up expired verification tokens
    this.accounts.forEach((account) => {
      if (account.verificationTokenExpiry && account.verificationTokenExpiry < now) {
        account.verificationToken = undefined;
        account.verificationTokenExpiry = undefined;
      }

      if (account.resetTokenExpiry && account.resetTokenExpiry < now) {
        account.resetToken = undefined;
        account.resetTokenExpiry = undefined;
      }
    });

    if (cleanedSessions > 0) {
      logger.info({ cleanedSessions }, 'Cleaned up expired sessions');
    }

    return cleanedSessions;
  }
}
