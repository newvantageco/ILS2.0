import express, { Request, Response } from 'express';
import { ClaimsManagementService } from '../services/rcm/ClaimsManagementService';
import { PaymentProcessingService } from '../services/rcm/PaymentProcessingService';
import { BillingAutomationService } from '../services/rcm/BillingAutomationService';

const router = express.Router();

// ============================================================================
// Claims Management Routes
// ============================================================================

/**
 * @route   POST /api/rcm/claims
 * @desc    Create a new insurance claim
 * @access  Private
 */
router.post('/claims', async (req: Request, res: Response) => {
  try {
    const claim = ClaimsManagementService.createClaim(req.body);
    res.status(201).json({
      success: true,
      data: claim,
      message: 'Claim created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create claim'
    });
  }
});

/**
 * @route   GET /api/rcm/claims/:id
 * @desc    Get claim by ID
 * @access  Private
 */
router.get('/claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = ClaimsManagementService.getClaimById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }
    res.json({
      success: true,
      data: claim
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get claim'
    });
  }
});

/**
 * @route   GET /api/rcm/claims/patient/:patientId
 * @desc    Get claims by patient ID
 * @access  Private
 */
router.get('/claims/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const claims = ClaimsManagementService.getClaimsByPatient(req.params.patientId);
    res.json({
      success: true,
      data: claims,
      count: claims.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get claims'
    });
  }
});

/**
 * @route   GET /api/rcm/claims/provider/:providerId
 * @desc    Get claims by provider ID
 * @access  Private
 */
router.get('/claims/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const claims = ClaimsManagementService.getClaimsByProvider(req.params.providerId);
    res.json({
      success: true,
      data: claims,
      count: claims.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get claims'
    });
  }
});

/**
 * @route   GET /api/rcm/claims/status/:status
 * @desc    Get claims by status
 * @access  Private
 */
router.get('/claims/status/:status', async (req: Request, res: Response) => {
  try {
    const claims = ClaimsManagementService.getClaimsByStatus(req.params.status as any);
    res.json({
      success: true,
      data: claims,
      count: claims.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get claims'
    });
  }
});

/**
 * @route   PUT /api/rcm/claims/:id/validate
 * @desc    Validate a claim
 * @access  Private
 */
router.put('/claims/:id/validate', async (req: Request, res: Response) => {
  try {
    const result = ClaimsManagementService.validateClaim(req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    });
  }
});

/**
 * @route   PUT /api/rcm/claims/:id/submit
 * @desc    Submit a claim
 * @access  Private
 */
router.put('/claims/:id/submit', async (req: Request, res: Response) => {
  try {
    const { submittedBy } = req.body;
    const claim = ClaimsManagementService.submitClaim(req.params.id, submittedBy);
    res.json({
      success: true,
      data: claim,
      message: 'Claim submitted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit claim'
    });
  }
});

/**
 * @route   POST /api/rcm/claims/batch
 * @desc    Submit batch of claims
 * @access  Private
 */
router.post('/claims/batch', async (req: Request, res: Response) => {
  try {
    const { claimIds, submittedBy } = req.body;
    const result = ClaimsManagementService.submitClaimBatch(claimIds, submittedBy);
    res.json({
      success: true,
      data: result,
      message: `Successfully submitted ${result.succeeded} of ${claimIds.length} claims`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch submission failed'
    });
  }
});

/**
 * @route   POST /api/rcm/claims/:id/appeal
 * @desc    File an appeal for a denied claim
 * @access  Private
 */
router.post('/claims/:id/appeal', async (req: Request, res: Response) => {
  try {
    const { appealReason, supportingDocuments, submittedBy } = req.body;
    const appeal = ClaimsManagementService.fileAppeal(
      req.params.id,
      appealReason,
      supportingDocuments,
      submittedBy
    );
    res.status(201).json({
      success: true,
      data: appeal,
      message: 'Appeal filed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to file appeal'
    });
  }
});

/**
 * @route   POST /api/rcm/era/process
 * @desc    Process Electronic Remittance Advice
 * @access  Private
 */
router.post('/era/process', async (req: Request, res: Response) => {
  try {
    const result = ClaimsManagementService.processERA(req.body);
    res.json({
      success: true,
      data: result,
      message: 'ERA processed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process ERA'
    });
  }
});

