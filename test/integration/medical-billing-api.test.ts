/**
 * Medical Billing & Insurance System API Tests
 * 
 * Comprehensive testing for billing and insurance including:
 * - Insurance company and plan management
 * - Patient insurance coverage tracking
 * - Eligibility verification and history
 * - Pre-authorization requests and status updates
 * - Medical claim creation and submission
 * - Payment processing and posting
 * - Billing code management (CPT, HCPCS, ICD-10)
 * - Billing analytics and reporting
 * - Validation and error handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';

describe('Medical Billing & Insurance API', () => {
  let app: Application;
  let testCompanyId: string;
  let testUserId: string;
  let testPatientId: string;
  let testInsuranceCompanyId: string;
  let testInsurancePlanId: string;
  let testPatientInsuranceId: string;
  let testClaimId: string;
  let testPaymentId: string;
  let testPreauthorizationId: string;
  let testBillingCodeId: string;

  beforeAll(async () => {
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use('/api/medical-billing', (req, res, next) => {
      req.user = {
        id: testUserId || 'test-user-id',
        companyId: testCompanyId || 'test-company-id',
        email: 'test@example.com',
        role: 'ecp'
      };
      next();
    });

    // Import and use medical billing routes
    const medicalBillingRoutes = await import('../../server/routes/medical-billing');
    app.use('/api/medical-billing', medicalBillingRoutes.default);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Insurance Companies Management', () => {
    it('should create insurance company successfully', async () => {
      const insuranceCompanyData = {
        name: 'Test Insurance Company',
        displayName: 'Test Insurance',
        payerId: '12345',
        npi: '1234567890',
        phone: '555-123-4567',
        email: 'test@insurance.com',
        claimSubmissionMethod: 'electronic'
      };

      const response = await request(app)
        .post('/api/medical-billing/insurance-companies')
        .send(insuranceCompanyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.insuranceCompany).toBeDefined();
      expect(response.body.insuranceCompany.name).toBe(insuranceCompanyData.name);
      expect(response.body.insuranceCompany.payerId).toBe(insuranceCompanyData.payerId);
      
      testInsuranceCompanyId = response.body.insuranceCompany.id;
    });

    it('should get insurance companies', async () => {
      const response = await request(app)
        .get('/api/medical-billing/insurance-companies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.insuranceCompanies)).toBe(true);
      expect(response.body.insuranceCompanies.length).toBeGreaterThan(0);
    });

    it('should validate insurance company data', async () => {
      const invalidData = {
        // Missing required name field
        displayName: 'Test Insurance'
      };

      const response = await request(app)
        .post('/api/medical-billing/insurance-companies')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Insurance Plans Management', () => {
    it('should create insurance plan successfully', async () => {
      const insurancePlanData = {
        insuranceCompanyId: testInsuranceCompanyId,
        planName: 'Vision Premier Plan',
        planType: 'ppo',
        planId: 'VP001',
        copaymentAmount: 15.00,
        deductibleAmount: 100.00,
        coinsurancePercentage: 20,
        outOfPocketMaximum: 500.00,
        preauthorizationRequired: true,
        referralRequired: false,
        timelyFilingDays: 365
      };

      const response = await request(app)
        .post('/api/medical-billing/insurance-plans')
        .send(insurancePlanData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.insurancePlan).toBeDefined();
      expect(response.body.insurancePlan.planName).toBe(insurancePlanData.planName);
      expect(response.body.insurancePlan.planType).toBe(insurancePlanData.planType);
      
      testInsurancePlanId = response.body.insurancePlan.id;
    });

    it('should get insurance plans', async () => {
      const response = await request(app)
        .get('/api/medical-billing/insurance-plans')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.insurancePlans)).toBe(true);
      expect(response.body.insurancePlans.length).toBeGreaterThan(0);
    });

    it('should get insurance plans by company', async () => {
      const response = await request(app)
        .get(`/api/medical-billing/insurance-plans?insuranceCompanyId=${testInsuranceCompanyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.insurancePlans.every(plan => plan.insuranceCompanyId === testInsuranceCompanyId)).toBe(true);
    });
  });

  describe('Patient Insurance Management', () => {
    it('should add patient insurance coverage successfully', async () => {
      const patientInsuranceData = {
        patientId: testPatientId || 'test-patient-id',
        insurancePlanId: testInsurancePlanId,
        memberId: 'MEM123456',
        subscriberId: 'SUB123456',
        groupNumber: 'GRP789',
        subscriberFirstName: 'John',
        subscriberLastName: 'Doe',
        subscriberRelationship: 'self',
        priority: 1
      };

      const response = await request(app)
        .post('/api/medical-billing/patient-insurance')
        .send(patientInsuranceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.patientInsurance).toBeDefined();
      expect(response.body.patientInsurance.memberId).toBe(patientInsuranceData.memberId);
      expect(response.body.patientInsurance.priority).toBe(patientInsuranceData.priority);
      
      testPatientInsuranceId = response.body.patientInsurance.id;
    });

    it('should get patient insurance coverages', async () => {
      const response = await request(app)
        .get(`/api/medical-billing/patient-insurance/${testPatientId || 'test-patient-id'}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.patientInsurance)).toBe(true);
      expect(response.body.patientInsurance.length).toBeGreaterThan(0);
    });
  });

  describe('Eligibility Verification', () => {
    it('should verify patient eligibility successfully', async () => {
      const eligibilityData = {
        patientId: testPatientId || 'test-patient-id',
        insurancePlanId: testInsurancePlanId,
        memberId: 'MEM123456',
        verificationDate: new Date().toISOString(),
        status: 'active',
        coverageBeginDate: '2024-01-01',
        coverageEndDate: '2024-12-31',
        copaymentAmount: 15.00,
        deductibleAmount: 100.00,
        deductibleMet: 25.00,
        coinsurancePercentage: 20,
        responseCode: 'A1',
        responseMessage: 'Patient is eligible'
      };

      const response = await request(app)
        .post('/api/medical-billing/eligibility-verification')
        .send(eligibilityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.eligibility).toBeDefined();
      expect(response.body.eligibility.status).toBe(eligibilityData.status);
      expect(response.body.eligibility.memberId).toBe(eligibilityData.memberId);
    });

    it('should get eligibility verification history', async () => {
      const response = await request(app)
        .get(`/api/medical-billing/eligibility-verification/${testPatientId || 'test-patient-id'}/history`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.eligibilityHistory)).toBe(true);
    });
  });

  describe('Pre-authorization Management', () => {
    it('should request pre-authorization successfully', async () => {
      const preauthorizationData = {
        patientId: testPatientId || 'test-patient-id',
        insurancePlanId: testInsurancePlanId,
        requestDate: new Date().toISOString(),
        procedureCode: '92004',
        diagnosisCode: 'H52.13',
        description: 'Comprehensive eye examination'
      };

      const response = await request(app)
        .post('/api/medical-billing/preauthorizations')
        .send(preauthorizationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.preauthorization).toBeDefined();
      expect(response.body.preauthorization.status).toBe('pending');
      expect(response.body.preauthorization.procedureCode).toBe(preauthorizationData.procedureCode);
      
      testPreauthorizationId = response.body.preauthorization.id;
    });

    it('should update pre-authorization status', async () => {
      const updateData = {
        status: 'approved',
        authorizationNumber: 'AUTH123456',
        approvedUnits: 1,
        approvedAmount: 150.00,
        effectiveDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .put(`/api/medical-billing/preauthorizations/${testPreauthorizationId}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.preauthorization.status).toBe('approved');
      expect(response.body.preauthorization.authorizationNumber).toBe(updateData.authorizationNumber);
    });

    it('should get pre-authorizations', async () => {
      const response = await request(app)
        .get('/api/medical-billing/preauthorizations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.preauthorizations)).toBe(true);
    });
  });

  describe('Medical Claims Management', () => {
    it('should create medical claim successfully', async () => {
      const claimData = {
        patientId: testPatientId || 'test-patient-id',
        insurancePlanId: testInsurancePlanId,
        providerId: 'test-provider-id',
        patientAccountNumber: 'ACCT123456',
        serviceFromDate: new Date().toISOString(),
        serviceToDate: new Date().toISOString(),
        totalCharge: 200.00,
        notes: 'Routine eye examination',
        lineItems: [
          {
            serviceDate: new Date().toISOString(),
            procedureCode: '92004',
            diagnosisCode1: 'H52.13',
            description: 'Comprehensive eye examination',
            units: 1,
            chargeAmount: 200.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/medical-billing/medical-claims')
        .send(claimData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.claim).toBeDefined();
      expect(response.body.lineItems).toBeDefined();
      expect(response.body.claim.status).toBe('draft');
      expect(response.body.claim.totalCharge).toBe(claimData.totalCharge);
      expect(response.body.lineItems).toHaveLength(1);
      
      testClaimId = response.body.claim.id;
    });

    it('should submit medical claim', async () => {
      const response = await request(app)
        .post(`/api/medical-billing/medical-claims/${testClaimId}/submit`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.claim.status).toBe('submitted');
      expect(response.body.claim.submissionDate).toBeDefined();
    });

    it('should update claim status', async () => {
      const updateData = {
        status: 'approved',
        allowedAmount: 150.00,
        paidAmount: 120.00,
        patientResponsibility: 30.00,
        acceptanceDate: new Date().toISOString(),
        processedDate: new Date().toISOString(),
        claimControlNumber: 'CC123456'
      };

      const response = await request(app)
        .put(`/api/medical-billing/medical-claims/${testClaimId}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.claim.status).toBe('approved');
      expect(response.body.claim.allowedAmount).toBe(updateData.allowedAmount);
    });

    it('should get medical claims', async () => {
      const response = await request(app)
        .get('/api/medical-billing/medical-claims')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.claims).toBeDefined();
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBeDefined();
      expect(response.body.totalPages).toBeDefined();
    });

    it('should get claim line items', async () => {
      const response = await request(app)
        .get(`/api/medical-billing/medical-claims/${testClaimId}/line-items`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.lineItems)).toBe(true);
      expect(response.body.lineItems.length).toBeGreaterThan(0);
    });
  });

  describe('Payments Management', () => {
    it('should add payment successfully', async () => {
      const paymentData = {
        patientId: testPatientId || 'test-patient-id',
        claimId: testClaimId,
        paymentType: 'insurance_payment',
        amount: 120.00,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'electronic',
        referenceNumber: 'REF123456',
        payerName: 'Test Insurance Company',
        payerType: 'insurance'
      };

      const response = await request(app)
        .post('/api/medical-billing/payments')
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.paymentType).toBe(paymentData.paymentType);
      expect(response.body.payment.amount).toBe(paymentData.amount);
      expect(response.body.payment.status).toBe('pending');
      
      testPaymentId = response.body.payment.id;
    });

    it('should process payment', async () => {
      const updateData = {
        status: 'completed',
        processedDate: new Date().toISOString()
      };

      const response = await request(app)
        .put(`/api/medical-billing/payments/${testPaymentId}/process`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('completed');
      expect(response.body.payment.processedDate).toBeDefined();
    });

    it('should get payments', async () => {
      const response = await request(app)
        .get('/api/medical-billing/payments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);
    });

    it('should filter payments by type', async () => {
      const response = await request(app)
        .get('/api/medical-billing/payments?paymentType=insurance_payment')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payments.every(payment => payment.paymentType === 'insurance_payment')).toBe(true);
    });
  });

  describe('Billing Codes Management', () => {
    it('should add billing code successfully', async () => {
      const billingCodeData = {
        code: '92004',
        codeType: 'cpt',
        description: 'Comprehensive eye examination',
        category: 'Eye Examination',
        subcategory: 'Comprehensive',
        typicalCharge: 200.00,
        medicareAllowance: 150.00
      };

      const response = await request(app)
        .post('/api/medical-billing/billing-codes')
        .send(billingCodeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.billingCode).toBeDefined();
      expect(response.body.billingCode.code).toBe(billingCodeData.code);
      expect(response.body.billingCode.codeType).toBe(billingCodeData.codeType);
      
      testBillingCodeId = response.body.billingCode.id;
    });

    it('should get billing codes', async () => {
      const response = await request(app)
        .get('/api/medical-billing/billing-codes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.billingCodes)).toBe(true);
    });

    it('should filter billing codes by type', async () => {
      const response = await request(app)
        .get('/api/medical-billing/billing-codes?codeType=cpt')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.billingCodes.every(code => code.codeType === 'cpt')).toBe(true);
    });

    it('should search billing codes', async () => {
      const response = await request(app)
        .get('/api/medical-billing/billing-codes?search=92004')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.billingCodes.some(code => code.code.includes('92004'))).toBe(true);
    });
  });

  describe('Billing Analytics', () => {
    it('should get billing summary', async () => {
      const response = await request(app)
        .get('/api/medical-billing/analytics/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary).toHaveProperty('totalClaims');
      expect(response.body.summary).toHaveProperty('submittedClaims');
      expect(response.body.summary).toHaveProperty('paidClaims');
      expect(response.body.summary).toHaveProperty('deniedClaims');
      expect(response.body.summary).toHaveProperty('totalCharges');
      expect(response.body.summary).toHaveProperty('totalPaid');
      expect(response.body.summary).toHaveProperty('paymentBreakdown');
    });

    it('should get patient billing summary', async () => {
      const response = await request(app)
        .get(`/api/medical-billing/patients/${testPatientId || 'test-patient-id'}/billing-summary`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary).toHaveProperty('insuranceCoverages');
      expect(response.body.summary).toHaveProperty('activeClaims');
      expect(response.body.summary).toHaveProperty('recentPayments');
      expect(response.body.summary).toHaveProperty('outstandingBalance');
      expect(response.body.summary).toHaveProperty('totalCharges');
      expect(response.body.summary).toHaveProperty('totalPaid');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      // Create app without auth middleware
      const noAuthApp = express();
      noAuthApp.use(express.json());
      
      const medicalBillingRoutes = await import('../../server/routes/medical-billing');
      noAuthApp.use('/api/medical-billing', medicalBillingRoutes.default);

      const endpoints = [
        '/api/medical-billing/insurance-companies',
        '/api/medical-billing/insurance-plans',
        '/api/medical-billing/patient-insurance',
        '/api/medical-billing/medical-claims',
        '/api/medical-billing/payments',
        '/api/medical-billing/billing-codes'
      ];

      for (const endpoint of endpoints) {
        const response = await request(noAuthApp)
          .get(endpoint)
          .expect(401);
        expect(response.body.error).toBe('Authentication required');
      }
    });

    it('should require company access', async () => {
      // Create app without company context
      const noCompanyApp = express();
      noCompanyApp.use(express.json());
      
      noCompanyApp.use('/api/medical-billing', (req, res, next) => {
        req.user = { id: 'test-user-id', email: 'test@example.com', role: 'ecp' }; // Missing companyId
        next();
      });
      
      const medicalBillingRoutes = await import('../../server/routes/medical-billing');
      noCompanyApp.use('/api/medical-billing', medicalBillingRoutes.default);

      const response = await request(noCompanyApp)
        .get('/api/medical-billing/insurance-companies')
        .expect(403);
      
      expect(response.body.error).toBe('Company context required');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid claim status update', async () => {
      const response = await request(app)
        .put(`/api/medical-billing/medical-claims/${testClaimId}/status`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.error).toBe('Invalid claim status');
    });

    it('should handle invalid payment status update', async () => {
      const response = await request(app)
        .put(`/api/medical-billing/payments/${testPaymentId}/process`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.error).toBe('Invalid payment status');
    });

    it('should handle invalid pre-authorization status update', async () => {
      const response = await request(app)
        .put(`/api/medical-billing/preauthorizations/${testPreauthorizationId}/status`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.error).toBe('Invalid pre-authorization status');
    });

    it('should handle non-existent resource IDs', async () => {
      const response = await request(app)
        .put('/api/medical-billing/medical-claims/non-existent-id/status')
        .send({ status: 'approved' })
        .expect(404);

      expect(response.body.error).toBe('Claim not found');
    });
  });

  describe('Data Validation', () => {
    it('should validate medical claim line items', async () => {
      const invalidClaimData = {
        patientId: testPatientId || 'test-patient-id',
        insurancePlanId: testInsurancePlanId,
        serviceFromDate: new Date().toISOString(),
        serviceToDate: new Date().toISOString(),
        totalCharge: 200.00,
        lineItems: [
          {
            // Missing required chargeAmount
            procedureCode: '92004',
            description: 'Test service'
          }
        ]
      };

      const response = await request(app)
        .post('/api/medical-billing/medical-claims')
        .send(invalidClaimData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate payment amount is non-negative', async () => {
      const invalidPaymentData = {
        patientId: testPatientId || 'test-patient-id',
        paymentType: 'patient_payment',
        amount: -50.00, // Negative amount
        paymentDate: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/medical-billing/payments')
        .send(invalidPaymentData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate billing code type', async () => {
      const invalidBillingCodeData = {
        code: '12345',
        codeType: 'invalid_type',
        description: 'Test code'
      };

      const response = await request(app)
        .post('/api/medical-billing/billing-codes')
        .send(invalidBillingCodeData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Workflow Integration', () => {
    it('should support complete claim workflow', async () => {
      // 1. Create claim
      const claimResponse = await request(app)
        .post('/api/medical-billing/medical-claims')
        .send({
          patientId: testPatientId || 'test-patient-id',
          insurancePlanId: testInsurancePlanId,
          serviceFromDate: new Date().toISOString(),
          serviceToDate: new Date().toISOString(),
          totalCharge: 150.00,
          lineItems: [
            {
              serviceDate: new Date().toISOString(),
              procedureCode: '92004',
              chargeAmount: 150.00
            }
          ]
        })
        .expect(201);

      const claimId = claimResponse.body.claim.id;

      // 2. Submit claim
      await request(app)
        .post(`/api/medical-billing/medical-claims/${claimId}/submit`)
        .expect(200);

      // 3. Update claim status to approved
      await request(app)
        .put(`/api/medical-billing/medical-claims/${claimId}/status`)
        .send({
          status: 'approved',
          allowedAmount: 120.00,
          paidAmount: 100.00,
          patientResponsibility: 20.00
        })
        .expect(200);

      // 4. Add payment
      const paymentResponse = await request(app)
        .post('/api/medical-billing/payments')
        .send({
          patientId: testPatientId || 'test-patient-id',
          claimId: claimId,
          paymentType: 'insurance_payment',
          amount: 100.00,
          paymentDate: new Date().toISOString()
        })
        .expect(201);

      const paymentId = paymentResponse.body.payment.id;

      // 5. Process payment
      await request(app)
        .put(`/api/medical-billing/payments/${paymentId}/process`)
        .send({ status: 'completed' })
        .expect(200);

      // 6. Verify final claim status
      const finalClaimResponse = await request(app)
        .get('/api/medical-billing/medical-claims')
        .expect(200);

      expect(finalClaimResponse.body.claims.some(claim => claim.id === claimId)).toBe(true);
    });
  });
});
