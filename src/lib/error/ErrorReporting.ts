/**
 * Comprehensive error reporting and monitoring service
 * Provides structured error logging, metrics collection, and monitoring integration
 */

import { ProfileError } from '@/services/error/ProfileErrorHandler';

/**
 * Error report interface
 */
export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: {
    name: string;
    message: string;
    code?: string;
    severity?: string;
    stack?: string;
  };
  context: {
    component?: string;
    user?: {
      id?: string;
      sessionId?: string;
    };
    application: {
      version: string;
      environment: string;
      url: string;
      userAgent: string;
      viewport?: {
        width: number;
        height: number;
      };
    };
    performance?: {
      memory?: number;
      timing?: PerformanceTiming;
    };
    custom?: Record<string, any>;
  };
  fingerprint: string;
  tags: string[];
}

/**
 * Error metrics interface
 */
export interface ErrorMetrics {
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  byComponent: Record<string, number>;
  byTimeRange: Record<string, number>;
  trends: {
    increasing: boolean;
    rate: number;
    timeWindow: string;
  };
}

/**
 * Monitoring service interface
 */
export interface MonitoringService {
  reportError(report: ErrorReport): Promise<void>;
  reportMetrics(metrics: ErrorMetrics): Promise<void>;
  isHealthy(): Promise<boolean>;
}

/**
 * Built-in console monitoring service for development
 */
class ConsoleMonitoringService implements MonitoringService {
  async reportError(report: ErrorReport): Promise<void> {
    console.group(`🚨 Error Report [${report.error.severity?.toUpperCase() || 'UNKNOWN'}]`);
    console.log('ID:', report.id);
    console.log('Timestamp:', report.timestamp.toISOString());
    console.log('Error:', report.error);
    console.log('Context:', report.context);
    console.log('Fingerprint:', report.fingerprint);
    console.log('Tags:', report.tags);
    console.groupEnd();
  }

