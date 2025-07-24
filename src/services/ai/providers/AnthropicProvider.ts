/**
 * Anthropic Provider
 * Implementation for Anthropic's Claude models
 */

import {
  AIProvider,
  AIServiceConfig,
  AITextRequest,
  AIImageRequest,
  AITextResponse,
  AIStreamResponse,
  AIServiceError,
} from '../types';

import { AIProviderInterface, AIProviderCapabilities } from './AIProviderInterface';

interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
}

export class AnthropicProvider extends AIProviderInterface {
  name: AIProvider = 'anthropic';
  private apiKey: string;
  private baseURL: string;

  constructor(config: AnthropicConfig) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.anthropic.com/v1';
  }

  async generateText(
    request: AITextRequest,
    config: AIServiceConfig
  ): Promise<AITextResponse> {
    try {
      // Build Claude-specific prompt
      const prompt = this.buildClaudePrompt(request);
      
      const response = await this.retry(async () => {
        const res = await fetch(`${this.baseURL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: config.model || 'claude-3-sonnet-20240229',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: config.maxTokens || 2048,
            temperature: config.temperature,
            top_p: config.topP,
            ...(request.systemPrompt && { system: request.systemPrompt }),
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || `HTTP ${res.status}`);
        }

        return res.json();
      }, config.retryAttempts, config.retryDelay);

      const text = response.content[0].text;

      return {
        data: text,
        provider: 'anthropic',
        model: response.model as any,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
          cost: this.calculateCost(response.model, response.usage),
        },
        format: request.format || 'text',
        metadata: {
          requestId: response.id,
          timestamp: new Date(),
          processingTime: 0,
        },
      };
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async streamText(
    request: AITextRequest,
    config: AIServiceConfig
  ): Promise<AIStreamResponse> {
    try {
      const prompt = this.buildClaudePrompt(request);
      
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-sonnet-20240229',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens || 2048,
          temperature: config.temperature,
          top_p: config.topP,
          stream: true,
          ...(request.systemPrompt && { system: request.systemPrompt }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      // Create stream from SSE response
      const stream = new ReadableStream<string>({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  try {
                    const json = JSON.parse(data);
                    if (json.type === 'content_block_delta') {
                      const content = json.delta?.text;
                      if (content) {
                        controller.enqueue(content);
                      }
                    } else if (json.type === 'message_stop') {
                      controller.close();
                      return;
                    }
                  } catch (e: unknown) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } catch (error: unknown) {
            controller.error(error);
          }
        },
      });

      return {
        stream,
        provider: 'anthropic',
        model: (config.model || 'claude-3-sonnet-20240229') as any,
      };
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async analyzeImage(
    request: AIImageRequest,
    config: AIServiceConfig
  ): Promise<AITextResponse> {
    try {
      // Convert image to base64
      let base64: string;
      let mimeType: string;
      
      if (typeof request.image === 'string') {
        if (request.image.startsWith('data:')) {
          const parts = request.image.split(',');
          base64 = parts[1];
          mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        } else {
          // Fetch from URL
          const response = await fetch(request.image);
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          base64 = Buffer.from(buffer).toString('base64');
          mimeType = blob.type;
        }
      } else if (request.image instanceof Buffer) {
        base64 = request.image.toString('base64');
        mimeType = request.mimeType || 'image/jpeg';
      } else {
        // Blob
        const buffer = await request.image.arrayBuffer();
        base64 = Buffer.from(buffer).toString('base64');
        mimeType = request.image.type;
      }

      const messages = [{
        role: 'user' as const,
        content: [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: mimeType,
              data: base64,
            },
          },
          {
            type: 'text' as const,
            text: request.prompt || 'What is in this image?',
          },
        ],
      }];

      const response = await this.retry(async () => {
        const res = await fetch(`${this.baseURL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229', // Use Opus for vision tasks
            messages,
            max_tokens: config.maxTokens || 4096,
            temperature: config.temperature || 0.4,
            ...(request.context && { system: request.context }),
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error?.message || `HTTP ${res.status}`);
        }

        return res.json();
      }, config.retryAttempts, config.retryDelay);

      const text = response.content[0].text;

      return {
        data: text,
        provider: 'anthropic',
        model: 'claude-3-opus-20240229' as any,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
          cost: this.calculateCost('claude-3-opus-20240229', response.usage),
        },
        format: 'text',
        metadata: {
          requestId: response.id,
          timestamp: new Date(),
          processingTime: 0,
        },
      };
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  getCapabilities(): AIProviderCapabilities {
    return {
      textGeneration: true,
      imageAnalysis: true,
      streaming: true,
      functionCalling: false, // Claude doesn't have native function calling
      maxTokens: 200000, // Claude 3 supports up to 200K tokens
    };
  }

  private buildClaudePrompt(request: AITextRequest): string {
    const parts = [];

    if (request.context) {
      parts.push(`Context:\n${request.context}\n`);
    }

    if (request.examples && request.examples.length > 0) {
      parts.push('Examples:');
      request.examples.forEach(ex => {
        parts.push(`Human: ${ex.input}\nAssistant: ${ex.output}\n`);
      });
    }

    parts.push(request.prompt);

    if (request.format === 'json') {
      parts.push('\n\nPlease respond with valid JSON only.');
    }

    return parts.join('\n');
  }

  private calculateCost(model: string, usage: any): number {
    if (!usage) return 0;

    // Pricing as of 2024 (per 1M tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
      'claude-2.1': { input: 8, output: 24 },
      'claude-2.0': { input: 8, output: 24 },
      'claude-instant-1.2': { input: 0.8, output: 2.4 },
    };

    const modelPricing = pricing[model] || pricing['claude-3-sonnet-20240229'];
    const inputCost = (usage.input_tokens / 1_000_000) * modelPricing.input;
    const outputCost = (usage.output_tokens / 1_000_000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  private handleError(error: any): AIServiceError {
    const message = error.message || 'Anthropic API error';
    let code: any = 'PROVIDER_ERROR';

    if (message.includes('401') || message.includes('authentication')) {
      code = 'AUTHENTICATION_ERROR';
    } else if (message.includes('429') || message.includes('rate limit')) {
      code = 'RATE_LIMIT';
    } else if (message.includes('quota')) {
      code = 'QUOTA_EXCEEDED';
    } else if (message.includes('timeout')) {
      code = 'TIMEOUT';
    } else if (message.includes('invalid_request')) {
      code = 'INVALID_REQUEST';
    }

    return new AIServiceError(message, code, 'anthropic', error);
  }
}