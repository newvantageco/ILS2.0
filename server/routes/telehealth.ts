/**
 * Telehealth API Routes
 *
 * Routes for virtual visits, video sessions, and waiting room management
 */

import express from 'express';
import { loggers } from '../utils/logger';
import { TelehealthService } from '../services/telehealth/TelehealthService';
import { VideoSessionService } from '../services/telehealth/VideoSessionService';
import { VirtualWaitingRoomService } from '../services/telehealth/VirtualWaitingRoomService';

const router = express.Router();
const logger = loggers.api;

// ========== Middleware ==========

/**
 * Authentication middleware (use existing isAuthenticated from routes.ts)
 */
// This assumes isAuthenticated middleware is applied at the app level for /api/telehealth routes

// ========== Provider Management Routes ==========

/**
 * POST /api/telehealth/providers/enable
 * Enable telehealth for a provider
 */
router.post('/providers/enable', async (req, res) => {
  try {
    const { providerId, providerName, config } = req.body;

    if (!providerId || !providerName) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID and name required',
      });
    }

    const availability = await TelehealthService.enableProviderTelehealth(
      providerId,
      providerName,
      config || {}
    );

    res.status(201).json({
      success: true,
      availability,
    });
  } catch (error) {
    logger.error({ error }, 'Enable provider telehealth error');
    res.status(500).json({
      success: false,
      error: 'Failed to enable telehealth',
    });
  }
});

/**
 * GET /api/telehealth/providers
 * Get telehealth-enabled providers
 */
router.get('/providers', async (req, res) => {
  try {
    const { visitType } = req.query;

    const providers = await TelehealthService.getTelehealthProviders(visitType as any);

    res.json({
      success: true,
      providers,
    });
  } catch (error) {
    logger.error({ error }, 'Get telehealth providers error');
    res.status(500).json({
      success: false,
      error: 'Failed to get providers',
    });
  }
});

// ========== Consent Routes ==========

/**
 * POST /api/telehealth/consent
 * Record telehealth consent
 */
router.post('/consent', async (req, res) => {
  try {
    const { patientId } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID required',
      });
    }

    const consent = await TelehealthService.recordConsent(patientId, ipAddress, userAgent);

    res.status(201).json({
      success: true,
      consent,
    });
  } catch (error) {
    logger.error({ error }, 'Record consent error');
    res.status(500).json({
      success: false,
      error: 'Failed to record consent',
    });
  }
});

/**
 * GET /api/telehealth/consent/:patientId/verify
 * Verify patient has valid consent
 */
router.get('/consent/:patientId/verify', async (req, res) => {
  try {
    const { patientId } = req.params;

    const hasConsent = await TelehealthService.verifyConsent(patientId);

    res.json({
      success: true,
      hasConsent,
    });
  } catch (error) {
    logger.error({ error }, 'Verify consent error');
    res.status(500).json({
      success: false,
      error: 'Failed to verify consent',
    });
  }
});

// ========== Visit Scheduling Routes ==========

/**
 * POST /api/telehealth/visits/schedule
 * Schedule a virtual visit
 */
router.post('/visits/schedule', async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      providerId,
      visitType,
      visitReason,
      reasonDetails,
      scheduledDate,
      scheduledTime,
      recordingConsent,
      platform,
    } = req.body;

    if (
      !patientId ||
      !patientName ||
      !providerId ||
      !visitType ||
      !visitReason ||
      !scheduledDate ||
      !scheduledTime ||
      recordingConsent === undefined ||
      !platform
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const result = await TelehealthService.scheduleVisit({
      patientId,
      patientName,
      providerId,
      visitType,
      visitReason,
      reasonDetails,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      recordingConsent,
      platform,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      visit: result.visit,
    });
  } catch (error) {
    logger.error({ error }, 'Schedule visit error');
    res.status(500).json({
      success: false,
      error: 'Failed to schedule visit',
    });
  }
});

/**
 * GET /api/telehealth/visits/patient/:patientId
 * Get patient's virtual visits
 */
router.get('/visits/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;

    const visits = await TelehealthService.getPatientVisits(patientId, status as any);

    res.json({
      success: true,
      visits,
    });
  } catch (error) {
    logger.error({ error }, 'Get patient visits error');
    res.status(500).json({
      success: false,
      error: 'Failed to get visits',
    });
  }
});

/**
 * GET /api/telehealth/visits/provider/:providerId
 * Get provider's virtual visits
 */
router.get('/visits/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { date, status } = req.query;

    const visits = await TelehealthService.getProviderVisits(
      providerId,
      date ? new Date(date as string) : undefined,
      status as any
    );

    res.json({
      success: true,
      visits,
    });
  } catch (error) {
    logger.error({ error }, 'Get provider visits error');
    res.status(500).json({
      success: false,
      error: 'Failed to get visits',
    });
  }
});

