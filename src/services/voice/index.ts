/**
 * Voice Services Export
 * Centralized export point for all voice-related services
 */

// Main service
export { UnifiedVoiceService, getVoiceService } from './UnifiedVoiceService';

// Types
export * from './types';

// Sub-services (for advanced usage)
export { VoiceFeedbackManager } from './VoiceFeedbackManager';
export { SmartCommandParser } from './SmartCommandParser';
export { ConversationContextManager } from './ConversationContextManager';
export { WakeWordDetectionService } from './WakeWordDetectionService';
export { VoiceAnalyticsTracker } from './VoiceAnalyticsTracker';

// React hooks for voice integration
export { useVoiceService } from './hooks/useVoiceService';
export { useVoiceCommand } from './hooks/useVoiceCommand';
export { useVoiceFeedback } from './hooks/useVoiceFeedback';

// Legacy exports for backward compatibility (commented out until implemented)
// export { VoiceService } from './VoiceService';
// export type { VoiceCommand as LegacyVoiceCommand, VoiceServiceOptions } from './VoiceService';
// export { VoiceFeedback } from './voiceFeedback';
// export { SmartParser } from './smartParser';
// export { ConversationContext } from './conversationContext';
// export { WakeWordDetector } from './wakeWordDetector';

// Temporary exports to fix build
export class SmartParser {
  parse(input: string): ParsedIngredient[] {
    // TODO: Implement smart parsing
    return [];
  }
}

export interface ParsedIngredient {
  name: string;
  quantity?: number;
  unit?: string;
}

// Constants
export const SUPPORTED_LANGUAGES = [
  'es-MX', // Spanish (Mexico)
  'es-ES', // Spanish (Spain)
  'en-US', // English (US)
  'en-GB', // English (UK)
] as const;

export const DEFAULT_VOICE_CONFIG = {
  language: 'es-MX',
  continuous: false,
  interimResults: true,
  enableWakeWord: false,
  enableFeedback: true,
  enableOffline: false,
  maxAlternatives: 3,
  confidenceThreshold: 0.7,
} as const;