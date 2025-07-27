import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { logger } from '@/services/logger';

import { 
  AnalyticsEvent, 
  Experiment, 
  ExperimentVariant, 
  ExperimentResult,
  UserEngagement, 
  GrowthMetric, 
  FunnelAnalysis, 
  CohortAnalysis,
  GrowthInsight,
  FeatureFlag,
  NotificationConfig,
  RetentionCampaign,
  TimePeriod,
  UserSegment
} from '../types';
import { getAnalyticsService } from '../services/analyticsService';
import { getExperimentService } from '../services/experimentService';
import { getEngagementService } from '../services/engagementService';

interface GrowthState {
  // Analytics
  events: AnalyticsEvent[];
  currentSession: string | null;
  userId: string | null;
  
  // Experiments
  experiments: Experiment[];
  activeExperiments: Experiment[];
  experimentResults: Record<string, ExperimentResult[]>;
  userAssignments: Record<string, ExperimentVariant>;
  
  // Engagement
  userEngagement: UserEngagement | null;
  engagementMetrics: Record<TimePeriod, any>;
  userSegments: Record<UserSegment, number>;
  funnelAnalyses: FunnelAnalysis[];
  cohortAnalyses: CohortAnalysis[];
  
  // Growth metrics
  growthMetrics: GrowthMetric[];
  growthInsights: GrowthInsight[];
  
  // Feature flags
  featureFlags: FeatureFlag[];
  activeFlags: Record<string, any>;
  
  // Notifications & Retention
  notificationConfigs: NotificationConfig[];
  retentionCampaigns: RetentionCampaign[];
  
  // UI State
  selectedTimePeriod: TimePeriod;
  selectedSegment: UserSegment | null;
  selectedExperiment: string | null;
  selectedFunnel: string | null;
  dashboardLoading: boolean;
  error: string | null;
  
  // Filters
  dateRange: { start: string; end: string };
  filters: {
    eventTypes: string[];
    userSegments: UserSegment[];
    experimentStatus: string[];
  };
}

interface GrowthActions {
  // Analytics actions
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackPageView: (pageName?: string, properties?: Record<string, any>) => void;
  trackConversion: (conversionName: string, value?: number, properties?: Record<string, any>) => void;
  identifyUser: (userId: string, traits?: Record<string, any>) => void;
  
  // Experiment actions
  createExperiment: (options: any) => Promise<Experiment>;
  startExperiment: (experimentId: string) => Promise<void>;
  stopExperiment: (experimentId: string) => Promise<void>;
  getExperimentAssignment: (experimentId: string) => Promise<ExperimentVariant | null>;
  recordExperimentConversion: (experimentId: string, metricName: string, value?: number) => void;
  loadExperiments: () => Promise<void>;
  loadExperimentResults: (experimentId: string) => Promise<void>;
  
  // Engagement actions
  trackEngagement: (eventType: string, properties?: Record<string, any>) => void;
  loadUserEngagement: () => Promise<void>;
  loadEngagementMetrics: (period: TimePeriod) => Promise<void>;
  loadUserSegments: () => Promise<void>;
  loadFunnelAnalysis: (funnelId: string, period: TimePeriod) => Promise<void>;
  loadCohortAnalysis: (cohortType: 'daily' | 'weekly' | 'monthly', periods: number) => Promise<void>;
  
  // Growth metrics actions
  loadGrowthMetrics: (period: TimePeriod) => Promise<void>;
  loadGrowthInsights: () => Promise<void>;
  
  // Feature flags actions
  loadFeatureFlags: () => Promise<void>;
  evaluateFeatureFlag: (flagKey: string, defaultValue?: any) => any;
  updateFeatureFlag: (flagId: string, updates: Partial<FeatureFlag>) => Promise<void>;
  
