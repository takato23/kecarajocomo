/**
 * Performance Metrics Utilities
 * 
 * Provides comprehensive performance monitoring and metrics collection
 * for meal planning operations, AI services, and database interactions.
 */

import { logger } from '@/lib/logger';

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface AggregatedMetrics {
  operation: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  errorRate: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface PerformanceThresholds {
  warning: number;
  critical: number;
}

// Default performance thresholds in milliseconds
const DEFAULT_THRESHOLDS: Record<string, PerformanceThresholds> = {
  'ai_meal_generation': { warning: 30000, critical: 60000 }, // 30s warning, 60s critical
  'ai_single_meal': { warning: 15000, critical: 30000 },     // 15s warning, 30s critical
  'ai_alternatives': { warning: 20000, critical: 40000 },    // 20s warning, 40s critical
  'database_query': { warning: 1000, critical: 5000 },       // 1s warning, 5s critical
  'database_insert': { warning: 2000, critical: 10000 },     // 2s warning, 10s critical
  'api_request': { warning: 5000, critical: 15000 },         // 5s warning, 15s critical
  'json_parsing': { warning: 100, critical: 1000 },          // 100ms warning, 1s critical
  'validation': { warning: 500, critical: 2000 },            // 500ms warning, 2s critical
};

class PerformanceMetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private activeMetrics = new Map<string, PerformanceMetric>();
  private aggregatedCache = new Map<string, AggregatedMetrics>();
  private cacheLastUpdated = 0;
  private readonly cacheTtl = 60000; // 1 minute cache TTL

  /**
   * Start measuring performance for an operation
   */
  startMeasurement(
    operationName: string,
    metadata?: Record<string, any>,
    tags?: string[]
  ): string {
    const measurementId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      name: operationName,
      startTime: performance.now(),
      success: false, // Will be updated on end
      metadata,
      tags,
    };
    
    this.activeMetrics.set(measurementId, metric);
    
    logger.debug('Started performance measurement', 'performanceMetrics', {
      operation: operationName,
      measurementId,
      metadata,
      tags,
    });
    
    return measurementId;
  }

  /**
   * End measurement and record results
   */
  endMeasurement(
    measurementId: string,
    success: boolean = true,
    additionalMetadata?: Record<string, any>
  ): PerformanceMetric | null {
    const metric = this.activeMetrics.get(measurementId);
    
    if (!metric) {
      logger.warn('Attempted to end non-existent measurement', 'performanceMetrics', {
        measurementId,
      });
      return null;
    }
    
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }
    
    // Check performance thresholds
    const thresholds = DEFAULT_THRESHOLDS[metric.name];
    if (thresholds && metric.duration) {
      if (metric.duration > thresholds.critical) {
        logger.error('Performance critical threshold exceeded', 'performanceMetrics', {
          operation: metric.name,
          duration: metric.duration,
          threshold: thresholds.critical,
          measurementId,
        });
      } else if (metric.duration > thresholds.warning) {
        logger.warn('Performance warning threshold exceeded', 'performanceMetrics', {
          operation: metric.name,
          duration: metric.duration,
          threshold: thresholds.warning,
          measurementId,
        });
      }
    }
    
    // Store the completed metric
    this.metrics.push({ ...metric });
    this.activeMetrics.delete(measurementId);
    
    // Invalidate cache
    this.cacheLastUpdated = 0;
    
    logger.debug('Completed performance measurement', 'performanceMetrics', {
      operation: metric.name,
      duration: metric.duration,
      success: metric.success,
      measurementId,
    });
    
    return metric;
  }

  /**
   * Measure an async operation
   */
  async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>,
    tags?: string[]
  ): Promise<T> {
    const measurementId = this.startMeasurement(operationName, metadata, tags);
    
    try {
      const result = await operation();
      this.endMeasurement(measurementId, true);
      return result;
    } catch (error) {
      this.endMeasurement(measurementId, false, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(
    operationName: string,
    operation: () => T,
    metadata?: Record<string, any>,
    tags?: string[]
  ): T {
    const measurementId = this.startMeasurement(operationName, metadata, tags);
    
    try {
      const result = operation();
      this.endMeasurement(measurementId, true);
      return result;
    } catch (error) {
      this.endMeasurement(measurementId, false, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get aggregated metrics for operations
   */
  getAggregatedMetrics(operationName?: string): AggregatedMetrics[] {
    // Use cache if available and recent
    const now = Date.now();
    if (this.cacheLastUpdated && (now - this.cacheLastUpdated) < this.cacheTtl) {
      const cached = operationName 
        ? [this.aggregatedCache.get(operationName)].filter(Boolean) as AggregatedMetrics[]
        : Array.from(this.aggregatedCache.values());
      
      if (cached.length > 0) {
        return cached;
      }
    }

    // Rebuild cache
    const groupedMetrics = new Map<string, PerformanceMetric[]>();
    
    for (const metric of this.metrics) {
      if (metric.duration !== undefined) {
        if (!groupedMetrics.has(metric.name)) {
          groupedMetrics.set(metric.name, []);
        }
        groupedMetrics.get(metric.name)!.push(metric);
      }
    }

    const aggregated: AggregatedMetrics[] = [];
    
    for (const [operation, operationMetrics] of groupedMetrics) {
      if (operationName && operation !== operationName) {
        continue;
      }

      const durations = operationMetrics.map(m => m.duration!).sort((a, b) => a - b);
      const successCount = operationMetrics.filter(m => m.success).length;
      
      const stats: AggregatedMetrics = {
        operation,
        count: operationMetrics.length,
        totalDuration: durations.reduce((sum, d) => sum + d, 0),
        averageDuration: durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
        minDuration: durations.length > 0 ? durations[0] : 0,
        maxDuration: durations.length > 0 ? durations[durations.length - 1] : 0,
        successRate: operationMetrics.length > 0 ? (successCount / operationMetrics.length) * 100 : 0,
        errorRate: operationMetrics.length > 0 ? ((operationMetrics.length - successCount) / operationMetrics.length) * 100 : 0,
        p50: durations.length > 0 ? this.percentile(durations, 50) : 0,
        p90: durations.length > 0 ? this.percentile(durations, 90) : 0,
        p95: durations.length > 0 ? this.percentile(durations, 95) : 0,
        p99: durations.length > 0 ? this.percentile(durations, 99) : 0,
      };
      
      aggregated.push(stats);
      this.aggregatedCache.set(operation, stats);
    }

    this.cacheLastUpdated = now;
    return aggregated;
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Get recent metrics (last N minutes)
   */
  getRecentMetrics(minutesBack: number = 10): PerformanceMetric[] {
    const cutoff = Date.now() - (minutesBack * 60 * 1000);
    return this.metrics.filter(metric => 
      metric.startTime && (metric.startTime >= cutoff || 
      (metric.endTime && metric.endTime >= cutoff))
    );
  }

  /**
   * Get health status based on recent performance
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    metrics: {
      totalOperations: number;
      recentFailures: number;
      averageResponseTime: number;
      criticalThresholdExceeded: number;
    };
  } {
    const recentMetrics = this.getRecentMetrics(5); // Last 5 minutes
    const issues: string[] = [];
    
    const totalOperations = recentMetrics.length;
    const failures = recentMetrics.filter(m => !m.success);
    const recentFailures = failures.length;
    const successfulMetrics = recentMetrics.filter(m => m.success && m.duration);
    
    const averageResponseTime = successfulMetrics.length > 0
      ? successfulMetrics.reduce((sum, m) => sum + m.duration!, 0) / successfulMetrics.length
      : 0;
    
    let criticalThresholdExceeded = 0;
    
    // Check for critical issues
    for (const metric of recentMetrics) {
      if (metric.duration) {
        const thresholds = DEFAULT_THRESHOLDS[metric.name];
        if (thresholds && metric.duration > thresholds.critical) {
          criticalThresholdExceeded++;
        }
      }
    }
    
    // Determine health status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (totalOperations > 0) {
      const failureRate = (recentFailures / totalOperations) * 100;
      
      if (failureRate > 50 || criticalThresholdExceeded > 3) {
        status = 'critical';
        issues.push(`High failure rate: ${failureRate.toFixed(1)}%`);
      } else if (failureRate > 20 || criticalThresholdExceeded > 0) {
        status = 'degraded';
        issues.push(`Elevated failure rate: ${failureRate.toFixed(1)}%`);
      }
      
      if (averageResponseTime > 10000) {
        status = status === 'healthy' ? 'degraded' : 'critical';
        issues.push(`High average response time: ${averageResponseTime.toFixed(0)}ms`);
      }
    }
    
    if (criticalThresholdExceeded > 0) {
      issues.push(`${criticalThresholdExceeded} operations exceeded critical thresholds`);
    }
    
    return {
      status,
      issues,
      metrics: {
        totalOperations,
        recentFailures,
        averageResponseTime,
        criticalThresholdExceeded,
      },
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanupOldMetrics(hoursBack: number = 24): number {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000);
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(metric => 
      metric.startTime >= cutoff || (metric.endTime && metric.endTime >= cutoff)
    );
    
    // Clear cache to force rebuild
    this.aggregatedCache.clear();
    this.cacheLastUpdated = 0;
    
    const removedCount = initialCount - this.metrics.length;
    
    if (removedCount > 0) {
      logger.info('Cleaned up old performance metrics', 'performanceMetrics', {
        removedCount,
        remainingCount: this.metrics.length,
        hoursBack,
      });
    }
    
    return removedCount;
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['name', 'startTime', 'endTime', 'duration', 'success', 'metadata', 'tags'];
      const csvLines = [headers.join(',')];
      
      for (const metric of this.metrics) {
        const row = [
          metric.name,
          metric.startTime.toString(),
          metric.endTime?.toString() || '',
          metric.duration?.toString() || '',
          metric.success.toString(),
          JSON.stringify(metric.metadata || {}),
          JSON.stringify(metric.tags || []),
        ];
        csvLines.push(row.join(','));
      }
      
      return csvLines.join('\n');
    }
    
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.activeMetrics.clear();
    this.aggregatedCache.clear();
    this.cacheLastUpdated = 0;
    
    logger.info('Performance metrics reset', 'performanceMetrics');
  }

  /**
   * Get current statistics
   */
  getStats(): {
    totalMetrics: number;
    activeMetrics: number;
    operations: string[];
    memoryUsage: number;
  } {
    return {
      totalMetrics: this.metrics.length,
      activeMetrics: this.activeMetrics.size,
      operations: [...new Set(this.metrics.map(m => m.name))],
      memoryUsage: JSON.stringify(this.metrics).length,
    };
  }
}

// Global instance
const performanceMetrics = new PerformanceMetricsCollector();

// Export functions that use the global instance
export function startMeasurement(
  operationName: string,
  metadata?: Record<string, any>,
  tags?: string[]
): string {
  return performanceMetrics.startMeasurement(operationName, metadata, tags);
}

export function endMeasurement(
  measurementId: string,
  success: boolean = true,
  additionalMetadata?: Record<string, any>
): PerformanceMetric | null {
  return performanceMetrics.endMeasurement(measurementId, success, additionalMetadata);
}

export async function measureOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>,
  tags?: string[]
): Promise<T> {
  return performanceMetrics.measureOperation(operationName, operation, metadata, tags);
}

export function measureSync<T>(
  operationName: string,
  operation: () => T,
  metadata?: Record<string, any>,
  tags?: string[]
): T {
  return performanceMetrics.measureSync(operationName, operation, metadata, tags);
}

export function getAggregatedMetrics(operationName?: string): AggregatedMetrics[] {
  return performanceMetrics.getAggregatedMetrics(operationName);
}

export function getRecentMetrics(minutesBack: number = 10): PerformanceMetric[] {
  return performanceMetrics.getRecentMetrics(minutesBack);
}

export function getHealthStatus() {
  return performanceMetrics.getHealthStatus();
}

export function cleanupOldMetrics(hoursBack: number = 24): number {
  return performanceMetrics.cleanupOldMetrics(hoursBack);
}

export function exportMetrics(format: 'json' | 'csv' = 'json'): string {
  return performanceMetrics.exportMetrics(format);
}

export function resetMetrics(): void {
  performanceMetrics.reset();
}

export function getMetricsStats() {
  return performanceMetrics.getStats();
}

// Utility function to create a performance timer
export function createTimer(operationName: string, metadata?: Record<string, any>, tags?: string[]) {
  const measurementId = startMeasurement(operationName, metadata, tags);
  
  return {
    end: (success: boolean = true, additionalMetadata?: Record<string, any>) => {
      return endMeasurement(measurementId, success, additionalMetadata);
    },
    measurementId,
  };
}

// Export the collector class for advanced usage
export { PerformanceMetricsCollector };

// Export types
export type {
  PerformanceMetric,
  AggregatedMetrics,
  PerformanceThresholds,
};