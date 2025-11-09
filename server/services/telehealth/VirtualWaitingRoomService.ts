/**
 * Virtual Waiting Room Service
 *
 * Manages digital waiting room experience for telehealth visits
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Waiting room status
 */
export type WaitingRoomStatus = 'waiting' | 'called' | 'admitted' | 'left' | 'timed_out';

/**
 * Notification type
 */
export type NotificationType = 'position_update' | 'called_soon' | 'ready' | 'delayed' | 'cancelled';

/**
 * Waiting room entry
 */
export interface WaitingRoomEntry {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;

  // Queue info
  position: number;
  estimatedWaitMinutes: number;
  checkedInAt: Date;

  // Status
  status: WaitingRoomStatus;
  calledAt?: Date;
  admittedAt?: Date;
  leftAt?: Date;
  actualWaitMinutes?: number;

  // System checks
  systemCheckCompleted: boolean;
  cameraWorking?: boolean;
  microphoneWorking?: boolean;
  speakersWorking?: boolean;
  connectionSpeed?: number; // Mbps
  browserCompatible?: boolean;

  // Pre-visit info
  questionnaireCompleted: boolean;
  consentSigned: boolean;
  paymentVerified: boolean;

  // Notifications sent
  notificationsSent: Array<{
    type: NotificationType;
    sentAt: Date;
    message: string;
  }>;

  // Timeout
  timeoutAt: Date;
}

/**
 * Provider queue
 */
export interface ProviderQueue {
  providerId: string;
  providerName: string;
  isActive: boolean;
  currentPatient?: string; // visitId
  waitingPatients: string[]; // visitIds in order
  averageVisitDuration: number; // minutes
  lastUpdateAt: Date;
}

/**
 * System check result
 */
export interface SystemCheckResult {
  overall: 'passed' | 'warning' | 'failed';
  camera: {
    available: boolean;
    permissions: 'granted' | 'denied' | 'prompt';
    quality?: 'good' | 'fair' | 'poor';
  };
  microphone: {
    available: boolean;
    permissions: 'granted' | 'denied' | 'prompt';
    quality?: 'good' | 'fair' | 'poor';
  };
  speakers: {
    available: boolean;
    working?: boolean;
  };
  connection: {
    speed: number; // Mbps
    latency: number; // ms
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  browser: {
    name: string;
    version: string;
    compatible: boolean;
    warnings?: string[];
  };
}

/**
 * Waiting room message
 */
export interface WaitingRoomMessage {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  displayUntil?: Date;
  targetPatients?: string[]; // patientIds, if not specified, shown to all
}

/**
 * Virtual Waiting Room Service
 */
export class VirtualWaitingRoomService {
  /**
   * In-memory stores (use database in production)
   */
  private static entries = new Map<string, WaitingRoomEntry>();
  private static queues = new Map<string, ProviderQueue>();
  private static messages: WaitingRoomMessage[] = [];

  /**
   * Configuration
   */
  private static readonly TIMEOUT_MINUTES = 30;
  private static readonly CALL_SOON_THRESHOLD = 5; // minutes
  private static readonly MIN_CONNECTION_SPEED = 2; // Mbps
  private static readonly POSITION_UPDATE_INTERVAL = 60; // seconds

  /**
   * Compatible browsers
   */
  private static readonly COMPATIBLE_BROWSERS = [
    { name: 'Chrome', minVersion: 90 },
    { name: 'Firefox', minVersion: 88 },
    { name: 'Safari', minVersion: 14 },
    { name: 'Edge', minVersion: 90 },
  ];

  // ========== Entry Management ==========

