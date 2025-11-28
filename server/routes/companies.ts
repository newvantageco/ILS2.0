/**
 * Company Management Routes
 *
 * Handles all company-related operations including:
 * - Company CRUD operations
 * - User join requests and approvals
 * - Platform admin company approval workflow
 * - Company member management
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { companies, users, auditLogs } from '@shared/schema';
import { eq, and, like, sql, isNull, or, ne } from 'drizzle-orm';
import { createLogger } from '../utils/logger';
import { authenticateJWT, requireRole, requirePermission } from '../middleware/auth-jwt';
import { emailService } from '../services/EmailService';

const router = Router();
const logger = createLogger('companies');

/**
 * GET /api/companies/joinable
 * Get list of active companies that users can request to join
 * Public for authenticated users without a company
 */
router.get('/joinable', async (req: Request, res: Response) => {
  try {
    // Get all active companies
    const companiesList = await db
      .select({
        id: companies.id,
        name: companies.name,
        type: companies.type,
        email: companies.email,
        status: companies.status,
        createdAt: companies.createdAt,
        memberCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${users}
          WHERE ${users.companyId} = ${companies.id}
          AND ${users.accountStatus} = 'active'
        )`,
      })
      .from(companies)
      .where(eq(companies.status, 'active'))
      .orderBy(companies.name);

    res.json(companiesList);
  } catch (error) {
    logger.error({ error }, 'Error fetching joinable companies');
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * GET /api/companies/my-requests
 * Get current user's pending company join requests
 */
router.get('/my-requests', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For now, check if user has a pending status with a company
    const [user] = await db
      .select({
        companyId: users.companyId,
        accountStatus: users.accountStatus,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.companyId || user.accountStatus !== 'pending') {
      return res.json([]);
    }

    // Get company details
    const [company] = await db
      .select({
        id: companies.id,
        name: companies.name,
      })
      .from(companies)
      .where(eq(companies.id, user.companyId))
      .limit(1);

    if (!company) {
      return res.json([]);
    }

    res.json([{
      id: `${userId}-${company.id}`,
      companyId: company.id,
      companyName: company.name,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    }]);
  } catch (error) {
    logger.error({ error }, 'Error fetching user requests');
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

/**
 * GET /api/companies/pending
 * Get all companies pending approval (platform admin only)
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'platform_admin') {
      return res.status(403).json({ error: 'Platform admin access required' });
    }

    const pendingCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        type: companies.type,
        email: companies.email,
        phone: companies.phone,
        status: companies.status,
        gocNumber: companies.gocNumber,
        practiceType: companies.practiceType,
        subscriptionPlan: companies.subscriptionPlan,
        createdAt: companies.createdAt,
        createdBy: companies.createdBy,
        memberCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${users}
          WHERE ${users.companyId} = ${companies.id}
        )`,
      })
      .from(companies)
      .where(eq(companies.status, 'pending_approval'))
      .orderBy(companies.createdAt);

    res.json(pendingCompanies);
  } catch (error) {
    logger.error({ error }, 'Error fetching pending companies');
    res.status(500).json({ error: 'Failed to fetch pending companies' });
  }
});

