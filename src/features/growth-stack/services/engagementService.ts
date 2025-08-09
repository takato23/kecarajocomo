import { 
  UserEngagement, 
  FunnelAnalysis, 
  CohortAnalysis, 
  UserSegment,
  TimePeriod
} from '../types';

import { getAnalyticsService } from './analyticsService';
import { logger } from '@/services/logger';

interface EngagementConfig {
  apiEndpoint: string;
  enableDebug: boolean;
  cacheDuration: number;
  churnThresholdDays: number;
  powerUserThreshold: number;
  sessionTimeoutMinutes: number;
}

interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  averageSessionsPerUser: number;
  retentionRate: number;
  churnRate: number;
  engagementScore: number;
}

interface UserActivity {
  userId: string;
  sessionCount: number;
  totalDuration: number;
  lastActive: string;
  firstVisit: string;
  pageViews: number;
  actions: number;
  conversions: number;
  engagementEvents: string[];
}

interface EngagementInsight {
  type: 'opportunity' | 'warning' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
  data: Record<string, any>;
}

class EngagementService {
  private config: EngagementConfig;
  private metricsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private userActivities: Map<string, UserActivity> = new Map();
  private isInitialized = false;

  constructor(config: Partial<EngagementConfig> = {}) {
    this.config = {
      apiEndpoint: '/api/engagement',
      enableDebug: false,
      cacheDuration: 300000, // 5 minutes
      churnThresholdDays: 30,
      powerUserThreshold: 10, // sessions per week
      sessionTimeoutMinutes: 30,
      ...config
    };
  }

  /**
   * Initialize engagement service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load user activities
      await this.loadUserActivities();

      // Setup periodic metrics calculation
      this.setupMetricsCalculation();

      this.isInitialized = true;

      if (this.config.enableDebug) {

      }
    } catch (error: unknown) {
      logger.error('Failed to initialize engagement service:', 'engagementService', error);
      throw error;
    }
  }

  /**
   * Track user engagement event
   */
  trackEngagement(
    userId: string,
    eventType: string,
    properties?: Record<string, any>
  ): void {
    // Update user activity
    this.updateUserActivity(userId, eventType, properties);

    // Track in analytics
    const analytics = getAnalyticsService();
    analytics.track('engagement_event', {
      properties: {
        engagement_type: eventType,
        user_id: userId,
        ...properties
      }
    });

    if (this.config.enableDebug) {

    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(userId: string): Promise<UserEngagement | null> {
    const cacheKey = `user_engagement_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.config.apiEndpoint}/user/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const engagement = await response.json();
      this.setCachedData(cacheKey, engagement);
      return engagement;
    } catch (error: unknown) {
      logger.error('Failed to fetch user engagement:', 'engagementService', error);
      return null;
    }
  }

  /**
   * Get overall engagement metrics
   */
  async getEngagementMetrics(period: TimePeriod = 'week'): Promise<EngagementMetrics> {
    const cacheKey = `engagement_metrics_${period}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.config.apiEndpoint}/metrics?period=${period}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const metrics = await response.json();
      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error: unknown) {
      logger.error('Failed to fetch engagement metrics:', 'engagementService', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(): Promise<Record<UserSegment, number>> {
    const cacheKey = 'user_segments';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.config.apiEndpoint}/segments`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const segments = await response.json();
      this.setCachedData(cacheKey, segments);
      return segments;
    } catch (error: unknown) {
      logger.error('Failed to fetch user segments:', 'engagementService', error);
      return {} as Record<UserSegment, number>;
    }
  }

  /**
   * Get funnel analysis
   */
  async getFunnelAnalysis(
    funnelId: string,
    period: TimePeriod = 'week'
  ): Promise<FunnelAnalysis | null> {
    const cacheKey = `funnel_${funnelId}_${period}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.config.apiEndpoint}/funnel/${funnelId}?period=${period}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const analysis = await response.json();
      this.setCachedData(cacheKey, analysis);
      return analysis;
    } catch (error: unknown) {
      logger.error('Failed to fetch funnel analysis:', 'engagementService', error);
      return null;
    }
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(
    cohortType: 'daily' | 'weekly' | 'monthly' = 'weekly',
    periods: number = 12
  ): Promise<CohortAnalysis[]> {
    const cacheKey = `cohort_${cohortType}_${periods}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.config.apiEndpoint}/cohort?type=${cohortType}&periods=${periods}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const analysis = await response.json();
      this.setCachedData(cacheKey, analysis);
      return analysis;
    } catch (error: unknown) {
      logger.error('Failed to fetch cohort analysis:', 'engagementService', error);
      return [];
    }
  }

  /**
   * Get engagement insights
   */
  async getEngagementInsights(): Promise<EngagementInsight[]> {
    const cacheKey = 'engagement_insights';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.config.apiEndpoint}/insights`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const insights = await response.json();
      this.setCachedData(cacheKey, insights);
      return insights;
    } catch (error: unknown) {
      logger.error('Failed to fetch engagement insights:', 'engagementService', error);
      return [];
    }
  }

