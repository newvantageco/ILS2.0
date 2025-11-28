/**
 * Communications API Routes
 *
 * Routes for messaging, campaigns, and engagement workflows
 *
 * SECURITY: All routes require authentication and appropriate role-based access
 * - Template management: admin, company_admin, manager
 * - Sending messages: admin, company_admin, receptionist, manager
 * - Campaign management: admin, company_admin, manager
 */

import express from 'express';
import { loggers } from '../utils/logger';
import { CommunicationsService } from '../services/communications/CommunicationsService';
import { CampaignService } from '../services/communications/CampaignService';
import { EngagementWorkflowService } from '../services/communications/EngagementWorkflowService';
import { requireRole } from '../middleware/auth';

const router = express.Router();
const logger = loggers.api;

// Roles allowed to manage communication templates and campaigns
const ADMIN_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager'];

// Roles allowed to send individual messages
const MESSAGING_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist'];

// Roles allowed to view message history
const VIEW_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist', 'dispenser', 'ecp'];

// ========== Templates ==========

router.post('/templates', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const template = await CommunicationsService.createTemplate(companyId, req.body);
    res.status(201).json({ success: true, template });
  } catch (error) {
    logger.error({ error }, 'Create template error');
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

router.get('/templates', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { channel, category } = req.query;
    const templates = await CommunicationsService.listTemplates(companyId, channel as any, category as any);
    res.json({ success: true, templates });
  } catch (error) {
    logger.error({ error }, 'List templates error');
    res.status(500).json({ success: false, error: 'Failed to list templates' });
  }
});

router.get('/templates/:templateId', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const template = await CommunicationsService.getTemplate(req.params.templateId, companyId);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (error) {
    logger.error({ error }, 'Get template error');
    res.status(500).json({ success: false, error: 'Failed to get template' });
  }
});

// ========== Messages ==========

router.post('/messages/send', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { channel, recipientId, recipientType, to, content, options } = req.body;
    const result = await CommunicationsService.sendMessage(
      companyId,
      channel,
      recipientId,
      recipientType,
      to,
      content,
      options
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error({ error }, 'Send message error');
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

router.post('/messages/send-template', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { templateId, recipientId, recipientType, to, variables, options } = req.body;
    const result = await CommunicationsService.sendFromTemplate(
      companyId,
      templateId,
      recipientId,
      recipientType,
      to,
      variables,
      options
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error({ error }, 'Send template error');
    res.status(500).json({ success: false, error: 'Failed to send template' });
  }
});

router.get('/messages/:messageId', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const message = await CommunicationsService.getMessage(req.params.messageId, companyId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, message });
  } catch (error) {
    logger.error({ error }, 'Get message error');
    res.status(500).json({ success: false, error: 'Failed to get message' });
  }
});

router.get('/messages/recipient/:recipientId', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { channel } = req.query;
    const messages = await CommunicationsService.getRecipientMessages(req.params.recipientId, companyId, channel as any);
    res.json({ success: true, messages });
  } catch (error) {
    logger.error({ error }, 'Get recipient messages error');
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
});

router.get('/messages/stats', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { campaignId, channel, startDate, endDate } = req.query;
    const stats = await CommunicationsService.getMessageStats(companyId, {
      campaignId: campaignId as string,
      channel: channel as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, stats });
  } catch (error) {
    logger.error({ error }, 'Get message stats error');
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

router.get('/messages', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { channel, status, campaignId, search, limit = '100', offset = '0', startDate, endDate } = req.query;
    const messages = await CommunicationsService.listMessages(companyId, {
      channel: channel as any,
      status: status as any,
      campaignId: campaignId as string,
      search: search as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, messages: messages.messages, total: messages.total });
  } catch (error) {
    logger.error({ error }, 'List messages error');
    res.status(500).json({ success: false, error: 'Failed to list messages' });
  }
});

router.get('/messages/scheduled', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { channel, campaignId, limit = '100', offset = '0', startDate, endDate } = req.query;
    const scheduledMessages = await CommunicationsService.getScheduledMessages(companyId, {
      channel: channel as any,
      campaignId: campaignId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, messages: scheduledMessages.messages, total: scheduledMessages.total });
  } catch (error) {
    logger.error({ error }, 'Get scheduled messages error');
    res.status(500).json({ success: false, error: 'Failed to get scheduled messages' });
  }
});

router.post('/messages/:messageId/cancel', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await CommunicationsService.cancelScheduledMessage(req.params.messageId, companyId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Cancel scheduled message error');
    res.status(500).json({ success: false, error: 'Failed to cancel message' });
  }
});

// ========== Campaigns ==========

