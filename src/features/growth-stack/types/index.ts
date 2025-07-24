// Core growth stack types for user engagement, analytics, and experimentation

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  session_id: string;
  event_type: string;
  event_name: string;
  properties: Record<string, any>;
  timestamp: string;
  page_url?: string;
  referrer?: string;
  device_info?: DeviceInfo;
  user_agent?: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  screen_resolution: string;
  viewport_size: string;
}

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

export interface UserEngagement {
  user_id: string;
  total_sessions: number;
  total_session_duration: number;
  average_session_duration: number;
  days_active: number;
  last_active_date: string;
  first_visit_date: string;
  page_views: number;
  recipes_viewed: number;
  recipes_created: number;
  meal_plans_created: number;
  engagement_score: number;
  retention_score: number;
  churn_risk: 'low' | 'medium' | 'high';
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  traffic_allocation: number; // 0-100
  config: Record<string, any>;
  is_control: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  target_metric: string;
  variants: ExperimentVariant[];
  traffic_allocation: number;
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExperimentAssignment {
  user_id: string;
  experiment_id: string;
  variant_id: string;
  assigned_at: string;
  sticky: boolean;
}

export interface ExperimentResult {
  experiment_id: string;
  variant_id: string;
  metric_name: string;
  metric_value: number;
  sample_size: number;
  confidence_interval: [number, number];
  p_value: number;
  statistical_significance: boolean;
  calculated_at: string;
}

export interface GrowthMetric {
  name: string;
  value: number;
  change_from_previous: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
}

export interface FunnelStep {
  id: string;
  name: string;
  event_name: string;
  order: number;
  description?: string;
}

export interface FunnelAnalysis {
  id: string;
  name: string;
  description: string;
  steps: FunnelStep[];
  conversion_rates: Record<string, number>;
  drop_off_rates: Record<string, number>;
  total_users: number;
  completed_users: number;
  overall_conversion_rate: number;
  period_start: string;
  period_end: string;
}

export interface CohortAnalysis {
  cohort_period: string;
  cohort_size: number;
  retention_rates: Record<string, number>; // day/week/month -> retention rate
  revenue_per_cohort?: number;
  ltv_estimate?: number;
}

export interface PersonalizationRule {
  id: string;
  name: string;
  description: string;
  conditions: PersonalizationCondition[];
  actions: PersonalizationAction[];
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalizationCondition {
  type: 'user_property' | 'event' | 'session' | 'device' | 'time';
  property: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface PersonalizationAction {
  type: 'content_variant' | 'feature_flag' | 'recommendation' | 'message';
  target: string;
  value: any;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  id: string;
  type: 'email' | 'push' | 'in_app' | 'sms';
  template_id: string;
  trigger_event: string;
  conditions: PersonalizationCondition[];
  scheduling: NotificationScheduling;
  personalization: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationScheduling {
  type: 'immediate' | 'delayed' | 'recurring';
  delay_minutes?: number;
  recurring_pattern?: string;
  timezone?: string;
  send_time?: string;
}

export interface RetentionCampaign {
  id: string;
  name: string;
  description: string;
  target_segment: string;
  trigger_conditions: PersonalizationCondition[];
  actions: RetentionAction[];
  status: 'active' | 'paused' | 'completed';
  success_metrics: string[];
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RetentionAction {
  type: 'notification' | 'discount' | 'content_unlock' | 'feature_highlight' | 'personalized_recommendation';
  config: Record<string, any>;
  delay_hours?: number;
  max_frequency?: number;
}

export interface GrowthInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'trend' | 'experiment_result';
  title: string;
  description: string;
  impact_score: number;
  confidence_score: number;
  recommendations: string[];
  data_points: Record<string, any>;
  created_at: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  key: string;
  type: 'boolean' | 'string' | 'number' | 'json';
  default_value: any;
  variations: FeatureFlagVariation[];
  targeting_rules: TargetingRule[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagVariation {
  id: string;
  name: string;
  value: any;
  description?: string;
  traffic_allocation: number;
}

export interface TargetingRule {
  id: string;
  name: string;
  conditions: PersonalizationCondition[];
  variation_id: string;
  priority: number;
  is_active: boolean;
}

export interface GrowthExperimentConfig {
  feature_flags: Record<string, any>;
  content_variants: Record<string, any>;
  ui_modifications: Record<string, any>;
  personalization_rules: PersonalizationRule[];
  notification_configs: NotificationConfig[];
}

// Analytics event types
export type AnalyticsEventType = 
  | 'page_view'
  | 'user_action'
  | 'feature_interaction'
  | 'conversion'
  | 'error'
  | 'performance'
  | 'engagement'
  | 'retention'
  | 'experiment'
  | 'custom';

// Common event names
export type CommonEventName = 
  | 'page_view'
  | 'user_signup'
  | 'user_login'
  | 'recipe_view'
  | 'recipe_create'
  | 'recipe_favorite'
  | 'meal_plan_create'
  | 'meal_plan_view'
  | 'shopping_list_generate'
  | 'pantry_item_add'
  | 'search_perform'
  | 'filter_apply'
  | 'share_recipe'
  | 'app_install'
  | 'notification_click'
  | 'experiment_exposure'
  | 'conversion_complete'
  | 'churn_risk_high'
  | 'feature_discovery'
  | 'onboarding_complete'
  | 'trial_start'
  | 'subscription_upgrade'
  | 'error_encounter'
  | 'session_start'
  | 'session_end';

// Growth metric types
export type GrowthMetricType = 
  | 'acquisition'
  | 'activation'
  | 'retention'
  | 'referral'
  | 'revenue'
  | 'engagement'
  | 'conversion'
  | 'churn'
  | 'ltv'
  | 'dau'
  | 'mau'
  | 'session_duration'
  | 'page_views'
  | 'feature_adoption';

// Experiment status
export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed';

// Notification types
export type NotificationType = 'email' | 'push' | 'in_app' | 'sms';

// Targeting conditions
export type TargetingOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';

// Growth dashboard time periods
export type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

// User segments
export type UserSegment = 
  | 'new_users'
  | 'returning_users'
  | 'power_users'
  | 'churned_users'
  | 'at_risk_users'
  | 'high_value_users'
  | 'mobile_users'
  | 'desktop_users'
  | 'trial_users'
  | 'premium_users'
  | 'free_users';

// Growth experiment types
export type ExperimentType = 'ab_test' | 'multivariate' | 'feature_flag' | 'personalization';

// Retention campaign types
export type RetentionCampaignType = 'reactivation' | 'onboarding' | 'engagement' | 'conversion' | 'winback';