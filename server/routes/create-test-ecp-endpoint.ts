/**
 * ECP Test Account Creation Endpoint
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('create-test-ecp');

/**
 * POST /api/create-test-ecp
 * Create a test ECP account
 */
router.post('/create-test-ecp', async (req: Request, res: Response) => {
  try {
    const email = 'test.ecp@ils2.com';
    const password = 'TestECP12345';
    const companyName = 'Test Eye Care Practice';
    const gocNumber = 'GOC123456';

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      // Update password and user status
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET password = $1, account_status = $2, is_verified = $3, is_active = $4 WHERE email = $5',
        [hashedPassword, 'active', true, true, email]
      );

      // Also update company to ensure ai_enabled and subscription exemption
      const userResult = await pool.query('SELECT company_id FROM users WHERE email = $1', [email]);
      if (userResult.rows.length > 0 && userResult.rows[0].company_id) {
        await pool.query(
          'UPDATE companies SET ai_enabled = $1, is_subscription_exempt = $2, subscription_plan = $3, status = $4 WHERE id = $5',
          [true, true, 'full', 'active', userResult.rows[0].company_id]
        );
        logger.info('ECP company updated with ai_enabled and subscription exemption');
      }

      logger.info('ECP user password updated');
      return res.json({
        success: true,
        message: 'ECP user password updated and company configured',
        credentials: {
          email,
          password,
          loginUrl: 'https://ils.newvantageco.com/login'
        }
      });
    }

    // Create company with ai_enabled and subscription exemption
    const companyId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO companies (id, name, type, status, email, subscription_plan, is_subscription_exempt, goc_number, has_ecp_access, ai_enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [companyId, companyName, 'ecp', 'active', email, 'full', true, gocNumber, true, true]
    );

    // Create ECP user
    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (id, company_id, account_status, email, password, first_name, last_name, role, subscription_plan, is_active, is_verified, goc_number, can_prescribe, can_dispense, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [userId, companyId, 'active', email, hashedPassword, 'Test', 'ECP', 'ecp', 'full', true, true, gocNumber, true, true]
    );

    logger.info({ userId, companyId }, 'ECP test account created');

    return res.json({
      success: true,
      message: 'ECP test account created successfully',
      credentials: {
        email,
        password,
        loginUrl: 'https://ils.newvantageco.com/login',
        gocNumber
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create ECP test account');
    return res.status(500).json({
      success: false,
      error: 'Failed to create ECP test account',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
