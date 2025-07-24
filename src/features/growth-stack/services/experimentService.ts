import { v4 as uuidv4 } from 'uuid';

import {
  Experiment,
  ExperimentVariant,
  ExperimentAssignment,
  ExperimentResult
} from '../types';

import { getAnalyticsService } from './analyticsService';

interface ExperimentConfig {
  apiEndpoint: string;
  enableDebug: boolean;
  stickyAssignments: boolean;
  maxExperiments: number;
  defaultTrafficAllocation: number;
}

interface CreateExperimentOptions {
  name: string;
  description: string;
  hypothesis: string;
  targetMetric: string;
  variants: Omit<ExperimentVariant, 'id'>[];
  trafficAllocation?: number;
  startDate?: string;
  endDate?: string;
}

interface ExperimentContext {
  userId: string;
  sessionId: string;
  deviceType: string;
  userAgent: string;
  timestamp: string;
  customProperties?: Record<string, any>;
}

class ExperimentService {
  private config: ExperimentConfig;
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment[]> = new Map();
  private results: Map<string, ExperimentResult[]> = new Map();
  private isInitialized = false;

  constructor(config: Partial<ExperimentConfig> = {}) {
    this.config = {
      apiEndpoint: '/api/experiments',
      enableDebug: false,
      stickyAssignments: true,
      maxExperiments: 100,
      defaultTrafficAllocation: 100,
      ...config
    };
  }

  /**
   * Initialize experiment service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load active experiments from server
      await this.loadActiveExperiments();

      // Load user assignments if sticky assignments enabled
      if (this.config.stickyAssignments) {
        await this.loadUserAssignments();
      }

      this.isInitialized = true;

      if (this.config.enableDebug) {

      }
    } catch (error: unknown) {
      console.error('Failed to initialize experiment service:', error);
      throw error;
    }
  }

  /**
   * Create new experiment
   */
  async createExperiment(
    options: CreateExperimentOptions,
    createdBy: string
  ): Promise<Experiment> {
    const {
      name,
      description,
      hypothesis,
      targetMetric,
      variants,
      trafficAllocation = this.config.defaultTrafficAllocation,
      startDate,
      endDate
    } = options;

    // Validate variants
    this.validateVariants(variants);

    // Create experiment
    const experiment: Experiment = {
      id: uuidv4(),
      name,
      description,
      hypothesis,
      status: 'draft',
      target_metric: targetMetric,
      variants: variants.map(variant => ({
        ...variant,
        id: uuidv4()
      })),
      traffic_allocation: trafficAllocation,
      start_date: startDate,
      end_date: endDate,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to server
    await this.saveExperiment(experiment);

    // Cache locally
    this.experiments.set(experiment.id, experiment);

    if (this.config.enableDebug) {

    }

    return experiment;
  }

  /**
   * Start experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'draft') {
      throw new Error(`Cannot start experiment in ${experiment.status} status`);
    }

    // Update status
    experiment.status = 'running';
    experiment.start_date = new Date().toISOString();
    experiment.updated_at = new Date().toISOString();

    // Save to server
    await this.saveExperiment(experiment);

    // Track experiment start
    const analytics = getAnalyticsService();
    analytics.track('experiment_started', {
      properties: {
        experiment_id: experimentId,
        experiment_name: experiment.name,
        variants_count: experiment.variants.length,
        traffic_allocation: experiment.traffic_allocation
      }
    });

    if (this.config.enableDebug) {

    }
  }

  /**
   * Stop experiment
   */
  async stopExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'running') {
      throw new Error(`Cannot stop experiment in ${experiment.status} status`);
    }

    // Update status
    experiment.status = 'completed';
    experiment.end_date = new Date().toISOString();
    experiment.updated_at = new Date().toISOString();

    // Save to server
    await this.saveExperiment(experiment);

    // Track experiment end
    const analytics = getAnalyticsService();
    analytics.track('experiment_ended', {
      properties: {
        experiment_id: experimentId,
        experiment_name: experiment.name,
        duration_days: this.calculateExperimentDuration(experiment)
      }
    });

