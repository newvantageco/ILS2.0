/**
 * External AI Service
 * 
 * Integrates with external AI providers:
 * - OpenAI (GPT-4, GPT-3.5-turbo)
 * - Anthropic (Claude 3 Opus, Sonnet, Haiku)
 * 
 * Features:
 * - Automatic provider selection based on configuration
 * - Fallback between providers if one fails
 * - Context management for company-specific knowledge
 * - Token usage tracking and cost estimation
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createLogger, type Logger } from "../utils/logger";

export type AIProvider = 'openai' | 'anthropic';
export type OpenAIModel = 'gpt-4' | 'gpt-4-turbo-preview' | 'gpt-3.5-turbo';
export type AnthropicModel = 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';

export interface ExternalAIConfig {
  provider: AIProvider;
  model: string;
  maxTokens?: number;
  temperature?: number;
  companyContext?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCost: number;
  finishReason: string;
}

export class ExternalAIService {
  private logger: Logger;
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private openaiAvailable: boolean = false;
  private anthropicAvailable: boolean = false;

  constructor() {
    this.logger = createLogger("ExternalAIService");
    this.initializeClients();
  }

  /**
   * Initialize AI provider clients based on available API keys
   */
  private initializeClients(): void {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.openaiAvailable = true;
        this.logger.info("OpenAI client initialized");
      } catch (error) {
        this.logger.error("Failed to initialize OpenAI client", error as Error);
      }
    } else {
      this.logger.warn("OPENAI_API_KEY not found in environment");
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        this.anthropicClient = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.anthropicAvailable = true;
        this.logger.info("Anthropic client initialized");
      } catch (error) {
        this.logger.error("Failed to initialize Anthropic client", error as Error);
      }
    } else {
      this.logger.warn("ANTHROPIC_API_KEY not found in environment");
    }

    if (!this.openaiAvailable && !this.anthropicAvailable) {
      this.logger.error("No AI providers available. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY");
    }
  }

  /**
   * Check if any AI provider is available
   */
  isAvailable(): boolean {
    return this.openaiAvailable || this.anthropicAvailable;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    if (this.openaiAvailable) providers.push('openai');
    if (this.anthropicAvailable) providers.push('anthropic');
    return providers;
  }

  /**
   * Generate AI response with automatic provider selection
   */
  async generateResponse(
    messages: AIMessage[],
    config: ExternalAIConfig
  ): Promise<AIResponse> {
    const { provider, model } = config;

    // Try primary provider
    try {
      if (provider === 'openai' && this.openaiAvailable) {
        return await this.generateOpenAIResponse(messages, config);
      } else if (provider === 'anthropic' && this.anthropicAvailable) {
        return await this.generateAnthropicResponse(messages, config);
      }
    } catch (error) {
      this.logger.error(`Primary provider ${provider} failed, attempting fallback`, error as Error);
    }

    // Try fallback provider
    try {
      if (provider === 'openai' && this.anthropicAvailable) {
        this.logger.info("Falling back to Anthropic");
        return await this.generateAnthropicResponse(messages, {
          ...config,
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229'
        });
      } else if (provider === 'anthropic' && this.openaiAvailable) {
        this.logger.info("Falling back to OpenAI");
        return await this.generateOpenAIResponse(messages, {
          ...config,
          provider: 'openai',
          model: 'gpt-4-turbo-preview'
        });
      }
    } catch (fallbackError) {
      this.logger.error("Fallback provider also failed", fallbackError as Error);
    }

    throw new Error("No AI providers available or all providers failed");
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(
    messages: AIMessage[],
    config: ExternalAIConfig
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    this.logger.info("Generating OpenAI response", {
      model: config.model,
      messageCount: messages.length
    });

    const completion = await this.openaiClient.chat.completions.create({
      model: config.model as OpenAIModel,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature ?? 0.7,
    });

    const usage = completion.usage!;
    const content = completion.choices[0].message.content || "";

    // Estimate cost (approximate pricing as of 2024)
    const costPerToken = this.getOpenAICostPerToken(config.model);
    const estimatedCost = 
      (usage.prompt_tokens * costPerToken.prompt) +
      (usage.completion_tokens * costPerToken.completion);

    return {
      content,
      model: config.model,
      provider: 'openai',
      tokensUsed: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens,
      },
      estimatedCost,
      finishReason: completion.choices[0].finish_reason,
    };
  }

  /**
   * Generate response using Anthropic Claude
   */
  private async generateAnthropicResponse(
    messages: AIMessage[],
    config: ExternalAIConfig
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new Error("Anthropic client not initialized");
    }

    this.logger.info("Generating Anthropic response", {
      model: config.model,
      messageCount: messages.length
    });

    // Separate system message from conversation messages
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    const message = await this.anthropicClient.messages.create({
      model: config.model as AnthropicModel,
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature ?? 0.7,
      system: systemMessage,
      messages: conversationMessages,
    });

    const content = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Estimate cost (approximate pricing as of 2024)
    const costPerToken = this.getAnthropicCostPerToken(config.model);
    const estimatedCost = 
      (message.usage.input_tokens * costPerToken.input) +
      (message.usage.output_tokens * costPerToken.output);

    return {
      content,
      model: config.model,
      provider: 'anthropic',
      tokensUsed: {
        prompt: message.usage.input_tokens,
        completion: message.usage.output_tokens,
        total: message.usage.input_tokens + message.usage.output_tokens,
      },
      estimatedCost,
      finishReason: message.stop_reason || 'end_turn',
    };
  }

  /**
   * Get OpenAI pricing per token (in dollars)
   */
  private getOpenAICostPerToken(model: string): { prompt: number; completion: number } {
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4': { prompt: 0.00003, completion: 0.00006 },
      'gpt-4-turbo-preview': { prompt: 0.00001, completion: 0.00003 },
      'gpt-3.5-turbo': { prompt: 0.0000005, completion: 0.0000015 },
    };
    return pricing[model] || pricing['gpt-3.5-turbo'];
  }

  /**
   * Get Anthropic pricing per token (in dollars)
   */
  private getAnthropicCostPerToken(model: string): { input: number; output: number } {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 0.000015, output: 0.000075 },
      'claude-3-sonnet-20240229': { input: 0.000003, output: 0.000015 },
      'claude-3-haiku-20240307': { input: 0.00000025, output: 0.00000125 },
    };
    return pricing[model] || pricing['claude-3-sonnet-20240229'];
  }

  /**
   * Build system prompt with company context
   */
  buildSystemPrompt(companyContext?: string): string {
    const basePrompt = `You are a helpful AI assistant for an optical lens manufacturing and dispensing business (Integrated Lens System). 
You provide expert advice on:
- Lens prescriptions and optical measurements
- Frame selection and fitting
- Lens materials and coatings
- Laboratory processes and quality control
- Inventory management
- Customer service and sales
- Industry regulations and best practices

Always provide accurate, professional, and helpful responses.`;

    if (companyContext) {
      return `${basePrompt}\n\nCompany-specific context:\n${companyContext}`;
    }

    return basePrompt;
  }

  /**
   * Format conversation history for AI context
   */
  formatConversationHistory(history: Array<{ question: string; answer: string }>): string {
    return history.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n');
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      openaiAvailable: this.openaiAvailable,
      anthropicAvailable: this.anthropicAvailable,
      availableProviders: this.getAvailableProviders(),
    };
  }
}
