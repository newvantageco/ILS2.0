/**
 * Debug ECP User Endpoint (Temporary)
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('debug-ecp-user');

router.post('/debug-ecp-user', async (req: Request, res: Response) => {
  try {
    const email = 'test.ecp@ils2.com';
    const password = 'TestECP12345';

    logger.info({ email }, 'Debugging ECP user');

    // Get user from database
    const userResult = await pool.query(
      'SELECT id, email, password, role, is_active, is_verified, account_status, company_id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const oldPasswordHash = user.password;

    // Test current password
    const isCurrentValid = await bcrypt.compare(password, user.password);

    // Create fresh hash
    const newHash = await bcrypt.hash(password, 10);

    // Update user with fresh hash
    await pool.query(
      'UPDATE users SET password = $1, is_active = $2, is_verified = $3, account_status = $4 WHERE email = $5',
      [newHash, true, true, 'active', email]
    );

    // Also fix company settings if user has a company
    let companyFixed = false;
    if (user.company_id) {
      await pool.query(
        'UPDATE companies SET ai_enabled = $1, is_subscription_exempt = $2, subscription_plan = $3, status = $4 WHERE id = $5',
        [true, true, 'full', 'active', user.company_id]
      );
      companyFixed = true;
      logger.info({ companyId: user.company_id }, 'Company settings fixed (ai_enabled, subscription_exempt)');
    }

    // Verify the update
    const verifyResult = await pool.query(
      'SELECT password FROM users WHERE email = $1',
      [email]
    );
    const newStoredHash = verifyResult.rows[0].password;
    const isNewValid = await bcrypt.compare(password, newStoredHash);

    logger.info({ email, isNewValid }, 'ECP user password hash updated');

    return res.json({
      success: true,
      message: 'ECP user debugged and fixed' + (companyFixed ? ' (company also fixed)' : ''),
      debug: {
        userId: user.id,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        accountStatus: user.account_status,
        companyId: user.company_id,
        companyFixed,
        oldHashPrefix: oldPasswordHash?.substring(0, 20),
        newHashPrefix: newHash.substring(0, 20),
        wasPasswordValid: isCurrentValid,
        isPasswordValidNow: isNewValid
      },
      credentials: {
        email,
        password,
        loginUrl: 'https://ils.newvantageco.com/login'
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to debug ECP user');
    return res.status(500).json({
      success: false,
      error: 'Failed to debug ECP user',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
