/**
 * AI Assistant Service
 * 
 * Progressive learning AI assistant that:
 * - Answers business questions using company-specific knowledge
 * - Learns from conversations and uploaded documents
 * - Gradually reduces reliance on external AI APIs
 * - Provides company-specific recommendations and insights
 * 
 * Learning Progression:
 * 0-25%: Heavy reliance on external AI (GPT-4)
 * 25-50%: Mix of learned data and external AI
 * 50-75%: Primarily uses learned data, external AI for complex queries
 * 75-100%: Mostly autonomous, external AI only for novel situations
 */

import { IStorage } from "../storage";
import { createLogger, type Logger } from "../utils/logger";
import { NeuralNetworkService } from "./NeuralNetworkService";
import { ExternalAIService } from "./ExternalAIService";
import type { 
  InsertAiConversation, 
  InsertAiMessage, 
  InsertAiLearningData,
  AiConversation,
  AiMessage,
  AiKnowledgeBase,
  AiLearningData
} from "@shared/schema";

export interface AiAssistantConfig {
  companyId: string;
  useExternalAi: boolean;
  learningProgress: number; // 0-100
  model?: string;
}

export interface AiQuery {
  question: string;
  context?: Record<string, any>;
  conversationId?: string;
  userId: string;
}

export interface AiResponse {
  answer: string;
  confidence: number; // 0-1
  usedExternalAi: boolean;
  sources: Array<{
    type: 'learned' | 'document' | 'external';
    reference?: string;
    relevance: number;
  }>;
  suggestions?: string[];
  learningOpportunity?: boolean;
}

export class AIAssistantService {
  private logger: Logger;
  private externalAI: ExternalAIService;
  private externalAiAvailable: boolean = true;
  private neuralNetworks: Map<string, NeuralNetworkService> = new Map();

  constructor(private storage: IStorage) {
    this.logger = createLogger("AIAssistantService");
    // Initialize external AI service
    this.externalAI = new ExternalAIService();
    this.externalAiAvailable = this.externalAI.isAvailable();
    
    if (this.externalAiAvailable) {
      const providers = this.externalAI.getAvailableProviders();
      this.logger.info(`External AI initialized with providers: ${providers.join(', ')}`);
    } else {
      this.logger.warn("No external AI providers available");
    }
  }

  /**
   * Get or create neural network for a company
   */
  private async getNeuralNetwork(companyId: string): Promise<NeuralNetworkService> {
    if (!this.neuralNetworks.has(companyId)) {
      const nn = new NeuralNetworkService(companyId);
      await nn.initialize();
      this.neuralNetworks.set(companyId, nn);
    }
    return this.neuralNetworks.get(companyId)!;
  }