  /**
   * Enter waiting room
   */
  static async enterWaitingRoom(
    visitId: string,
    patientId: string,
    patientName: string,
    providerId: string,
    providerName: string
  ): Promise<WaitingRoomEntry> {
    // Check if already in waiting room
    const existing = Array.from(this.entries.values()).find(
      (e) => e.visitId === visitId && e.status === 'waiting'
    );

    if (existing) {
      return existing;
    }

    // Get or create provider queue
    let queue = this.queues.get(providerId);
    if (!queue) {
      queue = {
        providerId,
        providerName,
        isActive: true,
        waitingPatients: [],
        averageVisitDuration: 30,
        lastUpdateAt: new Date(),
      };
      this.queues.set(providerId, queue);
    }

    // Calculate position and wait time
    const position = queue.waitingPatients.length + 1;
    const estimatedWaitMinutes = position * queue.averageVisitDuration;

    const entry: WaitingRoomEntry = {
      id: crypto.randomUUID(),
      visitId,
      patientId,
      patientName,
      providerId,
      providerName,
      position,
      estimatedWaitMinutes,
      checkedInAt: new Date(),
      status: 'waiting',
      systemCheckCompleted: false,
      questionnaireCompleted: false,
      consentSigned: false,
      paymentVerified: false,
      notificationsSent: [],
      timeoutAt: new Date(Date.now() + this.TIMEOUT_MINUTES * 60 * 1000),
    };

    this.entries.set(entry.id, entry);

    // Add to queue
    queue.waitingPatients.push(visitId);
    queue.lastUpdateAt = new Date();
    this.queues.set(providerId, queue);

    logger.info(
      { visitId, patientId, providerId, position, estimatedWaitMinutes },
      'Patient entered waiting room'
    );

    return entry;
  }

  /**
   * Leave waiting room
   */
  static async leaveWaitingRoom(visitId: string): Promise<{ success: boolean; error?: string }> {
    const entry = Array.from(this.entries.values()).find((e) => e.visitId === visitId);

    if (!entry) {
      return { success: false, error: 'Not in waiting room' };
    }

    if (entry.status !== 'waiting') {
      return { success: false, error: 'Already left waiting room' };
    }

    const leftAt = new Date();
    entry.status = 'left';
    entry.leftAt = leftAt;
    entry.actualWaitMinutes = Math.round(
      (leftAt.getTime() - entry.checkedInAt.getTime()) / (1000 * 60)
    );

    this.entries.set(entry.id, entry);

    // Remove from queue
    const queue = this.queues.get(entry.providerId);
    if (queue) {
      queue.waitingPatients = queue.waitingPatients.filter((id) => id !== visitId);
      queue.lastUpdateAt = new Date();
      this.queues.set(entry.providerId, queue);

      // Update positions for remaining patients
      await this.updateQueuePositions(entry.providerId);
    }

    logger.info({ visitId, actualWaitMinutes: entry.actualWaitMinutes }, 'Patient left waiting room');

    return { success: true };
  }

  /**
   * Call next patient
   */
  static async callNextPatient(providerId: string): Promise<{
    success: boolean;
    entry?: WaitingRoomEntry;
    error?: string;
  }> {
    const queue = this.queues.get(providerId);

    if (!queue || queue.waitingPatients.length === 0) {
      return { success: false, error: 'No patients waiting' };
    }

    const nextVisitId = queue.waitingPatients[0];
    const entry = Array.from(this.entries.values()).find(
      (e) => e.visitId === nextVisitId && e.status === 'waiting'
    );

    if (!entry) {
      // Remove from queue and try next
      queue.waitingPatients.shift();
      this.queues.set(providerId, queue);
      return this.callNextPatient(providerId);
    }

    entry.status = 'called';
    entry.calledAt = new Date();
    this.entries.set(entry.id, entry);

    // Send notification
    await this.sendNotification(entry, 'ready', 'The provider is ready to see you now');

    logger.info({ visitId: nextVisitId, providerId }, 'Next patient called');

    return { success: true, entry };
  }

  /**
   * Admit patient to visit
   */
  static async admitPatient(visitId: string): Promise<{ success: boolean; error?: string }> {
    const entry = Array.from(this.entries.values()).find((e) => e.visitId === visitId);

    if (!entry) {
      return { success: false, error: 'Not in waiting room' };
    }

    if (entry.status !== 'called') {
      return { success: false, error: 'Patient not called yet' };
    }

    const admittedAt = new Date();
    entry.status = 'admitted';
    entry.admittedAt = admittedAt;
    entry.actualWaitMinutes = Math.round(
      (admittedAt.getTime() - entry.checkedInAt.getTime()) / (1000 * 60)
    );

    this.entries.set(entry.id, entry);

    // Remove from queue
    const queue = this.queues.get(entry.providerId);
    if (queue) {
      queue.waitingPatients = queue.waitingPatients.filter((id) => id !== visitId);
      queue.currentPatient = visitId;
      queue.lastUpdateAt = new Date();
      this.queues.set(entry.providerId, queue);

      // Update positions for remaining patients
      await this.updateQueuePositions(entry.providerId);
    }

    logger.info({ visitId, actualWaitMinutes: entry.actualWaitMinutes }, 'Patient admitted to visit');

    return { success: true };
  }

