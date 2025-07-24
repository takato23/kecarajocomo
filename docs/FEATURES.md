# Feature Documentation

## Overview

KeCaraJoComer is organized into feature modules, each containing its own components, stores, services, and API routes. This modular architecture enables independent development and testing of features while maintaining consistency across the application.

## Feature Architecture

### Directory Structure

```
features/
├── auth/                   # Authentication and onboarding
├── dashboard/              # Main dashboard and overview
├── pantry/                 # Pantry management and tracking
├── recipes/                # Recipe management and AI generation
├── planner/                # Meal planning and scheduling
└── shopping/               # Shopping list generation and management
```

### Common Feature Structure

Each feature follows a consistent structure:

```
feature/
├── components/             # React components
├── hooks/                  # Custom hooks
├── services/               # API services and business logic
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── api/                    # API route handlers
├── supabase/               # Database schemas and migrations
├── README.md               # Feature documentation
├── index.ts                # Public API exports
└── page.tsx                # Next.js page component
```

## Authentication Feature

### Overview

The authentication feature handles user registration, login, session management, and user onboarding. It uses Supabase Auth for secure authentication with email/password and social providers.

### Key Components

#### OnboardingWizard
A multi-step wizard that guides new users through initial setup.

**Steps:**
1. **Welcome**: Introduction and getting started
2. **Profile Setup**: Basic user information
3. **Dietary Preferences**: Food restrictions and preferences
4. **Cooking Preferences**: Skill level and equipment
5. **Nutrition Goals**: Daily targets and health objectives
6. **Pantry Setup**: Initial inventory setup
7. **Meal Plan Preview**: First meal plan generation
8. **Completion**: Welcome to the application

```typescript
// Usage
<OnboardingWizard />
```

#### SignInForm & SignUpForm
Authentication forms with validation and error handling.

```typescript
// Sign In Form
<SignInForm
  onSuccess={(user) => navigate('/dashboard')}
  onError={(error) => setError(error.message)}
/>

// Sign Up Form
<SignUpForm
  onSuccess={(user) => navigate('/onboarding')}
  onError={(error) => setError(error.message)}
/>
```

### State Management

#### AuthStore
Manages authentication state and user session.

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Usage
const { user, signIn, signOut, isAuthenticated } = useAuthStore();
```

#### OnboardingStore
Manages onboarding flow state and progress.

```typescript
interface OnboardingState {
  currentStep: OnboardingStep;
  profileData: ProfileData;
  preferences: UserPreferences;
  isComplete: boolean;
}

// Usage
const { currentStep, nextStep, updateProfile } = useOnboardingStore();
```

### API Routes

- `POST /features/auth/api/session` - Create/refresh session
- `DELETE /features/auth/api/session` - Sign out
- `GET /features/auth/api/session` - Get current session

### Database Schema

```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  dietary_preferences TEXT[],
  cooking_preferences JSONB,
  nutrition_goals JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Dashboard Feature

### Overview

The dashboard provides an overview of all user data, including pantry status, upcoming meals, nutrition summary, and AI-powered insights.

### Key Components

#### Dashboard Page
Main dashboard with metric cards and quick actions.

```typescript
// Features
- Pantry status overview
- Nutrition tracking
- Upcoming meals
- Recent activity
- AI insights and recommendations
- Quick action buttons
```

#### NutritionSummary
Displays daily nutrition progress and goals.

```typescript
<NutritionSummary
  daily={{
    calories: 1850,
    protein: 125,
    carbs: 220,
    fat: 65
  }}
  goals={{
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70
  }}
/>
```

#### UpcomingMeals
Shows planned meals for the next few days.

```typescript
<UpcomingMeals
  meals={upcomingMeals}
  onViewMeal={(meal) => navigate(`/meals/${meal.id}`)}
  onEditMeal={(meal) => navigate(`/planner?edit=${meal.id}`)}
/>
```

#### AiInsights
AI-powered recommendations and insights.

```typescript
<AiInsights
  insights={[
    {
      type: 'nutrition',
      message: 'You\'re low on protein today',
      action: 'Add protein-rich snack'
    },
    {
      type: 'pantry',
      message: '5 items expiring soon',
      action: 'Plan meals using expiring items'
    }
  ]}
/>
```