    if (this.config.enableDebug) {

    }
  }

  /**
   * Get experiment assignment for user
   */
  async getAssignment(
    experimentId: string,
    context: ExperimentContext
  ): Promise<ExperimentVariant | null> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    const { userId } = context;

    // Check for existing assignment if sticky assignments enabled
    if (this.config.stickyAssignments) {
      const existingAssignment = this.getUserAssignment(userId, experimentId);
      if (existingAssignment) {
        const variant = experiment.variants.find(v => v.id === existingAssignment.variant_id);
        if (variant) {
          // Track exposure
          this.trackExposure(experiment, variant, context);
          return variant;
        }
      }
    }

    // Check if user should be included in experiment
    if (!this.shouldIncludeUser(experiment, context)) {
      return null;
    }

    // Assign user to variant
    const variant = this.assignUserToVariant(experiment, userId);
    if (!variant) {
      return null;
    }

    // Save assignment
    const assignment: ExperimentAssignment = {
      user_id: userId,
      experiment_id: experimentId,
      variant_id: variant.id,
      assigned_at: new Date().toISOString(),
      sticky: this.config.stickyAssignments
    };

    await this.saveAssignment(assignment);

    // Cache assignment
    if (!this.assignments.has(userId)) {
      this.assignments.set(userId, []);
    }
    this.assignments.get(userId)!.push(assignment);

    // Track exposure
    this.trackExposure(experiment, variant, context);

    return variant;
  }

  /**
   * Get all active experiments
   */
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values())
      .filter(exp => exp.status === 'running');
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): Experiment | null {
    return this.experiments.get(experimentId) || null;
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    const cached = this.results.get(experimentId);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/${experimentId}/results`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const results = await response.json();
      this.results.set(experimentId, results);
      return results;
    } catch (error: unknown) {
      console.error('Failed to fetch experiment results:', error);
      return [];
    }
  }

  /**
   * Record conversion event
   */
  recordConversion(
    experimentId: string,
    userId: string,
    metricName: string,
    value: number = 1,
    properties?: Record<string, any>
  ): void {
    const assignment = this.getUserAssignment(userId, experimentId);
    if (!assignment) {
      return; // User not in experiment
    }

    const analytics = getAnalyticsService();
    analytics.track('experiment_conversion', {
      properties: {
        experiment_id: experimentId,
        variant_id: assignment.variant_id,
        metric_name: metricName,
        metric_value: value,
        ...properties
      }
    });

    if (this.config.enableDebug) {

    }
  }

  /**
   * Get user assignments
   */
  getUserAssignments(userId: string): ExperimentAssignment[] {
    return this.assignments.get(userId) || [];
  }

  /**
   * Clear user assignments (for testing)
   */
  clearUserAssignments(userId: string): void {
    this.assignments.delete(userId);
  }

  /**
   * Validate experiment variants
   */
  private validateVariants(variants: Omit<ExperimentVariant, 'id'>[]): void {
    if (variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }

    const totalAllocation = variants.reduce((sum, variant) => sum + variant.traffic_allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.001) {
      throw new Error('Variant traffic allocation must sum to 100%');
    }

    const controlVariants = variants.filter(v => v.is_control);
    if (controlVariants.length !== 1) {
      throw new Error('Experiment must have exactly one control variant');
    }
  }

  /**
   * Check if user should be included in experiment
   */
  private shouldIncludeUser(experiment: Experiment, context: ExperimentContext): boolean {
    // Check traffic allocation
    const hash = this.hashUserId(context.userId);
    const bucket = hash % 100;
    
    if (bucket >= experiment.traffic_allocation) {
      return false;
    }

    // Add any additional targeting rules here
    // For example: device type, user segment, etc.

    return true;
  }

  /**
   * Assign user to variant
   */
  private assignUserToVariant(experiment: Experiment, userId: string): ExperimentVariant | null {
    const hash = this.hashUserId(userId);
    const bucket = hash % 100;
    
    let cumulativeAllocation = 0;
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.traffic_allocation;
      if (bucket < cumulativeAllocation) {
        return variant;
      }
    }

    return null;
  }

  /**
   * Hash user ID for consistent assignment
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    if (userId.length === 0) return hash;
    
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Get user assignment for experiment
   */
  private getUserAssignment(userId: string, experimentId: string): ExperimentAssignment | null {
    const userAssignments = this.assignments.get(userId) || [];
    return userAssignments.find(a => a.experiment_id === experimentId) || null;
  }

  /**
   * Track experiment exposure
   */
  private trackExposure(
    experiment: Experiment,
    variant: ExperimentVariant,
    context: ExperimentContext
  ): void {
    const analytics = getAnalyticsService();
    analytics.track('experiment_exposure', {
      properties: {
        experiment_id: experiment.id,
        experiment_name: experiment.name,
        variant_id: variant.id,
        variant_name: variant.name,
        is_control: variant.is_control,
        ...context.customProperties
      }
    });
  }

  /**
   * Calculate experiment duration in days
   */
  private calculateExperimentDuration(experiment: Experiment): number {
    if (!experiment.start_date || !experiment.end_date) {
      return 0;
    }

    const start = new Date(experiment.start_date);
    const end = new Date(experiment.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Load active experiments from server
   */
  private async loadActiveExperiments(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}?status=running`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const experiments = await response.json();
      
      for (const experiment of experiments) {
        this.experiments.set(experiment.id, experiment);
      }
    } catch (error: unknown) {
      console.error('Failed to load active experiments:', error);
    }
  }

  /**
   * Load user assignments from server
   */
  private async loadUserAssignments(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/assignments`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const assignments = await response.json();
      
      for (const assignment of assignments) {
        if (!this.assignments.has(assignment.user_id)) {
          this.assignments.set(assignment.user_id, []);
        }
        this.assignments.get(assignment.user_id)!.push(assignment);
      }
    } catch (error: unknown) {
      console.error('Failed to load user assignments:', error);
    }
  }

  /**
   * Save experiment to server
   */
  private async saveExperiment(experiment: Experiment): Promise<void> {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experiment)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: unknown) {
      console.error('Failed to save experiment:', error);
      throw error;
    }
  }

  /**
   * Save assignment to server
   */
  private async saveAssignment(assignment: ExperimentAssignment): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: unknown) {
      console.error('Failed to save assignment:', error);
      throw error;
    }
  }
}

// Singleton instance
let experimentInstance: ExperimentService | null = null;

/**
 * Get experiment service instance
 */
export function getExperimentService(config?: Partial<ExperimentConfig>): ExperimentService {
  if (!experimentInstance) {
    experimentInstance = new ExperimentService(config);
  }
  return experimentInstance;
}

/**
 * Initialize experiment service
 */
export async function initializeExperiments(config?: Partial<ExperimentConfig>): Promise<ExperimentService> {
  const service = getExperimentService(config);
  await service.initialize();
  return service;
}

/**
 * Get experiment assignment (convenience function)
 */
export async function getExperimentAssignment(
  experimentId: string,
  context: ExperimentContext
): Promise<ExperimentVariant | null> {
  const service = getExperimentService();
  return service.getAssignment(experimentId, context);
}

/**
 * Record conversion (convenience function)
 */
export function recordExperimentConversion(
  experimentId: string,
  userId: string,
  metricName: string,
  value?: number,
  properties?: Record<string, any>
): void {
  const service = getExperimentService();
  service.recordConversion(experimentId, userId, metricName, value, properties);
}

export { ExperimentService };