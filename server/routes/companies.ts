import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { companies, users } from '../../shared/schema';
import { eq, and, like, sql, isNull } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/companies/available
 * Get list of companies users can join
 */
router.get('/available', async (req: Request, res: Response) => {
  try {
    // Get all active companies with member count
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

    res.json(companiesList);
  } catch (error) {
    console.error('Error fetching available companies:', error);
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

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get member count
    const [memberInfo] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.companyId, id));

    res.json({
      ...company,
      memberCount: memberInfo?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

/**
 * POST /api/companies
 * Create a new company
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId: string = req.user.id;
    const { name, industry, size, description } = req.body;

    if (!name || !industry || !size) {
      return res.status(400).json({ error: 'Name, industry, and size are required' });
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

    // Map industry to company type
    const companyTypeMap: Record<string, any> = {
      optical_lab: 'lab',
      ecp: 'ecp',
      manufacturing: 'manufacturer',
      distribution: 'supplier',
      retail: 'retail',
      other: 'other'
    };

    // Create the company
    const [newCompany] = await db
      .insert(companies)
      .values({
        name,
        type: companyTypeMap[industry] || 'other',
        status: 'active', // Auto-approve for now
        email: user.email || '',
        subscriptionPlan: 'full',
      })
      .returning();

    // Update user's companyId and set as company admin
    await db
      .update(users)
      .set({ 
        companyId: newCompany.id,
        role: 'company_admin',
        accountStatus: 'active'
      })
      .where(eq(users.id, userId));

    res.json(newCompany);
  } catch (error) {
    console.error('Error creating company:', error);
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

    // Check if company exists
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update user to join company (set status to pending for approval)
    await db
      .update(users)
      .set({ 
        companyId,
        accountStatus: 'pending' // Will need admin approval
      })
      .where(eq(users.id, userId));

    res.json({ message: 'Join request submitted successfully' });
  } catch (error) {
    console.error('Error joining company:', error);
    res.status(500).json({ error: 'Failed to join company' });
  }
});

/**
 * GET /api/companies/:id/members
 * Get all members of a company (admin only)
 */
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId: string = req.user.id;
    const { id: companyId } = req.params;

    // Check if user is admin of this company
    const [currentUser] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.companyId, companyId),
          eq(users.role, 'company_admin')
        )
      )
      .limit(1);

    if (!currentUser) {
      return res.status(403).json({ error: 'You do not have permission to view members' });
    }

    // Get all members
    const members = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        accountStatus: users.accountStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.companyId, companyId));

    res.json(members);
  } catch (error) {
    console.error('Error fetching company members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

/**
 * POST /api/companies/:id/members/:memberId/approve
 * Approve a pending member (admin only)
 */
router.post('/:id/members/:memberId/approve', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId: string = req.user.id;
    const { id: companyId, memberId } = req.params;

    // Check if user is admin of this company
    const [currentUser] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.companyId, companyId),
          eq(users.role, 'company_admin')
        )
      )
      .limit(1);

    if (!currentUser) {
      return res.status(403).json({ error: 'You do not have permission to approve members' });
    }

    // Approve the member
    await db
      .update(users)
      .set({ accountStatus: 'active' })
      .where(
        and(
          eq(users.id, memberId),
          eq(users.companyId, companyId)
        )
      );

    res.json({ message: 'Member approved successfully' });
  } catch (error) {
    console.error('Error approving member:', error);
    res.status(500).json({ error: 'Failed to approve member' });
  }
});

/**
 * POST /api/companies/:id/members/:memberId/reject
 * Reject a pending member (admin only)
 */
router.post('/:id/members/:memberId/reject', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId: string = req.user.id;
    const { id: companyId, memberId } = req.params;

    // Check if user is admin of this company
    const [currentUser] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.companyId, companyId),
          eq(users.role, 'company_admin')
        )
      )
      .limit(1);

    if (!currentUser) {
      return res.status(403).json({ error: 'You do not have permission to reject members' });
    }

    // Remove the user from the company
    await db
      .update(users)
      .set({ 
        companyId: null,
        accountStatus: 'pending'
      })
      .where(eq(users.id, memberId));

    res.json({ message: 'Member request rejected' });
  } catch (error) {
    console.error('Error rejecting member:', error);
    res.status(500).json({ error: 'Failed to reject member' });
  }
});

export default router;
