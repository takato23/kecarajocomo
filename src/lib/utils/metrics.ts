/**
 * Performance metrics and monitoring utilities
 * Tracks timing, memory usage, and performance indicators
 */

import { logger } from '@/lib/logger';

export class MetricStopwatch {
  private startTime: number = 0;
  private endTime: number = 0;
  private marks: Map<string, number> = new Map();
  
  constructor(private name: string) {}
  
  start(): void {
    this.startTime = performance.now();
    this.marks.clear();
    logger.debug(`Stopwatch started`, 'MetricStopwatch', { name: this.name });
  }
  
  mark(label: string): void {
    if (this.startTime === 0) {
      logger.warn('Cannot mark time - stopwatch not started', 'MetricStopwatch');
      return;
    }
    
    const elapsed = performance.now() - this.startTime;
    this.marks.set(label, elapsed);
    logger.debug(`Mark recorded`, 'MetricStopwatch', { 
      name: this.name,
      label,
      elapsed: Math.round(elapsed)
    });
  }
  
  stop(): number {
    if (this.startTime === 0) {
      logger.warn('Cannot stop stopwatch - not started', 'MetricStopwatch');
      return 0;
    }
    
    this.endTime = performance.now();
    const elapsed = this.endTime - this.startTime;
    
    logger.info(`Stopwatch stopped`, 'MetricStopwatch', { 
      name: this.name,
      elapsed: Math.round(elapsed),
      marks: Object.fromEntries(
        Array.from(this.marks.entries()).map(([k, v]) => [k, Math.round(v)])
      )
    });
    
    return elapsed;
  }
  
  getElapsed(): number {
    if (this.startTime === 0) return 0;
    const endTime = this.endTime || performance.now();
    return endTime - this.startTime;
  }
  
  getMarks(): Record<string, number> {
    return Object.fromEntries(
      Array.from(this.marks.entries()).map(([k, v]) => [k, Math.round(v)])
    );
  }
  
  reset(): void {
    this.startTime = 0;
    this.endTime = 0;
    this.marks.clear();
  }
}

/**
 * Tracks memory usage
 */
export function getMemoryUsage(): Record<string, number> | null {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }
  
  const memory = (performance as any).memory;
  return {
    usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
    totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
    jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
  };
}

/**
 * Performance measurement decorator
 */
export function measurePerformance(name: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    
    if (!originalMethod) return descriptor;
    
    descriptor.value = function (...args: any[]) {
      const stopwatch = new MetricStopwatch(`${name}.${propertyKey}`);
      stopwatch.start();
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle async methods
        if (result instanceof Promise) {
          return result
            .then((value) => {
              stopwatch.stop();
              return value;
            })
            .catch((error) => {
              stopwatch.stop();
              throw error;
            });
        }
        
        stopwatch.stop();
        return result;
      } catch (error) {
        stopwatch.stop();
        throw error;
      }
    } as T;
    
    return descriptor;
  };
}

/**
 * Async function performance wrapper
 */