/**
 * @route   GET /api/rcm/claims/statistics
 * @desc    Get claims statistics
 * @access  Private
 */
router.get('/claims/statistics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, payerId, providerId } = req.query;
    const statistics = ClaimsManagementService.getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      payerId as string | undefined,
      providerId as string | undefined
    );
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    });
  }
});

/**
 * @route   GET /api/rcm/payers
 * @desc    Get all payers
 * @access  Private
 */
router.get('/payers', async (req: Request, res: Response) => {
  try {
    const payers = ClaimsManagementService.getPayers();
    res.json({
      success: true,
      data: payers,
      count: payers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payers'
    });
  }
});

/**
 * @route   POST /api/rcm/payers
 * @desc    Create a new payer
 * @access  Private
 */
router.post('/payers', async (req: Request, res: Response) => {
  try {
    const payer = ClaimsManagementService.createPayer(req.body);
    res.status(201).json({
      success: true,
      data: payer,
      message: 'Payer created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payer'
    });
  }
});

// ============================================================================
// Payment Processing Routes
// ============================================================================

/**
 * @route   POST /api/rcm/payments
 * @desc    Record a payment
 * @access  Private
 */
router.post('/payments', async (req: Request, res: Response) => {
  try {
    const payment = PaymentProcessingService.recordPayment(req.body);
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record payment'
    });
  }
});

/**
 * @route   GET /api/rcm/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get('/payments/:id', async (req: Request, res: Response) => {
  try {
    const payment = PaymentProcessingService.getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment'
    });
  }
});

/**
 * @route   GET /api/rcm/payments/patient/:patientId
 * @desc    Get payments by patient ID
 * @access  Private
 */
router.get('/payments/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const payments = PaymentProcessingService.getPaymentsByPatient(req.params.patientId);
    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payments'
    });
  }
});

/**
 * @route   GET /api/rcm/payments/claim/:claimId
 * @desc    Get payments by claim ID
 * @access  Private
 */
router.get('/payments/claim/:claimId', async (req: Request, res: Response) => {
  try {
    const payments = PaymentProcessingService.getPaymentsByClaim(req.params.claimId);
    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payments'
    });
  }
});

/**
 * @route   PUT /api/rcm/payments/:id/process
 * @desc    Process a payment
 * @access  Private
 */
router.put('/payments/:id/process', async (req: Request, res: Response) => {
  try {
    const { processedBy } = req.body;
    const result = await PaymentProcessingService.processPayment(req.params.id, processedBy);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    res.json({
      success: true,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment'
    });
  }
});

/**
 * @route   POST /api/rcm/payments/:id/refund
 * @desc    Request a refund
 * @access  Private
 */
router.post('/payments/:id/refund', async (req: Request, res: Response) => {
  try {
    const { amount, reason, requestedBy } = req.body;
    const refund = PaymentProcessingService.requestRefund(
      req.params.id,
      amount,
      reason,
      requestedBy
    );
    res.status(201).json({
      success: true,
      data: refund,
      message: 'Refund requested successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request refund'
    });
  }
});

/**
 * @route   PUT /api/rcm/refunds/:id/approve
 * @desc    Approve a refund
 * @access  Private
 */
router.put('/refunds/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body;
    const refund = PaymentProcessingService.approveRefund(req.params.id, approvedBy);
    res.json({
      success: true,
      data: refund,
      message: 'Refund approved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve refund'
    });
  }
});

/**
 * @route   PUT /api/rcm/refunds/:id/process
 * @desc    Process an approved refund
 * @access  Private
 */
router.put('/refunds/:id/process', async (req: Request, res: Response) => {
  try {
    const { processedBy } = req.body;
    const result = await PaymentProcessingService.processRefund(req.params.id, processedBy);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    res.json({
      success: true,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process refund'
    });
  }
});

/**
 * @route   POST /api/rcm/payment-plans
 * @desc    Create a payment plan
 * @access  Private
 */
router.post('/payment-plans', async (req: Request, res: Response) => {
  try {
    const { patientId, totalAmount, downPayment, numberOfPayments, frequency, createdBy } = req.body;
    const plan = PaymentProcessingService.createPaymentPlan(
      patientId,
      totalAmount,
      downPayment,
      numberOfPayments,
      frequency,
      createdBy
    );
    res.status(201).json({
      success: true,
      data: plan,
      message: 'Payment plan created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment plan'
    });
  }
});

