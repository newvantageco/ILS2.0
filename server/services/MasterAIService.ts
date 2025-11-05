/**
 * Master AI Service - Unified Tenant Intelligence
 * 
 * CONSOLIDATES:
 * - AIAssistantService (chat, learning, documents)
 * - UnifiedAIService (query routing, tool execution)
 * - ProprietaryAIService (topic validation)
 * - ExternalAIService (used as internal dependency)
 * 
 * PROVIDES:
 * - Chat interface with natural language processing
 * - Topic validation (optometry/eyecare ONLY)
 * - Intelligent query routing (knowledge vs data vs hybrid)
 * - Database tool execution (patients, orders, inventory, etc.)
 * - Progressive learning from interactions
 * - Document upload and knowledge extraction
 * - Multi-tenant isolation and security
 */

import { IStorage } from "../storage";
import { createLogger, type Logger } from "../utils/logger";
import { ExternalAIService, type AIMessage } from "./ExternalAIService";
import { AIService } from "./aiService";
import type { TenantContext } from "../middleware/tenantContext";
import { AIDataAccess, type QueryContext } from "./AIDataAccess";

export interface MasterAIQuery {
  message: string;
  companyId: string;
  userId: string;
  conversationId?: string;
  context?: Record<string, any>;
}

export interface MasterAIResponse {
  answer: string;
  conversationId: string;
  sources: Array<{
    type: 'python_rag' | 'external_ai' | 'learned_knowledge' | 'database_tool' | 'company_document';
    reference?: string;
    toolName?: string;
    confidence?: number;
  }>;
  toolsUsed: string[];
  confidence: number;
  isRelevant: boolean;
  rejectionReason?: string;
  suggestions?: string[];
  metadata: {
    tokensUsed?: number;
    responseTime: number;
    queryType: 'knowledge' | 'data' | 'hybrid' | 'learned';
    learningProgress: number;
    usedExternalAI: boolean;
  };
}

export class MasterAIService {
  private logger: Logger;
  private externalAI: ExternalAIService;
  private pythonAI: AIService | null = null;

  // Optometry and eye care keywords for topic validation
  private readonly RELEVANT_KEYWORDS = [
    'optometry', 'optometrist', 'eye exam', 'vision', 'prescription', 'refraction',
    'spectacle', 'eyeglasses', 'glasses', 'frames', 'lenses', 'lens', 'dispensing',
    'single vision', 'bifocal', 'progressive', 'varifocal', 'multifocal',
    'myopia', 'hyperopia', 'astigmatism', 'presbyopia',
    'sphere', 'cylinder', 'axis', 'prism', 'od', 'os', 'pd',
    'patient', 'customer', 'order', 'inventory', 'stock',
    'coating', 'anti-reflective', 'photochromic', 'polarized',
    'optical', 'optician', 'ecp', 'contact lens', 'exam', 'examination',
    'pupillary distance', 'seg height', 'fitting', 'adjustment'
  ];

  private readonly OFF_TOPIC_INDICATORS = [
    'weather', 'sports', 'recipe', 'cooking', 'movie', 'music',
    'politics', 'election', 'stock market', 'crypto', 'bitcoin',
    'car', 'travel', 'hotel', 'flight', 'programming', 'code'
  ];

  constructor(private storage: IStorage) {
    this.logger = createLogger("MasterAIService");
    this.externalAI = new ExternalAIService();
    
    if (!this.externalAI.isAvailable()) {
      this.logger.warn("No external AI providers available - will operate in offline mode");
    } else {
      const providers = this.externalAI.getAvailableProviders();
      this.logger.info(`Master AI initialized with providers: ${providers.join(', ')}`);
    }
  }

  /**
   * Main chat interface - process user queries
   */
  async chat(query: MasterAIQuery): Promise<MasterAIResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.info("Processing Master AI query", {
        companyId: query.companyId,
        userId: query.userId,
        messageLength: query.message.length
      });

