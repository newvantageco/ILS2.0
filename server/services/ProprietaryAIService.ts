/**
 * Proprietary AI Service - Optometry & Spectacle Dispensing Expert
 * 
 * This service provides a tenant-specific AI assistant that:
 * 1. Learns from external AI (OpenAI/Claude) but stores knowledge locally
 * 2. Isolates data per tenant company
 * 3. ONLY answers questions related to:
 *    - Optometry
 *    - Spectacle dispensing
 *    - Lens manufacturing
 *    - Eye care products
 *    - Prescription interpretation
 *    - Frame fitting
 * 4. Rejects off-topic questions
 * 5. Progressively becomes independent from external AI
 */

import { IStorage } from "../storage";
import { createLogger, type Logger } from "../utils/logger";
import { ExternalAIService, type AIMessage } from "./ExternalAIService";
import { AIAssistantService } from "./AIAssistantService";

export interface ProprietaryAIQuery {
  question: string;
  companyId: string;
  userId: string;
  conversationId?: string;
  context?: Record<string, any>;
}

export interface ProprietaryAIResponse {
  answer: string;
  isTopicRelevant: boolean;
  topicRejectionReason?: string;
  confidence: number;
  usedExternalAI: boolean;
  learningPhase: 'beginner' | 'learning' | 'advanced' | 'expert';
  sources: Array<{
    type: 'tenant_knowledge' | 'learned_pattern' | 'external_ai' | 'system_knowledge';
    reference?: string;
    relevance: number;
  }>;
  companySpecific: boolean;
  suggestedFollowUp?: string[];
}

export interface TopicClassification {
  isRelevant: boolean;
  category?: 'optometry' | 'spectacle_dispensing' | 'lens_manufacturing' | 'eye_care' | 'prescription' | 'frame_fitting' | 'general_optical';
  confidence: number;
  reason?: string;
}

export class ProprietaryAIService {
  private logger: Logger;
  private externalAI: ExternalAIService;
  private baseAIAssistant: AIAssistantService;

  // Optometry and spectacle dispensing keywords
  private readonly RELEVANT_KEYWORDS = [
    // Optometry
    'optometry', 'optometrist', 'eye exam', 'vision test', 'prescription', 'refraction',
    'visual acuity', 'pupil', 'retina', 'cornea', 'optic nerve', 'glaucoma', 'cataract',
    'myopia', 'hyperopia', 'astigmatism', 'presbyopia', 'binocular vision', 'accommodation',
    
    // Spectacle Dispensing
    'spectacle', 'eyeglasses', 'glasses', 'frames', 'lenses', 'lens', 'dispensing',
    'fitting', 'adjustment', 'measurements', 'pd', 'pupillary distance', 'seg height',
    'optical center', 'vertex distance', 'pantoscopic tilt', 'wrap angle',
    
    // Lens Types
    'single vision', 'bifocal', 'trifocal', 'progressive', 'varifocal', 'multifocal',
    'reading glasses', 'distance glasses', 'computer glasses', 'occupational lenses',
    
    // Lens Materials
    'cr-39', 'polycarbonate', 'trivex', 'high index', 'glass lenses', 'plastic lenses',
    'photochromic', 'transitions', 'polarized', 'anti-reflective', 'coating',
    
    // Prescription Terms
    'sphere', 'cylinder', 'axis', 'add power', 'prism', 'base direction', 'od', 'os',
    'sph', 'cyl', 'diopter', 'dioptre', 'plus lens', 'minus lens',
    
    // Manufacturing
    'edging', 'surfacing', 'lens lab', 'optical lab', 'lens blank', 'blocking',
    'generate', 'polish', 'bevel', 'pattern', 'tracer', 'oma file',
    
    // Products & Brands
    'frame', 'eyewear', 'sunglass', 'safety glasses', 'sports eyewear',
    'contact lens', 'lens cleaner', 'case', 'cloth',
    
    // Business Operations
    'optical store', 'optician', 'ecp', 'eye care professional', 'order',
    'inventory', 'pos', 'point of sale', 'patient', 'customer'
  ];

  private readonly OFF_TOPIC_INDICATORS = [
    'weather', 'sports score', 'recipe', 'cooking', 'movie', 'music',
    'politics', 'election', 'stock market', 'crypto', 'bitcoin',
    'car', 'automobile', 'travel', 'hotel', 'flight', 'vacation',
    'programming', 'code', 'javascript', 'python', 'database',
    'fashion', 'clothing', 'shoes', 'jewelry',
    'restaurant', 'food', 'drink', 'alcohol', 'beer', 'wine'
  ];

