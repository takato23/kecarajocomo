# KeCaraJoComer - Testing & Deployment Strategy

## 🧪 Testing Philosophy

### Core Testing Principles
1. **Test Pyramid**: Unit > Integration > E2E following 70/20/10 distribution
2. **Shift Left**: Catch bugs early in development cycle
3. **Test in Production**: Monitor real user behavior with feature flags
4. **Performance Budget**: Every feature must meet performance criteria
5. **Accessibility First**: WCAG 2.1 AA compliance is non-negotiable

## 📊 Testing Strategy

### 1. Unit Testing (70%)

#### What We Test
- Component logic and rendering
- Store actions and state management
- Utility functions and helpers
- API transformations
- Business logic validation

#### Tools & Setup
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "jsdom": "^23.0.0",
    "msw": "^2.0.0"
  }
}
```

#### Testing Patterns
```typescript
// Component Testing
describe('RecipeCard', () => {
  it('renders recipe information correctly', () => {
    const recipe = mockRecipe();
    render(<RecipeCard recipe={recipe} />);
    
    expect(screen.getByText(recipe.name)).toBeInTheDocument();
    expect(screen.getByText(`${recipe.prepTime} min`)).toBeInTheDocument();
    expect(screen.getByAltText(recipe.name)).toHaveAttribute('src', recipe.imageUrl);
  });

  it('handles user interactions', async () => {
    const onFavorite = vi.fn();
    render(<RecipeCard recipe={mockRecipe()} onFavorite={onFavorite} />);
    
    await userEvent.click(screen.getByRole('button', { name: /favorite/i }));
    expect(onFavorite).toHaveBeenCalledTimes(1);
  });
});

// Store Testing
describe('RecipeStore', () => {
  it('adds recipe to favorites', () => {
    const { addToFavorites, favorites } = useRecipeStore.getState();
    const recipe = mockRecipe();
    
    addToFavorites(recipe.id);
    
    expect(favorites).toContain(recipe.id);
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('/api/recipes', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    const { fetchRecipes, error } = useRecipeStore.getState();
    await fetchRecipes();
    
    expect(error).toBe('Failed to fetch recipes');
  });
});

// AI Service Testing
describe('AI Recipe Generation', () => {
  it('generates valid recipe from constraints', async () => {
    const constraints = {
      ingredients: ['chicken', 'rice', 'vegetables'],
      maxTime: 30,
      servings: 4
    };
    
    const recipe = await generateRecipe(constraints);
    
    expect(recipe).toMatchObject({
      name: expect.any(String),
      ingredients: expect.arrayContaining([
        expect.objectContaining({ name: 'chicken' })
      ]),
      totalTime: expect.lessThanOrEqual(30),
      servings: 4
    });
  });
});
```

### 2. Integration Testing (20%)

#### What We Test
- API endpoints with database
- Authentication flows
- Data persistence
- Third-party service integration
- Feature workflows

#### Integration Test Examples
```typescript
// API Integration Tests
describe('Recipe API', () => {
  it('creates recipe with proper authorization', async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user);
    
    const response = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send(mockRecipeData());
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    
    // Verify in database
    const saved = await db.recipe.findUnique({
      where: { id: response.body.id }
    });
    expect(saved.createdBy).toBe(user.id);
  });
});

// Feature Flow Tests
describe('Meal Planning Flow', () => {
  it('generates shopping list from meal plan', async () => {
    const { user, token } = await setupAuthenticatedUser();
    
    // Create meal plan
    const mealPlan = await createMealPlan(user.id, {
      weekStart: new Date(),
      meals: [mockPlannedMeal()]
    });
    
    // Generate shopping list
    const response = await request(app)
      .post('/api/shopping-lists/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ mealPlanId: mealPlan.id });
    
    expect(response.status).toBe(201);
    expect(response.body.items).toHaveLength(
      expect.greaterThan(0)
    );
  });
});
```

### 3. End-to-End Testing (10%)

#### What We Test
- Critical user journeys
- Cross-browser compatibility
- Mobile responsiveness
- Performance under load
- Accessibility compliance

#### E2E Test Setup
```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } }
  ]
};

