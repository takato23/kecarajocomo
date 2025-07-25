# AI Meal Planner Implementation Guide

## Quick Start

This guide provides step-by-step implementation instructions for the AI-powered meal planning feature with Gemini integration.

## Phase 1: Core Infrastructure Setup

### 1.1 Database Schema Implementation

```sql
-- User dietary preferences and goals
CREATE TABLE user_dietary_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  diet_type VARCHAR(50) NOT NULL,
  allergies TEXT[],
  medical_restrictions TEXT[],
  cultural_preferences TEXT[],
  nutritional_objective VARCHAR(50),
  daily_calories INTEGER,
  experience_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Meal plans
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  generation_method VARCHAR(20),
  token_usage INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual meal slots
CREATE TABLE meal_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  slot_type VARCHAR(20) NOT NULL,
  scheduled_time TIME,
  servings INTEGER DEFAULT 1,
  recipe_id UUID REFERENCES recipes(id),
  is_locked BOOLEAN DEFAULT FALSE,
  needs_manual_action BOOLEAN DEFAULT FALSE,
  excluded_ingredients TEXT[],
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recipes
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  prep_time INTEGER,
  cook_time INTEGER,
  total_calories INTEGER,
  difficulty_level VARCHAR(20),
  cuisine_type VARCHAR(50),
  uses_pantry BOOLEAN DEFAULT FALSE,
  is_ai_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recipe ingredients
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  notes TEXT
);

-- Recipe steps
CREATE TABLE recipe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL
);

-- Pantry inventory
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  ingredient_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  expiration_date DATE,
  stock_level VARCHAR(20),
  location VARCHAR(50),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, start_date);
CREATE INDEX idx_meal_slots_plan ON meal_slots(meal_plan_id);
CREATE INDEX idx_pantry_user ON pantry_items(user_id);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine_type);
```

### 1.2 Environment Configuration

```bash
# .env.local
# Gemini API Configuration
GEMINI_API_KEY=your_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=8192
GEMINI_TEMPERATURE=0.7

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL=86400

# Rate Limiting
RATE_LIMIT_GENERATE_PLAN=10 # per hour
RATE_LIMIT_UPDATE_SLOT=30 # per minute
RATE_LIMIT_GEMINI_GLOBAL=20 # per minute

# Feature Flags
ENABLE_MEAL_PLANNER=true
ENABLE_BATCH_PROCESSING=true
ENABLE_CACHE_WARMING=true
```

### 1.3 Core Service Implementation

```typescript
// services/meal-planning/MealPlanningService.ts
import { GeminiClient } from './GeminiClient';
import { PromptGenerator } from './PromptGenerator';
import { MealPlanValidator } from './MealPlanValidator';
import { CacheManager } from './CacheManager';

export class MealPlanningService {
  constructor(
    private geminiClient: GeminiClient,
    private promptGenerator: PromptGenerator,
    private validator: MealPlanValidator,
    private cache: CacheManager
  ) {}

  async generateWeeklyPlan(
    userId: string,
    params: GeneratePlanParams
  ): Promise<MealPlan> {
    // 1. Load user context
    const context = await this.loadUserContext(userId);
    
    // 2. Check cache for similar requests
    const cacheKey = this.generateCacheKey(userId, params);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // 3. Build optimized prompt
    const prompt = this.promptGenerator.buildPrompt(context, params);
    
    // 4. Determine generation strategy
    const strategy = this.selectGenerationStrategy(prompt);
    
    // 5. Generate with Gemini
    const plan = await this.executeGeneration(strategy, prompt, context);
    
    // 6. Validate and process
    const validated = await this.validator.validatePlan(plan);
    
    // 7. Cache results
    await this.cache.set(cacheKey, validated);
    
    return validated;
  }
  
  private async loadUserContext(userId: string): Promise<UserContext> {
    const [profile, pantry, preferences, history] = await Promise.all([
      this.getUserProfile(userId),
      this.getPantryItems(userId),
      this.getUserPreferences(userId),
      this.getRecentMeals(userId)
    ]);
    
    return { profile, pantry, preferences, history };
  }
  
  private selectGenerationStrategy(prompt: string): GenerationStrategy {
    const tokenCount = this.estimateTokens(prompt);
    
    if (tokenCount < 4000) {
      return 'single_request';
    } else if (tokenCount < 8000) {
      return 'chunked_days';
    } else {
      return 'chunked_meals';
    }
  }
}
```

