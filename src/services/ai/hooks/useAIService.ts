'use client';

/**
 * useAIService Hook
 * React hook for using the unified AI service
 */

import { useState, useCallback, useRef } from 'react';

import { getAIService } from '../UnifiedAIService';
import {
  AIServiceConfig,
  AITextRequest,
  AIImageRequest,
  AITextResponse,
  AIJSONResponse,
  GeneratedRecipe,
  ParsedReceipt,
  GeneratedMealPlan,
  MealPlanRequest,
  AIRecipeRequest,
  ShoppingRecommendation,
  AIServiceError,
} from '../types';

export interface UseAIServiceOptions extends Partial<AIServiceConfig> {
  onError?: (error: AIServiceError) => void;
  onSuccess?: (response: any) => void;
}

export interface UseAIServiceReturn {
  // State
  isLoading: boolean;
  error: AIServiceError | null;
  
  // Text generation
  generateText: (request: AITextRequest) => Promise<AITextResponse>;
  generateJSON: <T = any>(request: AITextRequest, schema?: any) => Promise<AIJSONResponse<T>>;
  
  // Image analysis
  analyzeImage: (request: AIImageRequest) => Promise<AITextResponse>;
  parseReceipt: (input: string | AIImageRequest) => Promise<ParsedReceipt>;
  
  // Recipe & meal planning
  generateRecipe: (request: AIRecipeRequest) => Promise<GeneratedRecipe>;
  generateMealPlan: (request: MealPlanRequest) => Promise<GeneratedMealPlan>;
  generateShoppingRecommendations: (
    pantryItems: any[],
    preferences: any
  ) => Promise<ShoppingRecommendation[]>;
  
  // Chat
  chat: (messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) => Promise<AITextResponse>;
  
  // Utilities
  reset: () => void;
  updateConfig: (config: Partial<AIServiceConfig>) => void;
}

export function useAIService(options: UseAIServiceOptions = {}): UseAIServiceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AIServiceError | null>(null);
  const optionsRef = useRef(options);
  const aiService = getAIService(options);

  // Update options ref
  optionsRef.current = options;

  const handleRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await request();
      optionsRef.current.onSuccess?.(result);
      return result;
    } catch (err: unknown) {
      const error = err as AIServiceError;
      setError(error);
      optionsRef.current.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateText = useCallback((request: AITextRequest) => {
    return handleRequest(() => aiService.generateText(request, optionsRef.current));
  }, [aiService, handleRequest]);

  const generateJSON = useCallback(<T = any>(request: AITextRequest, schema?: any) => {
    return handleRequest(() => aiService.generateJSON<T>(request, schema, optionsRef.current));
  }, [aiService, handleRequest]);

  const analyzeImage = useCallback((request: AIImageRequest) => {
    return handleRequest(() => aiService.analyzeImage(request, optionsRef.current));
  }, [aiService, handleRequest]);

  const parseReceipt = useCallback((input: string | AIImageRequest) => {
    return handleRequest(() => aiService.parseReceipt(input, optionsRef.current));
  }, [aiService, handleRequest]);

  const generateRecipe = useCallback((request: AIRecipeRequest) => {
    return handleRequest(() => aiService.generateRecipe(request, optionsRef.current));
  }, [aiService, handleRequest]);

  const generateMealPlan = useCallback((request: MealPlanRequest) => {
    return handleRequest(() => aiService.generateMealPlan(request, optionsRef.current));
  }, [aiService, handleRequest]);

  const generateShoppingRecommendations = useCallback((
    pantryItems: any[],
    preferences: any
  ) => {
    return handleRequest(() => 
      aiService.generateShoppingRecommendations(pantryItems, preferences, optionsRef.current)
    );
  }, [aiService, handleRequest]);

  const chat = useCallback((
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ) => {
    return handleRequest(() => aiService.chat(messages, optionsRef.current));
  }, [aiService, handleRequest]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  const updateConfig = useCallback((config: Partial<AIServiceConfig>) => {
    aiService.updateConfig(config);
  }, [aiService]);

  return {
    // State
    isLoading,
    error,
    
    // Text generation
    generateText,
    generateJSON,
    
    // Image analysis
    analyzeImage,
    parseReceipt,
    
    // Recipe & meal planning
    generateRecipe,
    generateMealPlan,
    generateShoppingRecommendations,
    
    // Chat
    chat,
    
    // Utilities
    reset,
    updateConfig,
  };
}