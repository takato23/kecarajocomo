// Re-export shared types
export type { Recipe, Instruction, RecipeIngredient } from '../../recipes/types';

// Cooking Assistant specific types
export type VoiceCommand = 
  | 'next'
  | 'previous' 
  | 'repeat'
  | 'pause'
  | 'resume'
  | 'timer'
  | 'help'
  | 'ingredients'
  | 'nutrition'
  | 'finish';

export type CookingStepStatus = 'pending' | 'active' | 'completed' | 'skipped';

export type TimerState = 'idle' | 'running' | 'paused' | 'completed';

export type AssistantMode = 'guided' | 'hands-free' | 'voice-only';

export interface CookingStep {
  id: string;
  step_number: number;
  instruction: string;
  time_minutes?: number;
  temperature?: {
    value: number;
    unit: 'celsius' | 'fahrenheit';
  };
  tips?: string[];
  image_url?: string;
  status: CookingStepStatus;
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface CookingTimer {
  id: string;
  name: string;
  duration_seconds: number;
  remaining_seconds: number;
  state: TimerState;
  created_at: string;
  started_at?: string;
  paused_at?: string;
  completed_at?: string;
  step_id?: string;
}

export interface CookingAssistantSession {
  id: string;
  recipe_id: string;
  user_id: string;
  mode: AssistantMode;
  steps: CookingStep[];
  current_step_index: number;
  timers: CookingTimer[];
  voice_enabled: boolean;
  voice_lang: string;
  started_at: string;
  completed_at?: string;
  paused_at?: string;
  notes?: string;
  modifications?: string[];
  rating?: number;
  difficulty_experienced?: 'easier' | 'as-expected' | 'harder';
}

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  voice_name?: string;
  auto_advance: boolean;
  confirmation_required: boolean;
}

export interface MeasurementConversion {
  from_amount: number;
  from_unit: string;
  to_unit: string;
  converted_amount: number;
  conversion_factor: number;
}

export interface NutritionDisplay {
  per_serving: boolean;
  show_detailed: boolean;
  highlight_goals: boolean;
  show_warnings: boolean;
}

export interface CookingAssistantPreferences {
  voice_settings: VoiceSettings;
  default_mode: AssistantMode;
  auto_start_timers: boolean;
  show_nutrition: boolean;
  nutrition_display: NutritionDisplay;
  measurement_system: 'metric' | 'imperial';
  temperature_unit: 'celsius' | 'fahrenheit';
  confirm_step_completion: boolean;
  show_tips: boolean;
  large_text_mode: boolean;
  hands_free_mode: boolean;
}

export interface VoiceCommandResult {
  command: VoiceCommand;
  confidence: number;
  transcript: string;
  parameters?: Record<string, any>;
  timestamp: string;
}

export interface CookingAssistantError {
  type: 'voice' | 'timer' | 'step' | 'general';
  message: string;
  details?: string;
  timestamp: string;
  step_id?: string;
}

export interface StepProgress {
  step_id: string;
  progress_percentage: number;
  estimated_time_remaining?: number;
  user_feedback?: 'easy' | 'normal' | 'difficult';
}

export interface CookingInsight {
  id: string;
  type: 'tip' | 'warning' | 'substitution' | 'timing';
  title: string;
  message: string;
  step_id?: string;
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
  auto_dismiss_seconds?: number;
}

export interface SmartSuggestion {
  id: string;
  type: 'ingredient_substitute' | 'technique_tip' | 'timing_adjustment' | 'difficulty_help';
  title: string;
  description: string;
  action_text?: string;
  action_callback?: () => void;
  relevant_step?: number;
  confidence_score: number;
}

// Form types for UI
export interface CookingSessionFormData {
  recipe_id: string;
  mode: AssistantMode;
  voice_enabled: boolean;
  voice_lang: string;
  preferences: Partial<CookingAssistantPreferences>;
}

export interface TimerFormData {
  name: string;
  duration_minutes: number;
  step_id?: string;
  auto_start?: boolean;
}

export interface StepNoteFormData {
  step_id: string;
  notes: string;
  modifications?: string[];
  difficulty_rating?: number;
}

// Analytics types
export interface CookingAnalytics {
  session_id: string;
  recipe_id: string;
  total_cooking_time: number;
  steps_completed: number;
  steps_skipped: number;
  timers_used: number;
  voice_commands_used: number;
  errors_encountered: number;
  difficulty_rating: number;
  completion_rate: number;
  user_satisfaction: number;
  common_issues: string[];
  suggested_improvements: string[];
}

export interface VoiceAnalytics {
  session_id: string;
  total_commands: number;
  successful_commands: number;
  failed_commands: number;
  average_confidence: number;
  most_used_commands: VoiceCommand[];
  language_accuracy: number;
  noise_level_issues: number;
}