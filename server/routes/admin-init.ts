/**
 * Admin Initialization Endpoint
 * One-time endpoint to initialize the default admin user
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('admin-init');

/**
 * POST /api/admin-init
 * Initialize the default admin user
 */
router.post('/admin-init', async (req: Request, res: Response) => {
  try {
    const adminEmail = 'admin@ils2.com';
    const adminPassword = 'Admin@123456';

    // Check if admin already exists
    const checkResult = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (checkResult.rows.length > 0) {
      // Update password
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        'UPDATE users SET password = $1, account_status = $2, is_verified = $3, is_active = $4, updated_at = NOW() WHERE email = $5',
        [passwordHash, 'active', true, true, adminEmail]
      );

      logger.info('Admin password updated');
      return res.json({
        success: true,
        message: 'Admin user password updated',
        email: adminEmail
      });
    } else {
      // Create new admin
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        'INSERT INTO users (email, password, first_name, last_name, role, account_status, is_verified, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())',
        [adminEmail, passwordHash, 'System', 'Administrator', 'platform_admin', 'active', true, true]
      );

      logger.info('Admin user created');
      return res.json({
        success: true,
        message: 'Admin user created successfully',
        email: adminEmail
      });
    }
  } catch (error) {
    logger.error({ error }, 'Failed to initialize admin user');
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize admin user',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
