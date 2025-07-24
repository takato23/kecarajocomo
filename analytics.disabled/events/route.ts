/**
 * Growth Analytics Events API Endpoint
 * Handles user behavior and growth events collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      );
    }

    // Process and validate events
    const processedEvents = events.map(event => ({
      ...event,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date(event.timestamp || Date.now()).toISOString(),
    }));

    // Store in database
    const { error: insertError } = await supabase
      .from('user_events')
      .insert(processedEvents);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store events' },
        { status: 500 }
      );
    }

    // Process conversion events
    const conversions = await processConversions(processedEvents);

    // Update user profiles
    await updateUserProfiles(processedEvents);

    return NextResponse.json({
      success: true,
      stored: processedEvents.length,
      conversions,
    });
  } catch (error: unknown) {
    console.error('Growth analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '7d';
    const userId = searchParams.get('userId');
    const event = searchParams.get('event');

    // Calculate time range
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange] || 7 * 24 * 60 * 60 * 1000;

    const startTime = new Date(now.getTime() - timeRangeMs);

    let query = supabase
      .from('user_events')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('userId', userId);
    }

    if (event) {
      query = query.eq('event', event);
    }

    const { data: events, error } = await query.limit(10000);

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Calculate analytics
    const analytics = await calculateAnalytics(events || [], timeRange);

    return NextResponse.json({
      success: true,
      events: events || [],
      analytics,
      timeRange,
    });
  } catch (error: unknown) {
    console.error('Growth analytics GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processConversions(events: any[]): Promise<any[]> {
  const conversions = [];

  for (const event of events) {
    if (event.event === 'conversion_step') {
      conversions.push({
        userId: event.userId,
        sessionId: event.sessionId,
        funnel: event.properties.funnel,
        step: event.properties.step,
        timestamp: event.timestamp,
      });
    }
  }

  // Store conversions
  if (conversions.length > 0) {
    const { error } = await supabase
      .from('conversions')
      .insert(conversions);

    if (error) {
      console.error('Conversion insert error:', error);
    }
  }

  return conversions;
}

async function updateUserProfiles(events: any[]) {
  const userUpdates = new Map();

  for (const event of events) {
    if (!event.userId) continue;

    if (!userUpdates.has(event.userId)) {
      userUpdates.set(event.userId, {
        last_activity: event.timestamp,
        total_events: 0,
        features_used: new Set(),
      });
    }

    const update = userUpdates.get(event.userId);
    update.total_events++;
    update.last_activity = Math.max(update.last_activity, event.timestamp);

    if (event.event === 'feature_usage') {
      update.features_used.add(event.properties.feature);
    }
  }

  // Update user profiles in database
  for (const [userId, update] of userUpdates) {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        last_activity: new Date(update.last_activity).toISOString(),
        total_events: update.total_events,
        features_used: Array.from(update.features_used),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('User profile update error:', error);
    }
  }
}

async function calculateAnalytics(events: any[], timeRange: string) {
  const analytics = {
    totalEvents: events.length,
    uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
    uniqueSessions: new Set(events.map(e => e.sessionId)).size,
    topEvents: calculateTopEvents(events),
    topRoutes: calculateTopRoutes(events),
    userEngagement: calculateUserEngagement(events),
    conversionRates: await calculateConversionRates(timeRange),
    retentionRates: await calculateRetentionRates(timeRange),
    featureUsage: calculateFeatureUsage(events),
    errorRate: calculateErrorRate(events),
  };

  return analytics;
}

function calculateTopEvents(events: any[]) {
  const eventCounts = events.reduce((acc, event) => {
    acc[event.event] = (acc[event.event] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([event, count]) => ({ event, count }));
}

function calculateTopRoutes(events: any[]) {
  const routeCounts = events.reduce((acc, event) => {
    if (event.route) {
      acc[event.route] = (acc[event.route] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(routeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));
}

function calculateUserEngagement(events: any[]) {
  const userSessions = events.reduce((acc, event) => {
    if (!event.userId) return acc;
    
    if (!acc[event.userId]) {
      acc[event.userId] = {
        sessions: new Set(),
        events: 0,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
      };
    }

    const user = acc[event.userId];
    user.sessions.add(event.sessionId);
    user.events++;
    user.firstSeen = Math.min(user.firstSeen, event.timestamp);
    user.lastSeen = Math.max(user.lastSeen, event.timestamp);

    return acc;
  }, {} as Record<string, any>);

  const users = Object.values(userSessions);
  const avgSessionsPerUser = users.reduce((sum, user: any) => sum + user.sessions.size, 0) / users.length;
  const avgEventsPerUser = users.reduce((sum, user: any) => sum + user.events, 0) / users.length;
  const avgSessionDuration = users.reduce((sum, user: any) => sum + (user.lastSeen - user.firstSeen), 0) / users.length;

  return {
    avgSessionsPerUser: Math.round(avgSessionsPerUser * 100) / 100,
    avgEventsPerUser: Math.round(avgEventsPerUser * 100) / 100,
    avgSessionDuration: Math.round(avgSessionDuration / 1000), // in seconds
  };
}

async function calculateConversionRates(timeRange: string) {
  const { data: conversions, error } = await supabase
    .from('conversions')
    .select('*')
    .gte('timestamp', new Date(Date.now() - getTimeRangeMs(timeRange)).toISOString());

  if (error || !conversions) return {};

  const funnelRates = conversions.reduce((acc, conversion) => {
    if (!acc[conversion.funnel]) {
      acc[conversion.funnel] = {};
    }
    
    acc[conversion.funnel][conversion.step] = (acc[conversion.funnel][conversion.step] || 0) + 1;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return funnelRates;
}

async function calculateRetentionRates(timeRange: string) {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('*')
    .gte('last_activity', new Date(Date.now() - getTimeRangeMs(timeRange)).toISOString());

  if (error || !profiles) return {};

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;
  const monthMs = 30 * dayMs;

  const retention = {
    daily: profiles.filter(p => now - new Date(p.last_activity).getTime() < dayMs).length,
    weekly: profiles.filter(p => now - new Date(p.last_activity).getTime() < weekMs).length,
    monthly: profiles.filter(p => now - new Date(p.last_activity).getTime() < monthMs).length,
  };

  return retention;
}

function calculateFeatureUsage(events: any[]) {
  const featureEvents = events.filter(e => e.event === 'feature_usage');
  const featureCounts = featureEvents.reduce((acc, event) => {
    const feature = event.properties.feature;
    if (feature) {
      acc[feature] = (acc[feature] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(featureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([feature, count]) => ({ feature, count }));
}

function calculateErrorRate(events: any[]) {
  const errorEvents = events.filter(e => e.event === 'error');
  const totalEvents = events.length;

  return totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0;
}

function getTimeRangeMs(timeRange: string): number {
  const ranges = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  return ranges[timeRange as keyof typeof ranges] || ranges['7d'];
}