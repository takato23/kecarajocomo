/**
 * PostHog Analytics Provider
 * Integration with PostHog for product analytics
 */

import posthog from 'posthog-js';

import type { 
  AnalyticsEvent, 
  ProviderConfig, 
  PerformanceMetrics,
  ErrorData,
  VoiceAnalyticsData,
  FeatureUsageData 
} from '../types';

export class PostHogProvider {
  private initialized = false;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Initialize PostHog
   */
  async initialize(): Promise<void> {
    if (this.initialized || !this.config.apiKey) return;

    try {
      posthog.init(this.config.apiKey, {
        api_host: this.config.apiHost || 'https://app.posthog.com',
        loaded: (posthog) => {

        },
        autocapture: false, // We'll track manually
        capture_pageview: false, // We'll track manually
        capture_pageleave: true,
        cross_subdomain_cookie: true,
        persistence: 'localStorage+cookie',
        ...this.config.options,
      });

      this.initialized = true;
    } catch (error: unknown) {
      console.error('Failed to initialize PostHog:', error);
      throw error;
    }
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent): void {
    if (!this.initialized) return;

    try {
      posthog.capture(event.event_name, {
        ...event.properties,
        $user_id: event.user_id,
        $session_id: event.session_id,
        event_type: event.event_type,
        timestamp: event.timestamp,
        page_url: event.page_url,
        referrer: event.referrer,
        device_info: event.device_info,
      });
    } catch (error: unknown) {
      console.error('PostHog track error:', error);
    }
  }

  /**
   * Track page view
   */
  page(name: string, properties: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.capture('$pageview', {
        $current_url: properties.url || window.location.href,
        $host: window.location.host,
        $pathname: window.location.pathname,
        $referrer: document.referrer,
        page_name: name,
        ...properties,
      });
    } catch (error: unknown) {
      console.error('PostHog page error:', error);
    }
  }

  /**
   * Identify user
   */
  identify(userId: string, traits: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.identify(userId, traits);
    } catch (error: unknown) {
      console.error('PostHog identify error:', error);
    }
  }

  /**
   * Group user
   */
  group(groupType: string, groupId: string, traits?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.group(groupType, groupId, traits);
    } catch (error: unknown) {
      console.error('PostHog group error:', error);
    }
  }

  /**
   * Alias user
   */
  alias(userId: string, previousId?: string): void {
    if (!this.initialized) return;

    try {
      posthog.alias(userId, previousId);
    } catch (error: unknown) {
      console.error('PostHog alias error:', error);
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: PerformanceMetrics): void {
    if (!this.initialized) return;

    try {
      posthog.capture('performance_metrics', {
        ...metrics,
        customMetrics: metrics.customMetrics,
      });
    } catch (error: unknown) {
      console.error('PostHog performance tracking error:', error);
    }
  }

  /**
   * Track error
   */
  trackError(error: ErrorData, metadata?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.capture('error_occurred', {
        error_message: error.message,
        error_type: error.type,
        error_stack: error.stack,
        error_url: error.url,
        error_line: error.line,
        error_column: error.column,
        ...metadata,
      });
    } catch (err: unknown) {
      console.error('PostHog error tracking error:', err);
    }
  }

  /**
   * Track voice command
   */
  trackVoiceCommand(data: VoiceAnalyticsData): void {
    if (!this.initialized) return;

    try {
      posthog.capture('voice_command', {
        command: data.command,
        language: data.language,
        confidence: data.confidence,
        duration: data.duration,
        success: data.success,
        error_reason: data.errorReason,
        alternatives: data.alternatives,
        ...data.metadata,
      });
    } catch (error: unknown) {
      console.error('PostHog voice tracking error:', error);
    }
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(data: FeatureUsageData): void {
    if (!this.initialized) return;

    try {
      posthog.capture('feature_used', {
        feature: data.feature,
        action: data.action,
        value: data.value,
        duration: data.duration,
        ...data.metadata,
      });
    } catch (error: unknown) {
      console.error('PostHog feature tracking error:', error);
    }
  }

  /**
   * Set super properties
   */
  setSuperProperties(properties: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.register(properties);
    } catch (error: unknown) {
      console.error('PostHog setSuperProperties error:', error);
    }
  }

  /**
   * Reset user
   */
  reset(): void {
    if (!this.initialized) return;

    try {
      posthog.reset();
    } catch (error: unknown) {
      console.error('PostHog reset error:', error);
    }
  }

  /**
   * Opt out of tracking
   */
  optOut(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_out_capturing();
    } catch (error: unknown) {
      console.error('PostHog opt out error:', error);
    }
  }

  /**
   * Opt in to tracking
   */
  optIn(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_in_capturing();
    } catch (error: unknown) {
      console.error('PostHog opt in error:', error);
    }
  }

  /**
   * Check if opted out
   */
  hasOptedOut(): boolean {
    if (!this.initialized) return false;

    try {
      return posthog.has_opted_out_capturing();
    } catch (error: unknown) {
      console.error('PostHog hasOptedOut error:', error);
      return false;
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    if (!this.initialized) return null;

    try {
      return posthog.get_session_id();
    } catch (error: unknown) {
      console.error('PostHog getSessionId error:', error);
      return null;
    }
  }

  /**
   * Enable session recording
   */
  startSessionRecording(): void {
    if (!this.initialized) return;

    try {
      posthog.startSessionRecording();
    } catch (error: unknown) {
      console.error('PostHog session recording error:', error);
    }
  }

  /**
   * Disable session recording
   */
  stopSessionRecording(): void {
    if (!this.initialized) return;

    try {
      posthog.stopSessionRecording();
    } catch (error: unknown) {
      console.error('PostHog stop session recording error:', error);
    }
  }

  /**
   * Check if session recording is enabled
   */
  isSessionRecordingEnabled(): boolean {
    if (!this.initialized) return false;

    try {
      return posthog.isSessionRecordingEnabled();
    } catch (error: unknown) {
      console.error('PostHog session recording check error:', error);
      return false;
    }
  }

  /**
   * Set feature flags
   */
  setFeatureFlags(flags: Record<string, boolean | string>): void {
    if (!this.initialized) return;

    try {
      Object.entries(flags).forEach(([key, value]) => {
        posthog.feature_flags.override({ [key]: value });
      });
    } catch (error: unknown) {
      console.error('PostHog feature flags error:', error);
    }
  }

  /**
   * Get feature flag value
   */
  getFeatureFlag(key: string): boolean | string | undefined {
    if (!this.initialized) return undefined;

    try {
      return posthog.getFeatureFlag(key);
    } catch (error: unknown) {
      console.error('PostHog get feature flag error:', error);
      return undefined;
    }
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(key: string): boolean {
    if (!this.initialized) return false;

    try {
      return posthog.isFeatureEnabled(key);
    } catch (error: unknown) {
      console.error('PostHog feature check error:', error);
      return false;
    }
  }

  /**
   * Flush events
   */
  flush(): void {
    if (!this.initialized) return;

    try {
      // PostHog automatically batches and sends events
      // This is a no-op for compatibility
    } catch (error: unknown) {
      console.error('PostHog flush error:', error);
    }
  }

  /**
   * Shutdown provider
   */
  shutdown(): void {
    if (!this.initialized) return;

    try {
      // PostHog doesn't have a shutdown method
      // Events are automatically flushed on page unload
      this.initialized = false;
    } catch (error: unknown) {
      console.error('PostHog shutdown error:', error);
    }
  }
}