import { EngagementService, getEngagementService, initializeEngagement } from '../services/engagementService';
import { UserEngagement, TimePeriod } from '../types';

// Mock fetch
global.fetch = jest.fn();

// Mock analytics service
jest.mock('../services/analyticsService', () => ({
  getAnalyticsService: () => ({
    track: jest.fn()
  })
}));

describe('EngagementService', () => {
  let service: EngagementService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    } as Response);

    service = new EngagementService({
      enableDebug: false,
      cacheDuration: 1000,
      churnThresholdDays: 30,
      powerUserThreshold: 10
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await service.initialize();

      expect(mockFetch).toHaveBeenCalledWith('/api/engagement/activities');
    });

    it('should handle initialization errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.initialize()).rejects.toThrow();
    });
  });

  describe('engagement tracking', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await service.initialize();
    });

    it('should track engagement event', () => {
      service.trackEngagement('user123', 'page_view', { page: 'home' });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should track different event types', () => {
      service.trackEngagement('user123', 'recipe_view', { recipe_id: 'recipe123' });
      service.trackEngagement('user123', 'action', { action_type: 'button_click' });
      service.trackEngagement('user123', 'conversion', { conversion_type: 'signup' });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('user engagement metrics', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await service.initialize();
    });

    it('should fetch user engagement', async () => {
      const mockEngagement: UserEngagement = {
        user_id: 'user123',
        total_sessions: 10,
        total_session_duration: 3600,
        average_session_duration: 360,
        days_active: 5,
        last_active_date: new Date().toISOString(),
        first_visit_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        page_views: 50,
        recipes_viewed: 20,
        recipes_created: 3,
        meal_plans_created: 2,
        engagement_score: 75,
        retention_score: 80,
        churn_risk: 'low'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEngagement
      } as Response);

      const engagement = await service.getUserEngagement('user123');

      expect(engagement).toEqual(mockEngagement);
      expect(mockFetch).toHaveBeenCalledWith('/api/engagement/user/user123');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const engagement = await service.getUserEngagement('user123');

      expect(engagement).toBeNull();
    });

    it('should cache user engagement', async () => {
      const mockEngagement: UserEngagement = {
        user_id: 'user123',
        total_sessions: 10,
        total_session_duration: 3600,
        average_session_duration: 360,
        days_active: 5,
        last_active_date: new Date().toISOString(),
        first_visit_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        page_views: 50,
        recipes_viewed: 20,
        recipes_created: 3,
        meal_plans_created: 2,
        engagement_score: 75,
        retention_score: 80,
        churn_risk: 'low'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEngagement
      } as Response);

      // First call
      const engagement1 = await service.getUserEngagement('user123');
      
      // Second call should use cache
      const engagement2 = await service.getUserEngagement('user123');

      expect(engagement1).toEqual(mockEngagement);
      expect(engagement2).toEqual(mockEngagement);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('engagement metrics', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await service.initialize();
    });

    it('should fetch engagement metrics', async () => {
      const mockMetrics = {
        dailyActiveUsers: 100,
        weeklyActiveUsers: 500,
        monthlyActiveUsers: 2000,
        averageSessionDuration: 300,
        averageSessionsPerUser: 2.5,
        retentionRate: 0.75,
        churnRate: 0.25,
        engagementScore: 70
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics
      } as Response);

      const metrics = await service.getEngagementMetrics('week');

      expect(metrics).toEqual(mockMetrics);
      expect(mockFetch).toHaveBeenCalledWith('/api/engagement/metrics?period=week');
    });

    it('should handle different time periods', async () => {
      const periods: TimePeriod[] = ['day', 'week', 'month', 'quarter'];

      for (const period of periods) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        } as Response);

        await service.getEngagementMetrics(period);

        expect(mockFetch).toHaveBeenCalledWith(`/api/engagement/metrics?period=${period}`);
      }
    });

    it('should return default metrics on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const metrics = await service.getEngagementMetrics('week');

      expect(metrics.dailyActiveUsers).toBe(0);
      expect(metrics.weeklyActiveUsers).toBe(0);
      expect(metrics.engagementScore).toBe(0);
    });
  });

  describe('user segments', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await service.initialize();
    });

    it('should fetch user segments', async () => {
      const mockSegments = {
        new_users: 100,
        returning_users: 300,
        power_users: 50,
        at_risk_users: 20,
        churned_users: 30
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSegments
      } as Response);

      const segments = await service.getUserSegments();

      expect(segments).toEqual(mockSegments);
      expect(mockFetch).toHaveBeenCalledWith('/api/engagement/segments');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const segments = await service.getUserSegments();

      expect(segments).toEqual({});
    });
  });

  describe('funnel analysis', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await service.initialize();
    });

    it('should fetch funnel analysis', async () => {
      const mockFunnel = {
        id: 'funnel123',
        name: 'Onboarding Funnel',
        description: 'User onboarding flow',
        steps: [
          { id: 'step1', name: 'Sign up', event_name: 'signup', order: 1 },
          { id: 'step2', name: 'Complete profile', event_name: 'profile_complete', order: 2 },
          { id: 'step3', name: 'First recipe', event_name: 'recipe_view', order: 3 }
        ],
        conversion_rates: {
          'step1': 1.0,
          'step2': 0.75,
          'step3': 0.5
        },
        drop_off_rates: {
          'step1': 0.0,
          'step2': 0.25,
          'step3': 0.25
        },
        total_users: 1000,
        completed_users: 500,
        overall_conversion_rate: 0.5,
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunnel
      } as Response);

      const funnel = await service.getFunnelAnalysis('funnel123', 'week');

      expect(funnel).toEqual(mockFunnel);
      expect(mockFetch).toHaveBeenCalledWith('/api/engagement/funnel/funnel123?period=week');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const funnel = await service.getFunnelAnalysis('funnel123', 'week');

      expect(funnel).toBeNull();
    });
  });

  describe('cohort analysis', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await service.initialize();
    });

    it('should fetch cohort analysis', async () => {
      const mockCohorts = [
        {
          cohort_period: '2023-01',
          cohort_size: 100,
          retention_rates: {
            'week1': 0.8,
            'week2': 0.6,
            'week3': 0.4,
            'week4': 0.3
          },
          revenue_per_cohort: 1000,
          ltv_estimate: 150
        },
        {
          cohort_period: '2023-02',
          cohort_size: 120,
          retention_rates: {
            'week1': 0.85,
            'week2': 0.65,
            'week3': 0.45,
            'week4': 0.35
          },
          revenue_per_cohort: 1200,
          ltv_estimate: 180
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCohorts
      } as Response);

      const cohorts = await service.getCohortAnalysis('weekly', 4);

      expect(cohorts).toEqual(mockCohorts);
      expect(mockFetch).toHaveBeenCalledWith('/api/engagement/cohort?type=weekly&periods=4');
    });

    it('should handle different cohort types', async () => {
      const cohortTypes: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];

      for (const type of cohortTypes) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

        await service.getCohortAnalysis(type, 12);

        expect(mockFetch).toHaveBeenCalledWith(`/api/engagement/cohort?type=${type}&periods=12`);
      }
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const cohorts = await service.getCohortAnalysis('weekly', 4);

      expect(cohorts).toEqual([]);
    });
  });

  describe('engagement insights', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await service.initialize();
    });

    it('should fetch engagement insights', async () => {
      const mockInsights = [
        {
          type: 'opportunity',
          title: 'Increase Recipe Engagement',
          description: 'Users who view recipes have 40% higher retention',
          impact: 'high',
          recommendation: 'Promote recipe discovery in onboarding',
          data: { metric: 'retention_rate', improvement: 0.4 }
        },
        {
          type: 'warning',
          title: 'High Churn in Week 2',
          description: 'Users are churning at high rates in their second week',
          impact: 'medium',
          recommendation: 'Implement week 2 retention campaign',
          data: { churn_rate: 0.3, period: 'week2' }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsights
      } as Response);

      const insights = await service.getEngagementInsights();

      expect(insights).toEqual(mockInsights);
      expect(mockFetch).toHaveBeenCalledWith('/api/engagement/insights');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const insights = await service.getEngagementInsights();

      expect(insights).toEqual([]);
    });
  });

  describe('engagement scoring', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      await service.initialize();
    });

    it('should calculate engagement score', () => {
      const activity = {
        userId: 'user123',
        sessionCount: 10,
        totalDuration: 3600,
        lastActive: new Date().toISOString(),
        firstVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        pageViews: 50,
        actions: 20,
        conversions: 2,
        engagementEvents: ['page_view', 'recipe_view', 'action']
      };

      const score = service.calculateEngagementScore(activity);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate retention score', () => {
      const activity = {
        userId: 'user123',
        sessionCount: 10,
        totalDuration: 3600,
        lastActive: new Date().toISOString(),
        firstVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        pageViews: 50,
        actions: 20,
        conversions: 2,
        engagementEvents: ['page_view', 'recipe_view', 'action']
      };

      const score = service.calculateRetentionScore(activity);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should determine user segment', () => {
      const newUserActivity = {
        userId: 'user123',
        sessionCount: 1,
        totalDuration: 300,
        lastActive: new Date().toISOString(),
        firstVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        pageViews: 5,
        actions: 2,
        conversions: 0,
        engagementEvents: ['page_view', 'action']
      };

      const segment = service.determineUserSegment(newUserActivity);

      expect(segment).toBe('new_users');
    });

    it('should assess churn risk', () => {
      const atRiskActivity = {
        userId: 'user123',
        sessionCount: 5,
        totalDuration: 1800,
        lastActive: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        firstVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        pageViews: 20,
        actions: 5,
        conversions: 1,
        engagementEvents: ['page_view', 'action']
      };

      const churnRisk = service.getChurnRisk(atRiskActivity);

      expect(churnRisk).toBe('medium');
    });
  });

  describe('singleton behavior', () => {
    it('should return same instance', () => {
      const service1 = getEngagementService();
      const service2 = getEngagementService();

      expect(service1).toBe(service2);
    });

    it('should initialize once', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

      const service1 = await initializeEngagement();
      const service2 = await initializeEngagement();

      expect(service1).toBe(service2);
    });
  });
});

describe('Engagement convenience functions', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    } as Response);
  });

  it('should track engagement with convenience function', async () => {
    const { trackEngagement } = await import('../services/engagementService');
    
    trackEngagement('user123', 'page_view', { page: 'home' });

    // Should work without throwing
    expect(true).toBe(true);
  });
});