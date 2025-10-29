/**
 * ECP Routes - Eye Care Professional Features
 * Handles test rooms, GOC compliance, prescription templates, and clinical protocols
 */

import { Router, type Request, type Response } from "express";
import { db } from "../../db";
import { 
  testRooms, 
  gocComplianceChecks, 
  prescriptionTemplates, 
  clinicalProtocols,
  prescriptions,
  users,
  companies,
  type InsertTestRoom,
  type InsertGocComplianceCheck,
  type InsertPrescriptionTemplate,
  type InsertClinicalProtocol,
  insertTestRoomSchema,
  insertGocComplianceCheckSchema,
  insertPrescriptionTemplateSchema,
  insertClinicalProtocolSchema,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { isAuthenticated } from "../replitAuth";

const router = Router();

// ============== TEST ROOMS ==============

// Get all test rooms for a company
router.get('/test-rooms', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const rooms = await db
      .select()
      .from(testRooms)
      .where(and(
        eq(testRooms.companyId, user[0].companyId),
        eq(testRooms.isActive, true)
      ))
      .orderBy(testRooms.displayOrder);

    res.json(rooms);
  } catch (error) {
    console.error("Error fetching test rooms:", error);
    res.status(500).json({ message: "Failed to fetch test rooms" });
  }
});

// Create a new test room
router.post('/test-rooms', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Check if user has admin permissions
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin') {
      return res.status(403).json({ message: "Only admins can create test rooms" });
    }

    const validation = insertTestRoomSchema.safeParse({
      ...req.body,
      companyId: user[0].companyId,
    });

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.issues 
      });
    }

    const [room] = await db.insert(testRooms).values(validation.data).returning();
    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating test room:", error);
    res.status(500).json({ message: "Failed to create test room" });
  }
});

// Update test room
router.put('/test-rooms/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Check if user has admin permissions
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin') {
      return res.status(403).json({ message: "Only admins can update test rooms" });
    }

    const [room] = await db
      .update(testRooms)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(and(
        eq(testRooms.id, req.params.id),
        eq(testRooms.companyId, user[0].companyId)
      ))
      .returning();

    if (!room) {
      return res.status(404).json({ message: "Test room not found" });
    }

    res.json(room);
  } catch (error) {
    console.error("Error updating test room:", error);
    res.status(500).json({ message: "Failed to update test room" });
  }
});

// Delete (deactivate) test room
router.delete('/test-rooms/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Check if user has admin permissions
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin') {
      return res.status(403).json({ message: "Only admins can delete test rooms" });
    }

    const [room] = await db
      .update(testRooms)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(
        eq(testRooms.id, req.params.id),
        eq(testRooms.companyId, user[0].companyId)
      ))
      .returning();

    if (!room) {
      return res.status(404).json({ message: "Test room not found" });
    }

    res.json({ message: "Test room deactivated", room });
  } catch (error) {
    console.error("Error deleting test room:", error);
    res.status(500).json({ message: "Failed to delete test room" });
  }
});

// ============== GOC COMPLIANCE CHECKS ==============

// Get GOC compliance checks for company
router.get('/goc-compliance', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const checks = await db
      .select()
      .from(gocComplianceChecks)
      .where(eq(gocComplianceChecks.companyId, user[0].companyId))
      .orderBy(desc(gocComplianceChecks.checkDate))
      .limit(100);

    res.json(checks);
  } catch (error) {
    console.error("Error fetching GOC compliance checks:", error);
    res.status(500).json({ message: "Failed to fetch GOC compliance checks" });
  }
});

// Create GOC compliance check
router.post('/goc-compliance', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const validation = insertGocComplianceCheckSchema.safeParse({
      ...req.body,
      companyId: user[0].companyId,
    });

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.issues 
      });
    }

    const [check] = await db.insert(gocComplianceChecks).values(validation.data).returning();
    res.status(201).json(check);
  } catch (error) {
    console.error("Error creating GOC compliance check:", error);
    res.status(500).json({ message: "Failed to create GOC compliance check" });
  }
});

// ============== PRESCRIPTION TEMPLATES ==============

// Get prescription templates
router.get('/prescription-templates', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const templates = await db
      .select()
      .from(prescriptionTemplates)
      .where(and(
        eq(prescriptionTemplates.companyId, user[0].companyId),
        eq(prescriptionTemplates.isActive, true)
      ))
      .orderBy(desc(prescriptionTemplates.usageCount));

    res.json(templates);
  } catch (error) {
    console.error("Error fetching prescription templates:", error);
    res.status(500).json({ message: "Failed to fetch prescription templates" });
  }
});

// Create prescription template
router.post('/prescription-templates', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Only ECPs can create prescription templates
    if (user[0].role !== 'ecp' && user[0].role !== 'company_admin' && user[0].role !== 'admin') {
      return res.status(403).json({ message: "Only ECPs can create prescription templates" });
    }

    const validation = insertPrescriptionTemplateSchema.safeParse({
      ...req.body,
      companyId: user[0].companyId,
      createdBy: userId,
    });

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.issues 
      });
    }

    const [template] = await db.insert(prescriptionTemplates).values(validation.data).returning();
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating prescription template:", error);
    res.status(500).json({ message: "Failed to create prescription template" });
  }
});