  async reportMetrics(metrics: ErrorMetrics): Promise<void> {
    console.group('📊 Error Metrics');
    console.log('Total Errors:', metrics.total);
    console.log('By Code:', metrics.byCode);
    console.log('By Severity:', metrics.bySeverity);
    console.log('By Component:', metrics.byComponent);
    console.log('Trends:', metrics.trends);
    console.groupEnd();
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

/**
 * Sentry monitoring service implementation
 */
class SentryMonitoringService implements MonitoringService {
  private sentryDsn: string;
  private initialized = false;

  constructor(dsn: string) {
    this.sentryDsn = dsn;
    this.initializeSentry();
  }

  private async initializeSentry(): Promise<void> {
    try {
      // Dynamic import for Sentry to avoid SSR issues
      const Sentry = await import('@sentry/browser');
      
      Sentry.init({
        dsn: this.sentryDsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
          new Sentry.BrowserTracing(),
        ],
        beforeSend: (event) => {
          // Filter out low-severity errors in production
          if (process.env.NODE_ENV === 'production' && 
              event.tags?.severity === 'low') {
            return null;
          }
          return event;
        }
      });

      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  async reportError(report: ErrorReport): Promise<void> {
    if (!this.initialized) {
      console.warn('Sentry not initialized, falling back to console');
      const consoleService = new ConsoleMonitoringService();
      return consoleService.reportError(report);
    }

    try {
      const Sentry = await import('@sentry/browser');
      
      Sentry.withScope((scope) => {
        // Set context
        scope.setTag('component', report.context.component || 'unknown');
        scope.setTag('errorCode', report.error.code || 'unknown');
        scope.setTag('severity', report.error.severity || 'unknown');
        scope.setLevel(this.mapSeverityToSentryLevel(report.error.severity));
        
        // Set user context
        if (report.context.user?.id) {
          scope.setUser({
            id: report.context.user.id,
            sessionId: report.context.user.sessionId
          });
        }

        // Set extra context
        scope.setExtra('fingerprint', report.fingerprint);
        scope.setExtra('application', report.context.application);
        scope.setExtra('performance', report.context.performance);
        scope.setExtra('custom', report.context.custom);

        // Set fingerprint for grouping
        scope.setFingerprint([report.fingerprint]);

        // Report the error
        const error = new Error(report.error.message);
        error.name = report.error.name;
        error.stack = report.error.stack;
        
        Sentry.captureException(error);
      });
    } catch (error) {
      console.error('Failed to report error to Sentry:', error);
    }
  }

  async reportMetrics(metrics: ErrorMetrics): Promise<void> {
    // Sentry doesn't have direct metrics API, so we'll send as events
    try {
      const Sentry = await import('@sentry/browser');
      
      Sentry.addBreadcrumb({
        category: 'metrics',
        message: 'Error metrics report',
        data: metrics,
        level: 'info'
      });
    } catch (error) {
      console.error('Failed to report metrics to Sentry:', error);
    }
  }

  async isHealthy(): Promise<boolean> {
    return this.initialized;
  }

  private mapSeverityToSentryLevel(severity?: string): import('@sentry/browser').SeverityLevel {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'fatal';
      default: return 'error';
    }
  }
}

/**
 * Local storage monitoring service for offline capability
 */
class LocalStorageMonitoringService implements MonitoringService {
  private readonly storageKey = 'error_reports';
  private readonly maxReports = 100;

  async reportError(report: ErrorReport): Promise<void> {
    try {
      const existingReports = this.getStoredReports();
      existingReports.unshift(report);
      
      // Keep only the most recent reports
      const trimmedReports = existingReports.slice(0, this.maxReports);
      
      localStorage.setItem(this.storageKey, JSON.stringify(trimmedReports));
    } catch (error) {
      console.warn('Failed to store error report locally:', error);
    }
  }

  async reportMetrics(metrics: ErrorMetrics): Promise<void> {
    try {
      localStorage.setItem('error_metrics', JSON.stringify({
        ...metrics,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to store error metrics locally:', error);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      localStorage.setItem('health_check', 'ok');
      localStorage.removeItem('health_check');
      return true;
    } catch {
      return false;
    }
  }

  getStoredReports(): ErrorReport[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearStoredReports(): void {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem('error_metrics');
    } catch (error) {
      console.warn('Failed to clear stored reports:', error);
    }
  }

  async syncWithRemote(remoteService: MonitoringService): Promise<void> {
    const reports = this.getStoredReports();
    
    for (const report of reports) {
      try {
        await remoteService.reportError(report);
      } catch (error) {
        console.warn('Failed to sync report with remote service:', error);
        break; // Stop syncing if remote service is unavailable
      }
    }
    
    // Clear reports after successful sync
    this.clearStoredReports();
  }
}

/**
 * Error reporting service with multiple backends
 */
export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private services: MonitoringService[] = [];
  private localService: LocalStorageMonitoringService;
  private metrics: ErrorMetrics = {
    total: 0,
    byCode: {},
    bySeverity: {},
    byComponent: {},
    byTimeRange: {},
    trends: {
      increasing: false,
      rate: 0,
      timeWindow: '1h'
    }
  };
  private reportHistory: ErrorReport[] = [];

  constructor() {
    this.localService = new LocalStorageMonitoringService();
    this.initializeServices();
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private initializeServices(): void {
    // Always add console service for development
    if (process.env.NODE_ENV === 'development') {
      this.services.push(new ConsoleMonitoringService());
    }

    // Add Sentry service if DSN is provided
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (sentryDsn && process.env.NODE_ENV === 'production') {
      this.services.push(new SentryMonitoringService(sentryDsn));
    }

    // Always add local storage service for offline capability
    this.services.push(this.localService);
  }

  /**
   * Report an error to all configured monitoring services
   */
  async reportError(
    error: Error | ProfileError,
    context?: {
      component?: string;
      custom?: Record<string, any>;
    }
  ): Promise<void> {
    const report = this.createErrorReport(error, context);
    
    // Add to local history
    this.reportHistory.unshift(report);
    if (this.reportHistory.length > 1000) {
      this.reportHistory = this.reportHistory.slice(0, 1000);
    }

    // Update metrics
    this.updateMetrics(report);

    // Report to all services
    const reportPromises = this.services.map(async (service) => {
      try {
        await service.reportError(report);
      } catch (err) {
        console.warn('Failed to report error to monitoring service:', err);
      }
    });

    await Promise.allSettled(reportPromises);
  }

  /**
   * Create a structured error report
   */
  private createErrorReport(
    error: Error | ProfileError,
    context?: {
      component?: string;
      custom?: Record<string, any>;
    }
  ): ErrorReport {
    const id = this.generateId();
    const timestamp = new Date();
    const fingerprint = this.generateFingerprint(error, context);
    
    // Collect performance data if available
    let performance: any = {};
    if (typeof window !== 'undefined') {
      try {
        if ('memory' in performance) {
          performance.memory = (performance as any).memory?.usedJSHeapSize;
        }
        if (window.performance?.timing) {
          performance.timing = window.performance.timing;
        }
      } catch {
        // Ignore performance collection errors
      }
    }

    return {
      id,
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        code: error instanceof ProfileError ? error.code : undefined,
        severity: error instanceof ProfileError ? error.severity : 'medium',
        stack: error.stack
      },
      context: {
        component: context?.component,
        user: {
          // TODO: Get from auth context
          sessionId: this.getSessionId()
        },
        application: {
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          viewport: typeof window !== 'undefined' ? {
            width: window.innerWidth,
            height: window.innerHeight
          } : undefined
        },
        performance,
        custom: context?.custom
      },
      fingerprint,
      tags: this.generateTags(error, context)
    };
  }

  /**
   * Generate unique ID for error report
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate fingerprint for error grouping
   */
  private generateFingerprint(
    error: Error | ProfileError,
    context?: {
      component?: string;
      custom?: Record<string, any>;
    }
  ): string {
    const parts = [
      error.name,
      error instanceof ProfileError ? error.code : 'generic',
      context?.component || 'unknown'
    ];
    
    // Add first line of stack trace for better grouping
    if (error.stack) {
      const firstStackLine = error.stack.split('\n')[1]?.trim();
      if (firstStackLine) {
        parts.push(firstStackLine);
      }
    }
    
    return btoa(parts.join('|')).substr(0, 16);
  }

  /**
   * Generate tags for categorization
   */
  private generateTags(
    error: Error | ProfileError,
    context?: {
      component?: string;
      custom?: Record<string, any>;
    }
  ): string[] {
    const tags = ['profile'];
    
    if (error instanceof ProfileError) {
      tags.push(`code:${error.code}`);
      tags.push(`severity:${error.severity}`);
      if (error.retryable) {
        tags.push('retryable');
      }
    }
    
    if (context?.component) {
      tags.push(`component:${context.component}`);
    }
    
    tags.push(`env:${process.env.NODE_ENV}`);
    
    return tags;
  }

  /**
   * Get session ID for tracking
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';
    
    let sessionId = sessionStorage.getItem('error_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Update error metrics
   */
  private updateMetrics(report: ErrorReport): void {
    this.metrics.total++;
    
    // Update by code
    const code = report.error.code || 'unknown';
    this.metrics.byCode[code] = (this.metrics.byCode[code] || 0) + 1;
    
    // Update by severity
    const severity = report.error.severity || 'unknown';
    this.metrics.bySeverity[severity] = (this.metrics.bySeverity[severity] || 0) + 1;
    
    // Update by component
    const component = report.context.component || 'unknown';
    this.metrics.byComponent[component] = (this.metrics.byComponent[component] || 0) + 1;
    
    // Update by time range (last hour)
    const hourKey = new Date(report.timestamp).toISOString().substr(0, 13);
    this.metrics.byTimeRange[hourKey] = (this.metrics.byTimeRange[hourKey] || 0) + 1;
    
    // Calculate trends
    this.calculateTrends();
    
    // Report metrics periodically
    if (this.metrics.total % 10 === 0) {
      this.reportMetrics();
    }
  }

  /**
   * Calculate error trends
   */
  private calculateTrends(): void {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = this.reportHistory.filter(
      report => report.timestamp >= hourAgo
    );
    
    const previousHourErrors = this.reportHistory.filter(
      report => 
        report.timestamp >= new Date(hourAgo.getTime() - 60 * 60 * 1000) &&
        report.timestamp < hourAgo
    );
    
    const currentRate = recentErrors.length;
    const previousRate = previousHourErrors.length;
    
    this.metrics.trends = {
      increasing: currentRate > previousRate,
      rate: currentRate,
      timeWindow: '1h'
    };
  }

  /**
   * Report metrics to monitoring services
   */
  private async reportMetrics(): Promise<void> {
    const reportPromises = this.services.map(async (service) => {
      try {
        await service.reportMetrics(this.metrics);
      } catch (err) {
        console.warn('Failed to report metrics to monitoring service:', err);
      }
    });

    await Promise.allSettled(reportPromises);
  }

  /**
   * Get current error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get error history
   */
  getErrorHistory(): ErrorReport[] {
    return [...this.reportHistory];
  }

  /**
   * Clear error history and metrics
   */
  clearHistory(): void {
    this.reportHistory = [];
    this.metrics = {
      total: 0,
      byCode: {},
      bySeverity: {},
      byComponent: {},
      byTimeRange: {},
      trends: {
        increasing: false,
        rate: 0,
        timeWindow: '1h'
      }
    };
  }

  /**
   * Health check for monitoring services
   */
  async healthCheck(): Promise<{ service: string; healthy: boolean }[]> {
    const healthChecks = await Promise.allSettled(
      this.services.map(async (service, index) => ({
        service: service.constructor.name,
        healthy: await service.isHealthy()
      }))
    );

    return healthChecks.map((result, index) => 
      result.status === 'fulfilled' 
        ? result.value 
        : { service: `Service${index}`, healthy: false }
    );
  }

  /**
   * Sync offline reports when connection is restored
   */
  async syncOfflineReports(): Promise<void> {
    if (navigator.onLine && this.services.length > 1) {
      const remoteServices = this.services.filter(
        service => !(service instanceof LocalStorageMonitoringService)
      );
      
      for (const remoteService of remoteServices) {
        try {
          await this.localService.syncWithRemote(remoteService);
          break; // Success, stop trying other services
        } catch (error) {
          console.warn('Failed to sync with remote service:', error);
        }
      }
    }
  }
}

// Export singleton instance
export const errorReportingService = ErrorReportingService.getInstance();

// Auto-sync offline reports when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    errorReportingService.syncOfflineReports();
  });
}