  constructor(private storage: IStorage) {
    this.logger = createLogger("ProprietaryAIService");
    this.externalAI = new ExternalAIService();
    this.baseAIAssistant = new AIAssistantService(storage);
    this.logger.info("Proprietary AI Service initialized");
  }

  /**
   * Main entry point - Ask the proprietary AI a question
   */
  async ask(query: ProprietaryAIQuery): Promise<ProprietaryAIResponse> {
    this.logger.info("Processing proprietary AI query", {
      companyId: query.companyId,
      userId: query.userId,
      questionLength: query.question.length
    });

    // Step 1: Topic classification - Is this about optometry/spectacles?
    const topicCheck = await this.classifyTopic(query.question, query.companyId);
    
    if (!topicCheck.isRelevant) {
      return this.createOffTopicResponse(topicCheck);
    }

    // Step 2: Get learning progress for this company
    const learningProgress = await this.getLearningProgress(query.companyId);

    // Step 3: Try company-specific knowledge first
    const companyKnowledge = await this.searchCompanyKnowledge(
      query.question,
      query.companyId
    );

    // Step 4: Try learned patterns from external AI
    const learnedPatterns = await this.searchLearnedPatterns(
      query.question,
      query.companyId,
      topicCheck.category
    );

    // Step 5: Decide whether to use external AI or local knowledge
    const shouldUseExternalAI = this.shouldUseExternalAI(
      learningProgress,
      companyKnowledge,
      learnedPatterns
    );

    let answer: string;
    let sources: any[] = [];
    let usedExternalAI = false;

    if (shouldUseExternalAI && this.externalAI.isAvailable()) {
      // Query external AI with domain-specific context
      const externalResponse = await this.queryExternalAIWithContext(
        query,
        topicCheck.category!,
        companyKnowledge,
        learnedPatterns
      );
      
      answer = externalResponse.content;
      usedExternalAI = true;
      sources.push({
        type: 'external_ai',
        relevance: 1.0
      });

      // Learn from this interaction
      await this.learnFromInteraction(
        query.companyId,
        query.question,
        answer,
        topicCheck.category!
      );
    } else {
      // Use local knowledge
      const localResponse = this.generateLocalResponse(
        query.question,
        companyKnowledge,
        learnedPatterns
      );
      
      answer = localResponse.answer;
      sources = localResponse.sources;
    }

    // Step 6: Save conversation
    if (query.conversationId) {
      await this.saveMessage(query.conversationId, query.userId, query.question, answer);
    }

    return {
      answer,
      isTopicRelevant: true,
      confidence: this.calculateConfidence(sources, usedExternalAI, learningProgress),
      usedExternalAI,
      learningPhase: this.getLearningPhase(learningProgress),
      sources,
      companySpecific: companyKnowledge.length > 0,
      suggestedFollowUp: this.generateFollowUpQuestions(query.question, topicCheck.category!)
    };
  }

  /**
   * Classify if the question is about optometry/spectacle dispensing
   */
  private async classifyTopic(question: string, companyId: string): Promise<TopicClassification> {
    const questionLower = question.toLowerCase();

    // Check for off-topic indicators first
    const offTopicMatches = this.OFF_TOPIC_INDICATORS.filter(keyword =>
      questionLower.includes(keyword)
    );

    if (offTopicMatches.length > 0) {
      return {
        isRelevant: false,
        confidence: 0.9,
        reason: `This question appears to be about ${offTopicMatches.join(', ')} which is outside our optometry and spectacle dispensing expertise.`
      };
    }

    // Check for relevant keywords
    const relevantMatches = this.RELEVANT_KEYWORDS.filter(keyword =>
      questionLower.includes(keyword)
    );

    if (relevantMatches.length >= 1) {
      // Determine category based on keywords
      const category = this.determineCategory(relevantMatches);
      
      return {
        isRelevant: true,
        category,
        confidence: Math.min(0.6 + (relevantMatches.length * 0.1), 1.0)
      };
    }

    // Use external AI for ambiguous cases if available
    if (this.externalAI.isAvailable()) {
      const classification = await this.classifyWithExternalAI(question);
      return classification;
    }

    // Default to rejecting if unsure
    return {
      isRelevant: false,
      confidence: 0.5,
      reason: "I'm not confident this question is about optometry or spectacle dispensing. Please ask questions related to eye care, prescriptions, lenses, frames, or optical dispensing."
    };
  }

