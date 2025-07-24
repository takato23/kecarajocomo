/**
 * AI Performance Analytics API Endpoint
 * Handles AI service performance metrics and optimization insights
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

    // Process and validate AI metrics
    const processedMetrics = metrics.map(metric => ({
      ...metric,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date(metric.timestamp || Date.now()).toISOString(),
    }));

    // Store in database
    const { error: insertError } = await supabase
      .from('ai_performance_metrics')
      .insert(processedMetrics);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store AI metrics' },
        { status: 500 }
      );
    }

    // Analyze AI performance
    const analysis = await analyzeAIPerformance(processedMetrics);

    return NextResponse.json({
      success: true,
      stored: processedMetrics.length,
      analysis,
    });
  } catch (error: unknown) {
    console.error('AI performance analytics error:', error);
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
    const model = searchParams.get('model');
    const endpoint = searchParams.get('endpoint');

    // Calculate time range
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange] || 24 * 60 * 60 * 1000;

    const startTime = new Date(now.getTime() - timeRangeMs);

    let query = supabase
      .from('ai_performance_metrics')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (model) {
      query = query.eq('model', model);
    }

    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }

    const { data: metrics, error } = await query.limit(5000);

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch AI metrics' },
        { status: 500 }
      );
    }

    // Calculate aggregated AI metrics
    const aggregatedMetrics = calculateAggregatedAIMetrics(metrics || []);

    return NextResponse.json({
      success: true,
      metrics: metrics || [],
      aggregated: aggregatedMetrics,
      timeRange,
    });
  } catch (error: unknown) {
    console.error('AI performance analytics GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeAIPerformance(metrics: any[]): Promise<any[]> {
  const analysis = [];

  // Calculate metrics by model
  const modelMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.model]) {
      acc[metric.model] = {
        requests: 0,
        totalDuration: 0,
        totalTokens: 0,
        errors: 0,
        cacheHits: 0,
      };
    }

    const model = acc[metric.model];
    model.requests++;
    model.totalDuration += metric.duration;
    model.totalTokens += metric.tokens;
    
    if (!metric.success) {
      model.errors++;
    }
    
    if (metric.cacheHit) {
      model.cacheHits++;
    }

    return acc;
  }, {} as Record<string, any>);

  // Generate insights
  Object.entries(modelMetrics).forEach(([model, stats]) => {
    const avgDuration = stats.totalDuration / stats.requests;
    const errorRate = (stats.errors / stats.requests) * 100;
    const cacheHitRate = (stats.cacheHits / stats.requests) * 100;
    const avgTokens = stats.totalTokens / stats.requests;

    // Performance alerts
    if (avgDuration > 5000) {
      analysis.push({
        type: 'performance',
        severity: 'high',
        model,
        message: `Average response time ${avgDuration.toFixed(0)}ms is high`,
        recommendation: 'Consider optimizing prompts or using a faster model',
        metric: 'duration',
        value: avgDuration,
      });
    }

    if (errorRate > 5) {
      analysis.push({
        type: 'reliability',
        severity: 'high',
        model,
        message: `Error rate ${errorRate.toFixed(1)}% is high`,
        recommendation: 'Check API limits and error handling',
        metric: 'error_rate',
        value: errorRate,
      });
    }

    if (cacheHitRate < 20) {
      analysis.push({
        type: 'efficiency',
        severity: 'medium',
        model,
        message: `Cache hit rate ${cacheHitRate.toFixed(1)}% is low`,
        recommendation: 'Review caching strategy and TTL settings',
        metric: 'cache_hit_rate',
        value: cacheHitRate,
      });
    }

    if (avgTokens > 3000) {
      analysis.push({
        type: 'cost',
        severity: 'medium',
        model,
        message: `Average tokens ${avgTokens.toFixed(0)} is high`,
        recommendation: 'Optimize prompts to reduce token usage',
        metric: 'tokens',
        value: avgTokens,
      });
    }
  });

  return analysis;
}

function calculateAggregatedAIMetrics(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      totalRequests: 0,
      successRate: 0,
      avgDuration: 0,
      avgTokens: 0,
      cacheHitRate: 0,
      modelBreakdown: {},
      endpointBreakdown: {},
      hourlyMetrics: [],
    };
  }

  const totalRequests = metrics.length;
  const successfulRequests = metrics.filter(m => m.success).length;
  const successRate = (successfulRequests / totalRequests) * 100;

  const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
  const avgTokens = metrics.reduce((sum, m) => sum + m.tokens, 0) / totalRequests;

  const cacheHits = metrics.filter(m => m.cacheHit).length;
  const cacheHitRate = (cacheHits / totalRequests) * 100;

  // Model breakdown
  const modelBreakdown = metrics.reduce((acc, metric) => {
    if (!acc[metric.model]) {
      acc[metric.model] = {
        requests: 0,
        avgDuration: 0,
        avgTokens: 0,
        successRate: 0,
        cacheHitRate: 0,
      };
    }

    const model = acc[metric.model];
    model.requests++;
    model.avgDuration += metric.duration;
    model.avgTokens += metric.tokens;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages for each model
  Object.values(modelBreakdown).forEach((model: any) => {
    model.avgDuration = model.avgDuration / model.requests;
    model.avgTokens = model.avgTokens / model.requests;
    
    const modelMetrics = metrics.filter(m => m.model === model.model);
    model.successRate = (modelMetrics.filter(m => m.success).length / modelMetrics.length) * 100;
    model.cacheHitRate = (modelMetrics.filter(m => m.cacheHit).length / modelMetrics.length) * 100;
  });

  // Endpoint breakdown
  const endpointBreakdown = metrics.reduce((acc, metric) => {
    if (!acc[metric.endpoint]) {
      acc[metric.endpoint] = {
        requests: 0,
        avgDuration: 0,
        successRate: 0,
      };
    }

    const endpoint = acc[metric.endpoint];
    endpoint.requests++;
    endpoint.avgDuration += metric.duration;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages for each endpoint
  Object.values(endpointBreakdown).forEach((endpoint: any) => {
    endpoint.avgDuration = endpoint.avgDuration / endpoint.requests;
    
    const endpointMetrics = metrics.filter(m => m.endpoint === endpoint.endpoint);
    endpoint.successRate = (endpointMetrics.filter(m => m.success).length / endpointMetrics.length) * 100;
  });

  // Hourly metrics for the last 24 hours
  const hourlyMetrics = generateHourlyMetrics(metrics);

  return {
    totalRequests,
    successRate,
    avgDuration,
    avgTokens,
    cacheHitRate,
    modelBreakdown,
    endpointBreakdown,
    hourlyMetrics,
  };
}

function generateHourlyMetrics(metrics: any[]) {
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

    const requests = hourMetrics.length;
    const avgDuration = requests > 0 ? hourMetrics.reduce((sum, m) => sum + m.duration, 0) / requests : 0;
    const successRate = requests > 0 ? (hourMetrics.filter(m => m.success).length / requests) * 100 : 0;
    const cacheHitRate = requests > 0 ? (hourMetrics.filter(m => m.cacheHit).length / requests) * 100 : 0;

    hourlyData.push({
      hour: hourStart.toISOString(),
      requests,
      avgDuration,
      successRate,
      cacheHitRate,
    });
  }

  return hourlyData;
}