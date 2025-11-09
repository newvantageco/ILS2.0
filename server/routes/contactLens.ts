/**
 * Contact Lens API Routes
 *
 * RESTful API for contact lens management:
 * - Assessments
 * - Fittings
 * - Prescriptions
 * - Aftercare
 * - Inventory
 * - Orders
 */

import { Router } from "express";
import { ContactLensService } from "../services/ContactLensService.js";
import { requireAuth } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

// ==================== ASSESSMENTS ====================

// Create assessment
router.post("/assessments", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const assessment = await ContactLensService.createAssessment({
      ...req.body,
      companyId,
    });
    res.json(assessment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient assessments
router.get("/assessments/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { patientId } = req.params;
    const assessments = await ContactLensService.getPatientAssessments(patientId, companyId);
    res.json(assessments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest assessment
router.get("/assessments/patient/:patientId/latest", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { patientId } = req.params;
    const assessment = await ContactLensService.getLatestAssessment(patientId, companyId);
    res.json(assessment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FITTINGS ====================

// Create fitting
router.post("/fittings", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const fitting = await ContactLensService.createFitting({
      ...req.body,
      companyId,
    });
    res.json(fitting);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient fittings
router.get("/fittings/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { patientId } = req.params;
    const fittings = await ContactLensService.getPatientFittings(patientId, companyId);
    res.json(fittings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PRESCRIPTIONS ====================

// Create prescription
router.post("/prescriptions", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const prescription = await ContactLensService.createPrescription({
      ...req.body,
      companyId,
    });
    res.json(prescription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient prescriptions
router.get("/prescriptions/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { patientId } = req.params;
    const prescriptions = await ContactLensService.getPatientPrescriptions(patientId, companyId);
    res.json(prescriptions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get active prescription
router.get("/prescriptions/patient/:patientId/active", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { patientId } = req.params;
    const prescription = await ContactLensService.getActivePrescription(patientId, companyId);
    res.json(prescription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deactivate prescription
router.post("/prescriptions/:prescriptionId/deactivate", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { prescriptionId } = req.params;
    const prescription = await ContactLensService.deactivatePrescription(prescriptionId, companyId);
    res.json(prescription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AFTERCARE ====================

// Create aftercare appointment
router.post("/aftercare", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const aftercare = await ContactLensService.createAftercareAppointment({
      ...req.body,
      companyId,
    });
    res.json(aftercare);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update aftercare
router.put("/aftercare/:aftercareId", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { aftercareId } = req.params;
    const aftercare = await ContactLensService.updateAftercare(aftercareId, companyId, req.body);
    res.json(aftercare);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient aftercare
router.get("/aftercare/patient/:patientId", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { patientId } = req.params;
    const aftercare = await ContactLensService.getPatientAftercare(patientId, companyId);
    res.json(aftercare);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming aftercare
router.get("/aftercare/upcoming", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const daysAhead = req.query.days ? parseInt(req.query.days as string) : 30;
    const aftercare = await ContactLensService.getUpcomingAftercare(companyId, daysAhead);
    res.json(aftercare);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVENTORY ====================

// Find inventory item
router.post("/inventory/find", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { brand, baseCurve, diameter, power, cylinder, axis, addition } = req.body;
    const item = await ContactLensService.findInventoryItem(
      companyId,
      brand,
      baseCurve,
      diameter,
      power,
      cylinder,
      axis,
      addition
    );
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get("/inventory/low-stock", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const items = await ContactLensService.getLowStockItems(companyId);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory stock
router.post("/inventory/:inventoryId/update-stock", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { inventoryId } = req.params;
    const { quantityChange } = req.body;
    const item = await ContactLensService.updateInventoryStock(inventoryId, companyId, quantityChange);
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTICS ====================

// Get CL statistics
router.get("/statistics", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const stats = await ContactLensService.getStatistics(
      companyId,
      startDate as string,
      endDate as string
    );
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NHS ELIGIBILITY ====================

// Check NHS eligibility
router.get("/nhs-eligibility/:patientId", requireAuth, async (req, res) => {
  try {
    const companyId = req.user!.companyId!;
    const { patientId } = req.params;
    const eligibility = await ContactLensService.checkNhsEligibility(patientId, companyId);
    res.json(eligibility);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
