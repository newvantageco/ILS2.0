/**
 * Unlock and Reset ECP Account
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('unlock-and-reset');

router.post('/unlock-and-reset-ecp', async (req: Request, res: Response) => {
  try {
    const email = 'test.ecp@ils2.com';
    const newPassword = 'EcpTestPass2024';

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Unlock account and reset password (just reset password, ignore lock fields)
    const result = await pool.query(
      `UPDATE users
       SET password = $1,
           updated_at = NOW()
       WHERE email = $2
       RETURNING id, email, role, first_name, last_name`,
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    logger.info({ email }, 'Account unlocked and password reset');

    return res.json({
      success: true,
      message: 'ECP Account Unlocked and Password Reset',
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
    logger.error({ error }, 'Failed to unlock and reset');
    return res.status(500).json({
      success: false,
      error: 'Failed to unlock and reset account',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
