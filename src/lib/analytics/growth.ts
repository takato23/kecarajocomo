import { logger } from '@/services/logger';

/**
 * Growth Analytics & User Behavior Tracking
 * Comprehensive growth analytics with user behavior insights
 */


export interface UserEvent {
  userId?: string;
  sessionId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  route: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
}

export interface ConversionFunnel {
  name: string;
  steps: string[];
  timeWindow: number; // in milliseconds
}

export interface CohortAnalysis {
  cohortDate: string;
  totalUsers: number;
  activeUsers: Record<string, number>; // period -> count
  retention: Record<string, number>; // period -> percentage
}

export interface GrowthMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  newUsers: number;
  returningUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  churnRate: number;
  timestamp: number;
}

export interface FeatureUsage {
  feature: string;
  usage: number;
  users: number;
  conversion: number;
  retention: number;
  timestamp: number;
}

class GrowthAnalytics {
  private events: UserEvent[] = [];
  private sessions = new Map<string, { start: number; events: UserEvent[] }>();
  private funnels: ConversionFunnel[] = [];
  private batchSize = 50;
  private flushInterval = 10000; // 10 seconds

  constructor() {
    this.setupAutoFlush();
    this.setupDefaultFunnels();
  }

  private setupAutoFlush() {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  private setupDefaultFunnels() {
    this.funnels = [
      {
        name: 'User Onboarding',
        steps: ['signup', 'email_verified', 'profile_completed', 'first_recipe_created'],
        timeWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      {
        name: 'Recipe Discovery',
        steps: ['recipe_viewed', 'recipe_liked', 'recipe_cooked', 'recipe_shared'],
        timeWindow: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
      {
        name: 'Meal Planning',
        steps: ['meal_plan_viewed', 'meal_planned', 'shopping_list_generated', 'ingredients_purchased'],
        timeWindow: 14 * 24 * 60 * 60 * 1000, // 14 days
      },
      {
        name: 'AI Features',
        steps: ['ai_recipe_generated', 'ai_suggestion_viewed', 'ai_suggestion_accepted', 'ai_recipe_cooked'],
        timeWindow: 21 * 24 * 60 * 60 * 1000, // 21 days
      },
    ];
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr).id : undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return this.generateSessionId();
    
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    
    return sessionId;
  }

  track(event: string, properties: Record<string, any> = {}) {
    const sessionId = this.getSessionId();
    const userId = this.getCurrentUserId();
    
    const userEvent: UserEvent = {
      userId,
      sessionId,
      event,
      properties,
      timestamp: Date.now(),
      route: typeof window !== 'undefined' ? window.location.pathname : '',
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.events.push(userEvent);

    // Update session
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        start: Date.now(),
        events: [],
      });
    }
    
    const session = this.sessions.get(sessionId)!;
    session.events.push(userEvent);

    // Auto-flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }

    // Track specific events
    this.trackSpecialEvents(userEvent);
  }

  private trackSpecialEvents(event: UserEvent) {
    // Track page views
    if (event.event === 'page_view') {
      this.trackPageView(event);
    }

    // Track user actions
    if (event.event === 'user_action') {
      this.trackUserAction(event);
    }

    // Track errors
    if (event.event === 'error') {
      this.trackError(event);
    }
  }

