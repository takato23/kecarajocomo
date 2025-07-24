/**
 * Analytics Service Types
 * Unified analytics system types for tracking and insights
 */

// Event types
export type AnalyticsEventType = 
  | 'page_view'
  | 'user_action'
  | 'conversion'
  | 'engagement'
  | 'error'
  | 'performance'
  | 'experiment'
  | 'custom';

// Common event names
export type CommonEventName = 
  // User events
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  | 'user_profile_update'
  | 'user_delete_account'
  
  // Navigation events
  | 'page_view'
  | 'route_change'
  | 'tab_switch'
  | 'modal_open'
  | 'modal_close'
  
  // Pantry events
  | 'pantry_item_add'
  | 'pantry_item_update'
  | 'pantry_item_delete'
  | 'pantry_item_consume'
  | 'pantry_expiration_alert'
  | 'pantry_barcode_scan'
  | 'pantry_photo_capture'
  
  // Recipe events
  | 'recipe_view'
  | 'recipe_create'
  | 'recipe_update'
  | 'recipe_delete'
  | 'recipe_save'
  | 'recipe_unsave'
  | 'recipe_generate_ai'
  | 'recipe_share'
  | 'recipe_cook'
  
  // Meal planning events
  | 'meal_plan_create'
  | 'meal_plan_update'
  | 'meal_plan_delete'
  | 'meal_add_to_plan'
  | 'meal_remove_from_plan'
  | 'meal_complete'
  
  // Shopping events
  | 'shopping_list_create'
  | 'shopping_list_update'
  | 'shopping_item_add'
  | 'shopping_item_check'
  | 'shopping_item_uncheck'
  | 'shopping_receipt_scan'
  | 'shopping_price_check'
  
  // Voice events
  | 'voice_command_start'
  | 'voice_command_complete'
  | 'voice_command_error'
  | 'voice_feedback_play'
  | 'voice_language_change'
  
  // Error events
  | 'error_encounter'
  | 'error_boundary_trigger'
  | 'api_error'
  | 'network_error'
  
  // Performance events
  | 'performance_metric'
  | 'page_load_time'
  | 'api_response_time'
  | 'image_load_time'
  
  // Engagement events
  | 'session_start'
  | 'session_end'
  | 'feature_discovery'
  | 'tutorial_complete'
  | 'achievement_unlock'
  
  // Conversion events
  | 'conversion_complete'
  | 'goal_achieve'
  | 'milestone_reach'
  
  // Experiment events
  | 'experiment_exposure'
  | 'experiment_conversion';

// Analytics event interface
export interface AnalyticsEvent {
  id: string;
  user_id: string;
  session_id: string;
  event_type: AnalyticsEventType;
  event_name: CommonEventName | string;
  properties: Record<string, any>;
  timestamp: string;
  page_url?: string;
  referrer?: string;
  device_info?: DeviceInfo;
  user_agent?: string;
}

// User session interface
export interface UserSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  page_views: number;
  events_count: number;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

// Device information
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screen_resolution: string;
  viewport_size: string;
}

// Analytics providers
export type AnalyticsProvider = 
  | 'posthog'
  | 'segment'
  | 'google_analytics'
  | 'mixpanel'
  | 'custom';

// Provider configuration
export interface ProviderConfig {
  provider: AnalyticsProvider;
  apiKey?: string;
  apiHost?: string;
  options?: Record<string, any>;
}

// Analytics service configuration
export interface AnalyticsServiceConfig {
  // General settings
  enabled: boolean;
  debug: boolean;
  batchSize: number;
  flushInterval: number;
  sessionTimeout: number;
  
  // Providers
  providers: ProviderConfig[];
  
  // Privacy settings
  privacy: {
    anonymizeIP: boolean;
    respectDoNotTrack: boolean;
    requireConsent: boolean;
    consentGiven?: boolean;
    excludedEvents: string[];
    excludedProperties: string[];
  };
  
  // Performance settings
  performance: {
    trackWebVitals: boolean;
    trackResourceTiming: boolean;
    trackLongTasks: boolean;
    sampleRate: number; // 0-1
  };
  
