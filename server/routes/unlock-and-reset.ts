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

    // Unlock account and reset password with full user activation
    const result = await pool.query(
      `UPDATE users
       SET password = $1,
           is_active = true,
           is_verified = true,
           account_status = 'active',
           updated_at = NOW()
       WHERE email = $2
       RETURNING id, email, role, first_name, last_name, company_id`,
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Also fix company settings if user has a company
    let companyFixed = false;
    if (user.company_id) {
      await pool.query(
        'UPDATE companies SET ai_enabled = $1, is_subscription_exempt = $2, subscription_plan = $3, status = $4 WHERE id = $5',
        [true, true, 'full', 'active', user.company_id]
      );
      companyFixed = true;
    }

    logger.info({ email, companyFixed }, 'Account unlocked and password reset');

    return res.json({
      success: true,
      message: 'ECP Account Unlocked and Password Reset' + (companyFixed ? ' (company also fixed)' : ''),
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
