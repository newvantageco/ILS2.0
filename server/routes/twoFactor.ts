/**
 * Two-Factor Authentication Routes
 * Endpoints for setting up and managing 2FA
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth';
import { twoFactorAuthService } from '../services/TwoFactorAuthService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const setupVerifySchema = z.object({
  secret: z.string().min(1),
  token: z.string().length(6),
  backupCodes: z.array(z.string()),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1),
});

/**
 * POST /api/2fa/setup
 * Generate 2FA secret and QR code for initial setup
 */
router.post('/setup', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    // Check if 2FA is already enabled
    const isEnabled = await twoFactorAuthService.isEnabled(userId);
    if (isEnabled) {
      return res.status(400).json({
        error: '2FA is already enabled. Disable it first to set up again.',
      });
    }

    // Generate new 2FA setup
    const setup = await twoFactorAuthService.setup(userId, userEmail);

    res.json({
      secret: setup.secret,
      qrCodeUrl: setup.qrCodeUrl,
      backupCodes: setup.backupCodes,
      message: 'Scan the QR code with your authenticator app, then verify with a code to enable 2FA',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to set up 2FA' });
  }
});

/**
 * POST /api/2fa/enable
 * Verify token and enable 2FA for the user
 */
router.post('/enable', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Validate request body
    const result = setupVerifySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.issues,
      });
    }

    const { secret, token, backupCodes } = result.data;

    // Enable 2FA
    const success = await twoFactorAuthService.enable(userId, secret, token, backupCodes);

    if (!success) {
      return res.status(400).json({
        error: 'Invalid token. Please try again.',
      });
    }

    res.json({
      success: true,
      message: '2FA has been enabled successfully. Save your backup codes in a secure location.',
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA for the user
 */
router.post('/disable', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Require current password or 2FA token for security
    const result = verifyTokenSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Token required to disable 2FA',
      });
    }

    const { token } = result.data;

    // Verify token before disabling
    const isValid = await twoFactorAuthService.verify(userId, token);
    if (!isValid) {
      // Try backup code
      const backupValid = await twoFactorAuthService.verifyBackupCode(userId, token);
      if (!backupValid) {
        return res.status(401).json({
          error: 'Invalid token or backup code',
        });
      }
    }

    await twoFactorAuthService.disable(userId);

    res.json({
      success: true,
      message: '2FA has been disabled',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

/**
 * POST /api/2fa/verify
 * Verify a 2FA token (used during login)
 */
router.post('/verify', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = verifyTokenSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.issues,
      });
    }

    const { token } = result.data;

    // Try TOTP token first
    let isValid = await twoFactorAuthService.verify(userId, token);

    // If TOTP fails, try backup code
    if (!isValid) {
      isValid = await twoFactorAuthService.verifyBackupCode(userId, token);
    }

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid authentication code',
      });
    }

    res.json({
      success: true,
      message: '2FA verification successful',
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

/**
 * GET /api/2fa/status
 * Get 2FA status for current user
 */
router.get('/status', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const isEnabled = await twoFactorAuthService.isEnabled(userId);
    const backupCodesCount = await twoFactorAuthService.getRemainingBackupCodesCount(userId);

    res.json({
      enabled: isEnabled,
      backupCodesRemaining: backupCodesCount,
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

/**
 * POST /api/2fa/backup-codes/regenerate
 * Regenerate backup codes
 */
router.post('/backup-codes/regenerate', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Require 2FA token for security
    const result = verifyTokenSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Token required to regenerate backup codes',
      });
    }

    const { token } = result.data;

    // Verify token
    const isValid = await twoFactorAuthService.verify(userId, token);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid token',
      });
    }

    const newBackupCodes = await twoFactorAuthService.regenerateBackupCodes(userId);

    res.json({
      backupCodes: newBackupCodes,
      message: 'New backup codes generated. Save them in a secure location.',
    });
  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate backup codes' });
  }
});

export default router;
