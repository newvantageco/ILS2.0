/**
 * Reset Test User Password Endpoint
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('reset-test-password');

/**
 * POST /api/reset-test-password
 * Reset test user password
 */
router.post('/reset-test-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and newPassword required'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, role',
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info({ email }, 'Test user password reset');

    return res.json({
      success: true,
      message: 'Password updated successfully',
      user: result.rows[0],
      newPassword
    });
  } catch (error) {
    logger.error({ error }, 'Failed to reset password');
    return res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

export default router;