  /**
   * Update queue positions
   */
  private static async updateQueuePositions(providerId: string): Promise<void> {
    const queue = this.queues.get(providerId);

    if (!queue) {
      return;
    }

    queue.waitingPatients.forEach((visitId, index) => {
      const entry = Array.from(this.entries.values()).find(
        (e) => e.visitId === visitId && e.status === 'waiting'
      );

      if (entry) {
        const newPosition = index + 1;
        const oldPosition = entry.position;

        entry.position = newPosition;
        entry.estimatedWaitMinutes = newPosition * queue.averageVisitDuration;

        this.entries.set(entry.id, entry);

        // Send notification if position changed significantly
        if (oldPosition - newPosition >= 2) {
          this.sendNotification(
            entry,
            'position_update',
            `You've moved up in the queue. Current position: ${newPosition}`
          );
        }

        // Send "called soon" notification if close to front
        if (newPosition <= 2 && !entry.notificationsSent.some((n) => n.type === 'called_soon')) {
          this.sendNotification(
            entry,
            'called_soon',
            'You will be called soon. Please ensure your camera and microphone are ready.'
          );
        }
      }
    });
  }

  /**
   * Get entry by visit ID
   */
  static async getEntry(visitId: string): Promise<WaitingRoomEntry | null> {
    return Array.from(this.entries.values()).find((e) => e.visitId === visitId) || null;
  }

  /**
   * Get provider queue
   */
  static async getQueue(providerId: string): Promise<ProviderQueue | null> {
    return this.queues.get(providerId) || null;
  }

  /**
   * Get all waiting patients for provider
   */
  static async getWaitingPatients(providerId: string): Promise<WaitingRoomEntry[]> {
    const queue = this.queues.get(providerId);

    if (!queue) {
      return [];
    }

    const entries = queue.waitingPatients
      .map((visitId) =>
        Array.from(this.entries.values()).find(
          (e) => e.visitId === visitId && e.status === 'waiting'
        )
      )
      .filter((e): e is WaitingRoomEntry => e !== undefined);

    return entries;
  }

  // ========== System Checks ==========

  /**
   * Complete system check
   */
  static async completeSystemCheck(
    visitId: string,
    results: SystemCheckResult
  ): Promise<{ success: boolean; warnings?: string[]; error?: string }> {
    const entry = Array.from(this.entries.values()).find((e) => e.visitId === visitId);

    if (!entry) {
      return { success: false, error: 'Not in waiting room' };
    }

    entry.systemCheckCompleted = true;
    entry.cameraWorking = results.camera.available && results.camera.permissions === 'granted';
    entry.microphoneWorking =
      results.microphone.available && results.microphone.permissions === 'granted';
    entry.speakersWorking = results.speakers.available && results.speakers.working === true;
    entry.connectionSpeed = results.connection.speed;
    entry.browserCompatible = results.browser.compatible;

    this.entries.set(entry.id, entry);

    const warnings: string[] = [];

    if (!entry.cameraWorking) {
      warnings.push('Camera not available or permission denied');
    }

    if (!entry.microphoneWorking) {
      warnings.push('Microphone not available or permission denied');
    }

    if (results.connection.speed < this.MIN_CONNECTION_SPEED) {
      warnings.push(
        `Connection speed (${results.connection.speed} Mbps) is below recommended ${this.MIN_CONNECTION_SPEED} Mbps`
      );
    }

    if (!entry.browserCompatible) {
      warnings.push('Browser may not be fully compatible');
    }

    if (results.browser.warnings) {
      warnings.push(...results.browser.warnings);
    }

    logger.info(
      {
        visitId,
        camera: entry.cameraWorking,
        microphone: entry.microphoneWorking,
        connectionSpeed: entry.connectionSpeed,
        warnings: warnings.length,
      },
      'System check completed'
    );

    if (warnings.length > 0) {
      return { success: true, warnings };
    }

    return { success: true };
  }