/**
 * @route   GET /api/rcm/payment-plans/:id
 * @desc    Get payment plan by ID
 * @access  Private
 */
router.get('/payment-plans/:id', async (req: Request, res: Response) => {
  try {
    const plan = PaymentProcessingService.getPaymentPlanById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Payment plan not found'
      });
    }
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment plan'
    });
  }
});

/**
 * @route   GET /api/rcm/payment-plans/patient/:patientId
 * @desc    Get payment plans by patient ID
 * @access  Private
 */
router.get('/payment-plans/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const plans = PaymentProcessingService.getPaymentPlansByPatient(req.params.patientId);
    res.json({
      success: true,
      data: plans,
      count: plans.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment plans'
    });
  }
});

/**
 * @route   POST /api/rcm/payment-plans/:id/installments
 * @desc    Record an installment payment
 * @access  Private
 */
router.post('/payment-plans/:id/installments', async (req: Request, res: Response) => {
  try {
    const { installmentId, paymentId, recordedBy } = req.body;
    const installment = PaymentProcessingService.recordInstallmentPayment(
      req.params.id,
      installmentId,
      paymentId,
      recordedBy
    );
    res.json({
      success: true,
      data: installment,
      message: 'Installment payment recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record installment payment'
    });
  }
});

/**
 * @route   GET /api/rcm/payment-plans/:id/overdue
 * @desc    Check for overdue installments
 * @access  Private
 */
router.get('/payment-plans/:id/overdue', async (req: Request, res: Response) => {
  try {
    // Check and update overdue installments
    PaymentProcessingService.checkOverdueInstallments();

    // Get the updated plan to check for overdue status
    const plan = PaymentProcessingService.getPaymentPlan(req.params.id);
    res.json({
      success: true,
      data: {
        planId: req.params.id,
        hasOverdue: plan ? plan.daysPastDue > 0 : false,
        daysPastDue: plan?.daysPastDue || 0,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check overdue installments'
    });
  }
});

/**
 * @route   POST /api/rcm/statements
 * @desc    Generate patient statement
 * @access  Private
 */
router.post('/statements', async (req: Request, res: Response) => {
  try {
    const { patientId, previousBalance, newCharges, payments, lineItems, generatedBy } = req.body;
    const statement = PaymentProcessingService.generateStatement(
      patientId,
      previousBalance,
      newCharges,
      payments,
      lineItems,
      generatedBy
    );
    res.status(201).json({
      success: true,
      data: statement,
      message: 'Statement generated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate statement'
    });
  }
});

/**
 * @route   GET /api/rcm/statements/patient/:patientId
 * @desc    Get statements by patient ID
 * @access  Private
 */
router.get('/statements/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const statements = PaymentProcessingService.getStatementsByPatient(req.params.patientId);
    res.json({
      success: true,
      data: statements,
      count: statements.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statements'
    });
  }
});

/**
 * @route   GET /api/rcm/payments/statistics
 * @desc    Get payment statistics
 * @access  Private
 */
router.get('/payments/statistics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, patientId } = req.query;
    const statistics = PaymentProcessingService.getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      patientId as string | undefined
    );
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    });
  }
});

// ============================================================================
// Billing Automation Routes
// ============================================================================

/**
 * @route   POST /api/rcm/charges/capture
 * @desc    Auto-capture charges for an encounter
 * @access  Private
 */
router.post('/charges/capture', async (req: Request, res: Response) => {
  try {
    const { encounterId, patientId, providerId, serviceDate, procedures, createdBy } = req.body;
    const charges = BillingAutomationService.autoCaptureCharges(
      encounterId,
      patientId,
      providerId,
      new Date(serviceDate),
      procedures,
      createdBy
    );
    res.status(201).json({
      success: true,
      data: charges,
      count: charges.length,
      message: `Captured ${charges.length} charges`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture charges'
    });
  }
});

/**
 * @route   POST /api/rcm/charges
 * @desc    Create a charge
 * @access  Private
 */
