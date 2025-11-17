/**
 * Patient Portal API Tests
 * 
 * Comprehensive testing for patient portal functionality including:
 * - Patient profile management and preferences
 * - Appointment scheduling and management
 * - Medical records access (read-only)
 * - Secure messaging with providers
 * - Document management and sharing
 * - Health metrics and wellness tracking
 * - Billing information and payments
 * - Notifications and reminders
 * - Validation and error handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';

describe('Patient Portal API', () => {
  let app: Application;
  let testCompanyId: string;
  let testUserId: string;
  let testPatientId: string;
  let testProviderId: string;
  let testAppointmentId: string;
  let testMessageId: string;
  let testDocumentId: string;
  let testHealthMetricId: string;
  let testNotificationId: string;

  beforeAll(async () => {
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use('/api/patient-portal', (req, res, next) => {
      req.user = {
        id: testUserId || 'test-patient-id',
        companyId: testCompanyId || 'test-company-id',
        email: 'patient@example.com',
        role: 'patient'
      };
      next();
    });

    // Import and use patient portal routes
    const patientPortalRoutes = await import('../../server/routes/patient-portal-v2');
    app.use('/api/patient-portal', patientPortalRoutes.default);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Patient Profile Management', () => {
    it('should get patient profile successfully', async () => {
      const response = await request(app)
        .get('/api/patient-portal/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.patient).toBeDefined();
      expect(response.body.profile.portalSettings).toBeDefined();
      expect(response.body.profile.portalSettings.preferredLanguage).toBeDefined();
      expect(response.body.profile.portalSettings.notificationPreferences).toBeDefined();
    });

    it('should update patient profile successfully', async () => {
      const profileData = {
        preferredLanguage: 'es',
        timezone: 'America/New_York',
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
          appointmentReminders: true,
          billingNotifications: true,
          healthUpdates: false
        },
        privacySettings: {
          shareWithFamily: false,
          allowResearchData: false,
          marketingConsent: false
        }
      };

      const response = await request(app)
        .put('/api/patient-portal/profile')
        .send(profileData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.portalSettings.preferredLanguage).toBe('es');
      expect(response.body.profile.portalSettings.timezone).toBe('America/New_York');
    });

    it('should validate profile update data', async () => {
      const invalidData = {
        preferredLanguage: 123, // Invalid type
        notificationPreferences: {
          email: 'true' // Invalid type
        }
      };

      const response = await request(app)
        .put('/api/patient-portal/profile')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Appointment Management', () => {
    it('should get patient appointments', async () => {
      const response = await request(app)
        .get('/api/patient-portal/appointments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.appointments)).toBe(true);
    });

    it('should filter appointments by status', async () => {
      const response = await request(app)
        .get('/api/patient-portal/appointments?status=scheduled')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.appointments)).toBe(true);
    });

    it('should request new appointment successfully', async () => {
      const appointmentData = {
        providerId: testProviderId || 'test-provider-id',
        serviceType: 'eye_exam',
        preferredDate: new Date().toISOString(),
        preferredTime: '10:00 AM',
        reasonForVisit: 'Annual eye examination',
        notes: 'Patient experiencing mild headaches'
      };

      const response = await request(app)
        .post('/api/patient-portal/appointments/request')
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.appointmentRequest).toBeDefined();
      expect(response.body.appointmentRequest.serviceType).toBe(appointmentData.serviceType);
      expect(response.body.appointmentRequest.status).toBe('pending');
      
      testAppointmentId = response.body.appointmentRequest.id;
    });

    it('should cancel appointment successfully', async () => {
      const response = await request(app)
        .post(`/api/patient-portal/appointments/${testAppointmentId}/cancel`)
        .send({ reason: 'Patient needs to reschedule' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Appointment cancelled successfully');
    });

    it('should validate appointment request data', async () => {
      const invalidData = {
        preferredDate: 'invalid-date',
        reasonForVisit: 123 // Invalid type
      };

      const response = await request(app)
        .post('/api/patient-portal/appointments/request')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Medical Records Access', () => {
    it('should get patient medical records', async () => {
      const response = await request(app)
        .get('/api/patient-portal/medical-records')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.records).toBeDefined();
    });

    it('should filter medical records by type', async () => {
      const response = await request(app)
        .get('/api/patient-portal/medical-records?recordType=medications')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.records.medications).toBeDefined();
    });

    it('should get specific record types', async () => {
      const recordTypes = ['medications', 'allergies', 'vital_signs', 'lab_results', 'immunizations'];
      
      for (const recordType of recordTypes) {
        const response = await request(app)
          .get(`/api/patient-portal/medical-records?recordType=${recordType}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.records).toBeDefined();
      }
    });
  });

  describe('Billing Information', () => {
    it('should get patient billing information', async () => {
      const response = await request(app)
        .get('/api/patient-portal/billing')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.billingInfo).toBeDefined();
      expect(response.body.billingInfo.activeClaims).toBeDefined();
      expect(response.body.billingInfo.recentPayments).toBeDefined();
      expect(response.body.billingInfo.summary).toBeDefined();
      expect(response.body.billingInfo.summary.outstandingBalance).toBeDefined();
    });

    it('should process patient payment successfully', async () => {
      const paymentData = {
        amount: 50.00,
        paymentMethod: 'credit_card',
        paymentToken: 'tok_test_payment',
        description: 'Copayment for office visit',
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345'
        },
        savePaymentMethod: false
      };

      const response = await request(app)
        .post('/api/patient-portal/billing/payments')
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.amount).toBe(paymentData.amount);
      expect(response.body.payment.paymentType).toBe('patient_payment');
      expect(response.body.payment.status).toBe('pending');
    });

    it('should validate payment data', async () => {
      const invalidData = {
        amount: -50.00, // Negative amount
        paymentMethod: 'invalid_method'
      };

      const response = await request(app)
        .post('/api/patient-portal/billing/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Messaging System', () => {
    it('should send message to provider successfully', async () => {
      const messageData = {
        recipientId: testProviderId || 'test-provider-id',
        recipientType: 'provider',
        subject: 'Question about medication',
        message: 'I have a question about the side effects of my new prescription.',
        priority: 'normal'
      };

      const response = await request(app)
        .post('/api/patient-portal/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.message.subject).toBe(messageData.subject);
      expect(response.body.message.isRead).toBe(false);
      
      testMessageId = response.body.message.id;
    });

    it('should get patient messages', async () => {
      const response = await request(app)
        .get('/api/patient-portal/messages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.messages)).toBe(true);
    });

    it('should filter messages by folder', async () => {
      const folders = ['inbox', 'sent', 'all'];
      
      for (const folder of folders) {
        const response = await request(app)
          .get(`/api/patient-portal/messages?folder=${folder}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.messages)).toBe(true);
      }
    });

    it('should validate message data', async () => {
      const invalidData = {
        recipientId: '', // Empty string
        recipientType: 'invalid_type',
        subject: '', // Empty string
        message: '', // Empty string
        priority: 'invalid_priority'
      };

      const response = await request(app)
        .post('/api/patient-portal/messages')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Document Management', () => {
    it('should upload patient document successfully', async () => {
      const documentData = {
        documentType: 'lab_result',
        title: 'Blood Test Results',
        description: 'Complete blood count from recent lab work',
        fileUrl: 'https://example.com/files/lab-result.pdf',
        fileName: 'lab-result.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        isShared: false
      };

      const response = await request(app)
        .post('/api/patient-portal/documents')
        .send(documentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.document).toBeDefined();
      expect(response.body.document.title).toBe(documentData.title);
      expect(response.body.document.documentType).toBe(documentData.documentType);
      expect(response.body.document.status).toBe('active');
      
      testDocumentId = response.body.document.id;
    });

    it('should get patient documents', async () => {
      const response = await request(app)
        .get('/api/patient-portal/documents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.documents)).toBe(true);
    });

    it('should filter documents by type', async () => {
      const documentTypes = ['lab_result', 'imaging', 'prescription', 'insurance_card', 'id_document', 'other'];
      
      for (const docType of documentTypes) {
        const response = await request(app)
          .get(`/api/patient-portal/documents?documentType=${docType}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.documents)).toBe(true);
      }
    });

    it('should validate document upload data', async () => {
      const invalidData = {
        documentType: 'invalid_type',
        title: '', // Empty string
        fileUrl: '', // Empty string
        fileName: '', // Empty string
        fileSize: -1000 // Negative size
      };

      const response = await request(app)
        .post('/api/patient-portal/documents')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Health Metrics Tracking', () => {
    it('should record health metric successfully', async () => {
      const metricData = {
        metricType: 'blood_pressure',
        value: 120.80,
        unit: 'mmHg',
        measuredAt: new Date().toISOString(),
        notes: 'Taken after resting for 5 minutes',
        deviceInfo: 'Home blood pressure monitor'
      };

      const response = await request(app)
        .post('/api/patient-portal/health-metrics')
        .send(metricData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.metric).toBeDefined();
      expect(response.body.metric.metricType).toBe(metricData.metricType);
      expect(response.body.metric.value).toBe(metricData.value);
      expect(response.body.metric.unit).toBe(metricData.unit);
      
      testHealthMetricId = response.body.metric.id;
    });

    it('should get patient health metrics', async () => {
      const response = await request(app)
        .get('/api/patient-portal/health-metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.metrics)).toBe(true);
    });

    it('should filter health metrics by type', async () => {
      const metricTypes = ['blood_pressure', 'weight', 'blood_sugar', 'temperature', 'heart_rate', 'oxygen_saturation', 'custom'];
      
      for (const metricType of metricTypes) {
        const response = await request(app)
          .get(`/api/patient-portal/health-metrics?metricType=${metricType}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.metrics)).toBe(true);
      }
    });

    it('should filter health metrics by date range', async () => {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get(`/api/patient-portal/health-metrics?dateFrom=${lastWeek.toISOString()}&dateTo=${today.toISOString()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.metrics)).toBe(true);
    });

    it('should validate health metric data', async () => {
      const invalidData = {
        metricType: 'invalid_type',
        value: 'invalid_value', // Should be number
        unit: '', // Empty string
        measuredAt: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/patient-portal/health-metrics')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Notifications Management', () => {
    it('should get patient notifications', async () => {
      const response = await request(app)
        .get('/api/patient-portal/notifications')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    it('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/patient-portal/notifications?unreadOnly=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/patient-portal/notifications/${testNotificationId || 'test-notification-id'}/read`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notification).toBeDefined();
    });
  });

  describe('Dashboard Summary', () => {
    it('should get patient dashboard summary', async () => {
      const response = await request(app)
        .get('/api/patient-portal/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
      expect(response.body.dashboard.upcomingAppointments).toBeDefined();
      expect(response.body.dashboard.unreadMessages).toBeDefined();
      expect(response.body.dashboard.activeMedications).toBeDefined();
      expect(response.body.dashboard.recentLabResults).toBeDefined();
      expect(response.body.dashboard.billingSummary).toBeDefined();
      expect(response.body.dashboard.summary).toBeDefined();
      expect(response.body.dashboard.summary.upcomingAppointmentsCount).toBeDefined();
      expect(response.body.dashboard.summary.unreadMessagesCount).toBeDefined();
      expect(response.body.dashboard.summary.outstandingBalance).toBeDefined();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      // Create app without auth middleware
      const noAuthApp = express();
      noAuthApp.use(express.json());
      
      const patientPortalRoutes = await import('../../server/routes/patient-portal-v2');
      noAuthApp.use('/api/patient-portal', patientPortalRoutes.default);

      const endpoints = [
        '/api/patient-portal/profile',
        '/api/patient-portal/appointments',
        '/api/patient-portal/medical-records',
        '/api/patient-portal/billing',
        '/api/patient-portal/messages',
        '/api/patient-portal/documents',
        '/api/patient-portal/health-metrics',
        '/api/patient-portal/notifications',
        '/api/patient-portal/dashboard'
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
      
      noCompanyApp.use('/api/patient-portal', (req, res, next) => {
        req.user = { id: 'test-user-id', email: 'test@example.com', role: 'ecp' }; // Missing companyId
        next();
      });
      
      const patientPortalRoutes = await import('../../server/routes/patient-portal-v2');
      noCompanyApp.use('/api/patient-portal', patientPortalRoutes.default);

      const response = await request(noCompanyApp)
        .get('/api/patient-portal/profile')
        .expect(403);
      
      expect(response.body.error).toBe('Company context required');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent resource IDs', async () => {
      const response = await request(app)
        .put('/api/patient-portal/notifications/non-existent-id/read')
        .expect(500);

      expect(response.body.error).toBe('Failed to mark notification as read');
    });

    it('should handle server errors gracefully', async () => {
      // Test with malformed data that would cause server error
      const response = await request(app)
        .get('/api/patient-portal/medical-records?recordType=invalid_type')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate enum values for message recipient type', async () => {
      const invalidMessageData = {
        recipientId: 'test-provider-id',
        recipientType: 'invalid_type',
        subject: 'Test Subject',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/patient-portal/messages')
        .send(invalidMessageData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate enum values for health metric type', async () => {
      const invalidMetricData = {
        metricType: 'invalid_type',
        value: 120,
        unit: 'mmHg',
        measuredAt: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/patient-portal/health-metrics')
        .send(invalidMetricData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate enum values for document type', async () => {
      const invalidDocumentData = {
        documentType: 'invalid_type',
        title: 'Test Document',
        fileUrl: 'https://example.com/test.pdf',
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf'
      };

      const response = await request(app)
        .post('/api/patient-portal/documents')
        .send(invalidDocumentData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Workflow Integration', () => {
    it('should support complete patient portal workflow', async () => {
      // 1. Update profile
      await request(app)
        .put('/api/patient-portal/profile')
        .send({
          preferredLanguage: 'en',
          notificationPreferences: { email: true }
        })
        .expect(200);

      // 2. Request appointment
      const appointmentResponse = await request(app)
        .post('/api/patient-portal/appointments/request')
        .send({
          serviceType: 'eye_exam',
          preferredDate: new Date().toISOString(),
          reasonForVisit: 'Routine checkup'
        })
        .expect(201);

      // 3. Send message to provider
      await request(app)
        .post('/api/patient-portal/messages')
        .send({
          recipientId: 'test-provider-id',
          recipientType: 'provider',
          subject: 'Appointment question',
          message: 'I have a question about my upcoming appointment'
        })
        .expect(201);

      // 4. Upload document
      await request(app)
        .post('/api/patient-portal/documents')
        .send({
          documentType: 'insurance_card',
          title: 'Insurance Card',
          fileUrl: 'https://example.com/insurance.pdf',
          fileName: 'insurance.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf'
        })
        .expect(201);

      // 5. Record health metric
      await request(app)
        .post('/api/patient-portal/health-metrics')
        .send({
          metricType: 'weight',
          value: 150.5,
          unit: 'lbs',
          measuredAt: new Date().toISOString()
        })
        .expect(201);

      // 6. Get dashboard summary
      const dashboardResponse = await request(app)
        .get('/api/patient-portal/dashboard')
        .expect(200);

      expect(dashboardResponse.body.success).toBe(true);
      expect(dashboardResponse.body.dashboard).toBeDefined();
    });
  });
});