  private trackPageView(event: UserEvent) {
    // Track page performance
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.track('page_performance', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          route: event.route,
        });
      }
    }
  }

  private trackUserAction(event: UserEvent) {
    // Track engagement metrics
    const session = this.sessions.get(event.sessionId);
    if (session) {
      const sessionDuration = Date.now() - session.start;
      const eventCount = session.events.length;
      
      this.track('engagement_update', {
        sessionDuration,
        eventCount,
        engagementRate: eventCount / (sessionDuration / 1000), // events per second
      });
    }
  }

  private trackError(event: UserEvent) {
    // Track error patterns
    this.track('error_pattern', {
      errorType: event.properties.type,
      errorMessage: event.properties.message,
      route: event.route,
      userAgent: event.userAgent,
      stack: event.properties.stack,
    });
  }

  // Convenience methods for common events
  page(route: string, properties: Record<string, any> = {}) {
    this.track('page_view', {
      route,
      ...properties,
    });
  }

  identify(userId: string, traits: Record<string, any> = {}) {
    this.track('user_identified', {
      userId,
      traits,
    });
  }

  conversion(funnel: string, step: string, properties: Record<string, any> = {}) {
    this.track('conversion_step', {
      funnel,
      step,
      ...properties,
    });
  }

  feature(feature: string, action: string, properties: Record<string, any> = {}) {
    this.track('feature_usage', {
      feature,
      action,
      ...properties,
    });
  }

  error(error: Error, context: Record<string, any> = {}) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      type: error.name,
      ...context,
    });
  }

  // Analytics calculations
  calculateConversionRate(funnel: ConversionFunnel): Record<string, number> {
    const funnelEvents = this.events.filter(e => 
      e.event === 'conversion_step' && 
      e.properties.funnel === funnel.name
    );

    const stepCounts = funnel.steps.reduce((acc, step) => {
      acc[step] = funnelEvents.filter(e => e.properties.step === step).length;
      return acc;
    }, {} as Record<string, number>);

    const conversionRates: Record<string, number> = {};
    const totalUsers = stepCounts[funnel.steps[0]] || 0;

    funnel.steps.forEach(step => {
      conversionRates[step] = totalUsers > 0 ? (stepCounts[step] / totalUsers) * 100 : 0;
    });

    return conversionRates;
  }

  calculateRetention(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Record<string, number> {
    const now = Date.now();
    const periodMs = period === 'daily' ? 24 * 60 * 60 * 1000 :
                    period === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
                    30 * 24 * 60 * 60 * 1000;

    const retention: Record<string, number> = {};
    const userFirstSeen = new Map<string, number>();

    // Find first seen timestamp for each user
    this.events
      .filter(e => e.userId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(event => {
        if (!userFirstSeen.has(event.userId!)) {
          userFirstSeen.set(event.userId!, event.timestamp);
        }
      });

    // Calculate retention for each period
    for (let i = 0; i < 12; i++) {
      const periodStart = now - (i + 1) * periodMs;
      const periodEnd = now - i * periodMs;
      
      const cohortUsers = Array.from(userFirstSeen.entries())
        .filter(([_, firstSeen]) => firstSeen >= periodStart && firstSeen < periodEnd)
        .map(([userId]) => userId);

      if (cohortUsers.length === 0) continue;

      const activeUsers = this.events
        .filter(e => 
          e.userId &&
          e.timestamp >= periodEnd &&
          e.timestamp < periodEnd + periodMs &&
          cohortUsers.includes(e.userId)
        )
        .map(e => e.userId)
        .filter((userId, index, array) => array.indexOf(userId) === index);

      retention[`period_${i}`] = (activeUsers.length / cohortUsers.length) * 100;
    }

    return retention;
  }

  calculateChurnRate(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): number {
    const now = Date.now();
    const periodMs = period === 'daily' ? 24 * 60 * 60 * 1000 :
                    period === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
                    30 * 24 * 60 * 60 * 1000;

    const currentPeriodStart = now - periodMs;
    const previousPeriodStart = now - 2 * periodMs;

    const currentActiveUsers = new Set(
      this.events
        .filter(e => e.userId && e.timestamp >= currentPeriodStart)
        .map(e => e.userId)
    );

    const previousActiveUsers = new Set(
      this.events
        .filter(e => 
          e.userId && 
          e.timestamp >= previousPeriodStart && 
          e.timestamp < currentPeriodStart
        )
        .map(e => e.userId)
    );

    const churnedUsers = Array.from(previousActiveUsers)
      .filter(userId => !currentActiveUsers.has(userId));

    return previousActiveUsers.size > 0 ? 
      (churnedUsers.length / previousActiveUsers.size) * 100 : 0;
  }

  getFeatureUsage(timeWindow: number = 7 * 24 * 60 * 60 * 1000): FeatureUsage[] {
    const now = Date.now();
    const windowStart = now - timeWindow;

    const featureEvents = this.events
      .filter(e => 
        e.event === 'feature_usage' && 
        e.timestamp >= windowStart
      );

    const features = new Map<string, {
      usage: number;
      users: Set<string>;
      conversions: number;
    }>();

    featureEvents.forEach(event => {
      const feature = event.properties.feature;
      if (!features.has(feature)) {
        features.set(feature, {
          usage: 0,
          users: new Set(),
          conversions: 0,
        });
      }

      const stats = features.get(feature)!;
      stats.usage++;
      if (event.userId) {
        stats.users.add(event.userId);
      }
      if (event.properties.conversion) {
        stats.conversions++;
      }
    });

    return Array.from(features.entries()).map(([feature, stats]) => ({
      feature,
      usage: stats.usage,
      users: stats.users.size,
      conversion: stats.usage > 0 ? (stats.conversions / stats.usage) * 100 : 0,
      retention: this.calculateFeatureRetention(feature, timeWindow),
      timestamp: now,
    }));
  }

  private calculateFeatureRetention(feature: string, timeWindow: number): number {
    const now = Date.now();
    const windowStart = now - timeWindow;
    const previousWindowStart = now - 2 * timeWindow;

    const currentUsers = new Set(
      this.events
        .filter(e => 
          e.event === 'feature_usage' &&
          e.properties.feature === feature &&
          e.timestamp >= windowStart &&
          e.userId
        )
        .map(e => e.userId)
    );

    const previousUsers = new Set(
      this.events
        .filter(e => 
          e.event === 'feature_usage' &&
          e.properties.feature === feature &&
          e.timestamp >= previousWindowStart &&
          e.timestamp < windowStart &&
          e.userId
        )
        .map(e => e.userId)
    );

    if (previousUsers.size === 0) return 0;

    const retainedUsers = Array.from(previousUsers)
      .filter(userId => currentUsers.has(userId));

    return (retainedUsers.length / previousUsers.size) * 100;
  }

  getGrowthMetrics(): GrowthMetrics {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    const dailyEvents = this.events.filter(e => e.timestamp >= now - dayMs);
    const weeklyEvents = this.events.filter(e => e.timestamp >= now - weekMs);
    const monthlyEvents = this.events.filter(e => e.timestamp >= now - monthMs);

    const dailyUsers = new Set(dailyEvents.map(e => e.userId).filter(Boolean));
    const weeklyUsers = new Set(weeklyEvents.map(e => e.userId).filter(Boolean));
    const monthlyUsers = new Set(monthlyEvents.map(e => e.userId).filter(Boolean));

    // Calculate session durations
    const sessionDurations = Array.from(this.sessions.values())
      .map(session => {
        const lastEvent = session.events[session.events.length - 1];
        return lastEvent ? lastEvent.timestamp - session.start : 0;
      })
      .filter(duration => duration > 0);

    const avgSessionDuration = sessionDurations.length > 0 ?
      sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length :
      0;

    // Calculate bounce rate (sessions with only one event)
    const totalSessions = this.sessions.size;
    const bouncedSessions = Array.from(this.sessions.values())
      .filter(session => session.events.length === 1).length;
    
    const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

    return {
      dailyActiveUsers: dailyUsers.size,
      weeklyActiveUsers: weeklyUsers.size,
      monthlyActiveUsers: monthlyUsers.size,
      newUsers: this.calculateNewUsers(),
      returningUsers: this.calculateReturningUsers(),
      avgSessionDuration,
      bounceRate,
      conversionRate: this.calculateOverallConversionRate(),
      churnRate: this.calculateChurnRate(),
      timestamp: now,
    };
  }

  private calculateNewUsers(): number {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const newUserEvents = this.events.filter(e => 
      e.event === 'user_identified' &&
      e.timestamp >= now - dayMs
    );

    return newUserEvents.length;
  }

  private calculateReturningUsers(): number {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const todayUsers = new Set(
      this.events
        .filter(e => e.userId && e.timestamp >= now - dayMs)
        .map(e => e.userId)
    );

    const previousUsers = new Set(
      this.events
        .filter(e => e.userId && e.timestamp < now - dayMs)
        .map(e => e.userId)
    );

    return Array.from(todayUsers).filter(userId => previousUsers.has(userId)).length;
  }

  private calculateOverallConversionRate(): number {
    const conversions = this.events.filter(e => e.event === 'conversion_step').length;
    const totalUsers = new Set(this.events.map(e => e.userId).filter(Boolean)).size;
    
    return totalUsers > 0 ? (conversions / totalUsers) * 100 : 0;
  }

  private async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch (error: unknown) {
      logger.error('Failed to send analytics events:', 'Lib:growth', error);
      // Re-add events to retry later
      this.events.unshift(...eventsToSend);
    }
  }
}

