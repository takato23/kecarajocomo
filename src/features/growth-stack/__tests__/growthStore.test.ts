import { renderHook, act } from '@testing-library/react';

import { useGrowthStore } from '../store/growthStore';

// Mock services
jest.mock('../services/analyticsService', () => ({
  getAnalyticsService: () => ({
    track: jest.fn(),
    page: jest.fn(),
    conversion: jest.fn(),
    identify: jest.fn()
  })
}));

jest.mock('../services/experimentService', () => ({
  getExperimentService: () => ({
    createExperiment: jest.fn().mockResolvedValue({
      id: 'exp123',
      name: 'Test Experiment',
      status: 'draft',
      variants: []
    }),
    startExperiment: jest.fn().mockResolvedValue(undefined),
    stopExperiment: jest.fn().mockResolvedValue(undefined),
    getAssignment: jest.fn().mockResolvedValue({
      id: 'variant123',
      name: 'Control',
      is_control: true
    }),
    recordConversion: jest.fn(),
    getExperimentResults: jest.fn().mockResolvedValue([])
  })
}));

jest.mock('../services/engagementService', () => ({
  getEngagementService: () => ({
    trackEngagement: jest.fn(),
    getUserEngagement: jest.fn().mockResolvedValue({
      user_id: 'user123',
      engagement_score: 75,
      retention_score: 80
    }),
    getEngagementMetrics: jest.fn().mockResolvedValue({
      dailyActiveUsers: 100,
      weeklyActiveUsers: 500,
      engagementScore: 70
    }),
    getUserSegments: jest.fn().mockResolvedValue({
      new_users: 100,
      returning_users: 300,
      power_users: 50
    }),
    getFunnelAnalysis: jest.fn().mockResolvedValue({
      id: 'funnel123',
      name: 'Test Funnel',
      conversion_rates: {}
    }),
    getCohortAnalysis: jest.fn().mockResolvedValue([]),
    getEngagementInsights: jest.fn().mockResolvedValue([])
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('useGrowthStore', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    } as Response);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      expect(result.current.events).toEqual([]);
      expect(result.current.currentSession).toBeNull();
      expect(result.current.userId).toBeNull();
      expect(result.current.experiments).toEqual([]);
      expect(result.current.selectedTimePeriod).toBe('week');
      expect(result.current.dashboardLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('analytics actions', () => {
    it('should track event', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.trackEvent('test_event', { key: 'value' });
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should track page view', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.trackPageView('Test Page', { section: 'main' });
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should track conversion', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.trackConversion('signup', 100, { source: 'organic' });
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should identify user', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.identifyUser('user123', { name: 'John Doe' });
      });

      expect(result.current.userId).toBe('user123');
    });
  });

  describe('experiment actions', () => {
    it('should create experiment', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        const experiment = await result.current.createExperiment({
          name: 'Test Experiment',
          description: 'A test experiment',
          variants: []
        });
        
        expect(experiment.id).toBe('exp123');
      });

      expect(result.current.experiments).toHaveLength(1);
    });

    it('should start experiment', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      // Create experiment first
      await act(async () => {
        await result.current.createExperiment({
          name: 'Test Experiment',
          description: 'A test experiment',
          variants: []
        });
      });

      await act(async () => {
        await result.current.startExperiment('exp123');
      });

      const experiment = result.current.experiments.find(e => e.id === 'exp123');
      expect(experiment?.status).toBe('running');
    });

    it('should stop experiment', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      // Create and start experiment first
      await act(async () => {
        await result.current.createExperiment({
          name: 'Test Experiment',
          description: 'A test experiment',
          variants: []
        });
        await result.current.startExperiment('exp123');
      });

      await act(async () => {
        await result.current.stopExperiment('exp123');
      });

      const experiment = result.current.experiments.find(e => e.id === 'exp123');
      expect(experiment?.status).toBe('completed');
    });

    it('should get experiment assignment', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.identifyUser('user123');
      });

      await act(async () => {
        const variant = await result.current.getExperimentAssignment('exp123');
        expect(variant?.id).toBe('variant123');
      });

      expect(result.current.userAssignments['exp123']).toBeTruthy();
    });

    it('should record experiment conversion', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.identifyUser('user123');
        result.current.recordExperimentConversion('exp123', 'signup', 1);
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should load experiments', async () => {
      const mockExperiments = [
        { id: 'exp1', name: 'Experiment 1', status: 'running' },
        { id: 'exp2', name: 'Experiment 2', status: 'completed' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExperiments
      } as Response);

      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadExperiments();
      });

      expect(result.current.experiments).toEqual(mockExperiments);
      expect(result.current.activeExperiments).toHaveLength(1);
    });

    it('should load experiment results', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadExperimentResults('exp123');
      });

      expect(result.current.experimentResults['exp123']).toBeTruthy();
    });
  });

  describe('engagement actions', () => {
    it('should track engagement', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.identifyUser('user123');
        result.current.trackEngagement('page_view', { page: 'home' });
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should load user engagement', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.identifyUser('user123');
      });

      await act(async () => {
        await result.current.loadUserEngagement();
      });

      expect(result.current.userEngagement).toBeTruthy();
      expect(result.current.userEngagement?.engagement_score).toBe(75);
    });

    it('should load engagement metrics', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadEngagementMetrics('week');
      });

      expect(result.current.engagementMetrics['week']).toBeTruthy();
      expect(result.current.engagementMetrics['week'].dailyActiveUsers).toBe(100);
    });

    it('should load user segments', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadUserSegments();
      });

      expect(result.current.userSegments).toBeTruthy();
      expect(result.current.userSegments.new_users).toBe(100);
    });

    it('should load funnel analysis', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadFunnelAnalysis('funnel123', 'week');
      });

      expect(result.current.funnelAnalyses).toHaveLength(1);
      expect(result.current.funnelAnalyses[0].id).toBe('funnel123');
    });

    it('should load cohort analysis', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadCohortAnalysis('weekly', 4);
      });

      expect(result.current.cohortAnalyses).toEqual([]);
    });
  });

  describe('growth metrics actions', () => {
    it('should load growth metrics', async () => {
      const mockMetrics = [
        { name: 'DAU', value: 100, trend: 'up' },
        { name: 'Conversion', value: 0.15, trend: 'down' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics
      } as Response);

      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadGrowthMetrics('week');
      });

      expect(result.current.growthMetrics).toEqual(mockMetrics);
    });

    it('should load growth insights', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadGrowthInsights();
      });

      expect(result.current.growthInsights).toEqual([]);
    });
  });

  describe('feature flags actions', () => {
    it('should load feature flags', async () => {
      const mockFlags = [
        { id: 'flag1', key: 'new_feature', is_active: true, default_value: true },
        { id: 'flag2', key: 'experiment_feature', is_active: false, default_value: false }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFlags
      } as Response);

      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadFeatureFlags();
      });

      expect(result.current.featureFlags).toEqual(mockFlags);
    });

    it('should evaluate feature flag', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.featureFlags = [
          { id: 'flag1', key: 'new_feature', is_active: true, default_value: true, name: 'New Feature', description: '', type: 'boolean', variations: [], targeting_rules: [], created_at: '', updated_at: '' }
        ];
      });

      const value = result.current.evaluateFeatureFlag('new_feature', false);
      expect(value).toBe(true);
    });

    it('should return default value for inactive flag', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.featureFlags = [
          { id: 'flag1', key: 'new_feature', is_active: false, default_value: true, name: 'New Feature', description: '', type: 'boolean', variations: [], targeting_rules: [], created_at: '', updated_at: '' }
        ];
      });

      const value = result.current.evaluateFeatureFlag('new_feature', false);
      expect(value).toBe(false);
    });

    it('should update feature flag', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.featureFlags = [
          { id: 'flag1', key: 'new_feature', is_active: false, default_value: true, name: 'New Feature', description: '', type: 'boolean', variations: [], targeting_rules: [], created_at: '', updated_at: '' }
        ];
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'flag1', key: 'new_feature', is_active: true, default_value: true })
      } as Response);

      await act(async () => {
        await result.current.updateFeatureFlag('flag1', { is_active: true });
      });

      const flag = result.current.featureFlags.find(f => f.id === 'flag1');
      expect(flag?.is_active).toBe(true);
    });
  });

  describe('retention actions', () => {
    it('should create retention campaign', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      const campaign = {
        name: 'Reactivation Campaign',
        description: 'Bring back inactive users',
        target_segment: 'at_risk_users',
        trigger_conditions: [],
        actions: [],
        status: 'active' as const,
        success_metrics: [],
        start_date: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...campaign, id: 'campaign123' })
      } as Response);

      await act(async () => {
        await result.current.createRetentionCampaign(campaign);
      });

      expect(result.current.retentionCampaigns).toHaveLength(1);
    });

    it('should load retention campaigns', async () => {
      const mockCampaigns = [
        { id: 'campaign1', name: 'Campaign 1', status: 'active' },
        { id: 'campaign2', name: 'Campaign 2', status: 'paused' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaigns
      } as Response);

      const { result } = renderHook(() => useGrowthStore());
      
      await act(async () => {
        await result.current.loadRetentionCampaigns();
      });

      expect(result.current.retentionCampaigns).toEqual(mockCampaigns);
    });
  });

  describe('UI actions', () => {
    it('should set time period', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.setTimePeriod('month');
      });

      expect(result.current.selectedTimePeriod).toBe('month');
    });

    it('should set selected segment', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.setSelectedSegment('power_users');
      });

      expect(result.current.selectedSegment).toBe('power_users');
    });

    it('should set selected experiment', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.setSelectedExperiment('exp123');
      });

      expect(result.current.selectedExperiment).toBe('exp123');
    });

    it('should set selected funnel', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.setSelectedFunnel('funnel123');
      });

      expect(result.current.selectedFunnel).toBe('funnel123');
    });

    it('should set date range', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      const range = {
        start: '2023-01-01',
        end: '2023-01-31'
      };

      act(() => {
        result.current.setDateRange(range);
      });

      expect(result.current.dateRange).toEqual(range);
    });

    it('should set filters', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.setFilters({
          eventTypes: ['page_view', 'conversion'],
          userSegments: ['new_users', 'power_users']
        });
      });

      expect(result.current.filters.eventTypes).toEqual(['page_view', 'conversion']);
      expect(result.current.filters.userSegments).toEqual(['new_users', 'power_users']);
    });
  });

  describe('utility actions', () => {
    it('should set error', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });

    it('should set loading', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.dashboardLoading).toBe(true);
    });

    it('should clear cache', () => {
      const { result } = renderHook(() => useGrowthStore());
      
      act(() => {
        result.current.identifyUser('user123');
        result.current.experiments = [{ id: 'exp1' } as any];
        result.current.clearCache();
      });

      expect(result.current.experiments).toEqual([]);
      expect(result.current.userId).toBe('user123'); // Should preserve user ID
    });

    it('should refresh dashboard', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ([])
      } as Response);

      await act(async () => {
        await result.current.refreshDashboard();
      });

      expect(result.current.dashboardLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle experiment creation error', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      const mockError = new Error('Creation failed');
      
      // Mock the experiment service to throw an error
      jest.doMock('../services/experimentService', () => ({
        getExperimentService: () => ({
          createExperiment: jest.fn().mockRejectedValue(mockError)
        })
      }));

      await act(async () => {
        try {
          await result.current.createExperiment({
            name: 'Test Experiment',
            description: 'A test experiment',
            variants: []
          });
        } catch (error: unknown) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.error).toBe('Creation failed');
    });

    it('should handle dashboard refresh error', async () => {
      const { result } = renderHook(() => useGrowthStore());
      
      mockFetch.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.refreshDashboard();
      });

      expect(result.current.error).toBe('Failed to refresh dashboard');
    });
  });
});