### State Management

#### DashboardStore
Manages dashboard data and cache.

```typescript
interface DashboardState {
  metrics: DashboardMetrics;
  insights: AIInsight[];
  recentActivity: Activity[];
  lastUpdated: Date;
}

// Usage
const { metrics, insights, refreshData } = useDashboardStore();
```

## Pantry Feature

### Overview

The pantry feature manages food inventory, tracks expiration dates, provides analytics, and integrates with AI for intelligent recommendations.

### Key Components

#### PantryDashboard
Main pantry overview with statistics and alerts.

```typescript
<PantryDashboard
  onAddItem={() => setShowAddModal(true)}
  onManageItems={() => navigate('/pantry/manage')}
/>
```

**Features:**
- Total items and value tracking
- Expiration alerts and warnings
- AI-powered insights and recommendations
- Category and location breakdown
- Quick actions for common tasks

#### PantryItemForm
Form for adding and editing pantry items.

```typescript
<PantryItemForm
  item={editingItem}
  onSubmit={handleSubmit}
  onCancel={() => setEditingItem(null)}
/>
```

**Fields:**
- Ingredient name (with autocomplete)
- Quantity and unit
- Expiration date
- Storage location
- Purchase date and cost
- Notes and tags

#### PantryItemList
Searchable and filterable list of pantry items.

```typescript
<PantryItemList
  items={filteredItems}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onConsume={handleConsume}
  sortBy="expiration_date"
  filterBy={{ category: 'vegetables' }}
/>
```

**Features:**
- Search by ingredient name
- Filter by category, location, expiration
- Sort by various criteria
- Batch operations
- Quick consume actions

#### PantryAnalytics
Visual analytics and insights dashboard.

```typescript
<PantryAnalytics
  data={pantryData}
  timeRange="7d"
  showPredictions={true}
/>
```

**Charts:**
- Inventory levels over time
- Expiration timeline
- Spending analysis
- Waste tracking
- Category distribution

### State Management

#### PantryStore
Manages pantry inventory and operations.

```typescript
interface PantryState {
  items: PantryItem[];
  stats: PantryStats;
  expirationAlerts: ExpirationAlert[];
  isLoading: boolean;
}

// Usage
const { items, addItem, updateItem, deleteItem } = usePantryStore();
```

### API Routes

- `GET /api/pantry/items` - Get pantry items with filtering
- `POST /api/pantry/items` - Add new item
- `PUT /api/pantry/items/[id]` - Update item
- `DELETE /api/pantry/items/[id]` - Remove item
- `POST /api/pantry/items/batch` - Batch operations
- `POST /api/pantry/consume` - Consume items
- `GET /api/pantry/stats` - Get pantry statistics
- `GET /api/pantry/analysis` - Get AI analysis
- `POST /api/pantry/availability` - Check ingredient availability

### AI Integration

#### Gemini Pantry Service
AI-powered pantry insights and recommendations.

```typescript
// Generate insights
const insights = await generatePantryInsights({
  pantryItems: items,
  pantryStats: stats,
  userPreferences: preferences
});

// Smart expiration predictions
const predictions = await predictExpirationDates({
  ingredient: 'tomatoes',
  storageConditions: 'refrigerator',
  purchaseDate: new Date()
});
```

## Recipes Feature

### Overview

The recipes feature manages recipe collection, AI-powered recipe generation, nutrition analysis, and recipe recommendations based on available ingredients.

### Key Components

#### RecipeList
Searchable and filterable recipe collection.

```typescript
<RecipeList
  recipes={recipes}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onAddToPlan={handleAddToPlan}
  filters={{
    cuisine: 'italian',
    dietary: ['vegetarian'],
    maxTime: 30
  }}
/>
```

#### RecipeCard
Individual recipe display with actions.

```typescript
<RecipeCard
  recipe={recipe}
  variant="featured"
  onView={handleView}
  onAddToPlan={handleAddToPlan}
  showNutrition={true}
/>
```

#### AiRecipeGenerator
AI-powered recipe generation interface.

```typescript
<AiRecipeGenerator
  availableIngredients={pantryItems}
  onRecipeGenerated={handleGenerated}
  defaultPreferences={{
    cuisine: 'italian',
    dietary: ['vegetarian'],
    servings: 4
  }}
/>
```

