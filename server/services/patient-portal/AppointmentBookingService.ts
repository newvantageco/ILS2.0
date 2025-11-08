/**
 * Appointment Booking Service
 *
 * Handles online appointment scheduling for patients including
 * availability checking, booking, rescheduling, and cancellations
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

/**
 * Appointment Type
 */
export interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price?: number;
  allowOnlineBooking: boolean;
  requiresApproval: boolean;
  color?: string;
}

/**
 * Provider Availability
 */
export interface ProviderAvailability {
  providerId: string;
  providerName: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  slotDuration: number; // minutes
  breakTimes?: Array<{
    start: string;
    end: string;
  }>;
}

/**
 * Time Slot
 */
export interface TimeSlot {
  start: Date;
  end: Date;
  providerId: string;
  providerName: string;
  available: boolean;
  appointmentTypeId?: string;
}

/**
 * Appointment Booking
 */
export interface AppointmentBooking {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  appointmentTypeId: string;
  appointmentType: string;

  date: Date;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: number; // minutes

  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

  reason?: string;
  notes?: string;

  // Confirmation
  confirmationCode: string;
  confirmedAt?: Date;

  // Reminders
  reminderSent: boolean;
  reminderSentAt?: Date;

  // Cancellation
  cancelledAt?: Date;
  cancelledBy?: 'patient' | 'provider' | 'system';
  cancellationReason?: string;

  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Booking Request
 */
export interface BookingRequest {
  patientId: string;
  providerId: string;
  appointmentTypeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  reason?: string;
  notes?: string;
}

/**
 * Appointment Booking Service
 */
export class AppointmentBookingService {
  /**
   * In-memory appointment types (use database in production)
   */
  private static appointmentTypes = new Map<string, AppointmentType>();

  /**
   * In-memory provider availability (use database in production)
   */
  private static availability: ProviderAvailability[] = [];

  /**
   * In-memory bookings (use database in production)
   */
  private static bookings = new Map<string, AppointmentBooking>();

  /**
   * Booking settings
   */
  private static readonly BOOKING_WINDOW_DAYS = 90; // How far ahead can book
  private static readonly MIN_ADVANCE_HOURS = 2; // Minimum advance notice
  private static readonly MAX_CANCELLATION_HOURS = 24; // Cancel up to 24h before

  /**
   * Initialize default appointment types
   */
  static initializeAppointmentTypes(): void {
    const defaultTypes: Omit<AppointmentType, 'id'>[] = [
      {
        name: 'Comprehensive Eye Exam',
        description: 'Complete eye examination including refraction and health assessment',
        duration: 60,
        price: 150,
        allowOnlineBooking: true,
        requiresApproval: false,
        color: '#4CAF50',
      },
      {
        name: 'Contact Lens Fitting',
        description: 'Contact lens consultation and fitting',
        duration: 45,
        price: 100,
        allowOnlineBooking: true,
        requiresApproval: false,
        color: '#2196F3',
      },
      {
        name: 'Follow-up Visit',
        description: 'Follow-up appointment for existing patients',
        duration: 30,
        price: 75,
        allowOnlineBooking: true,
        requiresApproval: false,
        color: '#FF9800',
      },
      {
        name: 'Emergency Eye Care',
        description: 'Urgent care for eye injuries or sudden vision changes',
        duration: 30,
        price: 200,
        allowOnlineBooking: false,
        requiresApproval: true,
        color: '#F44336',
      },
      {
        name: 'Pediatric Eye Exam',
        description: 'Eye examination for children',
        duration: 45,
        price: 125,
        allowOnlineBooking: true,
        requiresApproval: false,
        color: '#9C27B0',
      },
      {
        name: 'Glasses Selection',
        description: 'Frame selection and lens consultation',
        duration: 30,
        price: 0,
        allowOnlineBooking: true,
        requiresApproval: false,
        color: '#795548',
      },
    ];

    defaultTypes.forEach((type) => {
      const fullType: AppointmentType = {
        ...type,
        id: crypto.randomUUID(),
      };
      this.appointmentTypes.set(fullType.id, fullType);
    });

    logger.info({ count: defaultTypes.length }, 'Appointment types initialized');
  }

  /**
   * Get available appointment types
   */
  static getAppointmentTypes(onlineBookingOnly: boolean = false): AppointmentType[] {
    const types = Array.from(this.appointmentTypes.values());

    if (onlineBookingOnly) {
      return types.filter((t) => t.allowOnlineBooking);
    }

    return types;
  }

