/**
 * Campaign Service
 *
 * Manages marketing campaigns, audience segmentation, and multi-channel messaging
 */

import { loggers } from '../../utils/logger.js';
import crypto from 'crypto';
import { CommunicationsService, CommunicationChannel, MessageStatus } from './CommunicationsService.js';

const logger = loggers.api;

// ========== Types & Interfaces ==========

/**
 * Campaign status
 */
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';

/**
 * Campaign type
 */
export type CampaignType = 'one_time' | 'recurring' | 'triggered' | 'drip';

/**
 * Audience segment
 */
export interface AudienceSegment {
  id: string;
  name: string;
  description?: string;
  criteria: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
    value: any;
  }>;
  size?: number;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Campaign
 */
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;

  // Audience
  segmentIds: string[];
  estimatedReach: number;

  // Content
  channel: CommunicationChannel;
  templateId: string;
  variables?: Record<string, string>; // Default variable values

  // Scheduling
  startDate?: Date;
  endDate?: Date;
  frequency?: 'daily' | 'weekly' | 'monthly'; // For recurring campaigns
  sendTime?: string; // HH:MM format

  // Tracking
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  unsubscribedCount: number;

  // Settings
  throttle?: number; // Messages per hour
  abTestEnabled: boolean;
  abTestVariant?: 'A' | 'B';

  createdAt: Date;
  updatedAt?: Date;
  launchedAt?: Date;
  completedAt?: Date;
}

/**
 * Campaign analytics
 */
export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  performance: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
  };
  timeline: Array<{
    date: Date;
    sent: number;
    opened: number;
    clicked: number;
  }>;
}

/**
 * Campaign Service
 */
export class CampaignService {
  /**
   * In-memory stores (use database in production)
   */
  private static campaigns = new Map<string, Campaign>();
  private static segments = new Map<string, AudienceSegment>();
  private static campaignRecipients = new Map<string, Set<string>>(); // campaignId -> recipientIds

  // ========== Segment Management ==========

  /**
   * Create audience segment
   */
  static async createSegment(
    name: string,
    description: string,
    criteria: AudienceSegment['criteria']
  ): Promise<AudienceSegment> {
    const segment: AudienceSegment = {
      id: crypto.randomUUID(),
      name,
      description,
      criteria,
      createdAt: new Date(),
    };

    // Calculate segment size (in production, query database)
    segment.size = await this.calculateSegmentSize(criteria);

    this.segments.set(segment.id, segment);

    logger.info({ segmentId: segment.id, name, size: segment.size }, 'Audience segment created');

    return segment;
  }

  /**
   * Calculate segment size
   */
  private static async calculateSegmentSize(criteria: AudienceSegment['criteria']): Promise<number> {
    // In production, query database with criteria
    // For now, return sample size
    return Math.floor(Math.random() * 10000) + 100;
  }

  /**
   * Get segment
   */
  static getSegment(segmentId: string): AudienceSegment | null {
    return this.segments.get(segmentId) || null;
  }

  /**
   * List segments
   */
  static listSegments(): AudienceSegment[] {
    return Array.from(this.segments.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Update segment
   */
  static async updateSegment(
    segmentId: string,
    updates: Partial<Omit<AudienceSegment, 'id' | 'createdAt'>>
  ): Promise<AudienceSegment | null> {
    const segment = this.segments.get(segmentId);

    if (!segment) {
      return null;
    }

    Object.assign(segment, updates, { updatedAt: new Date() });

    if (updates.criteria) {
      segment.size = await this.calculateSegmentSize(updates.criteria);
    }

    this.segments.set(segmentId, segment);

    return segment;
  }

  // ========== Campaign Management ==========

  /**
   * Create campaign
   */
  static async createCampaign(
    campaign: Omit<Campaign, 'id' | 'sentCount' | 'deliveredCount' | 'openedCount' | 'clickedCount' | 'unsubscribedCount' | 'createdAt'>
  ): Promise<Campaign> {
    // Calculate estimated reach
    let estimatedReach = 0;
    for (const segmentId of campaign.segmentIds) {
      const segment = this.segments.get(segmentId);
      if (segment?.size) {
        estimatedReach += segment.size;
      }
    }

    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      ...campaign,
      estimatedReach,
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      unsubscribedCount: 0,
      createdAt: new Date(),
    };

    this.campaigns.set(newCampaign.id, newCampaign);

    logger.info(
      {
        campaignId: newCampaign.id,
        name: campaign.name,
        estimatedReach,
      },
      'Campaign created'
    );

    return newCampaign;
  }

  /**
   * Get campaign
   */
  static getCampaign(campaignId: string): Campaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * List campaigns
   */
  static listCampaigns(status?: CampaignStatus): Campaign[] {
    let campaigns = Array.from(this.campaigns.values());

    if (status) {
      campaigns = campaigns.filter((c) => c.status === status);
    }

    return campaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update campaign
   */
  static updateCampaign(
    campaignId: string,
    updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
  ): Campaign | null {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return null;
    }

    // Can't update running campaigns
    if (campaign.status === 'running') {
      return null;
    }

    Object.assign(campaign, updates, { updatedAt: new Date() });

    this.campaigns.set(campaignId, campaign);

    return campaign;
  }

  /**
   * Launch campaign
   */
  static async launchCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return { success: false, error: 'Campaign cannot be launched' };
    }

