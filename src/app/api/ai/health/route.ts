import { NextRequest, NextResponse } from 'next/server';
import { getGeminiServer } from '@/lib/services/geminiServer';

export async function GET(request: NextRequest) {
  try {
    const gemini = getGeminiServer();
    const stats = gemini.getStats();
    
    return NextResponse.json({
      healthy: true,
      geminiAvailable: true,
      cacheAvailable: true,
      stats: {
        requests: stats.requestCount,
        cacheHitRate: stats.cacheHitRate,
        activeCoalescedRequests: stats.coalescerStats.activeRequests
      }
    });
  } catch (error) {
    return NextResponse.json({
      healthy: false,
      geminiAvailable: false,
      cacheAvailable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}