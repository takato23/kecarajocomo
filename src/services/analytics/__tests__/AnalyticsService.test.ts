/**
 * Tests for AnalyticsService
 */

import { AnalyticsService } from '../AnalyticsService';
import type { AnalyticsServiceConfig } from '../types';

// Mock PostHog
jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    capture: jest.fn(),
    identify: jest.fn(),
    group: jest.fn(),
    alias: jest.fn(),
    register: jest.fn(),
    reset: jest.fn(),
    opt_out_capturing: jest.fn(),
    opt_in_capturing: jest.fn(),
    has_opted_out_capturing: jest.fn().mockReturnValue(false),
    get_session_id: jest.fn().mockReturnValue('test-session-123'),
    startSessionRecording: jest.fn(),
    stopSessionRecording: jest.fn(),
    isSessionRecordingEnabled: jest.fn().mockReturnValue(false),
    feature_flags: {
      override: jest.fn(),
    },
    getFeatureFlag: jest.fn(),
    isFeatureEnabled: jest.fn().mockReturnValue(false),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock browser APIs
const mockPerformanceObserver = jest.fn();
const mockPerformance = {
  now: jest.fn().mockReturnValue(1000),
  getEntriesByType: jest.fn().mockReturnValue([]),
};

beforeAll(() => {
  (global as any).PerformanceObserver = mockPerformanceObserver;
  (global as any).performance = mockPerformance;
  (global as any).navigator = {
    userAgent: 'test-agent',
    doNotTrack: '0',
  };
  (global as any).screen = {
    width: 1920,
    height: 1080,
  };
  (global as any).window = {
    innerWidth: 1024,
    innerHeight: 768,
    location: {
      href: 'https://test.com/page',
      search: '?utm_source=test',
    },
  };
  (global as any).document = {
    title: 'Test Page',
    referrer: 'https://referrer.com',
    addEventListener: jest.fn(),
  };
});

