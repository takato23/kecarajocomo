/**
 * Performance Analytics API Endpoint
 * Handles performance metrics collection and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { metrics } = await request.json();

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    // Process and validate metrics
    const processedMetrics = metrics.map(metric => ({
      ...metric,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString(),
    }));

    // Store in database
    const { error: insertError } = await supabase
      .from('performance_metrics')
      .insert(processedMetrics);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store metrics' },
        { status: 500 }
      );
    }

    // Analyze for alerts
    const alerts = await analyzePerformanceMetrics(processedMetrics);

    return NextResponse.json({
      success: true,
      stored: processedMetrics.length,
      alerts,
    });
  } catch (error: unknown) {
    console.error('Performance analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '1h';
    const userId = searchParams.get('userId');

    // Calculate time range
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange] || 60 * 60 * 1000;

    const startTime = new Date(now.getTime() - timeRangeMs);

    let query = supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data: metrics, error } = await query.limit(1000);

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    // Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedMetrics(metrics || []);

    return NextResponse.json({
      success: true,
      metrics: metrics || [],
      aggregated: aggregatedMetrics,
      timeRange,
    });
  } catch (error: unknown) {
    console.error('Performance analytics GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzePerformanceMetrics(metrics: any[]): Promise<any[]> {
  const alerts = [];

  for (const metric of metrics) {
    // Check Core Web Vitals thresholds
    if (metric.lcp && metric.lcp > 4000) {
      alerts.push({
        type: 'performance',
        severity: 'high',
        message: `LCP ${metric.lcp}ms exceeds threshold (4000ms)`,
        route: metric.route,
        timestamp: metric.timestamp,
      });
    }

    if (metric.fid && metric.fid > 300) {
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: `FID ${metric.fid}ms exceeds threshold (300ms)`,
        route: metric.route,
        timestamp: metric.timestamp,
      });
    }

    if (metric.cls && metric.cls > 0.25) {
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: `CLS ${metric.cls} exceeds threshold (0.25)`,
        route: metric.route,
        timestamp: metric.timestamp,
      });
    }

    if (metric.ttfb && metric.ttfb > 2000) {
      alerts.push({
        type: 'performance',
        severity: 'high',
        message: `TTFB ${metric.ttfb}ms exceeds threshold (2000ms)`,
        route: metric.route,
        timestamp: metric.timestamp,
      });
    }
  }

  return alerts;
}

function calculateAggregatedMetrics(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      averages: {},
      p95: {},
      p99: {},
      count: 0,
    };
  }

  const numericFields = ['lcp', 'fid', 'cls', 'fcp', 'ttfb'];
  const aggregated: any = {
    averages: {},
    p95: {},
    p99: {},
    count: metrics.length,
  };

  numericFields.forEach(field => {
    const values = metrics
      .map(m => m[field])
      .filter(v => v !== null && v !== undefined && !isNaN(v))
      .sort((a, b) => a - b);

    if (values.length > 0) {
      aggregated.averages[field] = values.reduce((sum, v) => sum + v, 0) / values.length;
      aggregated.p95[field] = values[Math.floor(values.length * 0.95)] || 0;
      aggregated.p99[field] = values[Math.floor(values.length * 0.99)] || 0;
    }
  });

  return aggregated;
}