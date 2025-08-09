/**
 * React Hook for Analytics
 * Provides easy integration with React components
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { logger } from '@/services/logger';

import { getAnalyticsService } from '../AnalyticsService';
import type {
  AnalyticsServiceConfig,
  PerformanceMetrics,
  ErrorData,
  VoiceAnalyticsData,
  FeatureUsageData,
  UseAnalyticsReturn,
} from '../types';

/**
 * React hook for using the analytics service
 */
export function useAnalytics(config?: Partial<AnalyticsServiceConfig>): UseAnalyticsReturn {
  const analytics = useMemo(() => getAnalyticsService(config), []);
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize analytics
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        // Check for user ID in localStorage or auth state
        const storedUserId = localStorage.getItem('user_id');
        if (storedUserId) {
          await analytics.initialize(storedUserId);
          setUserId(storedUserId);
        } else {
          await analytics.initialize();
        }
        
        const config = analytics.getConfig();
        setIsEnabled(config.enabled);
        setHasConsent(config.privacy.consentGiven || false);
        
        // Get session ID from provider if available
        const providers = (analytics as any).providers;
        if (providers && providers.size > 0) {
          const firstProvider = providers.values().next().value;
          if (firstProvider && firstProvider.getSessionId) {
            setSessionId(firstProvider.getSessionId());
          }
        }
      } catch (error: unknown) {
        logger.error('Failed to initialize analytics:', 'useAnalytics', error);
      }
    };

    initAnalytics();

    return () => {
      // Clean up on unmount
      analytics.endSession();
    };
  }, [analytics]);

  // Track page views on route change
  useEffect(() => {
    const handleRouteChange = () => {
      analytics.page();
    };

    // Listen for route changes (Next.js example)
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleRouteChange);
      
      // Track initial page view
      analytics.page();
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleRouteChange);
      }
    };
  }, [analytics]);

  // Core tracking methods
  const track = useCallback(
    (event: string, properties?: Record<string, any>) => {
      analytics.track(event, properties);
    },
    [analytics]
  );

  const page = useCallback(
    (name?: string, properties?: Record<string, any>) => {
      analytics.page(name, properties);
    },
    [analytics]
  );

  const identify = useCallback(
    (userId: string, traits?: Record<string, any>) => {
      analytics.identify(userId, traits);
      setUserId(userId);
      
      // Store user ID for persistence
      localStorage.setItem('user_id', userId);
    },
    [analytics]
  );

  const group = useCallback(
    (groupId: string, traits?: Record<string, any>) => {
      analytics.group(groupId, traits);
    },
    [analytics]
  );

  const alias = useCallback(
    (userId: string, previousId?: string) => {
      analytics.alias(userId, previousId);
      setUserId(userId);
    },
    [analytics]
  );

  // Performance tracking
  const trackPerformance = useCallback(
    (metrics: PerformanceMetrics) => {
      analytics.trackPerformance(metrics);
    },
    [analytics]
  );

  const startTimer = useCallback(
    (name: string): (() => void) => {
      return analytics.startTimer(name);
    },
    [analytics]
  );

  // Error tracking
  const trackError = useCallback(
    (error: Error | ErrorData, metadata?: Record<string, any>) => {
      analytics.trackError(error, metadata);
    },
    [analytics]
  );

  // Voice analytics
  const trackVoiceCommand = useCallback(
    (data: VoiceAnalyticsData) => {
      analytics.trackVoiceCommand(data);
    },
    [analytics]
  );

  // Feature usage
  const trackFeatureUsage = useCallback(
    (data: FeatureUsageData) => {
      analytics.trackFeatureUsage(data);
    },
    [analytics]
  );

  // Session management
  const startSession = useCallback(() => {
    analytics.startSession();
  }, [analytics]);

  const endSession = useCallback(() => {
    analytics.endSession();
  }, [analytics]);

  // Consent management
  const setConsent = useCallback(
    (consent: boolean) => {
      analytics.setConsent(consent);
      setHasConsent(consent);
      
      // Re-initialize if consent granted
      if (consent && !isEnabled) {
        analytics.initialize(userId || undefined);
      }
    },
    [analytics, isEnabled, userId]
  );

  const getConsent = useCallback((): boolean => {
    return analytics.getConsent();
  }, [analytics]);

  // Privacy controls
  const optIn = useCallback(() => {
    setConsent(true);
  }, [setConsent]);

  const optOut = useCallback(() => {
    setConsent(false);
  }, [setConsent]);

  // Configuration
  const updateConfig = useCallback(
    (config: Partial<AnalyticsServiceConfig>) => {
      analytics.updateConfig(config);
      
      const newConfig = analytics.getConfig();
      setIsEnabled(newConfig.enabled);
      setHasConsent(newConfig.privacy.consentGiven || false);
    },
    [analytics]
  );

  const getConfig = useCallback((): AnalyticsServiceConfig => {
    return analytics.getConfig();
  }, [analytics]);

  // Debug mode
  const debug = useCallback(
    (enabled: boolean) => {
      analytics.updateConfig({ debug: enabled });
    },
    [analytics]
  );

  return {
    // State
    isEnabled,
    hasConsent,
    sessionId,
    userId,
    
    // Core tracking
    track,
    page,
    identify,
    group,
    alias,
    
    // Performance tracking
    trackPerformance,
    startTimer,
    
    // Error tracking
    trackError,
    
    // Voice analytics
    trackVoiceCommand,
    
    // Feature usage
    trackFeatureUsage,
    
    // Session management
    startSession,
    endSession,
    
    // Consent management
    setConsent,
    getConsent,
    
    // Privacy controls
    optIn,
    optOut,
    
    // Configuration
    updateConfig,
    getConfig,
    
    // Debug
    debug,
  };
}

/**
 * Hook for tracking specific features
 */
export function useFeatureTracking(featureName: string) {
  const { trackFeatureUsage } = useAnalytics();
  
  const trackAction = useCallback(
    (action: string, value?: any, metadata?: Record<string, any>) => {
      trackFeatureUsage({
        feature: featureName,
        action,
        value,
        metadata,
      });
    },
    [featureName, trackFeatureUsage]
  );

  const trackDuration = useCallback(
    (action: string, duration: number, metadata?: Record<string, any>) => {
      trackFeatureUsage({
        feature: featureName,
        action,
        duration,
        metadata,
      });
    },
    [featureName, trackFeatureUsage]
  );

  return {
    trackAction,
    trackDuration,
  };
}

/**
 * Hook for tracking errors with context
 */
export function useErrorTracking() {
  const { trackError } = useAnalytics();
  
  const trackErrorWithContext = useCallback(
    (error: Error, context: Record<string, any>) => {
      trackError(error, {
        ...context,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    },
    [trackError]
  );

  // Set up global error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackErrorWithContext(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [trackErrorWithContext]);

  return {
    trackError: trackErrorWithContext,
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceTracking() {
  const { trackPerformance, startTimer } = useAnalytics();
  
  // Track Web Vitals automatically
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Track paint timing
      const paintObserver = new PerformanceObserver((entries) => {
        entries.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            trackPerformance({ fcp: entry.startTime });
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Track navigation timing
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        trackPerformance({
          ttfb: navEntry.responseStart - navEntry.requestStart,
        });
      }
    } catch (error: unknown) {
      logger.warn('Failed to setup performance tracking:', 'useAnalytics', error);
    }
  }, [trackPerformance]);

  return {
    trackPerformance,
    startTimer,
  };
}