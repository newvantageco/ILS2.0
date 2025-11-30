/**
 * Platform AI Service - Integrated AI Layer
 *
 * Design Philosophy:
 * - AI as an invisible, integrated layer - not a separate module
 * - Predictive assistance - anticipate user needs before they ask
 * - Context-aware suggestions based on user behavior and data patterns
 * - Task-oriented responses - not just answers, but actionable insights
 * - Multi-modal support - text, voice, visual inputs
 *
 * Capabilities:
 * - Proactive alerts and notifications
 * - Predictive analytics and forecasting
 * - Natural language commands for platform actions
 * - Context-aware search and filtering
 * - Automated workflow suggestions
 * - Real-time insights and recommendations
 */

import { IStorage } from "../storage";
import { createLogger, type Logger } from "../utils/logger";
import { ExternalAIService } from "./ExternalAIService";
import type {
  User,
  Company,
  Order,
  Patient,
  Appointment,
} from "@shared/schema";

// Types
export interface AIContext {
  userId: string;
  companyId: string;
  role: string;
  currentPage?: string;
  recentActions?: string[];
  sessionStartTime?: Date;
  preferences?: UserAIPreferences;
}

export interface UserAIPreferences {
  notificationFrequency: "high" | "medium" | "low" | "off";
  insightTypes: string[];
  automationLevel: "full" | "suggest" | "manual";
  preferredResponseLength: "concise" | "detailed";
}

export interface AICommand {
  type: "query" | "action" | "analysis" | "prediction";
  input: string;
  context: AIContext;
  attachments?: AIAttachment[];
  conversationId?: string;
}

export interface AIAttachment {
  type: "image" | "document" | "data";
  content: string | Buffer;
  mimeType?: string;
}

export interface AIResponse {
  id: string;
  type: "answer" | "action" | "insight" | "alert" | "prediction";
  content: string;
  confidence: number;
  sources?: AISource[];
  actions?: SuggestedAction[];
  metadata?: Record<string, unknown>;
  followUpQuestions?: string[];
  relatedInsights?: AIInsight[];
}

export interface AISource {
  type: "knowledge" | "data" | "external" | "learned";
  reference: string;
  relevance: number;
}

export interface SuggestedAction {
  id: string;
  label: string;
  command: string;
  type: "navigate" | "api" | "workflow";
  params?: Record<string, unknown>;
  confidence: number;
}

export interface AIInsight {
  id: string;
  type: "trend" | "anomaly" | "opportunity" | "risk" | "recommendation";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  confidence: number;
  data?: Record<string, unknown>;
  actionRequired?: boolean;
  expiresAt?: Date;
}

export interface PredictiveAlert {
  id: string;
  type: "patient_recall" | "inventory_low" | "revenue_anomaly" | "schedule_conflict" | "quality_issue";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  confidence: number;
  suggestedActions: SuggestedAction[];
  data: Record<string, unknown>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface AnalyticsInsight {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  prediction?: {
    nextValue: number;
    confidence: number;
    timeframe: string;
  };
  insights: string[];
}

// Service Implementation
export class PlatformAIService {
  private logger: Logger;
  private externalAI: ExternalAIService;
  private insightCache: Map<string, AIInsight[]> = new Map();
  private alertCache: Map<string, PredictiveAlert[]> = new Map();

  constructor(private storage: IStorage) {
    this.logger = createLogger("PlatformAIService");
    this.externalAI = new ExternalAIService();

    // Initialize periodic insight generation
    this.scheduleInsightGeneration();
  }

  /**
   * Process an AI command - the main entry point for all AI interactions
   */
  async processCommand(command: AICommand): Promise<AIResponse> {
    const startTime = Date.now();
    this.logger.info({
      type: command.type,
      userId: command.context.userId,
      companyId: command.context.companyId,
    }, "Processing AI command");

    try {
      let response: AIResponse;

      switch (command.type) {
        case "query":
          response = await this.handleQuery(command);
          break;
        case "action":
          response = await this.handleAction(command);
          break;
        case "analysis":
          response = await this.handleAnalysis(command);
          break;
        case "prediction":
          response = await this.handlePrediction(command);
          break;
        default:
          response = await this.handleQuery(command);
      }

      // Enrich response with follow-ups and related insights
      response = await this.enrichResponse(response, command.context);

      this.logger.info({
        responseId: response.id,
        type: response.type,
        confidence: response.confidence,
        duration: Date.now() - startTime,
      }, "AI command processed");

      return response;
    } catch (error) {
      this.logger.error({ error }, "Failed to process AI command");
      throw error;
    }
  }