router.post('/campaigns', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const campaign = await CampaignService.createCampaign(companyId, req.body);
    res.status(201).json({ success: true, campaign });
  } catch (error) {
    logger.error({ error }, 'Create campaign error');
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

router.get('/campaigns', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { status } = req.query;
    const campaigns = await CampaignService.listCampaigns(companyId, status as any);
    res.json({ success: true, campaigns });
  } catch (error) {
    logger.error({ error }, 'List campaigns error');
    res.status(500).json({ success: false, error: 'Failed to list campaigns' });
  }
});

router.get('/campaigns/:campaignId', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const campaign = await CampaignService.getCampaign(req.params.campaignId, companyId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({ success: true, campaign });
  } catch (error) {
    logger.error({ error }, 'Get campaign error');
    res.status(500).json({ success: false, error: 'Failed to get campaign' });
  }
});

router.post('/campaigns/:campaignId/launch', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await CampaignService.launchCampaign(req.params.campaignId, companyId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Launch campaign error');
    res.status(500).json({ success: false, error: 'Failed to launch campaign' });
  }
});

router.post('/campaigns/:campaignId/pause', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const campaign = await CampaignService.pauseCampaign(req.params.campaignId, companyId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({ success: true, campaign });
  } catch (error) {
    logger.error({ error }, 'Pause campaign error');
    res.status(500).json({ success: false, error: 'Failed to pause campaign' });
  }
});

router.get('/campaigns/:campaignId/analytics', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const analytics = await CampaignService.getCampaignAnalytics(req.params.campaignId, companyId);
    if (!analytics) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    res.json({ success: true, analytics });
  } catch (error) {
    logger.error({ error }, 'Get campaign analytics error');
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// ========== Segments ==========

router.post('/segments', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, description, criteria } = req.body;
    const segment = await CampaignService.createSegment(companyId, name, description, criteria);
    res.status(201).json({ success: true, segment });
  } catch (error) {
    logger.error({ error }, 'Create segment error');
    res.status(500).json({ success: false, error: 'Failed to create segment' });
  }
});

router.get('/segments', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const segments = await CampaignService.listSegments(companyId);
    res.json({ success: true, segments });
  } catch (error) {
    logger.error({ error }, 'List segments error');
    res.status(500).json({ success: false, error: 'Failed to list segments' });
  }
});

// ========== Workflows ==========

router.post('/workflows', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const workflow = await EngagementWorkflowService.createWorkflow(companyId, req.body);
    res.status(201).json({ success: true, workflow });
  } catch (error) {
    logger.error({ error }, 'Create workflow error');
    res.status(500).json({ success: false, error: 'Failed to create workflow' });
  }
});

router.get('/workflows', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { trigger, status } = req.query;
    const workflows = await EngagementWorkflowService.listWorkflows(companyId, trigger as any, status as any);
    res.json({ success: true, workflows });
  } catch (error) {
    logger.error({ error }, 'List workflows error');
    res.status(500).json({ success: false, error: 'Failed to list workflows' });
  }
});

router.get('/workflows/:workflowId', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const workflow = await EngagementWorkflowService.getWorkflow(companyId, req.params.workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.json({ success: true, workflow });
  } catch (error) {
    logger.error({ error }, 'Get workflow error');
    res.status(500).json({ success: false, error: 'Failed to get workflow' });
  }
});

router.post('/workflows/trigger', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { trigger, patientId, triggerData } = req.body;
    const instances = await EngagementWorkflowService.triggerWorkflow(companyId, trigger, patientId, triggerData);
    res.json({ success: true, instances });
  } catch (error) {
    logger.error({ error }, 'Trigger workflow error');
    res.status(500).json({ success: false, error: 'Failed to trigger workflow' });
  }
});

router.get('/workflows/instances/:instanceId', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const instance = await EngagementWorkflowService.getWorkflowInstance(companyId, req.params.instanceId);
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    res.json({ success: true, instance });
  } catch (error) {
    logger.error({ error }, 'Get workflow instance error');
    res.status(500).json({ success: false, error: 'Failed to get instance' });
  }
});

// ========== Communication Preferences ==========

router.get('/preferences/:patientId', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const preferences = await CommunicationsService.getPreferences(req.params.patientId, companyId);
    res.json({ success: true, preferences });
  } catch (error) {
    logger.error({ error }, 'Get preferences error');
    res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
});

router.put('/preferences/:patientId', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const preferences = await CommunicationsService.updatePreferences(req.params.patientId, companyId, req.body);
    res.json({ success: true, preferences });
  } catch (error) {
    logger.error({ error }, 'Update preferences error');
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

router.post('/preferences/:patientId/opt-out', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { channel, category } = req.body;
    const preferences = await CommunicationsService.optOut(req.params.patientId, companyId, channel, category);
    res.json({ success: true, preferences });
  } catch (error) {
    logger.error({ error }, 'Opt-out error');
    res.status(500).json({ success: false, error: 'Failed to opt out' });
  }
});

