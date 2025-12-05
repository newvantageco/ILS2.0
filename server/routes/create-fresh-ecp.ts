/**
 * Create Fresh ECP Account with Different Email
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger('create-fresh-ecp');

router.post('/create-fresh-ecp', async (req: Request, res: Response) => {
  try {
    const email = 'ecp.demo@ils2.com';
    const password = 'EcpDemoPass2024';
    const companyName = 'Demo Eye Care Practice';
    const gocNumber = 'GOC777888';

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      // Update existing
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, email]
      );

      logger.info({ email }, 'Password updated for existing ECP');
      return res.json({
        success: true,
        message: 'ECP password updated',
        credentials: { email, password, loginUrl: 'https://ils.newvantageco.com/login' }
      });
    }

    // Create company
    const companyId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO companies (id, name, type, status, email, subscription_plan, is_subscription_exempt, goc_number, has_ecp_access, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [companyId, companyName, 'ecp', 'active', email, 'free_ecp', true, gocNumber, true]
    );

    // Create user
    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (id, company_id, account_status, email, password, first_name, last_name, role, subscription_plan, is_active, is_verified, goc_number, can_prescribe, can_dispense, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [userId, companyId, 'active', email, hashedPassword, 'Demo', 'ECP', 'ecp', 'full', true, true, gocNumber, true, true]
    );

    logger.info({ userId, companyId, email }, 'Fresh ECP account created');

    return res.json({
      success: true,
      message: 'Fresh ECP Account Created',
      credentials: {
        email,
        password,
        loginUrl: 'https://ils.newvantageco.com/login',
        gocNumber
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create fresh ECP');
    return res.status(500).json({
      success: false,
      error: 'Failed to create fresh ECP account',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