    campaign.status = 'running';
    campaign.launchedAt = new Date();
    campaign.updatedAt = new Date();

    this.campaigns.set(campaignId, campaign);

    // Start sending messages
    await this.sendCampaignMessages(campaignId);

    logger.info({ campaignId, name: campaign.name }, 'Campaign launched');

    return { success: true };
  }

  /**
   * Send campaign messages
   */
  private static async sendCampaignMessages(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return;
    }

    // Get recipients from segments
    const recipients = await this.getCampaignRecipients(campaign);

    // Apply throttle if set
    const throttle = campaign.throttle || recipients.length;
    const batchSize = Math.ceil(throttle / 60); // Per minute

    let sent = 0;

    for (const recipient of recipients) {
      // Send message
      const result = await CommunicationsService.sendFromTemplate(
        campaign.templateId,
        recipient.id,
        recipient.type,
        recipient.contact,
        { ...campaign.variables, ...recipient.variables },
        {
          campaignId: campaign.id,
          metadata: {
            segmentIds: campaign.segmentIds,
            abTestVariant: campaign.abTestVariant,
          },
        }
      );

      if (result.success) {
        sent++;
        campaign.sentCount++;

        // Track recipient
        if (!this.campaignRecipients.has(campaignId)) {
          this.campaignRecipients.set(campaignId, new Set());
        }
        this.campaignRecipients.get(campaignId)!.add(recipient.id);
      }

      // Throttle if needed
      if (sent % batchSize === 0) {
        await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute
      }
    }

    campaign.updatedAt = new Date();
    this.campaigns.set(campaignId, campaign);

    // Check if campaign is complete
    if (campaign.type === 'one_time') {
      campaign.status = 'completed';
      campaign.completedAt = new Date();
      this.campaigns.set(campaignId, campaign);
    }

    logger.info({ campaignId, sent }, 'Campaign messages sent');
  }

  /**
   * Get campaign recipients
   */
  private static async getCampaignRecipients(campaign: Campaign): Promise<
    Array<{
      id: string;
      type: 'patient' | 'user';
      contact: string;
      variables: Record<string, string>;
    }>
  > {
    // In production, query database based on segment criteria
    // For now, return sample recipients
    const recipients: Array<{
      id: string;
      type: 'patient' | 'user';
      contact: string;
      variables: Record<string, string>;
    }> = [];

    for (let i = 0; i < Math.min(campaign.estimatedReach, 100); i++) {
      recipients.push({
        id: `recipient-${i}`,
        type: 'patient',
        contact: campaign.channel === 'email' ? `patient${i}@example.com` : `555000${i}`,
        variables: {
          firstName: `Patient${i}`,
          lastName: `Test`,
        },
      });
    }

    return recipients;
  }

  /**
   * Pause campaign
   */
  static pauseCampaign(campaignId: string): Campaign | null {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign || campaign.status !== 'running') {
      return null;
    }

    campaign.status = 'paused';
    campaign.updatedAt = new Date();

    this.campaigns.set(campaignId, campaign);

    logger.info({ campaignId }, 'Campaign paused');

    return campaign;
  }

  /**
   * Resume campaign
   */
  static async resumeCampaign(campaignId: string): Promise<Campaign | null> {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign || campaign.status !== 'paused') {
      return null;
    }

    campaign.status = 'running';
    campaign.updatedAt = new Date();

    this.campaigns.set(campaignId, campaign);

    // Continue sending messages
    await this.sendCampaignMessages(campaignId);

    logger.info({ campaignId }, 'Campaign resumed');

    return campaign;
  }

  /**
   * Cancel campaign
   */
  static cancelCampaign(campaignId: string): Campaign | null {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return null;
    }

    campaign.status = 'cancelled';
    campaign.updatedAt = new Date();

    this.campaigns.set(campaignId, campaign);

    logger.info({ campaignId }, 'Campaign cancelled');

    return campaign;
  }

  // ========== Analytics ==========

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return null;
    }

    // Get message stats
    const stats = CommunicationsService.getMessageStats({ campaignId });

    // Get campaign messages for timeline
    const messages = CommunicationsService.getCampaignMessages(campaignId);

    // Group by date
    const timeline = new Map<string, { sent: number; opened: number; clicked: number }>();

    messages.forEach((msg) => {
      const date = msg.createdAt.toISOString().split('T')[0];
      const existing = timeline.get(date) || { sent: 0, opened: 0, clicked: 0 };

      existing.sent++;
      if (msg.openedAt) existing.opened++;
      if (msg.clickedAt) existing.clicked++;

      timeline.set(date, existing);
    });

    return {
      campaignId,
      campaignName: campaign.name,
      status: campaign.status,
      performance: {
        sent: stats.sent,
        delivered: stats.delivered,
        opened: stats.opened,
        clicked: stats.clicked,
        bounced: stats.bounced,
        unsubscribed: campaign.unsubscribedCount,
        deliveryRate: stats.deliveryRate,
        openRate: stats.openRate,
        clickRate: stats.clickRate,
        unsubscribeRate: stats.sent > 0 ? (campaign.unsubscribedCount / stats.sent) * 100 : 0,
      },
      timeline: Array.from(timeline.entries())
        .map(([date, data]) => ({
          date: new Date(date),
          ...data,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    };
  }

  /**
   * Update campaign stats from messages
   */
  static updateCampaignStats(campaignId: string): void {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return;
    }

    const messages = CommunicationsService.getCampaignMessages(campaignId);

    campaign.deliveredCount = messages.filter((m) => m.deliveredAt).length;
    campaign.openedCount = messages.filter((m) => m.openedAt).length;
    campaign.clickedCount = messages.filter((m) => m.clickedAt).length;
    campaign.unsubscribedCount = messages.filter((m) => m.status === 'unsubscribed').length;

    this.campaigns.set(campaignId, campaign);
  }

  // ========== A/B Testing ==========

  /**
   * Create A/B test campaign
   */
  static async createABTest(
    baseConfig: Omit<Campaign, 'id' | 'sentCount' | 'deliveredCount' | 'openedCount' | 'clickedCount' | 'unsubscribedCount' | 'createdAt' | 'abTestEnabled' | 'abTestVariant'>,
    variantBTemplateId: string
  ): Promise<{ campaignA: Campaign; campaignB: Campaign }> {
    const campaignA = await this.createCampaign({
      ...baseConfig,
      name: `${baseConfig.name} - Variant A`,
      abTestEnabled: true,
      abTestVariant: 'A',
    });

    const campaignB = await this.createCampaign({
      ...baseConfig,
      name: `${baseConfig.name} - Variant B`,
      templateId: variantBTemplateId,
      abTestEnabled: true,
      abTestVariant: 'B',
    });

    logger.info(
      { campaignAId: campaignA.id, campaignBId: campaignB.id },
      'A/B test campaigns created'
    );

    return { campaignA, campaignB };
  }

  /**
   * Get A/B test comparison
   */
  static async getABTestComparison(
    campaignAId: string,
    campaignBId: string
  ): Promise<{
    variantA: CampaignAnalytics;
    variantB: CampaignAnalytics;
    winner?: 'A' | 'B';
  } | null> {
    const analyticsA = await this.getCampaignAnalytics(campaignAId);
    const analyticsB = await this.getCampaignAnalytics(campaignBId);

    if (!analyticsA || !analyticsB) {
      return null;
    }

    // Determine winner based on click rate
    let winner: 'A' | 'B' | undefined;

    if (analyticsA.performance.clickRate > analyticsB.performance.clickRate) {
      winner = 'A';
    } else if (analyticsB.performance.clickRate > analyticsA.performance.clickRate) {
      winner = 'B';
    }

    return {
      variantA: analyticsA,
      variantB: analyticsB,
      winner,
    };
  }
}
