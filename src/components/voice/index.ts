/**
 * Voice Components
 * Export all voice-related components - unified system
 */

// Unified components (NEW)
export { UnifiedVoiceButton } from './UnifiedVoiceButton';
export { VoiceModal } from './VoiceModal';
export { VoiceRecorder } from './VoiceRecorder';
export { AudioVisualizer } from './AudioVisualizer';
export { DiscreteVoiceButton } from './DiscreteVoiceButton';
export { FloatingVoiceAssistant } from './FloatingVoiceAssistant';

// Legacy components (for backward compatibility)
export { VoiceInput } from './VoiceInput';
export { VoiceButton } from './VoiceButton';

// Unified hook (NEW)
export { useVoiceService as useUnifiedVoice } from '@/services/voice';
export type { VoiceOptions, VoiceResult, VoiceCommand, VoiceState } from '@/services/voice';

// Legacy hooks (for backward compatibility)
export { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
export { useVoiceRecording } from '@/hooks/useVoiceRecording';
export type { VoiceResult as LegacyVoiceResult, UseVoiceRecognitionReturn } from '@/hooks/useVoiceRecognition';

// Parser utilities
export { 
  parseSpanishVoiceInput, 
  parseSpanishVoiceBatch,
  validateParsedInput 
} from '@/lib/voice/spanishVoiceParser';

// Types
export type { ParsedIngredientInput, VoiceParseResult } from '@/types/pantry';
export type { ParsedIngredient, ParsedCommand } from '@/services/voice/smartParser';