describe('AnalyticsService', () => {
  let analytics: AnalyticsService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      analytics = new AnalyticsService();
      await analytics.initialize();

      expect(analytics.getConfig().enabled).toBe(true);
      expect(analytics.getConfig().debug).toBe(false);
    });

    it('should initialize with custom config', async () => {
      const config: Partial<AnalyticsServiceConfig> = {
        debug: true,
        batchSize: 100,
        providers: [
          {
            provider: 'posthog',
            apiKey: 'test-key',
          },
        ],
      };

      analytics = new AnalyticsService(config);
      await analytics.initialize('user-123');

      const finalConfig = analytics.getConfig();
      expect(finalConfig.debug).toBe(true);
      expect(finalConfig.batchSize).toBe(100);
    });

    it('should respect privacy settings', async () => {
      const config: Partial<AnalyticsServiceConfig> = {
        privacy: {
          anonymizeIP: true,
          respectDoNotTrack: true,
          requireConsent: true,
          consentGiven: false,
          excludedEvents: [],
          excludedProperties: [],
        },
      };

      analytics = new AnalyticsService(config);
      await analytics.initialize();

      // Should not track without consent
      analytics.track('test_event');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should check Do Not Track header', async () => {
      (global as any).navigator.doNotTrack = '1';

      const config: Partial<AnalyticsServiceConfig> = {
        privacy: {
          respectDoNotTrack: true,
          requireConsent: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
      };

      analytics = new AnalyticsService(config);
      await analytics.initialize();

      analytics.track('test_event');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Event Tracking', () => {
    beforeEach(async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
      });
      await analytics.initialize();
    });

    it('should track basic events', () => {
      analytics.track('button_click', {
        button_name: 'submit',
        form_id: 'contact',
      });

      expect(analytics['eventQueue']).toHaveLength(2); // init + event
    });

    it('should track page views', () => {
      analytics.page('Home Page', {
        section: 'hero',
      });

      const events = analytics['eventQueue'];
      const pageEvent = events.find(e => e.event_name === 'page_view');
      
      expect(pageEvent).toBeDefined();
      expect(pageEvent?.properties.page_name).toBe('Home Page');
      expect(pageEvent?.properties.section).toBe('hero');
    });

    it('should identify users', () => {
      const posthog = require('posthog-js').default;

      analytics.identify('user-456', {
        email: 'test@example.com',
        plan: 'premium',
      });

      expect(posthog.identify).toHaveBeenCalledWith('user-456', {
        email: 'test@example.com',
        plan: 'premium',
      });
    });

    it('should group users', () => {
      const posthog = require('posthog-js').default;

      analytics.group('company-123', {
        name: 'Test Company',
        industry: 'Tech',
      });

      expect(posthog.group).toHaveBeenCalledWith('company', 'company-123', {
        name: 'Test Company',
        industry: 'Tech',
      });
    });

    it('should alias users', () => {
      const posthog = require('posthog-js').default;

      analytics.alias('new-id', 'old-id');

      expect(posthog.alias).toHaveBeenCalledWith('new-id', 'old-id');
    });

    it('should exclude specified events', async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: ['sensitive_event'],
          excludedProperties: [],
        },
      });
      await analytics.initialize();

      analytics.track('sensitive_event');
      analytics.track('allowed_event');

      expect(analytics['eventQueue']).toHaveLength(2); // init + allowed
    });

    it('should sanitize properties', async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: ['password', 'creditCard'],
        },
      });
      await analytics.initialize();

      analytics.track('form_submit', {
        username: 'john',
        password: 'secret123',
        creditCard: '1234-5678-9012-3456',
      });

      const event = analytics['eventQueue'].find(e => e.event_name === 'form_submit');
      expect(event?.properties.username).toBe('john');
      expect(event?.properties.password).toBeUndefined();
      expect(event?.properties.creditCard).toBeUndefined();
    });
  });

  describe('Performance Tracking', () => {
    beforeEach(async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
        performance: {
          trackWebVitals: true,
          trackResourceTiming: false,
          trackLongTasks: false,
          sampleRate: 1.0,
        },
      });
      await analytics.initialize();
    });

    it('should track performance metrics', () => {
      analytics.trackPerformance({
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        fcp: 1800,
        ttfb: 500,
      });

      const event = analytics['eventQueue'].find(e => e.event_name === 'performance_metric');
      expect(event?.properties.lcp).toBe(2500);
      expect(event?.properties.fid).toBe(100);
    });

    it('should measure timing', () => {
      mockPerformance.now
        .mockReturnValueOnce(1000) // start
        .mockReturnValueOnce(1500); // end

      const endTimer = analytics.startTimer('api_call');
      endTimer();

      const event = analytics['eventQueue'].find(e => e.event_name === 'timing_measure');
      expect(event?.properties.timing_name).toBe('api_call');
      expect(event?.properties.duration_ms).toBe(500);
    });

    it('should respect sampling rate', async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
        performance: {
          trackWebVitals: true,
          trackResourceTiming: false,
          trackLongTasks: false,
          sampleRate: 0, // 0% sampling
        },
      });
      await analytics.initialize();

      analytics.trackPerformance({ lcp: 2500 });

      const perfEvent = analytics['eventQueue'].find(e => e.event_name === 'performance_metric');
      expect(perfEvent).toBeUndefined();
    });
  });

  describe('Error Tracking', () => {
    beforeEach(async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
        errorTracking: {
          enabled: true,
          captureConsoleErrors: false,
          captureUnhandledRejections: true,
          captureResourceErrors: false,
          sanitizeErrorMessages: true,
        },
      });
      await analytics.initialize();
    });

    it('should track errors', () => {
      const error = new Error('Test error message');
      error.stack = 'Error: Test error message\n    at test.js:10:5';

      analytics.trackError(error, {
        context: 'form_validation',
      });

      const event = analytics['eventQueue'].find(e => e.event_name === 'error_encounter');
      expect(event?.properties.error_message).toBe('Test error message');
      expect(event?.properties.context).toBe('form_validation');
    });

    it('should sanitize error messages', () => {
      const error = new Error('Failed to fetch /users/john@example.com/profile');

      analytics.trackError(error);

      const event = analytics['eventQueue'].find(e => e.event_name === 'error_encounter');
      expect(event?.properties.error_message).toBe('Failed to fetch /users/[REDACTED]/profile');
    });

    it('should track error data objects', () => {
      analytics.trackError({
        message: 'Network error',
        type: 'network',
        url: 'https://api.example.com',
        timestamp: '2024-01-01T00:00:00Z',
      });

      const event = analytics['eventQueue'].find(e => e.event_name === 'error_encounter');
      expect(event?.properties.error_message).toBe('Network error');
      expect(event?.properties.error_type).toBe('network');
    });
  });

  describe('Voice Analytics', () => {
    beforeEach(async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
        voiceAnalytics: {
          enabled: true,
          trackCommands: true,
          trackLanguage: true,
          trackAccuracy: true,
          trackDuration: true,
        },
      });
      await analytics.initialize();
    });

    it('should track voice commands', () => {
      analytics.trackVoiceCommand({
        command: 'add eggs to pantry',
        language: 'en-US',
        confidence: 0.95,
        duration: 2500,
        success: true,
      });

      const event = analytics['eventQueue'].find(e => e.event_name === 'voice_command_complete');
      expect(event?.properties.command).toBe('add eggs to pantry');
      expect(event?.properties.confidence).toBe(0.95);
    });

    it('should track voice errors', () => {
      analytics.trackVoiceCommand({
        command: 'unclear command',
        language: 'en-US',
        confidence: 0.3,
        duration: 1500,
        success: false,
        errorReason: 'Low confidence',
      });

      const event = analytics['eventQueue'].find(e => e.event_name === 'voice_command_error');
      expect(event?.properties.error_reason).toBe('Low confidence');
    });

    it('should respect voice analytics settings', async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
        voiceAnalytics: {
          enabled: true,
          trackCommands: false,
          trackLanguage: true,
          trackAccuracy: false,
          trackDuration: true,
        },
      });
      await analytics.initialize();

      analytics.trackVoiceCommand({
        command: 'test command',
        language: 'es-MX',
        confidence: 0.9,
        duration: 2000,
        success: true,
      });

      const event = analytics['eventQueue'].find(e => e.event_name === 'voice_command_complete');
      expect(event?.properties.command).toBeUndefined();
      expect(event?.properties.language).toBe('es-MX');
      expect(event?.properties.confidence).toBeUndefined();
      expect(event?.properties.duration).toBe(2000);
    });
  });

  describe('Feature Usage', () => {
    beforeEach(async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
      });
      await analytics.initialize();
    });

    it('should track feature usage', () => {
      analytics.trackFeatureUsage({
        feature: 'pantry_scanner',
        action: 'barcode_scan',
        value: 'success',
        duration: 3000,
        metadata: {
          product_type: 'grocery',
        },
      });

      const event = analytics['eventQueue'].find(e => e.event_name === 'feature_used');
      expect(event?.properties.feature).toBe('pantry_scanner');
      expect(event?.properties.action).toBe('barcode_scan');
      expect(event?.properties.product_type).toBe('grocery');
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
      });
      await analytics.initialize();
    });

    it('should start a session on initialization', () => {
      const sessionStartEvent = analytics['eventQueue'].find(e => e.event_name === 'session_start');
      expect(sessionStartEvent).toBeDefined();
      expect(sessionStartEvent?.properties.utm_source).toBe('test');
    });

    it('should end session with duration', () => {
      // Mock time progression
      const startTime = new Date('2024-01-01T10:00:00Z');
      const endTime = new Date('2024-01-01T10:30:00Z');
      
      jest.spyOn(global, 'Date').mockImplementation((arg) => {
        if (arg) return new Date(arg);
        return endTime;
      });

      analytics['session'] = {
        id: 'test-session',
        user_id: 'user-123',
        started_at: startTime.toISOString(),
        page_views: 5,
        events_count: 10,
      };

      analytics.endSession();

      const sessionEndEvent = analytics['eventQueue'].find(e => e.event_name === 'session_end');
      expect(sessionEndEvent?.properties.session_duration).toBe(1800); // 30 minutes
      expect(sessionEndEvent?.properties.page_views).toBe(5);
    });
  });

  describe('Consent Management', () => {
    beforeEach(async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: true,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
          consentGiven: false,
        },
      });
    });

    it('should not track without consent', async () => {
      await analytics.initialize();
      
      analytics.track('test_event');
      
      // Should only have initialization event if any
      expect(analytics['eventQueue']).toHaveLength(0);
    });

    it('should track after consent is given', async () => {
      await analytics.initialize();
      
      analytics.setConsent(true);
      analytics.track('test_event');
      
      const event = analytics['eventQueue'].find(e => e.event_name === 'test_event');
      expect(event).toBeDefined();
    });

    it('should save consent preference', () => {
      analytics.setConsent(true);
      
      expect(localStorage.getItem('analytics_consent')).toBe('true');
      expect(analytics.getConsent()).toBe(true);
    });

    it('should opt out when consent is revoked', () => {
      const posthog = require('posthog-js').default;
      
      analytics.setConsent(false);
      
      expect(posthog.opt_out_capturing).toHaveBeenCalled();
    });
  });

  describe('Batch Processing', () => {
    beforeEach(async () => {
      analytics = new AnalyticsService({
        batchSize: 3,
        flushInterval: 60000, // 1 minute
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
      });
      await analytics.initialize();
    });

    it('should batch events up to batch size', () => {
      analytics.track('event_1');
      analytics.track('event_2');
      
      expect(fetch).not.toHaveBeenCalled();
      
      analytics.track('event_3'); // Should trigger flush
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('events'),
        })
      );
    });

    it('should handle flush errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      analytics.track('event_1');
      analytics.track('event_2');
      analytics.track('event_3'); // Trigger flush
      
      // Events should be kept in queue after error
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(analytics['eventQueue'].length).toBeGreaterThan(0);
    });
  });

  describe('Device Detection', () => {
    it('should detect mobile device', async () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      
      analytics = new AnalyticsService();
      await analytics.initialize();
      
      const deviceInfo = analytics['deviceInfo'];
      expect(deviceInfo.type).toBe('mobile');
      expect(deviceInfo.os).toBe('iOS');
    });

    it('should detect desktop device', async () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0';
      
      analytics = new AnalyticsService();
      await analytics.initialize();
      
      const deviceInfo = analytics['deviceInfo'];
      expect(deviceInfo.type).toBe('desktop');
      expect(deviceInfo.os).toBe('Windows');
      expect(deviceInfo.browser).toBe('Chrome');
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => {
      analytics = new AnalyticsService({
        privacy: {
          requireConsent: false,
          respectDoNotTrack: false,
          anonymizeIP: true,
          excludedEvents: [],
          excludedProperties: [],
        },
      });
      await analytics.initialize();
    });

    it('should clean up on destroy', () => {
      const posthog = require('posthog-js').default;
      
      analytics.track('event_1');
      analytics.destroy();
      
      expect(analytics['eventQueue']).toHaveLength(0);
      expect(analytics['isInitialized']).toBe(false);
    });
  });
});