export default config;
```

#### E2E Test Examples
```typescript
// Critical User Journey
test('complete meal planning flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Navigate to meal planner
  await page.click('nav >> text=Meal Planner');
  await expect(page).toHaveURL('/app/planner');
  
  // Add meals
  await page.click('text=Add Meal');
  await page.fill('[name="search"]', 'pasta');
  await page.click('.recipe-result >> nth=0');
  await page.click('text=Add to Monday Dinner');
  
  // Generate shopping list
  await page.click('text=Generate Shopping List');
  await expect(page.locator('.shopping-list-item')).toHaveCount(
    expect.greaterThan(5)
  );
});

// Accessibility Test
test('meets WCAG standards', async ({ page }) => {
  await page.goto('/');
  
  // Run axe accessibility scan
  const violations = await checkA11y(page);
  expect(violations).toHaveLength(0);
});

// Performance Test
test('meets performance budget', async ({ page }) => {
  const metrics = await page.evaluate(() => {
    return JSON.stringify(window.performance.timing);
  });
  
  const perf = JSON.parse(metrics);
  const loadTime = perf.loadEventEnd - perf.navigationStart;
  
  expect(loadTime).toBeLessThan(3000); // 3s budget
});
```

### 4. Performance Testing

#### Core Web Vitals Monitoring
```typescript
// Performance monitoring setup
export function measureWebVitals() {
  if (typeof window === 'undefined') return;
  
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  });
}

// Performance budgets
const PERFORMANCE_BUDGETS = {
  LCP: 2500,    // Largest Contentful Paint < 2.5s
  FID: 100,     // First Input Delay < 100ms
  CLS: 0.1,     // Cumulative Layout Shift < 0.1
  FCP: 1800,    // First Contentful Paint < 1.8s
  TTFB: 600,    // Time to First Byte < 600ms
  bundleSize: {
    main: 200,  // KB
    vendor: 300 // KB
  }
};
```

#### Load Testing
```javascript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Spike to 200
    { duration: '5m', target: 200 },  // Stay at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function() {
  // Test recipe generation endpoint
  const response = http.post(
    'https://api.kecarajocomer.com/ai/generate-recipe',
    JSON.stringify({
      ingredients: ['chicken', 'rice'],
      maxTime: 30
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.API_TOKEN}`
      }
    }
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'recipe generated': (r) => r.json('recipe') !== null,
    'response time OK': (r) => r.timings.duration < 3000,
  });
  
  sleep(1);
}
```

### 5. Security Testing

#### Security Checklist
```typescript
// Security test suite
describe('Security', () => {
  it('prevents SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .get(`/api/recipes/search?q=${maliciousInput}`);
    
    expect(response.status).not.toBe(500);
    // Verify tables still exist
    const users = await db.user.count();
    expect(users).toBeGreaterThan(0);
  });

  it('enforces rate limiting', async () => {
    const requests = Array(15).fill(null).map(() =>
      request(app).post('/api/ai/generate-recipe').send({})
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('validates JWT tokens', async () => {
    const invalidToken = 'invalid.jwt.token';
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${invalidToken}`);
    
    expect(response.status).toBe(401);
  });

  it('sanitizes user input', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const response = await request(app)
      .post('/api/recipes')
      .send({
        name: xssPayload,
        description: 'Test recipe'
      });
    
    const saved = await db.recipe.findUnique({
      where: { id: response.body.id }
    });
    
    expect(saved.name).not.toContain('<script>');
    expect(saved.name).toBe('alert("XSS")'); // Sanitized
  });
});
```

## 🚀 Deployment Strategy

### Environments

#### 1. Development
- **Purpose**: Local development
- **URL**: http://localhost:3000
- **Database**: Local PostgreSQL
- **Features**: Hot reload, debug mode, verbose logging

#### 2. Preview
- **Purpose**: PR previews and testing
- **URL**: https://pr-{number}.kecarajocomer.vercel.app
- **Database**: Supabase branch database
- **Features**: Full features, test data, isolated environment

#### 3. Staging
- **Purpose**: Pre-production testing
- **URL**: https://staging.kecarajocomer.com
- **Database**: Production clone
- **Features**: Production-like, feature flags, monitoring

#### 4. Production
- **Purpose**: Live application
- **URL**: https://kecarajocomer.com
- **Database**: Supabase production
- **Features**: Full monitoring, analytics, backups

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          E2E_BASE_URL: ${{ secrets.STAGING_URL }}
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --audit-level=high
      
      - name: Run OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
      
      - name: SonarCloud scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  deploy-preview:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_SCOPE }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, e2e, security]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_SCOPE }}
      
      - name: Run smoke tests
        run: |
          npm run test:smoke
        env:
          PRODUCTION_URL: https://kecarajocomer.com
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Deployment Configuration

#### Vercel Configuration
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "regions": ["iad1"],
  "functions": {
    "app/api/ai/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_KEY": "@supabase-service-key",
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "SENTRY_DSN": "@sentry-dsn"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

#### Environment Variables
```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://kecarajocomer.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
ANTHROPIC_API_KEY=xxx
REDIS_URL=xxx
SENTRY_DSN=xxx
NEXT_PUBLIC_GA_ID=xxx
```

### Database Migrations

#### Migration Strategy
```typescript
// migrations/run.ts
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

