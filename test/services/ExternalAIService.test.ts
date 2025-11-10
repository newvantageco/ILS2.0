/**
 * External AI Service Tests
 * Tests for multi-provider AI service with automatic failover
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ExternalAIService } from '../../server/services/ExternalAIService';
import { createMockOpenAIResponse, createMockAnthropicResponse, createMockAIQuery } from '../helpers/mockData';

describe('ExternalAIService', () => {
  let aiService: ExternalAIService;

  beforeEach(() => {
    aiService = new ExternalAIService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider Selection', () => {
    it('should use OpenAI as default provider', async () => {
      const mockResponse = createMockOpenAIResponse('Test response from OpenAI');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      ) as any;

      const response = await aiService.generateResponse([
        { role: 'user', content: 'Hello' },
      ]);

      expect(response).toContain('Test response from OpenAI');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('openai.com'),
        expect.any(Object)
      );
    });

    it('should use specified provider when requested', async () => {
      const mockResponse = createMockAnthropicResponse('Test response from Claude');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      ) as any;

      const response = await aiService.generateResponse(
        [{ role: 'user', content: 'Hello' }],
        { provider: 'anthropic' }
      );

      expect(response).toContain('Test response from Claude');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('anthropic.com'),
        expect.any(Object)
      );
    });

    it('should use Ollama for local model', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            message: { content: 'Test response from Ollama' },
          }),
        })
      ) as any;

      const response = await aiService.generateResponse(
        [{ role: 'user', content: 'Hello' }],
        { provider: 'ollama', model: 'llama2' }
      );

      expect(response).toContain('Test response from Ollama');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('localhost:11434'),
        expect.any(Object)
      );
    });
  });

  describe('Automatic Failover', () => {
    it('should failover from OpenAI to Anthropic on error', async () => {
      let callCount = 0;

      global.fetch = jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call to OpenAI fails
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
          });
        }
        // Second call to Anthropic succeeds
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockAnthropicResponse('Fallback response')),
        });
      }) as any;

      const response = await aiService.generateResponse([
        { role: 'user', content: 'Hello' },
      ]);

      expect(response).toContain('Fallback response');
      expect(callCount).toBe(2);
    });

    it('should failover through all providers before failing', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      ) as any;

      await expect(
        aiService.generateResponse([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow();

      // Should have tried OpenAI -> Anthropic -> Ollama
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should skip providers without API keys', async () => {
      // Remove Anthropic API key
      const originalEnv = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      ) as any;

      try {
        await aiService.generateResponse([{ role: 'user', content: 'Hello' }]);
      } catch (error) {
        // Expected to fail
      }

      // Should have tried OpenAI and Ollama only (skipped Anthropic)
      expect(fetch).toHaveBeenCalledTimes(2);

      // Restore env
      if (originalEnv) process.env.ANTHROPIC_API_KEY = originalEnv;
    });
  });

  describe('Message Formatting', () => {
    it('should format messages correctly for OpenAI', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Response')),
        })
      ) as any;

      await aiService.generateResponse([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
      ]);

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
    });

    it('should format messages correctly for Anthropic', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockAnthropicResponse('Response')),
        })
      ) as any;

      await aiService.generateResponse(
        [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
        ],
        { provider: 'anthropic' }
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      // Anthropic handles system message differently
      expect(body.system).toBe('You are a helpful assistant');
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].role).toBe('user');
    });
  });

  describe('Options Handling', () => {
    it('should apply temperature setting', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Response')),
        })
      ) as any;

      await aiService.generateResponse(
        [{ role: 'user', content: 'Hello' }],
        { temperature: 0.7 }
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.temperature).toBe(0.7);
    });

    it('should apply max tokens setting', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Response')),
        })
      ) as any;

      await aiService.generateResponse(
        [{ role: 'user', content: 'Hello' }],
        { maxTokens: 500 }
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.max_tokens).toBe(500);
    });

    it('should use specified model', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Response')),
        })
      ) as any;

      await aiService.generateResponse(
        [{ role: 'user', content: 'Hello' }],
        { model: 'gpt-4' }
      );

      const call = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.model).toBe('gpt-4');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as any;

      await expect(
        aiService.generateResponse([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow();
    });

    it('should handle rate limiting', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
      ) as any;

      await expect(
        aiService.generateResponse([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow();
    });

    it('should handle invalid API key', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      ) as any;

      await expect(
        aiService.generateResponse([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow();
    });

    it('should handle malformed responses', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'response' }),
        })
      ) as any;

      await expect(
        aiService.generateResponse([{ role: 'user', content: 'Hello' }])
      ).rejects.toThrow();
    });
  });

  describe('Cost Tracking', () => {
    it('should track token usage for OpenAI', async () => {
      const mockResponse = createMockOpenAIResponse('Response');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      ) as any;

      const response = await aiService.generateResponse([
        { role: 'user', content: 'Hello' },
      ]);

      const usage = aiService.getLastUsage();

      expect(usage).toBeDefined();
      expect(usage.promptTokens).toBe(50);
      expect(usage.completionTokens).toBe(100);
      expect(usage.totalTokens).toBe(150);
    });

    it('should track token usage for Anthropic', async () => {
      const mockResponse = createMockAnthropicResponse('Response');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      ) as any;

      const response = await aiService.generateResponse(
        [{ role: 'user', content: 'Hello' }],
        { provider: 'anthropic' }
      );

      const usage = aiService.getLastUsage();

      expect(usage).toBeDefined();
      expect(usage.promptTokens).toBe(50);
      expect(usage.completionTokens).toBe(100);
    });

    it('should calculate estimated cost', async () => {
      const mockResponse = createMockOpenAIResponse('Response');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      ) as any;

      await aiService.generateResponse([{ role: 'user', content: 'Hello' }]);

      const cost = aiService.getEstimatedCost();

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });
  });

  describe('Streaming', () => {
    it('should support streaming responses from OpenAI', async () => {
      const chunks = ['Hello', ' world', '!'];
      let chunkIndex = 0;

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          body: {
            getReader: () => ({
              read: async () => {
                if (chunkIndex < chunks.length) {
                  const chunk = chunks[chunkIndex++];
                  return {
                    done: false,
                    value: new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`),
                  };
                }
                return { done: true, value: undefined };
              },
            }),
          },
        })
      ) as any;

      const stream = await aiService.generateStreamingResponse([
        { role: 'user', content: 'Hello' },
      ]);

      const collectedChunks: string[] = [];
      for await (const chunk of stream) {
        collectedChunks.push(chunk);
      }

      expect(collectedChunks.join('')).toBe('Hello world!');
    });
  });

  describe('Caching', () => {
    it('should cache responses for identical requests', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Cached response')),
        })
      ) as any;

      const messages = [{ role: 'user', content: 'Hello' }];

      // First call
      await aiService.generateResponse(messages, { enableCache: true });

      // Second call - should use cache
      await aiService.generateResponse(messages, { enableCache: true });

      // Should only have called API once
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not cache when disabled', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockOpenAIResponse('Response')),
        })
      ) as any;

      const messages = [{ role: 'user', content: 'Hello' }];

      // First call
      await aiService.generateResponse(messages, { enableCache: false });

      // Second call
      await aiService.generateResponse(messages, { enableCache: false });

      // Should have called API twice
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