  // Retention actions
  createRetentionCampaign: (campaign: Omit<RetentionCampaign, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  loadRetentionCampaigns: () => Promise<void>;
  
  // UI actions
  setTimePeriod: (period: TimePeriod) => void;
  setSelectedSegment: (segment: UserSegment | null) => void;
  setSelectedExperiment: (experimentId: string | null) => void;
  setSelectedFunnel: (funnelId: string | null) => void;
  setDateRange: (range: { start: string; end: string }) => void;
  setFilters: (filters: Partial<GrowthState['filters']>) => void;
  
  // Utility actions
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearCache: () => void;
  refreshDashboard: () => Promise<void>;
}

type GrowthStore = GrowthState & GrowthActions;

const initialState: GrowthState = {
  // Analytics
  events: [],
  currentSession: null,
  userId: null,
  
  // Experiments
  experiments: [],
  activeExperiments: [],
  experimentResults: {},
  userAssignments: {},
  
  // Engagement
  userEngagement: null,
  engagementMetrics: {},
  userSegments: {} as Record<UserSegment, number>,
  funnelAnalyses: [],
  cohortAnalyses: [],
  
  // Growth metrics
  growthMetrics: [],
  growthInsights: [],
  
  // Feature flags
  featureFlags: [],
  activeFlags: {},
  
  // Notifications & Retention
  notificationConfigs: [],
  retentionCampaigns: [],
  
  // UI State
  selectedTimePeriod: 'week',
  selectedSegment: null,
  selectedExperiment: null,
  selectedFunnel: null,
  dashboardLoading: false,
  error: null,
  
  // Filters
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  },
  filters: {
    eventTypes: [],
    userSegments: [],
    experimentStatus: []
  }
};