      // Get company info for AI settings and learning progress
      const company = await this.storage.getCompany(query.companyId);
      if (!company) {
        throw new Error("Company not found");
      }

      // STEP 1: TOPIC VALIDATION - Is this about optometry/eyecare?
      const topicCheck = this.validateTopic(query.message);
      if (!topicCheck.isRelevant) {
        return this.createRejectionResponse(
          topicCheck.reason || "This question is not related to optometry or eye care.",
          query,
          Date.now() - startTime,
          0
        );
      }

      // STEP 2: CHECK LEARNED KNOWLEDGE FIRST (if learning progress > 25%)
      const learningProgress = company.aiLearningProgress || 0;
      if (learningProgress >= 25) {
        const learned = await this.searchLearnedKnowledge(query.message, query.companyId);
        if (learned.confidence > 0.85 && learned.answer) {
          this.logger.info("Using learned knowledge", { confidence: learned.confidence });
          return this.createLearnedResponse(learned, query, Date.now() - startTime, learningProgress);
        }
      }

      // STEP 3: CLASSIFY QUERY TYPE
      const queryType = this.classifyQuery(query.message);
      this.logger.info("Query classified", { queryType });

      // STEP 4: ROUTE TO APPROPRIATE HANDLER
      let response: MasterAIResponse;

      switch (queryType) {
        case 'knowledge':
          // Use Python RAG service for ophthalmic knowledge
          response = await this.handleKnowledgeQuery(query, company, startTime, learningProgress);
          break;

        case 'data':
          // Use External AI with database tools
          response = await this.handleDataQuery(query, company, startTime, learningProgress);
          break;

        case 'hybrid':
          // Combine both approaches
          response = await this.handleHybridQuery(query, company, startTime, learningProgress);
          break;

        default:
          // Fallback to data query with tools
          response = await this.handleDataQuery(query, company, startTime, learningProgress);
      }

      // STEP 5: SAVE CONVERSATION
      await this.saveConversation(query, response);

      // STEP 6: CREATE LEARNING OPPORTUNITY (if confidence > 70%)
      if (response.confidence > 0.7 && response.metadata.usedExternalAI) {
        await this.createLearningOpportunity(query, response);
      }