async function runMigrations() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const migrationsDir = join(__dirname, 'sql');
  const files = await readdir(migrationsDir);
  const migrations = files.filter(f => f.endsWith('.sql')).sort();
  
  for (const migration of migrations) {
    console.log(`Running migration: ${migration}`);
    const sql = await readFile(join(migrationsDir, migration), 'utf-8');
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error(`Migration failed: ${migration}`, error);
      process.exit(1);
    }
  }
  
  console.log('All migrations completed successfully');
}

runMigrations();
```

### Monitoring & Observability

#### Application Monitoring
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Sentry configuration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});

// Custom error boundary
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={<ErrorFallback />}
      showDialog
    >
      {children}
      <Analytics />
      <SpeedInsights />
    </Sentry.ErrorBoundary>
  );
}

// Performance monitoring
export function trackPerformance(metric: string, value: number) {
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metric,
      value: Math.round(value),
      event_category: 'Performance',
    });
  }
  
  // Send to Sentry
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${metric}: ${value}ms`,
    level: 'info',
  });
}
```

#### Health Checks
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      ai: await checkAIService(),
    },
  };
  
  const allHealthy = Object.values(checks.checks).every(
    check => check.status === 'healthy'
  );
  
  return Response.json(checks, {
    status: allHealthy ? 200 : 503,
  });
}

async function checkDatabase() {
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}
```

### Rollback Strategy

#### Automated Rollback
```yaml
# Rollback workflow
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback Vercel deployment
        run: |
          vercel rollback ${{ github.event.inputs.version }} --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      
      - name: Run rollback tests
        run: |
          npm run test:smoke
        env:
          PRODUCTION_URL: https://kecarajocomer.com
      
      - name: Notify rollback
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Rolled back to version ${{ github.event.inputs.version }}'
```

### Feature Flags

#### Implementation
```typescript
// lib/feature-flags.ts
import { createClient } from '@vercel/edge-config';

const edgeConfig = createClient(process.env.EDGE_CONFIG);

export async function isFeatureEnabled(
  feature: string,
  userId?: string
): Promise<boolean> {
  const flags = await edgeConfig.get('featureFlags');
  const flag = flags[feature];
  
  if (!flag) return false;
  
  // Check if globally enabled
  if (flag.enabled && flag.rollout === 100) return true;
  
  // Check user-specific enablement
  if (userId && flag.users?.includes(userId)) return true;
  
  // Check percentage rollout
  if (flag.rollout > 0) {
    const hash = hashUserId(userId || 'anonymous');
    return hash % 100 < flag.rollout;
  }
  
  return false;
}

// Usage in components
export function RecipeAI() {
  const [enabled] = useFeatureFlag('ai-recipe-generation');
  
  if (!enabled) {
    return <TraditionalRecipeForm />;
  }
  
  return <AIRecipeGenerator />;
}
```

## 📈 Success Metrics

### Deployment Metrics
- Deploy frequency: >10 per week
- Lead time: <30 minutes
- MTTR: <15 minutes
- Change failure rate: <5%

### Quality Metrics
- Test coverage: >80%
- Zero critical vulnerabilities
- Performance budget adherence: 100%
- Accessibility score: >95

This comprehensive testing and deployment strategy ensures KeCaraJoComer maintains high quality while enabling rapid iteration and confident deployments.