// Global analytics instance
export const analytics = new GrowthAnalytics();

// React hook for growth analytics
export function useGrowthAnalytics() {
  return {
    track: (event: string, properties?: Record<string, any>) => 
      analytics.track(event, properties),
    page: (route: string, properties?: Record<string, any>) => 
      analytics.page(route, properties),
    identify: (userId: string, traits?: Record<string, any>) => 
      analytics.identify(userId, traits),
    conversion: (funnel: string, step: string, properties?: Record<string, any>) => 
      analytics.conversion(funnel, step, properties),
    feature: (feature: string, action: string, properties?: Record<string, any>) => 
      analytics.feature(feature, action, properties),
    error: (error: Error, context?: Record<string, any>) => 
      analytics.error(error, context),
    getGrowthMetrics: () => analytics.getGrowthMetrics(),
    getFeatureUsage: (timeWindow?: number) => analytics.getFeatureUsage(timeWindow),
    calculateConversionRate: (funnel: ConversionFunnel) => 
      analytics.calculateConversionRate(funnel),
    calculateRetention: (period?: 'daily' | 'weekly' | 'monthly') => 
      analytics.calculateRetention(period),
    calculateChurnRate: (period?: 'daily' | 'weekly' | 'monthly') => 
      analytics.calculateChurnRate(period),
  };
}