      return response;

    } catch (error) {
      this.logger.error("Error processing Master AI query", error as Error);
      throw error;
    }
  }

  /**
   * Validate if the topic is relevant to optometry/eye care
   */
  private validateTopic(message: string): { isRelevant: boolean; reason?: string; confidence: number } {
    const lowerMessage = message.toLowerCase();

    // Check for off-topic indicators
    const offTopicCount = this.OFF_TOPIC_INDICATORS.filter(indicator => 
      lowerMessage.includes(indicator)
    ).length;

    if (offTopicCount > 0) {
      return {
        isRelevant: false,
        reason: "This question appears to be outside the scope of optometry and eye care. I can only help with questions about vision, eyeglasses, lenses, prescriptions, and optical business operations.",
        confidence: 0.9
      };
    }

    // Check for relevant keywords
    const relevantCount = this.RELEVANT_KEYWORDS.filter(keyword =>
      lowerMessage.includes(keyword)
    ).length;

    if (relevantCount > 0) {
      return {
        isRelevant: true,
        confidence: Math.min(0.95, 0.5 + (relevantCount * 0.1))
      };
    }

    // If no clear indicators, allow it (AI will clarify if needed)
    return {
      isRelevant: true,
      confidence: 0.5
    };
  }

  /**
   * Classify the type of query
   */
  private classifyQuery(message: string): 'knowledge' | 'data' | 'hybrid' {
    const lowerMessage = message.toLowerCase();

    // Data query indicators
    const dataIndicators = [
      'show me', 'list', 'find', 'search', 'who', 'which', 'how many',
      'patient', 'customer', 'order', 'inventory', 'stock', 'sales',
      'today', 'yesterday', 'this week', 'this month', 'recent'
    ];

    // Knowledge query indicators
    const knowledgeIndicators = [
      'what is', 'what are', 'explain', 'define', 'how to', 'why',
      'difference between', 'benefits of', 'advantages', 'disadvantages',
      'recommend', 'should i', 'best practice', 'tell me about'
    ];

    const dataScore = dataIndicators.filter(ind => lowerMessage.includes(ind)).length;
    const knowledgeScore = knowledgeIndicators.filter(ind => lowerMessage.includes(ind)).length;

    if (dataScore > 0 && knowledgeScore > 0) {
      return 'hybrid';
    } else if (dataScore > knowledgeScore) {
      return 'data';
    } else {
      return 'knowledge';
    }
  }

  /**
   * Handle knowledge queries using Python RAG service
   */
  private async handleKnowledgeQuery(
    query: MasterAIQuery,
    company: any,
    startTime: number,
    learningProgress: number
  ): Promise<MasterAIResponse> {
    try {
      // Initialize Python AI service if needed
      if (!this.pythonAI) {
        const tenantContext: TenantContext = {
          tenantId: query.companyId,
          tenantCode: company.code || query.companyId,
          subscriptionTier: company.subscriptionTier || 'professional',
          aiQueriesLimit: company.aiQueriesLimit || 1000,
          aiQueriesUsed: company.aiQueriesUsed || 0
        };
        this.pythonAI = new AIService(tenantContext);
      }

      const result = await this.pythonAI.queryOphthalmicKnowledge(
        query.message,
        query.context ? JSON.stringify(query.context) : undefined
      );

      return {
        answer: result.answer || "I couldn't generate a response. Please try rephrasing your question.",
        conversationId: query.conversationId || this.generateConversationId(),
        sources: [
          {
            type: 'python_rag',
            reference: result.model || 'Fine-tuned ophthalmic model',
            confidence: 0.9
          }
        ],
        toolsUsed: [],
        confidence: 0.9,
        isRelevant: true,
        metadata: {
          responseTime: Date.now() - startTime,
          queryType: 'knowledge',
          learningProgress,
          usedExternalAI: false
        }
      };

    } catch (error) {
      this.logger.warn("Python RAG service failed, falling back to external AI", error as Error);
      // Fallback to external AI
      return await this.handleDataQuery(query, company, startTime, learningProgress);
    }
  }

  /**
   * Handle data queries using External AI with database tools
   */
  private async handleDataQuery(
    query: MasterAIQuery,
    company: any,
    startTime: number,
    learningProgress: number
  ): Promise<MasterAIResponse> {
    const tools = this.externalAI.getAvailableTools();
    const toolsUsed: string[] = [];

    // Tool execution handler
    const onToolCall = async (toolName: string, args: any) => {
      toolsUsed.push(toolName);
      this.logger.info(`Executing tool: ${toolName}`, args);
      return await this.executeTool(toolName, args, query.companyId);
    };

    const systemPrompt = this.buildSystemPrompt(company);
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query.message }
    ];

    const aiResponse = await this.externalAI.generateResponse(messages, {
      provider: 'openai',
      model: company.aiModel || 'gpt-4-turbo-preview',
      maxTokens: 2000,
      temperature: 0.7,
      tools,
      onToolCall
    });

    return {
      answer: aiResponse.content,
      conversationId: query.conversationId || this.generateConversationId(),
      sources: [
        {
          type: 'external_ai',
          reference: `${aiResponse.provider}/${aiResponse.model}`,
          confidence: 0.85
        },
        ...toolsUsed.map(tool => ({
          type: 'database_tool' as const,
          toolName: tool,
          confidence: 0.95
        }))
      ],
      toolsUsed,
      confidence: 0.85,
      isRelevant: true,
      metadata: {
        tokensUsed: aiResponse.tokensUsed.total,
        responseTime: Date.now() - startTime,
        queryType: 'data',
        learningProgress,
        usedExternalAI: true
      }
    };
  }

  /**
   * Handle hybrid queries (knowledge + data)
   */
  private async handleHybridQuery(
    query: MasterAIQuery,
    company: any,
    startTime: number,
    learningProgress: number
  ): Promise<MasterAIResponse> {
    // Get knowledge from Python service
    let knowledgeAnswer = "";
    let sources: MasterAIResponse['sources'] = [];

    try {
      if (!this.pythonAI) {
        const tenantContext: TenantContext = {
          tenantId: query.companyId,
          tenantCode: company.code || query.companyId,
          subscriptionTier: company.subscriptionTier || 'professional',
          aiQueriesLimit: company.aiQueriesLimit || 1000,
          aiQueriesUsed: company.aiQueriesUsed || 0
        };
        this.pythonAI = new AIService(tenantContext);
      }

      const knowledgeResult = await this.pythonAI.queryOphthalmicKnowledge(query.message);
      if (knowledgeResult.success) {
        knowledgeAnswer = knowledgeResult.answer;
        sources.push({
          type: 'python_rag',
          reference: 'Ophthalmic knowledge base',
          confidence: 0.9
        });
      }
    } catch (error) {
      this.logger.warn("Knowledge query failed in hybrid mode", error as Error);
    }

    // Get data using tools
    const tools = this.externalAI.getAvailableTools();
    const toolsUsed: string[] = [];

    const onToolCall = async (toolName: string, args: any) => {
      toolsUsed.push(toolName);
      return await this.executeTool(toolName, args, query.companyId);
    };

    const systemPrompt = this.buildSystemPrompt(company, knowledgeAnswer);
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query.message }
    ];

    const aiResponse = await this.externalAI.generateResponse(messages, {
      provider: 'openai',
      model: company.aiModel || 'gpt-4-turbo-preview',
      maxTokens: 2000,
      temperature: 0.7,
      tools,
      onToolCall
    });

    sources.push({
      type: 'external_ai',
      reference: `${aiResponse.provider}/${aiResponse.model}`,
      confidence: 0.85
    });

    toolsUsed.forEach(tool => {
      sources.push({
        type: 'database_tool',
        toolName: tool,
        confidence: 0.95
      });
    });

    return {
      answer: aiResponse.content,
      conversationId: query.conversationId || this.generateConversationId(),
      sources,
      toolsUsed,
      confidence: 0.88,
      isRelevant: true,
      metadata: {
        tokensUsed: aiResponse.tokensUsed.total,
        responseTime: Date.now() - startTime,
        queryType: 'hybrid',
        learningProgress,
        usedExternalAI: true
      }
    };
  }

  /**
   * Execute a tool/function call
   */
  private async executeTool(toolName: string, args: any, companyId: string): Promise<any> {
    try {
      // Create query context for all data access operations
      const context: QueryContext = {
        companyId,
        userId: args.userId || 'system',
        timeframe: args.timeframe ? {
          start: new Date(args.timeframe.start),
          end: new Date(args.timeframe.end)
        } : undefined
      };

      switch (toolName) {
        case 'get_revenue_data':
          return await AIDataAccess.getRevenueData(context);

        case 'get_order_stats':
          return await AIDataAccess.getOrderStats(context);

        case 'get_low_stock':
          return await AIDataAccess.getLowStockItems(context, args.threshold || 10);

        case 'get_top_products':
          return await AIDataAccess.getTopSellingProducts(context, args.limit || 10);

        case 'get_patient_stats':
          return await AIDataAccess.getPatientStats(context);

        case 'search_patients':
          return await AIDataAccess.searchPatients(context, args.searchTerm || '');

        case 'get_pending_orders':
          return await AIDataAccess.getPendingOrders(context);

        case 'get_company_info':
          return await AIDataAccess.getCompanyInfo(context);

        // Legacy tools (keeping for backward compatibility)
        case 'get_patient_info':
          return await this.toolGetPatientInfo(args, companyId);

        case 'check_inventory':
          return await this.toolCheckInventory(args, companyId);

        case 'get_sales_data':
          return await this.toolGetSalesData(args, companyId);

        case 'search_orders':
          return await this.toolSearchOrders(args, companyId);

        case 'get_examination_records':
          return await this.toolGetExaminationRecords(args, companyId);

        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      this.logger.error(`Tool execution failed: ${toolName}`, error as Error);
      return { error: (error as Error).message };
    }
  }

  /**
   * Tool: Get patient information
   */
  private async toolGetPatientInfo(args: any, companyId: string): Promise<any> {
    const { search } = args;
    
    const patients = await this.storage.getPatients(companyId);
    
    const searchTerm = search.toLowerCase();
    const filtered = patients.filter(p => {
      return p.name.toLowerCase().includes(searchTerm) || 
             p.email?.toLowerCase().includes(searchTerm);
    }).slice(0, 5);

    if (filtered.length === 0) {
      return { message: "No patients found matching that search" };
    }

    return {
      found: true,
      count: filtered.length,
      patients: filtered.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        registeredDate: p.createdAt
      }))
    };
  }

  /**
   * Tool: Check inventory
   */
  private async toolCheckInventory(args: any, companyId: string): Promise<any> {
    const { search, checkLowStock } = args;
    
    const products = await this.storage.getProducts(companyId);

    if (checkLowStock) {
      return {
        lowStockCount: 0,
        message: "Stock level tracking is being implemented",
        items: []
      };
    }

    const searchTerm = search.toLowerCase();
    const filtered = products.filter(item =>
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm)) ||
      (item.category && item.category.toLowerCase().includes(searchTerm))
    ).slice(0, 10);

    return {
      found: filtered.length > 0,
      count: filtered.length,
      items: filtered.map(i => ({
        name: i.name,
        sku: i.sku,
        category: i.category,
        brand: i.brand
      }))
    };
  }

  /**
   * Tool: Get sales data
   */
  private async toolGetSalesData(args: any, companyId: string): Promise<any> {
    const { timeframe } = args;
    
    const orders = await this.storage.getOrders({ ecpId: companyId });
    
    return {
      timeframe,
      orderCount: orders.length,
      message: "Sales analytics available - showing order count",
      note: "Full revenue tracking requires additional schema fields"
    };
  }

  /**
   * Tool: Search orders
   */
  private async toolSearchOrders(args: any, companyId: string): Promise<any> {
    const { search, status } = args;
    
    let orders = await this.storage.getOrders({ ecpId: companyId, status, search });
    const filtered = orders.slice(0, 20);

    return {
      found: filtered.length > 0,
      count: filtered.length,
      orders: filtered.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        date: o.orderDate
      }))
    };
  }

  /**
   * Tool: Get examination records
   */
  private async toolGetExaminationRecords(args: any, companyId: string): Promise<any> {
    const { patientId, patientName } = args;
    
    let pid = patientId;
    if (!pid && patientName) {
      const patients = await this.storage.getPatients(companyId);
      const patient = patients.find(p => 
        p.name.toLowerCase().includes(patientName.toLowerCase())
      );
      if (patient) {
        pid = patient.id;
      }
    }

    if (!pid) {
      return { error: "Patient not found" };
    }

    const examinations = await this.storage.getPatientExaminations(pid, companyId);

    return {
      patientId: pid,
      count: examinations.length,
      examinations: examinations.slice(0, 5).map(exam => ({
        id: exam.id,
        date: exam.examinationDate,
        status: exam.status
      }))
    };
  }

  /**
   * Search learned knowledge from database
   */
  private async searchLearnedKnowledge(
    question: string,
    companyId: string
  ): Promise<{ answer: string; confidence: number }> {
    try {
      const learningData = await this.storage.getAiLearningDataByCompany(companyId);
      
      if (learningData.length === 0) {
        return { answer: "", confidence: 0 };
      }

      const lowerQuestion = question.toLowerCase();
      let bestMatch = { answer: "", confidence: 0 };

      for (const learning of learningData) {
        if (!learning.question) continue;
        
        const similarity = this.calculateSimilarity(
          lowerQuestion,
          learning.question.toLowerCase()
        );

        const confidence = similarity * parseFloat(learning.confidence || '0.5');

        if (confidence > bestMatch.confidence) {
          bestMatch = {
            answer: learning.answer || "",
            confidence
          };
        }
      }

      return bestMatch;

    } catch (error) {
      this.logger.error("Error searching learned knowledge", error as Error);
      return { answer: "", confidence: 0 };
    }
  }

  /**
   * Calculate text similarity (simple word overlap)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    const words1Array = Array.from(words1);
    const words2Array = Array.from(words2);
    
    const intersection = words1Array.filter(x => words2.has(x));
    const union = Array.from(new Set([...words1Array, ...words2Array]));
    
    return intersection.length / union.length;
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(company: any, additionalContext?: string): string {
    let prompt = `You are an expert AI assistant for ${company.name || 'an optical business'}, specializing in optometry, spectacle dispensing, and eye care.

Your role is to:
- Answer questions about optometry, prescriptions, lenses, frames, and eye care
- Help with business operations: patients, orders, inventory, sales
- Provide accurate, professional advice based on industry best practices
- Use the available tools to access real-time data from the company's database

Guidelines:
- Always be professional and accurate
- If you use data from tools, cite what you found
- If you're not certain about medical advice, recommend consulting an eye care professional
- Keep responses clear and actionable`;

    if (additionalContext) {
      prompt += `\n\nAdditional context:\n${additionalContext}`;
    }

    return prompt;
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(
    query: MasterAIQuery,
    response: MasterAIResponse
  ): Promise<void> {
    try {
      let conversationId = response.conversationId;

      // Create conversation if new
      if (!query.conversationId) {
        const conversation = await this.storage.createAiConversation({
          companyId: query.companyId,
          userId: query.userId,
          title: query.message.substring(0, 100),
          status: 'active'
        });
        conversationId = conversation.id;
      }

      // Save user message
      await this.storage.createAiMessage({
        conversationId,
        role: 'user',
        content: query.message,
        usedExternalAi: false
      });

      // Save assistant response
      await this.storage.createAiMessage({
        conversationId,
        role: 'assistant',
        content: response.answer,
        usedExternalAi: response.metadata.usedExternalAI,
        confidence: response.confidence.toString()
      });

    } catch (error) {
      this.logger.error("Error saving conversation", error as Error);
    }
  }

  /**
   * Create learning opportunity from successful interaction
   */
  private async createLearningOpportunity(
    query: MasterAIQuery,
    response: MasterAIResponse
  ): Promise<void> {
    try {
      await this.storage.createAiLearningData({
        companyId: query.companyId,
        question: query.message,
        answer: response.answer,
        confidence: response.confidence.toString(),
        sourceType: 'conversation',
        useCount: 0,
        createdAt: new Date()
      });

      this.logger.info("Learning opportunity created", { companyId: query.companyId });
    } catch (error) {
      this.logger.error("Error creating learning opportunity", error as Error);
    }
  }

  /**
   * Create rejection response for off-topic questions
   */
  private createRejectionResponse(
    reason: string,
    query: MasterAIQuery,
    responseTime: number,
    learningProgress: number
  ): MasterAIResponse {
    return {
      answer: `I apologize, but ${reason}\n\nI'm specifically designed to help with:\n- Eye examinations and prescriptions\n- Spectacle lenses and frames\n- Optical products and inventory\n- Patient records and orders\n- Optical business operations\n\nHow can I help you with your optical business today?`,
      conversationId: query.conversationId || this.generateConversationId(),
      sources: [],
      toolsUsed: [],
      confidence: 0.95,
      isRelevant: false,
      rejectionReason: reason,
      suggestions: [
        "What lens coating is best for computer users?",
        "Show me patients due for recall",
        "How do I interpret a prescription?"
      ],
      metadata: {
        responseTime,
        queryType: 'knowledge',
        learningProgress,
        usedExternalAI: false
      }
    };
  }

  /**
   * Create response from learned knowledge
   */
  private createLearnedResponse(
    learned: { answer: string; confidence: number },
    query: MasterAIQuery,
    responseTime: number,
    learningProgress: number
  ): MasterAIResponse {
    return {
      answer: learned.answer,
      conversationId: query.conversationId || this.generateConversationId(),
      sources: [
        {
          type: 'learned_knowledge',
          reference: 'Company knowledge base',
          confidence: learned.confidence
        }
      ],
      toolsUsed: [],
      confidence: learned.confidence,
      isRelevant: true,
      metadata: {
        responseTime,
        queryType: 'learned',
        learningProgress,
        usedExternalAI: false
      }
    };
  }

  /**
   * Generate a new conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversations for a user/company
   */
  async getConversations(userId: string, companyId: string): Promise<any[]> {
    try {
      return await this.storage.getAiConversations(companyId, userId);
    } catch (error) {
      this.logger.error("Error getting conversations", error as Error);
      throw error;
    }
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(conversationId: string, companyId: string): Promise<any | null> {
    try {
      const conversation = await this.storage.getAiConversation(conversationId);
      
      if (!conversation || conversation.companyId !== companyId) {
        return null;
      }

      const messages = await this.storage.getAiMessages(conversationId);

      return {
        conversation,
        messages
      };
    } catch (error) {
      this.logger.error("Error getting conversation", error as Error);
      throw error;
    }
  }

  /**
   * Upload a document to the knowledge base
   */
  async uploadDocument(
    companyId: string,
    userId: string,
    file: {
      fileName: string;
      fileContent: string;
      fileType?: string;
    }
  ): Promise<any> {
    try {
      const knowledge = await this.storage.createAiKnowledgeBase({
        companyId,
        uploadedBy: userId,
        filename: file.fileName,
        fileType: file.fileType || 'text/plain',
        fileSize: file.fileContent.length,
        content: file.fileContent,
        processingStatus: 'completed',
        isActive: true
      });

      this.logger.info("Document uploaded", { companyId, filename: file.fileName });
      return knowledge;
    } catch (error) {
      this.logger.error("Error uploading document", error as Error);
      throw error;
    }
  }

  /**
   * Get knowledge base documents for a company
   */
  async getKnowledgeBase(companyId: string): Promise<any[]> {
    try {
      return await this.storage.getAiKnowledgeBaseByCompany(companyId);
    } catch (error) {
      this.logger.error("Error getting knowledge base", error as Error);
      throw error;
    }
  }

  /**
   * Get statistics for Master AI
   */
  async getStats(companyId: string): Promise<any> {
    try {
      const conversations = await this.storage.getAiConversations(companyId);
      const learningData = await this.storage.getAiLearningDataByCompany(companyId);
      const knowledgeBase = await this.storage.getAiKnowledgeBaseByCompany(companyId);

      let totalMessages = 0;
      let externalAICount = 0;
      
      for (const conv of conversations) {
        const messages = await this.storage.getAiMessages(conv.id);
        totalMessages += messages.length;
        externalAICount += messages.filter(m => m.usedExternalAi).length;
      }

      const avgConfidence = learningData.length > 0
        ? learningData.reduce((sum, l) => sum + parseFloat(l.confidence || '0.5'), 0) / learningData.length
        : 0.5;

      const company = await this.storage.getCompany(companyId);

      return {
        totalConversations: conversations.length,
        totalMessages,
        totalDocuments: knowledgeBase.length,
        totalLearningEntries: learningData.length,
        averageConfidence: avgConfidence,
        externalAIUsage: totalMessages > 0 ? (externalAICount / totalMessages) * 100 : 0,
        learningProgress: company?.aiLearningProgress || 0
      };
    } catch (error) {
      this.logger.error("Error getting stats", error as Error);
      throw error;
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.logger.info("Disposing MasterAIService");
  }
}
