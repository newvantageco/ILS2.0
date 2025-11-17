/**
 * Appointment System Integration Tests
 * 
 * Comprehensive testing for appointment scheduling including:
 * - CRUD operations
 * - Availability checking
 * - Time slot discovery
 * - Rescheduling and cancellation
 * - Waitlist functionality
 * - Validation and error handling
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server';
import { db } from '../../server/db';
import { eq } from 'drizzle-orm';
import * as schema from '../../shared/schema';

describe('Appointment System', () => {
  let testUser: any;
  let testCompany: any;
  let testPractitioner: any;
  let authToken: string;

  beforeEach(async () => {
    // Create test company
    const [company] = await db.insert(schema.companies).values({
      name: 'Test Optical Practice',
      type: 'ecp',
      email: 'test@optical.com',
      phone: '123-456-7890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA'
      },
      subscriptionPlan: 'pro',
      status: 'active'
    }).returning();

    testCompany = company;

    // Create test practitioner
    const [practitioner] = await db.insert(schema.users).values({
      companyId: company.id,
      email: 'practitioner@test.com',
      firstName: 'Dr. John',
      lastName: 'Smith',
      role: 'ecp',
      accountStatus: 'active'
    }).returning();

    testPractitioner = practitioner;

    // Create test user (patient)
    const [user] = await db.insert(schema.users).values({
      companyId: company.id,
      email: 'patient@test.com',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'ecp',
      accountStatus: 'active'
    }).returning();

    testUser = user;

    // Mock authentication token
    authToken = 'mock-jwt-token';
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(schema.appointments).where(eq(schema.appointments.companyId, testCompany.id));
    await db.delete(schema.appointmentWaitlist).where(eq(schema.appointmentWaitlist.companyId, testCompany.id));
    await db.delete(schema.appointmentReminders);
    await db.delete(schema.users).where(eq(schema.users.companyId, testCompany.id));
    await db.delete(schema.companies).where(eq(schema.companies.id, testCompany.id));
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentData = {
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'Eye Examination',
        type: 'eye_examination',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        duration: 60,
        location: 'Test Room 1'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.appointment).toBeDefined();
      expect(response.body.appointment.title).toBe(appointmentData.title);
      expect(response.body.appointment.status).toBe('confirmed');
      expect(response.body.appointment.patientId).toBe(testUser.id);
      expect(response.body.appointment.practitionerId).toBe(testPractitioner.id);
    });

    it('should reject appointment with invalid time range', async () => {
      const appointmentData = {
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'Eye Examination',
        type: 'eye_examination',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(), // Before start time
        duration: 60,
        location: 'Test Room 1'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(500);

      expect(response.body.error).toContain('End time must be after start time');
    });

    it('should require authentication', async () => {
      const appointmentData = {
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'Eye Examination',
        type: 'eye_examination',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        duration: 60
      };

      await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(401);
    });
  });

  describe('GET /api/appointments', () => {
    beforeEach(async () => {
      // Create test appointments
      await db.insert(schema.appointments).values({
        companyId: testCompany.id,
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'Eye Examination 1',
        type: 'eye_examination',
        status: 'scheduled',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        createdBy: testUser.id
      });

      await db.insert(schema.appointments).values({
        companyId: testCompany.id,
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'Eye Examination 2',
        type: 'eye_examination',
        status: 'completed',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        createdBy: testUser.id
      });
    });

    it('should get appointments with pagination', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.appointments).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
    });

    it('should filter appointments by status', async () => {
      const response = await request(app)
        .get('/api/appointments?status=scheduled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.appointments).toHaveLength(1);
      expect(response.body.appointments[0].status).toBe('scheduled');
    });

    it('should filter appointments by patient', async () => {
      const response = await request(app)
        .get(`/api/appointments?patientId=${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.appointments).toHaveLength(2);
      expect(response.body.appointments[0].patientId).toBe(testUser.id);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const [appointment] = await db.insert(schema.appointments).values({
        companyId: testCompany.id,
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'Eye Examination',
        type: 'eye_examination',
        status: 'scheduled',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        createdBy: testUser.id
      }).returning();

      testAppointment = appointment;
    });

    it('should update appointment successfully', async () => {
      const updateData = {
        title: 'Updated Eye Examination',
        notes: 'Patient needs special accommodation'
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.appointment.title).toBe(updateData.title);
      expect(response.body.appointment.notes).toBe(updateData.notes);
    });

    it('should return 404 for non-existent appointment', async () => {
      const response = await request(app)
        .put('/api/appointments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Appointment not found');
    });
  });

  describe('POST /api/appointments/:id/reschedule', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const [appointment] = await db.insert(schema.appointments).values({
        companyId: testCompany.id,
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'Eye Examination',
        type: 'eye_examination',
        status: 'scheduled',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        createdBy: testUser.id
      }).returning();

      testAppointment = appointment;
    });

    it('should reschedule appointment successfully', async () => {
      const rescheduleData = {
        newStartTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        newEndTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post(`/api/appointments/${testAppointment.id}/reschedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(rescheduleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.appointment.startTime).toBe(rescheduleData.newStartTime);
      expect(response.body.appointment.endTime).toBe(rescheduleData.newEndTime);

      // Check original appointment was marked as rescheduled
      const originalAppointment = await db.select().from(schema.appointments)
        .where(eq(schema.appointments.id, testAppointment.id))
        .limit(1);
      expect(originalAppointment[0].status).toBe('rescheduled');
    });
  });

  describe('POST /api/appointments/:id/cancel', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const [appointment] = await db.insert(schema.appointments).values({
        companyId: testCompany.id,
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'Eye Examination',
        type: 'eye_examination',
        status: 'scheduled',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        createdBy: testUser.id
      }).returning();

      testAppointment = appointment;
    });

    it('should cancel appointment successfully', async () => {
      const cancelData = {
        reason: 'Patient requested cancellation',
        reasonType: 'patient_cancelled'
      };

      const response = await request(app)
        .post(`/api/appointments/${testAppointment.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(cancelData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.appointment.status).toBe('cancelled');
      expect(response.body.appointment.cancellationReason).toBe(cancelData.reason);
    });
  });

  describe('POST /api/appointments/check-availability', () => {
    it('should check practitioner availability correctly', async () => {
      // Create an appointment first
      await db.insert(schema.appointments).values({
        companyId: testCompany.id,
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'Eye Examination',
        type: 'eye_examination',
        status: 'confirmed',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        createdBy: testUser.id
      });

      // Check availability during the scheduled time
      const availabilityData = {
        practitionerId: testPractitioner.id,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // During the appointment
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/appointments/check-availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send(availabilityData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.isAvailable).toBe(false);
    });

    it('should show availability when no conflicts', async () => {
      const availabilityData = {
        practitionerId: testPractitioner.id,
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/appointments/check-availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send(availabilityData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.isAvailable).toBe(true);
    });
  });

  describe('POST /api/appointments/waitlist', () => {
    it('should add patient to waitlist successfully', async () => {
      const waitlistData = {
        patientId: testUser.id,
        appointmentType: 'eye_examination',
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        preferredTimeRange: 'morning',
        contactMethod: 'email',
        contactValue: testUser.email,
        priority: 3
      };

      const response = await request(app)
        .post('/api/appointments/waitlist')
        .set('Authorization', `Bearer ${authToken}`)
        .send(waitlistData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.waitlistEntry).toBeDefined();
      expect(response.body.waitlistEntry.appointmentType).toBe(waitlistData.appointmentType);
      expect(response.body.waitlistEntry.status).toBe('active');
    });
  });

  describe('GET /api/appointments/waitlist', () => {
    beforeEach(async () => {
      // Add test waitlist entries
      await db.insert(schema.appointmentWaitlist).values([
        {
          companyId: testCompany.id,
          patientId: testUser.id,
          appointmentType: 'eye_examination',
          contactMethod: 'email',
          contactValue: testUser.email,
          priority: 2
        },
        {
          companyId: testCompany.id,
          patientId: testUser.id,
          appointmentType: 'contact_lens_fitting',
          contactMethod: 'sms',
          contactValue: '+1234567890',
          priority: 1
        }
      ]);
    });

    it('should get waitlist entries ordered by priority', async () => {
      const response = await request(app)
        .get('/api/appointments/waitlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.waitlistEntries).toHaveLength(2);
      expect(response.body.waitlistEntries[0].priority).toBe(1); // Higher priority first
      expect(response.body.waitlistEntries[1].priority).toBe(2);
    });
  });

  describe('GET /api/appointments/my-appointments', () => {
    beforeEach(async () => {
      // Create appointments for test user
      await db.insert(schema.appointments).values({
        companyId: testCompany.id,
        patientId: testUser.id,
        practitionerId: testPractitioner.id,
        title: 'My Eye Examination',
        type: 'eye_examination',
        status: 'scheduled',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        duration: 60,
        createdBy: testUser.id
      });
    });

    it('should get current user appointments', async () => {
      const response = await request(app)
        .get('/api/appointments/my-appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.appointments).toHaveLength(1);
      expect(response.body.appointments[0].patientId).toBe(testUser.id);
    });
  });
});
