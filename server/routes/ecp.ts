/**
 * ECP Routes - Eye Care Professional Features
 * Handles test rooms, GOC compliance, prescription templates, and clinical protocols
 */

import { Router, type Request, type Response } from "express";
import { db } from "../../db";
import logger from "../utils/logger";
import { 
  testRooms, 
  testRoomBookings,
  equipment,
  calibrationRecords,
  remoteSessions,
  gocComplianceChecks, 
  prescriptionTemplates, 
  clinicalProtocols,
  prescriptions,
  users,
  companies,
  patients,
  type InsertTestRoom,
  type InsertGocComplianceCheck,
  type InsertPrescriptionTemplate,
  type InsertClinicalProtocol,
  insertTestRoomSchema,
  insertGocComplianceCheckSchema,
  insertPrescriptionTemplateSchema,
  insertClinicalProtocolSchema,
} from "@shared/schema";
import { eq, and, desc, sql, between, gte, lte, isNull } from "drizzle-orm";
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error fetching test rooms");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Check if user has admin permissions
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin' && user[0].role !== 'platform_admin') {
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error creating test room");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Check if user has admin permissions
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin' && user[0].role !== 'platform_admin') {
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error updating test room");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Check if user has admin permissions
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin' && user[0].role !== 'platform_admin') {
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error deleting test room");
    res.status(500).json({ message: "Failed to delete test room" });
  }
});

// ============== TEST ROOM BOOKINGS ==============

// Get test room bookings
router.get('/test-room-bookings', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Get bookings with room and patient details
    const bookings = await db
      .select({
        booking: testRoomBookings,
        room: testRooms,
        patient: patients,
      })
      .from(testRoomBookings)
      .innerJoin(testRooms, eq(testRoomBookings.testRoomId, testRooms.id))
      .leftJoin(patients, eq(testRoomBookings.patientId, patients.id))
      .where(eq(testRooms.companyId, user[0].companyId))
      .orderBy(desc(testRoomBookings.bookingDate));

    res.json(bookings);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error fetching test room bookings");
    res.status(500).json({ message: "Failed to fetch test room bookings" });
  }
});

// Get bookings for a specific date and room
router.get('/test-room-bookings/date/:date/room/:roomId', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { date, roomId } = req.params;
    const bookingDate = new Date(date);
    
    // Get start and end of day
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await db
      .select()
      .from(testRoomBookings)
      .where(
        and(
          eq(testRoomBookings.testRoomId, roomId),
          gte(testRoomBookings.bookingDate, startOfDay),
          lte(testRoomBookings.bookingDate, endOfDay)
        )
      )
      .orderBy(testRoomBookings.startTime);

    res.json(bookings);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error fetching bookings for date");
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// Create test room booking
router.post('/test-room-bookings', isAuthenticated, async (req: any, res: Response) => {
  try {
    logger.info({ body: req.body }, "Booking creation request");
    
    const userId = req.user?.claims?.sub;
    if (!userId) {
      logger.info({}, "Error: No userId found");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      logger.info({}, "Error: User not found or no companyId");
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Check for booking conflicts
    const { testRoomId, startTime, endTime, bookingDate, appointmentType, patientId } = req.body;
    
    logger.info({ testRoomId, startTime, endTime, bookingDate, appointmentType, patientId }, "Extracted fields");
    
    // Validate required fields
    if (!testRoomId || !startTime || !endTime || !bookingDate) {
      logger.info({}, "Error: Missing required fields");
      return res.status(400).json({ message: "Missing required fields" });
    }

    const conflicts = await db
      .select()
      .from(testRoomBookings)
      .where(
        and(
          eq(testRoomBookings.testRoomId, testRoomId),
          eq(testRoomBookings.status, 'scheduled'),
          sql`DATE(${testRoomBookings.bookingDate}) = DATE(${bookingDate})`,
          sql`${testRoomBookings.startTime} < ${endTime}`,
          sql`${testRoomBookings.endTime} > ${startTime}`
        )
      );

    logger.info({ conflictCount: conflicts.length }, "Conflicts found");

    if (conflicts.length > 0) {
      logger.info({ conflicts }, "Conflict details");
      return res.status(409).json({ 
        message: "Booking conflict detected", 
        conflicts 
      });
    }

    logger.info({
      testRoomId,
      bookingDate: new Date(bookingDate),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      appointmentType: appointmentType || null,
      patientId: patientId || null,
      userId,
      status: 'scheduled',
      isRemoteSession: false,
    }, "Creating booking with values");

    const [booking] = await db
      .insert(testRoomBookings)
      .values({
        testRoomId,
        bookingDate: new Date(bookingDate),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        appointmentType: appointmentType || null,
        patientId: patientId || null,
        userId,
        status: 'scheduled',
        isRemoteSession: false,
      })
      .returning();

    logger.info({ bookingId: booking.id }, "Booking created successfully");
    res.status(201).json(booking);
  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, "Error creating booking");
    res.status(500).json({ 
      message: "Failed to create booking", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Update booking status
router.patch('/test-room-bookings/:id/status', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { status } = req.body;
    const [booking] = await db
      .update(testRoomBookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(testRoomBookings.id, req.params.id))
      .returning();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error updating booking status");
    res.status(500).json({ message: "Failed to update booking status" });
  }
});

// Delete booking (soft delete - booking data preserved for audit)
router.delete('/test-room-bookings/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Soft delete - set deletedAt timestamp instead of hard delete
    await db
      .update(testRoomBookings)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
      } as any)
      .where(eq(testRoomBookings.id, req.params.id));

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error deleting booking");
    res.status(500).json({ message: "Failed to delete booking" });
  }
});