export async function withMetrics<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const stopwatch = new MetricStopwatch(name);
  const startMemory = getMemoryUsage();
  
  stopwatch.start();
  
  try {
    const result = await operation();
    stopwatch.stop();
    
    const endMemory = getMemoryUsage();
    const memoryDelta = startMemory && endMemory 
      ? endMemory.usedJSHeapSize - startMemory.usedJSHeapSize
      : null;
    
    logger.info('Operation completed', 'withMetrics', {
      name,
      duration: Math.round(stopwatch.getElapsed()),
      memoryDelta: memoryDelta ? Math.round(memoryDelta) : null,
      startMemory: startMemory?.usedJSHeapSize,
      endMemory: endMemory?.usedJSHeapSize
    });
    
    return result;
  } catch (error) {
    stopwatch.stop();
    
    logger.error('Operation failed', 'withMetrics', {
      name,
      duration: Math.round(stopwatch.getElapsed()),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

/**
 * Tracks API call metrics
 */
export class ApiMetrics {
  private static instance: ApiMetrics;
  private calls: Map<string, {
    count: number;
    totalTime: number;
    errors: number;
    lastCall: number;
  }> = new Map();
  
  static getInstance(): ApiMetrics {
    if (!ApiMetrics.instance) {
      ApiMetrics.instance = new ApiMetrics();
    }
    return ApiMetrics.instance;
  }
  
  trackCall(endpoint: string, duration: number, success: boolean): void {
    const existing = this.calls.get(endpoint) || {
      count: 0,
      totalTime: 0,
      errors: 0,
      lastCall: 0
    };
    
    existing.count++;
    existing.totalTime += duration;
    existing.lastCall = Date.now();
    
    if (!success) {
      existing.errors++;
    }
    
    this.calls.set(endpoint, existing);
    
    logger.debug('API call tracked', 'ApiMetrics', {
      endpoint,
      duration: Math.round(duration),
      success,
      totalCalls: existing.count,
      avgDuration: Math.round(existing.totalTime / existing.count),
      errorRate: Math.round((existing.errors / existing.count) * 100)
    });
  }
  
  getMetrics(endpoint?: string): Record<string, any> {
    if (endpoint) {
      const metrics = this.calls.get(endpoint);
      if (!metrics) return {};
      
      return {
        count: metrics.count,
        averageTime: Math.round(metrics.totalTime / metrics.count),
        errorRate: Math.round((metrics.errors / metrics.count) * 100),
        lastCall: new Date(metrics.lastCall).toISOString()
      };
    }
    
    const allMetrics: Record<string, any> = {};
    for (const [endpoint, metrics] of this.calls.entries()) {
      allMetrics[endpoint] = {
        count: metrics.count,
        averageTime: Math.round(metrics.totalTime / metrics.count),
        errorRate: Math.round((metrics.errors / metrics.count) * 100),
        lastCall: new Date(metrics.lastCall).toISOString()
      };
    }
    
    return allMetrics;
  }
  
  reset(): void {
    this.calls.clear();
    logger.info('API metrics reset', 'ApiMetrics');
  }
}

/**
 * Performance observer for monitoring
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  start(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not available', 'PerformanceMonitor');
      return;
    }
    
    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            logger.info('Navigation performance', 'PerformanceMonitor', {
              domContentLoaded: Math.round(navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart),
              loadComplete: Math.round(navEntry.loadEventEnd - navEntry.loadEventStart),
              firstPaint: Math.round(navEntry.domContentLoadedEventEnd - navEntry.fetchStart),
              ttfb: Math.round(navEntry.responseStart - navEntry.fetchStart)
            });
          }
        }
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      logger.error('Failed to setup navigation observer', 'PerformanceMonitor', error);
    }
    
    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          logger.info('Paint performance', 'PerformanceMonitor', {
            name: entry.name,
            startTime: Math.round(entry.startTime)
          });
        }
      });
      
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      logger.error('Failed to setup paint observer', 'PerformanceMonitor', error);
    }
  }
  
  stop(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    logger.info('Performance monitoring stopped', 'PerformanceMonitor');
  }
}

/**
 * Initialize performance monitoring
 */
export function initializeMetrics(): void {
  const monitor = PerformanceMonitor.getInstance();
  monitor.start();
  
  // Log initial memory usage
  const memory = getMemoryUsage();
  if (memory) {
    logger.info('Initial memory usage', 'initializeMetrics', memory);
  }
  
  // Setup periodic memory logging (every 5 minutes)
  if (typeof window !== 'undefined') {
    setInterval(() => {
      const currentMemory = getMemoryUsage();
      if (currentMemory) {
        logger.debug('Memory usage check', 'initializeMetrics', currentMemory);
      }
    }, 5 * 60 * 1000);
  }
}