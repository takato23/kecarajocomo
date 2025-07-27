/**
 * Scalability & Deployment Optimization
 * Auto-scaling, load balancing, and deployment optimization
 */

import { performanceMonitor } from '../analytics/performance';
import { analytics } from '../analytics/growth';
import { logger } from '@/services/logger';

export interface ScalabilityConfig {
  autoScaling: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    targetCPU: number;
    targetMemory: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
  };
  loadBalancing: {
    enabled: boolean;
    strategy: 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted';
    healthCheck: {
      enabled: boolean;
      interval: number;
      timeout: number;
      unhealthyThreshold: number;
    };
  };
  caching: {
    enabled: boolean;
    strategy: 'memory' | 'redis' | 'hybrid';
    ttl: number;
    maxSize: number;
  };
  compression: {
    enabled: boolean;
    level: number;
    threshold: number;
  };
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  connections: number;
  requestsPerSecond: number;
  responseTime: number;
  errorRate: number;
  timestamp: number;
}

export interface ScalingDecision {
  action: 'scale-up' | 'scale-down' | 'maintain';
  reason: string;
  currentInstances: number;
  targetInstances: number;
  confidence: number;
  timestamp: number;
}

class ScalabilityOptimizer {
  private config: ScalabilityConfig;
  private resourceMetrics: ResourceMetrics[] = [];
  private scalingHistory: ScalingDecision[] = [];
  private currentInstances = 1;
  private lastScalingAction = 0;
  private scalingCooldown = 300000; // 5 minutes

  constructor(config: Partial<ScalabilityConfig> = {}) {
    this.config = {
      autoScaling: {
        enabled: true,
        minInstances: 1,
        maxInstances: 10,
        targetCPU: 70,
        targetMemory: 80,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        ...config.autoScaling,
      },
      loadBalancing: {
        enabled: true,
        strategy: 'round-robin',
        healthCheck: {
          enabled: true,
          interval: 30000,
          timeout: 5000,
          unhealthyThreshold: 3,
        },
        ...config.loadBalancing,
      },
      caching: {
        enabled: true,
        strategy: 'hybrid',
        ttl: 3600,
        maxSize: 1000,
        ...config.caching,
      },
      compression: {
        enabled: true,
        level: 6,
        threshold: 1024,
        ...config.compression,
      },
    };

    this.startMonitoring();
  }

  private startMonitoring() {
    // Monitor resource usage every 30 seconds
    setInterval(() => {
      this.collectResourceMetrics();
    }, 30000);

    // Evaluate scaling decisions every minute
    setInterval(() => {
      this.evaluateScaling();
    }, 60000);

    // Clean up old data every hour
    setInterval(() => {
      this.cleanup();
    }, 3600000);
  }

  private async collectResourceMetrics() {
    try {
      const metrics = await this.getCurrentResourceMetrics();
      this.resourceMetrics.push(metrics);

      // Keep only last 100 metrics
      if (this.resourceMetrics.length > 100) {
        this.resourceMetrics = this.resourceMetrics.slice(-100);
      }

      // Track in analytics
      analytics.track('resource_metrics', {
        cpu: metrics.cpu,
        memory: metrics.memory,
        connections: metrics.connections,
        requestsPerSecond: metrics.requestsPerSecond,
        responseTime: metrics.responseTime,
        errorRate: metrics.errorRate,
      });
    } catch (error: unknown) {
      logger.error('Failed to collect resource metrics:', 'Lib:optimization', error);
    }
  }

  private async getCurrentResourceMetrics(): Promise<ResourceMetrics> {
    // In a real implementation, this would collect actual system metrics
    // For now, we'll simulate based on performance data
    
    const performanceData = performanceMonitor.getAverageMetrics();
    const growthData = analytics.getGrowthMetrics();

    return {
      cpu: this.simulateCPUUsage(growthData.dailyActiveUsers),
      memory: this.simulateMemoryUsage(growthData.dailyActiveUsers),
      connections: growthData.dailyActiveUsers * 1.5,
      requestsPerSecond: growthData.dailyActiveUsers * 0.1,
      responseTime: performanceData.ttfb || 200,
      errorRate: performanceData.cls ? performanceData.cls * 10 : 0,
      timestamp: Date.now(),
    };
  }

  private simulateCPUUsage(activeUsers: number): number {
    // Simulate CPU usage based on active users
    const baseUsage = 10;
    const userLoad = activeUsers * 0.5;
    const randomVariation = Math.random() * 20 - 10;
    
    return Math.max(0, Math.min(100, baseUsage + userLoad + randomVariation));
  }

  private simulateMemoryUsage(activeUsers: number): number {
    // Simulate memory usage based on active users
    const baseUsage = 20;
    const userLoad = activeUsers * 0.3;
    const randomVariation = Math.random() * 15 - 7.5;
    
    return Math.max(0, Math.min(100, baseUsage + userLoad + randomVariation));
  }