### 1.4 Gemini Client Implementation

```typescript
// services/meal-planning/GeminiClient.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private retryConfig = {
    maxRetries: 3,
    backoffMs: 1000,
    maxBackoffMs: 10000
  };

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro'
    });
  }

  async generateMealPlan(prompt: string): Promise<any> {
    return this.executeWithRetry(async () => {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      });

      const response = await result.response;
      const text = response.text();
      
      // Parse and validate JSON
      return this.parseJsonResponse(text);
    });
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error;
    let backoffMs = this.retryConfig.backoffMs;

    for (let i = 0; i < this.retryConfig.maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isRetryable(error)) {
          throw error;
        }

        if (i < this.retryConfig.maxRetries - 1) {
          await this.delay(backoffMs);
          backoffMs = Math.min(backoffMs * 2, this.retryConfig.maxBackoffMs);
        }
      }
    }

    throw lastError!;
  }

  private parseJsonResponse(text: string): any {
    // Remove any markdown formatting
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      return JSON.parse(cleanText);
    } catch (error) {
      // Attempt to extract JSON from mixed content
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response from Gemini');
    }
  }

  private isRetryable(error: any): boolean {
    return (
      error.code === 'RATE_LIMIT_EXCEEDED' ||
      error.code === 'TIMEOUT' ||
      error.code === 'INTERNAL_ERROR' ||
      error.message?.includes('503')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Phase 2: API Implementation

### 2.1 API Routes Setup

```typescript
// app/api/meal-plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MealPlanningService } from '@/services/meal-planning';
import { authenticate } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(user.id, 'generate_plan');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { dateRange, preferences, lockedSlots } = body;

    // Validate input
    const validation = validateGenerateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate plan
    const mealPlanService = getMealPlanningService();
    const plan = await mealPlanService.generateWeeklyPlan(user.id, {
      dateRange,
      preferences,
      lockedSlots
    });

    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    console.error('Meal plan generation error:', error);
    
    if (error.message === 'GEMINI_QUOTA_EXCEEDED') {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}
```

### 2.2 Slot Update Endpoint

```typescript
// app/api/meal-plans/[planId]/slots/[slotId]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { planId: string; slotId: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipe } = body;

    // Verify ownership
    const plan = await getMealPlan(params.planId);
    if (plan.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update slot
    const updatedSlot = await updateMealSlot(params.slotId, recipe);

    // Invalidate cache
    await invalidatePlanCache(params.planId);

    return NextResponse.json({ slot: updatedSlot });
  } catch (error) {
    console.error('Slot update error:', error);
    return NextResponse.json(
      { error: 'Failed to update slot' },
      { status: 500 }
    );
  }
}
```

## Phase 3: Frontend Implementation

### 3.1 React Components

```typescript
// components/meal-planner/MealPlanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { WeekView } from './WeekView';
import { PlannerHeader } from './PlannerHeader';
import { NutritionalSummary } from './NutritionalSummary';
import { mealPlannerApi } from '@/lib/api/meal-planner';
import { useToast } from '@/hooks/use-toast';