**Features:**
- Multiple AI providers (Claude, Gemini)
- Ingredient-based generation
- Dietary preference filtering
- Difficulty and time constraints
- Real-time generation progress
- Recipe editing and refinement

#### RecipeDetail
Detailed recipe view with instructions and nutrition.

```typescript
<RecipeDetail
  recipe={recipe}
  onEdit={handleEdit}
  onAddToPlan={handleAddToPlan}
  onGenerateVariation={handleVariation}
  showNutrition={true}
  showIngredientAvailability={true}
/>
```

### State Management

#### RecipeStore
Manages recipe collection and operations.

```typescript
interface RecipeState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  isGenerating: boolean;
  generatedRecipes: Recipe[];
}

// Usage
const { recipes, generateRecipe, saveRecipe } = useRecipeStore();
```

### API Routes

- `GET /api/recipes` - Get recipe collection
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/[id]` - Update recipe
- `DELETE /api/recipes/[id]` - Delete recipe
- `POST /features/recipes/api/generate/claude` - Generate with Claude
- `POST /features/recipes/api/generate/gemini` - Generate with Gemini
- `POST /features/recipes/api/nutrition` - Analyze nutrition

### AI Integration

#### Recipe Generation
AI-powered recipe creation with multiple providers.

```typescript
// Claude generation
const claudeRecipe = await generateRecipeWithClaude({
  prompt: 'Healthy pasta dish',
  availableIngredients: ['tomatoes', 'pasta', 'basil'],
  dietary: ['vegetarian'],
  servings: 4,
  maxTime: 30
});

// Gemini generation
const geminiRecipe = await generateRecipeWithGemini({
  style: 'comfort food',
  cuisine: 'italian',
  difficulty: 'medium'
});
```

#### Nutrition Analysis
Automatic nutrition calculation for recipes.

```typescript
const nutrition = await analyzeNutrition({
  ingredients: recipe.ingredients,
  servings: recipe.servings
});
```

## Planner Feature

### Overview

The meal planner feature provides weekly meal planning, AI-powered meal suggestions, shopping list generation, and meal prep scheduling.

### Key Components

#### MealPlan
Weekly meal planning interface.

```typescript
<MealPlan
  week={currentWeek}
  onAddMeal={handleAddMeal}
  onEditMeal={handleEditMeal}
  onRemoveMeal={handleRemoveMeal}
  onGenerateWeek={handleGenerateWeek}
/>
```

**Features:**
- Drag-and-drop meal assignment
- Recipe suggestions based on pantry
- Nutrition balance tracking
- Meal prep scheduling
- Shopping list integration

#### WeekCalendar
Calendar view for meal planning.

```typescript
<WeekCalendar
  meals={weekMeals}
  onSelectSlot={handleSelectSlot}
  onMoveMeal={handleMoveMeal}
  showNutrition={true}
  showPrepTime={true}
/>
```

#### AiSuggestionModal
AI-powered meal suggestions dialog.

```typescript
<AiSuggestionModal
  isOpen={showSuggestions}
  onClose={() => setShowSuggestions(false)}
  onSelectMeal={handleSelectMeal}
  constraints={{
    availableIngredients: pantryItems,
    dietary: userPreferences.dietary,
    maxTime: 45
  }}
/>
```

#### ShoppingListGenerator
Automatic shopping list generation from meal plans.

```typescript
<ShoppingListGenerator
  mealPlan={weekPlan}
  pantryItems={pantryItems}
  onGenerate={handleGenerate}
  onOptimize={handleOptimize}
  groupByStore={true}
/>
```

### State Management

#### MealPlannerStore
Manages meal planning state and operations.

```typescript
interface MealPlannerState {
  currentWeek: WeekMealPlan;
  mealHistory: MealHistory[];
  aiSuggestions: MealSuggestion[];
  shoppingList: ShoppingItem[];
}

