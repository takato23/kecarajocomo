'use client';

import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { getAllCacheStats } from '@/lib/cache/OptimizedCache';
import { errorReportingService } from '@/lib/error/ErrorReporting';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Activity,
  Clock,
  Database,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  HardDrive,
  Wifi,
  Bug,
} from 'lucide-react';

interface PerformanceDebugPanelProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  minimized?: boolean;
  onToggle?: (minimized: boolean) => void;
}

export function PerformanceDebugPanel({
  position = 'bottom-right',
  minimized: initialMinimized = true,
  onToggle,
}: PerformanceDebugPanelProps) {
  const [minimized, setMinimized] = useState(initialMinimized);
  const [webVitals, setWebVitals] = useState<any>({});
  const [apiStats, setApiStats] = useState<any>({});
  const [cacheStats, setCacheStats] = useState<any>({});
  const [alerts, setAlerts] = useState<string[]>([]);
  const [errorMetrics, setErrorMetrics] = useState<any>({});

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleToggle = () => {
    const newMinimized = !minimized;
    setMinimized(newMinimized);
    onToggle?.(newMinimized);
  };

  const refreshData = () => {
    const vitals = performanceMonitor.getWebVitals();
    const apiData = performanceMonitor.getApiStats();
    const cacheData = getAllCacheStats();
    const alertData = performanceMonitor.getPerformanceAlerts();
    const errorData = errorReportingService.getMetrics();

    setWebVitals(vitals);
    setApiStats(apiData);
    setCacheStats(cacheData);
    setAlerts(alertData);
    setErrorMetrics(errorData);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getPositionClasses = () => {
    const base = 'fixed z-50 transition-all duration-200';
    switch (position) {
      case 'top-right':
        return `${base} top-4 right-4`;
      case 'top-left':
        return `${base} top-4 left-4`;
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      default:
        return `${base} bottom-4 right-4`;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (minimized) {
    return (
      <div className={getPositionClasses()}>
        <Button
          onClick={handleToggle}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg hover:bg-white"
        >
          <Activity className="w-4 h-4 mr-2" />
          Perf
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2 h-4 text-xs">
              {alerts.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={getPositionClasses()}>
      <Card className="w-96 bg-white/95 backdrop-blur-sm shadow-2xl border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshData}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button
                onClick={handleToggle}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
              >
                ×
              </Button>
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Performance Alerts ({alerts.length})
                </span>
              </div>
              <div className="space-y-1">
                {alerts.map((alert, index) => (
                  <p key={index} className="text-xs text-red-700">
                    {alert}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Tabs defaultValue="vitals" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="vitals" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Vitals
              </TabsTrigger>
              <TabsTrigger value="api" className="text-xs">
                <Wifi className="w-3 h-3 mr-1" />
                API
              </TabsTrigger>
              <TabsTrigger value="cache" className="text-xs">
                <HardDrive className="w-3 h-3 mr-1" />
                Cache
              </TabsTrigger>
              <TabsTrigger value="errors" className="text-xs">
                <Bug className="w-3 h-3 mr-1" />
                Errors
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vitals" className="mt-4 space-y-3">
              <div className="space-y-2">
                {Object.entries(webVitals).map(([name, metric]: [string, any]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRatingColor(metric?.rating || 'unknown')}`}
                      >
                        {metric?.rating || 'unknown'}
                      </Badge>
                    </div>
                    <span className="text-gray-600">
                      {metric?.value ? formatDuration(metric.value) : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="api" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Requests:</span>
                  <div className="font-medium">{apiStats.totalRequests || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">Avg Response:</span>
                  <div className="font-medium">
                    {apiStats.averageResponseTime ? formatDuration(apiStats.averageResponseTime) : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Error Rate:</span>
                  <div className="font-medium">
                    {apiStats.errorRate ? (apiStats.errorRate * 100).toFixed(1) + '%' : '0%'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Slow Requests:</span>
                  <div className="font-medium">{apiStats.slowRequests || 0}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cache" className="mt-4 space-y-3">
              <div className="space-y-2">
                {Object.entries(cacheStats).map(([name, stats]: [string, any]) => (
                  <div key={name} className="border rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(stats.hitRate * 100).toFixed(1)}% hit rate
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Entries: {stats.entryCount}</div>
                      <div>Size: {formatBytes(stats.totalSize)}</div>
                      <div>Hits: {stats.hits}</div>
                      <div>Misses: {stats.misses}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="errors" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Total Errors:</span>
                  <div className="font-medium">{errorMetrics.total || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">Critical:</span>
                  <div className="font-medium text-red-600">
                    {errorMetrics.bySeverity?.critical || 0}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">High:</span>
                  <div className="font-medium text-orange-600">
                    {errorMetrics.bySeverity?.high || 0}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Medium:</span>
                  <div className="font-medium text-yellow-600">
                    {errorMetrics.bySeverity?.medium || 0}
                  </div>
                </div>
              </div>
              
              {errorMetrics.trends && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Trend:</span>
                  <div className="flex items-center gap-1">
                    {errorMetrics.trends.increasing ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                    <span className={errorMetrics.trends.increasing ? 'text-red-600' : 'text-green-600'}>
                      {errorMetrics.trends.rate}/hour
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}