router.post('/preferences/:patientId/opt-in', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { channel, category } = req.body;
    const preferences = await CommunicationsService.optIn(req.params.patientId, companyId, channel, category);
    res.json({ success: true, preferences });
  } catch (error) {
    logger.error({ error }, 'Opt-in error');
    res.status(500).json({ success: false, error: 'Failed to opt in' });
  }
});

// ========== Inbox / Two-Way Communications ==========

router.get('/inbox/conversations', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { status, channel, assignedTo, limit = '50', offset = '0' } = req.query;
    const conversations = await CommunicationsService.listConversations(companyId, {
      status: status as any,
      channel: channel as any,
      assignedTo: assignedTo as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
    res.json({ success: true, conversations: conversations.conversations, total: conversations.total });
  } catch (error) {
    logger.error({ error }, 'List conversations error');
    res.status(500).json({ success: false, error: 'Failed to list conversations' });
  }
});

router.get('/inbox/conversations/:conversationId', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const conversation = await CommunicationsService.getConversation(req.params.conversationId, companyId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, conversation });
  } catch (error) {
    logger.error({ error }, 'Get conversation error');
    res.status(500).json({ success: false, error: 'Failed to get conversation' });
  }
});

router.get('/inbox/conversations/:conversationId/messages', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const messages = await CommunicationsService.getConversationMessages(req.params.conversationId, companyId);
    res.json({ success: true, messages });
  } catch (error) {
    logger.error({ error }, 'Get conversation messages error');
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
});

router.post('/inbox/conversations/:conversationId/reply', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    const userId = (req as any).user?.id;
    if (!companyId || !userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { content } = req.body;
    const result = await CommunicationsService.replyToConversation(
      req.params.conversationId,
      companyId,
      userId,
      content
    );
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    logger.error({ error }, 'Reply to conversation error');
    res.status(500).json({ success: false, error: 'Failed to send reply' });
  }
});

router.put('/inbox/conversations/:conversationId/status', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { status } = req.body;
    const conversation = await CommunicationsService.updateConversationStatus(
      req.params.conversationId,
      companyId,
      status
    );
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, conversation });
  } catch (error) {
    logger.error({ error }, 'Update conversation status error');
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

router.put('/inbox/conversations/:conversationId/assign', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { assignedTo } = req.body;
    const conversation = await CommunicationsService.assignConversation(
      req.params.conversationId,
      companyId,
      assignedTo
    );
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, conversation });
  } catch (error) {
    logger.error({ error }, 'Assign conversation error');
    res.status(500).json({ success: false, error: 'Failed to assign conversation' });
  }
});

router.get('/inbox/stats', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const stats = await CommunicationsService.getInboxStats(companyId);
    res.json({ success: true, stats });
  } catch (error) {
    logger.error({ error }, 'Get inbox stats error');
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// ========== Quick Send / Broadcast Messaging ==========

router.post('/broadcast/preview', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { filters } = req.body;
    const recipients = await CommunicationsService.getRecipientsByFilters(companyId, filters);
    res.json({ success: true, recipients, count: recipients.length });
  } catch (error) {
    logger.error({ error }, 'Preview broadcast error');
    res.status(500).json({ success: false, error: 'Failed to preview recipients' });
  }
});

router.post('/broadcast/send', requireRole(MESSAGING_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    const userId = (req as any).user?.id;
    if (!companyId || !userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { channel, filters, content, scheduledFor } = req.body;
    const result = await CommunicationsService.sendBroadcast(
      companyId,
      userId,
      channel,
      filters,
      content,
      scheduledFor
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error({ error }, 'Send broadcast error');
    res.status(500).json({ success: false, error: 'Failed to send broadcast' });
  }
});

router.get('/broadcast/history', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { limit = '50', offset = '0' } = req.query;
    const broadcasts = await CommunicationsService.listBroadcasts(companyId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
    res.json({ success: true, broadcasts: broadcasts.broadcasts, total: broadcasts.total });
  } catch (error) {
    logger.error({ error }, 'List broadcasts error');
    res.status(500).json({ success: false, error: 'Failed to list broadcasts' });
  }
});

router.get('/broadcast/:broadcastId/stats', requireRole(VIEW_ROLES), async (req, res) => {
  try {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const stats = await CommunicationsService.getBroadcastStats(req.params.broadcastId, companyId);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Broadcast not found' });
    }
    res.json({ success: true, stats });
  } catch (error) {
    logger.error({ error }, 'Get broadcast stats error');
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

export default router;
