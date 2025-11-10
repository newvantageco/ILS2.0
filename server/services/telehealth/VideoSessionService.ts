/**
 * Video Session Service
 *
 * Manages video conferencing sessions for telehealth visits
 * Provider-agnostic: supports Twilio, Zoom, Agora, Daily.co, Vonage
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Video provider type
 */
export type VideoProvider = 'twilio' | 'zoom' | 'agora' | 'daily' | 'vonage' | 'custom';

/**
 * Video session status
 */
export type SessionStatus =
  | 'created'
  | 'active'
  | 'paused'
  | 'ended'
  | 'failed';

/**
 * Participant role
 */
export type ParticipantRole = 'patient' | 'provider' | 'observer';

/**
 * Video quality settings
 */
export interface VideoQualitySettings {
  resolution: '480p' | '720p' | '1080p';
  frameRate: 15 | 24 | 30;
  bitrate: number; // kbps
}

/**
 * Video session participant
 */
export interface SessionParticipant {
  id: string;
  userId: string;
  userName: string;
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  duration?: number; // seconds

  // Connection info
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  networkType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';

  // Media state
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharingEnabled: boolean;

  // Stats
  packetsLost?: number;
  jitter?: number; // ms
  roundTripTime?: number; // ms

  // Device info
  browser?: string;
  os?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

/**
 * Video session
 */
export interface VideoSession {
  id: string;
  visitId: string;
  provider: VideoProvider;

  // Room details
  roomId: string;
  roomName: string;

  // Status
  status: SessionStatus;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // seconds

  // Participants
  participants: SessionParticipant[];
  maxParticipants: number;

  // Recording
  recordingEnabled: boolean;
  recordingStartedAt?: Date;
  recordingStoppedAt?: Date;
  recordingUrl?: string;
  recordingDuration?: number; // seconds

  // Features
  screenSharingEnabled: boolean;
  chatEnabled: boolean;
  waitingRoomEnabled: boolean;

  // Quality settings
  qualitySettings: VideoQualitySettings;

  // Session metadata
  metadata?: Record<string, any>;

  // Errors and issues
  errors?: Array<{
    timestamp: Date;
    error: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

/**
 * Access token for joining session
 */
export interface SessionAccessToken {
  token: string;
  expiresAt: Date;
  sessionId: string;
  participantId: string;
  role: ParticipantRole;
}

/**
 * Chat message in video session
 */
export interface SessionChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  recipientId?: string; // for private messages
}

/**
 * Screen sharing session
 */
export interface ScreenShareSession {
  id: string;
  sessionId: string;
  participantId: string;
  participantName: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // seconds
}

/**
 * Video Session Service
 */
export class VideoSessionService {
  /**
   * In-memory stores (use database in production)
   */
  private static sessions = new Map<string, VideoSession>();
  private static chatMessages: SessionChatMessage[] = [];
  private static screenShares = new Map<string, ScreenShareSession>();
  private static accessTokens = new Map<string, SessionAccessToken>();

  /**
   * Configuration
   */
  private static readonly TOKEN_EXPIRY_HOURS = 24;
  private static readonly MAX_SESSION_DURATION_HOURS = 4;
  private static readonly DEFAULT_MAX_PARTICIPANTS = 10;

  /**
   * Default quality settings by provider
   */
  private static readonly DEFAULT_QUALITY: Record<VideoProvider, VideoQualitySettings> = {
    twilio: { resolution: '720p', frameRate: 24, bitrate: 1200 },
    zoom: { resolution: '720p', frameRate: 30, bitrate: 1500 },
    agora: { resolution: '720p', frameRate: 24, bitrate: 1200 },
    daily: { resolution: '720p', frameRate: 24, bitrate: 1200 },
    vonage: { resolution: '720p', frameRate: 24, bitrate: 1200 },
    custom: { resolution: '720p', frameRate: 24, bitrate: 1200 },
  };

  // ========== Session Management ==========