  /**
   * Get available time slots
   */
  static getAvailableSlots(
    providerId: string,
    appointmentTypeId: string,
    startDate: Date,
    endDate: Date
  ): TimeSlot[] {
    const appointmentType = this.appointmentTypes.get(appointmentTypeId);

    if (!appointmentType) {
      throw new Error('Appointment type not found');
    }

    const slots: TimeSlot[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();

      // Find provider availability for this day
      const providerAvail = this.availability.find(
        (a) => a.providerId === providerId && a.dayOfWeek === dayOfWeek
      );

      if (providerAvail) {
        // Generate slots for this day
        const daySlots = this.generateDaySlotsSlots(
          current,
          providerAvail,
          appointmentType.duration
        );

        // Check each slot availability
        daySlots.forEach((slot) => {
          const isAvailable = !this.isSlotBooked(
            providerId,
            slot.start,
            slot.end
          );

          slots.push({
            ...slot,
            providerId,
            providerName: providerAvail.providerName,
            appointmentTypeId,
            available: isAvailable,
          });
        });
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    return slots.filter((s) => s.available && s.start > new Date());
  }

  /**
   * Generate time slots for a specific day
   */
  private static generateDaySlotsSlots(
    date: Date,
    availability: ProviderAvailability,
    duration: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = availability.endTime.split(':').map(Number);

    let current = new Date(date);
    current.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (current < endTime) {
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // Skip if slot extends past end time
      if (slotEnd > endTime) {
        break;
      }

      // Check if slot overlaps with break time
      const isBreakTime = availability.breakTimes?.some((breakTime) => {
        const [breakStartHour, breakStartMinute] = breakTime.start.split(':').map(Number);
        const [breakEndHour, breakEndMinute] = breakTime.end.split(':').map(Number);

        const breakStart = new Date(date);
        breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);

        const breakEnd = new Date(date);
        breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);

        return current < breakEnd && slotEnd > breakStart;
      });

      if (!isBreakTime) {
        slots.push({
          start: new Date(current),
          end: new Date(slotEnd),
          providerId: availability.providerId,
          providerName: availability.providerName,
          available: true,
        });
      }

      // Move to next slot
      current = new Date(slotEnd);
    }

    return slots;
  }