/**
 * GET /api/telehealth/visits/:visitId
 * Get single visit
 */
router.get('/visits/:visitId', async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await TelehealthService.getVisit(visitId);

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found',
      });
    }

    res.json({
      success: true,
      visit,
    });
  } catch (error) {
    logger.error({ error }, 'Get visit error');
    res.status(500).json({
      success: false,
      error: 'Failed to get visit',
    });
  }
});

/**
 * POST /api/telehealth/visits/:visitId/cancel
 * Cancel a visit
 */
router.post('/visits/:visitId/cancel', async (req, res) => {
  try {
    const { visitId } = req.params;
    const { cancelledBy, reason } = req.body;

    if (!cancelledBy || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancelled by and reason required',
      });
    }

    const result = await TelehealthService.cancelVisit(visitId, cancelledBy, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Visit cancelled successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Cancel visit error');
    res.status(500).json({
      success: false,
      error: 'Failed to cancel visit',
    });
  }
});

/**
 * POST /api/telehealth/visits/:visitId/check-in
 * Patient check-in to waiting room
 */
router.post('/visits/:visitId/check-in', async (req, res) => {
  try {
    const { visitId } = req.params;
    const { patientId } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID required',
      });
    }

    const result = await TelehealthService.checkIn(visitId, patientId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      waitingRoomPosition: result.waitingRoomPosition,
      estimatedWaitMinutes: result.estimatedWaitMinutes,
    });
  } catch (error) {
    logger.error({ error }, 'Check-in error');
    res.status(500).json({
      success: false,
      error: 'Failed to check in',
    });
  }
});

/**
 * POST /api/telehealth/visits/:visitId/start
 * Provider starts visit
 */
router.post('/visits/:visitId/start', async (req, res) => {
  try {
    const { visitId } = req.params;
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID required',
      });
    }

    const result = await TelehealthService.startVisit(visitId, providerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Visit started successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Start visit error');
    res.status(500).json({
      success: false,
      error: 'Failed to start visit',
    });
  }
});

/**
 * POST /api/telehealth/visits/:visitId/complete
 * Complete visit with documentation
 */
router.post('/visits/:visitId/complete', async (req, res) => {
  try {
    const { visitId } = req.params;
    const {
      providerId,
      visitNotes,
      diagnoses,
      prescriptions,
      orders,
      followUpRequired,
      followUpInstructions,
    } = req.body;

    if (!providerId || !visitNotes) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID and visit notes required',
      });
    }

    const result = await TelehealthService.completeVisit(visitId, providerId, {
      visitNotes,
      diagnoses,
      prescriptions,
      orders,
      followUpRequired,
      followUpInstructions,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Visit completed successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Complete visit error');
    res.status(500).json({
      success: false,
      error: 'Failed to complete visit',
    });
  }
});

/**
 * POST /api/telehealth/visits/:visitId/questionnaire
 * Submit pre-visit questionnaire
 */
router.post('/visits/:visitId/questionnaire', async (req, res) => {
  try {
    const { visitId } = req.params;
    const { patientId, responses } = req.body;

    if (!patientId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and responses required',
      });
    }

    const questionnaire = await TelehealthService.submitQuestionnaire(
      visitId,
      patientId,
      responses
    );

    res.status(201).json({
      success: true,
      questionnaire,
    });
  } catch (error) {
    logger.error({ error }, 'Submit questionnaire error');
    res.status(500).json({
      success: false,
      error: 'Failed to submit questionnaire',
    });
  }
});

/**
 * GET /api/telehealth/visits/:visitId/questionnaire
 * Get questionnaire for visit
 */
router.get('/visits/:visitId/questionnaire', async (req, res) => {
  try {
    const { visitId } = req.params;

    const questionnaire = await TelehealthService.getQuestionnaire(visitId);

    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        error: 'Questionnaire not found',
      });
    }

    res.json({
      success: true,
      questionnaire,
    });
  } catch (error) {
    logger.error({ error }, 'Get questionnaire error');
    res.status(500).json({
      success: false,
      error: 'Failed to get questionnaire',
    });
  }
});

// ========== Video Session Routes ==========

/**
 * POST /api/telehealth/sessions/create
 * Create video session
 */
router.post('/sessions/create', async (req, res) => {
  try {
    const { visitId, provider, maxParticipants, recordingEnabled, qualitySettings } = req.body;

    if (!visitId || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Visit ID and provider required',
      });
    }

    const session = await VideoSessionService.createSession({
      visitId,
      provider,
      maxParticipants,
      recordingEnabled,
      qualitySettings,
    });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    logger.error({ error }, 'Create session error');
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
    });
  }
});