  /**
   * Create video session
   */
  static async createSession(request: {
    visitId: string;
    provider: VideoProvider;
    maxParticipants?: number;
    recordingEnabled?: boolean;
    screenSharingEnabled?: boolean;
    chatEnabled?: boolean;
    waitingRoomEnabled?: boolean;
    qualitySettings?: Partial<VideoQualitySettings>;
  }): Promise<VideoSession> {
    const sessionId = crypto.randomUUID();
    const roomId = this.generateRoomId(request.provider);

    const session: VideoSession = {
      id: sessionId,
      visitId: request.visitId,
      provider: request.provider,
      roomId,
      roomName: `Visit-${request.visitId.substring(0, 8)}`,
      status: 'created',
      createdAt: new Date(),
      participants: [],
      maxParticipants: request.maxParticipants || this.DEFAULT_MAX_PARTICIPANTS,
      recordingEnabled: request.recordingEnabled ?? false,
      screenSharingEnabled: request.screenSharingEnabled ?? true,
      chatEnabled: request.chatEnabled ?? true,
      waitingRoomEnabled: request.waitingRoomEnabled ?? true,
      qualitySettings: {
        ...this.DEFAULT_QUALITY[request.provider],
        ...request.qualitySettings,
      },
    };

    this.sessions.set(sessionId, session);

    logger.info({ sessionId, visitId: request.visitId, provider: request.provider }, 'Video session created');

    return session;
  }

