# Monitoring & Observability Setup Guide

## Overview

This guide covers setting up comprehensive monitoring for KeCaraJoComer in production, including error tracking, performance monitoring, uptime checks, and alerting.

## 1. Error Tracking with Sentry

### Installation

```bash
npm install @sentry/nextjs
```

### Configuration

1. **Create Sentry Project**
   - Go to https://sentry.io
   - Create new project → Next.js
   - Copy DSN

2. **Initialize Sentry**

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      // Skip network errors in development
      if (process.env.NODE_ENV === 'development' && 
          error?.message?.includes('NetworkError')) {
        return null;
      }
    }
    return event;
  },
});
```

Create `sentry.server.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

Create `sentry.edge.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

3. **Configure Alerts**

In Sentry dashboard:
- Error rate > 1% → Email/Slack
- New error types → Immediate notification
- Performance degradation → Warning
- Crash rate increase → Critical alert

## 2. Performance Monitoring

### Vercel Analytics

1. **Enable in Dashboard**
   - Go to Vercel project settings
   - Enable Web Analytics
   - Enable Speed Insights

2. **Add to Code**
```bash
npm install @vercel/analytics @vercel/speed-insights
```

Update `src/app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Performance Metrics

Create `src/lib/monitoring/performance.ts`:
```typescript
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    return fn().finally(() => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    });
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }

    // Log to monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(value),
      });
    }
  }

  getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p95: this.percentile(values, 0.95),
      count: values.length,
    };
  }

  private percentile(values: number[], p: number) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}
```

### Usage Example

```typescript
// In API routes
const perf = PerformanceMonitor.getInstance();

export async function POST(request: Request) {
  return perf.measureAsync('api.recipes.generate', async () => {
    // Your API logic here
    const result = await generateRecipe(data);
    return NextResponse.json(result);
  });
}
```

## 3. Uptime Monitoring

### UptimeRobot Setup

1. **Create Account** at https://uptimerobot.com

2. **Add Monitors**
   - Main site: `https://your-domain.com`
   - Health check: `https://your-domain.com/api/health`
   - Critical APIs: Individual endpoints

3. **Configure Alerts**
   - Check interval: 5 minutes
   - Alert after: 2 failures
   - Notifications: Email, SMS, Slack

### Alternative: Better Uptime

```bash
# Install Better Uptime
curl -X POST https://betteruptime.com/api/v2/monitors \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/health",
    "monitor_type": "status",
    "check_frequency": 180,
    "request_timeout": 30,
    "confirmation_period": 2,
    "expected_status_codes": [200]
  }'
```

## 4. Application Performance Monitoring (APM)

### Option 1: DataDog

```bash
npm install dd-trace
```

Create `datadog.config.js`:
```javascript
const tracer = require('dd-trace');

tracer.init({
  env: process.env.NODE_ENV,
  service: 'kecarajocomer',
  hostname: process.env.DD_AGENT_HOST || 'localhost',
  port: 8126,
  analytics: true,
  logInjection: true,
  runtimeMetrics: true,
  profiling: true,
});

module.exports = tracer;
```

### Option 2: New Relic

```bash
npm install newrelic
```

Create `newrelic.js`:
```javascript
exports.config = {
  app_name: ['KeCaraJoComer'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: {
    enabled: true
  },
  logging: {
    level: 'info'
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404]
  },
  transaction_events: {
    enabled: true
  }
};
```

## 5. Custom Monitoring Dashboard

### Metrics to Track

```typescript
// src/lib/monitoring/metrics.ts
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, properties);
  }

  // PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event, properties);
  }

  // Custom backend
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties, timestamp: Date.now() }),
  }).catch(() => {
    // Fail silently
  });
};

// Track key metrics
export const metrics = {
  recipeGenerated: (type: string, duration: number) => 
    trackEvent('recipe_generated', { type, duration }),
  
  searchPerformed: (query: string, results: number) =>
    trackEvent('search_performed', { query, results }),
  
  shoppingListCreated: (items: number) =>
    trackEvent('shopping_list_created', { items }),
  
  userOnboarded: (step: string) =>
    trackEvent('user_onboarded', { step }),
  
  errorOccurred: (error: string, context: any) =>
    trackEvent('error_occurred', { error, context }),
};
```

## 6. Log Management

### Structured Logging

Create `src/lib/logger.ts`:
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA,
  },
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});

export default logger;

// Usage
logger.info({ userId: 'abc123', action: 'recipe_created' }, 'User created recipe');
logger.error({ err: error, context: { api: 'anthropic' } }, 'AI generation failed');
```

### Log Aggregation

#### Option 1: LogDNA
```bash
npm install @logdna/logger
```

```typescript
import { createLogger } from '@logdna/logger';

const logdna = createLogger(process.env.LOGDNA_KEY, {
  app: 'kecarajocomer',
  env: process.env.NODE_ENV,
});
```

#### Option 2: Papertrail
```bash
npm install winston winston-papertrail
```

## 7. Alerting Rules

### Critical Alerts (Immediate)
- Application down (health check fails)
- Database connection lost
- Authentication service failure
- Payment processing errors
- Security breaches

### High Priority (< 15 min)
- Error rate > 5%
- Response time > 3s (p95)
- AI API failures > 10%
- Storage quota > 90%

### Medium Priority (< 1 hour)
- Error rate > 1%
- Slow queries > 1s
- Memory usage > 80%
- Failed background jobs

### Low Priority (Daily)
- Deprecated API usage
- Large bundle sizes
- SEO issues
- Accessibility warnings

## 8. Security Monitoring

### Failed Login Attempts
```typescript
// Track failed logins
export async function trackFailedLogin(email: string, ip: string) {
  const key = `failed_login:${ip}`;
  const attempts = await redis.incr(key);
  await redis.expire(key, 3600); // 1 hour
  
  if (attempts > 5) {
    // Alert and potentially block IP
    logger.warn({ email, ip, attempts }, 'Multiple failed login attempts');
    await blockIP(ip);
  }
}
```

### API Rate Limiting Monitoring
```typescript
// Monitor rate limit hits
export async function trackRateLimit(userId: string, endpoint: string) {
  const metric = `rate_limit:${endpoint}:${userId}`;
  await redis.incr(metric);
  
  const count = await redis.get(metric);
  if (count > 100) {
    logger.warn({ userId, endpoint, count }, 'User hitting rate limits');
  }
}
```

## 9. Cost Monitoring

### API Usage Tracking
```typescript
// Track AI API usage
export async function trackAPIUsage(provider: string, tokens: number, cost: number) {
  await db.apiUsage.create({
    data: {
      provider,
      tokens,
      cost,
      timestamp: new Date(),
    },
  });

  // Check daily budget
  const dailyCost = await getDailyCost(provider);
  if (dailyCost > DAILY_BUDGET_LIMIT) {
    logger.error({ provider, dailyCost }, 'Daily API budget exceeded');
    await disableProvider(provider);
  }
}
```

## 10. Monitoring Checklist

### Daily Checks
- [ ] Review error logs
- [ ] Check API costs
- [ ] Monitor response times
- [ ] Verify backup completion

### Weekly Checks
- [ ] Analyze user metrics
- [ ] Review security alerts
- [ ] Check disk usage
- [ ] Update dependencies

### Monthly Checks
- [ ] Performance analysis
- [ ] Cost optimization
- [ ] Security audit
- [ ] Capacity planning

---

**Last Updated**: December 2024
**Version**: 1.0.0