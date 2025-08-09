/**
 * Gemini AI Service
 * Google Gemini integration with graceful fallback
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/services/logger';
import geminiConfig from '@/lib/config/gemini.config';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private isAvailable: boolean = false;
  private model: any = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Get API key from centralized config
    const apiKey = geminiConfig.getApiKey();
    
    if (apiKey && geminiConfig.validate()) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Use default model from config
        const config = geminiConfig.default;
        this.model = this.genAI.getGenerativeModel({ 
          model: config.model,
          generationConfig: {
            temperature: config.temperature,
            topK: config.topK,
            topP: config.topP,
            maxOutputTokens: config.maxTokens,
          }
        });
        this.isAvailable = true;
        logger.info('[GeminiService] Initialized successfully with model:', 'GeminiService', { model: config.model });
      } catch (error) {
        logger.warn('[GeminiService] Failed to initialize:', 'GeminiService', error);
        this.isAvailable = false;
      }
    } else {
      logger.info('[GeminiService] No valid API key found, service disabled');
      this.isAvailable = false;
    }
  }

  /**
   * Check if the service is available
   */
  public checkAvailability(): boolean {
    return this.isAvailable;
  }

  /**
   * Analyze data using Gemini
   * Returns null if service is not available
   */
  async analyze(data: any): Promise<any> {
    if (!this.isAvailable || !this.model) {
      logger.debug('[GeminiService] Service not available, returning null');
      return null;
    }

    try {
      // Convert data to prompt based on type
      let prompt = '';
      if (typeof data === 'string') {
        prompt = data;
      } else if (data.text) {
        prompt = data.text;
      } else if (data.prompt) {
        prompt = data.prompt;
      } else {
        prompt = `Analyze the following data: ${JSON.stringify(data)}`;
      }

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: text,
        provider: 'gemini',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[GeminiService] Analysis error:', 'GeminiService', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'gemini'
      };
    }
  }

  /**
   * Generate content using Gemini
   * Returns empty string if service is not available
   */
  async generateContent(prompt: string): Promise<string> {
    if (!this.isAvailable || !this.model) {
      logger.debug('[GeminiService] Service not available, returning empty string');
      return '';
    }

    try {
      logger.debug('[GeminiService] Generating content...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      logger.debug('[GeminiService] Content generated successfully');
      return text;
    } catch (error) {
      logger.error('[GeminiService] Content generation error:', 'GeminiService', error);
      // Return a user-friendly message instead of throwing
      return 'Unable to generate content at this time. Please try again later.';
    }
  }

  /**
   * Generate content with streaming support
   */
  async streamContent(prompt: string, onChunk?: (text: string) => void): Promise<string> {
    if (!this.isAvailable || !this.model) {
      logger.debug('[GeminiService] Service not available for streaming');
      return '';
    }

    try {
      const result = await this.model.generateContentStream(prompt);
      let fullText = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onChunk) {
          onChunk(chunkText);
        }
      }

      return fullText;
    } catch (error) {
      logger.error('[GeminiService] Streaming error:', 'GeminiService', error);
      return 'Unable to generate content at this time.';
    }
  }

  /**
   * Analyze image using Gemini Pro Vision
   */
  async analyzeImage(imageData: string | Buffer, prompt?: string): Promise<any> {
    if (!this.isAvailable || !this.genAI) {
      logger.debug('[GeminiService] Service not available for image analysis');
      return null;
    }

    try {
      // Use Gemini Pro Vision for image analysis
      const visionModel = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      // Convert image data to required format
      let imageBase64: string;
      if (typeof imageData === 'string') {
        // Remove data URL prefix if present
        imageBase64 = imageData.replace(/^data:image\/\w+;base64,/, '');
      } else {
        imageBase64 = imageData.toString('base64');
      }

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg' // Adjust based on actual image type
        }
      };

      const defaultPrompt = prompt || 'What is in this image? Describe in detail.';
      const result = await visionModel.generateContent([defaultPrompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        data: text,
        provider: 'gemini-vision',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[GeminiService] Image analysis error:', 'GeminiService', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'gemini-vision'
      };
    }
  }
}

let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }
  return geminiServiceInstance;
}