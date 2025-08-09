import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/services/logger';

interface WebVitalMetric {
  name: string;
  value: number;
  delta?: number;
  id: string;
  url?: string;
  userAgent?: string;
  timestamp?: number;
}

// In-memory storage for demo (use database in production)
const metricsStore: WebVitalMetric[] = [];

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();
    
    // Validate metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Enrich metric with additional data
    const enrichedMetric: WebVitalMetric = {
      ...metric,
      url: metric.url || request.headers.get('referer') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: Date.now()
    };

    // Store metric (in production, save to database)
    metricsStore.push(enrichedMetric);

    // Log performance issues
    if (shouldLogMetric(enrichedMetric)) {
      logger.warn('Performance metric alert', 'web-vitals', enrichedMetric);
    }

    // Keep only last 1000 metrics in memory
    if (metricsStore.length > 1000) {
      metricsStore.splice(0, metricsStore.length - 1000);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing web vital metric', 'web-vitals', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const metric = url.searchParams.get('metric');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let filteredMetrics = metricsStore;

    if (metric) {
      filteredMetrics = metricsStore.filter(m => m.name === metric);
    }

    // Get most recent metrics
    const recentMetrics = filteredMetrics
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit);

    // Calculate aggregations
    const aggregations = calculateAggregations(filteredMetrics);

    return NextResponse.json({
      metrics: recentMetrics,
      aggregations,
      total: filteredMetrics.length
    });
  } catch (error) {
    logger.error('Error fetching web vitals', 'web-vitals', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to determine if a metric should be logged
function shouldLogMetric(metric: WebVitalMetric): boolean {
  const thresholds = {
    CLS: 0.25,      // Cumulative Layout Shift - poor if > 0.25
    FID: 300,       // First Input Delay - poor if > 300ms
    FCP: 3000,      // First Contentful Paint - poor if > 3s
    LCP: 4000,      // Largest Contentful Paint - poor if > 4s
    TTFB: 1800,     // Time to First Byte - poor if > 1.8s
    'slow-load': 3000 // Custom slow load metric
  };

  const threshold = thresholds[metric.name as keyof typeof thresholds];
  return threshold !== undefined && metric.value > threshold;
}

// Calculate aggregations for analytics
function calculateAggregations(metrics: WebVitalMetric[]) {
  if (metrics.length === 0) {
    return {};
  }

  const grouped = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric.value);
    return acc;
  }, {} as Record<string, number[]>);

  const aggregations: Record<string, any> = {};

  for (const [name, values] of Object.entries(grouped)) {
    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    aggregations[name] = {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.90)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }

  return aggregations;
}