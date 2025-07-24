/**
 * Gemini AI Provider
 * Implementation for Google's Gemini AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

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

export class GeminiProvider extends AIProviderInterface {
  name: AIProvider = 'gemini';
  private genAI: GoogleGenerativeAI;

  constructor(config: { apiKey: string }) {
    super(config);
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  async generateText(
    request: AITextRequest,
    config: AIServiceConfig
  ): Promise<AITextResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: config.model === 'gemini-pro-vision' ? 'gemini-pro' : config.model || 'gemini-pro',
      });

      // Build prompt with context
      let fullPrompt = '';
      if (request.systemPrompt) {
        fullPrompt += `System: ${request.systemPrompt}\n\n`;
      }
      if (request.context) {
        fullPrompt += `Context: ${request.context}\n\n`;
      }
      if (request.examples) {
        fullPrompt += 'Examples:\n';
        request.examples.forEach(ex => {
          fullPrompt += `Input: ${ex.input}\nOutput: ${ex.output}\n\n`;
        });
      }
      fullPrompt += `User: ${request.prompt}`;

      // Generate
      const result = await this.retry(async () => {
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: config.temperature,
            topK: 1,
            topP: config.topP,
            maxOutputTokens: config.maxTokens,
          },
        });
        return response;
      }, config.retryAttempts, config.retryDelay);

      const text = result.response.text();
      
      // Calculate usage (Gemini doesn't provide exact token counts)
      const usage = {
        promptTokens: Math.ceil(fullPrompt.length / 4),
        completionTokens: Math.ceil(text.length / 4),
        totalTokens: Math.ceil((fullPrompt.length + text.length) / 4),
      };

      return {
        data: text,
        provider: 'gemini',
        model: (config.model || 'gemini-pro') as any,
        usage,
        format: request.format || 'text',
        metadata: {
          requestId: this.generateRequestId(),
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
      const model = this.genAI.getGenerativeModel({ 
        model: config.model || 'gemini-pro',
      });

      // Build prompt
      let fullPrompt = '';
      if (request.systemPrompt) {
        fullPrompt += `System: ${request.systemPrompt}\n\n`;
      }
      fullPrompt += request.prompt;

      // Create stream
      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: config.temperature,
          topK: 1,
          topP: config.topP,
          maxOutputTokens: config.maxTokens,
        },
      });

      // Convert to web stream
      const stream = new ReadableStream<string>({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(text);
              }
            }
            controller.close();
          } catch (error: unknown) {
            controller.error(error);
          }
        },
      });

      return {
        stream,
        provider: 'gemini',
        model: (config.model || 'gemini-pro') as any,
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
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro-vision',
      });

      // Convert image to required format
      let imageData: any;
      if (typeof request.image === 'string') {
        // Assume base64 or URL
        if (request.image.startsWith('data:')) {
          const base64 = request.image.split(',')[1];
          imageData = {
            inlineData: {
              data: base64,
              mimeType: request.mimeType || 'image/jpeg',
            },
          };
        } else {
          // URL - fetch and convert
          const response = await fetch(request.image);
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          imageData = {
            inlineData: {
              data: base64,
              mimeType: blob.type,
            },
          };
        }
      } else if (request.image instanceof Buffer) {
        imageData = {
          inlineData: {
            data: request.image.toString('base64'),
            mimeType: request.mimeType || 'image/jpeg',
          },
        };
      } else {
        // Blob
        const buffer = await request.image.arrayBuffer();
        imageData = {
          inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType: request.image.type,
          },
        };
      }

      // Build prompt
      const prompt = request.prompt || this.getDefaultImagePrompt(request.analysisType);

      // Generate
      const result = await this.retry(async () => {
        const response = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              imageData,
            ],
          }],
          generationConfig: {
            temperature: config.temperature || 0.4,
            topK: 1,
            topP: config.topP || 0.8,
            maxOutputTokens: config.maxTokens || 2048,
          },
        });
        return response;
      }, config.retryAttempts, config.retryDelay);

      const text = result.response.text();

      return {
        data: text,
        provider: 'gemini',
        model: 'gemini-pro-vision' as any,
        format: 'text',
        metadata: {
          requestId: this.generateRequestId(),
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
      functionCalling: false, // Gemini doesn't support function calling yet
      maxTokens: 32768,
    };
  }

  private getDefaultImagePrompt(analysisType?: string): string {
    switch (analysisType) {
      case 'ocr':
        return 'Extract all text from this image. Include all details, prices, quantities, and any other text visible.';
      case 'description':
        return 'Describe what you see in this image in detail.';
      case 'analysis':
        return 'Analyze this image and provide insights about its content, context, and any notable features.';
      default:
        return 'What is in this image?';
    }
  }

  private handleError(error: any): AIServiceError {
    const message = error.message || 'Gemini API error';
    let code: any = 'PROVIDER_ERROR';

    if (message.includes('API key')) {
      code = 'AUTHENTICATION_ERROR';
    } else if (message.includes('quota')) {
      code = 'QUOTA_EXCEEDED';
    } else if (message.includes('rate')) {
      code = 'RATE_LIMIT';
    }

    return new AIServiceError(message, code, 'gemini', error);
  }

  private generateRequestId(): string {
    return `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}