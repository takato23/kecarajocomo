import { 
  RetentionCampaign, 
  RetentionAction,
  UserSegment
} from '../types';

import { getAnalyticsService } from './analyticsService';
import { getEngagementService } from './engagementService';

interface RetentionConfig {
  apiEndpoint: string;
  enableDebug: boolean;
  defaultCampaignDuration: number;
  maxRetentionActions: number;
  churnPredictionThreshold: number;
  reactivationWindow: number;
}

interface RetentionMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalUsers: number;
  retainedUsers: number;
  retentionRate: number;
  averageLifetimeValue: number;
  churnRate: number;
  reactivationRate: number;
  campaignEffectiveness: Record<string, number>;
}

interface RetentionInsight {
  type: 'opportunity' | 'warning' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  priority: number;
  suggestedActions: string[];
  dataPoints: Record<string, any>;
}

interface UserRetentionProfile {
  userId: string;
  segment: UserSegment;
  churnRisk: number;
  daysInactive: number;
  engagementScore: number;
  lastActivity: string;
  predictedChurnDate: string;
  retentionStage: 'onboarding' | 'active' | 'declining' | 'at_risk' | 'churned';
  recommendedActions: RetentionAction[];
  campaignHistory: string[];
}

class RetentionService {
  private config: RetentionConfig;
  private campaigns: Map<string, RetentionCampaign> = new Map();
  private userProfiles: Map<string, UserRetentionProfile> = new Map();
  private metricsCache: RetentionMetrics | null = null;
  private isInitialized = false;

  constructor(config: Partial<RetentionConfig> = {}) {
    this.config = {
      apiEndpoint: '/api/retention',
      enableDebug: false,
      defaultCampaignDuration: 30, // days
      maxRetentionActions: 5,
      churnPredictionThreshold: 0.7,
      reactivationWindow: 14, // days
      ...config
    };
  }

  /**
   * Initialize retention service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load active campaigns
      await this.loadActiveCampaigns();

      // Load user profiles
      await this.loadUserProfiles();

      // Setup periodic processing
      this.setupPeriodicProcessing();

      this.isInitialized = true;

      if (this.config.enableDebug) {

      }
    } catch (error: unknown) {
      console.error('Failed to initialize retention service:', error);
      throw error;
    }
  }

  /**
   * Create retention campaign
   */
  async createCampaign(
    campaignData: Omit<RetentionCampaign, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RetentionCampaign> {
    const campaign: RetentionCampaign = {
      ...campaignData,
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to server
    await this.saveCampaign(campaign);

    // Cache locally
    this.campaigns.set(campaign.id, campaign);

    // Track campaign creation
    const analytics = getAnalyticsService();
    analytics.track('retention_campaign_created', {
      properties: {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        target_segment: campaign.target_segment,
        actions_count: campaign.actions.length
      }
    });

    if (this.config.enableDebug) {

    }

    return campaign;
  }

  /**
   * Get user retention profile
   */
  async getUserProfile(userId: string): Promise<UserRetentionProfile | null> {
    const cached = this.userProfiles.get(userId);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.config.apiEndpoint}/profile/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const profile = await response.json();
      this.userProfiles.set(userId, profile);
      return profile;
    } catch (error: unknown) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }

  /**
   * Analyze user churn risk
   */
  analyzeChurnRisk(userId: string): Promise<number> {
    return new Promise(async (resolve) => {
      try {
        const engagementService = getEngagementService();
        const engagement = await engagementService.getUserEngagement(userId);

        if (!engagement) {
          resolve(0.5); // Default risk for unknown users
          return;
        }

        // Calculate churn risk based on multiple factors
        const daysSinceLastActive = this.daysBetween(
          engagement.last_active_date,
          new Date().toISOString()
        );

        const factors = {
          inactivity: Math.min(daysSinceLastActive / 30, 1), // 0-1 scale
          engagement: 1 - (engagement.engagement_score / 100), // Inverse of engagement
          retention: 1 - (engagement.retention_score / 100), // Inverse of retention
          sessionFrequency: Math.max(1 - (engagement.average_session_duration / 1800), 0), // 30 min baseline
          daysActive: Math.max(1 - (engagement.days_active / 30), 0) // 30 days baseline
        };

        // Weighted average
        const churnRisk = (
          factors.inactivity * 0.3 +
          factors.engagement * 0.25 +
          factors.retention * 0.25 +
          factors.sessionFrequency * 0.1 +
          factors.daysActive * 0.1
        );

        resolve(Math.min(churnRisk, 1));
      } catch (error: unknown) {
        console.error('Failed to analyze churn risk:', error);
        resolve(0.5);
      }
    });
  }

