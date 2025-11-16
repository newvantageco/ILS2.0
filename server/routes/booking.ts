/**
 * Advanced Booking API Routes
 *
 * Endpoints for the world-class online diary/booking system
 */

import express from "express";
import { advancedBookingService } from "../services/booking/AdvancedBookingService.js";
import { authenticateUser } from "../middleware/auth.js";
import { createLogger } from "../utils/logger.js";

const router = express.Router();
const logger = createLogger('booking');

/**
 * Get available time slots
 * GET /api/booking/slots
 */
router.get("/slots", async (req, res) => {
  try {
    const { companyId, providerId, startDate, endDate, duration } = req.query;

    if (!companyId || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const slots = await advancedBookingService.getAvailableSlots({
      companyId: companyId as string,
      providerId: providerId as string | undefined,
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      duration: duration ? parseInt(duration as string) : 30,
    });

    res.json({ slots });
  } catch (error: any) {
    logger.error({ error, practitionerId, date }, 'Error fetching available slots');
    res.status(500).json({ error: error.message || "Failed to fetch available slots" });
  }
});

/**
 * Create a new booking
 * POST /api/booking/create
 */
router.post("/create", async (req, res) => {
  try {
    const {
      patientId,
      providerId,
      appointmentType,
      preferredDate,
      duration,
      roomId,
      notes,
      isOnlineBooking,
    } = req.body;

    if (!patientId || !providerId || !appointmentType || !preferredDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const appointment = await advancedBookingService.createBooking({
      patientId,
      providerId,
      appointmentType,
      preferredDate: new Date(preferredDate),
      duration: duration || 30,
      roomId,
      notes,
      isOnlineBooking: isOnlineBooking || false,
    });

    res.status(201).json({ appointment });
  } catch (error: any) {
    logger.error({ error, patientId, practitionerId, slotTime }, 'Error creating booking');
    res.status(500).json({ error: error.message || "Failed to create booking" });
  }
});

/**
 * Cancel an appointment
 * POST /api/booking/:id/cancel
 */
router.post("/:id/cancel", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await advancedBookingService.cancelAppointment(id, reason);

    res.json({ message: "Appointment cancelled successfully" });
  } catch (error: any) {
    logger.error({ error, appointmentId }, 'Error cancelling appointment');
    res.status(500).json({ error: error.message || "Failed to cancel appointment" });
  }
});

/**
 * Mark appointment as no-show
 * POST /api/booking/:id/no-show
 */
router.post("/:id/no-show", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    await advancedBookingService.markNoShow(id);

    res.json({ message: "Appointment marked as no-show" });
  } catch (error: any) {
    logger.error({ error, appointmentId }, 'Error marking no-show');
    res.status(500).json({ error: error.message || "Failed to mark no-show" });
  }
});

/**
 * Send appointment confirmation
 * POST /api/booking/:id/confirm
 */
router.post("/:id/confirm", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { channel } = req.body;

    await advancedBookingService.sendConfirmation(id, channel || 'both');

    res.json({ message: "Confirmation sent successfully" });
  } catch (error: any) {
    logger.error({ error, appointmentId }, 'Error sending confirmation');
    res.status(500).json({ error: error.message || "Failed to send confirmation" });
  }
});

/**
 * Get booking statistics
 * GET /api/booking/stats
 */
router.get("/stats", authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.companyId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start and end dates required" });
    }

    const stats = await advancedBookingService.getBookingStats(
      user.companyId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ stats });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching booking stats');
    res.status(500).json({ error: error.message || "Failed to fetch statistics" });
  }
});

/**
 * Get provider utilization
 * GET /api/booking/utilization/:providerId
 */
router.get("/utilization/:providerId", authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.companyId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { providerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start and end dates required" });
    }

    const utilization = await advancedBookingService.getProviderUtilization(
      user.companyId,
      providerId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({ utilization });
  } catch (error: any) {
    logger.error({ error }, 'Error fetching utilization');
    res.status(500).json({ error: error.message || "Failed to fetch utilization" });
  }
});

export default router;
