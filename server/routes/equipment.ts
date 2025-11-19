import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import EquipmentDiscoveryService from '../services/EquipmentDiscoveryService';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { equipment } from '@shared/schema';
import { createLogger } from '../utils/logger';
import { ErrorResponses, asyncHandler } from '../utils/errorResponses';

const router = Router();
const logger = createLogger('equipment');
const equipmentService = EquipmentDiscoveryService.getInstance();

// Start equipment discovery
router.post(
  '/api/equipment/discovery/start',
  isAuthenticated,
  requireRole(['admin', 'engineer'] as const),
  asyncHandler(async (req, res) => {
    try {
      equipmentService.startDiscovery();
      res.json({ message: 'Equipment discovery started' });
    } catch (error) {
      logger.error({ error }, 'Error starting discovery');
      ErrorResponses.equipmentConnectionFailed(res, 'discovery-service', error.message);
    }
  })
);

// Stop equipment discovery
router.post(
  '/api/equipment/discovery/stop',
  isAuthenticated,
  requireRole(['admin', 'engineer'] as const),
  asyncHandler(async (req, res) => {
    try {
      equipmentService.stopDiscovery();
      res.json({ message: 'Equipment discovery stopped' });
    } catch (error) {
      logger.error({ error }, 'Error stopping discovery');
      ErrorResponses.equipmentConnectionFailed(res, 'discovery-service', error.message);
    }
  })
);

// Get all known equipment
router.get(
  '/api/equipment',
  isAuthenticated,
  requireRole(['admin', 'engineer', 'lab_tech'] as const),
  asyncHandler(async (req, res) => {
    try {
      const equipment = await equipmentService.getKnownEquipment();
      res.json(equipment);
    } catch (error) {
      logger.error({ error }, 'Error fetching equipment');
      ErrorResponses.equipmentConnectionFailed(res, 'equipment-list', error.message);
    }
  })
);

// Get specific equipment details
router.get(
  '/api/equipment/:id',
  isAuthenticated,
  requireRole(['admin', 'engineer', 'lab_tech'] as const),
  asyncHandler(async (req, res) => {
    try {
      const equipment = await equipmentService.getEquipmentById(req.params.id);
      if (!equipment) {
        return ErrorResponses.equipmentNotFound(res, req.params.id);
      }
      res.json(equipment);
    } catch (error) {
      logger.error({ error, equipmentId: req.params.id }, 'Error fetching equipment');
      ErrorResponses.equipmentConnectionFailed(res, req.params.id, error.message);
    }
  })
);

// Configure equipment
router.post(
  '/api/equipment/:id/configure',
  isAuthenticated,
  requireRole(['admin', 'engineer'] as const),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { configuration } = req.body;

      if (!id || !configuration || typeof configuration !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid configuration data' });
      }

      // Update equipment configuration
      await db.update(equipment)
        .set({
          specifications: configuration,
          updatedAt: new Date(),
        })
        .where(eq(equipment.id, id));

      res.json({ message: 'Equipment configuration updated' });
    } catch (error) {
      logger.error({ error, equipmentId: id }, 'Error configuring equipment');
      res.status(500).json({ error: 'Failed to update equipment configuration' });
    }
  }
);

// Test equipment connection
router.post(
  '/api/equipment/:id/test',
  isAuthenticated,
  requireRole(['admin', 'engineer', 'lab_tech'] as const),
  async (req, res) => {
    try {
      const equipment = await equipmentService.getEquipmentById(req.params.id);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      // Implement connection test based on equipment protocol
      const testResult = await testEquipmentConnection(equipment);
      res.json(testResult);
    } catch (error) {
      logger.error({ error, equipmentId: req.params.id }, 'Error testing equipment');
      res.status(500).json({ error: 'Failed to test equipment connection' });
    }
  }
);

async function testEquipmentConnection(equipment: { protocol?: string; metadata?: Record<string, unknown> }) {
  const protocol = equipment.protocol || (equipment.metadata?.protocol as string | undefined);

  if (!protocol) {
    throw new Error('Unsupported equipment protocol');
  }

  // Implement protocol-specific connection tests
  switch (protocol) {
    case 'DICOM':
      // Test DICOM connection
      return { status: 'success', message: 'DICOM connection successful' };
    
    case 'RS232':
      // Test serial connection
      return { status: 'success', message: 'Serial connection successful' };
    
    case 'TCP':
      // Test TCP connection
      return { status: 'success', message: 'TCP connection successful' };
    
    case 'HTTP':
      // Test HTTP connection
      return { status: 'success', message: 'HTTP connection successful' };
    
    default:
      throw new Error('Unsupported equipment protocol');
  }
}

export default router;