  /**
   * Get retention recommendations for user
   */
  async getRetentionRecommendations(userId: string): Promise<RetentionAction[]> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return [];

    const recommendations: RetentionAction[] = [];

    // Based on retention stage
    switch (profile.retentionStage) {
      case 'onboarding':
        recommendations.push({
          type: 'feature_highlight',
          config: {
            features: ['meal_planning', 'recipe_generator'],
            message: 'Discover powerful features to enhance your cooking experience'
          }
        });
        break;

      case 'declining':
        recommendations.push({
          type: 'personalized_recommendation',
          config: {
            type: 'recipe_suggestions',
            based_on: 'user_preferences',
            message: 'Try these recipes we think you\'ll love'
          }
        });
        break;

      case 'at_risk':
        recommendations.push({
          type: 'notification',
          config: {
            type: 'reactivation_email',
            urgency: 'high',
            incentive: 'premium_trial'
          }
        });
        break;

      case 'churned':
        recommendations.push({
          type: 'discount',
          config: {
            type: 'winback_offer',
            discount_percentage: 50,
            valid_days: 7
          }
        });
        break;
    }

    // Based on engagement score
    if (profile.engagementScore < 30) {
      recommendations.push({
        type: 'content_unlock',
        config: {
          content_type: 'premium_recipes',
          unlock_duration: 7,
          message: 'Unlock premium recipes for a week'
        }
      });
    }

