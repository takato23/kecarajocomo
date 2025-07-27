/**
 * Sistema de monitoreo de performance para KeCarajoComer
 * Monitorea Core Web Vitals, métricas de API, y performance de componentes
 */

import { logger } from '@/services/logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  timestamp: Date;
}

export interface ApiPerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  timestamp: Date;
  size?: number;
  fromCache?: boolean;
}

export interface ComponentPerformanceMetric {
  componentName: string;
  renderTime: number;
  reRenderCount: number;
  timestamp: Date;
  props?: Record<string, any>;
}

export interface PerformanceReport {
  webVitals: WebVitalsMetric[];
  apiMetrics: ApiPerformanceMetric[];
  componentMetrics: ComponentPerformanceMetric[];
  systemMetrics: {
    memoryUsage?: number;
    connectionType?: string;
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
  timestamp: Date;
}

/**
 * Monitor principal de performance
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitalsMetric[] = [];
  private apiMetrics: ApiPerformanceMetric[] = [];
  private componentMetrics: ComponentPerformanceMetric[] = [];
  private isEnabled = true;
  private reportingInterval = 30000; // 30 seconds
  private maxMetrics = 1000;

  constructor() {
    this.initializeWebVitals();
    this.initializeNavigationTiming();
    this.startPeriodicReporting();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Inicializa monitoreo de Web Vitals
   */
  private async initializeWebVitals(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const { onFCP, onLCP, onFID, onCLS, onTTFB, onINP } = await import('web-vitals');

      const handleMetric = (metric: any) => {
        const webVitalMetric: WebVitalsMetric = {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          timestamp: new Date(),
        };

        this.webVitals.push(webVitalMetric);
        this.trimMetrics();

        logger.info(`Web Vital: ${metric.name}`, 'PerformanceMonitor', {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
        });
      };

      onFCP(handleMetric);
      onLCP(handleMetric);
      onFID(handleMetric);
      onCLS(handleMetric);
      onTTFB(handleMetric);
      onINP(handleMetric);
    } catch (error) {
      logger.warn('Failed to initialize Web Vitals:', 'PerformanceMonitor', error);
    }
  }

  /**
   * Inicializa monitoreo de Navigation Timing
   */
  private initializeNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.recordMetric('navigation.domContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
        this.recordMetric('navigation.load', navigation.loadEventEnd - navigation.loadEventStart);
        this.recordMetric('navigation.domComplete', navigation.domComplete - navigation.navigationStart);
        this.recordMetric('navigation.firstByte', navigation.responseStart - navigation.requestStart);
      }
    });
  }

  /**
   * Registra una métrica genérica
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      tags,
      metadata,
    };

    this.metrics.push(metric);
    this.trimMetrics();

    logger.info(`Performance metric: ${name}`, 'PerformanceMonitor', {
      value,
      tags,
      metadata,
    });
  }

  /**
   * Registra métricas de API
   */
  recordApiMetric(metric: Omit<ApiPerformanceMetric, 'timestamp'>): void {
    if (!this.isEnabled) return;

    const apiMetric: ApiPerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.apiMetrics.push(apiMetric);
    this.trimMetrics();

    // Log slow APIs
    if (metric.duration > 3000) {
      logger.warn('Slow API detected:', 'PerformanceMonitor', {
        endpoint: metric.endpoint,
        duration: metric.duration,
        method: metric.method,
      });
    }
  }

  /**
   * Registra métricas de componentes React
   */
  recordComponentMetric(metric: Omit<ComponentPerformanceMetric, 'timestamp'>): void {
    if (!this.isEnabled) return;

    const componentMetric: ComponentPerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.componentMetrics.push(componentMetric);
    this.trimMetrics();

    // Log slow renders
    if (metric.renderTime > 50) {
      logger.warn('Slow component render:', 'PerformanceMonitor', {
        component: metric.componentName,
        renderTime: metric.renderTime,
        reRenderCount: metric.reRenderCount,
      });
    }
  }

  /**
   * Obtiene métricas del sistema
   */
  private getSystemMetrics(): PerformanceReport['systemMetrics'] {
    if (typeof window === 'undefined') return {};

    const metrics: PerformanceReport['systemMetrics'] = {};

    // Memory usage
    if ('memory' in performance) {
      metrics.memoryUsage = (performance as any).memory?.usedJSHeapSize;
    }

    // Connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      metrics.connectionType = connection?.effectiveType;
    }

    // Device capabilities
    if ('deviceMemory' in navigator) {
      metrics.deviceMemory = (navigator as any).deviceMemory;
    }

    if ('hardwareConcurrency' in navigator) {
      metrics.hardwareConcurrency = navigator.hardwareConcurrency;
    }

    return metrics;
  }

  /**
   * Genera reporte completo de performance
   */
  generateReport(): PerformanceReport {
    return {
      webVitals: [...this.webVitals],
      apiMetrics: [...this.apiMetrics],
      componentMetrics: [...this.componentMetrics],
      systemMetrics: this.getSystemMetrics(),
      timestamp: new Date(),
    };
  }

  /**
   * Obtiene métricas de Core Web Vitals actuales
   */
  getWebVitals(): Record<string, WebVitalsMetric | undefined> {
    const latest: Record<string, WebVitalsMetric> = {};
    
    this.webVitals.forEach(metric => {
      if (!latest[metric.name] || metric.timestamp > latest[metric.name].timestamp) {
        latest[metric.name] = metric;
      }
    });

    return latest;
  }

  /**
   * Obtiene estadísticas de APIs
   */
  getApiStats(timeWindow = 5 * 60 * 1000): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowRequests: number;
  } {
    const now = new Date();
    const cutoff = new Date(now.getTime() - timeWindow);
    
    const recentMetrics = this.apiMetrics.filter(m => m.timestamp >= cutoff);
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequests: 0,
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const errorCount = recentMetrics.filter(m => !m.success).length;
    const slowRequests = recentMetrics.filter(m => m.duration > 3000).length;

    return {
      totalRequests,
      averageResponseTime,
      errorRate: errorCount / totalRequests,
      slowRequests,
    };
  }

  /**
   * Obtiene alertas de performance
   */
  getPerformanceAlerts(): string[] {
    const alerts: string[] = [];
    const webVitals = this.getWebVitals();
    const apiStats = this.getApiStats();

    // Check Web Vitals
    if (webVitals.LCP && webVitals.LCP.rating === 'poor') {
      alerts.push(`LCP is poor: ${webVitals.LCP.value}ms (target: <2500ms)`);
    }

    if (webVitals.FID && webVitals.FID.rating === 'poor') {
      alerts.push(`FID is poor: ${webVitals.FID.value}ms (target: <100ms)`);
    }

    if (webVitals.CLS && webVitals.CLS.rating === 'poor') {
      alerts.push(`CLS is poor: ${webVitals.CLS.value} (target: <0.1)`);
    }

    // Check API performance
    if (apiStats.errorRate > 0.05) {
      alerts.push(`High API error rate: ${(apiStats.errorRate * 100).toFixed(1)}%`);
    }

    if (apiStats.averageResponseTime > 2000) {
      alerts.push(`Slow API responses: ${apiStats.averageResponseTime.toFixed(0)}ms average`);
    }

    // Check memory usage
    const systemMetrics = this.getSystemMetrics();
    if (systemMetrics.memoryUsage && systemMetrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      alerts.push(`High memory usage: ${(systemMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    }

    return alerts;
  }

  /**
   * Limpia métricas antigas para evitar memory leaks
   */
  private trimMetrics(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    if (this.webVitals.length > this.maxMetrics) {
      this.webVitals = this.webVitals.slice(-this.maxMetrics);
    }
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics);
    }
    if (this.componentMetrics.length > this.maxMetrics) {
      this.componentMetrics = this.componentMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Inicia reporte periódico de métricas
   */
  private startPeriodicReporting(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      const report = this.generateReport();
      const alerts = this.getPerformanceAlerts();

      if (alerts.length > 0) {
        logger.warn('Performance alerts detected:', 'PerformanceMonitor', alerts);
      }

      // En desarrollo, log métricas cada 30 segundos
      if (process.env.NODE_ENV === 'development') {
        logger.info('Performance report:', 'PerformanceMonitor', {
          webVitals: this.getWebVitals(),
          apiStats: this.getApiStats(),
          alerts,
        });
      }
    }, this.reportingInterval);
  }

  /**
   * Habilita/deshabilita monitoreo
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Limpia todas las métricas
   */
  clearMetrics(): void {
    this.metrics = [];
    this.webVitals = [];
    this.apiMetrics = [];
    this.componentMetrics = [];
  }
}

// Export singleton
export const performanceMonitor = PerformanceMonitor.getInstance();

// Hooks para React
export function usePerformanceMonitor() {
  return {
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    recordApiMetric: performanceMonitor.recordApiMetric.bind(performanceMonitor),
    recordComponentMetric: performanceMonitor.recordComponentMetric.bind(performanceMonitor),
    getWebVitals: performanceMonitor.getWebVitals.bind(performanceMonitor),
    getApiStats: performanceMonitor.getApiStats.bind(performanceMonitor),
    getPerformanceAlerts: performanceMonitor.getPerformanceAlerts.bind(performanceMonitor),
  };
}

// Component wrapper para monitorear renders
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const startTime = performance.now();
    const [renderCount, setRenderCount] = React.useState(0);

    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      performanceMonitor.recordComponentMetric({
        componentName: componentName || Component.displayName || Component.name || 'Unknown',
        renderTime,
        reRenderCount: renderCount,
        props: process.env.NODE_ENV === 'development' ? props : undefined,
      });

      setRenderCount(prev => prev + 1);
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}