  private evaluateScaling() {
    if (!this.config.autoScaling.enabled) return;

    const now = Date.now();
    
    // Check cooldown period
    if (now - this.lastScalingAction < this.scalingCooldown) {
      return;
    }

    const recentMetrics = this.resourceMetrics.slice(-5); // Last 5 minutes
    if (recentMetrics.length < 3) return;

    const avgCPU = recentMetrics.reduce((sum, m) => sum + m.cpu, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memory, 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;

    const decision = this.makeScalingDecision(avgCPU, avgMemory, avgResponseTime, avgErrorRate);
    
    if (decision.action !== 'maintain') {
      this.executeScalingDecision(decision);
    }
  }

  private makeScalingDecision(
    cpu: number,
    memory: number,
    responseTime: number,
    errorRate: number
  ): ScalingDecision {
    const { autoScaling } = this.config;
    let action: ScalingDecision['action'] = 'maintain';
    let reason = 'All metrics within acceptable range';
    let targetInstances = this.currentInstances;
    let confidence = 0.5;

    // Scale up conditions
    if (cpu > autoScaling.scaleUpThreshold) {
      action = 'scale-up';
      reason = `CPU usage ${cpu.toFixed(1)}% exceeds threshold ${autoScaling.scaleUpThreshold}%`;
      confidence = Math.min(1, (cpu - autoScaling.scaleUpThreshold) / 20);
    } else if (memory > autoScaling.scaleUpThreshold) {
      action = 'scale-up';
      reason = `Memory usage ${memory.toFixed(1)}% exceeds threshold ${autoScaling.scaleUpThreshold}%`;
      confidence = Math.min(1, (memory - autoScaling.scaleUpThreshold) / 20);
    } else if (responseTime > 1000) {
      action = 'scale-up';
      reason = `Response time ${responseTime.toFixed(0)}ms is too high`;
      confidence = Math.min(1, (responseTime - 1000) / 2000);
    } else if (errorRate > 5) {
      action = 'scale-up';
      reason = `Error rate ${errorRate.toFixed(1)}% is too high`;
      confidence = Math.min(1, errorRate / 10);
    }

    // Scale down conditions (only if not scaling up)
    if (action === 'maintain' && this.currentInstances > autoScaling.minInstances) {
      if (cpu < autoScaling.scaleDownThreshold && memory < autoScaling.scaleDownThreshold) {
        action = 'scale-down';
        reason = `CPU ${cpu.toFixed(1)}% and memory ${memory.toFixed(1)}% below threshold ${autoScaling.scaleDownThreshold}%`;
        confidence = Math.min(1, (autoScaling.scaleDownThreshold - Math.max(cpu, memory)) / 20);
      }
    }

    // Calculate target instances
    if (action === 'scale-up') {
      targetInstances = Math.min(
        autoScaling.maxInstances,
        this.currentInstances + Math.ceil(confidence * 2)
      );
    } else if (action === 'scale-down') {
      targetInstances = Math.max(
        autoScaling.minInstances,
        this.currentInstances - 1
      );
    }

    return {
      action,
      reason,
      currentInstances: this.currentInstances,
      targetInstances,
      confidence,
      timestamp: Date.now(),
    };
  }

  private async executeScalingDecision(decision: ScalingDecision) {
    try {



      // In a real implementation, this would call your cloud provider's scaling API
      await this.simulateScaling(decision);

      this.currentInstances = decision.targetInstances;
      this.lastScalingAction = Date.now();
      this.scalingHistory.push(decision);

      // Track scaling decision
      analytics.track('scaling_decision', {
        action: decision.action,
        reason: decision.reason,
        currentInstances: decision.currentInstances,
        targetInstances: decision.targetInstances,
        confidence: decision.confidence,
      });

      // Send notification if significant scaling
      if (Math.abs(decision.targetInstances - decision.currentInstances) > 1) {
        await this.sendScalingNotification(decision);
      }
    } catch (error: unknown) {
      logger.error('Failed to execute scaling decision:', 'Lib:optimization', error);
      
      analytics.track('scaling_error', {
        action: decision.action,
        error: error instanceof Error ? error.message : 'Unknown error',
        currentInstances: decision.currentInstances,
        targetInstances: decision.targetInstances,
      });
    }
  }

  private async simulateScaling(decision: ScalingDecision): Promise<void> {
    // Simulate scaling delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Simulate scaling process
    if (decision.action === 'scale-up') {

    } else if (decision.action === 'scale-down') {

    }
  }

  private async sendScalingNotification(decision: ScalingDecision) {
    // In a real implementation, this would send notifications via email, Slack, etc.

    // Track notification
    analytics.track('scaling_notification', {
      action: decision.action,
      reason: decision.reason,
      instanceChange: decision.targetInstances - decision.currentInstances,
    });
  }

  private cleanup() {
    // Keep only last 1000 resource metrics
    if (this.resourceMetrics.length > 1000) {
      this.resourceMetrics = this.resourceMetrics.slice(-1000);
    }

    // Keep only last 100 scaling decisions
    if (this.scalingHistory.length > 100) {
      this.scalingHistory = this.scalingHistory.slice(-100);
    }
  }

  // Public API
  getResourceMetrics(): ResourceMetrics[] {
    return [...this.resourceMetrics];
  }

  getScalingHistory(): ScalingDecision[] {
    return [...this.scalingHistory];
  }

  getCurrentInstances(): number {
    return this.currentInstances;
  }

  getConfig(): ScalabilityConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ScalabilityConfig>) {
    this.config = { ...this.config, ...config };
    
    analytics.track('scalability_config_updated', {
      config: this.config,
    });
  }