// Usage
const { currentWeek, addMeal, generateWeek } = useMealPlannerStore();
```

### API Routes

- `GET /api/planner/meals` - Get meal plans
- `POST /api/planner/meals` - Create meal plan
- `PUT /api/planner/meals/[id]` - Update meal plan
- `DELETE /api/planner/meals/[id]` - Remove meal plan
- `POST /features/planner/api/claude/suggestions` - Get AI suggestions
- `POST /features/planner/api/shopping-intelligence` - Generate shopping list

### AI Integration

#### Claude Meal Suggestions
AI-powered meal suggestions based on constraints.

```typescript
const suggestions = await getClaudeMealSuggestions({
  dietaryPreferences: ['vegetarian'],
  availableIngredients: pantryItems,
  mealHistory: recentMeals,
  nutritionGoals: userGoals,
  timeConstraints: { maxPrepTime: 30 }
});
```

#### Shopping Intelligence
Smart shopping list generation and optimization.

```typescript
const shoppingList = await generateShoppingList({
  mealPlan: weekPlan,
  pantryItems: currentPantry,
  preferences: {
    groupByStore: true,
    includeAlternatives: true,
    optimizeForPrice: true
  }
});
```

## Shopping Feature

### Overview

The shopping feature manages shopping lists, store integration, price tracking, and smart recommendations for grocery shopping.

### Key Components

#### ShoppingList
Interactive shopping list with organization and tracking.

```typescript
<ShoppingList
  items={shoppingItems}
  onToggleItem={handleToggle}
  onUpdateQuantity={handleUpdateQuantity}
  onRemoveItem={handleRemove}
  groupBy="category"
  showPrices={true}
/>
```

#### ShoppingListOptimizer
AI-powered shopping list optimization.

```typescript
<ShoppingListOptimizer
  items={shoppingItems}
  stores={nearbyStores}
  onOptimize={handleOptimize}
  preferences={{
    prioritizePrice: true,
    includeAlternatives: true,
    groupByStore: true
  }}
/>
```

### State Management

#### ShoppingStore
Manages shopping lists and store data.

```typescript
interface ShoppingState {
  lists: ShoppingList[];
  activeList: ShoppingList | null;
  stores: Store[];
  priceHistory: PriceHistory[];
}

// Usage
const { activeList, addItem, toggleItem } = useShoppingStore();
```

## Cross-Feature Integration

### Data Flow

Features integrate through shared state and services:

```typescript
// Pantry → Recipes
const availableIngredients = usePantryStore(state => state.items);
const recipeGenerator = useRecipeStore(state => state.generateRecipe);

// Recipes → Planner
const selectedRecipe = useRecipeStore(state => state.currentRecipe);
const addToMealPlan = useMealPlannerStore(state => state.addMeal);

// Planner → Shopping
const weekPlan = useMealPlannerStore(state => state.currentWeek);
const generateShoppingList = useShoppingStore(state => state.generateFromMealPlan);
```

### Event System

Features communicate through an event system:

```typescript
// Pantry item consumed
eventBus.emit('pantry:item-consumed', {
  ingredient: 'tomatoes',
  quantity: 2,
  remainingQuantity: 3
});

// Recipe generated
eventBus.emit('recipe:generated', {
  recipe: newRecipe,
  ingredients: usedIngredients
});

// Meal planned
eventBus.emit('meal:planned', {
  date: '2024-01-15',
  meal: plannedMeal,
  ingredients: requiredIngredients
});
```

## Testing Strategy

### Unit Testing

Each feature has comprehensive unit tests:

```typescript
// Component tests
describe('PantryDashboard', () => {
  it('displays pantry statistics', () => {
    render(<PantryDashboard />);
    expect(screen.getByText('Total Items')).toBeInTheDocument();
  });
});

// Store tests
describe('PantryStore', () => {
  it('adds items to pantry', () => {
    const store = usePantryStore.getState();
    store.addItem(mockItem);
    expect(store.items).toContain(mockItem);
  });
});