  /**
   * Calculate engagement score for user
   */
  calculateEngagementScore(activity: UserActivity): number {
    const {
      sessionCount,
      totalDuration,
      pageViews,
      actions,
      conversions,
      lastActive,
      firstVisit
    } = activity;

    // Normalize values
    const avgSessionDuration = totalDuration / Math.max(sessionCount, 1);
    const daysSinceFirst = this.daysBetween(firstVisit, new Date().toISOString());
    const daysSinceLastActive = this.daysBetween(lastActive, new Date().toISOString());

    // Calculate component scores (0-100)
    const frequencyScore = Math.min(sessionCount / daysSinceFirst * 7, 100); // Sessions per week
    const recencyScore = Math.max(100 - daysSinceLastActive * 5, 0); // Penalty for inactivity
    const durationScore = Math.min(avgSessionDuration / 60, 100); // Avg session minutes
    const activityScore = Math.min((actions + conversions * 5) / sessionCount * 10, 100);
    const engagementScore = Math.min(pageViews / sessionCount * 5, 100);

    // Weighted average
    const score = (
      frequencyScore * 0.25 +
      recencyScore * 0.25 +
      durationScore * 0.2 +
      activityScore * 0.15 +
      engagementScore * 0.15
    );

    return Math.round(score);
  }

  /**
   * Calculate retention score for user
   */
  calculateRetentionScore(activity: UserActivity): number {
    const { sessionCount, lastActive, firstVisit } = activity;
    
    const daysSinceFirst = this.daysBetween(firstVisit, new Date().toISOString());
    const daysSinceLastActive = this.daysBetween(lastActive, new Date().toISOString());
    
    // User is churned if inactive for more than threshold
    if (daysSinceLastActive > this.config.churnThresholdDays) {
      return 0;
    }

    // Calculate retention based on consistency
    const expectedSessions = Math.max(daysSinceFirst / 7, 1); // At least 1 session per week
    const sessionRatio = sessionCount / expectedSessions;
    const recencyBonus = Math.max(100 - daysSinceLastActive * 3, 0);
    
    return Math.min(sessionRatio * 50 + recencyBonus, 100);
  }

  /**
   * Determine user segment
   */
  determineUserSegment(activity: UserActivity): UserSegment {
    const { sessionCount, lastActive, firstVisit } = activity;
    
    const daysSinceFirst = this.daysBetween(firstVisit, new Date().toISOString());
    const daysSinceLastActive = this.daysBetween(lastActive, new Date().toISOString());
    const sessionsPerWeek = sessionCount / Math.max(daysSinceFirst / 7, 1);

    // Churned users
    if (daysSinceLastActive > this.config.churnThresholdDays) {
      return 'churned_users';
    }

    // At risk users
    if (daysSinceLastActive > 7 && sessionsPerWeek < 1) {
      return 'at_risk_users';
    }

    // New users (first week)
    if (daysSinceFirst <= 7) {
      return 'new_users';
    }

    // Power users
    if (sessionsPerWeek >= this.config.powerUserThreshold) {
      return 'power_users';
    }

    // Returning users
    if (sessionCount > 1 && daysSinceLastActive <= 7) {
      return 'returning_users';
    }

    // Default to returning users
    return 'returning_users';
  }