  /**
   * Verify browser compatibility
   */
  static verifyBrowser(browserName: string, browserVersion: string): {
    compatible: boolean;
    warnings?: string[];
  } {
    const compatible = this.COMPATIBLE_BROWSERS.find((b) => {
      const nameMatch = browserName.toLowerCase().includes(b.name.toLowerCase());
      const versionMatch = parseInt(browserVersion) >= b.minVersion;
      return nameMatch && versionMatch;
    });

    if (!compatible) {
      return {
        compatible: false,
        warnings: [
          `${browserName} ${browserVersion} may not be fully compatible. ` +
            `Recommended browsers: ${this.COMPATIBLE_BROWSERS.map((b) => `${b.name} ${b.minVersion}+`).join(', ')}`,
        ],
      };
    }

    return { compatible: true };
  }

  // ========== Pre-Visit Tasks ==========

  /**
   * Mark questionnaire completed
   */
  static async markQuestionnaireCompleted(visitId: string): Promise<void> {
    const entry = Array.from(this.entries.values()).find((e) => e.visitId === visitId);

    if (entry) {
      entry.questionnaireCompleted = true;
      this.entries.set(entry.id, entry);
      logger.info({ visitId }, 'Questionnaire completed');
    }
  }

  /**
   * Mark consent signed
   */
  static async markConsentSigned(visitId: string): Promise<void> {
    const entry = Array.from(this.entries.values()).find((e) => e.visitId === visitId);

    if (entry) {
      entry.consentSigned = true;
      this.entries.set(entry.id, entry);
      logger.info({ visitId }, 'Consent signed');
    }
  }

  /**
   * Mark payment verified
   */
  static async markPaymentVerified(visitId: string): Promise<void> {
    const entry = Array.from(this.entries.values()).find((e) => e.visitId === visitId);

    if (entry) {
      entry.paymentVerified = true;
      this.entries.set(entry.id, entry);
      logger.info({ visitId }, 'Payment verified');
    }
  }

  /**
   * Check if ready for visit
   */
  static async isReadyForVisit(visitId: string): Promise<{
    ready: boolean;
    missing: string[];
  }> {
    const entry = Array.from(this.entries.values()).find((e) => e.visitId === visitId);

    if (!entry) {
      return { ready: false, missing: ['Not in waiting room'] };
    }

    const missing: string[] = [];

    if (!entry.systemCheckCompleted) {
      missing.push('System check');
    } else {
      if (!entry.cameraWorking) missing.push('Camera');
      if (!entry.microphoneWorking) missing.push('Microphone');
      if (entry.connectionSpeed && entry.connectionSpeed < this.MIN_CONNECTION_SPEED) {
        missing.push('Stable internet connection');
      }
    }

    if (!entry.questionnaireCompleted) {
      missing.push('Pre-visit questionnaire');
    }

    if (!entry.consentSigned) {
      missing.push('Telehealth consent');
    }

    if (!entry.paymentVerified) {
      missing.push('Payment verification');
    }

    return {
      ready: missing.length === 0,
      missing,
    };
  }

  // ========== Notifications ==========

  /**
   * Send notification to patient
   */
  private static async sendNotification(
    entry: WaitingRoomEntry,
    type: NotificationType,
    message: string
  ): Promise<void> {
    entry.notificationsSent.push({
      type,
      sentAt: new Date(),
      message,
    });

    this.entries.set(entry.id, entry);

    logger.info({ visitId: entry.visitId, type, message }, 'Notification sent');

    // In production: Send via WebSocket, SMS, or push notification
  }

  // ========== Messages ==========

