/**
 * Analytics Service Export
 * Centralized export point for all analytics-related services
 */

// Main service
export { AnalyticsService, getAnalyticsService } from './AnalyticsService';

// Providers
export { PostHogProvider } from './providers/PostHogProvider';

// Types
export * from './types';

// React hooks
export { 
  useAnalytics, 
  useFeatureTracking, 
  useErrorTracking, 
  usePerformanceTracking 
} from './hooks/useAnalytics';

// Convenience exports
import { getAnalyticsService } from './AnalyticsService';

// Create a default instance
const defaultAnalytics = getAnalyticsService();

// Export convenience methods
export const track = defaultAnalytics.track.bind(defaultAnalytics);
export const page = defaultAnalytics.page.bind(defaultAnalytics);
export const identify = defaultAnalytics.identify.bind(defaultAnalytics);
export const trackError = defaultAnalytics.trackError.bind(defaultAnalytics);
export const trackPerformance = defaultAnalytics.trackPerformance.bind(defaultAnalytics);

// Export default instance for advanced usage
export { defaultAnalytics };

// Common event names for consistency
export const ANALYTICS_EVENTS = {
  // User events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_PROFILE_UPDATE: 'user_profile_update',
  
  // Pantry events
  PANTRY_ITEM_ADD: 'pantry_item_add',
  PANTRY_ITEM_UPDATE: 'pantry_item_update',
  PANTRY_ITEM_DELETE: 'pantry_item_delete',
  PANTRY_ITEM_CONSUME: 'pantry_item_consume',
  PANTRY_EXPIRATION_ALERT: 'pantry_expiration_alert',
  
  // Recipe events
  RECIPE_VIEW: 'recipe_view',
  RECIPE_CREATE: 'recipe_create',
  RECIPE_SAVE: 'recipe_save',
  RECIPE_GENERATE_AI: 'recipe_generate_ai',
  
  // Meal planning events
  MEAL_PLAN_CREATE: 'meal_plan_create',
  MEAL_ADD_TO_PLAN: 'meal_add_to_plan',
  MEAL_COMPLETE: 'meal_complete',
  
  // Shopping events
  SHOPPING_LIST_CREATE: 'shopping_list_create',
  SHOPPING_ITEM_CHECK: 'shopping_item_check',
  SHOPPING_RECEIPT_SCAN: 'shopping_receipt_scan',
  
  // Voice events
  VOICE_COMMAND_START: 'voice_command_start',
  VOICE_COMMAND_COMPLETE: 'voice_command_complete',
  VOICE_COMMAND_ERROR: 'voice_command_error',
} as const;

// Feature names for tracking
export const FEATURES = {
  PANTRY: 'pantry',
  RECIPES: 'recipes',
  MEAL_PLANNER: 'meal_planner',
  SHOPPING_LIST: 'shopping_list',
  VOICE_ASSISTANT: 'voice_assistant',
  SCANNER: 'scanner',
  PRICE_TRACKER: 'price_tracker',
  GAMIFICATION: 'gamification',
} as const;