/**
 * POST /api/companies/:id/approve
 * Approve a pending company (platform admin only)
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'platform_admin') {
      return res.status(403).json({ error: 'Platform admin access required' });
    }

    // Get company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Company is not pending approval' });
    }

    // Approve the company
    await db
      .update(companies)
      .set({
        status: 'active',
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(companies.id, companyId));

    // Activate the company admin (creator)
    if (company.createdBy) {
      await db
        .update(users)
        .set({
          accountStatus: 'active',
          role: 'company_admin',
        })
        .where(eq(users.id, company.createdBy));
    }

    // Log the approval
    await db.insert(auditLogs).values({
      eventType: 'company.approved',
      userId: userId || 'system',
      targetId: companyId,
      targetType: 'company',
      details: { companyName: company.name },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info(`Company approved: ${company.name} by ${userId}`);

    // Send email notification to company creator
    if (company.createdBy) {
      const [creator] = await db
        .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, company.createdBy))
        .limit(1);

      if (creator?.email) {
        try {
          await emailService.sendCompanyApprovalEmail(
            creator.email,
            `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || 'User',
            company.name
          );
          logger.info(`Approval email sent to ${creator.email}`);
        } catch (emailError) {
          logger.error({ error: emailError }, 'Failed to send approval email');
        }
      }
    }

    res.json({ message: 'Company approved successfully', company: { ...company, status: 'active' } });
  } catch (error) {
    logger.error({ error, companyId: req.params.id }, 'Error approving company');
    res.status(500).json({ error: 'Failed to approve company' });
  }
});

/**
 * POST /api/companies/:id/reject
 * Reject a pending company (platform admin only)
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'platform_admin') {
      return res.status(403).json({ error: 'Platform admin access required' });
    }

    // Get company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Reject the company (set to deactivated)
    await db
      .update(companies)
      .set({
        status: 'deactivated',
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(companies.id, companyId));

    // Remove company association from creator
    if (company.createdBy) {
      await db
        .update(users)
        .set({
          companyId: null,
          accountStatus: 'pending',
        })
        .where(eq(users.id, company.createdBy));
    }

    // Log the rejection
    await db.insert(auditLogs).values({
      eventType: 'company.rejected',
      userId: userId || 'system',
      targetId: companyId,
      targetType: 'company',
      details: { companyName: company.name, reason },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info(`Company rejected: ${company.name} by ${userId}`);

    // Send email notification to company creator
    if (company.createdBy) {
      const [creator] = await db
        .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, company.createdBy))
        .limit(1);

      if (creator?.email) {
        try {
          await emailService.sendCompanyRejectionEmail(
            creator.email,
            `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || 'User',
            company.name,
            reason
          );
          logger.info(`Rejection email sent to ${creator.email}`);
        } catch (emailError) {
          logger.error({ error: emailError }, 'Failed to send rejection email');
        }
      }
    }

    res.json({ message: 'Company rejected', reason });
  } catch (error) {
    logger.error({ error, companyId: req.params.id }, 'Error rejecting company');
    res.status(500).json({ error: 'Failed to reject company' });
  }
});

/**
 * GET /api/companies/all
 * Get all companies (platform admin only)
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'platform_admin') {
      return res.status(403).json({ error: 'Platform admin access required' });
    }

    const allCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        type: companies.type,
        email: companies.email,
        phone: companies.phone,
        status: companies.status,
        subscriptionPlan: companies.subscriptionPlan,
        gocNumber: companies.gocNumber,
        createdAt: companies.createdAt,
        memberCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${users}
          WHERE ${users.companyId} = ${companies.id}
        )`,
        pendingCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${users}
          WHERE ${users.companyId} = ${companies.id}
          AND ${users.accountStatus} = 'pending'
        )`,
      })
      .from(companies)
      .orderBy(companies.createdAt);

    res.json(allCompanies);
  } catch (error) {
    logger.error({ error }, 'Error fetching all companies');
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * GET /api/companies/available
 * Get list of companies users can join (legacy endpoint)
 */