/**
 * GET /api/telehealth/sessions/:sessionId
 * Get video session
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await VideoSessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    logger.error({ error }, 'Get session error');
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
    });
  }
});

/**
 * POST /api/telehealth/sessions/:sessionId/token
 * Generate access token for session
 */
router.post('/sessions/:sessionId/token', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, userName, role } = req.body;

    if (!userId || !userName || !role) {
      return res.status(400).json({
        success: false,
        error: 'User ID, name, and role required',
      });
    }

    const result = await VideoSessionService.generateAccessToken(sessionId, userId, userName, role);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      token: result.token,
    });
  } catch (error) {
    logger.error({ error }, 'Generate token error');
    res.status(500).json({
      success: false,
      error: 'Failed to generate token',
    });
  }
});

/**
 * POST /api/telehealth/sessions/:sessionId/join
 * Join video session
 */
router.post('/sessions/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { token, userId, userName, browser, os, deviceType, networkType } = req.body;

    if (!token || !userId || !userName) {
      return res.status(400).json({
        success: false,
        error: 'Token, user ID, and name required',
      });
    }

    const result = await VideoSessionService.joinSession(sessionId, token, userId, userName, {
      browser,
      os,
      deviceType,
      networkType,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      participant: result.participant,
    });
  } catch (error) {
    logger.error({ error }, 'Join session error');
    res.status(500).json({
      success: false,
      error: 'Failed to join session',
    });
  }
});

/**
 * POST /api/telehealth/sessions/:sessionId/leave
 * Leave video session
 */
router.post('/sessions/:sessionId/leave', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        error: 'Participant ID required',
      });
    }

    const result = await VideoSessionService.leaveSession(sessionId, participantId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Left session successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Leave session error');
    res.status(500).json({
      success: false,
      error: 'Failed to leave session',
    });
  }
});

/**
 * POST /api/telehealth/sessions/:sessionId/end
 * End video session
 */
router.post('/sessions/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await VideoSessionService.endSession(sessionId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Session ended successfully',
    });
  } catch (error) {
    logger.error({ error }, 'End session error');
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
    });
  }
});

/**
 * POST /api/telehealth/sessions/:sessionId/recording/start
 * Start recording
 */
router.post('/sessions/:sessionId/recording/start', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await VideoSessionService.startRecording(sessionId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Recording started',
    });
  } catch (error) {
    logger.error({ error }, 'Start recording error');
    res.status(500).json({
      success: false,
      error: 'Failed to start recording',
    });
  }
});

/**
 * POST /api/telehealth/sessions/:sessionId/recording/stop
 * Stop recording
 */
router.post('/sessions/:sessionId/recording/stop', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await VideoSessionService.stopRecording(sessionId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Recording stopped',
    });
  } catch (error) {
    logger.error({ error }, 'Stop recording error');
    res.status(500).json({
      success: false,
      error: 'Failed to stop recording',
    });
  }
});

/**
 * POST /api/telehealth/sessions/:sessionId/screen-share/start
 * Start screen sharing
 */
router.post('/sessions/:sessionId/screen-share/start', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantId, participantName } = req.body;

    if (!participantId || !participantName) {
      return res.status(400).json({
        success: false,
        error: 'Participant ID and name required',
      });
    }

    const result = await VideoSessionService.startScreenShare(
      sessionId,
      participantId,
      participantName
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      screenShare: result.screenShare,
    });
  } catch (error) {
    logger.error({ error }, 'Start screen share error');
    res.status(500).json({
      success: false,
      error: 'Failed to start screen sharing',
    });
  }
});

/**
 * POST /api/telehealth/sessions/:sessionId/screen-share/stop
 * Stop screen sharing
 */
router.post('/sessions/:sessionId/screen-share/stop', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        error: 'Participant ID required',
      });
    }

    const result = await VideoSessionService.stopScreenShare(sessionId, participantId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Screen sharing stopped',
    });
  } catch (error) {
    logger.error({ error }, 'Stop screen share error');
    res.status(500).json({
      success: false,
      error: 'Failed to stop screen sharing',
    });
  }
});

/**
 * POST /api/telehealth/sessions/:sessionId/chat
 * Send chat message
 */
router.post('/sessions/:sessionId/chat', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { senderId, senderName, message, recipientId } = req.body;

    if (!senderId || !senderName || !message) {
      return res.status(400).json({
        success: false,
        error: 'Sender ID, name, and message required',
      });
    }

    const result = await VideoSessionService.sendChatMessage(
      sessionId,
      senderId,
      senderName,
      message,
      recipientId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      chatMessage: result.chatMessage,
    });
  } catch (error) {
    logger.error({ error }, 'Send chat message error');
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
});

