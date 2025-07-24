/**
 * Analytics Service Adapter
 * Bridges the growth-stack analytics with the new unified analytics service
 */

import { 
  getAnalyticsService as getUnifiedAnalytics 
} from '@/services/analytics';

import type { 
  CommonEventName, 
  TrackEventOptions 
} from '../types';

// Re-export the unified analytics service for backward compatibility
export function getAnalyticsService() {
  const unifiedService = getUnifiedAnalytics();
  
  // Return a wrapper that maintains the growth-stack interface
  return {
    ...unifiedService,
    
    // Maintain backward compatibility with growth-stack specific methods
    initialize: async (userId?: string) => {
      await unifiedService.initialize(userId);
    },
    
    track: (eventName: CommonEventName | string, options?: TrackEventOptions) => {
      unifiedService.track(eventName, options?.properties || {});
    },
    
    page: (pageName?: string, properties?: Record<string, any>) => {
      unifiedService.page(pageName, properties);
    },
    
    identify: (userId: string, traits?: Record<string, any>) => {
      unifiedService.identify(userId, traits);
    },
    
    // Growth-stack specific methods that map to unified service
    action: (actionName: string, properties?: Record<string, any>) => {
      unifiedService.track(actionName, {
        action_type: 'user_action',
        ...properties,
      });
    },
    
    conversion: (conversionName: string, value?: number, properties?: Record<string, any>) => {
      unifiedService.track('conversion_complete', {
        conversion_name: conversionName,
        conversion_value: value,
        ...properties,
      });
    },
    
    error: (errorMessage: string, errorDetails?: Record<string, any>) => {
      unifiedService.trackError({
        message: errorMessage,
        type: 'error',
        timestamp: new Date().toISOString(),
        metadata: errorDetails,
      });
    },
    
    timing: (timingName: string, duration: number, properties?: Record<string, any>) => {
      unifiedService.track('timing_measure', {
        timing_name: timingName,
        duration_ms: duration,
        ...properties,
      });
    },
  };
}

// Re-export convenience functions
export { track, page, identify, trackError } from '@/services/analytics';

// Re-export the initialization function
export async function initializeAnalytics(userId?: string) {
  const service = getUnifiedAnalytics();
  await service.initialize(userId);
  return service;
}