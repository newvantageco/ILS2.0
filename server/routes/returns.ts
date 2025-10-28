import { Router } from 'express';
import { ReturnsAndNonAdaptService } from '../services/ReturnsAndNonAdaptService';
import { isAuthenticated } from '../replitAuth';
import { 
  createReturnSchema, 
  updateReturnStatusSchema,
  createNonAdaptSchema,
  updateNonAdaptStatusSchema
} from '@shared/schema';
import { fromZodError } from 'zod-validation-error';
import { ZodError } from 'zod';

const router = Router();
const service = ReturnsAndNonAdaptService.getInstance();

// Role authorization middleware
const authorizeRoles = (allowedRoles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
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
      const validatedData = createReturnSchema.parse(req.body);
      const result = await service.createReturn(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
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
      const returns = await service.getAllReturns();
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
      const returnItem = await service.getReturnById(req.params.id);
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
      const validatedData = updateReturnStatusSchema.parse(req.body);
      const updated = await service.updateReturnStatus(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: 'Return not found' });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
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
      const validatedData = createNonAdaptSchema.parse(req.body);
      const result = await service.createNonAdapt(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
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
      const nonAdapts = await service.getAllNonAdapts();
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
      const nonAdapt = await service.getNonAdaptById(req.params.id);
      if (!nonAdapt) {
        return res.status(404).json({ error: 'Non-adapt not found' });
      }
      res.json(nonAdapt);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch non-adapt' });
    }
  }
);

router.patch('/non-adapts/:id/status',
  isAuthenticated,
  authorizeRoles(['lab_tech', 'admin']),
  async (req, res) => {
    try {
      const validatedData = updateNonAdaptStatusSchema.parse(req.body);
      const updated = await service.updateNonAdaptStatus(req.params.id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: 'Non-adapt not found' });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
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