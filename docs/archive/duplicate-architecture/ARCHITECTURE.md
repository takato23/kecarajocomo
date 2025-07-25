# kecarajocomer - System Architecture Design

## Overview

kecarajocomer is a next-generation meal planning and recipe application that leverages AI to provide personalized nutrition management, intelligent pantry tracking, and optimized shopping experiences.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **State Management**: Zustand with persistence
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI Integration**: Claude API via Vercel Edge Functions
- **Hosting**: Vercel (Edge Network)

## Core Principles

1. **Performance First**: Sub-3s load times, instant interactions
2. **User-Centric Design**: Intuitive UX with minimal cognitive load
3. **Scalable Architecture**: Horizontal scaling, efficient caching
4. **AI-Enhanced**: Intelligent features that feel magical, not gimmicky
5. **Offline Capable**: Core features work without internet

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Edge Functions │────▶│   Claude API    │
│  (Vercel Edge)  │     │    (Vercel)     │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│     Zustand     │     │    Supabase     │
│  (Local State)  │     │   (Database)    │
└─────────────────┘     └─────────────────┘
```

### Component Architecture

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Auth routes
│   ├── (dashboard)/       # Protected routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client
│   ├── ai/               # AI integration
│   └── utils/            # Helper functions
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## Data Models

### Core Entities

```typescript
// User Profile
interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  created_at: Date;
}

interface UserPreferences {
  dietary_restrictions: string[];
  allergies: string[];
  cuisine_preferences: string[];
  nutrition_goals: NutritionGoals;
}

// Recipe
interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  cook_time: number;
  prep_time: number;
  servings: number;
  tags: string[];
  ai_generated: boolean;
  created_by: string;
}

// Meal Plan
interface MealPlan {
  id: string;
  user_id: string;
  week_start: Date;
  meals: PlannedMeal[];
  created_at: Date;
}

interface PlannedMeal {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  day: number; // 0-6
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
}

// Pantry
interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  expiration_date?: Date;
  location?: string;
}

// Shopping List
interface ShoppingList {
  id: string;
  user_id: string;
  items: ShoppingItem[];
  created_from: string[]; // meal_plan_ids
  created_at: Date;
}
```

### Database Schema

```sql
-- Users table (managed by Supabase Auth)

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  dietary_restrictions TEXT[],
  allergies TEXT[],
  cuisine_preferences TEXT[],
  nutrition_goals JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  instructions TEXT[] NOT NULL,
  nutrition JSONB,
  cook_time INTEGER,
  prep_time INTEGER,
  servings INTEGER DEFAULT 4,
  tags TEXT[],
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal plans
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Planned meals
CREATE TABLE planned_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id),
  day INTEGER CHECK (day >= 0 AND day <= 6),
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  servings INTEGER DEFAULT 1
);

-- Pantry items
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,2),
  unit TEXT,
  expiration_date DATE,
  location TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
```

## API Design

### RESTful Endpoints (Supabase Auto-generated)

- `GET /rest/v1/recipes` - List recipes
- `GET /rest/v1/meal_plans` - Get user's meal plans
- `GET /rest/v1/pantry_items` - Get pantry inventory
- Standard CRUD operations for all entities

### Custom Edge Functions

```typescript
// Generate recipe with AI
POST /api/ai/generate-recipe
{
  "preferences": UserPreferences,
  "constraints": {
    "ingredients": string[],
    "max_time": number,
    "cuisine": string
  }
}

// Generate weekly meal plan
POST /api/ai/suggest-weekly-plan
{
  "preferences": UserPreferences,
  "pantry_items": PantryItem[],
  "nutrition_goals": NutritionGoals
}

// Optimize shopping list
POST /api/shopping/optimize
{
  "meal_plan_id": string,
  "store_preference": string
}

