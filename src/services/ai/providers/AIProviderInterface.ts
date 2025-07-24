/**
 * AI Provider Interface
 * Common interface for all AI providers
 */

import {
  AIProvider,
  AIServiceConfig,
  AITextRequest,
  AIImageRequest,
  AITextResponse,
  AIStreamResponse,
} from '../types';

export interface AIProviderCapabilities {
  textGeneration: boolean;
  imageAnalysis: boolean;
  streaming: boolean;
  functionCalling: boolean;
  maxTokens: number;
}

export abstract class AIProviderInterface {
  abstract name: AIProvider;
  protected config: any;

  constructor(config: any) {
    this.config = config;
  }

  /**
   * Generate text completion
   */
  abstract generateText(
    request: AITextRequest,
    config: AIServiceConfig
  ): Promise<AITextResponse>;

  /**
   * Stream text generation
   */
  abstract streamText(
    request: AITextRequest,
    config: AIServiceConfig
  ): Promise<AIStreamResponse>;

  /**
   * Analyze image
   */
  abstract analyzeImage(
    request: AIImageRequest,
    config: AIServiceConfig
  ): Promise<AITextResponse>;

  /**
   * Get provider capabilities
   */
  abstract getCapabilities(): AIProviderCapabilities;

  /**
   * Build messages for chat format
   */
  protected buildMessages(request: AITextRequest): any[] {
    const messages = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    if (request.context) {
      messages.push({
        role: 'user',
        content: request.context,
      });
    }

    if (request.examples) {
      request.examples.forEach(example => {
        messages.push(
          { role: 'user', content: example.input },
          { role: 'assistant', content: example.output }
        );
      });
    }

    messages.push({
      role: 'user',
      content: request.prompt,
    });

    return messages;
  }

  /**
   * Retry with exponential backoff
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: unknown) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }
}