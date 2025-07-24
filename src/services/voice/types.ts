/**
 * Voice Service Types and Interfaces
 * Unified types for all voice-related functionality
 */

export interface VoiceServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  enableWakeWord?: boolean;
  enableFeedback?: boolean;
  enableOffline?: boolean;
  maxAlternatives?: number;
  confidenceThreshold?: number;
}

export interface VoiceCommand {
  intent: VoiceIntent;
  entity: string;
  parameters: Record<string, any>;
  confidence: number;
  transcript: string;
  context?: VoiceContext;
  alternatives?: VoiceAlternative[];
}

export type VoiceIntent = 
  | 'add' 
  | 'search' 
  | 'navigate' 
  | 'action' 
  | 'query' 
  | 'command'
  | 'timer'
  | 'recipe'
  | 'unknown';

export interface VoiceAlternative {
  transcript: string;
  confidence: number;
}

export interface VoiceContext {
  currentScreen?: string;
  previousCommands?: VoiceCommand[];
  userPreferences?: Record<string, any>;
  sessionData?: Record<string, any>;
}

export interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface VoiceFeedbackSound {
  name: 'start' | 'end' | 'success' | 'error' | 'notification';
  volume?: number;
  duration?: number;
}

export interface VoiceServiceEvents {
  'start': void;
  'speechstart': void;
  'speechend': void;
  'result': VoiceCommand;
  'interim': { transcript: string };
  'error': Error;
  'end': void;
  'wakeword': { transcript: string };
  'command': VoiceCommand;
  'executed': VoiceCommand;
}

export interface ConversationEntry {
  timestamp: Date;
  type: 'user' | 'assistant';
  content: string;
  command?: VoiceCommand;
  metadata?: Record<string, any>;
}

export interface VoiceParserOptions {
  context?: VoiceContext;
  language?: string;
  strict?: boolean;
}

export interface ParsedCommand {
  action: string;
  target?: string;
  parameters: Record<string, any>;
  entities: {
    ingredients?: Array<{ name: string; quantity?: number; unit?: string }>;
    locations?: string[];
    times?: string[];
    actions?: string[];
  };
  confidence: number;
  context?: any;
}

export interface WakeWordConfig {
  phrases: string[];
  sensitivity?: number;
  requireExactMatch?: boolean;
  language?: string;
}

export interface VoiceServiceStatus {
  isAvailable: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentLanguage: string;
  feedbackEnabled: boolean;
  wakeWordEnabled: boolean;
  offlineModeEnabled: boolean;
}

export interface VoiceAnalytics {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageConfidence: number;
  commandsByIntent: Record<VoiceIntent, number>;
  commonPhrases: Array<{ phrase: string; count: number }>;
  sessionDuration: number;
}

// Platform-specific types
export interface PlatformVoiceCapabilities {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  continuousRecognition: boolean;
  offlineRecognition: boolean;
  wakeWordDetection: boolean;
  customVoices: boolean;
  audioFeedback: boolean;
}

// Error types
export class VoiceServiceError extends Error {
  constructor(
    message: string,
    public code: VoiceErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'VoiceServiceError';
  }
}

export type VoiceErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'AUDIO_ERROR'
  | 'PARSING_ERROR'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'UNKNOWN';