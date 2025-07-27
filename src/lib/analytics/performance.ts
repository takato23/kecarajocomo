import { logger } from '@/services/logger';

/**
 * Performance Monitoring & Analytics
 * Real-time performance tracking and optimization
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Additional metrics
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  route?: string;
  userAgent?: string;
  connection?: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface AIPerformanceMetrics {
  requestId: string;
  endpoint: string;
  model: string;
  tokens: number;
  duration: number;
  success: boolean;
  error?: string;
  cacheHit?: boolean;
  timestamp: number;
  userId?: string;
}

export interface DatabaseMetrics {
  query: string;
  duration: number;
  rows: number;
  cached: boolean;
  timestamp: number;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private aiMetrics: AIPerformanceMetrics[] = [];
  private dbMetrics: DatabaseMetrics[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPerformanceObserver();
    this.setupAutoFlush();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPerformanceObserver() {
    if (typeof window === 'undefined') return;

    // Web Vitals observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    }

    // Layout shift observer
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        if (clsValue > 0) {
          this.trackMetric({ cls: clsValue });
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackMetric({ fid: (entry as any).processingStart - entry.startTime });
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    const metric: Partial<PerformanceMetrics> = {
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
    };

    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        metric.ttfb = navEntry.responseStart - navEntry.requestStart;
        break;
      
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          metric.fcp = entry.startTime;
        }
        break;
      
      case 'largest-contentful-paint':
        metric.lcp = entry.startTime;
        break;
    }

    this.trackMetric(metric);
  }

  private setupAutoFlush() {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  public trackMetric(metric: Partial<PerformanceMetrics>) {
    const fullMetric: PerformanceMetrics = {
      ...metric,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
    };

    this.metrics.push(fullMetric);

    if (this.metrics.length >= this.batchSize) {
      this.flush();
    }
  }

  public trackAIMetric(metric: AIPerformanceMetrics) {
    this.aiMetrics.push({
      ...metric,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
    });

    if (this.aiMetrics.length >= this.batchSize) {
      this.flushAIMetrics();
    }
  }

  public trackDatabaseMetric(metric: Omit<DatabaseMetrics, 'timestamp' | 'userId'>) {
    this.dbMetrics.push({
      ...metric,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
    });

    if (this.dbMetrics.length >= this.batchSize) {
      this.flushDatabaseMetrics();
    }
  }

  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr).id : undefined;
    } catch {
      return undefined;
    }
  }

  private async flush() {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsToSend }),
      });
    } catch (error: unknown) {
      logger.error('Failed to send performance metrics:', 'Lib:performance', error);
      // Re-add metrics to retry later
      this.metrics.unshift(...metricsToSend);
    }
  }

  private async flushAIMetrics() {
    if (this.aiMetrics.length === 0) return;

    const metricsToSend = [...this.aiMetrics];
    this.aiMetrics = [];

    try {
      await fetch('/api/analytics/ai-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsToSend }),
      });
    } catch (error: unknown) {
      logger.error('Failed to send AI performance metrics:', 'Lib:performance', error);
      this.aiMetrics.unshift(...metricsToSend);
    }
  }

  private async flushDatabaseMetrics() {
    if (this.dbMetrics.length === 0) return;

    const metricsToSend = [...this.dbMetrics];
    this.dbMetrics = [];

    try {
      await fetch('/api/analytics/database-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsToSend }),
      });
    } catch (error: unknown) {
      logger.error('Failed to send database performance metrics:', 'Lib:performance', error);
      this.dbMetrics.unshift(...metricsToSend);
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const totals = this.metrics.reduce((acc, metric) => {
      Object.keys(metric).forEach(key => {
        if (typeof metric[key as keyof PerformanceMetrics] === 'number') {
          acc[key] = (acc[key] || 0) + (metric[key as keyof PerformanceMetrics] as number);
        }
      });
      return acc;
    }, {} as any);

    const averages: any = {};
    Object.keys(totals).forEach(key => {
      averages[key] = totals[key] / this.metrics.length;
    });

    return averages;
  }

  public isPerformanceGood(): boolean {
    const averages = this.getAverageMetrics();
    
    // Check Core Web Vitals thresholds
    const lcpGood = !averages.lcp || averages.lcp <= 2500;
    const fidGood = !averages.fid || averages.fid <= 100;
    const clsGood = !averages.cls || averages.cls <= 0.1;
    
    return lcpGood && fidGood && clsGood;
  }

  public getPerformanceScore(): number {
    const averages = this.getAverageMetrics();
    
    let score = 100;
    
    // LCP scoring (0-40 points)
    if (averages.lcp) {
      if (averages.lcp <= 2500) score -= 0;
      else if (averages.lcp <= 4000) score -= 20;
      else score -= 40;
    }
    
    // FID scoring (0-30 points)
    if (averages.fid) {
      if (averages.fid <= 100) score -= 0;
      else if (averages.fid <= 300) score -= 15;
      else score -= 30;
    }
    
    // CLS scoring (0-30 points)
    if (averages.cls) {
      if (averages.cls <= 0.1) score -= 0;
      else if (averages.cls <= 0.25) score -= 15;
      else score -= 30;
    }
    
    return Math.max(0, score);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions
export function startPerformanceTimer(name: string): () => void {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    performanceMonitor.trackMetric({
      [name]: duration,
      route: window.location.pathname,
    });
  };
}

export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return fn().finally(() => {
    const duration = performance.now() - start;
    performanceMonitor.trackMetric({
      [name]: duration,
      route: window.location.pathname,
    });
  });
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    trackMetric: (metric: Partial<PerformanceMetrics>) => 
      performanceMonitor.trackMetric(metric),
    trackAIMetric: (metric: AIPerformanceMetrics) => 
      performanceMonitor.trackAIMetric(metric),
    trackDatabaseMetric: (metric: Omit<DatabaseMetrics, 'timestamp' | 'userId'>) => 
      performanceMonitor.trackDatabaseMetric(metric),
    getMetrics: () => performanceMonitor.getMetrics(),
    getAverageMetrics: () => performanceMonitor.getAverageMetrics(),
    isPerformanceGood: () => performanceMonitor.isPerformanceGood(),
    getPerformanceScore: () => performanceMonitor.getPerformanceScore(),
    startTimer: startPerformanceTimer,
    measureAsync,
  };
}