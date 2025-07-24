import { ExperimentService, getExperimentService, initializeExperiments } from '../services/experimentService';
import { Experiment } from '../types';

// Mock fetch
global.fetch = jest.fn();

// Mock analytics service
jest.mock('../services/analyticsService', () => ({
  getAnalyticsService: () => ({
    track: jest.fn()
  })
}));

describe('ExperimentService', () => {
  let service: ExperimentService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    } as Response);

    service = new ExperimentService({
      enableDebug: false,
      stickyAssignments: true,
      defaultTrafficAllocation: 100
    });
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      await service.initialize();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/experiments?status=running');
      expect(mockFetch).toHaveBeenCalledWith('/api/experiments/assignments');
    });

    it('should handle initialization errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.initialize()).rejects.toThrow();
    });
  });

  describe('experiment creation', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      await service.initialize();
    });

    it('should create experiment successfully', async () => {
      const options = {
        name: 'Test Experiment',
        description: 'A test experiment',
        hypothesis: 'This will improve conversion',
        targetMetric: 'conversion_rate',
        variants: [
          {
            name: 'Control',
            description: 'Original version',
            traffic_allocation: 50,
            is_control: true,
            config: {}
          },
          {
            name: 'Treatment',
            description: 'New version',
            traffic_allocation: 50,
            is_control: false,
            config: { color: 'blue' }
          }
        ]
      };

      const experiment = await service.createExperiment(options, 'user123');

      expect(experiment.name).toBe('Test Experiment');
      expect(experiment.variants).toHaveLength(2);
      expect(experiment.status).toBe('draft');
      expect(experiment.created_by).toBe('user123');
    });

    it('should validate variants', async () => {
      const options = {
        name: 'Test Experiment',
        description: 'A test experiment',
        hypothesis: 'This will improve conversion',
        targetMetric: 'conversion_rate',
        variants: [
          {
            name: 'Control',
            description: 'Original version',
            traffic_allocation: 100,
            is_control: true,
            config: {}
          }
        ]
      };

      await expect(service.createExperiment(options, 'user123')).rejects.toThrow('at least 2 variants');
    });

    it('should validate traffic allocation', async () => {
      const options = {
        name: 'Test Experiment',
        description: 'A test experiment',
        hypothesis: 'This will improve conversion',
        targetMetric: 'conversion_rate',
        variants: [
          {
            name: 'Control',
            description: 'Original version',
            traffic_allocation: 60,
            is_control: true,
            config: {}
          },
          {
            name: 'Treatment',
            description: 'New version',
            traffic_allocation: 50,
            is_control: false,
            config: {}
          }
        ]
      };

      await expect(service.createExperiment(options, 'user123')).rejects.toThrow('sum to 100%');
    });

    it('should validate control variant', async () => {
      const options = {
        name: 'Test Experiment',
        description: 'A test experiment',
        hypothesis: 'This will improve conversion',
        targetMetric: 'conversion_rate',
        variants: [
          {
            name: 'Control',
            description: 'Original version',
            traffic_allocation: 50,
            is_control: false,
            config: {}
          },
          {
            name: 'Treatment',
            description: 'New version',
            traffic_allocation: 50,
            is_control: false,
            config: {}
          }
        ]
      };

      await expect(service.createExperiment(options, 'user123')).rejects.toThrow('exactly one control variant');
    });
  });

  describe('experiment lifecycle', () => {
    let experiment: Experiment;

    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      await service.initialize();

      const options = {
        name: 'Test Experiment',
        description: 'A test experiment',
        hypothesis: 'This will improve conversion',
        targetMetric: 'conversion_rate',
        variants: [
          {
            name: 'Control',
            description: 'Original version',
            traffic_allocation: 50,
            is_control: true,
            config: {}
          },
          {
            name: 'Treatment',
            description: 'New version',
            traffic_allocation: 50,
            is_control: false,
            config: {}
          }
        ]
      };

      experiment = await service.createExperiment(options, 'user123');
    });

    it('should start experiment', async () => {
      await service.startExperiment(experiment.id);

      const updatedExperiment = service.getExperiment(experiment.id);
      expect(updatedExperiment?.status).toBe('running');
      expect(updatedExperiment?.start_date).toBeTruthy();
    });

    it('should stop experiment', async () => {
      await service.startExperiment(experiment.id);
      await service.stopExperiment(experiment.id);

      const updatedExperiment = service.getExperiment(experiment.id);
      expect(updatedExperiment?.status).toBe('completed');
      expect(updatedExperiment?.end_date).toBeTruthy();
    });

    it('should handle invalid experiment ID', async () => {
      await expect(service.startExperiment('invalid-id')).rejects.toThrow('not found');
    });
  });

  describe('user assignment', () => {
    let experiment: Experiment;

    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      await service.initialize();

      const options = {
        name: 'Test Experiment',
        description: 'A test experiment',
        hypothesis: 'This will improve conversion',
        targetMetric: 'conversion_rate',
        variants: [
          {
            name: 'Control',
            description: 'Original version',
            traffic_allocation: 50,
            is_control: true,
            config: {}
          },
          {
            name: 'Treatment',
            description: 'New version',
            traffic_allocation: 50,
            is_control: false,
            config: {}
          }
        ]
      };

      experiment = await service.createExperiment(options, 'user123');
      await service.startExperiment(experiment.id);
    });

    it('should assign user to variant', async () => {
      const context = {
        userId: 'user123',
        sessionId: 'session123',
        deviceType: 'desktop',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString()
      };

      const variant = await service.getAssignment(experiment.id, context);

      expect(variant).toBeTruthy();
      expect(variant?.name).toMatch(/Control|Treatment/);
    });

    it('should return null for non-running experiment', async () => {
      await service.stopExperiment(experiment.id);

      const context = {
        userId: 'user123',
        sessionId: 'session123',
        deviceType: 'desktop',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString()
      };

      const variant = await service.getAssignment(experiment.id, context);

      expect(variant).toBeNull();
    });

    it('should provide sticky assignments', async () => {
      const context = {
        userId: 'user123',
        sessionId: 'session123',
        deviceType: 'desktop',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString()
      };

      const variant1 = await service.getAssignment(experiment.id, context);
      const variant2 = await service.getAssignment(experiment.id, context);

      expect(variant1?.id).toBe(variant2?.id);
    });

    it('should handle traffic allocation', async () => {
      // Update experiment to have 0% traffic allocation
      const lowTrafficExperiment = await service.createExperiment({
        name: 'Low Traffic Experiment',
        description: 'A test experiment with low traffic',
        hypothesis: 'This will improve conversion',
        targetMetric: 'conversion_rate',
        variants: [
          {
            name: 'Control',
            description: 'Original version',
            traffic_allocation: 50,
            is_control: true,
            config: {}
          },
          {
            name: 'Treatment',
            description: 'New version',
            traffic_allocation: 50,
            is_control: false,
            config: {}
          }
        ],
        trafficAllocation: 0
      }, 'user123');

      await service.startExperiment(lowTrafficExperiment.id);

      const context = {
        userId: 'user123',
        sessionId: 'session123',
        deviceType: 'desktop',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString()
      };

      const variant = await service.getAssignment(lowTrafficExperiment.id, context);

      expect(variant).toBeNull();
    });
  });

  describe('conversion tracking', () => {
    let experiment: Experiment;

    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      await service.initialize();

      const options = {
        name: 'Test Experiment',
        description: 'A test experiment',
        hypothesis: 'This will improve conversion',
        targetMetric: 'conversion_rate',
        variants: [
          {
            name: 'Control',
            description: 'Original version',
            traffic_allocation: 50,
            is_control: true,
            config: {}
          },
          {
            name: 'Treatment',
            description: 'New version',
            traffic_allocation: 50,
            is_control: false,
            config: {}
          }
        ]
      };

      experiment = await service.createExperiment(options, 'user123');
      await service.startExperiment(experiment.id);

      // Assign user to variant
      const context = {
        userId: 'user123',
        sessionId: 'session123',
        deviceType: 'desktop',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date().toISOString()
      };

      await service.getAssignment(experiment.id, context);
    });

    it('should record conversion', () => {
      service.recordConversion(experiment.id, 'user123', 'signup', 1);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle user not in experiment', () => {
      service.recordConversion(experiment.id, 'user456', 'signup', 1);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('experiment results', () => {
    let experiment: Experiment;

    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      await service.initialize();

      const options = {
        name: 'Test Experiment',
        description: 'A test experiment',
        hypothesis: 'This will improve conversion',
        targetMetric: 'conversion_rate',
        variants: [
          {
            name: 'Control',
            description: 'Original version',
            traffic_allocation: 50,
            is_control: true,
            config: {}
          },
          {
            name: 'Treatment',
            description: 'New version',
            traffic_allocation: 50,
            is_control: false,
            config: {}
          }
        ]
      };

      experiment = await service.createExperiment(options, 'user123');
    });

    it('should fetch experiment results', async () => {
      const mockResults = [
        {
          experiment_id: experiment.id,
          variant_id: 'variant1',
          metric_name: 'conversion_rate',
          metric_value: 0.15,
          sample_size: 100,
          confidence_interval: [0.12, 0.18],
          p_value: 0.05,
          statistical_significance: true,
          calculated_at: new Date().toISOString()
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      } as Response);

      const results = await service.getExperimentResults(experiment.id);

      expect(results).toEqual(mockResults);
      expect(mockFetch).toHaveBeenCalledWith(`/api/experiments/${experiment.id}/results`);
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const results = await service.getExperimentResults(experiment.id);

      expect(results).toEqual([]);
    });
  });

  describe('user assignments management', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      await service.initialize();
    });

    it('should get user assignments', () => {
      const assignments = service.getUserAssignments('user123');

      expect(Array.isArray(assignments)).toBe(true);
    });

    it('should clear user assignments', () => {
      service.clearUserAssignments('user123');

      const assignments = service.getUserAssignments('user123');
      expect(assignments).toEqual([]);
    });
  });

  describe('active experiments', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      await service.initialize();
    });

    it('should get active experiments', () => {
      const activeExperiments = service.getActiveExperiments();

      expect(Array.isArray(activeExperiments)).toBe(true);
    });
  });

  describe('singleton behavior', () => {
    it('should return same instance', () => {
      const service1 = getExperimentService();
      const service2 = getExperimentService();

      expect(service1).toBe(service2);
    });

    it('should initialize once', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        } as Response);

      const service1 = await initializeExperiments();
      const service2 = await initializeExperiments();

      expect(service1).toBe(service2);
    });
  });
});

describe('Experiment convenience functions', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    } as Response);
  });

  it('should get experiment assignment with convenience function', async () => {
    const { getExperimentAssignment } = await import('../services/experimentService');
    
    const context = {
      userId: 'user123',
      sessionId: 'session123',
      deviceType: 'desktop',
      userAgent: 'Mozilla/5.0...',
      timestamp: new Date().toISOString()
    };

    const variant = await getExperimentAssignment('experiment123', context);

    // Should work without throwing
    expect(variant).toBeNull(); // No experiment found
  });

  it('should record conversion with convenience function', async () => {
    const { recordExperimentConversion } = await import('../services/experimentService');
    
    recordExperimentConversion('experiment123', 'user123', 'signup', 1);

    // Should work without throwing
    expect(true).toBe(true);
  });
});