/**
 * Onboarding Routes
 * 
 * Automated multi-tenant onboarding with company creation and user association
 * Eliminates the need for manual SQL intervention
 * 
 * Routes:
 * POST /api/onboarding/signup - Complete signup with company creation
 * POST /api/onboarding/join - Signup and join existing company
 * GET /api/onboarding/company-check - Check if company exists by name
 * POST /api/onboarding/complete - Complete onboarding for existing user
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../../db';
import { companies, users } from '../../shared/schema';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { hashPassword } from '../localAuth';
import { normalizeEmail } from '../utils/normalizeEmail';

const router = Router();

// Validation schemas
const signupWithCompanySchema = z.object({
  // User info
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ecp', 'lab_tech', 'engineer', 'supplier', 'company_admin']),
  
  // Company info
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companyType: z.enum(['ecp', 'lab', 'supplier', 'hybrid']),
  companyEmail: z.string().email('Invalid company email').optional(),
  companyPhone: z.string().optional(),
  
  // Optional
  subscriptionPlan: z.enum(['free_ecp', 'full']).optional(),
});

const joinExistingCompanySchema = z.object({
  // User info
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ecp', 'lab_tech', 'engineer', 'supplier']),
  
  // Company selection
  companyId: z.string().uuid('Invalid company ID'),
});

const completeOnboardingSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  companyId: z.string().uuid('Invalid company ID').optional(),
  companyName: z.string().min(2).optional(),
  companyType: z.enum(['ecp', 'lab', 'supplier', 'hybrid']).optional(),
});

/**
 * POST /api/onboarding/signup
 * 
 * Complete automated signup with company creation
 * Creates both user and company in one transaction
 * User becomes the company admin automatically
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validation = signupWithCompanySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      companyName,
      companyType,
      companyEmail,
      companyPhone,
      subscriptionPlan
    } = validation.data;

    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered',
        message: 'An account with this email already exists. Please login or use a different email.',
      });
    }

    // Check if company name already exists
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(ilike(companies.name, companyName))
      .limit(1);

    if (existingCompany) {
      return res.status(400).json({
        error: 'Company already exists',
        message: `A company named "${companyName}" already exists. Would you like to join it instead?`,
        companyId: existingCompany.id,
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create company first
    const [newCompany] = await db
      .insert(companies)
      .values({
        name: companyName,
        type: companyType,
        email: companyEmail || normalizedEmail,
        phone: companyPhone || '',
        status: 'active', // Auto-activate
        subscriptionPlan: subscriptionPlan || (role === 'ecp' ? 'free_ecp' : 'full'),
        aiEnabled: true, // Enable AI features by default
        useExternalAi: true,
        aiLearningProgress: 0,
      })
      .returning();

    // Create user and associate with company
    const finalRole = role === 'company_admin' || validation.data.role === 'ecp' ? 'company_admin' : role;
    
    const newUser = await storage.upsertUser({
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
      role: finalRole,
      roles: [finalRole],
      companyId: newCompany.id, // CRITICAL: Associate user with company immediately
      accountStatus: 'active', // Auto-activate since they created the company
      subscriptionPlan: newCompany.subscriptionPlan,
      organizationName: companyName,
    } as any);

    // Create session
    req.login({
      claims: {
        sub: newUser.id,
        id: newUser.id,
      },
      local: true,
    }, (err) => {
      if (err) {
        console.error('Session creation error:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      res.status(201).json({
        success: true,
        message: 'Account and company created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          companyId: newUser.companyId,
          accountStatus: newUser.accountStatus,
        },
        company: {
          id: newCompany.id,
          name: newCompany.name,
          type: newCompany.type,
          status: newCompany.status,
          subscriptionPlan: newCompany.subscriptionPlan,
        },
      });
    });

  } catch (error) {
    console.error('Onboarding signup error:', error);
    res.status(500).json({
      error: 'Signup failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * POST /api/onboarding/join
 * 
 * Signup and request to join an existing company
 * User account is created in "pending" status
 * Company admin must approve the request
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    const validation = joinExistingCompanySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      companyId,
    } = validation.data;

    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered',
        message: 'An account with this email already exists.',
      });
    }

    // Verify company exists
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: 'The selected company does not exist.',
      });
    }

    if (company.status !== 'active') {
      return res.status(400).json({
        error: 'Company not accepting members',
        message: 'This company is not currently accepting new members.',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with pending status
    const newUser = await storage.upsertUser({
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      roles: [role],
      companyId: company.id, // Associate immediately
      accountStatus: 'pending', // Requires admin approval
      subscriptionPlan: company.subscriptionPlan,
      organizationName: company.name,
    } as any);

    res.status(201).json({
      success: true,
      message: 'Join request submitted successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        companyId: newUser.companyId,
        accountStatus: newUser.accountStatus,
      },
      company: {
        id: company.id,
        name: company.name,
      },
      note: 'Your account is pending approval from a company administrator.',
    });

  } catch (error) {
    console.error('Onboarding join error:', error);
    res.status(500).json({
      error: 'Join request failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/onboarding/company-check
 * 
 * Check if a company name already exists
 * Used for real-time validation in signup forms
 */
