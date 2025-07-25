import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    ai: 'operational' | 'limited' | 'unavailable';
    storage: 'available' | 'limited' | 'unavailable';
    cache?: 'connected' | 'disconnected' | 'not-configured';
  };
  metrics?: {
    uptime: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage?: number;
  };
  errors?: string[];
}

export async function GET() {
  const startTime = Date.now();
  const errors: string[] = [];
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      ai: 'operational',
      storage: 'available',
    },
    metrics: {
      uptime: process.uptime(),
      responseTime: 0,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    },
  };

  try {
    // Check database connection
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);
      const { error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        health.services.database = 'error';
        errors.push(`Database error: ${error.message}`);
      }
    } catch (dbError) {
      health.services.database = 'disconnected';
      errors.push(`Database connection failed: ${dbError}`);
    }

    // Check AI service availability
    try {
      const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
      const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY;
      
      if (!hasAnthropicKey && !hasGeminiKey) {
        health.services.ai = 'unavailable';
        errors.push('No AI API keys configured');
      } else if (!hasAnthropicKey || !hasGeminiKey) {
        health.services.ai = 'limited';
      }
    } catch (aiError) {
      health.services.ai = 'unavailable';
      errors.push(`AI service check failed: ${aiError}`);
    }

    // Check storage (Supabase Storage)
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        health.services.storage = 'unavailable';
        errors.push(`Storage error: ${error.message}`);
      } else if (!data || data.length === 0) {
        health.services.storage = 'limited';
      }
    } catch (storageError) {
      health.services.storage = 'unavailable';
      errors.push(`Storage check failed: ${storageError}`);
    }

    // Check Redis cache if configured
    if (process.env.REDIS_URL) {
      health.services.cache = 'not-configured'; // Would implement Redis check here
    }

    // Calculate final status
    if (health.services.database === 'disconnected' || 
        health.services.database === 'error' ||
        health.services.ai === 'unavailable') {
      health.status = 'unhealthy';
    } else if (health.services.ai === 'limited' || 
               health.services.storage === 'limited') {
      health.status = 'degraded';
    }

    // Add errors if any
    if (errors.length > 0) {
      health.errors = errors;
    }

    // Calculate response time
    health.metrics!.responseTime = Date.now() - startTime;

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    // Catastrophic failure
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'error',
        ai: 'unavailable',
        storage: 'unavailable',
      },
      errors: [`Health check failed: ${error}`],
      metrics: {
        uptime: process.uptime(),
        responseTime: Date.now() - startTime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      },
    }, { status: 503 });
  }
}