  /**
   * Use external AI to classify ambiguous topics
   */
  private async classifyWithExternalAI(question: string): Promise<TopicClassification> {
    const systemPrompt = `You are a topic classifier for an optometry and spectacle dispensing AI system.
    
Your job is to determine if a question is relevant to:
- Optometry (eye exams, prescriptions, vision testing)
- Spectacle dispensing (fitting glasses, frame selection, lens options)
- Lens manufacturing and products
- Eye care products and services
- Optical business operations

Respond with JSON only:
{
  "isRelevant": boolean,
  "category": "optometry" | "spectacle_dispensing" | "lens_manufacturing" | "eye_care" | "prescription" | "frame_fitting" | "general_optical" | null,
  "confidence": number (0-1),
  "reason": string
}`;

    try {
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Classify this question: "${question}"` }
      ];

      const response = await this.externalAI.generateResponse(messages, {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        maxTokens: 150
      });

      const classification = JSON.parse(response.content);
      return classification as TopicClassification;
    } catch (error) {
      this.logger.error("Error classifying with external AI", error as Error);
      return {
        isRelevant: false,
        confidence: 0.5,
        reason: "Unable to classify topic. Please ensure your question is about optometry or spectacle dispensing."
      };
    }
  }

  /**
   * Determine category from matched keywords
   */
  private determineCategory(matches: string[]): 'optometry' | 'spectacle_dispensing' | 'lens_manufacturing' | 'eye_care' | 'prescription' | 'frame_fitting' | 'general_optical' {
    const categoryKeywords = {
      optometry: ['optometry', 'eye exam', 'refraction', 'glaucoma', 'cataract', 'myopia', 'hyperopia'],
      spectacle_dispensing: ['dispensing', 'fitting', 'adjustment', 'pd', 'seg height'],
      lens_manufacturing: ['edging', 'surfacing', 'lens lab', 'blocking', 'polish', 'bevel'],
      prescription: ['prescription', 'sphere', 'cylinder', 'axis', 'add power', 'prism'],
      frame_fitting: ['frame', 'fitting', 'pantoscopic', 'wrap angle', 'vertex'],
      eye_care: ['eye care', 'patient', 'customer', 'optical store']
    };

    let maxCount = 0;
    let selectedCategory: any = 'general_optical';

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const count = matches.filter(match => keywords.some(k => match.includes(k))).length;
      if (count > maxCount) {
        maxCount = count;
        selectedCategory = category;
      }
    }

    return selectedCategory;
  }

  /**
   * Create response for off-topic questions
   */
  private createOffTopicResponse(topicCheck: TopicClassification): ProprietaryAIResponse {
    return {
      answer: topicCheck.reason || "I'm specialized in optometry and spectacle dispensing. I can help with questions about eye exams, prescriptions, lenses, frames, fitting, and optical products. Please ask me something related to these topics.",
      isTopicRelevant: false,
      topicRejectionReason: topicCheck.reason,
      confidence: topicCheck.confidence,
      usedExternalAI: false,
      learningPhase: 'expert',
      sources: [{
        type: 'system_knowledge',
        relevance: 1.0
      }],
      companySpecific: false,
      suggestedFollowUp: [
        "What lens material is best for high prescriptions?",
        "How do I measure pupillary distance?",
        "What's the difference between progressive and bifocal lenses?"
      ]
    };
  }

  /**
   * Get company's learning progress
   */
  private async getLearningProgress(companyId: string): Promise<number> {
    try {
      const stats = await this.baseAIAssistant.getLearningProgress(companyId);
      return stats.progress;
    } catch (error) {
      this.logger.error("Error getting learning progress", error as Error);
      return 0;
    }
  }

  /**
   * Search company-specific knowledge base
   */
  private async searchCompanyKnowledge(
    question: string,
    companyId: string
  ): Promise<any[]> {
    try {
      // Search in company's uploaded documents and knowledge base
      const allKnowledge = await this.storage.getAiKnowledgeBaseByCompany(companyId);
      
      // Simple keyword matching for now
      const questionLower = question.toLowerCase();
      const scored = allKnowledge
        .map(kb => {
          const contentLower = (kb.content || kb.summary || '').toLowerCase();
          const titleLower = (kb.filename || '').toLowerCase();
          
          // Calculate relevance based on keyword matches
          const contentMatches = questionLower.split(' ')
            .filter(word => word.length > 3 && contentLower.includes(word)).length;
          const titleMatches = questionLower.split(' ')
            .filter(word => word.length > 3 && titleLower.includes(word)).length;
          
          const relevance = (contentMatches * 0.7 + titleMatches * 1.5) / 10;
          
          return {
            ...kb,
            relevance: Math.min(relevance, 1.0)
          };
        })
        .filter(kb => kb.relevance > 0.2)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5);
      
      return scored;
    } catch (error) {
      this.logger.error("Error searching company knowledge", error as Error);
      return [];
    }
  }

  /**
   * Search learned patterns from previous interactions
   */
  private async searchLearnedPatterns(
    question: string,
    companyId: string,
    category?: string
  ): Promise<any[]> {
    try {
      const allLearning = await this.storage.getAiLearningDataByCompany(companyId);
      
      // Filter by category if specified
      let filtered = category
        ? allLearning.filter(l => l.category === category)
        : allLearning;
      
      // Simple keyword matching
      const questionLower = question.toLowerCase();
      const scored = filtered
        .map(learning => {
          const questionMatch = (learning.question || '').toLowerCase();
          const answerMatch = (learning.answer || '').toLowerCase();
          
          // Calculate similarity
          const questionWords = questionLower.split(' ').filter(w => w.length > 3);
          const matches = questionWords.filter(word =>
            questionMatch.includes(word) || answerMatch.includes(word)
          ).length;
          
          const confidence = Math.min((matches / questionWords.length) * 0.9, 0.95);
          
          return {
            ...learning,
            matchConfidence: confidence
          };
        })
        .filter(l => l.matchConfidence > 0.3)
        .sort((a, b) => b.matchConfidence - a.matchConfidence)
        .slice(0, 5);
      
      return scored;
    } catch (error) {
      this.logger.error("Error searching learned patterns", error as Error);
      return [];
    }
  }

  /**
   * Decide whether to use external AI
   */
  private shouldUseExternalAI(
    learningProgress: number,
    companyKnowledge: any[],
    learnedPatterns: any[]
  ): boolean {
    // If we have high-confidence local knowledge, use it
    if (companyKnowledge.length > 0 && companyKnowledge[0].relevance > 0.8) {
      return false;
    }

    if (learnedPatterns.length > 0 && learnedPatterns[0].confidence > 0.8) {
      return false;
    }

    // Use learning progress to decide
    if (learningProgress >= 75) {
      // Expert level - only use external AI for novel questions
      return companyKnowledge.length === 0 && learnedPatterns.length === 0;
    } else if (learningProgress >= 50) {
      // Advanced level - prefer local but fallback to external
      return companyKnowledge.length === 0 && learnedPatterns.length < 2;
    } else if (learningProgress >= 25) {
      // Learning level - mix of both
      return learnedPatterns.length < 3;
    } else {
      // Beginner level - prefer external AI
      return true;
    }
  }

  /**
   * Query external AI with optometry-specific context
   */
  private async queryExternalAIWithContext(
    query: ProprietaryAIQuery,
    category: string,
    companyKnowledge: any[],
    learnedPatterns: any[]
  ): Promise<any> {
    const systemPrompt = this.buildOptometrySystemPrompt(category, companyKnowledge);
    
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query.question }
    ];

    // Add company context if available
    if (companyKnowledge.length > 0) {
      const contextSummary = companyKnowledge
        .slice(0, 3)
        .map(k => k.content)
        .join('\n\n');
      
      messages.splice(1, 0, {
        role: 'system',
        content: `Company-specific context:\n${contextSummary}`
      });
    }

    return await this.externalAI.generateResponse(messages, {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 1000
    });
  }

  /**
   * Build optometry-specific system prompt
   */
  private buildOptometrySystemPrompt(category: string, companyKnowledge: any[]): string {
    const basePrompt = `You are an expert AI assistant specialized in optometry and spectacle dispensing.

Your expertise includes:
- Optometry: Eye examinations, prescriptions, vision correction, ocular health
- Spectacle Dispensing: Frame selection, fitting, adjustments, measurements (PD, seg height, etc.)
- Lens Technology: Single vision, progressive, bifocal, trifocal lenses
- Lens Materials: CR-39, polycarbonate, high-index, Trivex, glass
- Coatings: Anti-reflective, UV protection, blue light, photochromic, polarized
- Manufacturing: Edging, surfacing, lens lab operations
- Prescription Reading: Sphere, cylinder, axis, add power, prism, base direction
- Business Operations: Optical retail, patient care, inventory management

Current topic: ${category}

IMPORTANT RULES:
1. Only answer questions related to optometry and spectacle dispensing
2. If a question is off-topic, politely redirect to optical topics
3. Provide accurate, professional information
4. Use proper optical terminology
5. Consider patient safety and regulatory compliance
6. Reference clinical best practices when applicable

${companyKnowledge.length > 0 ? 'Use the company-specific context provided when relevant.' : ''}

Provide clear, accurate, and helpful answers.`;

    return basePrompt;
  }

  /**
   * Generate response from local knowledge
   */
  private generateLocalResponse(
    question: string,
    companyKnowledge: any[],
    learnedPatterns: any[]
  ): { answer: string; sources: any[] } {
    const sources: any[] = [];
    let answer = "";

    if (companyKnowledge.length > 0) {
      const topKnowledge = companyKnowledge[0];
      answer = topKnowledge.content || topKnowledge.summary;
      sources.push({
        type: 'tenant_knowledge',
        reference: topKnowledge.documentName,
        relevance: topKnowledge.relevance
      });
    } else if (learnedPatterns.length > 0) {
      const topPattern = learnedPatterns[0];
      answer = topPattern.answer;
      sources.push({
        type: 'learned_pattern',
        relevance: topPattern.confidence
      });
    } else {
      answer = "I don't have enough information to answer that question confidently. Could you provide more details or rephrase your question?";
      sources.push({
        type: 'system_knowledge',
        relevance: 0.3
      });
    }

    return { answer, sources };
  }

  /**
   * Learn from external AI interaction
   */
  private async learnFromInteraction(
    companyId: string,
    question: string,
    answer: string,
    category: string
  ): Promise<void> {
    try {
      await this.storage.createAiLearningData({
        companyId,
        question,
        answer,
        category,
        confidence: '0.8',
        sourceType: 'external_ai',
        createdAt: new Date()
      });

      this.logger.info("Learned from interaction", { companyId, category });
    } catch (error) {
      this.logger.error("Error saving learning data", error as Error);
    }
  }

  /**
   * Save message to conversation
   */
  private async saveMessage(
    conversationId: string,
    userId: string,
    question: string,
    answer: string
  ): Promise<void> {
    try {
      await this.storage.createAiMessage({
        conversationId,
        role: 'user',
        content: question,
        createdAt: new Date()
      });

      await this.storage.createAiMessage({
        conversationId,
        role: 'assistant',
        content: answer,
        createdAt: new Date()
      });
    } catch (error) {
      this.logger.error("Error saving messages", error as Error);
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    sources: any[],
    usedExternalAI: boolean,
    learningProgress: number
  ): number {
    if (usedExternalAI) {
      return 0.85; // External AI is generally reliable
    }

    if (sources.length === 0) {
      return 0.3;
    }

    const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length;
    const progressBonus = learningProgress / 200; // 0-0.5 bonus

    return Math.min(avgRelevance + progressBonus, 1.0);
  }

  /**
   * Get learning phase description
   */
  private getLearningPhase(progress: number): 'beginner' | 'learning' | 'advanced' | 'expert' {
    if (progress >= 75) return 'expert';
    if (progress >= 50) return 'advanced';
    if (progress >= 25) return 'learning';
    return 'beginner';
  }

  /**
   * Generate follow-up question suggestions
   */
  private generateFollowUpQuestions(
    originalQuestion: string,
    category: string
  ): string[] {
    const followUps: Record<string, string[]> = {
      optometry: [
        "What are the different types of vision tests?",
        "How often should someone get an eye exam?",
        "What's the difference between an optometrist and ophthalmologist?"
      ],
      spectacle_dispensing: [
        "How do I measure pupillary distance accurately?",
        "What's the proper way to adjust frame temples?",
        "How do I determine the correct seg height for bifocals?"
      ],
      lens_manufacturing: [
        "What's the edging process for high-index lenses?",
        "How does the surfacing process work?",
        "What quality checks are performed in the lab?"
      ],
      prescription: [
        "How do I read a glasses prescription?",
        "What does add power mean in a prescription?",
        "When is prism correction necessary?"
      ],
      frame_fitting: [
        "How do I measure frame size for a patient?",
        "What's the ideal pantoscopic tilt?",
        "How do I adjust nose pads properly?"
      ],
      eye_care: [
        "What lens coatings do you recommend?",
        "How do I care for my glasses?",
        "What's the warranty on frames and lenses?"
      ]
    };

    return followUps[category] || followUps.eye_care;
  }
}