  /**
   * Main method to ask the AI assistant a question
   */
  async ask(query: AiQuery, config: AiAssistantConfig): Promise<AiResponse> {
    try {
      this.logger.info("Processing AI query", { 
        companyId: config.companyId, 
        learningProgress: config.learningProgress 
      });

      // Step 1: Try neural network prediction if learning progress is high enough
      let neuralNetworkAnswer: string | null = null;
      if (config.learningProgress >= 25) {
        try {
          const nn = await this.getNeuralNetwork(config.companyId);
          neuralNetworkAnswer = await nn.predict(query.question);
          this.logger.info("Neural network prediction obtained", {
            questionLength: query.question.length,
            answerLength: neuralNetworkAnswer?.length
          });
        } catch (error) {
          this.logger.warn("Neural network prediction failed, falling back", error as Error);
        }
      }

      // Step 2: Search learned knowledge base
      const learnedAnswers = await this.searchLearnedKnowledge(
        query.question, 
        config.companyId
      );

      // Step 3: Search uploaded documents
      const documentContext = await this.searchDocuments(
        query.question,
        config.companyId
      );

      // Step 4: Decide if we can answer with learned data or need external AI
      const canAnswerLocally = await this.canAnswerWithLearnedData(
        learnedAnswers,
        documentContext,
        config.learningProgress
      );

      let response: AiResponse;

      // If neural network provided a good answer and learning progress is high, use it
      if (neuralNetworkAnswer && neuralNetworkAnswer.length > 20 && config.learningProgress >= 50) {
        response = {
          answer: neuralNetworkAnswer,
          confidence: config.learningProgress / 100,
          usedExternalAi: false,
          sources: [
            {
              type: 'learned',
              relevance: 0.9,
              reference: 'Neural Network Model'
            }
          ],
          suggestions: [],
          learningOpportunity: false
        };
      } else if (canAnswerLocally && learnedAnswers.length > 0) {
        // Answer from learned knowledge
        response = await this.generateLocalAnswer(
          query.question,
          learnedAnswers,
          documentContext
        );
      } else if (config.useExternalAi && this.externalAiAvailable) {
        // Use external AI
        response = await this.generateExternalAiAnswer(
          query.question,
          learnedAnswers,
          documentContext,
          config
        );
      } else {
        // Fallback: provide best-effort answer from available data
        response = await this.generateFallbackAnswer(
          query.question,
          learnedAnswers,
          documentContext
        );
      }

      // Step 4: Save conversation
      await this.saveConversation(query, response, config);

      // Step 5: Identify learning opportunities
      if (response.learningOpportunity) {
        await this.createLearningOpportunity(query, response, config.companyId);
      }

      return response;
    } catch (error) {
      this.logger.error("Error processing AI query", error as Error);
      throw error;
    }
  }

