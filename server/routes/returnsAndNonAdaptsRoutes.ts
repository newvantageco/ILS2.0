import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ReturnsAndNonAdaptService } from '../services/ReturnsAndNonAdaptService';
import { isAuthenticated } from '../replitAuth';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import type { User } from '../../shared/schema';

// Schema definitions
const returnCreateSchema = z.object({
  orderId: z.string(),
  returnReason: z.string(),
  returnType: z.string(),
  description: z.string(),
  processingNotes: z.string().optional(),
  qualityIssueId: z.string().optional(),
});

const returnStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'rejected']),
  processingNotes: z.string().optional(),
});

const nonAdaptCreateSchema = z.object({
  orderId: z.string(),
  description: z.string(),
  processingNotes: z.string().optional(),
  qualityIssueId: z.string().optional(),
});

const nonAdaptStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'rejected']),
  processingNotes: z.string().optional(),
});

const router = Router();
const service = ReturnsAndNonAdaptService.getInstance();

declare global {
  namespace Express {
    interface User extends Record<string, any> {
      id?: string;
      local?: boolean;
      role?: string;
      expires_at?: number;
      claims?: {
        id?: string;
        sub?: string;
      };
    }
  }
}

// Role authorization middleware
const authorizeRoles = (allowedRoles: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !allowedRoles.includes(req.user.role || '')) {
    return res.status(403).json({ error: 'Unauthorized role' });
  }
  next();
};

// Return routes
router.post('/returns', 
  isAuthenticated,
  authorizeRoles(['ecp', 'lab_tech', 'admin']),
  async (req, res) => {
    try {
      const validatedData = returnCreateSchema.parse(req.body);
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }
      const result = await service.createReturn({
        ...validatedData,
        createdBy: userId,
        metadata: {}
      });
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

router.get('/returns',
  isAuthenticated,
  authorizeRoles(['ecp', 'lab_tech', 'admin']),
  async (_req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const returns = await service.getReturnsByDateRange(thirtyDaysAgo, new Date());
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch returns' });
    }
  }
);

router.get('/returns/:id',
  isAuthenticated,
  authorizeRoles(['ecp', 'lab_tech', 'admin']),
  async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const [returnItem] = await service.getReturnsByDateRange(thirtyDaysAgo, new Date())
        .then(returns => returns.filter(r => r.id === req.params.id));
      
      if (!returnItem) {
        return res.status(404).json({ error: 'Return not found' });
      }
      res.json(returnItem);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch return' });
    }
  }
);

router.patch('/returns/:id/status',
  isAuthenticated,
  authorizeRoles(['lab_tech', 'admin']),
  async (req, res) => {
    try {
      const validatedData = returnStatusUpdateSchema.parse(req.body);
      const [updated] = await service.updateReturnStatus(req.params.id, validatedData.status);
      if (!updated) {
        return res.status(404).json({ error: 'Return not found' });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Non-Adapt routes
router.post('/non-adapts',
  isAuthenticated,
  authorizeRoles(['ecp', 'lab_tech', 'admin']),
  async (req, res) => {
    try {
      const validatedData = nonAdaptCreateSchema.parse(req.body);
      if (!req.user?.id) {
        return res.status(401).json({ error: 'User ID not found' });
      }
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User ID not found' });
      }
      const result = await service.createNonAdapt({
        orderId: validatedData.orderId,
        reportedBy: userId,
        patientFeedback: validatedData.description,
        symptoms: [],
      });
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

router.get('/non-adapts',
  isAuthenticated,
  authorizeRoles(['ecp', 'lab_tech', 'admin']),
  async (_req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const nonAdapts = await service.getNonAdaptsByDateRange(thirtyDaysAgo, new Date());
      res.json(nonAdapts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch non-adapts' });
    }
  }
);

router.get('/non-adapts/:id',
  isAuthenticated,
  authorizeRoles(['ecp', 'lab_tech', 'admin']),
  async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const [nonAdapt] = await service.getNonAdaptsByDateRange(thirtyDaysAgo, new Date())
        .then(nonAdapts => nonAdapts.filter(na => na.id === req.params.id));

      if (!nonAdapt) {
        return res.status(404).json({ error: 'Non-adapt not found' });
      }
      res.json(nonAdapt);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch non-adapt' });
    }
  }
);

router.patch('/non-adapts/:id/resolution',
  isAuthenticated,
  authorizeRoles(['lab_tech', 'admin']),
  async (req, res) => {
    try {
      const validatedData = nonAdaptStatusUpdateSchema.parse(req.body);
      const [updated] = await service.updateNonAdaptResolution(
        req.params.id,
        validatedData.processingNotes || '',
        validatedData.status === 'completed' ? 'completed' : undefined
      );
      if (!updated) {
        return res.status(404).json({ error: 'Non-adapt not found' });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Statistics routes
router.get('/stats/returns',
  isAuthenticated,
  authorizeRoles(['lab_tech', 'admin']),
  async (_req, res) => {
    try {
      const stats = await service.getReturnStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch return statistics' });
    }
  }
);

router.get('/stats/non-adapts',
  isAuthenticated,
  authorizeRoles(['lab_tech', 'admin']),
  async (_req, res) => {
    try {
      const stats = await service.getNonAdaptStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch non-adapt statistics' });
    }
  }
);

export default router;