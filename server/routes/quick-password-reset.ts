/**
 * Quick Password Reset - Direct SQL
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('quick-password-reset');

router.post('/quick-password-reset', async (req: Request, res: Response) => {
  try {
    const email = 'test.ecp@ils2.com';
    const newPassword = 'TestPass123';

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, role, first_name, last_name',
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    logger.info({ email }, 'Password reset successfully');

    return res.json({
      success: true,
      message: 'ECP Password Reset Complete',
      credentials: {
        email: user.email,
        password: newPassword,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        loginUrl: 'https://ils.newvantageco.com/login'
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to reset password');
    return res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
