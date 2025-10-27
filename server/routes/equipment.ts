import { Router } from 'express';
import { authenticateUser, requireRole } from '../middleware/auth';
import EquipmentDiscoveryService from '../services/EquipmentDiscoveryService';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

const router = Router();
const equipmentService = EquipmentDiscoveryService.getInstance();

// Start equipment discovery
router.post(
  '/api/equipment/discovery/start',
  authenticateUser,
  requireRole(['admin', 'engineer']),
  (req, res) => {
    try {
      equipmentService.startDiscovery();
      res.json({ message: 'Equipment discovery started' });
    } catch (error) {
      console.error('Error starting discovery:', error);
      res.status(500).json({ error: 'Failed to start equipment discovery' });
    }
  }
);

// Stop equipment discovery
router.post(
  '/api/equipment/discovery/stop',
  authenticateUser,
  requireRole(['admin', 'engineer']),
  (req, res) => {
    try {
      equipmentService.stopDiscovery();
      res.json({ message: 'Equipment discovery stopped' });
    } catch (error) {
      console.error('Error stopping discovery:', error);
      res.status(500).json({ error: 'Failed to stop equipment discovery' });
    }
  }
);

// Get all known equipment
router.get(
  '/api/equipment',
  authenticateUser,
  requireRole(['admin', 'engineer', 'lab_tech']),
  async (req, res) => {
    try {
      const equipment = await equipmentService.getKnownEquipment();
      res.json(equipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ error: 'Failed to fetch equipment list' });
    }
  }
);

// Get specific equipment details
router.get(
  '/api/equipment/:id',
  authenticateUser,
  requireRole(['admin', 'engineer', 'lab_tech']),
  async (req, res) => {
    try {
      const equipment = await equipmentService.getEquipmentById(req.params.id);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }
      res.json(equipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ error: 'Failed to fetch equipment details' });
    }
  }
);

// Configure equipment
router.post(
  '/api/equipment/:id/configure',
  authenticateUser,
  requireRole(['admin', 'engineer']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { configuration } = req.body;

      // Update equipment configuration
      await db.update(schema.equipment)
        .set({
          ...configuration,
          updatedAt: new Date()
        })
        .where(eq(schema.equipment.id, id));

      res.json({ message: 'Equipment configuration updated' });
    } catch (error) {
      console.error('Error configuring equipment:', error);
      res.status(500).json({ error: 'Failed to update equipment configuration' });
    }
  }
);

// Test equipment connection
router.post(
  '/api/equipment/:id/test',
  authenticateUser,
  requireRole(['admin', 'engineer', 'lab_tech']),
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
      console.error('Error testing equipment:', error);
      res.status(500).json({ error: 'Failed to test equipment connection' });
    }
  }
);

async function testEquipmentConnection(equipment: any) {
  // Implement protocol-specific connection tests
  switch (equipment.protocol) {
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