router.get('/available', async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Platform admin sees all companies
    if (userRole === 'platform_admin') {
      const companiesList = await db
        .select({
          id: companies.id,
          name: companies.name,
          type: companies.type,
          industry: sql<string>`COALESCE(${companies.type}, 'General')`,
          size: sql<string>`'Not specified'`,
          createdAt: companies.createdAt,
          memberCount: sql<number>`(
            SELECT COUNT(*)::int
            FROM ${users}
            WHERE ${users.companyId} = ${companies.id}
          )`,
        })
        .from(companies)
        .where(eq(companies.status, 'active'))
        .orderBy(companies.name);

      return res.json(companiesList);
    }

    // Regular users only see their own company
    if (!userCompanyId) {
      return res.status(403).json({
        error: 'No company association',
        message: 'You are not associated with any company'
      });
    }

    const [userCompany] = await db
      .select({
        id: companies.id,
        name: companies.name,
        type: companies.type,
        industry: sql<string>`COALESCE(${companies.type}, 'General')`,
        size: sql<string>`'Not specified'`,
        createdAt: companies.createdAt,
        memberCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${users}
          WHERE ${users.companyId} = ${companies.id}
        )`,
      })
      .from(companies)
      .where(eq(companies.id, userCompanyId))
      .limit(1);

    if (!userCompany) {
      return res.status(404).json({ error: 'Your company not found' });
    }

    res.json([userCompany]);
  } catch (error) {
    logger.error({ error }, 'Error fetching available companies');
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * GET /api/companies/:id
 * Get company details by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Authorization check
    if (userRole !== 'platform_admin' && userCompanyId !== id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own company details'
      });
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const [memberInfo] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.companyId, id));

    res.json({
      ...company,
      memberCount: memberInfo?.count || 0,
    });
  } catch (error) {
    logger.error({ error, companyId: req.params.id }, 'Error fetching company');
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

/**
 * POST /api/companies
 * Create a new company (pending approval)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId: string = req.user.id;
    const { name, type, email, phone, gocNumber, practiceType, industry, size, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Check if user already has a company
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.companyId) {
      return res.status(400).json({ error: 'You are already part of a company' });
    }

    // Map legacy industry to type if needed
    const companyType = type || (industry ? {
      optical_lab: 'lab',
      ecp: 'ecp',
      manufacturing: 'lab',
      distribution: 'supplier',
      retail: 'ecp',
      other: 'ecp'
    }[industry as string] || 'ecp' : 'ecp');

    // Create the company with pending_approval status
    const [newCompany] = await db
      .insert(companies)
      .values({
        name,
        type: companyType as any,
        status: 'pending_approval', // Requires platform admin approval
        email: email || user?.email || '',
        phone: phone || '',
        gocNumber: gocNumber || null,
        practiceType: practiceType || null,
        subscriptionPlan: 'free_ecp',
        aiEnabled: true,
        useExternalAi: true,
        aiLearningProgress: 0,
        createdBy: userId,
      })
      .returning();

    // Associate user with company (pending status)
    await db
      .update(users)
      .set({
        companyId: newCompany.id,
        accountStatus: 'pending', // Pending until company is approved
      })
      .where(eq(users.id, userId));

    // Log the company creation
    await db.insert(auditLogs).values({
      eventType: 'company.created',
      userId: userId,
      targetId: newCompany.id,
      targetType: 'company',
      companyId: newCompany.id,
      details: { companyName: newCompany.name, type: companyType },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info(`Company created (pending approval): ${newCompany.name} by ${userId}`);

    res.json({
      ...newCompany,
      message: 'Company created successfully. Pending platform admin approval.',
    });
  } catch (error) {
    logger.error({ error }, 'Error creating company');
    res.status(500).json({ error: 'Failed to create company' });
  }
});

/**
 * POST /api/companies/join
 * Request to join an existing company
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId: string = req.user.id;
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Check if user already has a company
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.companyId) {
      return res.status(400).json({ error: 'You are already part of a company' });
    }

    // Check if company exists and is active
    const [company] = await db
      .select()
      .from(companies)
      .where(
        and(
          eq(companies.id, companyId),
          eq(companies.status, 'active')
        )
      )
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found or not active' });
    }

    // Update user to join company with pending status
    await db
      .update(users)
      .set({
        companyId,
        accountStatus: 'pending', // Requires company admin approval
      })
      .where(eq(users.id, userId));

    // Log the join request
    await db.insert(auditLogs).values({
      eventType: 'company.join_requested',
      userId: userId,
      targetId: companyId,
      targetType: 'company',
      companyId: companyId,
      details: { companyName: company.name },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info(`User ${userId} requested to join company ${company.name}`);

    res.json({ message: 'Join request submitted successfully. Awaiting company admin approval.' });
  } catch (error) {
    logger.error({ error }, 'Error joining company');
    res.status(500).json({ error: 'Failed to join company' });
  }
});

/**
 * GET /api/companies/:id/pending-members
 * Get pending member requests (company admin only)
 */
router.get('/:id/pending-members', async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check authorization
    const isAuthorized =
      userRole === 'platform_admin' ||
      (userRole === 'company_admin' && userCompanyId === companyId);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to view pending members' });
    }

    const pendingMembers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          eq(users.accountStatus, 'pending')
        )
      );

    res.json(pendingMembers);
  } catch (error) {
    logger.error({ error, companyId: req.params.id }, 'Error fetching pending members');
    res.status(500).json({ error: 'Failed to fetch pending members' });
  }
});

/**
 * GET /api/companies/:id/members
 * Get all members of a company
 */
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check authorization
    const isAuthorized =
      userRole === 'platform_admin' ||
      userCompanyId === companyId;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to view members' });
    }

    const members = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        accountStatus: users.accountStatus,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.companyId, companyId));

    res.json(members);
  } catch (error) {
    logger.error({ error, companyId: req.params.id }, 'Error fetching company members');
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

/**
 * POST /api/companies/:id/members/:memberId/approve
 * Approve a pending member
 */
router.post('/:id/members/:memberId/approve', async (req: Request, res: Response) => {
  try {
    const { id: companyId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check authorization
    const isAuthorized =
      userRole === 'platform_admin' ||
      (userRole === 'company_admin' && userCompanyId === companyId);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to approve members' });
    }

    // Approve the member
    await db
      .update(users)
      .set({
        accountStatus: 'active',
        role: role || 'ecp', // Default role if not specified
      })
      .where(
        and(
          eq(users.id, memberId),
          eq(users.companyId, companyId)
        )
      );

    // Log the approval
    await db.insert(auditLogs).values({
      eventType: 'user.approved',
      userId: userId,
      targetId: memberId,
      targetType: 'user',
      companyId: companyId,
      details: { approvedBy: userId, role: role || 'ecp' },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info(`Member ${memberId} approved by ${userId}`);

    // Send email notification to approved member
    const [approvedMember] = await db
      .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, memberId))
      .limit(1);

    const [companyDetails] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (approvedMember?.email && companyDetails) {
      try {
        await emailService.sendUserApprovalEmail(
          approvedMember.email,
          `${approvedMember.firstName || ''} ${approvedMember.lastName || ''}`.trim() || 'User',
          companyDetails.name,
          role || 'ecp'
        );
        logger.info(`Member approval email sent to ${approvedMember.email}`);
      } catch (emailError) {
        logger.error({ error: emailError }, 'Failed to send member approval email');
      }
    }

    res.json({ message: 'Member approved successfully' });
  } catch (error) {
    logger.error({ error }, 'Error approving member');
    res.status(500).json({ error: 'Failed to approve member' });
  }
});

/**
 * POST /api/companies/:id/members/:memberId/reject
 * Reject a pending member
 */
router.post('/:id/members/:memberId/reject', async (req: Request, res: Response) => {
  try {
    const { id: companyId, memberId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check authorization
    const isAuthorized =
      userRole === 'platform_admin' ||
      (userRole === 'company_admin' && userCompanyId === companyId);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to reject members' });
    }

    // Remove the user from the company
    await db
      .update(users)
      .set({
        companyId: null,
        accountStatus: 'pending',
      })
      .where(eq(users.id, memberId));

    // Log the rejection
    await db.insert(auditLogs).values({
      eventType: 'user.rejected',
      userId: userId,
      targetId: memberId,
      targetType: 'user',
      details: { rejectedBy: userId, reason },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info(`Member ${memberId} rejected by ${userId}`);

    res.json({ message: 'Member request rejected' });
  } catch (error) {
    logger.error({ error }, 'Error rejecting member');
    res.status(500).json({ error: 'Failed to reject member' });
  }
});

/**
 * PATCH /api/companies/:id
 * Update company details
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userCompanyId = req.user?.companyId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check authorization
    const isAuthorized =
      userRole === 'platform_admin' ||
      (userRole === 'company_admin' && userCompanyId === companyId);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to update this company' });
    }

    const allowedFields = [
      'name', 'email', 'phone', 'website', 'address',
      'gocNumber', 'practiceType', 'billingEmail',
      'companyLogoUrl', 'companyLetterheadUrl', 'brandingSettings',
      'settings', 'preferences',
    ];

    const updates: Record<string, any> = { updatedAt: new Date(), updatedBy: userId };
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const [updated] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, companyId))
      .returning();

    res.json(updated);
  } catch (error) {
    logger.error({ error, companyId: req.params.id }, 'Error updating company');
    res.status(500).json({ error: 'Failed to update company' });
  }
});

export default router;
