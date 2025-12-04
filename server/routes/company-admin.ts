/**
 * Company Admin Routes
 *
 * Special routes for company_admin role to manage multiple companies and users
 * Company admins can create companies without subscription requirements
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { companies, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '../utils/logger';
import { authenticateJWT, requireRole } from '../middleware/auth-jwt';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const router = Router();
const logger = createLogger('company-admin');

/**
 * POST /api/company-admin/companies
 * Create a new company (no subscription required)
 * Only company_admin can access this
 */
router.post(
  '/companies',
  authenticateJWT,
  requireRole(['company_admin']),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        type,
        email,
        phone,
        website,
        address,
        adminFirstName,
        adminLastName,
        adminEmail,
        adminPassword,
      } = req.body;

      // Validate required fields
      if (!name || !email || !type) {
        return res.status(400).json({
          error: 'Missing required fields: name, email, type',
        });
      }

      // Check if company with same email already exists
      const [existingCompany] = await db
        .select()
        .from(companies)
        .where(eq(companies.email, email.toLowerCase()))
        .limit(1);

      if (existingCompany) {
        return res.status(409).json({
          error: 'A company with this email already exists',
        });
      }

      // Create the company with NO subscription requirement
      const [newCompany] = await db
        .insert(companies)
        .values({
          id: uuidv4(),
          name,
          type,
          email: email.toLowerCase(),
          phone: phone || null,
          website: website || null,
          address: address || {},
          status: 'active', // Active immediately - no approval needed
          subscriptionPlan: 'free', // Default to free plan
          subscriptionStatus: 'active',
          trialEndsAt: null, // No trial limitations
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      logger.info({ companyId: newCompany.id }, 'Company created by company_admin');

      // If admin user details provided, create admin user for the company
      if (adminFirstName && adminLastName && adminEmail && adminPassword) {
        // Hash the password
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        try {
          await db.insert(users).values({
            id: uuidv4(),
            email: adminEmail.toLowerCase(),
            password: passwordHash,
            firstName: adminFirstName,
            lastName: adminLastName,
            role: 'admin',
            companyId: newCompany.id,
            accountStatus: 'active',
            isVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          logger.info({ companyId: newCompany.id }, 'Admin user created for new company');
        } catch (userError) {
          logger.error({ error: userError }, 'Failed to create admin user');
          // Don't fail the company creation if user creation fails
        }
      }

      res.status(201).json({
        success: true,
        company: newCompany,
        message: 'Company created successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to create company');
      res.status(500).json({
        error: 'Failed to create company',
      });
    }
  }
);

/**
 * GET /api/company-admin/companies
 * Get all companies (for company_admin view)
 */
router.get(
  '/companies',
  authenticateJWT,
  requireRole(['company_admin']),
  async (req: Request, res: Response) => {
    try {
      const allCompanies = await db
        .select({
          id: companies.id,
          name: companies.name,
          type: companies.type,
          email: companies.email,
          phone: companies.phone,
          status: companies.status,
          subscriptionPlan: companies.subscriptionPlan,
          createdAt: companies.createdAt,
        })
        .from(companies)
        .orderBy(companies.createdAt);

      res.json(allCompanies);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch companies');
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  }
);

/**
 * POST /api/company-admin/companies/:companyId/users
 * Add a user to a specific company
 */
router.post(
  '/companies/:companyId/users',
  authenticateJWT,
  requireRole(['company_admin']),
  async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const { firstName, lastName, email, password, role } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({
          error: 'Missing required fields: firstName, lastName, email, password, role',
        });
      }

      // Check if company exists
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Check if user with same email already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existingUser) {
        return res.status(409).json({
          error: 'A user with this email already exists',
        });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create the user
      const [newUser] = await db
        .insert(users)
        .values({
          id: uuidv4(),
          email: email.toLowerCase(),
          password: passwordHash,
          firstName,
          lastName,
          role,
          companyId,
          accountStatus: 'active',
          isVerified: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      logger.info({ userId: newUser.id, companyId }, 'User created by company_admin');

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
        message: 'User created successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to create user');
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

/**
 * GET /api/company-admin/profile
 * Get current user's company profile
 */
router.get('/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [user] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.companyId) {
      return res.status(404).json({ error: 'No company associated with user' });
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, user.companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch company profile');
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PATCH /api/company-admin/profile
 * Update current user's company profile
 */
router.patch('/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [user] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.companyId) {
      return res.status(404).json({ error: 'No company associated with user' });
    }

    const { name, email, phone, website, address } = req.body;

    const [updatedCompany] = await db
      .update(companies)
      .set({
        name,
        email,
        phone,
        website,
        address,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, user.companyId))
      .returning();

    res.json(updatedCompany);
  } catch (error) {
    logger.error({ error }, 'Failed to update company profile');
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/company-admin/users
 * Get all users in current user's company
 */
router.get('/users', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [user] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.companyId) {
      return res.json([]);
    }

    const companyUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.firstName,
        role: users.role,
        accountStatus: users.accountStatus,
      })
      .from(users)
      .where(eq(users.companyId, user.companyId));

    res.json(companyUsers);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch company users');
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/company-admin/suppliers
 * Get approved suppliers for current user's company
 */
router.get('/suppliers', authenticateJWT, async (req: Request, res: Response) => {
  try {
    res.json([]); // Placeholder - implement supplier logic as needed
  } catch (error) {
    logger.error({ error }, 'Failed to fetch suppliers');
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

export default router;