/**
 * GET /api/telehealth/sessions/:sessionId/chat
 * Get chat messages
 */
router.get('/sessions/:sessionId/chat', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantId } = req.query;

    const messages = await VideoSessionService.getChatMessages(sessionId, participantId as string);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    logger.error({ error }, 'Get chat messages error');
    res.status(500).json({
      success: false,
      error: 'Failed to get messages',
    });
  }
});

// ========== Waiting Room Routes ==========

/**
 * POST /api/telehealth/waiting-room/enter
 * Enter waiting room
 */
router.post('/waiting-room/enter', async (req, res) => {
  try {
    const { visitId, patientId, patientName, providerId, providerName } = req.body;

    if (!visitId || !patientId || !patientName || !providerId || !providerName) {
      return res.status(400).json({
        success: false,
        error: 'All fields required',
      });
    }

    const entry = await VirtualWaitingRoomService.enterWaitingRoom(
      visitId,
      patientId,
      patientName,
      providerId,
      providerName
    );

    res.status(201).json({
      success: true,
      entry,
    });
  } catch (error) {
    logger.error({ error }, 'Enter waiting room error');
    res.status(500).json({
      success: false,
      error: 'Failed to enter waiting room',
    });
  }
});

/**
 * POST /api/telehealth/waiting-room/:visitId/leave
 * Leave waiting room
 */
router.post('/waiting-room/:visitId/leave', async (req, res) => {
  try {
    const { visitId } = req.params;

    const result = await VirtualWaitingRoomService.leaveWaitingRoom(visitId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Left waiting room',
    });
  } catch (error) {
    logger.error({ error }, 'Leave waiting room error');
    res.status(500).json({
      success: false,
      error: 'Failed to leave waiting room',
    });
  }
});

/**
 * GET /api/telehealth/waiting-room/:visitId
 * Get waiting room entry
 */
router.get('/waiting-room/:visitId', async (req, res) => {
  try {
    const { visitId } = req.params;

    const entry = await VirtualWaitingRoomService.getEntry(visitId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Not in waiting room',
      });
    }

    res.json({
      success: true,
      entry,
    });
  } catch (error) {
    logger.error({ error }, 'Get waiting room entry error');
    res.status(500).json({
      success: false,
      error: 'Failed to get entry',
    });
  }
});

/**
 * GET /api/telehealth/waiting-room/provider/:providerId/queue
 * Get provider queue
 */
router.get('/waiting-room/provider/:providerId/queue', async (req, res) => {
  try {
    const { providerId } = req.params;

    const queue = await VirtualWaitingRoomService.getQueue(providerId);
    const patients = await VirtualWaitingRoomService.getWaitingPatients(providerId);

    res.json({
      success: true,
      queue,
      patients,
    });
  } catch (error) {
    logger.error({ error }, 'Get provider queue error');
    res.status(500).json({
      success: false,
      error: 'Failed to get queue',
    });
  }
});

/**
 * POST /api/telehealth/waiting-room/provider/:providerId/call-next
 * Call next patient
 */
router.post('/waiting-room/provider/:providerId/call-next', async (req, res) => {
  try {
    const { providerId } = req.params;

    const result = await VirtualWaitingRoomService.callNextPatient(providerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      entry: result.entry,
    });
  } catch (error) {
    logger.error({ error }, 'Call next patient error');
    res.status(500).json({
      success: false,
      error: 'Failed to call next patient',
    });
  }
});

/**
 * POST /api/telehealth/waiting-room/:visitId/system-check
 * Complete system check
 */
router.post('/waiting-room/:visitId/system-check', async (req, res) => {
  try {
    const { visitId } = req.params;
    const { results } = req.body;

    if (!results) {
      return res.status(400).json({
        success: false,
        error: 'System check results required',
      });
    }

    const result = await VirtualWaitingRoomService.completeSystemCheck(visitId, results);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      warnings: result.warnings,
    });
  } catch (error) {
    logger.error({ error }, 'System check error');
    res.status(500).json({
      success: false,
      error: 'Failed to complete system check',
    });
  }
});

/**
 * GET /api/telehealth/waiting-room/:visitId/ready
 * Check if ready for visit
 */
router.get('/waiting-room/:visitId/ready', async (req, res) => {
  try {
    const { visitId } = req.params;

    const result = await VirtualWaitingRoomService.isReadyForVisit(visitId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error({ error }, 'Check ready error');
    res.status(500).json({
      success: false,
      error: 'Failed to check readiness',
    });
  }
});

// ========== Statistics Routes ==========

/**
 * GET /api/telehealth/statistics
 * Get telehealth statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const { providerId, startDate, endDate } = req.query;

    const stats = await TelehealthService.getStatistics(
      providerId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    logger.error({ error }, 'Get statistics error');
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

export default router;