// Service tests
describe('PantryService', () => {
  it('fetches pantry items', async () => {
    const items = await fetchPantryItems();
    expect(items).toHaveLength(5);
  });
});
```

### Integration Testing

Features are tested together:

```typescript
describe('Recipe Generation Integration', () => {
  it('generates recipe using pantry ingredients', async () => {
    // Setup pantry items
    const pantryItems = [
      { name: 'tomatoes', quantity: 5 },
      { name: 'pasta', quantity: 1 }
    ];
    
    // Generate recipe
    const recipe = await generateRecipe({
      availableIngredients: pantryItems.map(i => i.name)
    });
    
    expect(recipe.ingredients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'tomatoes' }),
        expect.objectContaining({ name: 'pasta' })
      ])
    );
  });
});
```

### E2E Testing

End-to-end tests cover complete user workflows:

```typescript
// Playwright E2E test
test('complete meal planning workflow', async ({ page }) => {
  // Login
  await page.goto('/auth/signin');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="signin-button"]');

  // Navigate to planner
  await page.goto('/planner');

  // Add meal to plan
  await page.click('[data-testid="add-meal-button"]');
  await page.selectOption('[data-testid="recipe-select"]', 'pasta-recipe');
  await page.click('[data-testid="save-meal-button"]');

  // Generate shopping list
  await page.click('[data-testid="generate-shopping-list"]');

  // Verify shopping list
  await expect(page.locator('[data-testid="shopping-item"]')).toHaveCount(5);
});
```

## Performance Considerations

### Code Splitting

Features are lazy-loaded to improve initial load time:

```typescript
const PantryPage = lazy(() => import('./features/pantry/page'));
const RecipesPage = lazy(() => import('./features/recipes/page'));
const PlannerPage = lazy(() => import('./features/planner/page'));
```

### State Management

Zustand stores use selective subscriptions:

```typescript
// Only subscribe to specific state slices
const items = usePantryStore(state => state.items);
const stats = usePantryStore(state => state.stats);

// Use selectors to prevent unnecessary re-renders
const selectExpiringItems = useCallback(
  (state: PantryState) => state.items.filter(item => 
    isExpiringSoon(item.expiration_date)
  ),
  []
);
const expiringItems = usePantryStore(selectExpiringItems);
```

### API Optimization

Features use optimized API patterns:

```typescript
// Batch operations
const updateItems = useMutation({
  mutationFn: (items: PantryItem[]) => 
    api.pantry.batchUpdate(items),
  onSuccess: () => {
    queryClient.invalidateQueries(['pantry', 'items']);
  }
});

// Optimistic updates
const addItem = useMutation({
  mutationFn: api.pantry.addItem,
  onMutate: async (newItem) => {
    await queryClient.cancelQueries(['pantry', 'items']);
    const previousItems = queryClient.getQueryData(['pantry', 'items']);
    queryClient.setQueryData(['pantry', 'items'], old => [...old, newItem]);
    return { previousItems };
  },
  onError: (err, newItem, context) => {
    queryClient.setQueryData(['pantry', 'items'], context.previousItems);
  }
});
```

## Security Considerations

### Authentication

All features require authentication:

```typescript
// Route protection
export default function PantryPage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth/signin" />;
  
  return <PantryDashboard />;
}
```

### Data Validation

Features validate all inputs:

```typescript
// Zod validation schemas
const pantryItemSchema = z.object({
  ingredient_name: z.string().min(1).max(100),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(20),
  expiration_date: z.date().optional(),
  location: z.string().optional(),
  cost: z.number().positive().optional()
});

// API validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = pantryItemSchema.parse(body);
  // ... handle request
}
```

### Authorization

Features implement row-level security:

```sql
-- Supabase RLS policies
CREATE POLICY "Users can only access their own pantry items"
  ON pantry_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Future Enhancements

### Planned Features

1. **Social Features**
   - Recipe sharing
   - Meal plan collaboration
   - Family shopping lists

2. **Advanced Analytics**
   - Food waste tracking
   - Spending analysis
   - Nutrition trends

3. **Smart Integrations**
   - Grocery store APIs
   - Smart home devices
   - Fitness tracker integration

4. **Mobile App**
   - React Native implementation
   - Offline functionality
   - Push notifications

### Technical Improvements

1. **Performance**
   - Virtual scrolling for large lists
   - Image optimization
   - Progressive loading

2. **AI Enhancements**
   - Improved recipe generation
   - Better meal suggestions
   - Personalized recommendations

3. **User Experience**
   - Voice interactions
   - Gesture controls
   - Accessibility improvements

4. **Developer Experience**
   - Better testing tools
   - Enhanced documentation
   - Development environment improvements