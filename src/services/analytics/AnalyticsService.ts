/**
 * Analytics Service
 * Unified analytics system with multi-provider support
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/services/logger';

import { PostHogProvider } from './providers/PostHogProvider';
import type {
  AnalyticsEvent,
  AnalyticsServiceConfig,
  AnalyticsProvider,
  PerformanceMetrics,
  ErrorData,
  VoiceAnalyticsData,
  FeatureUsageData,
  UserSession,
  DeviceInfo,
  AnalyticsEventType,
  CommonEventName,
  AnalyticsMethods,
} from './types';

// Default configuration
const DEFAULT_CONFIG: AnalyticsServiceConfig = {
  enabled: true,
  debug: false,
  batchSize: 50,
  flushInterval: 30000,
  sessionTimeout: 30 * 60 * 1000,
  providers: [],
  privacy: {
    anonymizeIP: true,
    respectDoNotTrack: true,
    requireConsent: true,
    consentGiven: false,
    excludedEvents: [],
    excludedProperties: ['password', 'creditCard', 'ssn'],
  },
  performance: {
    trackWebVitals: true,
    trackResourceTiming: false,
    trackLongTasks: false,
    sampleRate: 1.0,
  },
  errorTracking: {
    enabled: true,
    captureConsoleErrors: false,
    captureUnhandledRejections: true,
    captureResourceErrors: false,
    sanitizeErrorMessages: true,
  },
  voiceAnalytics: {
    enabled: true,
    trackCommands: true,
    trackLanguage: true,
    trackAccuracy: true,
    trackDuration: true,
  },
};

export class AnalyticsService implements AnalyticsMethods {
  private config: AnalyticsServiceConfig;
  private providers: Map<AnalyticsProvider, any>;
  private userId: string | null = null;
  private sessionId: string;
  private session: UserSession | null = null;
  private deviceInfo: DeviceInfo;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private isInitialized = false;

  constructor(config: Partial<AnalyticsServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.providers = new Map();
    this.sessionId = this.generateSessionId();
    this.deviceInfo = this.detectDeviceInfo();
  }

  /**
   * Initialize analytics service
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check privacy settings
      if (!this.shouldTrack()) {

        return;
      }

      // Set user ID
      if (userId) {
        this.userId = userId;
      }

      // Initialize providers
      await this.initializeProviders();

      // Start session
      this.startSession();

      // Setup tracking
      this.setupEventListeners();
      this.setupPerformanceTracking();
      this.setupErrorTracking();

      // Start flush timer
      this.startFlushTimer();

      this.isInitialized = true;

      // Track initialization
      this.track('analytics_initialized', {
        providers: this.config.providers.map(p => p.provider),
        session_id: this.sessionId,
      });
    } catch (error: unknown) {
      logger.error('Failed to initialize analytics:', 'AnalyticsService', error);
      throw error;
    }
  }

  /**
   * Track an event
   */
  track(event: CommonEventName | string, properties: Record<string, any> = {}): void {
    if (!this.shouldTrack() || this.isExcludedEvent(event)) return;

    try {
      const analyticsEvent: AnalyticsEvent = {
        id: uuidv4(),
        user_id: this.userId || 'anonymous',
        session_id: this.sessionId,
        event_type: this.getEventType(event),
        event_name: event,
        properties: this.sanitizeProperties({
          ...properties,
          timestamp: new Date().toISOString(),
        }),
        timestamp: new Date().toISOString(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        device_info: this.deviceInfo,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      };

      // Add to queue
      this.eventQueue.push(analyticsEvent);

      // Send to providers immediately if debug mode
      if (this.config.debug) {

        this.sendToProviders([analyticsEvent]);
      }

      // Check if should flush
      if (this.eventQueue.length >= this.config.batchSize) {
        this.flush();
      }
    } catch (error: unknown) {
      logger.error('Failed to track event:', 'AnalyticsService', error);
    }
  }

  /**
   * Track page view
   */
  page(name?: string, properties: Record<string, any> = {}): void {
    const pageName = name || typeof document !== 'undefined' ? document.title : 'Unknown';
    
    this.track('page_view', {
      page_name: pageName,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
      ...properties,
    });

    // Update session
    if (this.session) {
      this.session.page_views++;
    }
  }

  /**
   * Identify user
   */
  identify(userId: string, traits: Record<string, any> = {}): void {
    this.userId = userId;

    // Update session
    if (this.session) {
      this.session.user_id = userId;
    }

    // Send to providers
    this.providers.forEach(provider => {
      if (provider.identify) {
        provider.identify(userId, this.sanitizeProperties(traits));
      }
    });

    // Track identify event
    this.track('user_identified', {
      user_id: userId,
      traits,
    });
  }

  /**
   * Group user
   */
  group(groupId: string, traits: Record<string, any> = {}): void {
    // Send to providers
    this.providers.forEach(provider => {
      if (provider.group) {
        provider.group('company', groupId, this.sanitizeProperties(traits));
      }
    });

    // Track group event
    this.track('user_grouped', {
      group_id: groupId,
      traits,
    });
  }

  /**
   * Alias user
   */
  alias(userId: string, previousId?: string): void {
    const oldId = previousId || this.userId || 'anonymous';

    // Send to providers
    this.providers.forEach(provider => {
      if (provider.alias) {
        provider.alias(userId, oldId);
      }
    });

    // Update user ID
    this.userId = userId;

    // Track alias event
    this.track('user_aliased', {
      user_id: userId,
      previous_id: oldId,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: PerformanceMetrics): void {
    if (!this.config.performance.trackWebVitals) return;

    // Apply sampling
    if (Math.random() > this.config.performance.sampleRate) return;

    this.track('performance_metric', {
      ...metrics,
      custom_metrics: metrics.customMetrics,
    });

    // Send to providers
    this.providers.forEach(provider => {
      if (provider.trackPerformance) {
        provider.trackPerformance(metrics);
      }
    });
  }

  /**
   * Start a timer
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.track('timing_measure', {
        timing_name: name,
        duration_ms: duration,
      });
    };
  }

  /**
   * Track error
   */
  trackError(error: Error | ErrorData, metadata: Record<string, any> = {}): void {
    if (!this.config.errorTracking.enabled) return;

    try {
      const errorData: ErrorData = error instanceof Error ? {
        message: this.config.errorTracking.sanitizeErrorMessages 
          ? this.sanitizeErrorMessage(error.message)
          : error.message,
        stack: error.stack,
        type: 'error',
        timestamp: new Date().toISOString(),
      } : error;

      this.track('error_encounter', {
        error_message: errorData.message,
        error_type: errorData.type,
        error_stack: errorData.stack,
        error_url: errorData.url,
        error_line: errorData.line,
        error_column: errorData.column,
        ...metadata,
      });

      // Send to providers
      this.providers.forEach(provider => {
        if (provider.trackError) {
          provider.trackError(errorData, metadata);
        }
      });
    } catch (err: unknown) {
      logger.error('Failed to track error:', 'AnalyticsService', err);
    }
  }

  /**
   * Track voice command
   */
  trackVoiceCommand(data: VoiceAnalyticsData): void {
    if (!this.config.voiceAnalytics.enabled) return;

    const trackData: Record<string, any> = {};

    if (this.config.voiceAnalytics.trackCommands) {
      trackData.command = data.command;
    }
    if (this.config.voiceAnalytics.trackLanguage) {
      trackData.language = data.language;
    }
    if (this.config.voiceAnalytics.trackAccuracy) {
      trackData.confidence = data.confidence;
    }
    if (this.config.voiceAnalytics.trackDuration) {
      trackData.duration = data.duration;
    }

    trackData.success = data.success;
    if (data.errorReason) {
      trackData.error_reason = data.errorReason;
    }

    this.track(data.success ? 'voice_command_complete' : 'voice_command_error', trackData);

    // Send to providers
    this.providers.forEach(provider => {
      if (provider.trackVoiceCommand) {
        provider.trackVoiceCommand(data);
      }
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(data: FeatureUsageData): void {
    this.track('feature_used', {
      feature: data.feature,
      action: data.action,
      value: data.value,
      duration: data.duration,
      ...data.metadata,
    });

    // Send to providers
    this.providers.forEach(provider => {
      if (provider.trackFeatureUsage) {
        provider.trackFeatureUsage(data);
      }
    });
  }

  /**
   * Start a new session
   */
  startSession(): void {
    const now = new Date().toISOString();
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    this.session = {
      id: this.sessionId,
      user_id: this.userId || 'anonymous',
      started_at: now,
      page_views: 0,
      events_count: 0,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_content: urlParams.get('utm_content') || undefined,
      utm_term: urlParams.get('utm_term') || undefined,
    };

    this.track('session_start', {
      referrer: this.session.referrer,
      utm_source: this.session.utm_source,
      utm_medium: this.session.utm_medium,
      utm_campaign: this.session.utm_campaign,
    });
  }

  /**
   * End current session
   */
  endSession(): void {
    if (!this.session) return;

    const now = new Date().toISOString();
    const duration = Math.round(
      (new Date(now).getTime() - new Date(this.session.started_at).getTime()) / 1000
    );

    this.session.ended_at = now;
    this.session.duration_seconds = duration;

    this.track('session_end', {
      session_duration: duration,
      page_views: this.session.page_views,
      events_count: this.session.events_count,
    });

    // Flush remaining events
    this.flush();

    this.session = null;
  }

  /**
   * Set consent
   */
  setConsent(consent: boolean): void {
    this.config.privacy.consentGiven = consent;

    if (consent) {
      // Re-initialize if needed
      if (!this.isInitialized) {
        this.initialize(this.userId || undefined);
      }
    } else {
      // Opt out of all providers
      this.providers.forEach(provider => {
        if (provider.optOut) {
          provider.optOut();
        }
      });
    }

    // Save consent preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_consent', String(consent));
    }
  }

  /**
   * Get consent status
   */
  getConsent(): boolean {
    return this.config.privacy.consentGiven || false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnalyticsServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): AnalyticsServiceConfig {
    return { ...this.config };
  }

  /**
   * Flush event queue
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendToProviders(events);
    } catch (error: unknown) {
      logger.error('Failed to flush events:', 'AnalyticsService', error);
      // Put events back in queue
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Send events to providers
   */
  private async sendToProviders(events: AnalyticsEvent[]): Promise<void> {
    // Send to each provider
    this.providers.forEach(provider => {
      events.forEach(event => {
        if (provider.track) {
          provider.track(event);
        }
      });
    });

    // Also send to custom endpoint if configured
    if (events.length > 0) {
      try {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        });
      } catch (error: unknown) {
        logger.warn('Failed to send events to custom endpoint:', 'AnalyticsService', error);
      }
    }
  }

  /**
   * Initialize providers
   */
  private async initializeProviders(): Promise<void> {
    for (const config of this.config.providers) {
      try {
        let provider;

        switch (config.provider) {
          case 'posthog':
            provider = new PostHogProvider(config);
            await provider.initialize();
            break;
          // Add other providers here
          default:
            logger.warn(`Unknown provider: ${config.provider}`, 'AnalyticsService');
            continue;
        }

        this.providers.set(config.provider, provider);
      } catch (error: unknown) {
        logger.error(`Failed to initialize ${config.provider}:`, 'AnalyticsService', error);
      }
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Session timeout
    let timeoutId: NodeJS.Timeout;
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.endSession();
        this.sessionId = this.generateSessionId();
        this.startSession();
      }, this.config.sessionTimeout);
    };

    // Reset on user activity
    ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimeout, { passive: true });
    });

    resetTimeout();
  }

  /**
   * Setup performance tracking
   */
  private setupPerformanceTracking(): void {
    if (!this.config.performance.trackWebVitals || typeof window === 'undefined') return;

    try {
      // Track Web Vitals
      if ('PerformanceObserver' in window) {
        // LCP
        new PerformanceObserver((entries) => {
          const lastEntry = entries.getEntries().at(-1);
          if (lastEntry) {
            this.trackPerformance({ lcp: lastEntry.startTime });
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // FID
        new PerformanceObserver((entries) => {
          const firstEntry = entries.getEntries()[0];
          if (firstEntry) {
            this.trackPerformance({ 
              fid: firstEntry.processingStart - firstEntry.startTime 
            });
          }
        }).observe({ entryTypes: ['first-input'] });

        // CLS
        let clsValue = 0;
        const clsEntries: PerformanceEntry[] = [];
        new PerformanceObserver((entries) => {
          for (const entry of entries.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsEntries.push(entry);
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });

        // Report CLS when page is hidden
        document.addEventListener('visibilitychange', () => {
          if (document.hidden && clsEntries.length > 0) {
            this.trackPerformance({ cls: clsValue });
          }
        });
      }
    } catch (error: unknown) {
      logger.warn('Failed to setup performance tracking:', 'AnalyticsService', error);
    }
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    if (!this.config.errorTracking.enabled || typeof window === 'undefined') return;

    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        type: 'error',
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: new Date().toISOString(),
      });
    });

    // Unhandled promise rejections
    if (this.config.errorTracking.captureUnhandledRejections) {
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
          type: 'unhandledRejection',
          timestamp: new Date().toISOString(),
        });
      });
    }

    // Console errors
    if (this.config.errorTracking.captureConsoleErrors) {
      const originalError = console.error;
      console.error = (...args) => {
        this.trackError({
          message: args.map(arg => String(arg)).join(' '),
          type: 'console',
          timestamp: new Date().toISOString(),
        });
        originalError.apply(console, args);
      };
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Should track based on privacy settings
   */
  private shouldTrack(): boolean {
    if (!this.config.enabled) return false;

    // Check consent
    if (this.config.privacy.requireConsent && !this.config.privacy.consentGiven) {
      // Check stored consent
      if (typeof window !== 'undefined') {
        const storedConsent = localStorage.getItem('analytics_consent');
        if (storedConsent === 'true') {
          this.config.privacy.consentGiven = true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    // Check Do Not Track
    if (this.config.privacy.respectDoNotTrack && typeof navigator !== 'undefined') {
      if (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1') {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if event is excluded
   */
  private isExcludedEvent(event: string): boolean {
    return this.config.privacy.excludedEvents.includes(event);
  }

  /**
   * Sanitize properties
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      if (!this.config.privacy.excludedProperties.includes(key)) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize error message
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potentially sensitive data from error messages
    return message
      .replace(/\/users\/[^\/]+/gi, '/users/[REDACTED]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      .replace(/\b\d{4,}\b/g, '[NUMBER]');
  }

  /**
   * Get event type
   */
  private getEventType(eventName: string): AnalyticsEventType {
    const typeMap: Record<string, AnalyticsEventType> = {
      page_view: 'page_view',
      user_signup: 'conversion',
      user_login: 'user_action',
      recipe_view: 'engagement',
      error_encounter: 'error',
      performance_metric: 'performance',
      experiment_exposure: 'experiment',
    };

    return typeMap[eventName] || 'custom';
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect device info
   */
  private detectDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        os: 'unknown',
        browser: 'unknown',
        screen_resolution: 'unknown',
        viewport_size: 'unknown',
      };
    }

    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
    const isTablet = /tablet|ipad/i.test(ua);

    return {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      os: this.detectOS(ua),
      browser: this.detectBrowser(ua),
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  /**
   * Detect OS
   */
  private detectOS(ua: string): string {
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Detect browser
   */
  private detectBrowser(ua: string): string {
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Destroy service
   */
  destroy(): void {
    // End session
    this.endSession();

    // Clear timers
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Shutdown providers
    this.providers.forEach(provider => {
      if (provider.shutdown) {
        provider.shutdown();
      }
    });

    // Clear state
    this.providers.clear();
    this.eventQueue = [];
    this.isInitialized = false;
  }
}

// Singleton instance
let analyticsInstance: AnalyticsService | null = null;

/**
 * Get analytics service instance
 */
export function getAnalyticsService(config?: Partial<AnalyticsServiceConfig>): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService(config);
  }
  return analyticsInstance;
}