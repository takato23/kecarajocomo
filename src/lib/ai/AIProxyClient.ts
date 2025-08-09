import { logger } from '@/services/logger';

/**
 * AI Proxy Client
 * Handles secure AI API calls via server-side proxy endpoints
 * Eliminates client-side API key exposure
 */

export interface AIProxyRequest {
  provider: 'openai' | 'anthropic' | 'gemini';
  method: string;
  data: any;
  model?: string;
}

export interface AIProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    provider: string;
    generated_at: string;
    user_id: string;
  };
}

export interface RecipeRequest {
  prompt: string;
  ingredients?: string[];
  dietaryRestrictions?: string[];
  cuisine?: string;
  mealType?: string;
  servings?: number;
  maxPrepTime?: number;
  provider?: 'gemini' | 'openai' | 'anthropic';
}

export class AIProxyClient {
  private static instance: AIProxyClient;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? '' // Client-side: use relative URLs
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Server-side: full URL
  }

  static getInstance(): AIProxyClient {
    if (!AIProxyClient.instance) {
      AIProxyClient.instance = new AIProxyClient();
    }
    return AIProxyClient.instance;
  }

  /**
   * Generic AI proxy call
   */
  async callAI(request: AIProxyRequest): Promise<AIProxyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('AI Proxy Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to call AI service');
    }
  }

  /**
   * Generate recipe via proxy
   */
  async generateRecipe(request: RecipeRequest): Promise<AIProxyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/recipes/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Recipe Generation Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate recipe');
    }
  }

  /**
   * Generate text with specified provider
   */
  async generateText(
    prompt: string, 
    provider: 'openai' | 'anthropic' | 'gemini' = 'gemini',
    model?: string
  ): Promise<string> {
    const response = await this.callAI({
      provider,
      method: provider === 'gemini' ? 'generateContent' : 'chat/completions',
      data: this.formatTextRequest(prompt, provider),
      model
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate text');
    }

    return this.extractTextFromResponse(response.data, provider);
  }

  /**
   * Generate JSON response
   */
  async generateJSON(
    prompt: string, 
    provider: 'openai' | 'anthropic' | 'gemini' = 'gemini',
    model?: string
  ): Promise<any> {
    const enhancedPrompt = `${prompt}\n\nPlease respond with valid JSON only.`;
    const text = await this.generateText(enhancedPrompt, provider, model);
    
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      logger.warn('Failed to parse JSON response:', error);
      return { content: text, raw: true };
    }
  }

  /**
   * Analyze image (when available)
   */
  async analyzeImage(
    imageUrl: string | File,
    prompt: string,
    provider: 'openai' | 'gemini' = 'gemini'
  ): Promise<string> {
    let imageData: string;

    if (imageUrl instanceof File) {
      // Convert File to base64
      imageData = await this.fileToBase64(imageUrl);
    } else {
      imageData = imageUrl;
    }

    const response = await this.callAI({
      provider,
      method: provider === 'gemini' ? 'generateContent' : 'chat/completions',
      data: this.formatImageRequest(imageData, prompt, provider)
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to analyze image');
    }

    return this.extractTextFromResponse(response.data, provider);
  }

  /**
   * Private helper methods
   */
  private formatTextRequest(prompt: string, provider: string): any {
    switch (provider) {
      case 'openai':
        return {
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2048
        };
      
      case 'anthropic':
        return {
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 2048,
          temperature: 0.7
        };
      
      case 'gemini':
        return {
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        };
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private formatImageRequest(imageData: string, prompt: string, provider: string): any {
    switch (provider) {
      case 'openai':
        return {
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageData } }
            ]
          }],
          max_tokens: 2048
        };
      
      case 'gemini':
        return {
          contents: [{
            parts: [
              { text: prompt },
              { 
                inline_data: { 
                  mime_type: 'image/jpeg', 
                  data: imageData.replace(/^data:image\/[a-z]+;base64,/, '')
                } 
              }
            ]
          }]
        };
        
      default:
        throw new Error(`Image analysis not supported for provider: ${provider}`);
    }
  }

  private extractTextFromResponse(data: any, provider: string): string {
    switch (provider) {
      case 'openai':
        return data.choices?.[0]?.message?.content || '';
      
      case 'anthropic':
        return data.content?.[0]?.text || '';
      
      case 'gemini':
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
      default:
        return JSON.stringify(data);
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Health check for proxy endpoints
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return ['openai', 'anthropic', 'gemini'];
  }
}

// Export singleton instance
export const aiProxy = AIProxyClient.getInstance();

// Export types for convenience
export type { AIProxyRequest, AIProxyResponse, RecipeRequest };