  // Error tracking
  errorTracking: {
    enabled: boolean;
    captureConsoleErrors: boolean;
    captureUnhandledRejections: boolean;
    captureResourceErrors: boolean;
    sanitizeErrorMessages: boolean;
  };
  
  // Voice analytics
  voiceAnalytics: {
    enabled: boolean;
    trackCommands: boolean;
    trackLanguage: boolean;
    trackAccuracy: boolean;
    trackDuration: boolean;
  };
}

// Performance metrics
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  customMetrics?: Record<string, number>;
}

// Error tracking data
export interface ErrorData {
  message: string;
  stack?: string;
  type: 'error' | 'unhandledRejection' | 'console' | 'resource';
  url?: string;
  line?: number;
  column?: number;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Voice analytics data
export interface VoiceAnalyticsData {
  command: string;
  language: string;
  confidence: number;
  duration: number;
  success: boolean;
  errorReason?: string;
  alternatives?: string[];
  metadata?: Record<string, any>;
}

// Feature usage data
export interface FeatureUsageData {
  feature: string;
  action: string;
  value?: any;
  duration?: number;
  metadata?: Record<string, any>;
}

// Analytics context
export interface AnalyticsContext {
  user?: {
    id: string;
    email?: string;
    name?: string;
    traits?: Record<string, any>;
  };
  page?: {
    title: string;
    url: string;
    referrer?: string;
    search?: string;
  };
  campaign?: {
    source?: string;
    medium?: string;
    name?: string;
    content?: string;
    term?: string;
  };
  device?: DeviceInfo;
  session?: UserSession;
}

// Analytics methods interface
export interface AnalyticsMethods {
  // Core tracking
  track(event: string, properties?: Record<string, any>): void;
  page(name?: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
  group(groupId: string, traits?: Record<string, any>): void;
  alias(userId: string, previousId?: string): void;
  
  // Performance tracking
  trackPerformance(metrics: PerformanceMetrics): void;
  startTimer(name: string): () => void;
  
  // Error tracking
  trackError(error: Error | ErrorData, metadata?: Record<string, any>): void;
  
  // Voice analytics
  trackVoiceCommand(data: VoiceAnalyticsData): void;
  
  // Feature usage
  trackFeatureUsage(data: FeatureUsageData): void;
  
  // Session management
  startSession(): void;
  endSession(): void;
  
  // Consent management
  setConsent(consent: boolean): void;
  getConsent(): boolean;
  
  // Configuration
  updateConfig(config: Partial<AnalyticsServiceConfig>): void;
  getConfig(): AnalyticsServiceConfig;
}

// React hook return type
export interface UseAnalyticsReturn extends AnalyticsMethods {
  // State
  isEnabled: boolean;
  hasConsent: boolean;
  sessionId: string | null;
  userId: string | null;
  
  // Privacy controls
  optIn: () => void;
  optOut: () => void;
  
  // Debug
  debug: (enabled: boolean) => void;
}

// Analytics dashboard data
export interface AnalyticsDashboardData {
  // Overview metrics
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalEvents: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  
  // Feature usage
  featureUsage: Array<{
    feature: string;
    usage: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  }>;
  
  // User engagement
  engagement: {
    dailyActiveUsers: number[];
    weeklyActiveUsers: number[];
    monthlyActiveUsers: number[];
    retentionRate: number;
    churnRate: number;
  };
  
  // Performance metrics
  performance: {
    avgPageLoadTime: number;
    avgApiResponseTime: number;
    errorRate: number;
    crashRate: number;
  };
  
  // Voice usage
  voiceUsage: {
    totalCommands: number;
    successRate: number;
    avgConfidence: number;
    topCommands: Array<{
      command: string;
      count: number;
    }>;
  };
}

// Export tracking
export interface ExportOptions {
  format: 'json' | 'csv' | 'excel';
  dateRange: {
    start: Date;
    end: Date;
  };
  events?: string[];
  users?: string[];
  includeMetadata?: boolean;
}