router.post('/charges', async (req: Request, res: Response) => {
  try {
    const charge = BillingAutomationService.createCharge(req.body);
    res.status(201).json({
      success: true,
      data: charge,
      message: 'Charge created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create charge'
    });
  }
});

/**
 * @route   GET /api/rcm/charges/:id
 * @desc    Get charge by ID
 * @access  Private
 */
router.get('/charges/:id', async (req: Request, res: Response) => {
  try {
    const charge = BillingAutomationService.getChargeById(req.params.id);
    if (!charge) {
      return res.status(404).json({
        success: false,
        error: 'Charge not found'
      });
    }
    res.json({
      success: true,
      data: charge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get charge'
    });
  }
});

/**
 * @route   GET /api/rcm/charges/patient/:patientId
 * @desc    Get charges by patient ID
 * @access  Private
 */
router.get('/charges/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const charges = BillingAutomationService.getChargesByPatient(req.params.patientId);
    res.json({
      success: true,
      data: charges,
      count: charges.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get charges'
    });
  }
});

/**
 * @route   GET /api/rcm/charges/encounter/:encounterId
 * @desc    Get charges by encounter ID
 * @access  Private
 */
router.get('/charges/encounter/:encounterId', async (req: Request, res: Response) => {
  try {
    const charges = BillingAutomationService.getChargesByEncounter(req.params.encounterId);
    res.json({
      success: true,
      data: charges,
      count: charges.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get charges'
    });
  }
});

/**
 * @route   POST /api/rcm/charge-capture-rules
 * @desc    Create charge capture rule
 * @access  Private
 */
router.post('/charge-capture-rules', async (req: Request, res: Response) => {
  try {
    const rule = BillingAutomationService.createChargeCaptureRule(req.body);
    res.status(201).json({
      success: true,
      data: rule,
      message: 'Charge capture rule created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create charge capture rule'
    });
  }
});

/**
 * @route   GET /api/rcm/charge-capture-rules
 * @desc    Get all charge capture rules
 * @access  Private
 */
router.get('/charge-capture-rules', async (req: Request, res: Response) => {
  try {
    const rules = BillingAutomationService.getChargeCaptureRules();
    res.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get charge capture rules'
    });
  }
});

/**
 * @route   POST /api/rcm/collections/cases
 * @desc    Create collections case
 * @access  Private
 */
router.post('/collections/cases', async (req: Request, res: Response) => {
  try {
    const collectionsCase = BillingAutomationService.createCollectionsCase(req.body);
    res.status(201).json({
      success: true,
      data: collectionsCase,
      message: 'Collections case created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create collections case'
    });
  }
});

/**
 * @route   GET /api/rcm/collections/cases/:id
 * @desc    Get collections case by ID
 * @access  Private
 */
router.get('/collections/cases/:id', async (req: Request, res: Response) => {
  try {
    const collectionsCase = BillingAutomationService.getCollectionsCaseById(req.params.id);
    if (!collectionsCase) {
      return res.status(404).json({
        success: false,
        error: 'Collections case not found'
      });
    }
    res.json({
      success: true,
      data: collectionsCase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get collections case'
    });
  }
});

/**
 * @route   GET /api/rcm/collections/cases/patient/:patientId
 * @desc    Get collections cases by patient ID
 * @access  Private
 */
router.get('/collections/cases/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const cases = BillingAutomationService.getCollectionsCasesByPatient(req.params.patientId);
    res.json({
      success: true,
      data: cases,
      count: cases.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get collections cases'
    });
  }
});

/**
 * @route   POST /api/rcm/collections/cases/:id/activities
 * @desc    Add collections activity
 * @access  Private
 */
router.post('/collections/cases/:id/activities', async (req: Request, res: Response) => {
  try {
    const activity = BillingAutomationService.addCollectionsActivity(req.params.id, req.body);
    res.status(201).json({
      success: true,
      data: activity,
      message: 'Collections activity added successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add collections activity'
    });
  }
});

/**
 * @route   GET /api/rcm/collections/cases/:id/activities
 * @desc    Get activities for collections case
 * @access  Private
 */
router.get('/collections/cases/:id/activities', async (req: Request, res: Response) => {
  try {
    const activities = BillingAutomationService.getCollectionsActivitiesByCase(req.params.id);
    res.json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get collections activities'
    });
  }
});