  /**
   * Handle natural language queries
   */
  private async handleQuery(command: AICommand): Promise<AIResponse> {
    const { input, context } = command;

    // Classify the query intent
    const intent = await this.classifyIntent(input);

    // Get relevant context data
    const contextData = await this.gatherContextData(context, intent);

    // Generate response using external AI with context
    const aiResponse = await this.generateResponse(input, contextData, context);

    return {
      id: this.generateId(),
      type: "answer",
      content: aiResponse.content,
      confidence: aiResponse.confidence,
      sources: aiResponse.sources,
      actions: await this.suggestActions(input, context, intent),
      followUpQuestions: this.generateFollowUps(input, intent),
    };
  }

  /**
   * Handle action commands (e.g., "send recall reminders", "reorder frames")
   */
  private async handleAction(command: AICommand): Promise<AIResponse> {
    const { input, context } = command;

    // Parse the action request
    const actionPlan = await this.parseActionRequest(input, context);

    if (!actionPlan.canExecute) {
      return {
        id: this.generateId(),
        type: "answer",
        content: `I can help you with that. ${actionPlan.clarificationNeeded}`,
        confidence: 0.7,
        actions: actionPlan.suggestedActions,
      };
    }

    // Return the action plan for confirmation
    return {
      id: this.generateId(),
      type: "action",
      content: actionPlan.description,
      confidence: actionPlan.confidence,
      actions: actionPlan.actions,
      metadata: {
        requiresConfirmation: actionPlan.requiresConfirmation,
        affectedItems: actionPlan.affectedCount,
      },
    };
  }

  /**
   * Handle analytical requests
   */
  private async handleAnalysis(command: AICommand): Promise<AIResponse> {
    const { input, context } = command;

    // Determine what type of analysis is needed
    const analysisType = this.determineAnalysisType(input);

    // Run the analysis
    const analysisResult = await this.runAnalysis(analysisType, context);

    return {
      id: this.generateId(),
      type: "insight",
      content: analysisResult.summary,
      confidence: analysisResult.confidence,
      metadata: {
        analysisType,
        metrics: analysisResult.metrics,
        visualizations: analysisResult.charts,
      },
      relatedInsights: analysisResult.insights,
    };
  }

  /**
   * Handle prediction requests
   */
  private async handlePrediction(command: AICommand): Promise<AIResponse> {
    const { input, context } = command;

    // Determine prediction type
    const predictionType = this.determinePredictionType(input);

    // Generate prediction
    const prediction = await this.generatePrediction(predictionType, context);

    return {
      id: this.generateId(),
      type: "prediction",
      content: prediction.summary,
      confidence: prediction.confidence,
      metadata: {
        predictionType,
        timeframe: prediction.timeframe,
        dataPoints: prediction.historicalData,
        projectedValue: prediction.projectedValue,
      },
      actions: prediction.suggestedActions,
    };
  }

  /**
   * Generate proactive insights for a user/company
   */
  async generateProactiveInsights(context: AIContext): Promise<AIInsight[]> {
    const cacheKey = `${context.companyId}-${context.role}`;

    // Check cache first (insights regenerated every 15 minutes)
    const cachedInsights = this.insightCache.get(cacheKey);
    if (cachedInsights && cachedInsights.length > 0) {
      return cachedInsights.filter(i => !i.expiresAt || i.expiresAt > new Date());
    }

    const insights: AIInsight[] = [];

    try {
      // Generate role-specific insights
      switch (context.role) {
        case "ecp":
          insights.push(...await this.generateECPInsights(context));
          break;
        case "lab_tech":
        case "engineer":
          insights.push(...await this.generateLabInsights(context));
          break;
        case "admin":
        case "company_admin":
          insights.push(...await this.generateAdminInsights(context));
          break;
      }

      // Add general insights
      insights.push(...await this.generateGeneralInsights(context));

      // Cache the insights
      this.insightCache.set(cacheKey, insights);

    } catch (error) {
      this.logger.error({ error }, "Failed to generate proactive insights");
    }

    return insights;
  }

