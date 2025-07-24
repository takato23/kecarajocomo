/**
 * AI Services Export
 * Centralized export point for all AI-related services
 */

// Main service
export { UnifiedAIService, getAIService } from './UnifiedAIService';

// Types
export * from './types';

// Providers (for advanced usage)
export { AIProviderInterface } from './providers/AIProviderInterface';
export { GeminiProvider } from './providers/GeminiProvider';
export { OpenAIProvider } from './providers/OpenAIProvider';
export { AnthropicProvider } from './providers/AnthropicProvider';

// React hooks
export { useAIService } from './hooks/useAIService';
export { useRecipeGeneration } from './hooks/useRecipeGeneration';
export { useMealPlanning } from './hooks/useMealPlanning';
export { useReceiptScanning } from './hooks/useReceiptScanning';

// Constants
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
  AUTO: 'auto',
} as const;

export const AI_MODELS = {
  // OpenAI
  GPT4: 'gpt-4',
  GPT35_TURBO: 'gpt-3.5-turbo',
  GPT4_VISION: 'gpt-4-vision-preview',
  
  // Anthropic
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  
  // Gemini
  GEMINI_PRO: 'gemini-pro',
  GEMINI_PRO_VISION: 'gemini-pro-vision',
} as const;

export const DEFAULT_AI_CONFIG = {
  provider: 'auto' as const,
  model: AI_MODELS.GEMINI_PRO,
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;