  /**
   * Post message to waiting room
   */
  static async postMessage(
    message: string,
    type: WaitingRoomMessage['type'] = 'info',
    targetPatients?: string[],
    displayMinutes?: number
  ): Promise<WaitingRoomMessage> {
    const msg: WaitingRoomMessage = {
      id: crypto.randomUUID(),
      type,
      message,
      targetPatients,
      displayUntil: displayMinutes
        ? new Date(Date.now() + displayMinutes * 60 * 1000)
        : undefined,
    };

    this.messages.push(msg);

    logger.info({ messageId: msg.id, type, targetPatients }, 'Waiting room message posted');

    return msg;
  }

  /**
   * Get active messages
   */
  static async getActiveMessages(patientId?: string): Promise<WaitingRoomMessage[]> {
    const now = new Date();

    let messages = this.messages.filter(
      (m) => !m.displayUntil || m.displayUntil > now
    );

    if (patientId) {
      messages = messages.filter(
        (m) => !m.targetPatients || m.targetPatients.includes(patientId)
      );
    }

    return messages;
  }

  // ========== Timeout Management ==========

  /**
   * Check for timed out entries
   */
  static async processTimeouts(): Promise<number> {
    const now = new Date();
    let timedOutCount = 0;

    Array.from(this.entries.values())
      .filter((e) => e.status === 'waiting' && e.timeoutAt < now)
      .forEach((entry) => {
        entry.status = 'timed_out';
        entry.leftAt = now;
        entry.actualWaitMinutes = Math.round(
          (now.getTime() - entry.checkedInAt.getTime()) / (1000 * 60)
        );

        this.entries.set(entry.id, entry);

        // Remove from queue
        const queue = this.queues.get(entry.providerId);
        if (queue) {
          queue.waitingPatients = queue.waitingPatients.filter((id) => id !== entry.visitId);
          this.queues.set(entry.providerId, queue);
        }

        logger.warn({ visitId: entry.visitId }, 'Waiting room entry timed out');

        timedOutCount++;
      });

    if (timedOutCount > 0) {
      // Update positions for affected queues
      const affectedProviders = new Set(
        Array.from(this.entries.values())
          .filter((e) => e.status === 'timed_out' && e.leftAt && e.leftAt.getTime() === now.getTime())
          .map((e) => e.providerId)
      );

      for (const providerId of affectedProviders) {
        await this.updateQueuePositions(providerId);
      }
    }

    return timedOutCount;
  }

  // ========== Statistics ==========

  /**
   * Get waiting room statistics
   */
  static async getStatistics(providerId?: string): Promise<{
    currentlyWaiting: number;
    averageWaitTime: number;
    longestWaitTime: number;
    totalProcessed: number;
    timedOutCount: number;
    systemCheckPassRate: number;
  }> {
    let entries = Array.from(this.entries.values());

    if (providerId) {
      entries = entries.filter((e) => e.providerId === providerId);
    }

    const currentlyWaiting = entries.filter((e) => e.status === 'waiting').length;

    const completedEntries = entries.filter(
      (e) => e.actualWaitMinutes !== undefined
    );

    const averageWaitTime =
      completedEntries.length > 0
        ? completedEntries.reduce((sum, e) => sum + e.actualWaitMinutes!, 0) /
          completedEntries.length
        : 0;

    const longestWaitTime = Math.max(
      ...completedEntries.map((e) => e.actualWaitMinutes || 0),
      0
    );

    const totalProcessed = entries.filter(
      (e) => e.status === 'admitted' || e.status === 'left' || e.status === 'timed_out'
    ).length;

    const timedOutCount = entries.filter((e) => e.status === 'timed_out').length;

    const systemCheckedEntries = entries.filter((e) => e.systemCheckCompleted);
    const systemCheckPassRate =
      systemCheckedEntries.length > 0
        ? (systemCheckedEntries.filter(
            (e) =>
              e.cameraWorking &&
              e.microphoneWorking &&
              e.connectionSpeed &&
              e.connectionSpeed >= this.MIN_CONNECTION_SPEED
          ).length /
            systemCheckedEntries.length) *
          100
        : 0;

    return {
      currentlyWaiting,
      averageWaitTime,
      longestWaitTime,
      totalProcessed,
      timedOutCount,
      systemCheckPassRate,
    };
  }
}
