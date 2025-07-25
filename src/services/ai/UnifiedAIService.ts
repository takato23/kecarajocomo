/**
 * Unified AI Service
 * Consolidates OpenAI, Anthropic, and Gemini into a single interface
 */

import {
  AIProvider,
  AIServiceConfig,
  AITextRequest,
  AIImageRequest,
  AIRecipeRequest,
  AITextResponse,
  AIJSONResponse,
  AIStreamResponse,
  GeneratedRecipe,
  ParsedReceipt,
  GeneratedMealPlan,
  MealPlanRequest,
  ShoppingRecommendation,
  AIServiceError,
} from './types';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { AIProviderInterface } from './providers/AIProviderInterface';

export class UnifiedAIService {
  private static instance: UnifiedAIService;
  private providers: Map<AIProvider, AIProviderInterface>;
  private config: Required<AIServiceConfig>;
  private defaultProvider: AIProvider = 'gemini';

  private constructor(config: AIServiceConfig = {}) {
    this.config = {
      provider: 'auto',
      model: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.providers = new Map();
    this.initializeProviders();
  }

  static getInstance(config?: AIServiceConfig): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService(config);
    }
    return UnifiedAIService.instance;
  }

  private initializeProviders(): void {
    // Initialize OpenAI if API key is available
    const openaiKey = this.config.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (openaiKey) {
      this.providers.set('openai', new OpenAIProvider({ apiKey: openaiKey }));
    }

    // Initialize Anthropic if API key is available
    const anthropicKey = this.config.apiKey || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.providers.set('anthropic', new AnthropicProvider({ apiKey: anthropicKey }));
    }

    // Initialize Gemini if API key is available
    const geminiKey = this.config.apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      this.providers.set('gemini', new GeminiProvider({ apiKey: geminiKey }));
    }
  }

  /**
   * Get the appropriate provider based on request and config
   */
  private selectProvider(
    preferredProvider?: AIProvider,
    requiresVision: boolean = false
  ): AIProviderInterface {
    let provider = preferredProvider || this.config.provider;

    // Auto-select provider based on capabilities
    if (provider === 'auto') {
      if (requiresVision) {
        // Prefer Gemini Pro Vision for image analysis
        provider = this.providers.has('gemini') ? 'gemini' : 'openai';
      } else {
        // Use default provider for text
        provider = this.defaultProvider;
      }
    }

    const selectedProvider = this.providers.get(provider);
    if (!selectedProvider) {
      throw new AIServiceError(
        `Provider ${provider} is not available`,
        'PROVIDER_ERROR',
        provider
      );
    }

    return selectedProvider;
  }

  /**
   * Generate text completion
   */
  async generateText(request: AITextRequest, config?: Partial<AIServiceConfig>): Promise<AITextResponse> {
    const mergedConfig = { ...this.config, ...config };
    const provider = this.selectProvider(mergedConfig.provider);
    
    try {
      return await provider.generateText(request, mergedConfig);
    } catch (error: unknown) {
      throw this.handleProviderError(error, provider);
    }
  }

  /**
   * Generate JSON response
   */
  async generateJSON<T = any>(
    request: AITextRequest,
    schema?: any,
    config?: Partial<AIServiceConfig>
  ): Promise<AIJSONResponse<T>> {
    const jsonRequest = {
      ...request,
      format: 'json' as const,
      systemPrompt: (request.systemPrompt || '') + '\n\nYou must respond with valid JSON only.',
    };

    const response = await this.generateText(jsonRequest, config);
    
    try {
      const data = JSON.parse(response.data);
      return {
        ...response,
        data,
        format: 'json',
        schema,
      };
    } catch (error: unknown) {
      throw new AIServiceError(
        'Failed to parse JSON response',
        'PARSING_ERROR',
        response.provider,
        { originalResponse: response.data }
      );
    }
  }

  /**
   * Stream text generation
   */
  async streamText(
    request: AITextRequest,
    config?: Partial<AIServiceConfig>
  ): Promise<AIStreamResponse> {
    const mergedConfig = { ...this.config, ...config };
    const provider = this.selectProvider(mergedConfig.provider);
    
    try {
      return await provider.streamText(request, mergedConfig);
    } catch (error: unknown) {
      throw this.handleProviderError(error, provider);
    }
  }

  /**
   * Analyze image
   */
  async analyzeImage(
    request: AIImageRequest,
    config?: Partial<AIServiceConfig>
  ): Promise<AITextResponse> {
    const mergedConfig = { ...this.config, ...config };
    const provider = this.selectProvider(mergedConfig.provider, true);
    
    try {
      return await provider.analyzeImage(request, mergedConfig);
    } catch (error: unknown) {
      throw this.handleProviderError(error, provider);
    }
  }

  /**
   * Parse receipt from image or text
   */
  async parseReceipt(
    input: string | AIImageRequest,
    config?: Partial<AIServiceConfig>
  ): Promise<ParsedReceipt> {
    let ocrText: string;

    // If input is an image, perform OCR first
    if (typeof input !== 'string') {
      const ocrResponse = await this.analyzeImage({
        ...input,
        analysisType: 'ocr',
        prompt: 'Extract all text from this receipt image. Include prices, quantities, and item names.',
      }, config);
      ocrText = ocrResponse.data;
    } else {
      ocrText = input;
    }

    // Parse the receipt text
    const parseRequest: AITextRequest = {
      prompt: `Parse this receipt text and extract structured data.
      
Receipt text:
${ocrText}

Extract:
- Each item with name, quantity, unit, price, and category
- Store name
- Date of purchase
- Total amount
- Tax and subtotal if available

Respond with JSON only.`,
      format: 'json',
    };

    const response = await this.generateJSON<ParsedReceipt>(parseRequest, undefined, config);
    
    // Enrich with additional data
    return this.enrichReceiptData(response.data);
  }

  /**
   * Generate recipe
   */
  async generateRecipe(
    request: AIRecipeRequest,
    config?: Partial<AIServiceConfig>
  ): Promise<GeneratedRecipe> {
    const prompt = this.buildRecipePrompt(request);
    
    const aiRequest: AITextRequest = {
      prompt,
      format: 'json',
      systemPrompt: 'You are a professional chef AI that creates detailed, practical recipes.',
    };

    const response = await this.generateJSON<GeneratedRecipe>(aiRequest, undefined, config);
    
    // Add metadata
    return {
      ...response.data,
      id: this.generateId(),
      aiGenerated: true,
      confidence: this.calculateRecipeConfidence(response.data, request),
    };
  }

  /**
   * Generate meal plan
   */
  async generateMealPlan(
    request: MealPlanRequest,
    config?: Partial<AIServiceConfig>
  ): Promise<GeneratedMealPlan> {
    const prompt = this.buildMealPlanPrompt(request);
    
    const aiRequest: AITextRequest = {
      prompt,
      format: 'json',
      systemPrompt: 'You are a meal planning expert that creates balanced, practical meal plans.',
    };

    const response = await this.generateJSON<GeneratedMealPlan>(aiRequest, undefined, {
      ...config,
      maxTokens: 4096, // Meal plans need more tokens
    });

    return {
      ...response.data,
      id: this.generateId(),
      aiGenerated: true,
    };
  }

  /**
   * Generate shopping recommendations
   */
  async generateShoppingRecommendations(
    pantryItems: any[],
    preferences: any,
    config?: Partial<AIServiceConfig>
  ): Promise<ShoppingRecommendation[]> {
    const prompt = `Based on these pantry items and user preferences, recommend what to buy:

Pantry: ${JSON.stringify(pantryItems)}
Preferences: ${JSON.stringify(preferences)}

Consider:
- Items running low
- Missing staples
- Ingredients for common recipes
- Seasonal recommendations
- Budget optimization

Respond with JSON array of recommendations.`;

    const response = await this.generateJSON<ShoppingRecommendation[]>(
      { prompt, format: 'json' },
      undefined,
      config
    );

    return response.data;
  }

  /**
   * Chat completion (for conversational AI)
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    config?: Partial<AIServiceConfig>
  ): Promise<AITextResponse> {
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const request: AITextRequest = {
      prompt: userMessages[userMessages.length - 1]?.content || '',
      systemPrompt: systemMessage?.content,
      context: userMessages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n'),
    };

    return this.generateText(request, config);
  }

  /**
   * Suggest recipes from pantry items
   */
  async suggestRecipesFromPantry(
    pantryItems: string[],
    config?: Partial<AIServiceConfig>
  ): Promise<any[]> {
    const prompt = `Based on these pantry items, suggest 3-5 recipes that can be made:

Pantry items: ${pantryItems.join(', ')}

For each recipe, provide:
- Name
- Description
- Required ingredients (highlighting which ones are from the pantry)
- Basic instructions
- Cooking time
- Difficulty level

Respond with a JSON array of recipe objects.`;

    const response = await this.generateJSON<any[]>(
      { prompt, format: 'json' },
      undefined,
      config
    );

    return response.data;
  }

  /**
   * Analyze nutrition information
   */
  async analyzeNutrition(
    ingredients: any[],
    config?: Partial<AIServiceConfig>
  ): Promise<any> {
    const prompt = `Analyze the nutritional content of these ingredients:

${JSON.stringify(ingredients, null, 2)}

Provide:
- Total calories
- Macronutrients (protein, carbs, fats)
- Key vitamins and minerals
- Health benefits
- Dietary considerations

Respond with detailed nutrition analysis in JSON format.`;

    const response = await this.generateJSON<any>(
      { prompt, format: 'json' },
      undefined,
      config
    );

    return response.data;
  }

  /**
   * Improve existing recipe
   */
  async improveRecipe(
    recipe: any,
    requirements: string,
    config?: Partial<AIServiceConfig>
  ): Promise<string> {
    const prompt = `Improve this recipe based on the following requirements:

Recipe: ${JSON.stringify(recipe, null, 2)}

Requirements: ${requirements}

Provide specific suggestions for improvement, considering:
- Flavor enhancement
- Nutritional value
- Cooking technique
- Ingredient substitutions
- Time optimization`;

    const response = await this.generateText({ prompt }, config);
    return response.data;
  }

  /**
   * Suggest ingredient substitutions
   */
  async suggestSubstitutions(
    ingredient: string,
    reason?: string,
    config?: Partial<AIServiceConfig>
  ): Promise<string[]> {
    const prompt = `Suggest substitutions for "${ingredient}"${reason ? ` because: ${reason}` : ''}.

Consider:
- Similar flavor profiles
- Texture compatibility
- Nutritional equivalence
- Common availability
- Cooking behavior

List 3-5 suitable substitutions with brief explanations.`;

    const response = await this.generateText({ prompt }, config);
    
    // Parse the response to extract substitutions
    const lines = response.data.split('\n').filter(line => line.trim());
    return lines.filter(line => line.match(/^[\d\-\*\•]/)); // Lines starting with bullet points
  }

  /**
   * Generate shopping tips
   */
  async generateShoppingTips(
    items: string[],
    config?: Partial<AIServiceConfig>
  ): Promise<string> {
    const prompt = `Provide shopping tips for these items:

Items: ${items.join(', ')}

Include:
- How to select fresh/quality items
- Best time to buy (seasonality)
- Storage tips
- Money-saving suggestions
- Quantity recommendations

Format as practical, actionable tips.`;

    const response = await this.generateText({ prompt }, config);
    return response.data;
  }

  /**
   * Batch process multiple requests
   */
  async batch<T>(
    requests: Array<() => Promise<T>>,
    options: { concurrency?: number; throwOnError?: boolean } = {}
  ): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
    const { concurrency = 3, throwOnError = false } = options;
    const results: Array<{ success: boolean; data?: T; error?: Error }> = [];
    
    // Process in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch.map(fn => fn()));
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push({ success: true, data: result.value });
        } else {
          const error = result.reason;
          results.push({ success: false, error });
          if (throwOnError) throw error;
        }
      }
    }

    return results;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize providers if API keys changed
    if (config.apiKey) {
      this.initializeProviders();
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(provider: AIProvider): {
    textGeneration: boolean;
    imageAnalysis: boolean;
    streaming: boolean;
    functionCalling: boolean;
    maxTokens: number;
  } {
    const p = this.providers.get(provider);
    if (!p) {
      return {
        textGeneration: false,
        imageAnalysis: false,
        streaming: false,
        functionCalling: false,
        maxTokens: 0,
      };
    }
    
    return p.getCapabilities();
  }

  // Helper methods

  private buildRecipePrompt(request: AIRecipeRequest): string {
    const parts = ['Create a detailed recipe with the following requirements:'];
    
    if (request.ingredients?.length) {
      parts.push(`\nIngredients available: ${request.ingredients.join(', ')}`);
    }
    
    if (request.mealType) {
      parts.push(`Meal type: ${request.mealType}`);
    }
    
    if (request.cuisine) {
      parts.push(`Cuisine: ${request.cuisine}`);
    }
    
    if (request.difficulty) {
      parts.push(`Difficulty level: ${request.difficulty}`);
    }
    
    if (request.servings) {
      parts.push(`Servings: ${request.servings}`);
    }
    
    if (request.maxTime) {
      parts.push(`Maximum cooking time: ${request.maxTime} minutes`);
    }
    
    if (request.constraints?.dietary?.length) {
      parts.push(`Dietary requirements: ${request.constraints.dietary.join(', ')}`);
    }
    
    parts.push('\nProvide complete recipe with ingredients, instructions, nutrition info, and metadata.');
    
    return parts.join('\n');
  }

  private buildMealPlanPrompt(request: MealPlanRequest): string {
    return `Create a ${request.days}-day meal plan for ${request.peopleCount} people.

Pantry items: ${JSON.stringify(request.pantryItems)}
Preferences: ${JSON.stringify(request.preferences)}
Budget: ${request.budget ? `$${request.budget}` : 'Flexible'}

Requirements:
- Include breakfast, lunch, and dinner for each day
- ${request.includeLeftovers ? 'Plan for leftovers' : 'Minimize leftovers'}
- ${request.avoidRepetition ? 'Avoid repeating meals' : 'Repetition is okay'}
- Generate shopping list for missing ingredients
- Calculate estimated total cost
- Provide nutrition summary

Respond with complete meal plan in JSON format.`;
  }

  private enrichReceiptData(receipt: ParsedReceipt): ParsedReceipt {
    // Add categories to items if missing
    receipt.items = receipt.items.map(item => ({
      ...item,
      category: item.category || this.categorizeItem(item.name),
    }));
    
    // Calculate confidence based on data completeness
    const confidence = this.calculateReceiptConfidence(receipt);
    
    return { ...receipt, confidence };
  }

  private categorizeItem(itemName: string): string {
    const name = itemName.toLowerCase();
    
    if (name.match(/milk|cheese|yogurt|butter/)) return 'dairy';
    if (name.match(/chicken|beef|pork|fish|meat/)) return 'meat';
    if (name.match(/bread|pasta|rice|cereal/)) return 'grains';
    if (name.match(/apple|banana|orange|fruit/)) return 'fruits';
    if (name.match(/carrot|broccoli|lettuce|vegetable/)) return 'vegetables';
    if (name.match(/soda|juice|water|drink/)) return 'beverages';
    if (name.match(/chips|candy|chocolate|snack/)) return 'snacks';
    
    return 'other';
  }

  private calculateRecipeConfidence(recipe: any, request: AIRecipeRequest): number {
    let confidence = 0.5; // Base confidence
    
    // Check if recipe meets requirements
    if (recipe.ingredients?.length > 0) confidence += 0.1;
    if (recipe.instructions?.length > 0) confidence += 0.1;
    if (recipe.nutrition) confidence += 0.1;
    if (recipe.totalTime <= (request.maxTime || Infinity)) confidence += 0.1;
    if (recipe.servings === request.servings) confidence += 0.1;
    
    return Math.min(confidence, 1);
  }

  private calculateReceiptConfidence(receipt: ParsedReceipt): number {
    let confidence = 0.5;
    
    if (receipt.store) confidence += 0.1;
    if (receipt.date) confidence += 0.1;
    if (receipt.total > 0) confidence += 0.1;
    if (receipt.items.length > 0) confidence += 0.1;
    if (receipt.items.every(item => item.price > 0)) confidence += 0.1;
    
    return Math.min(confidence, 1);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleProviderError(error: any, provider: AIProviderInterface): Error {
    if (error instanceof AIServiceError) {
      return error;
    }
    
    // Map provider-specific errors
    const message = error.message || 'Unknown AI service error';
    const code = this.mapErrorCode(error);
    
    return new AIServiceError(message, code, provider.name, error);
  }

  private mapErrorCode(error: any): any {
    if (error.code) return error.code;
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('rate limit')) return 'RATE_LIMIT';
    if (message.includes('authentication') || message.includes('api key')) return 'AUTHENTICATION_ERROR';
    if (message.includes('network')) return 'NETWORK_ERROR';
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('quota')) return 'QUOTA_EXCEEDED';
    
    return 'UNKNOWN';
  }
}

// Export singleton getter
export const getAIService = (config?: AIServiceConfig) => 
  UnifiedAIService.getInstance(config);