// Update prescription template
router.put('/prescription-templates/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const [template] = await db
      .update(prescriptionTemplates)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(and(
        eq(prescriptionTemplates.id, req.params.id),
        eq(prescriptionTemplates.companyId, user[0].companyId)
      ))
      .returning();

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error updating prescription template:", error);
    res.status(500).json({ message: "Failed to update prescription template" });
  }
});

// Increment template usage count
router.post('/prescription-templates/:id/use', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const [template] = await db
      .update(prescriptionTemplates)
      .set({
        usageCount: sql`${prescriptionTemplates.usageCount} + 1`,
      })
      .where(and(
        eq(prescriptionTemplates.id, req.params.id),
        eq(prescriptionTemplates.companyId, user[0].companyId)
      ))
      .returning();

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error updating template usage:", error);
    res.status(500).json({ message: "Failed to update template usage" });
  }
});

// ============== CLINICAL PROTOCOLS ==============

// Get clinical protocols
router.get('/clinical-protocols', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const protocols = await db
      .select()
      .from(clinicalProtocols)
      .where(eq(clinicalProtocols.companyId, user[0].companyId))
      .orderBy(desc(clinicalProtocols.createdAt));

    res.json(protocols);
  } catch (error) {
    console.error("Error fetching clinical protocols:", error);
    res.status(500).json({ message: "Failed to fetch clinical protocols" });
  }
});

// Create clinical protocol
router.post('/clinical-protocols', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Only admins and ECPs can create protocols
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin' && user[0].role !== 'ecp') {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const validation = insertClinicalProtocolSchema.safeParse({
      ...req.body,
      companyId: user[0].companyId,
      createdBy: userId,
    });

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validation.error.issues 
      });
    }

    const [protocol] = await db.insert(clinicalProtocols).values(validation.data).returning();
    res.status(201).json(protocol);
  } catch (error) {
    console.error("Error creating clinical protocol:", error);
    res.status(500).json({ message: "Failed to create clinical protocol" });
  }
});

// Update clinical protocol
router.put('/clinical-protocols/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Only admins can update protocols
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin') {
      return res.status(403).json({ message: "Only admins can update protocols" });
    }

    const [protocol] = await db
      .update(clinicalProtocols)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(and(
        eq(clinicalProtocols.id, req.params.id),
        eq(clinicalProtocols.companyId, user[0].companyId)
      ))
      .returning();

    if (!protocol) {
      return res.status(404).json({ message: "Protocol not found" });
    }

    res.json(protocol);
  } catch (error) {
    console.error("Error updating clinical protocol:", error);
    res.status(500).json({ message: "Failed to update clinical protocol" });
  }
});

// ============== GOC PRACTITIONER STATUS ==============

// Get GOC status for all practitioners in company
router.get('/goc-status', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Get all users in company with GOC details
    const practitioners = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        gocRegistrationNumber: users.gocRegistrationNumber,
        gocRegistrationType: users.gocRegistrationType,
        professionalQualifications: users.professionalQualifications,
        gocRegistrationExpiry: users.gocRegistrationExpiry,
        indemnityInsuranceProvider: users.indemnityInsuranceProvider,
        indemnityExpiryDate: users.indemnityExpiryDate,
        cpdCompleted: users.cpdCompleted,
        cpdLastUpdated: users.cpdLastUpdated,
        canPrescribe: users.canPrescribe,
        canDispense: users.canDispense,
      })
      .from(users)
      .where(and(
        eq(users.companyId, user[0].companyId),
        eq(users.isActive, true)
      ));

    // Check for expiring registrations/insurance
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const statusReport = practitioners.map(practitioner => {
      const warnings = [];
      
      if (practitioner.gocRegistrationExpiry) {
        const expiryDate = new Date(practitioner.gocRegistrationExpiry);
        if (expiryDate < now) {
          warnings.push({ type: 'goc_expired', message: 'GOC registration has expired' });
        } else if (expiryDate < thirtyDaysFromNow) {
          warnings.push({ type: 'goc_expiring', message: 'GOC registration expiring soon' });
        }
      }

      if (practitioner.indemnityExpiryDate) {
        const expiryDate = new Date(practitioner.indemnityExpiryDate);
        if (expiryDate < now) {
          warnings.push({ type: 'insurance_expired', message: 'Indemnity insurance has expired' });
        } else if (expiryDate < thirtyDaysFromNow) {
          warnings.push({ type: 'insurance_expiring', message: 'Indemnity insurance expiring soon' });
        }
      }

      if (!practitioner.cpdCompleted) {
        warnings.push({ type: 'cpd_incomplete', message: 'CPD requirements not completed' });
      }

      return {
        ...practitioner,
        warnings,
        isCompliant: warnings.length === 0,
      };
    });

    res.json(statusReport);
  } catch (error) {
    console.error("Error fetching GOC status:", error);
    res.status(500).json({ message: "Failed to fetch GOC status" });
  }
});

export default router;