  /**
   * Search the learned knowledge base for relevant answers
   */
  private async searchLearnedKnowledge(
    question: string,
    companyId: string
  ): Promise<AiLearningData[]> {
    try {
      // In production, this would use vector similarity search with embeddings
      // For now, we'll use a simplified keyword-based search
      
      const keywords = this.extractKeywords(question);
      const allLearning = await this.storage.getAiLearningDataByCompany(companyId);

      // Filter and score learning data
      const scoredLearning = allLearning
        .filter(learning => {
          if (!learning.question || !learning.answer) return false;
          
          // Calculate relevance score
          const questionMatch = this.calculateTextSimilarity(
            question.toLowerCase(),
            learning.question.toLowerCase()
          );
          
          return questionMatch > 0.3; // 30% similarity threshold
        })
        .map(learning => ({
          ...learning,
          relevanceScore: this.calculateRelevanceScore(question, learning)
        }))
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, 5); // Top 5 most relevant

      return scoredLearning;
    } catch (error) {
      this.logger.error("Error searching learned knowledge", error as Error);
      return [];
    }
  }

  /**
   * Search uploaded documents for relevant context
   */
  private async searchDocuments(
    question: string,
    companyId: string
  ): Promise<AiKnowledgeBase[]> {
    try {
      const documents = await this.storage.getAiKnowledgeBaseByCompany(companyId);
      
      // Filter active documents and calculate relevance
      const relevantDocs = documents
        .filter(doc => doc.isActive && doc.content)
        .map(doc => ({
          ...doc,
          relevanceScore: this.calculateTextSimilarity(
            question.toLowerCase(),
            (doc.content || '').toLowerCase()
          )
        }))
        .filter(doc => (doc.relevanceScore || 0) > 0.2)
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, 3); // Top 3 most relevant documents

      return relevantDocs;
    } catch (error) {
      this.logger.error("Error searching documents", error as Error);
      return [];
    }
  }

  /**
   * Determine if we can answer with local learned data
   */
  private async canAnswerWithLearnedData(
    learnedAnswers: any[],
    documentContext: any[],
    learningProgress: number
  ): Promise<boolean> {
    // Decision matrix based on learning progress
    if (learningProgress >= 75) {
      // High autonomy - use learned data unless no matches
      return learnedAnswers.length > 0 || documentContext.length > 0;
    } else if (learningProgress >= 50) {
      // Medium autonomy - use learned data if confidence is high
      return learnedAnswers.length > 0 && 
             learnedAnswers[0].relevanceScore > 0.7;
    } else if (learningProgress >= 25) {
      // Low autonomy - only use learned data for exact matches
      return learnedAnswers.length > 0 && 
             learnedAnswers[0].relevanceScore > 0.9;
    } else {
      // Very low autonomy - prefer external AI
      return false;
    }
  }

  /**
   * Generate answer from learned knowledge
   */
  private async generateLocalAnswer(
    question: string,
    learnedAnswers: any[],
    documentContext: any[]
  ): Promise<AiResponse> {
    const bestAnswer = learnedAnswers[0];
    
    // Combine answer with document context if available
    let answer = bestAnswer.answer;
    const sources: AiResponse['sources'] = [];

    sources.push({
      type: 'learned',
      reference: `Learned from ${bestAnswer.sourceType}`,
      relevance: bestAnswer.relevanceScore || 0.8
    });

    // Add document context
    if (documentContext.length > 0) {
      const docContext = documentContext
        .map(doc => `\n\nRelevant information from ${doc.filename}:\n${this.extractRelevantExcerpt(doc.content, question)}`)
        .join('');
      
      answer += docContext;

      documentContext.forEach(doc => {
        sources.push({
          type: 'document',
          reference: doc.filename,
          relevance: doc.relevanceScore || 0.5
        });
      });
    }

    // Update use count
    await this.storage.incrementAiLearningUseCount(bestAnswer.id);

    return {
      answer,
      confidence: Math.min(0.95, bestAnswer.confidence + 0.1),
      usedExternalAi: false,
      sources,
      learningOpportunity: false
    };
  }

  /**
   * Generate answer using external AI (GPT-4, Claude, etc.)
   */
  private async generateExternalAiAnswer(
    question: string,
    learnedAnswers: any[],
    documentContext: any[],
    config: AiAssistantConfig
  ): Promise<AiResponse> {
    try {
      // Build context from learned data and documents
      let contextPrompt = "";
      
      if (documentContext.length > 0) {
        contextPrompt += "\n\nRelevant company documents:\n";
        documentContext.forEach(doc => {
          contextPrompt += `- ${doc.filename}: ${this.extractRelevantExcerpt(doc.content, question)}\n`;
        });
      }

      if (learnedAnswers.length > 0) {
        contextPrompt += "\n\nPreviously learned information:\n";
        learnedAnswers.slice(0, 3).forEach(learning => {
          contextPrompt += `Q: ${learning.question}\nA: ${learning.answer}\n\n`;
        });
      }

      // Use real external AI if available
      if (this.externalAiAvailable) {
        const systemPrompt = this.externalAI.buildSystemPrompt(contextPrompt);
        
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: question }
        ];

        // Determine provider and model based on config
        const provider = config.model?.startsWith('claude') ? 'anthropic' : 'openai';
        const model = config.model || (provider === 'openai' ? 'gpt-4-turbo-preview' : 'claude-3-sonnet-20240229');

        const aiResponse = await this.externalAI.generateResponse(messages, {
          provider,
          model,
          maxTokens: 2000,
          temperature: 0.7,
        });

        this.logger.info("External AI response generated", {
          provider: aiResponse.provider,
          model: aiResponse.model,
          tokensUsed: aiResponse.tokensUsed.total,
          estimatedCost: aiResponse.estimatedCost
        });

        const sources: AiResponse['sources'] = [
          { type: 'external', relevance: 1.0 }
        ];

        // Add document sources
        documentContext.forEach(doc => {
          sources.push({
            type: 'document',
            reference: doc.filename,
            relevance: doc.relevanceScore || 0.5
          });
        });

        return {
          answer: aiResponse.content,
          confidence: 0.9,
          usedExternalAi: true,
          sources,
          learningOpportunity: true,
          suggestions: [
            "Would you like me to remember this for future questions?",
            "Should I create a knowledge base entry from this conversation?"
          ]
        };
      } else {
        // Fallback to simulated response if no external AI available
        const simulatedResponse = await this.simulateExternalAI(
          question,
          contextPrompt,
          config
        );

        const sources: AiResponse['sources'] = [
          { type: 'external', relevance: 1.0 }
        ];

        documentContext.forEach(doc => {
          sources.push({
            type: 'document',
            reference: doc.filename,
            relevance: doc.relevanceScore || 0.5
          });
        });

        return {
          answer: simulatedResponse,
          confidence: 0.85,
          usedExternalAi: true,
          sources,
          learningOpportunity: true,
          suggestions: [
            "Would you like me to remember this for future questions?",
            "Should I create a knowledge base entry from this conversation?"
          ]
        };
      }
    } catch (error) {
      this.logger.error("Error with external AI", error as Error);
      throw error;
    }
  }

  /**
   * Simulate external AI response (placeholder for actual API integration)
   */
  private async simulateExternalAI(
    question: string,
    context: string,
    config: AiAssistantConfig
  ): Promise<string> {
    // This is a placeholder. In production, integrate with:
    // - OpenAI GPT-4 API
    // - Anthropic Claude API
    // - Or self-hosted models like Llama 2
    
    const systemPrompt = `You are a helpful AI assistant for an optical lens manufacturing and dispensing business. 
You have access to company-specific information and should provide accurate, professional advice.

Context from company knowledge base:
${context}

Provide clear, actionable answers that help the user with their optical business operations.`;

    // Placeholder response
    return `Based on the available information and best practices in the optical industry, here's my response to your question:

${question}

[This is a simulated AI response. In production, this would be generated by GPT-4 or similar AI model with access to your company's specific knowledge base and industry best practices.]

To get the most accurate assistance, please ensure your AI integration is configured with an API key in your settings.`;
  }

  /**
   * Generate fallback answer when external AI is unavailable
   */
  private async generateFallbackAnswer(
    question: string,
    learnedAnswers: any[],
    documentContext: any[]
  ): Promise<AiResponse> {
    let answer = "I don't have enough information to answer this question confidently. ";
    const sources: AiResponse['sources'] = [];

    if (learnedAnswers.length > 0) {
      answer += `\n\nHere's some potentially relevant information I've learned:\n${learnedAnswers[0].answer}`;
      sources.push({
        type: 'learned',
        relevance: learnedAnswers[0].relevanceScore || 0.5
      });
    }

    if (documentContext.length > 0) {
      answer += `\n\nYou may find relevant information in: ${documentContext.map(d => d.filename).join(', ')}`;
      documentContext.forEach(doc => {
        sources.push({
          type: 'document',
          reference: doc.filename,
          relevance: doc.relevanceScore || 0.3
        });
      });
    }

    return {
      answer,
      confidence: 0.3,
      usedExternalAi: false,
      sources,
      learningOpportunity: true,
      suggestions: [
        "Consider uploading relevant documents to help me learn",
        "Would you like to manually add this information to my knowledge base?"
      ]
    };
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(
    query: AiQuery,
    response: AiResponse,
    config: AiAssistantConfig
  ): Promise<void> {
    try {
      let conversationId = query.conversationId;

      // Create new conversation if needed
      if (!conversationId) {
        const title = query.question.substring(0, 100);
        const conversation = await this.storage.createAiConversation({
          companyId: config.companyId,
          userId: query.userId,
          title,
          status: 'active' as const,
          context: query.context
        });
        conversationId = conversation.id;
      }

      // Save user message
      await this.storage.createAiMessage({
        conversationId,
        role: 'user' as const,
        content: query.question,
        usedExternalAi: false,
        metadata: query.context
      });

      // Save assistant response
      await this.storage.createAiMessage({
        conversationId,
        role: 'assistant' as const,
        content: response.answer,
        usedExternalAi: response.usedExternalAi,
        confidence: response.confidence.toString(),
        metadata: {
          sources: response.sources,
          suggestions: response.suggestions
        }
      });
    } catch (error) {
      this.logger.error("Error saving conversation", error as Error);
    }
  }

  /**
   * Create learning opportunity from external AI answer
   */
  private async createLearningOpportunity(
    query: AiQuery,
    response: AiResponse,
    companyId: string
  ): Promise<void> {
    try {
      if (response.usedExternalAi && response.confidence > 0.7) {
        // Create learning data entry
        await this.storage.createAiLearningData({
          companyId,
          sourceType: 'conversation',
          question: query.question,
          answer: response.answer,
          context: query.context,
          confidence: response.confidence.toString(),
          useCount: 0,
          successRate: "1.00"
        });

        this.logger.info("Created learning opportunity", { companyId });
      }
    } catch (error) {
      this.logger.error("Error creating learning opportunity", error as Error);
    }
  }

  /**
   * Process uploaded document and extract knowledge
   */
  async processDocument(
    companyId: string,
    userId: string,
    file: {
      filename: string;
      fileType: string;
      fileSize: number;
      content: string;
    }
  ): Promise<AiKnowledgeBase> {
    try {
      this.logger.info("Processing document", { 
        companyId, 
        filename: file.filename 
      });

      // Extract text content (in production, use proper parsers for PDF, DOCX, etc.)
      const content = file.content;

      // Generate summary (in production, use AI)
      const summary = this.generateSummary(content);

      // Extract tags/keywords
      const tags = this.extractKeywords(content);

      // Create knowledge base entry
      const knowledge = await this.storage.createAiKnowledgeBase({
        companyId,
        uploadedBy: userId,
        filename: file.filename,
        fileType: file.fileType,
        fileSize: file.fileSize,
        content,
        summary,
        tags,
        processingStatus: 'completed',
        isActive: true
      });

      // Extract learnable Q&A pairs from document
      await this.extractLearningFromDocument(companyId, knowledge.id, content);

      // Update company AI learning progress
      await this.updateLearningProgress(companyId);

      return knowledge;
    } catch (error) {
      this.logger.error("Error processing document", error as Error);
      throw error;
    }
  }

  /**
   * Extract learning data from document
   */
  private async extractLearningFromDocument(
    companyId: string,
    knowledgeId: string,
    content: string
  ): Promise<void> {
    // In production, use NLP to extract Q&A pairs, procedures, policies, etc.
    // For now, create some basic learning entries
    
    // Example: Extract headings and first paragraph as Q&A
    const lines = content.split('\n');
    let currentQuestion = '';
    let currentAnswer = '';

    for (const line of lines) {
      if (line.trim().endsWith('?')) {
        if (currentQuestion && currentAnswer) {
          await this.storage.createAiLearningData({
            companyId,
            sourceType: 'document',
            sourceId: knowledgeId,
            question: currentQuestion,
            answer: currentAnswer.trim(),
            confidence: "0.70",
            useCount: 0
          });
        }
        currentQuestion = line.trim();
        currentAnswer = '';
      } else if (currentQuestion && line.trim()) {
        currentAnswer += line.trim() + ' ';
      }
    }
  }

  /**
   * Update company's AI learning progress
   */
  private async updateLearningProgress(companyId: string): Promise<void> {
    try {
      const learningData = await this.storage.getAiLearningDataByCompany(companyId);
      const knowledgeBase = await this.storage.getAiKnowledgeBaseByCompany(companyId);

      // Calculate progress based on:
      // - Number of learned Q&A pairs (40%)
      // - Number of documents (30%)
      // - Success rate of answers (30%)
      
      const learningScore = Math.min(40, (learningData.length / 100) * 40);
      const documentScore = Math.min(30, (knowledgeBase.length / 20) * 30);
      
      const avgSuccessRate = learningData.length > 0
        ? learningData.reduce((sum, l) => sum + parseFloat(l.successRate || '0'), 0) / learningData.length
        : 0;
      const successScore = avgSuccessRate * 30;

      const totalProgress = Math.floor(learningScore + documentScore + successScore);

      await this.storage.updateCompanyAiProgress(companyId, totalProgress);
      
      this.logger.info("Updated AI learning progress", { 
        companyId, 
        progress: totalProgress 
      });
    } catch (error) {
      this.logger.error("Error updating learning progress", error as Error);
    }
  }

  // ========== UTILITY METHODS ==========

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (in production, use proper NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Remove duplicates and common words
    const commonWords = ['that', 'this', 'with', 'from', 'have', 'been', 'what', 'when', 'where'];
    const unique = Array.from(new Set(words));
    return unique
      .filter(word => !commonWords.includes(word))
      .slice(0, 20);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity (in production, use cosine similarity with embeddings)
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const words1Array = Array.from(words1);
    const intersection = new Set(words1Array.filter(x => words2.has(x)));
    const union = new Set([...words1Array, ...Array.from(words2)]);
    
    return intersection.size / union.size;
  }

  private calculateRelevanceScore(question: string, learning: any): number {
    const questionSim = this.calculateTextSimilarity(
      question.toLowerCase(),
      (learning.question || '').toLowerCase()
    );
    
    const confidenceBoost = parseFloat(learning.confidence || '0.5') * 0.3;
    const useCountBoost = Math.min(0.2, (learning.useCount || 0) / 50);
    
    return questionSim + confidenceBoost + useCountBoost;
  }

  private generateSummary(content: string): string {
    // Simple summary (in production, use AI summarization)
    const lines = content.split('\n').filter(line => line.trim());
    return lines.slice(0, 5).join(' ').substring(0, 500) + '...';
  }

  private extractRelevantExcerpt(content: string, question: string): string {
    // Extract most relevant paragraph (in production, use semantic search)
    const paragraphs = content.split('\n\n');
    const keywords = this.extractKeywords(question);
    
    let bestMatch = '';
    let bestScore = 0;
    
    for (const para of paragraphs) {
      const score = keywords.filter(kw => para.toLowerCase().includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = para;
      }
    }
    
    return bestMatch.substring(0, 300) + '...';
  }

  /**
   * Train neural network for a company
   */
  async trainNeuralNetwork(
    companyId: string,
    options?: { epochs?: number; batchSize?: number }
  ): Promise<{ success: boolean; progress: number; error?: string }> {
    try {
      this.logger.info("Starting neural network training", { companyId });
      
      const nn = await this.getNeuralNetwork(companyId);
      const trainingProgress = nn.getTrainingProgress();
      
      if (trainingProgress.isTraining) {
        return {
          success: false,
          progress: trainingProgress.progress,
          error: "Training already in progress"
        };
      }

      // Train in background
      nn.train({
        epochs: options?.epochs || 20,
        batchSize: options?.batchSize || 32,
        onProgress: async (progress, epoch, logs) => {
          this.logger.info("Training progress", { companyId, epoch, progress, logs });
          // Update company AI progress
          await this.storage.updateCompanyAiProgress(companyId, Math.floor(progress));
        }
      }).catch(error => {
        this.logger.error("Neural network training error", error);
      });

      return {
        success: true,
        progress: 0
      };
    } catch (error) {
      this.logger.error("Error starting neural network training", error as Error);
      return {
        success: false,
        progress: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get neural network training status
   */
  async getNeuralNetworkStatus(companyId: string): Promise<{
    isTraining: boolean;
    progress: number;
  }> {
    try {
      const nn = await this.getNeuralNetwork(companyId);
      return nn.getTrainingProgress();
    } catch (error) {
      this.logger.error("Error getting neural network status", error as Error);
      return { isTraining: false, progress: 0 };
    }
  }

  /**
   * Cleanup - dispose of all neural networks
   */
  dispose(): void {
    this.neuralNetworks.forEach((nn, companyId) => {
      this.logger.info("Disposing neural network", { companyId });
      nn.dispose();
    });
    this.neuralNetworks.clear();
  }

  /**
   * Get external AI availability status
   */
  getExternalAIAvailability() {
    return {
      openaiAvailable: this.externalAI.getAvailableProviders().includes('openai'),
      anthropicAvailable: this.externalAI.getAvailableProviders().includes('anthropic'),
    };
  }
}
