/**
 * Appointment API Tests
 * 
 * Test appointment API endpoints without direct database access
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';

describe('Appointment API Endpoints', () => {
  let app: Application;
  let authToken: string;

  beforeAll(async () => {
    // Create a test Express app
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use('/api/appointments', (req, res, next) => {
      req.user = {
        id: 'test-user-id',
        companyId: 'test-company-id',
        email: 'test@example.com',
        role: 'ecp'
      };
      next();
    });

    // Import and use appointment routes
    const appointmentsRoutes = await import('../../server/routes/appointments');
    app.use('/api/appointments', appointmentsRoutes.default);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('POST /api/appointments', () => {
    it('should validate appointment data', async () => {
      const invalidData = {
        // Missing required fields
        title: 'Test Appointment'
      };

      const response = await request(app)
        .post('/api/appointments')
        .send(invalidData)
        .expect(400);

      expect(response.body).toBeDefined();
    });

    it('should validate time range', async () => {
      const invalidTimeData = {
        patientId: 'test-patient-id',
        title: 'Test Appointment',
        type: 'eye_examination',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Before start time
        duration: 60
      };

      const response = await request(app)
        .post('/api/appointments')
        .send(invalidTimeData)
        .expect(500);

      expect(response.body.error).toContain('End time must be after start time');
    });

    it('should validate appointment type', async () => {
      const invalidTypeData = {
        patientId: 'test-patient-id',
        title: 'Test Appointment',
        type: 'invalid_type',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        duration: 60
      };

      const response = await request(app)
        .post('/api/appointments')
        .send(invalidTypeData)
        .expect(400);
    });

    it('should require authentication', async () => {
      // Create app without auth middleware
      const noAuthApp = express();
      noAuthApp.use(express.json());
      
      const appointmentsRoutes = await import('../../server/routes/appointments');
      noAuthApp.use('/api/appointments', appointmentsRoutes.default);

      const response = await request(noAuthApp)
        .post('/api/appointments')
        .send({
          patientId: 'test-patient-id',
          title: 'Test Appointment',
          type: 'eye_examination',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          duration: 60
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('GET /api/appointments', () => {
    it('should require authentication', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      
      const appointmentsRoutes = await import('../../server/routes/appointments');
      noAuthApp.use('/api/appointments', appointmentsRoutes.default);

      const response = await request(noAuthApp)
        .get('/api/appointments')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should accept query parameters', async () => {
      const response = await request(app)
        .get('/api/appointments?page=1&limit=10&status=scheduled')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.appointments).toBeDefined();
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBe(1);
    });
  });

  describe('POST /api/appointments/check-availability', () => {
    it('should validate availability check data', async () => {
      const response = await request(app)
        .post('/api/appointments/check-availability')
        .send({
          practitionerId: 'test-practitioner-id',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.isAvailable).toBe('boolean');
    });

    it('should require practitioner ID', async () => {
      const response = await request(app)
        .post('/api/appointments/check-availability')
        .send({
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
        })
        .expect(400);
    });
  });

  describe('GET /api/appointments/available-slots', () => {
    it('should validate time slots query', async () => {
      const response = await request(app)
        .get('/api/appointments/available-slots?practitionerId=test-practitioner-id&date=2024-12-20&duration=30')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.availableSlots)).toBe(true);
      expect(response.body.practitionerId).toBe('test-practitioner-id');
      expect(response.body.duration).toBe(30);
    });

    it('should require practitioner ID', async () => {
      const response = await request(app)
        .get('/api/appointments/available-slots?date=2024-12-20')
        .expect(400);
    });
  });

  describe('POST /api/appointments/waitlist', () => {
    it('should validate waitlist data', async () => {
      const response = await request(app)
        .post('/api/appointments/waitlist')
        .send({
          patientId: 'test-patient-id',
          appointmentType: 'eye_examination',
          contactMethod: 'email',
          contactValue: 'test@example.com'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.waitlistEntry).toBeDefined();
    });

    it('should require contact method and value', async () => {
      const response = await request(app)
        .post('/api/appointments/waitlist')
        .send({
          patientId: 'test-patient-id',
          appointmentType: 'eye_examination'
        })
        .expect(400);
    });
  });

  describe('GET /api/appointments/waitlist', () => {
    it('should return waitlist entries', async () => {
      const response = await request(app)
        .get('/api/appointments/waitlist')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.waitlistEntries)).toBe(true);
    });
  });

  describe('GET /api/appointments/my-appointments', () => {
    it('should return user appointments', async () => {
      const response = await request(app)
        .get('/api/appointments/my-appointments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.appointments)).toBe(true);
    });
  });
});
