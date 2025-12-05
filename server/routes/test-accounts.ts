/**
 * Test Accounts Routes
 *
 * TEMPORARY endpoints for creating test accounts.
 * These endpoints should be removed after testing is complete.
 */

import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth-jwt';
import { db } from '../db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { users, companies } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('test-accounts');

/**
 * POST /api/test-accounts/create-ecp
 * Create a test ECP account
 * ONLY platform_admin can run this
 */
router.post(
  '/create-ecp',
  authenticateJWT,
  requireRole(['platform_admin']),
  async (req: Request, res: Response) => {
    try {
      const {
        email = 'test.ecp@ils2.com',
        password = 'TestECP123!',
        firstName = 'Test',
        lastName = 'ECP',
        companyName = 'Test Eye Care Practice',
        gocNumber = 'GOC123456'
      } = req.body;

      logger.info({ email }, 'Creating test ECP account');

      // Validate inputs
      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          error: 'Valid email is required'
        });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long'
        });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        logger.info({ email }, 'User already exists');
        return res.status(400).json({
          success: false,
          error: `User with email ${email} already exists`,
          existingUser: {
            id: existingUser[0].id,
            email: existingUser[0].email,
            role: existingUser[0].role
          }
        });
      }

      // 1. Create ECP Company
      const companyId = crypto.randomUUID();
      logger.info({ companyId, companyName }, 'Creating test ECP company');

      const [company] = await db
        .insert(companies)
        .values({
          id: companyId,
          name: companyName,
          type: 'ecp',
          status: 'active',
          email: email,
          subscriptionPlan: 'free_ecp',
          isSubscriptionExempt: true,
          gocNumber: gocNumber,
          hasEcpAccess: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Create ECP user
      const userId = crypto.randomUUID();
      logger.info({ userId, email }, 'Creating test ECP user');

      const [user] = await db
        .insert(users)
        .values({
          id: userId,
          companyId: companyId,
          accountStatus: 'active',
          email: email,
          password: hashedPassword,
          firstName: firstName,
          lastName: lastName,
          role: 'ecp',
          subscriptionPlan: 'full',
          isActive: true,
          isVerified: true,
          gocNumber: gocNumber,
          canPrescribe: true,
          canDispense: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      logger.info({ userId, companyId }, 'Test ECP account created successfully');

      res.json({
        success: true,
        message: 'Test ECP account created successfully',
        credentials: {
          email: email,
          password: password
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          gocNumber: user.gocNumber
        },
        company: {
          id: company.id,
          name: company.name,
          type: company.type,
          status: company.status
        }
      });

    } catch (error: any) {
      logger.error({ error }, 'Failed to create test ECP account');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

export default router;