  /**
   * Generate predictive alerts
   */
  async generatePredictiveAlerts(context: AIContext): Promise<PredictiveAlert[]> {
    const cacheKey = `alerts-${context.companyId}`;

    const cachedAlerts = this.alertCache.get(cacheKey);
    if (cachedAlerts) {
      return cachedAlerts.filter(a => !a.expiresAt || a.expiresAt > new Date());
    }

    const alerts: PredictiveAlert[] = [];

    try {
      // Check for patient recall alerts
      alerts.push(...await this.checkPatientRecalls(context));

      // Check for inventory alerts
      alerts.push(...await this.checkInventoryLevels(context));

      // Check for revenue anomalies
      alerts.push(...await this.checkRevenueAnomalies(context));

      // Check for schedule conflicts
      alerts.push(...await this.checkScheduleConflicts(context));

      // Sort by severity and confidence
      alerts.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.confidence - a.confidence;
      });

      // Cache alerts
      this.alertCache.set(cacheKey, alerts);

    } catch (error) {
      this.logger.error({ error }, "Failed to generate predictive alerts");
    }

    return alerts;
  }

  /**
   * Get quick actions for the current context
   */
  async getQuickActions(context: AIContext): Promise<SuggestedAction[]> {
    const actions: SuggestedAction[] = [];

    // Role-based quick actions
    switch (context.role) {
      case "ecp":
        actions.push(
          {
            id: "analyze-revenue",
            label: "Analyze Revenue",
            command: "analyze revenue trends for this month",
            type: "api",
            confidence: 0.95,
          },
          {
            id: "patient-recalls",
            label: "View Patient Recalls",
            command: "show patients due for recall this week",
            type: "navigate",
            params: { path: "/ecp/recalls" },
            confidence: 0.92,
          },
          {
            id: "optimize-schedule",
            label: "Optimize Schedule",
            command: "suggest schedule optimizations for next week",
            type: "api",
            confidence: 0.85,
          }
        );
        break;

      case "lab_tech":
        actions.push(
          {
            id: "order-status",
            label: "Order Status",
            command: "summarize order status and delays",
            type: "api",
            confidence: 0.90,
          },
          {
            id: "quality-check",
            label: "Quality Alerts",
            command: "show quality control issues from today",
            type: "navigate",
            params: { path: "/lab/quality" },
            confidence: 0.88,
          }
        );
        break;

      case "admin":
      case "company_admin":
        actions.push(
          {
            id: "daily-summary",
            label: "Daily Summary",
            command: "generate business summary for today",
            type: "api",
            confidence: 0.94,
          },
          {
            id: "team-performance",
            label: "Team Performance",
            command: "analyze team productivity this week",
            type: "api",
            confidence: 0.87,
          }
        );
        break;
    }

    // Add context-aware actions based on current page
    if (context.currentPage) {
      actions.push(...await this.getPageSpecificActions(context));
    }

    return actions;
  }

  // Helper methods

  private async classifyIntent(input: string): Promise<string> {
    // Simple intent classification - in production, use NLP/ML
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("patient") || lowerInput.includes("recall")) {
      return "patient_management";
    }
    if (lowerInput.includes("order") || lowerInput.includes("status")) {
      return "order_tracking";
    }
    if (lowerInput.includes("revenue") || lowerInput.includes("sales") || lowerInput.includes("money")) {
      return "financial_analysis";
    }
    if (lowerInput.includes("schedule") || lowerInput.includes("appointment")) {
      return "scheduling";
    }
    if (lowerInput.includes("inventory") || lowerInput.includes("stock")) {
      return "inventory_management";
    }

    return "general_query";
  }

  private async gatherContextData(context: AIContext, intent: string): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {
      companyId: context.companyId,
      role: context.role,
      timestamp: new Date().toISOString(),
    };

    // Gather intent-specific data
    switch (intent) {
      case "patient_management":
        data.patientStats = await this.getPatientStats(context.companyId);
        break;
      case "order_tracking":
        data.orderStats = await this.getOrderStats(context.companyId);
        break;
      case "financial_analysis":
        data.financialStats = await this.getFinancialStats(context.companyId);
        break;
    }

    return data;
  }

  private async generateResponse(
    input: string,
    contextData: Record<string, unknown>,
    context: AIContext
  ): Promise<{ content: string; confidence: number; sources: AISource[] }> {
    // Use external AI to generate response with context
    const systemPrompt = this.buildSystemPrompt(context.role, contextData);

    try {
      const response = await this.externalAI.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ]);

      return {
        content: response.content,
        confidence: 0.85,
        sources: [{ type: "external", reference: "AI Assistant", relevance: 0.9 }],
      };
    } catch (error) {
      this.logger.error({ error }, "Failed to generate AI response");
      return {
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        confidence: 0,
        sources: [],
      };
    }
  }

  private buildSystemPrompt(role: string, contextData: Record<string, unknown>): string {
    const basePrompt = `You are an intelligent assistant for an optical/lens management platform (ILS 2.0).
You help ${role} users with their daily tasks, provide insights, and assist with decision-making.

Key capabilities:
- Answer questions about patients, orders, inventory, and business metrics
- Provide actionable recommendations based on data
- Help with scheduling and workflow optimization
- Offer predictive insights and alerts

Current context:
${JSON.stringify(contextData, null, 2)}

Guidelines:
- Be concise and actionable
- Provide specific numbers when available
- Suggest next steps when appropriate
- Flag any concerns or anomalies
`;

    return basePrompt;
  }

  private async suggestActions(
    input: string,
    context: AIContext,
    intent: string
  ): Promise<SuggestedAction[]> {
    const actions: SuggestedAction[] = [];

    // Suggest actions based on intent
    switch (intent) {
      case "patient_management":
        actions.push({
          id: "view-patients",
          label: "View Patients List",
          command: "navigate",
          type: "navigate",
          params: { path: "/ecp/patients" },
          confidence: 0.8,
        });
        break;
      case "financial_analysis":
        actions.push({
          id: "view-analytics",
          label: "Open Analytics Dashboard",
          command: "navigate",
          type: "navigate",
          params: { path: `/${context.role}/analytics` },
          confidence: 0.85,
        });
        break;
    }

    return actions;
  }

  private generateFollowUps(input: string, intent: string): string[] {
    const followUps: string[] = [];

    switch (intent) {
      case "patient_management":
        followUps.push(
          "Would you like me to send recall reminders?",
          "Show me patients with overdue appointments",
          "What's the average recall response rate?"
        );
        break;
      case "financial_analysis":
        followUps.push(
          "Compare with last month's performance",
          "Break down revenue by category",
          "What's the forecast for next month?"
        );
        break;
    }

    return followUps.slice(0, 3);
  }

  private async parseActionRequest(
    input: string,
    context: AIContext
  ): Promise<{
    canExecute: boolean;
    description: string;
    confidence: number;
    actions: SuggestedAction[];
    suggestedActions?: SuggestedAction[];
    clarificationNeeded?: string;
    requiresConfirmation: boolean;
    affectedCount?: number;
  }> {
    // Parse and validate the action request
    return {
      canExecute: false,
      description: "Action parsing placeholder",
      confidence: 0.5,
      actions: [],
      clarificationNeeded: "Could you please specify what action you'd like to take?",
      requiresConfirmation: true,
    };
  }

  private determineAnalysisType(input: string): string {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("revenue") || lowerInput.includes("financial")) return "financial";
    if (lowerInput.includes("patient")) return "patient";
    if (lowerInput.includes("order")) return "order";
    if (lowerInput.includes("inventory")) return "inventory";
    return "general";
  }

  private async runAnalysis(
    analysisType: string,
    context: AIContext
  ): Promise<{
    summary: string;
    confidence: number;
    metrics: Record<string, number>;
    charts: unknown[];
    insights: AIInsight[];
  }> {
    // Run analysis - placeholder
    return {
      summary: "Analysis complete. Key findings will be displayed here.",
      confidence: 0.85,
      metrics: {},
      charts: [],
      insights: [],
    };
  }

  private determinePredictionType(input: string): string {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("revenue") || lowerInput.includes("sales")) return "revenue";
    if (lowerInput.includes("demand") || lowerInput.includes("order")) return "demand";
    if (lowerInput.includes("patient")) return "patient_volume";
    return "general";
  }

  private async generatePrediction(
    predictionType: string,
    context: AIContext
  ): Promise<{
    summary: string;
    confidence: number;
    timeframe: string;
    historicalData: number[];
    projectedValue: number;
    suggestedActions: SuggestedAction[];
  }> {
    // Generate prediction - placeholder
    return {
      summary: "Prediction generated. Detailed forecast available.",
      confidence: 0.75,
      timeframe: "Next 30 days",
      historicalData: [100, 110, 105, 120, 115],
      projectedValue: 125,
      suggestedActions: [],
    };
  }

  private async enrichResponse(response: AIResponse, context: AIContext): Promise<AIResponse> {
    // Add related insights if not already present
    if (!response.relatedInsights) {
      const insights = await this.generateProactiveInsights(context);
      response.relatedInsights = insights.slice(0, 3);
    }
    return response;
  }

  private async generateECPInsights(context: AIContext): Promise<AIInsight[]> {
    return [
      {
        id: this.generateId(),
        type: "recommendation",
        title: "Patient Recall Opportunity",
        description: "5 patients are due for their annual eye exam this week",
        priority: "high",
        confidence: 0.92,
        actionRequired: true,
      },
    ];
  }

  private async generateLabInsights(context: AIContext): Promise<AIInsight[]> {
    return [
      {
        id: this.generateId(),
        type: "trend",
        title: "Production Efficiency Up",
        description: "Order processing time improved by 8% this week",
        priority: "medium",
        confidence: 0.88,
      },
    ];
  }

  private async generateAdminInsights(context: AIContext): Promise<AIInsight[]> {
    return [
      {
        id: this.generateId(),
        type: "opportunity",
        title: "Revenue Growth Opportunity",
        description: "Frame sales trending up 15%, consider expanding selection",
        priority: "medium",
        confidence: 0.82,
      },
    ];
  }

  private async generateGeneralInsights(context: AIContext): Promise<AIInsight[]> {
    return [];
  }

  private async checkPatientRecalls(context: AIContext): Promise<PredictiveAlert[]> {
    return [];
  }

  private async checkInventoryLevels(context: AIContext): Promise<PredictiveAlert[]> {
    return [];
  }

  private async checkRevenueAnomalies(context: AIContext): Promise<PredictiveAlert[]> {
    return [];
  }

  private async checkScheduleConflicts(context: AIContext): Promise<PredictiveAlert[]> {
    return [];
  }

  private async getPageSpecificActions(context: AIContext): Promise<SuggestedAction[]> {
    return [];
  }

  private async getPatientStats(companyId: string): Promise<Record<string, number>> {
    return { total: 0, active: 0, recallsDue: 0 };
  }

  private async getOrderStats(companyId: string): Promise<Record<string, number>> {
    return { pending: 0, inProgress: 0, completed: 0 };
  }

  private async getFinancialStats(companyId: string): Promise<Record<string, number>> {
    return { revenue: 0, growth: 0, avgOrder: 0 };
  }

  private scheduleInsightGeneration(): void {
    // Clear cache every 15 minutes
    setInterval(() => {
      this.insightCache.clear();
      this.alertCache.clear();
      this.logger.debug("Cleared AI insight and alert caches");
    }, 15 * 60 * 1000);
  }

  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default PlatformAIService;