  /**
   * Generate room ID based on provider
   */
  private static generateRoomId(provider: VideoProvider): string {
    const prefix = provider.substring(0, 3).toUpperCase();
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}-${random}`;
  }

  /**
   * Get session
   */
  static async getSession(sessionId: string): Promise<VideoSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get session by visit ID
   */
  static async getSessionByVisit(visitId: string): Promise<VideoSession | null> {
    return Array.from(this.sessions.values()).find((s) => s.visitId === visitId) || null;
  }

  /**
   * Start session (first participant joins)
   */
  static async startSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.status !== 'created') {
      return { success: false, error: 'Session already started or ended' };
    }

    session.status = 'active';
    session.startedAt = new Date();

    this.sessions.set(sessionId, session);

    logger.info({ sessionId }, 'Video session started');

    return { success: true };
  }

  /**
   * End session
   */
  static async endSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.status === 'ended') {
      return { success: false, error: 'Session already ended' };
    }

    const endedAt = new Date();
    const duration = session.startedAt
      ? Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000)
      : 0;

    session.status = 'ended';
    session.endedAt = endedAt;
    session.duration = duration;

    // Update all participants still in session
    session.participants.forEach((p) => {
      if (!p.leftAt) {
        p.leftAt = endedAt;
        p.duration = p.joinedAt
          ? Math.round((endedAt.getTime() - p.joinedAt.getTime()) / 1000)
          : 0;
      }
    });

    // Stop any active screen shares
    Array.from(this.screenShares.values())
      .filter((ss) => ss.sessionId === sessionId && !ss.endedAt)
      .forEach((ss) => {
        ss.endedAt = endedAt;
        ss.duration = Math.round((endedAt.getTime() - ss.startedAt.getTime()) / 1000);
        this.screenShares.set(ss.id, ss);
      });

    this.sessions.set(sessionId, session);

    logger.info({ sessionId, duration }, 'Video session ended');

    return { success: true };
  }

  // ========== Participant Management ==========

  /**
   * Generate access token for participant
   */
  static async generateAccessToken(
    sessionId: string,
    userId: string,
    userName: string,
    role: ParticipantRole
  ): Promise<{ success: boolean; token?: SessionAccessToken; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.status === 'ended') {
      return { success: false, error: 'Session has ended' };
    }

    if (session.participants.length >= session.maxParticipants) {
      return { success: false, error: 'Session is full' };
    }

    const token: SessionAccessToken = {
      token: this.generateToken(),
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
      sessionId,
      participantId: crypto.randomUUID(),
      role,
    };

    this.accessTokens.set(token.token, token);

    logger.info({ sessionId, userId, role }, 'Access token generated');

    // In production, generate provider-specific token
    // For Twilio: use Twilio Video API
    // For Zoom: use Zoom SDK JWT
    // For Agora: use Agora token
    // etc.

    return { success: true, token };
  }

  /**
   * Generate random token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Validate access token
   */
  static async validateToken(tokenString: string): Promise<SessionAccessToken | null> {
    const token = this.accessTokens.get(tokenString);

    if (!token) {
      return null;
    }

    if (token.expiresAt < new Date()) {
      this.accessTokens.delete(tokenString);
      return null;
    }

    return token;
  }

  /**
   * Join session
   */
  static async joinSession(
    sessionId: string,
    tokenString: string,
    userId: string,
    userName: string,
    connectionInfo: {
      browser?: string;
      os?: string;
      deviceType?: SessionParticipant['deviceType'];
      networkType?: SessionParticipant['networkType'];
    }
  ): Promise<{ success: boolean; participant?: SessionParticipant; error?: string }> {
    // Validate token
    const token = await this.validateToken(tokenString);

    if (!token || token.sessionId !== sessionId) {
      return { success: false, error: 'Invalid or expired token' };
    }

    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.status === 'ended') {
      return { success: false, error: 'Session has ended' };
    }

    // Start session if this is first participant
    if (session.status === 'created') {
      await this.startSession(sessionId);
    }

    // Check if user already in session
    const existingParticipant = session.participants.find(
      (p) => p.userId === userId && !p.leftAt
    );

    if (existingParticipant) {
      return { success: false, error: 'Already in session' };
    }

    const participant: SessionParticipant = {
      id: token.participantId,
      userId,
      userName,
      role: token.role,
      joinedAt: new Date(),
      connectionQuality: 'good',
      networkType: connectionInfo.networkType || 'unknown',
      audioEnabled: true,
      videoEnabled: true,
      screenSharingEnabled: false,
      browser: connectionInfo.browser,
      os: connectionInfo.os,
      deviceType: connectionInfo.deviceType,
    };

    session.participants.push(participant);
    this.sessions.set(sessionId, session);

    logger.info({ sessionId, userId, role: token.role }, 'Participant joined session');

    return { success: true, participant };
  }

  /**
   * Leave session
   */
  static async leaveSession(
    sessionId: string,
    participantId: string
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const participant = session.participants.find((p) => p.id === participantId);

    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    if (participant.leftAt) {
      return { success: false, error: 'Already left session' };
    }

    const leftAt = new Date();
    participant.leftAt = leftAt;
    participant.duration = Math.round((leftAt.getTime() - participant.joinedAt.getTime()) / 1000);

    this.sessions.set(sessionId, session);

    // If participant was screen sharing, end it
    const activeScreenShare = Array.from(this.screenShares.values()).find(
      (ss) => ss.sessionId === sessionId && ss.participantId === participantId && !ss.endedAt
    );

    if (activeScreenShare) {
      await this.stopScreenShare(sessionId, participantId);
    }

    // If all participants have left, end session
    const activeParticipants = session.participants.filter((p) => !p.leftAt);
    if (activeParticipants.length === 0) {
      await this.endSession(sessionId);
    }

    logger.info({ sessionId, participantId, duration: participant.duration }, 'Participant left session');

    return { success: true };
  }

  /**
   * Update participant media state
   */
  static async updateMediaState(
    sessionId: string,
    participantId: string,
    state: {
      audioEnabled?: boolean;
      videoEnabled?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const participant = session.participants.find((p) => p.id === participantId && !p.leftAt);

    if (!participant) {
      return { success: false, error: 'Participant not in session' };
    }

    if (state.audioEnabled !== undefined) {
      participant.audioEnabled = state.audioEnabled;
    }

    if (state.videoEnabled !== undefined) {
      participant.videoEnabled = state.videoEnabled;
    }

    this.sessions.set(sessionId, session);

    return { success: true };
  }

  /**
   * Update connection quality
   */
  static async updateConnectionQuality(
    sessionId: string,
    participantId: string,
    quality: SessionParticipant['connectionQuality'],
    stats?: {
      packetsLost?: number;
      jitter?: number;
      roundTripTime?: number;
    }
  ): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    const participant = session.participants.find((p) => p.id === participantId);

    if (!participant) {
      return;
    }

    participant.connectionQuality = quality;

    if (stats) {
      participant.packetsLost = stats.packetsLost;
      participant.jitter = stats.jitter;
      participant.roundTripTime = stats.roundTripTime;
    }

    this.sessions.set(sessionId, session);
  }

  // ========== Recording ==========

  /**
   * Start recording
   */
  static async startRecording(sessionId: string): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (!session.recordingEnabled) {
      return { success: false, error: 'Recording not enabled for this session' };
    }

    if (session.recordingStartedAt) {
      return { success: false, error: 'Recording already in progress' };
    }

    session.recordingStartedAt = new Date();
    this.sessions.set(sessionId, session);

    logger.info({ sessionId }, 'Recording started');

    // In production: Start recording via provider API

    return { success: true };
  }

  /**
   * Stop recording
   */
  static async stopRecording(sessionId: string): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (!session.recordingStartedAt) {
      return { success: false, error: 'No recording in progress' };
    }

    const stoppedAt = new Date();
    session.recordingStoppedAt = stoppedAt;
    session.recordingDuration = Math.round(
      (stoppedAt.getTime() - session.recordingStartedAt.getTime()) / 1000
    );

    // In production: Stop recording via provider API and get URL
    session.recordingUrl = `/recordings/${sessionId}.mp4`;

    this.sessions.set(sessionId, session);

    logger.info({ sessionId, duration: session.recordingDuration }, 'Recording stopped');

    return { success: true };
  }

  // ========== Screen Sharing ==========

  /**
   * Start screen sharing
   */
  static async startScreenShare(
    sessionId: string,
    participantId: string,
    participantName: string
  ): Promise<{ success: boolean; screenShare?: ScreenShareSession; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (!session.screenSharingEnabled) {
      return { success: false, error: 'Screen sharing not enabled for this session' };
    }

    const participant = session.participants.find((p) => p.id === participantId && !p.leftAt);

    if (!participant) {
      return { success: false, error: 'Participant not in session' };
    }

    // Check if someone else is already sharing
    const activeScreenShare = Array.from(this.screenShares.values()).find(
      (ss) => ss.sessionId === sessionId && !ss.endedAt
    );

    if (activeScreenShare) {
      return { success: false, error: 'Another participant is already sharing screen' };
    }

    const screenShare: ScreenShareSession = {
      id: crypto.randomUUID(),
      sessionId,
      participantId,
      participantName,
      startedAt: new Date(),
    };

    this.screenShares.set(screenShare.id, screenShare);

    participant.screenSharingEnabled = true;
    this.sessions.set(sessionId, session);

    logger.info({ sessionId, participantId, participantName }, 'Screen sharing started');

    return { success: true, screenShare };
  }

  /**
   * Stop screen sharing
   */
  static async stopScreenShare(
    sessionId: string,
    participantId: string
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const participant = session.participants.find((p) => p.id === participantId);

    if (!participant) {
      return { success: false, error: 'Participant not found' };
    }

    const activeScreenShare = Array.from(this.screenShares.values()).find(
      (ss) => ss.sessionId === sessionId && ss.participantId === participantId && !ss.endedAt
    );

    if (!activeScreenShare) {
      return { success: false, error: 'No active screen share' };
    }

    const endedAt = new Date();
    activeScreenShare.endedAt = endedAt;
    activeScreenShare.duration = Math.round(
      (endedAt.getTime() - activeScreenShare.startedAt.getTime()) / 1000
    );

    this.screenShares.set(activeScreenShare.id, activeScreenShare);

    participant.screenSharingEnabled = false;
    this.sessions.set(sessionId, session);

    logger.info({ sessionId, participantId, duration: activeScreenShare.duration }, 'Screen sharing stopped');

    return { success: true };
  }

  // ========== Chat ==========

  /**
   * Send chat message
   */
  static async sendChatMessage(
    sessionId: string,
    senderId: string,
    senderName: string,
    message: string,
    recipientId?: string
  ): Promise<{ success: boolean; chatMessage?: SessionChatMessage; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (!session.chatEnabled) {
      return { success: false, error: 'Chat not enabled for this session' };
    }

    const sender = session.participants.find((p) => p.id === senderId && !p.leftAt);

    if (!sender) {
      return { success: false, error: 'Sender not in session' };
    }

    if (recipientId) {
      const recipient = session.participants.find((p) => p.id === recipientId && !p.leftAt);
      if (!recipient) {
        return { success: false, error: 'Recipient not in session' };
      }
    }

    const chatMessage: SessionChatMessage = {
      id: crypto.randomUUID(),
      sessionId,
      senderId,
      senderName,
      message,
      timestamp: new Date(),
      recipientId,
    };

    this.chatMessages.push(chatMessage);

    logger.info({ sessionId, senderId, isPrivate: !!recipientId }, 'Chat message sent');

    return { success: true, chatMessage };
  }

  /**
   * Get chat messages for session
   */
  static async getChatMessages(
    sessionId: string,
    participantId?: string
  ): Promise<SessionChatMessage[]> {
    let messages = this.chatMessages.filter((m) => m.sessionId === sessionId);

    if (participantId) {
      // Return public messages and private messages for this participant
      messages = messages.filter(
        (m) =>
          !m.recipientId || // public message
          m.recipientId === participantId || // sent to participant
          m.senderId === participantId // sent by participant
      );
    }

    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // ========== Error Reporting ==========

  /**
   * Report session error
   */
  static async reportError(
    sessionId: string,
    error: string,
    severity: VideoSession['errors'][0]['severity']
  ): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    if (!session.errors) {
      session.errors = [];
    }

    session.errors.push({
      timestamp: new Date(),
      error,
      severity,
    });

    this.sessions.set(sessionId, session);

    logger.error({ sessionId, error, severity }, 'Session error reported');

    // If critical error, mark session as failed
    if (severity === 'critical') {
      session.status = 'failed';
      this.sessions.set(sessionId, session);
    }
  }

  // ========== Statistics ==========

  /**
   * Get session statistics
   */
  static async getSessionStats(sessionId: string): Promise<{
    totalParticipants: number;
    currentParticipants: number;
    averageConnectionQuality: number;
    totalChatMessages: number;
    screenShareCount: number;
    recordingDuration?: number;
    averageParticipantDuration: number;
  } | null> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    const totalParticipants = session.participants.length;
    const currentParticipants = session.participants.filter((p) => !p.leftAt).length;

    const qualityScores = {
      excellent: 4,
      good: 3,
      fair: 2,
      poor: 1,
    };

    const avgQuality =
      session.participants.length > 0
        ? session.participants.reduce(
            (sum, p) => sum + qualityScores[p.connectionQuality],
            0
          ) / session.participants.length
        : 0;

    const chatMessages = this.chatMessages.filter((m) => m.sessionId === sessionId);

    const screenShares = Array.from(this.screenShares.values()).filter(
      (ss) => ss.sessionId === sessionId
    );

    const participantDurations = session.participants
      .filter((p) => p.duration)
      .map((p) => p.duration!);

    const avgDuration =
      participantDurations.length > 0
        ? participantDurations.reduce((sum, d) => sum + d, 0) / participantDurations.length
        : 0;

    return {
      totalParticipants,
      currentParticipants,
      averageConnectionQuality: avgQuality,
      totalChatMessages: chatMessages.length,
      screenShareCount: screenShares.length,
      recordingDuration: session.recordingDuration,
      averageParticipantDuration: avgDuration,
    };
  }
}
