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

export type AIProvider = 'openai' | 'anthropic' | 'ollama';
export type OpenAIModel = 'gpt-4' | 'gpt-4-turbo-preview' | 'gpt-3.5-turbo';
export type AnthropicModel = 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';
export type OllamaModel = 'llama3.1:latest' | 'llama3.1' | 'llama2' | 'mistral' | 'codellama';

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
  private ollamaClient: OpenAI | null = null;
  private openaiAvailable: boolean = false;
  private anthropicAvailable: boolean = false;
  private ollamaAvailable: boolean = false;
  private ollamaBaseUrl: string = '';
  private ollamaModel: string = 'llama3.1:latest';

  constructor() {
    this.logger = createLogger("ExternalAIService");
    this.initializeClients();
  }

  /**
   * Initialize AI provider clients based on available API keys
   */
  private initializeClients(): void {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
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
      this.logger.warn("OPENAI_API_KEY not found or invalid in environment");
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
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
      this.logger.warn("ANTHROPIC_API_KEY not found or invalid in environment");
    }

    // Initialize Ollama (Local Llama)
    if (process.env.OLLAMA_BASE_URL || process.env.USE_LOCAL_AI === 'true') {
      try {
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:latest';
        
        // Ollama uses OpenAI-compatible API
        this.ollamaClient = new OpenAI({
          baseURL: `${this.ollamaBaseUrl}/v1`,
          apiKey: 'ollama', // Ollama doesn't require a real API key
        });
        
        this.ollamaAvailable = true;
        this.logger.info(`Ollama client initialized at ${this.ollamaBaseUrl} with model ${this.ollamaModel}`);
      } catch (error) {
        this.logger.error("Failed to initialize Ollama client", error as Error);
      }
    } else {
      this.logger.info("Ollama/Local AI not configured. Set OLLAMA_BASE_URL or USE_LOCAL_AI=true to enable");
    }

    if (!this.openaiAvailable && !this.anthropicAvailable && !this.ollamaAvailable) {
      this.logger.error("No AI providers available. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or configure Ollama");
    } else {
      this.logger.info(`Available AI providers: ${this.getAvailableProviders().join(', ')}`);
    }
  }

  /**
   * Check if any AI provider is available
   */
  isAvailable(): boolean {
    return this.openaiAvailable || this.anthropicAvailable || this.ollamaAvailable;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    if (this.openaiAvailable) providers.push('openai');
    if (this.anthropicAvailable) providers.push('anthropic');
    if (this.ollamaAvailable) providers.push('ollama');
    return providers;
  }

  /**
   * Generate AI response with automatic provider selection and tool support
   */
  async generateResponse(
    messages: AIMessage[],
    config: ExternalAIConfig & { tools?: any[], onToolCall?: (toolName: string, args: any) => Promise<any> }
  ): Promise<AIResponse> {
    const { provider, model } = config;

    // Prefer Ollama if available and configured for local AI
    if (process.env.USE_LOCAL_AI === 'true' && this.ollamaAvailable && provider !== 'openai' && provider !== 'anthropic') {
      try {
        this.logger.info("Using local Ollama AI");
        return await this.generateOllamaResponse(messages, {
          ...config,
          provider: 'ollama',
          model: this.ollamaModel
        });
      } catch (error) {
        this.logger.error(`Ollama failed, falling back to cloud providers`, error as Error);
      }
    }

    // Try primary provider
    try {
      if (provider === 'openai' && this.openaiAvailable) {
        return await this.generateOpenAIResponse(messages, config);
      } else if (provider === 'anthropic' && this.anthropicAvailable) {
        return await this.generateAnthropicResponse(messages, config);
      } else if (provider === 'ollama' && this.ollamaAvailable) {
        return await this.generateOllamaResponse(messages, config);
      }
    } catch (error) {
      this.logger.error(`Primary provider ${provider} failed, attempting fallback`, error as Error);
    }

    // Try fallback providers in order of preference
    const fallbackOrder: AIProvider[] = ['ollama', 'anthropic', 'openai'];
    for (const fallbackProvider of fallbackOrder) {
      if (fallbackProvider === provider) continue; // Skip the one we just tried
      
      try {
        if (fallbackProvider === 'ollama' && this.ollamaAvailable) {
          this.logger.info("Falling back to Ollama (local)");
          return await this.generateOllamaResponse(messages, {
            ...config,
            provider: 'ollama',
            model: this.ollamaModel
          });
        } else if (fallbackProvider === 'anthropic' && this.anthropicAvailable) {
          this.logger.info("Falling back to Anthropic");
          return await this.generateAnthropicResponse(messages, {
            ...config,
            provider: 'anthropic',
            model: 'claude-3-sonnet-20240229'
          });
        } else if (fallbackProvider === 'openai' && this.openaiAvailable) {
          this.logger.info("Falling back to OpenAI");
          return await this.generateOpenAIResponse(messages, {
            ...config,
            provider: 'openai',
            model: 'gpt-4-turbo-preview'
          });
        }
      } catch (fallbackError) {
        this.logger.error(`Fallback provider ${fallbackProvider} also failed`, fallbackError as Error);
      }
    }

    throw new Error("No AI providers available or all providers failed");
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(
    messages: AIMessage[],
    config: ExternalAIConfig & { tools?: any[], onToolCall?: (toolName: string, args: any) => Promise<any> }
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    this.logger.info("Generating OpenAI response", {
      model: config.model,
      messageCount: messages.length,
      hasTools: !!config.tools
    });

    const requestConfig: any = {
      model: config.model as OpenAIModel,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature ?? 0.7,
    };

    // Add tools if provided
    if (config.tools && config.tools.length > 0) {
      requestConfig.tools = config.tools.map((tool: any) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }));
      requestConfig.tool_choice = "auto";
    }

    let completion = await this.openaiClient.chat.completions.create(requestConfig);

    // Handle tool calls
    let toolCallResults: any[] = [];
    while (completion.choices[0].finish_reason === 'tool_calls' && config.onToolCall) {
      const toolCalls = completion.choices[0].message.tool_calls || [];
      
      this.logger.info(`AI wants to use ${toolCalls.length} tools`);

      // Execute each tool call
      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') continue;
        
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        this.logger.info(`Executing tool: ${toolName}`, toolArgs);
        
        try {
          const result = await config.onToolCall(toolName, toolArgs);
          toolCallResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            name: toolName,
            content: JSON.stringify(result)
          });
        } catch (error) {
          toolCallResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            name: toolName,
            content: JSON.stringify({ error: (error as Error).message })
          });
        }
      }

      // Add assistant message with tool calls
      const assistantMessage = {
        role: "assistant" as const,
        content: completion.choices[0].message.content || "",
        tool_calls: completion.choices[0].message.tool_calls
      };

      // Continue the conversation with tool results
      const updatedMessages = [
        ...requestConfig.messages,
        assistantMessage,
        ...toolCallResults
      ];

      requestConfig.messages = updatedMessages;
      completion = await this.openaiClient.chat.completions.create(requestConfig);
    }

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
   * Generate response using Ollama (local Llama models)
   */
  private async generateOllamaResponse(
    messages: AIMessage[],
    config: ExternalAIConfig & { tools?: any[], onToolCall?: (toolName: string, args: any) => Promise<any> }
  ): Promise<AIResponse> {
    if (!this.ollamaClient) {
      throw new Error("Ollama client not initialized");
    }

    this.logger.info("Generating Ollama response", {
      model: this.ollamaModel,
      messageCount: messages.length,
      baseUrl: this.ollamaBaseUrl
    });

    try {
      const completion = await this.ollamaClient.chat.completions.create({
        model: this.ollamaModel,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        max_tokens: config.maxTokens || 2000,
        temperature: config.temperature ?? 0.7,
      });

      const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const content = completion.choices[0]?.message?.content || "";

      return {
        content,
        model: this.ollamaModel,
        provider: 'ollama',
        tokensUsed: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        estimatedCost: 0, // Local models are free!
        finishReason: completion.choices[0]?.finish_reason || 'stop',
      };
    } catch (error) {
      this.logger.error("Ollama request failed", error as Error);
      throw new Error(`Ollama API error: ${(error as Error).message}`);
    }
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
      ollamaAvailable: this.ollamaAvailable,
      ollamaBaseUrl: this.ollamaBaseUrl,
      ollamaModel: this.ollamaModel,
      availableProviders: this.getAvailableProviders(),
      preferLocalAI: process.env.USE_LOCAL_AI === 'true',
    };
  }

  /**
   * Get available tools/functions for the AI to use
   */
  getAvailableTools(): any[] {
    return [
      {
        name: "get_patient_info",
        description: "Search for patient information by name or get details about a specific patient. Use this when user asks about a patient.",
        parameters: {
          type: "object",
          properties: {
            search: {
              type: "string",
              description: "Patient name or ID to search for"
            }
          },
          required: ["search"]
        }
      },
      {
        name: "check_inventory",
        description: "Check inventory levels, search for specific items, or get stock information. Use this when user asks about products, frames, lenses, or stock levels.",
        parameters: {
          type: "object",
          properties: {
            search: {
              type: "string",
              description: "Product name, SKU, or category to search for"
            },
            checkLowStock: {
              type: "boolean",
              description: "Set to true to specifically check for low stock items"
            }
          },
          required: ["search"]
        }
      },
      {
        name: "get_sales_data",
        description: "Get sales information, revenue data, or order statistics for a time period. Use this when user asks about sales, revenue, or business performance.",
        parameters: {
          type: "object",
          properties: {
            timeframe: {
              type: "string",
              enum: ["today", "week", "month", "quarter", "year", "custom"],
              description: "Time period for sales data"
            },
            startDate: {
              type: "string",
              description: "Start date for custom timeframe (YYYY-MM-DD)"
            },
            endDate: {
              type: "string",
              description: "End date for custom timeframe (YYYY-MM-DD)"
            },
            metric: {
              type: "string",
              enum: ["total_revenue", "order_count", "average_order_value", "top_products"],
              description: "Specific metric to retrieve"
            }
          },
          required: ["timeframe"]
        }
      },
      {
        name: "search_orders",
        description: "Search for orders by order number, patient name, status, or date range. Use this when user asks about specific orders or order status.",
        parameters: {
          type: "object",
          properties: {
            search: {
              type: "string",
              description: "Order number or patient name to search for"
            },
            status: {
              type: "string",
              enum: ["pending", "processing", "ready", "completed", "cancelled"],
              description: "Filter by order status"
            },
            dateRange: {
              type: "string",
              enum: ["today", "week", "month"],
              description: "Filter by date range"
            }
          },
          required: []
        }
      },
      {
        name: "get_examination_records",
        description: "Get eye examination records for a patient including prescriptions and test results. Use this when user asks about patient examination history or prescriptions.",
        parameters: {
          type: "object",
          properties: {
            patientId: {
              type: "string",
              description: "The patient ID"
            },
            patientName: {
              type: "string",
              description: "Patient name if ID not known"
            }
          },
          required: []
        }
      }
    ];
  }
}