export const useGrowthStore = create<GrowthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Analytics actions
        trackEvent: (eventName: string, properties?: Record<string, any>) => {
          const analytics = getAnalyticsService();
          analytics.track(eventName, { properties });
        },
        
        trackPageView: (pageName?: string, properties?: Record<string, any>) => {
          const analytics = getAnalyticsService();
          analytics.page(pageName, properties);
        },
        
        trackConversion: (conversionName: string, value?: number, properties?: Record<string, any>) => {
          const analytics = getAnalyticsService();
          analytics.conversion(conversionName, value, properties);
        },
        
        identifyUser: (userId: string, traits?: Record<string, any>) => {
          const analytics = getAnalyticsService();
          analytics.identify(userId, traits);
          
          set((state) => ({
            ...state,
            userId
          }));
        },
        
        // Experiment actions
        createExperiment: async (options: any) => {
          try {
            set((state) => ({ ...state, dashboardLoading: true, error: null }));
            
            const experimentService = getExperimentService();
            const experiment = await experimentService.createExperiment(options, get().userId || 'system');
            
            set((state) => ({
              ...state,
              experiments: [...state.experiments, experiment],
              dashboardLoading: false
            }));
            
            return experiment;
          } catch (error: unknown) {
            set((state) => ({
              ...state,
              error: error instanceof Error ? error.message : 'Failed to create experiment',
              dashboardLoading: false
            }));
            throw error;
          }
        },
        
        startExperiment: async (experimentId: string) => {
          try {
            const experimentService = getExperimentService();
            await experimentService.startExperiment(experimentId);
            
            set((state) => ({
              ...state,
              experiments: state.experiments.map(exp =>
                exp.id === experimentId ? { ...exp, status: 'running' as const } : exp
              ),
              activeExperiments: state.experiments.filter(exp => 
                exp.id === experimentId ? true : exp.status === 'running'
              )
            }));
          } catch (error: unknown) {
            set((state) => ({
              ...state,
              error: error instanceof Error ? error.message : 'Failed to start experiment'
            }));
            throw error;
          }
        },
        
        stopExperiment: async (experimentId: string) => {
          try {
            const experimentService = getExperimentService();
            await experimentService.stopExperiment(experimentId);
            
            set((state) => ({
              ...state,
              experiments: state.experiments.map(exp =>
                exp.id === experimentId ? { ...exp, status: 'completed' as const } : exp
              ),
              activeExperiments: state.activeExperiments.filter(exp => exp.id !== experimentId)
            }));
          } catch (error: unknown) {
            set((state) => ({
              ...state,
              error: error instanceof Error ? error.message : 'Failed to stop experiment'
            }));
            throw error;
          }
        },
        
        getExperimentAssignment: async (experimentId: string) => {
          try {
            const experimentService = getExperimentService();
            const { userId } = get();
            
            if (!userId) return null;
            
            const variant = await experimentService.getAssignment(experimentId, {
              userId,
              sessionId: get().currentSession || 'unknown',
              deviceType: 'desktop',
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            });
            
            if (variant) {
              set((state) => ({
                ...state,
                userAssignments: {
                  ...state.userAssignments,
                  [experimentId]: variant
                }
              }));
            }
            
            return variant;
          } catch (error: unknown) {
            logger.error('Failed to get experiment assignment:', 'growth-stack:growthStore', error);
            return null;
          }
        },
        
        recordExperimentConversion: (experimentId: string, metricName: string, value?: number) => {
          const experimentService = getExperimentService();
          const { userId } = get();
          
          if (!userId) return;
          
          experimentService.recordConversion(experimentId, userId, metricName, value);
        },
        
        loadExperiments: async () => {
          try {
            set((state) => ({ ...state, dashboardLoading: true, error: null }));
            
            const response = await fetch('/api/experiments');
            if (!response.ok) throw new Error('Failed to load experiments');
            
            const experiments = await response.json();
            const activeExperiments = experiments.filter((exp: Experiment) => exp.status === 'running');
            
            set((state) => ({
              ...state,
              experiments,
              activeExperiments,
              dashboardLoading: false
            }));
          } catch (error: unknown) {
            set((state) => ({
              ...state,
              error: error instanceof Error ? error.message : 'Failed to load experiments',
              dashboardLoading: false
            }));
          }
        },
        
        loadExperimentResults: async (experimentId: string) => {
          try {
            const experimentService = getExperimentService();
            const results = await experimentService.getExperimentResults(experimentId);
            
            set((state) => ({
              ...state,
              experimentResults: {
                ...state.experimentResults,
                [experimentId]: results
              }
            }));
          } catch (error: unknown) {
            logger.error('Failed to load experiment results:', 'growth-stack:growthStore', error);
          }
        },
        
        // Engagement actions
        trackEngagement: (eventType: string, properties?: Record<string, any>) => {
          const engagementService = getEngagementService();
          const { userId } = get();
          
          if (!userId) return;
          
          engagementService.trackEngagement(userId, eventType, properties);
        },
        
        loadUserEngagement: async () => {
          try {
            const engagementService = getEngagementService();
            const { userId } = get();
            
            if (!userId) return;
            
            const engagement = await engagementService.getUserEngagement(userId);
            
            set((state) => ({
              ...state,
              userEngagement: engagement
            }));
          } catch (error: unknown) {
            logger.error('Failed to load user engagement:', 'growth-stack:growthStore', error);
          }
        },
        
        loadEngagementMetrics: async (period: TimePeriod) => {
          try {
            const engagementService = getEngagementService();
            const metrics = await engagementService.getEngagementMetrics(period);
            
            set((state) => ({
              ...state,
              engagementMetrics: {
                ...state.engagementMetrics,
                [period]: metrics
              }
            }));
          } catch (error: unknown) {
            logger.error('Failed to load engagement metrics:', 'growth-stack:growthStore', error);
          }
        },
        
        loadUserSegments: async () => {
          try {
            const engagementService = getEngagementService();
            const segments = await engagementService.getUserSegments();
            
            set((state) => ({
              ...state,
              userSegments: segments
            }));
          } catch (error: unknown) {
            logger.error('Failed to load user segments:', 'growth-stack:growthStore', error);
          }
        },
        
        loadFunnelAnalysis: async (funnelId: string, period: TimePeriod) => {
          try {
            const engagementService = getEngagementService();
            const analysis = await engagementService.getFunnelAnalysis(funnelId, period);
            
            if (analysis) {
              set((state) => ({
                ...state,
                funnelAnalyses: [
                  ...state.funnelAnalyses.filter(f => f.id !== funnelId),
                  analysis
                ]
              }));
            }
          } catch (error: unknown) {
            logger.error('Failed to load funnel analysis:', 'growth-stack:growthStore', error);
          }
        },
        
        loadCohortAnalysis: async (cohortType: 'daily' | 'weekly' | 'monthly', periods: number) => {
          try {
            const engagementService = getEngagementService();
            const analyses = await engagementService.getCohortAnalysis(cohortType, periods);
            
            set((state) => ({
              ...state,
              cohortAnalyses: analyses
            }));
          } catch (error: unknown) {
            logger.error('Failed to load cohort analysis:', 'growth-stack:growthStore', error);
          }
        },
        
        // Growth metrics actions
        loadGrowthMetrics: async (period: TimePeriod) => {
          try {
            const response = await fetch(`/api/growth/metrics?period=${period}`);
            if (!response.ok) throw new Error('Failed to load growth metrics');
            
            const metrics = await response.json();
            
            set((state) => ({
              ...state,
              growthMetrics: metrics
            }));
          } catch (error: unknown) {
            logger.error('Failed to load growth metrics:', 'growth-stack:growthStore', error);
          }
        },
        
        loadGrowthInsights: async () => {
          try {
            const engagementService = getEngagementService();
            const insights = await engagementService.getEngagementInsights();
            
            set((state) => ({
              ...state,
              growthInsights: insights
            }));
          } catch (error: unknown) {
            logger.error('Failed to load growth insights:', 'growth-stack:growthStore', error);
          }
        },
        
        // Feature flags actions
        loadFeatureFlags: async () => {
          try {
            const response = await fetch('/api/feature-flags');
            if (!response.ok) throw new Error('Failed to load feature flags');
            
            const flags = await response.json();
            
            set((state) => ({
              ...state,
              featureFlags: flags
            }));
          } catch (error: unknown) {
            logger.error('Failed to load feature flags:', 'growth-stack:growthStore', error);
          }
        },
        
        evaluateFeatureFlag: (flagKey: string, defaultValue: any = false) => {
          const { featureFlags, userId } = get();
          const flag = featureFlags.find(f => f.key === flagKey);
          
          if (!flag || !flag.is_active) {
            return defaultValue;
          }
          
          // Simple evaluation - in real implementation, this would consider targeting rules
          return flag.default_value;
        },
        
        updateFeatureFlag: async (flagId: string, updates: Partial<FeatureFlag>) => {
          try {
            const response = await fetch(`/api/feature-flags/${flagId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });
            
            if (!response.ok) throw new Error('Failed to update feature flag');
            
            const updatedFlag = await response.json();
            
            set((state) => ({
              ...state,
              featureFlags: state.featureFlags.map(flag =>
                flag.id === flagId ? updatedFlag : flag
              )
            }));
          } catch (error: unknown) {
            logger.error('Failed to update feature flag:', 'growth-stack:growthStore', error);
          }
        },
        
        // Retention actions
        createRetentionCampaign: async (campaign: Omit<RetentionCampaign, 'id' | 'created_at' | 'updated_at'>) => {
          try {
            const response = await fetch('/api/retention/campaigns', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(campaign)
            });
            
            if (!response.ok) throw new Error('Failed to create retention campaign');
            
            const newCampaign = await response.json();
            
            set((state) => ({
              ...state,
              retentionCampaigns: [...state.retentionCampaigns, newCampaign]
            }));
          } catch (error: unknown) {
            logger.error('Failed to create retention campaign:', 'growth-stack:growthStore', error);
          }
        },
        
        loadRetentionCampaigns: async () => {
          try {
            const response = await fetch('/api/retention/campaigns');
            if (!response.ok) throw new Error('Failed to load retention campaigns');
            
            const campaigns = await response.json();
            
            set((state) => ({
              ...state,
              retentionCampaigns: campaigns
            }));
          } catch (error: unknown) {
            logger.error('Failed to load retention campaigns:', 'growth-stack:growthStore', error);
          }
        },
        
        // UI actions
        setTimePeriod: (period: TimePeriod) => {
          set((state) => ({ ...state, selectedTimePeriod: period }));
        },
        
        setSelectedSegment: (segment: UserSegment | null) => {
          set((state) => ({ ...state, selectedSegment: segment }));
        },
        
        setSelectedExperiment: (experimentId: string | null) => {
          set((state) => ({ ...state, selectedExperiment: experimentId }));
        },
        
        setSelectedFunnel: (funnelId: string | null) => {
          set((state) => ({ ...state, selectedFunnel: funnelId }));
        },
        
        setDateRange: (range: { start: string; end: string }) => {
          set((state) => ({ ...state, dateRange: range }));
        },
        
        setFilters: (filters: Partial<GrowthState['filters']>) => {
          set((state) => ({
            ...state,
            filters: { ...state.filters, ...filters }
          }));
        },
        
        // Utility actions
        setError: (error: string | null) => {
          set((state) => ({ ...state, error }));
        },
        
        setLoading: (loading: boolean) => {
          set((state) => ({ ...state, dashboardLoading: loading }));
        },
        
        clearCache: () => {
          set({
            ...initialState,
            userId: get().userId // Preserve user ID
          });
        },
        
        refreshDashboard: async () => {
          const { selectedTimePeriod, loadExperiments, loadEngagementMetrics, loadUserSegments, loadGrowthMetrics, loadGrowthInsights } = get();
          
          try {
            set((state) => ({ ...state, dashboardLoading: true, error: null }));
            
            await Promise.all([
              loadExperiments(),
              loadEngagementMetrics(selectedTimePeriod),
              loadUserSegments(),
              loadGrowthMetrics(selectedTimePeriod),
              loadGrowthInsights()
            ]);
          } catch (error: unknown) {
            set((state) => ({
              ...state,
              error: error instanceof Error ? error.message : 'Failed to refresh dashboard'
            }));
          } finally {
            set((state) => ({ ...state, dashboardLoading: false }));
          }
        }
      }),
      {
        name: 'growth-store',
        partialize: (state) => ({
          userId: state.userId,
          selectedTimePeriod: state.selectedTimePeriod,
          dateRange: state.dateRange,
          filters: state.filters
        })
      }
    )
  )
);