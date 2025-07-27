import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/services/logger';

import { 
  AnalyticsEvent, 
  UserSession, 
  DeviceInfo, 
  AnalyticsEventType, 
  CommonEventName 
} from '../types';

interface AnalyticsConfig {
  apiEndpoint: string;
  batchSize: number;
  flushInterval: number;
  enableDebug: boolean;
  enableLocalStorage: boolean;
  sessionTimeout: number;
  maxRetries: number;
}

interface TrackEventOptions {
  properties?: Record<string, any>;
  timestamp?: string;
  sessionId?: string;
  immediate?: boolean;
}

interface UserIdentity {
  userId: string;
  traits?: Record<string, any>;
}

class AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private currentSession: UserSession | null = null;
  private flushTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private sessionId: string;
  private deviceInfo: DeviceInfo;
  private isInitialized = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      apiEndpoint: '/api/analytics/events',
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      enableDebug: false,
      enableLocalStorage: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxRetries: 3,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.deviceInfo = this.detectDeviceInfo();
  }

  /**
   * Initialize analytics service
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set user ID if provided
      if (userId) {
        this.userId = userId;
      }

      // Restore session from localStorage if available
      if (this.config.enableLocalStorage && typeof window !== 'undefined') {
        this.restoreSession();
      }

      // Start new session if none exists
      if (!this.currentSession) {
        this.startNewSession();
      }

      // Setup periodic flush
      this.setupPeriodicFlush();

      // Setup session timeout
      this.setupSessionTimeout();

      // Setup page unload handler
      this.setupUnloadHandler();

      this.isInitialized = true;

      // Track initialization
      this.track('analytics_initialized', {
        session_id: this.sessionId,
        device_info: this.deviceInfo
      });

      if (this.config.enableDebug) {

      }
    } catch (error: unknown) {
      logger.error('Failed to initialize analytics service:', 'analyticsService', error);
      throw error;
    }
  }

  /**
   * Identify user
   */
  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    
    // Update current session
    if (this.currentSession) {
      this.currentSession.user_id = userId;
      this.saveSession();
    }

    // Track identify event
    this.track('user_identified', {
      user_id: userId,
      traits: traits || {}
    });

    if (this.config.enableDebug) {

    }
  }

  /**
   * Track analytics event
   */
  track(
    eventName: CommonEventName | string,
    options: TrackEventOptions = {}
  ): void {
    try {
      const {
        properties = {},
        timestamp = new Date().toISOString(),
        sessionId = this.sessionId,
        immediate = false
      } = options;

      const event: AnalyticsEvent = {
        id: uuidv4(),
        user_id: this.userId || 'anonymous',
        session_id: sessionId,
        event_type: this.getEventType(eventName),
        event_name: eventName,
        properties: {
          ...properties,
          url: typeof window !== 'undefined' ? window.location.href : '',
          referrer: typeof window !== 'undefined' ? document.referrer : '',
          timestamp: timestamp
        },
        timestamp,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        device_info: this.deviceInfo,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined
      };

      // Add to queue
      this.eventQueue.push(event);

      // Update session
      this.updateSession();

      // Flush immediately if requested or queue is full
      if (immediate || this.eventQueue.length >= this.config.batchSize) {
        this.flush();
      }

      if (this.config.enableDebug) {

      }
    } catch (error: unknown) {
      logger.error('Failed to track event:', 'analyticsService', error);
    }
  }

  /**
   * Track page view
   */
  page(pageName?: string, properties?: Record<string, any>): void {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = typeof window !== 'undefined' ? document.title : '';
    
    this.track('page_view', {
      properties: {
        page_name: pageName || title,
        page_url: url,
        page_title: title,
        ...properties
      }
    });
  }

  /**
   * Track user action
   */
  action(actionName: string, properties?: Record<string, any>): void {
    this.track(actionName, {
      properties: {
        action_type: 'user_action',
        ...properties
      }
    });
  }

  /**
   * Track conversion event
   */
  conversion(conversionName: string, value?: number, properties?: Record<string, any>): void {
    this.track('conversion_complete', {
      properties: {
        conversion_name: conversionName,
        conversion_value: value,
        ...properties
      }
    });
  }

  /**
   * Track error event
   */
  error(errorMessage: string, errorDetails?: Record<string, any>): void {
    this.track('error_encounter', {
      properties: {
        error_message: errorMessage,
        error_details: errorDetails || {},
        stack_trace: errorDetails?.stack || ''
      },
      immediate: true
    });
  }

  /**
   * Track timing event
   */
  timing(timingName: string, duration: number, properties?: Record<string, any>): void {
    this.track('timing_measure', {
      properties: {
        timing_name: timingName,
        duration_ms: duration,
        ...properties
      }
    });
  }

  /**
   * Flush events to server
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (this.config.enableDebug) {

      }
    } catch (error: unknown) {
      logger.error('Failed to flush events:', 'analyticsService', error);
      
      // Put events back in queue for retry
      this.eventQueue.unshift(...events);
      
      // Limit queue size to prevent memory issues
      if (this.eventQueue.length > this.config.batchSize * 3) {
        this.eventQueue = this.eventQueue.slice(-this.config.batchSize * 2);
      }
    }
  }

  /**
   * Get current session
   */
  getSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * End current session
   */
  endSession(): void {
    if (!this.currentSession) return;

    const now = new Date().toISOString();
    const startTime = new Date(this.currentSession.started_at).getTime();
    const endTime = new Date(now).getTime();

    this.currentSession.ended_at = now;
    this.currentSession.duration_seconds = Math.round((endTime - startTime) / 1000);

    // Track session end
    this.track('session_end', {
      properties: {
        session_duration: this.currentSession.duration_seconds,
        page_views: this.currentSession.page_views,
        events_count: this.currentSession.events_count
      },
      immediate: true
    });

    this.saveSession();
    this.currentSession = null;
  }

  /**
   * Destroy analytics service
   */
  destroy(): void {
    // End current session
    this.endSession();

    // Clear flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining events
    this.flush();

    // Clear state
    this.eventQueue = [];
    this.userId = null;
    this.isInitialized = false;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect device information
   */
  private detectDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        os: 'unknown',
        browser: 'unknown',
        screen_resolution: 'unknown',
        viewport_size: 'unknown'
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);

    return {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      os: this.detectOS(userAgent),
      browser: this.detectBrowser(userAgent),
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`
    };
  }

  /**
   * Detect operating system
   */
  private detectOS(userAgent: string): string {
    if (userAgent.includes('windows')) return 'Windows';
    if (userAgent.includes('mac')) return 'macOS';
    if (userAgent.includes('linux')) return 'Linux';
    if (userAgent.includes('android')) return 'Android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Detect browser
   */
  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    if (userAgent.includes('opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Get event type from event name
   */
  private getEventType(eventName: string): AnalyticsEventType {
    const eventTypeMap: Record<string, AnalyticsEventType> = {
      'page_view': 'page_view',
      'user_signup': 'conversion',
      'user_login': 'user_action',
      'recipe_view': 'engagement',
      'recipe_create': 'user_action',
      'meal_plan_create': 'user_action',
      'conversion_complete': 'conversion',
      'error_encounter': 'error',
      'session_start': 'engagement',
      'session_end': 'engagement',
      'experiment_exposure': 'experiment'
    };

    return eventTypeMap[eventName] || 'custom';
  }

  /**
   * Start new session
   */
  private startNewSession(): void {
    const now = new Date().toISOString();
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    
    this.currentSession = {
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
      utm_term: urlParams.get('utm_term') || undefined
    };

    this.saveSession();

    // Track session start
    this.track('session_start', {
      properties: {
        referrer: this.currentSession.referrer,
        utm_source: this.currentSession.utm_source,
        utm_medium: this.currentSession.utm_medium,
        utm_campaign: this.currentSession.utm_campaign
      }
    });
  }

  /**
   * Update session stats
   */
  private updateSession(): void {
    if (!this.currentSession) return;

    this.currentSession.events_count++;
    this.saveSession();
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return;

    try {
      localStorage.setItem('analytics_session', JSON.stringify(this.currentSession));
    } catch (error: unknown) {
      logger.warn('Failed to save session to localStorage:', 'analyticsService', error);
    }
  }

  /**
   * Restore session from localStorage
   */
  private restoreSession(): void {
    try {
      const savedSession = localStorage.getItem('analytics_session');
      if (!savedSession) return;

      const session = JSON.parse(savedSession) as UserSession;
      const now = Date.now();
      const sessionStart = new Date(session.started_at).getTime();
      
      // Check if session is still valid (not expired)
      if (now - sessionStart < this.config.sessionTimeout) {
        this.currentSession = session;
        this.sessionId = session.id;
        this.userId = session.user_id !== 'anonymous' ? session.user_id : null;
      } else {
        // Session expired, remove from storage
        localStorage.removeItem('analytics_session');
      }
    } catch (error: unknown) {
      logger.warn('Failed to restore session from localStorage:', 'analyticsService', error);
      localStorage.removeItem('analytics_session');
    }
  }

  /**
   * Setup periodic flush
   */
  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Setup session timeout
   */
  private setupSessionTimeout(): void {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.endSession();
        this.startNewSession();
      }, this.config.sessionTimeout);
    };

    // Reset timeout on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, { passive: true });
    });

    // Initial timeout
    resetTimeout();
  }

  /**
   * Setup page unload handler
   */
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') return;

    const handleUnload = () => {
      this.endSession();
      this.flush();
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
  }
}

// Singleton instance
let analyticsInstance: AnalyticsService | null = null;

/**
 * Get analytics service instance
 */
export function getAnalyticsService(config?: Partial<AnalyticsConfig>): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService(config);
  }
  return analyticsInstance;
}

/**
 * Initialize analytics
 */
export async function initializeAnalytics(userId?: string, config?: Partial<AnalyticsConfig>): Promise<AnalyticsService> {
  const service = getAnalyticsService(config);
  await service.initialize(userId);
  return service;
}

/**
 * Track analytics event (convenience function)
 */
export function track(eventName: CommonEventName | string, options?: TrackEventOptions): void {
  const service = getAnalyticsService();
  service.track(eventName, options);
}

/**
 * Track page view (convenience function)
 */
export function trackPage(pageName?: string, properties?: Record<string, any>): void {
  const service = getAnalyticsService();
  service.page(pageName, properties);
}

/**
 * Identify user (convenience function)
 */
export function identify(userId: string, traits?: Record<string, any>): void {
  const service = getAnalyticsService();
  service.identify(userId, traits);
}

export { AnalyticsService };