export function MealPlanner({ userId }: { userId: string }) {
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const { toast } = useToast();

  // Fetch current plan
  const { data: plan, isLoading, refetch } = useQuery({
    queryKey: ['meal-plan', userId, dateRange],
    queryFn: () => mealPlannerApi.getCurrentPlan(userId, dateRange),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Generate plan mutation
  const generateMutation = useMutation({
    mutationFn: (params: GeneratePlanParams) => 
      mealPlannerApi.generatePlan(params),
    onSuccess: () => {
      toast({
        title: "Plan generado exitosamente",
        description: "Tu plan semanal está listo",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error al generar plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update slot mutation
  const updateSlotMutation = useMutation({
    mutationFn: ({ slotId, recipe }: UpdateSlotParams) =>
      mealPlannerApi.updateSlot(plan!.id, slotId, recipe),
    onSuccess: () => {
      refetch();
    },
  });

  return (
    <div className="container mx-auto py-6">
      <PlannerHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onGenerate={() => generateMutation.mutate({ dateRange })}
        isGenerating={generateMutation.isPending}
      />
      
      {isLoading ? (
        <MealPlannerSkeleton />
      ) : plan ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          <div className="lg:col-span-3">
            <WeekView
              plan={plan}
              onSlotUpdate={(slotId, recipe) => 
                updateSlotMutation.mutate({ slotId, recipe })
              }
              isUpdating={updateSlotMutation.isPending}
            />
          </div>
          <div className="lg:col-span-1">
            <NutritionalSummary plan={plan} />
          </div>
        </div>
      ) : (
        <EmptyPlanState onGenerate={() => generateMutation.mutate({ dateRange })} />
      )}
    </div>
  );
}
```

### 3.2 Week View Component

```typescript
// components/meal-planner/WeekView.tsx
import { MealSlotCard } from './MealSlotCard';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export function WeekView({ 
  plan, 
  onSlotUpdate,
  isUpdating 
}: WeekViewProps) {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const slots = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Handle recipe swapping between slots
    const sourceSlot = plan.slots.find(s => s.id === active.id);
    const targetSlot = plan.slots.find(s => s.id === over.id);

    if (sourceSlot && targetSlot && !targetSlot.locked) {
      onSlotUpdate(targetSlot.id, sourceSlot.recipe);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-7 gap-4">
        {days.map(day => (
          <div key={day} className="space-y-3">
            <h3 className="font-semibold text-center">{day}</h3>
            {slots.map(slot => {
              const mealSlot = plan.slots.find(
                s => s.day === day && s.slotType === slot
              );
              return (
                <MealSlotCard
                  key={`${day}-${slot}`}
                  slot={mealSlot}
                  onUpdate={(recipe) => onSlotUpdate(mealSlot.id, recipe)}
                  isUpdating={isUpdating}
                />
              );
            })}
          </div>
        ))}
      </div>
    </DndContext>
  );
}
```

### 3.3 State Management with Zustand

```typescript
// stores/meal-planner-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface MealPlannerState {
  currentPlan: MealPlan | null;
  selectedSlots: Set<string>;
  filters: {
    dietType?: string;
    maxPrepTime?: number;
    cuisine?: string;
  };
  
  // Actions
  setCurrentPlan: (plan: MealPlan) => void;
  toggleSlotSelection: (slotId: string) => void;
  updateFilter: (filter: Partial<MealPlannerState['filters']>) => void;
  
  // Optimistic updates
  optimisticUpdateSlot: (slotId: string, recipe: Recipe) => void;
  revertOptimisticUpdate: (slotId: string) => void;
}

export const useMealPlannerStore = create<MealPlannerState>()(
  devtools(
    persist(
      (set) => ({
        currentPlan: null,
        selectedSlots: new Set(),
        filters: {},
        
        setCurrentPlan: (plan) => set({ currentPlan: plan }),
        
        toggleSlotSelection: (slotId) =>
          set((state) => {
            const newSelection = new Set(state.selectedSlots);
            if (newSelection.has(slotId)) {
              newSelection.delete(slotId);
            } else {
              newSelection.add(slotId);
            }
            return { selectedSlots: newSelection };
          }),
          
        updateFilter: (filter) =>
          set((state) => ({
            filters: { ...state.filters, ...filter }
          })),
          
        optimisticUpdateSlot: (slotId, recipe) =>
          set((state) => {
            if (!state.currentPlan) return state;
            
            const updatedSlots = state.currentPlan.slots.map(slot =>
              slot.id === slotId ? { ...slot, recipe } : slot
            );
            
            return {
              currentPlan: {
                ...state.currentPlan,
                slots: updatedSlots
              }
            };
          }),
          
        revertOptimisticUpdate: (slotId) => {
          // Implement revert logic
        },
      }),
      {
        name: 'meal-planner-storage',
        partialize: (state) => ({ filters: state.filters }),
      }
    )
  )
);
```

## Phase 4: Testing Strategy

### 4.1 Unit Tests

```typescript
// __tests__/services/PromptGenerator.test.ts
import { PromptGenerator } from '@/services/meal-planning/PromptGenerator';

describe('PromptGenerator', () => {
  let generator: PromptGenerator;
  
  beforeEach(() => {
    generator = new PromptGenerator();
  });
  
  test('generates valid prompt within token limits', () => {
    const context = createMockContext();
    const params = createMockParams();
    
    const prompt = generator.buildPrompt(context, params);
    const tokenCount = generator.estimateTokens(prompt);
    
    expect(tokenCount).toBeLessThan(8000);
    expect(prompt).toContain('USER PROFILE');
    expect(prompt).toContain('PLANNING REQUIREMENTS');
  });
  
  test('handles locked slots correctly', () => {
    const context = createMockContext();
    const params = {
      ...createMockParams(),
      lockedSlots: [
        { day: 'Lunes', slotType: 'Desayuno', recipeId: 'recipe_123' }
      ]
    };
    
    const prompt = generator.buildPrompt(context, params);
    
    expect(prompt).toContain('LOCKED MEALS');
    expect(prompt).toContain('Lunes-Desayuno');
  });
});
```

### 4.2 Integration Tests

```typescript
// __tests__/api/meal-plans.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/meal-plans/route';

describe('/api/meal-plans', () => {
  test('generates meal plan successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer valid_token',
      },
      body: {
        dateRange: {
          start: '2024-01-15',
          end: '2024-01-21'
        },
        preferences: {
          excludeIngredients: ['gluten'],
          maxPrepTime: 30
        }
      }
    });
    
    await POST(req);
    
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.plan).toBeDefined();
    expect(data.plan.slots).toHaveLength(28); // 7 days * 4 slots
  });
  
  test('handles rate limiting', async () => {
    // Simulate hitting rate limit
    for (let i = 0; i < 11; i++) {
      const { req, res } = createMocks({
        method: 'POST',
        headers: { authorization: 'Bearer valid_token' },
        body: validRequestBody
      });
      
      await POST(req);
      
      if (i === 10) {
        expect(res._getStatusCode()).toBe(429);
        expect(JSON.parse(res._getData())).toHaveProperty('retryAfter');
      }
    }
  });
});
```

## Phase 5: Deployment Configuration

### 5.1 Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD HOSTNAME="0.0.0.0" node server.js
```