// ============== EQUIPMENT & CALIBRATION ==============

// Get equipment for company
router.get('/equipment', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const equipmentList = await db
      .select()
      .from(equipment)
      .where(eq(equipment.companyId, user[0].companyId))
      .orderBy(equipment.name);

    res.json(equipmentList);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error fetching equipment");
    res.status(500).json({ message: "Failed to fetch equipment" });
  }
});

// Get calibration records
router.get('/calibration-records', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const records = await db
      .select({
        calibration: calibrationRecords,
        equipment: equipment,
      })
      .from(calibrationRecords)
      .innerJoin(equipment, eq(calibrationRecords.equipmentId, equipment.id))
      .where(eq(equipment.companyId, user[0].companyId))
      .orderBy(desc(calibrationRecords.calibrationDate));

    res.json(records);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error fetching calibration records");
    res.status(500).json({ message: "Failed to fetch calibration records" });
  }
});

// Record calibration
router.post('/calibration-records', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [record] = await db
      .insert(calibrationRecords)
      .values({
        ...req.body,
        performedBy: userId,
      })
      .returning();

    res.status(201).json(record);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error recording calibration");
    res.status(500).json({ message: "Failed to record calibration" });
  }
});

// ============== REMOTE ACCESS ==============

// Get remote sessions
router.get('/remote-sessions', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    const sessions = await db
      .select({
        session: remoteSessions,
        prescription: prescriptions,
        patient: patients,
      })
      .from(remoteSessions)
      .leftJoin(prescriptions, eq(remoteSessions.prescriptionId, prescriptions.id))
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(eq(remoteSessions.companyId, user[0].companyId))
      .orderBy(desc(remoteSessions.createdAt));

    res.json(sessions);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error fetching remote sessions");
    res.status(500).json({ message: "Failed to fetch remote sessions" });
  }
});

// Create remote session
router.post('/remote-sessions', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Generate access token
    const accessToken = `remote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [session] = await db
      .insert(remoteSessions)
      .values({
        ...req.body,
        companyId: user[0].companyId,
        requestedBy: userId,
        accessToken,
        status: 'pending',
      })
      .returning();

    res.status(201).json(session);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error creating remote session");
    res.status(500).json({ message: "Failed to create remote session" });
  }
});

// Approve/revoke remote session
router.patch('/remote-sessions/:id/status', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { status } = req.body;
    const updates: any = { status, updatedAt: new Date() };

    if (status === 'approved') {
      updates.approvedBy = userId;
      updates.approvedAt = new Date();
    } else if (status === 'revoked') {
      updates.revokedAt = new Date();
    }

    const [session] = await db
      .update(remoteSessions)
      .set(updates)
      .where(eq(remoteSessions.id, req.params.id))
      .returning();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error updating session status");
    res.status(500).json({ message: "Failed to update session status" });
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error fetching GOC compliance checks");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error creating GOC compliance check");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error fetching prescription templates");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Only ECPs can create prescription templates
    if (user[0].role !== 'ecp' && user[0].role !== 'company_admin' && user[0].role !== 'admin' && user[0].role !== 'platform_admin') {
      return res.status(403).json({ message: "Only ECPs and admins can create prescription templates" });
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error creating prescription template");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error updating prescription template");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error updating template usage");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
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
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error fetching clinical protocols");
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Only admins and ECPs can create protocols
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin' && user[0].role !== 'ecp' && user[0].role !== 'platform_admin') {
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
    logger.error({ error: error instanceof Error ? error.message : String(error), companyId: user[0]?.companyId, userId }, 'Error creating clinical protocol');
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user.length || !user[0].companyId) {
      return res.status(403).json({ message: "User must belong to a company" });
    }

    // Only admins can update protocols
    if (user[0].role !== 'company_admin' && user[0].role !== 'admin' && user[0].role !== 'platform_admin') {
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
    logger.error({ error: error instanceof Error ? error.message : String(error), protocolId: req.params.id, companyId: user[0]?.companyId }, 'Error updating clinical protocol');
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

    // PERFORMANCE: Only fetch needed columns instead of all user data
    const user = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
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
    logger.error({ error: error instanceof Error ? error.message : String(error), companyId: user[0]?.companyId }, 'Error fetching GOC status');
    res.status(500).json({ message: "Failed to fetch GOC status" });
  }
});

export default router;