  forceScaling(action: 'scale-up' | 'scale-down', instances: number) {
    const decision: ScalingDecision = {
      action,
      reason: 'Manual scaling triggered',
      currentInstances: this.currentInstances,
      targetInstances: instances,
      confidence: 1.0,
      timestamp: Date.now(),
    };

    this.executeScalingDecision(decision);
  }

  getScalingRecommendations(): {
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }[] {
    const recommendations = [];
    const recentMetrics = this.resourceMetrics.slice(-10);
    
    if (recentMetrics.length === 0) return [];

    const avgCPU = recentMetrics.reduce((sum, m) => sum + m.cpu, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memory, 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;

    if (avgCPU > 90) {
      recommendations.push({
        recommendation: 'Increase CPU resources or optimize CPU-intensive operations',
        priority: 'high',
        impact: 'Improve response times and prevent service degradation',
      });
    }

    if (avgMemory > 90) {
      recommendations.push({
        recommendation: 'Increase memory allocation or optimize memory usage',
        priority: 'high',
        impact: 'Prevent out-of-memory errors and improve stability',
      });
    }

    if (avgResponseTime > 2000) {
      recommendations.push({
        recommendation: 'Optimize database queries or increase instance count',
        priority: 'medium',
        impact: 'Improve user experience and reduce bounce rate',
      });
    }

    if (this.currentInstances === this.config.autoScaling.minInstances && avgCPU > 60) {
      recommendations.push({
        recommendation: 'Consider increasing minimum instance count',
        priority: 'low',
        impact: 'Better handle traffic spikes and improve reliability',
      });
    }

    return recommendations;
  }

  getScalingEfficiency(): {
    totalScalingEvents: number;
    successfulScalings: number;
    avgScalingTime: number;
    costOptimization: number;
    performanceImprovement: number;
  } {
    const scalingEvents = this.scalingHistory.length;
    const successfulScalings = scalingEvents; // Assuming all are successful for now
    
    const avgScalingTime = 30; // Average time in seconds
    
    // Calculate cost optimization (percentage of time running optimal instances)
    const costOptimization = this.calculateCostOptimization();
    
    // Calculate performance improvement
    const performanceImprovement = this.calculatePerformanceImprovement();

    return {
      totalScalingEvents: scalingEvents,
      successfulScalings,
      avgScalingTime,
      costOptimization,
      performanceImprovement,
    };
  }

  private calculateCostOptimization(): number {
    // Simplified cost optimization calculation
    const optimalInstances = 2; // Assume 2 is optimal
    const instanceHours = this.scalingHistory.reduce((sum, decision) => {
      return sum + Math.abs(decision.targetInstances - optimalInstances);
    }, 0);
    
    return Math.max(0, 100 - (instanceHours / this.scalingHistory.length * 10));
  }

  private calculatePerformanceImprovement(): number {
    if (this.resourceMetrics.length < 20) return 0;

    const recentMetrics = this.resourceMetrics.slice(-10);
    const olderMetrics = this.resourceMetrics.slice(-20, -10);

    const recentAvgResponse = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const olderAvgResponse = olderMetrics.reduce((sum, m) => sum + m.responseTime, 0) / olderMetrics.length;

    if (olderAvgResponse === 0) return 0;

    return ((olderAvgResponse - recentAvgResponse) / olderAvgResponse) * 100;
  }
}

// Global scalability optimizer
export const scalabilityOptimizer = new ScalabilityOptimizer();

// React hook for scalability optimization
export function useScalabilityOptimizer() {
  return {
    getResourceMetrics: () => scalabilityOptimizer.getResourceMetrics(),
    getScalingHistory: () => scalabilityOptimizer.getScalingHistory(),
    getCurrentInstances: () => scalabilityOptimizer.getCurrentInstances(),
    getConfig: () => scalabilityOptimizer.getConfig(),
    updateConfig: (config: Partial<ScalabilityConfig>) => scalabilityOptimizer.updateConfig(config),
    forceScaling: (action: 'scale-up' | 'scale-down', instances: number) => 
      scalabilityOptimizer.forceScaling(action, instances),
    getScalingRecommendations: () => scalabilityOptimizer.getScalingRecommendations(),
    getScalingEfficiency: () => scalabilityOptimizer.getScalingEfficiency(),
  };
}