/**
 * @route   POST /api/rcm/write-offs
 * @desc    Create write-off
 * @access  Private
 */
router.post('/write-offs', async (req: Request, res: Response) => {
  try {
    const writeOff = BillingAutomationService.createWriteOff(req.body);
    res.status(201).json({
      success: true,
      data: writeOff,
      message: 'Write-off created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create write-off'
    });
  }
});

/**
 * @route   PUT /api/rcm/write-offs/:id/approve
 * @desc    Approve write-off
 * @access  Private
 */
router.put('/write-offs/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body;
    const writeOff = BillingAutomationService.approveWriteOff(req.params.id, approvedBy);
    res.json({
      success: true,
      data: writeOff,
      message: 'Write-off approved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve write-off'
    });
  }
});

/**
 * @route   PUT /api/rcm/write-offs/:id/reject
 * @desc    Reject write-off
 * @access  Private
 */
router.put('/write-offs/:id/reject', async (req: Request, res: Response) => {
  try {
    const { rejectedBy, rejectionReason } = req.body;
    const writeOff = BillingAutomationService.rejectWriteOff(
      req.params.id,
      rejectedBy,
      rejectionReason
    );
    res.json({
      success: true,
      data: writeOff,
      message: 'Write-off rejected'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject write-off'
    });
  }
});

/**
 * @route   GET /api/rcm/write-offs/patient/:patientId
 * @desc    Get write-offs by patient ID
 * @access  Private
 */
router.get('/write-offs/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const writeOffs = BillingAutomationService.getWriteOffsByPatient(req.params.patientId);
    res.json({
      success: true,
      data: writeOffs,
      count: writeOffs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get write-offs'
    });
  }
});

/**
 * @route   POST /api/rcm/fee-schedules
 * @desc    Create fee schedule
 * @access  Private
 */
router.post('/fee-schedules', async (req: Request, res: Response) => {
  try {
    const feeSchedule = BillingAutomationService.createFeeSchedule(req.body);
    res.status(201).json({
      success: true,
      data: feeSchedule,
      message: 'Fee schedule created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create fee schedule'
    });
  }
});

/**
 * @route   GET /api/rcm/fee-schedules
 * @desc    Get all fee schedules
 * @access  Private
 */
router.get('/fee-schedules', async (req: Request, res: Response) => {
  try {
    const { payerId } = req.query;
    const feeSchedules = BillingAutomationService.getFeeSchedules(payerId as string | undefined);
    res.json({
      success: true,
      data: feeSchedules,
      count: feeSchedules.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get fee schedules'
    });
  }
});

/**
 * @route   POST /api/rcm/payer-contracts
 * @desc    Create payer contract
 * @access  Private
 */
router.post('/payer-contracts', async (req: Request, res: Response) => {
  try {
    const contract = BillingAutomationService.createPayerContract(req.body);
    res.status(201).json({
      success: true,
      data: contract,
      message: 'Payer contract created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payer contract'
    });
  }
});

/**
 * @route   GET /api/rcm/payer-contracts
 * @desc    Get all payer contracts
 * @access  Private
 */
router.get('/payer-contracts', async (req: Request, res: Response) => {
  try {
    const { payerId } = req.query;
    const contracts = BillingAutomationService.getPayerContracts(payerId as string | undefined);
    res.json({
      success: true,
      data: contracts,
      count: contracts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payer contracts'
    });
  }
});

/**
 * @route   GET /api/rcm/billing/statistics
 * @desc    Get billing statistics
 * @access  Private
 */
router.get('/billing/statistics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, patientId, providerId } = req.query;
    const statistics = BillingAutomationService.getStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      patientId as string | undefined,
      providerId as string | undefined
    );
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    });
  }
});

/**
 * @route   POST /api/rcm/billing/aging-report
 * @desc    Generate aging report
 * @access  Private
 */
router.post('/billing/aging-report', async (req: Request, res: Response) => {
  try {
    const { asOfDate, patientId } = req.body;
    const report = BillingAutomationService.generateAgingReport(
      asOfDate ? new Date(asOfDate) : new Date(),
      patientId
    );
    res.json({
      success: true,
      data: report,
      message: 'Aging report generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate aging report'
    });
  }
});

export default router;