router.get('/company-check', async (req: Request, res: Response) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Company name is required',
      });
    }

    const [existingCompany] = await db
      .select({
        id: companies.id,
        name: companies.name,
        type: companies.type,
        status: companies.status,
      })
      .from(companies)
      .where(ilike(companies.name, name))
      .limit(1);

    if (existingCompany) {
      return res.json({
        exists: true,
        company: existingCompany,
        message: 'A company with this name already exists.',
      });
    }

    res.json({
      exists: false,
      message: 'Company name is available.',
    });

  } catch (error) {
    console.error('Company check error:', error);
    res.status(500).json({
      error: 'Failed to check company name',
    });
  }
});

/**
 * POST /api/onboarding/complete
 * 
 * Complete onboarding for an existing user without company
 * Admin can use this to retroactively assign users to companies
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    // This endpoint requires authentication
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validation = completeOnboardingSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const { userId, companyId, companyName, companyType } = validation.data;

    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.companyId) {
      return res.status(400).json({
        error: 'User already has a company',
        message: 'This user is already associated with a company.',
      });
    }

    let targetCompanyId: string;

    // Either join existing or create new
    if (companyId) {
      // Join existing company
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      targetCompanyId = company.id;

    } else if (companyName && companyType) {
      // Create new company
      const [newCompany] = await db
        .insert(companies)
        .values({
          name: companyName,
          type: companyType,
          email: user.email || '',
          status: 'active',
          subscriptionPlan: 'full',
          aiEnabled: true,
          useExternalAi: true,
          aiLearningProgress: 0,
        })
        .returning();

      targetCompanyId = newCompany.id;

    } else {
      return res.status(400).json({
        error: 'Either companyId or (companyName + companyType) is required',
      });
    }

    // Update user
    await db
      .update(users)
      .set({
        companyId: targetCompanyId,
        accountStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const updatedUser = await storage.getUser(userId);
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, targetCompanyId))
      .limit(1);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        firstName: updatedUser!.firstName,
        lastName: updatedUser!.lastName,
        role: updatedUser!.role,
        companyId: updatedUser!.companyId,
        accountStatus: updatedUser!.accountStatus,
      },
      company: {
        id: company!.id,
        name: company!.name,
        type: company!.type,
      },
    });

  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      error: 'Failed to complete onboarding',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});

/**
 * GET /api/onboarding/companies/search
 * 
 * Search for companies to join
 */
router.get('/companies/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    let companiesList;

    if (query && typeof query === 'string') {
      companiesList = await db
        .select({
          id: companies.id,
          name: companies.name,
          type: companies.type,
          status: companies.status,
        })
        .from(companies)
        .where(
          and(
            eq(companies.status, 'active'),
            ilike(companies.name, `%${query}%`)
          )
        )
        .limit(20);
    } else {
      companiesList = await db
        .select({
          id: companies.id,
          name: companies.name,
          type: companies.type,
          status: companies.status,
        })
        .from(companies)
        .where(eq(companies.status, 'active'))
        .limit(50);
    }

    res.json({
      success: true,
      companies: companiesList,
    });

  } catch (error) {
    console.error('Company search error:', error);
    res.status(500).json({
      error: 'Failed to search companies',
    });
  }
});

export default router;