    return recommendations.slice(0, this.config.maxRetentionActions);
  }

  /**
   * Execute retention action
   */
  async executeRetentionAction(
    userId: string,
    action: RetentionAction,
    campaignId?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/actions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          campaignId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Track action execution
      const analytics = getAnalyticsService();
      analytics.track('retention_action_executed', {
        properties: {
          user_id: userId,
          action_type: action.type,
          campaign_id: campaignId,
          config: action.config
        }
      });

      if (this.config.enableDebug) {

      }

      return true;
    } catch (error: unknown) {
      console.error('Failed to execute retention action:', error);
      return false;
    }
  }

  /**
   * Get retention metrics
   */
  async getRetentionMetrics(): Promise<RetentionMetrics> {
    if (this.metricsCache) return this.metricsCache;

    try {
      const response = await fetch(`${this.config.apiEndpoint}/metrics`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const metrics = await response.json();
      this.metricsCache = metrics;

      // Cache for 5 minutes
      setTimeout(() => {
        this.metricsCache = null;
      }, 5 * 60 * 1000);

      return metrics;
    } catch (error: unknown) {
      console.error('Failed to fetch retention metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get retention insights
   */
  async getRetentionInsights(): Promise<RetentionInsight[]> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/insights`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const insights = await response.json();
      return insights;
    } catch (error: unknown) {
      console.error('Failed to fetch retention insights:', error);
      return [];
    }
  }

  /**
   * Get active campaigns
   */
  getActiveCampaigns(): RetentionCampaign[] {
    return Array.from(this.campaigns.values())
      .filter(campaign => campaign.status === 'active');
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: 'active' | 'paused' | 'completed'
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    campaign.status = status;
    campaign.updated_at = new Date().toISOString();

    await this.saveCampaign(campaign);

    // Track status change
    const analytics = getAnalyticsService();
    analytics.track('retention_campaign_updated', {
      properties: {
        campaign_id: campaignId,
        new_status: status,
        campaign_name: campaign.name
      }
    });
  }

  /**
   * Process retention campaigns
   */
  private async processCampaigns(): Promise<void> {
    const activeCampaigns = this.getActiveCampaigns();

    for (const campaign of activeCampaigns) {
      try {
        await this.processCampaign(campaign);
      } catch (error: unknown) {
        console.error(`Failed to process campaign ${campaign.id}:`, error);
      }
    }
  }

  /**
   * Process individual campaign
   */
  private async processCampaign(campaign: RetentionCampaign): Promise<void> {
    // Get eligible users
    const eligibleUsers = await this.getEligibleUsers(campaign);

    for (const userId of eligibleUsers) {
      // Check if user already received this campaign
      if (await this.userReceivedCampaign(userId, campaign.id)) {
        continue;
      }

      // Execute campaign actions
      for (const action of campaign.actions) {
        const success = await this.executeRetentionAction(userId, action, campaign.id);
        
        if (success) {
          // Track successful execution
          await this.trackCampaignExecution(userId, campaign.id, action.type);
        }

        // Respect action delay
        if (action.delay_hours) {
          await new Promise(resolve => setTimeout(resolve, action.delay_hours * 3600000));
        }
      }
    }
  }

  /**
   * Get eligible users for campaign
   */
  private async getEligibleUsers(campaign: RetentionCampaign): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/campaigns/${campaign.id}/eligible-users`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const users = await response.json();
      return users;
    } catch (error: unknown) {
      console.error('Failed to get eligible users:', error);
      return [];
    }
  }

  /**
   * Check if user received campaign
   */
  private async userReceivedCampaign(userId: string, campaignId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/users/${userId}/campaigns/${campaignId}`);
      return response.ok;
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * Track campaign execution
   */
  private async trackCampaignExecution(
    userId: string,
    campaignId: string,
    actionType: string
  ): Promise<void> {
    try {
      await fetch(`${this.config.apiEndpoint}/executions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          campaignId,
          actionType,
          executedAt: new Date().toISOString()
        })
      });
    } catch (error: unknown) {
      console.error('Failed to track campaign execution:', error);
    }
  }

  /**
   * Load active campaigns from server
   */
  private async loadActiveCampaigns(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/campaigns?status=active`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const campaigns = await response.json();
      
      for (const campaign of campaigns) {
        this.campaigns.set(campaign.id, campaign);
      }
    } catch (error: unknown) {
      console.error('Failed to load active campaigns:', error);
    }
  }

  /**
   * Load user profiles from server
   */
  private async loadUserProfiles(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/profiles`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const profiles = await response.json();
      
      for (const profile of profiles) {
        this.userProfiles.set(profile.userId, profile);
      }
    } catch (error: unknown) {
      console.error('Failed to load user profiles:', error);
    }
  }

  /**
   * Save campaign to server
   */
  private async saveCampaign(campaign: RetentionCampaign): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaign)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: unknown) {
      console.error('Failed to save campaign:', error);
      throw error;
    }
  }

  /**
   * Setup periodic processing
   */
  private setupPeriodicProcessing(): void {
    // Process campaigns every hour
    setInterval(() => {
      this.processCampaigns();
    }, 3600000); // 1 hour

    // Initial processing
    setTimeout(() => {
      this.processCampaigns();
    }, 30000); // 30 seconds delay
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): RetentionMetrics {
    return {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalUsers: 0,
      retainedUsers: 0,
      retentionRate: 0,
      averageLifetimeValue: 0,
      churnRate: 0,
      reactivationRate: 0,
      campaignEffectiveness: {}
    };
  }

  /**
   * Calculate days between dates
   */
  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
  }
}

// Singleton instance
let retentionInstance: RetentionService | null = null;

/**
 * Get retention service instance
 */
export function getRetentionService(config?: Partial<RetentionConfig>): RetentionService {
  if (!retentionInstance) {
    retentionInstance = new RetentionService(config);
  }
  return retentionInstance;
}

/**
 * Initialize retention service
 */
export async function initializeRetention(config?: Partial<RetentionConfig>): Promise<RetentionService> {
  const service = getRetentionService(config);
  await service.initialize();
  return service;
}

/**
 * Create retention campaign (convenience function)
 */
export async function createRetentionCampaign(
  campaignData: Omit<RetentionCampaign, 'id' | 'created_at' | 'updated_at'>
): Promise<RetentionCampaign> {
  const service = getRetentionService();
  return service.createCampaign(campaignData);
}

/**
 * Analyze user churn risk (convenience function)
 */
export async function analyzeUserChurnRisk(userId: string): Promise<number> {
  const service = getRetentionService();
  return service.analyzeChurnRisk(userId);
}

export { RetentionService, type RetentionMetrics, type RetentionInsight, type UserRetentionProfile };