### 5.2 Environment-Specific Configurations

```typescript
// config/environments.ts
export const config = {
  development: {
    geminiApiUrl: 'https://generativelanguage.googleapis.com/v1beta',
    cacheEnabled: true,
    batchProcessing: true,
    debugMode: true,
    rateLimits: {
      generatePlan: 100,
      updateSlot: 100,
      geminiGlobal: 50
    }
  },
  production: {
    geminiApiUrl: process.env.GEMINI_API_URL,
    cacheEnabled: true,
    batchProcessing: true,
    debugMode: false,
    rateLimits: {
      generatePlan: 10,
      updateSlot: 30,
      geminiGlobal: 20
    }
  }
};
```

## Monitoring and Analytics

### Metrics Collection

```typescript
// lib/analytics/meal-planner-analytics.ts
export class MealPlannerAnalytics {
  static trackPlanGeneration({
    userId,
    planId,
    duration,
    tokenUsage,
    method,
    success
  }: PlanGenerationEvent) {
    // Send to analytics service
    analytics.track('meal_plan_generated', {
      userId,
      planId,
      duration,
      tokenUsage,
      method,
      success,
      timestamp: new Date().toISOString()
    });
  }
  
  static trackSlotUpdate({
    userId,
    planId,
    slotId,
    action,
    source
  }: SlotUpdateEvent) {
    analytics.track('meal_slot_updated', {
      userId,
      planId,
      slotId,
      action,
      source,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Troubleshooting Guide

### Common Issues and Solutions

1. **Gemini JSON Response Parsing Errors**
   - Solution: Implement robust JSON extraction with fallbacks
   - Add explicit JSON formatting instructions to prompts

2. **Token Limit Exceeded**
   - Solution: Implement automatic batching strategy
   - Compress context information before sending

3. **Rate Limiting Issues**
   - Solution: Implement exponential backoff
   - Add request queuing for high-traffic periods

4. **Cache Invalidation Problems**
   - Solution: Implement versioned cache keys
   - Add manual cache refresh endpoints

5. **Slow Generation Times**
   - Solution: Implement progressive loading
   - Show partial results while generating

## Next Steps

1. Implement user feedback collection for generated meals
2. Add machine learning for preference prediction
3. Integrate with grocery delivery services
4. Add meal prep instructions and videos
5. Implement social sharing features