  /**
   * Get churn risk level
   */
  getChurnRisk(activity: UserActivity): 'low' | 'medium' | 'high' {
    const { lastActive, sessionCount } = activity;
    const daysSinceLastActive = this.daysBetween(lastActive, new Date().toISOString());
    
    if (daysSinceLastActive > this.config.churnThresholdDays) {
      return 'high';
    }

    if (daysSinceLastActive > 14 || sessionCount < 2) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Update user activity
   */
  private updateUserActivity(
    userId: string,
    eventType: string,
    properties?: Record<string, any>
  ): void {
    const existing = this.userActivities.get(userId);
    const now = new Date().toISOString();

    if (!existing) {
      this.userActivities.set(userId, {
        userId,
        sessionCount: 1,
        totalDuration: 0,
        lastActive: now,
        firstVisit: now,
        pageViews: eventType === 'page_view' ? 1 : 0,
        actions: eventType === 'action' ? 1 : 0,
        conversions: eventType === 'conversion' ? 1 : 0,
        engagementEvents: [eventType]
      });
    } else {
      // Update existing activity
      existing.lastActive = now;
      existing.engagementEvents.push(eventType);

      if (eventType === 'page_view') {
        existing.pageViews++;
      } else if (eventType === 'action') {
        existing.actions++;
      } else if (eventType === 'conversion') {
        existing.conversions++;
      }

      // Update session count if new session
      if (properties?.isNewSession) {
        existing.sessionCount++;
      }

      // Update total duration
      if (properties?.sessionDuration) {
        existing.totalDuration += properties.sessionDuration;
      }
    }
  }

  /**
   * Load user activities from server
   */
  private async loadUserActivities(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/activities`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const activities = await response.json();
      
      for (const activity of activities) {
        this.userActivities.set(activity.userId, activity);
      }
    } catch (error: unknown) {
      logger.error('Failed to load user activities:', 'engagementService', error);
    }
  }

  /**
   * Setup periodic metrics calculation
   */
  private setupMetricsCalculation(): void {
    // Calculate metrics every hour
    setInterval(() => {
      this.calculateAndCacheMetrics();
    }, 3600000); // 1 hour

    // Initial calculation
    this.calculateAndCacheMetrics();
  }

  /**
   * Calculate and cache metrics
   */
  private async calculateAndCacheMetrics(): Promise<void> {
    try {
      const activities = Array.from(this.userActivities.values());
      
      // Calculate DAU, WAU, MAU
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const dau = activities.filter(a => new Date(a.lastActive) > dayAgo).length;
      const wau = activities.filter(a => new Date(a.lastActive) > weekAgo).length;
      const mau = activities.filter(a => new Date(a.lastActive) > monthAgo).length;

      // Calculate other metrics
      const totalSessions = activities.reduce((sum, a) => sum + a.sessionCount, 0);
      const totalDuration = activities.reduce((sum, a) => sum + a.totalDuration, 0);
      const activeUsers = activities.filter(a => new Date(a.lastActive) > weekAgo);
      
      const avgSessionDuration = totalDuration / Math.max(totalSessions, 1);
      const avgSessionsPerUser = totalSessions / Math.max(activities.length, 1);
      
      // Calculate retention and churn
      const retentionRate = (wau / Math.max(mau, 1)) * 100;
      const churnRate = 100 - retentionRate;
      
      // Calculate engagement score
      const engagementScore = activeUsers.reduce((sum, a) => sum + this.calculateEngagementScore(a), 0) / Math.max(activeUsers.length, 1);

      const metrics: EngagementMetrics = {
        dailyActiveUsers: dau,
        weeklyActiveUsers: wau,
        monthlyActiveUsers: mau,
        averageSessionDuration: avgSessionDuration,
        averageSessionsPerUser: avgSessionsPerUser,
        retentionRate,
        churnRate,
        engagementScore
      };

      this.setCachedData('engagement_metrics_current', metrics);
    } catch (error: unknown) {
      logger.error('Failed to calculate metrics:', 'engagementService', error);
    }
  }

  /**
   * Get cached data
   */
  private getCachedData(key: string): any {
    const cached = this.metricsCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheDuration) {
      this.metricsCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached data
   */
  private setCachedData(key: string, data: any): void {
    this.metricsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): EngagementMetrics {
    return {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      averageSessionDuration: 0,
      averageSessionsPerUser: 0,
      retentionRate: 0,
      churnRate: 0,
      engagementScore: 0
    };
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
  }
}

// Singleton instance
let engagementInstance: EngagementService | null = null;

/**
 * Get engagement service instance
 */
export function getEngagementService(config?: Partial<EngagementConfig>): EngagementService {
  if (!engagementInstance) {
    engagementInstance = new EngagementService(config);
  }
  return engagementInstance;
}

/**
 * Initialize engagement service
 */
export async function initializeEngagement(config?: Partial<EngagementConfig>): Promise<EngagementService> {
  const service = getEngagementService(config);
  await service.initialize();
  return service;
}

/**
 * Track engagement (convenience function)
 */
export function trackEngagement(
  userId: string,
  eventType: string,
  properties?: Record<string, any>
): void {
  const service = getEngagementService();
  service.trackEngagement(userId, eventType, properties);
}

export { EngagementService, type EngagementMetrics, type EngagementInsight };