// Analyze nutrition
POST /api/nutrition/analyze
{
  "meal_plan_id": string,
  "date_range": [Date, Date]
}
```

## AI Integration Patterns

### Recipe Generation Flow

```typescript
// Edge Function: /api/ai/generate-recipe
export async function POST(request: Request) {
  const { preferences, constraints } = await request.json();
  
  // Build structured prompt
  const prompt = buildRecipePrompt(preferences, constraints);
  
  // Stream response from Claude
  const stream = await claude.messages.create({
    model: 'claude-3-sonnet-20241022',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
    max_tokens: 2000
  });
  
  // Parse and validate recipe
  const recipe = await parseRecipeStream(stream);
  
  // Calculate nutrition
  const nutrition = await calculateNutrition(recipe.ingredients);
  
  // Save to database
  const saved = await saveRecipe({ ...recipe, nutrition });
  
  return Response.json(saved);
}
```

### Meal Planning Assistant

```typescript
// Multi-step planning with context
async function generateWeeklyPlan(userId: string) {
  // 1. Fetch user context
  const context = await getUserContext(userId);
  
  // 2. Analyze pantry inventory
  const pantryAnalysis = await analyzePantry(context.pantry);
  
  // 3. Generate balanced meal plan
  const plan = await claude.messages.create({
    model: 'claude-3-sonnet-20241022',
    messages: [
      {
        role: 'system',
        content: 'You are a professional nutritionist and meal planner.'
      },
      {
        role: 'user',
        content: buildMealPlanPrompt(context, pantryAnalysis)
      }
    ]
  });
  
  // 4. Validate nutritional balance
  const validated = await validateNutrition(plan);
  
  return validated;
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Edge caching for recipes
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Primary region
};

// Cache generated recipes
const recipeCache = new Map<string, Recipe>();

// ISR for recipe pages
export const revalidate = 86400; // 24 hours

// Client-side caching with SWR
const { data: recipes } = useSWR('/api/recipes', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
});
```

### Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_planned_meals_week ON planned_meals(meal_plan_id, day);
CREATE INDEX idx_pantry_expiration ON pantry_items(user_id, expiration_date);

-- Materialized view for nutrition summaries
CREATE MATERIALIZED VIEW daily_nutrition AS
SELECT 
  mp.user_id,
  pm.day,
  SUM((r.nutrition->>'calories')::numeric * pm.servings) as total_calories,
  SUM((r.nutrition->>'protein')::numeric * pm.servings) as total_protein,
  SUM((r.nutrition->>'carbs')::numeric * pm.servings) as total_carbs,
  SUM((r.nutrition->>'fat')::numeric * pm.servings) as total_fat
FROM meal_plans mp
JOIN planned_meals pm ON mp.id = pm.meal_plan_id
JOIN recipes r ON pm.recipe_id = r.id
GROUP BY mp.user_id, pm.day;
```

### Frontend Performance

```typescript
// Lazy load heavy components
const RecipeGenerator = lazy(() => import('./RecipeGenerator'));

// Optimize images
const RecipeImage = ({ src, alt }) => (
  <Image
    src={src}
    alt={alt}
    width={400}
    height={300}
    loading="lazy"
    placeholder="blur"
  />
);

// Virtualize long lists
const RecipeList = ({ recipes }) => (
  <VirtualList
    height={600}
    itemCount={recipes.length}
    itemSize={120}
    renderItem={({ index }) => <RecipeCard recipe={recipes[index]} />}
  />
);
```

## Security Considerations

### Row Level Security (RLS)

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public recipes are viewable by all
CREATE POLICY "Public recipes are viewable"
  ON recipes FOR SELECT
  USING (true);

-- Users can only modify their own recipes
CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = created_by);
```

### API Security

```typescript
// Rate limiting for AI endpoints
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for');
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
}
```

## Monitoring & Analytics

### Key Metrics

```typescript
// Track AI usage
export async function trackAIUsage(event: AIEvent) {
  await analytics.track({
    userId: event.userId,
    event: 'ai_request',
    properties: {
      type: event.type,
      tokens: event.tokens,
      duration: event.duration,
      success: event.success
    }
  });
}

// Monitor performance
export const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 3000) {
      logSlowRequest(entry);
    }
  }
});
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Next.js 15 with TypeScript
- [ ] Configure Supabase with auth
- [ ] Implement base UI components
- [ ] Setup Zustand stores

### Phase 2: Core Features (Week 3-4)
- [ ] Recipe CRUD operations
- [ ] Basic meal planning
- [ ] Pantry management
- [ ] Shopping list generation

### Phase 3: AI Integration (Week 5-6)
- [ ] Recipe generation
- [ ] Meal plan suggestions
- [ ] Nutritional analysis
- [ ] Smart shopping optimization

### Phase 4: Polish & Performance (Week 7-8)
- [ ] Performance optimization
- [ ] Mobile responsive design
- [ ] Offline capabilities
- [ ] Error handling & monitoring

## Conclusion

This architecture provides a solid foundation for building a scalable, performant, and user-friendly meal planning application. The modular design allows for iterative development while maintaining system coherence and long-term maintainability.