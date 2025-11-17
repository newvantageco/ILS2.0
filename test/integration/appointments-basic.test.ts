/**
 * Basic Appointment System Tests
 * 
 * Simple tests to verify appointment system functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server';
import { db } from '../../server/db';
import { eq } from 'drizzle-orm';
import * as schema from '../../shared/schema';

describe('Appointment System - Basic', () => {
  let testCompany: any;
  let testUser: any;

  beforeEach(async () => {
    // Create test company
    const companyResult = await db.insert(schema.companies).values({
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
    
    testCompany = companyResult[0];

    // Create test user
    const userResult = await db.insert(schema.users).values({
      companyId: testCompany.id,
      email: 'patient@test.com',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'ecp',
      accountStatus: 'active'
    }).returning();
    
    testUser = userResult[0];
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(schema.appointments).where(eq(schema.appointments.companyId, testCompany.id));
    await db.delete(schema.users).where(eq(schema.users.companyId, testCompany.id));
    await db.delete(schema.companies).where(eq(schema.companies.id, testCompany.id));
  });

  it('should create a company successfully', () => {
    expect(testCompany).toBeDefined();
    expect(testCompany.name).toBe('Test Optical Practice');
    expect(testCompany.type).toBe('ecp');
  });

  it('should create a user successfully', () => {
    expect(testUser).toBeDefined();
    expect(testUser.email).toBe('patient@test.com');
    expect(testUser.companyId).toBe(testCompany.id);
  });

  it('should create an appointment successfully', async () => {
    const appointmentData = {
      patientId: testUser.id,
      title: 'Eye Examination',
      type: 'eye_examination',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      duration: 60,
      location: 'Test Room 1'
    };

    // Test the appointment service directly
    const { appointmentService } = await import('../../server/services/AppointmentService');
    
    const appointment = await appointmentService.createAppointment({
      ...appointmentData,
      companyId: testCompany.id,
      createdBy: testUser.id
    });

    expect(appointment).toBeDefined();
    expect(appointment.title).toBe(appointmentData.title);
    expect(appointment.status).toBe('confirmed');
    expect(appointment.patientId).toBe(testUser.id);
  });

  it('should get appointments by company', async () => {
    // Create an appointment first
    const { appointmentService } = await import('../../server/services/AppointmentService');
    
    await appointmentService.createAppointment({
      companyId: testCompany.id,
      patientId: testUser.id,
      title: 'Eye Examination',
      type: 'eye_examination',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      duration: 60,
      createdBy: testUser.id
    });

    const result = await appointmentService.getAppointments({
      companyId: testCompany.id
    });

    expect(result.appointments).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.appointments[0].title).toBe('Eye Examination');
  });

  it('should check availability correctly', async () => {
    const { appointmentService } = await import('../../server/services/AppointmentService');
    
    // Create an appointment first
    await appointmentService.createAppointment({
      companyId: testCompany.id,
      patientId: testUser.id,
      practitionerId: testUser.id,
      title: 'Eye Examination',
      type: 'eye_examination',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      duration: 60,
      createdBy: testUser.id
    });

    // Check availability during the same time - should be false
    const hasConflict = await appointmentService.checkPractitionerAvailability(
      testUser.id,
      new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      new Date(Date.now() + 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      testCompany.id
    );

    expect(hasConflict).toBe(true); // There is a conflict

    // Check availability at a different time - should be false (no conflict)
    const noConflict = await appointmentService.checkPractitionerAvailability(
      testUser.id,
      new Date(Date.now() + 48 * 60 * 60 * 1000),
      new Date(Date.now() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000),
      testCompany.id
    );

    expect(noConflict).toBe(false); // No conflict
  });

  it('should add to waitlist successfully', async () => {
    const { appointmentService } = await import('../../server/services/AppointmentService');
    
    const waitlistEntry = await appointmentService.addToWaitlist({
      companyId: testCompany.id,
      patientId: testUser.id,
      appointmentType: 'eye_examination',
      contactMethod: 'email',
      contactValue: testUser.email,
      priority: 3
    });

    expect(waitlistEntry).toBeDefined();
    expect(waitlistEntry.appointmentType).toBe('eye_examination');
    expect(waitlistEntry.status).toBe('active');
  });

  it('should get waitlist entries', async () => {
    const { appointmentService } = await import('../../server/services/AppointmentService');
    
    // Add to waitlist
    await appointmentService.addToWaitlist({
      companyId: testCompany.id,
      patientId: testUser.id,
      appointmentType: 'eye_examination',
      contactMethod: 'email',
      contactValue: testUser.email,
      priority: 2
    });

    const entries = await appointmentService.getWaitlistEntries(testCompany.id);
    
    expect(entries).toHaveLength(1);
    expect(entries[0].appointmentType).toBe('eye_examination');
  });
});
