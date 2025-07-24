/**
 * Database Performance Analytics API Endpoint
 * Handles database query performance metrics and optimization insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { metrics } = await request.json();

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    // Process and validate database metrics
    const processedMetrics = metrics.map(metric => ({
      ...metric,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date(metric.timestamp || Date.now()).toISOString(),
    }));

    // Store in database
    const supabase = getSupabaseClient();
    const { error: insertError } = await supabase
      .from('database_performance_metrics')
      .insert(processedMetrics);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store database metrics' },
        { status: 500 }
      );
    }

    // Analyze database performance
    const analysis = await analyzeDatabasePerformance(processedMetrics);

    return NextResponse.json({
      success: true,
      stored: processedMetrics.length,
      analysis,
    });
  } catch (error: unknown) {
    console.error('Database performance analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '24h';
    const query = searchParams.get('query');
    const slowOnly = searchParams.get('slowOnly') === 'true';

    // Calculate time range
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange] || 24 * 60 * 60 * 1000;

    const startTime = new Date(now.getTime() - timeRangeMs);

    const supabase = getSupabaseClient();
    let dbQuery = supabase
      .from('database_performance_metrics')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (query) {
      dbQuery = dbQuery.ilike('query', `%${query}%`);
    }

    if (slowOnly) {
      dbQuery = dbQuery.gt('duration', 1000); // Queries slower than 1 second
    }

    const { data: metrics, error } = await dbQuery.limit(5000);

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch database metrics' },
        { status: 500 }
      );
    }

    // Calculate aggregated database metrics
    const aggregatedMetrics = calculateAggregatedDatabaseMetrics(metrics || []);

    return NextResponse.json({
      success: true,
      metrics: metrics || [],
      aggregated: aggregatedMetrics,
      timeRange,
    });
  } catch (error: unknown) {
    console.error('Database performance analytics GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeDatabasePerformance(metrics: any[]): Promise<any[]> {
  const analysis = [];

  // Calculate metrics by query type
  const queryMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.query]) {
      acc[metric.query] = {
        count: 0,
        totalDuration: 0,
        totalRows: 0,
        cacheHits: 0,
        slowQueries: 0,
      };
    }

    const query = acc[metric.query];
    query.count++;
    query.totalDuration += metric.duration;
    query.totalRows += metric.rows;
    
    if (metric.cached) {
      query.cacheHits++;
    }
    
    if (metric.duration > 1000) {
      query.slowQueries++;
    }

    return acc;
  }, {} as Record<string, any>);

  // Generate insights
  Object.entries(queryMetrics).forEach(([queryName, stats]) => {
    const avgDuration = stats.totalDuration / stats.count;
    const avgRows = stats.totalRows / stats.count;
    const cacheHitRate = (stats.cacheHits / stats.count) * 100;
    const slowQueryRate = (stats.slowQueries / stats.count) * 100;

    // Performance alerts
    if (avgDuration > 2000) {
      analysis.push({
        type: 'performance',
        severity: 'high',
        query: queryName,
        message: `Average query time ${avgDuration.toFixed(0)}ms is high`,
        recommendation: 'Consider adding indexes or optimizing query',
        metric: 'duration',
        value: avgDuration,
      });
    }

    if (slowQueryRate > 20) {
      analysis.push({
        type: 'performance',
        severity: 'medium',
        query: queryName,
        message: `${slowQueryRate.toFixed(1)}% of queries are slow`,
        recommendation: 'Review query structure and add appropriate indexes',
        metric: 'slow_query_rate',
        value: slowQueryRate,
      });
    }

    if (cacheHitRate < 30 && stats.count > 10) {
      analysis.push({
        type: 'efficiency',
        severity: 'medium',
        query: queryName,
        message: `Cache hit rate ${cacheHitRate.toFixed(1)}% is low`,
        recommendation: 'Increase cache TTL or review caching strategy',
        metric: 'cache_hit_rate',
        value: cacheHitRate,
      });
    }

    if (avgRows > 1000) {
      analysis.push({
        type: 'efficiency',
        severity: 'low',
        query: queryName,
        message: `Average rows returned ${avgRows.toFixed(0)} is high`,
        recommendation: 'Consider pagination or filtering',
        metric: 'rows',
        value: avgRows,
      });
    }
  });

  return analysis;
}

function calculateAggregatedDatabaseMetrics(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      totalQueries: 0,
      avgDuration: 0,
      avgRows: 0,
      cacheHitRate: 0,
      slowQueryRate: 0,
      queryBreakdown: {},
      hourlyMetrics: [],
      topSlowQueries: [],
    };
  }

  const totalQueries = metrics.length;
  const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
  const avgRows = metrics.reduce((sum, m) => sum + m.rows, 0) / totalQueries;

  const cacheHits = metrics.filter(m => m.cached).length;
  const cacheHitRate = (cacheHits / totalQueries) * 100;

  const slowQueries = metrics.filter(m => m.duration > 1000).length;
  const slowQueryRate = (slowQueries / totalQueries) * 100;

  // Query breakdown
  const queryBreakdown = metrics.reduce((acc, metric) => {
    if (!acc[metric.query]) {
      acc[metric.query] = {
        count: 0,
        avgDuration: 0,
        avgRows: 0,
        cacheHitRate: 0,
        slowQueryRate: 0,
      };
    }

    const query = acc[metric.query];
    query.count++;
    query.avgDuration += metric.duration;
    query.avgRows += metric.rows;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages for each query
  Object.values(queryBreakdown).forEach((query: any) => {
    query.avgDuration = query.avgDuration / query.count;
    query.avgRows = query.avgRows / query.count;
    
    const queryMetrics = metrics.filter(m => m.query === query.query);
    query.cacheHitRate = (queryMetrics.filter(m => m.cached).length / queryMetrics.length) * 100;
    query.slowQueryRate = (queryMetrics.filter(m => m.duration > 1000).length / queryMetrics.length) * 100;
  });

  // Top slow queries
  const topSlowQueries = metrics
    .filter(m => m.duration > 1000)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)
    .map(m => ({
      query: m.query,
      duration: m.duration,
      rows: m.rows,
      cached: m.cached,
      timestamp: m.timestamp,
    }));

  // Hourly metrics for the last 24 hours
  const hourlyMetrics = generateHourlyDatabaseMetrics(metrics);

  return {
    totalQueries,
    avgDuration,
    avgRows,
    cacheHitRate,
    slowQueryRate,
    queryBreakdown,
    hourlyMetrics,
    topSlowQueries,
  };
}

function generateHourlyDatabaseMetrics(metrics: any[]) {
  const now = new Date();
  const hourlyData = [];

  // Generate last 24 hours
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const hourMetrics = metrics.filter(m => {
      const metricTime = new Date(m.timestamp);
      return metricTime >= hourStart && metricTime < hourEnd;
    });

    const queries = hourMetrics.length;
    const avgDuration = queries > 0 ? hourMetrics.reduce((sum, m) => sum + m.duration, 0) / queries : 0;
    const cacheHitRate = queries > 0 ? (hourMetrics.filter(m => m.cached).length / queries) * 100 : 0;
    const slowQueryRate = queries > 0 ? (hourMetrics.filter(m => m.duration > 1000).length / queries) * 100 : 0;

    hourlyData.push({
      hour: hourStart.toISOString(),
      queries,
      avgDuration,
      cacheHitRate,
      slowQueryRate,
    });
  }

  return hourlyData;
}