  /**
   * Check if a time slot is already booked
   */
  private static isSlotBooked(
    providerId: string,
    start: Date,
    end: Date
  ): boolean {
    return Array.from(this.bookings.values()).some((booking) => {
      if (booking.providerId !== providerId) return false;
      if (booking.status === 'cancelled') return false;

      const bookingStart = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.startTime}`);
      const bookingEnd = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.endTime}`);

      // Check for overlap
      return start < bookingEnd && end > bookingStart;
    });
  }

  /**
   * Book an appointment
   */
  static async bookAppointment(
    request: BookingRequest
  ): Promise<{
    success: boolean;
    booking?: AppointmentBooking;
    error?: string;
  }> {
    try {
      // Validate appointment type
      const appointmentType = this.appointmentTypes.get(request.appointmentTypeId);

      if (!appointmentType) {
        return { success: false, error: 'Invalid appointment type' };
      }

      if (!appointmentType.allowOnlineBooking) {
        return { success: false, error: 'This appointment type cannot be booked online' };
      }

      // Parse date and time
      const appointmentDate = new Date(request.date);
      const [startHour, startMinute] = request.startTime.split(':').map(Number);

      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + appointmentType.duration);

      // Validate booking window
      const now = new Date();
      const minBookingTime = new Date();
      minBookingTime.setHours(minBookingTime.getHours() + this.MIN_ADVANCE_HOURS);

      if (startDateTime < minBookingTime) {
        return {
          success: false,
          error: `Appointments must be booked at least ${this.MIN_ADVANCE_HOURS} hours in advance`,
        };
      }

      const maxBookingTime = new Date();
      maxBookingTime.setDate(maxBookingTime.getDate() + this.BOOKING_WINDOW_DAYS);

      if (startDateTime > maxBookingTime) {
        return {
          success: false,
          error: `Appointments can only be booked up to ${this.BOOKING_WINDOW_DAYS} days in advance`,
        };
      }

      // Check if slot is available
      const isBooked = this.isSlotBooked(request.providerId, startDateTime, endDateTime);

      if (isBooked) {
        return { success: false, error: 'This time slot is no longer available' };
      }

      // Generate confirmation code
      const confirmationCode = this.generateConfirmationCode();

      // Create booking
      const booking: AppointmentBooking = {
        id: crypto.randomUUID(),
        patientId: request.patientId,
        providerId: request.providerId,
        providerName: 'Dr. Provider', // Would get from provider data
        appointmentTypeId: request.appointmentTypeId,
        appointmentType: appointmentType.name,
        date: appointmentDate,
        startTime: request.startTime,
        endTime: `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`,
        duration: appointmentType.duration,
        status: appointmentType.requiresApproval ? 'pending' : 'confirmed',
        reason: request.reason,
        notes: request.notes,
        confirmationCode,
        confirmedAt: appointmentType.requiresApproval ? undefined : new Date(),
        reminderSent: false,
        createdAt: new Date(),
      };

      this.bookings.set(booking.id, booking);

      logger.info(
        { bookingId: booking.id, patientId: booking.patientId, confirmationCode },
        'Appointment booked successfully'
      );

      // In production, send confirmation email
      await this.sendConfirmationEmail(booking);

      return { success: true, booking };
    } catch (error) {
      logger.error({ error }, 'Failed to book appointment');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Booking failed',
      };
    }
  }

  /**
   * Get patient appointments
   */
  static getPatientAppointments(
    patientId: string,
    filters?: {
      status?: AppointmentBooking['status'];
      upcoming?: boolean;
    }
  ): AppointmentBooking[] {
    let appointments = Array.from(this.bookings.values()).filter(
      (b) => b.patientId === patientId
    );

    if (filters?.status) {
      appointments = appointments.filter((a) => a.status === filters.status);
    }

    if (filters?.upcoming) {
      const now = new Date();
      appointments = appointments.filter((a) => {
        const appointmentDateTime = new Date(`${a.date.toISOString().split('T')[0]}T${a.startTime}`);
        return appointmentDateTime > now && a.status !== 'cancelled';
      });
    }

    return appointments.sort((a, b) => {
      const aDate = new Date(`${a.date.toISOString().split('T')[0]}T${a.startTime}`);
      const bDate = new Date(`${b.date.toISOString().split('T')[0]}T${b.startTime}`);
      return bDate.getTime() - aDate.getTime();
    });
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(
    bookingId: string,
    patientId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const booking = this.bookings.get(bookingId);

    if (!booking) {
      return { success: false, error: 'Appointment not found' };
    }

    if (booking.patientId !== patientId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (booking.status === 'cancelled') {
      return { success: false, error: 'Appointment already cancelled' };
    }

    if (booking.status === 'completed') {
      return { success: false, error: 'Cannot cancel completed appointment' };
    }

    // Check cancellation window
    const appointmentDateTime = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.startTime}`);
    const cancelDeadline = new Date(appointmentDateTime);
    cancelDeadline.setHours(cancelDeadline.getHours() - this.MAX_CANCELLATION_HOURS);

    if (new Date() > cancelDeadline) {
      return {
        success: false,
        error: `Appointments can only be cancelled up to ${this.MAX_CANCELLATION_HOURS} hours in advance`,
      };
    }

    // Cancel booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'patient';
    booking.cancellationReason = reason;
    booking.updatedAt = new Date();

    this.bookings.set(bookingId, booking);

    logger.info({ bookingId, patientId }, 'Appointment cancelled by patient');

    // In production, send cancellation email
    await this.sendCancellationEmail(booking);

    return { success: true };
  }

  /**
   * Reschedule appointment
   */
  static async rescheduleAppointment(
    bookingId: string,
    patientId: string,
    newDate: string,
    newStartTime: string
  ): Promise<{
    success: boolean;
    booking?: AppointmentBooking;
    error?: string;
  }> {
    // Cancel existing appointment
    const cancelResult = await this.cancelAppointment(
      bookingId,
      patientId,
      'Rescheduled by patient'
    );

    if (!cancelResult.success) {
      return { success: false, error: cancelResult.error };
    }

    const oldBooking = this.bookings.get(bookingId);

    if (!oldBooking) {
      return { success: false, error: 'Original appointment not found' };
    }

    // Book new appointment
    const bookingResult = await this.bookAppointment({
      patientId,
      providerId: oldBooking.providerId,
      appointmentTypeId: oldBooking.appointmentTypeId,
      date: newDate,
      startTime: newStartTime,
      reason: oldBooking.reason,
      notes: oldBooking.notes,
    });

    return bookingResult;
  }

  /**
   * Generate confirmation code
   */
  private static generateConfirmationCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Send confirmation email (mock)
   */
  private static async sendConfirmationEmail(booking: AppointmentBooking): Promise<void> {
    logger.info(
      { bookingId: booking.id, confirmationCode: booking.confirmationCode },
      'Confirmation email sent (mock)'
    );
  }

  /**
   * Send cancellation email (mock)
   */
  private static async sendCancellationEmail(booking: AppointmentBooking): Promise<void> {
    logger.info({ bookingId: booking.id }, 'Cancellation email sent (mock)');
  }

  /**
   * Add provider availability
   */
  static addProviderAvailability(availability: ProviderAvailability): void {
    this.availability.push(availability);
    logger.info({ providerId: availability.providerId }, 'Provider availability added');
  }

  /**
   * Get upcoming appointments requiring reminders
   */
  static getAppointmentsForReminders(hoursAhead: number = 24): AppointmentBooking[] {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + hoursAhead);

    return Array.from(this.bookings.values()).filter((booking) => {
      if (booking.status !== 'confirmed') return false;
      if (booking.reminderSent) return false;

      const appointmentDateTime = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.startTime}`);

      return appointmentDateTime > now && appointmentDateTime <= reminderTime;
    });
  }

  /**
   * Mark reminder as sent
   */
  static markReminderSent(bookingId: string): void {
    const booking = this.bookings.get(bookingId);

    if (booking) {
      booking.reminderSent = true;
      booking.reminderSentAt = new Date();
      this.bookings.set(bookingId, booking);
    }
  }
}

// Initialize appointment types on module load
AppointmentBookingService.initializeAppointmentTypes();
