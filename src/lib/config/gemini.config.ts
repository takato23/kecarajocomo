/**
 * Unified Gemini Configuration
 * Centralizes all Gemini API configuration and provides a single source of truth
 */

import { logger } from '@/services/logger';

interface GeminiConfig {
  apiKey: string | undefined;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
}

// Priority order for API key resolution
const API_KEY_SOURCES = [
  'GOOGLE_GEMINI_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_AI_API_KEY',
  'NEXT_PUBLIC_GEMINI_API_KEY',
  'NEXT_PUBLIC_GOOGLE_AI_API_KEY'
] as const;

/**
 * Get Gemini API key from environment variables
 * Tries multiple sources in priority order
 */
export function getGeminiApiKey(): string | undefined {
  for (const source of API_KEY_SOURCES) {
    const key = process.env[source];
    if (key && key !== 'your_gemini_api_key' && key !== 'your_gemini_api_key_for_client_side') {
      logger.info(`Using Gemini API key from ${source}`, 'GeminiConfig');
      return key;
    }
  }
  
  logger.warn('No valid Gemini API key found in environment variables', 'GeminiConfig');
  return undefined;
}

/**
 * Default Gemini configuration
 */
export const defaultGeminiConfig: GeminiConfig = {
  apiKey: getGeminiApiKey(),
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  maxTokens: 8192,
  topP: 0.95,
  topK: 40
};

/**
 * Model-specific configurations
 */
export const modelConfigs = {
  'gemini-1.5-flash': {
    ...defaultGeminiConfig,
    model: 'gemini-1.5-flash',
    maxTokens: 8192
  },
  'gemini-1.5-pro': {
    ...defaultGeminiConfig,
    model: 'gemini-1.5-pro',
    maxTokens: 32768,
    temperature: 0.9
  },
  'gemini-pro': {
    ...defaultGeminiConfig,
    model: 'gemini-pro',
    maxTokens: 4096,
    temperature: 0.5
  }
};

/**
 * Feature-specific configurations
 */
export const featureConfigs = {
  mealPlanning: {
    ...modelConfigs['gemini-1.5-flash'],
    temperature: 0.8,
    systemPrompt: `You are an expert meal planner and nutritionist specializing in Argentine cuisine.
    You help users create balanced, delicious meal plans that fit their dietary preferences and budget.
    Always consider local ingredients and seasonal availability in Argentina.`
  },
  recipeGeneration: {
    ...modelConfigs['gemini-1.5-flash'],
    temperature: 0.9,
    systemPrompt: `You are a creative chef specializing in home cooking and Argentine cuisine.
    Generate detailed, easy-to-follow recipes that use common ingredients.
    Include prep time, cooking time, nutritional information, and helpful tips.`
  },
  pantryAnalysis: {
    ...modelConfigs['gemini-1.5-flash'],
    temperature: 0.5,
    systemPrompt: `You are a pantry management expert who helps users optimize their food storage.
    Analyze pantry contents, suggest recipes based on available ingredients, and identify items near expiration.
    Provide practical advice for reducing food waste.`
  },
  voiceCommands: {
    ...modelConfigs['gemini-1.5-flash'],
    temperature: 0.3,
    systemPrompt: `You are a voice command interpreter for a meal planning app.
    Parse natural language commands and convert them to structured actions.
    Be precise and handle Spanish and English commands.`
  }
};

/**
 * Validate Gemini configuration
 */
export function validateGeminiConfig(): boolean {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    logger.error('Gemini API key is not configured', 'GeminiConfig');
    return false;
  }
  
  if (apiKey.length < 30) {
    logger.error('Gemini API key appears to be invalid (too short)', 'GeminiConfig');
    return false;
  }
  
  return true;
}

/**
 * Get configuration for a specific feature
 */
export function getFeatureConfig(feature: keyof typeof featureConfigs): GeminiConfig & { systemPrompt: string } {
  const config = featureConfigs[feature];
  
  // Ensure API key is always up to date
  config.apiKey = getGeminiApiKey();
  
  return config;
}

export default {
  getApiKey: getGeminiApiKey,
  validate: validateGeminiConfig,
  default: defaultGeminiConfig,
  models: modelConfigs,
  features: featureConfigs,
  getFeatureConfig
};