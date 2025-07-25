# KeCaraJoComer - Data Models & API Design

## 📊 Database Schema

### Core Entities

#### Users & Authentication
```typescript
// Managed by Supabase Auth
interface AuthUser {
  id: string;                    // UUID
  email: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  created_at: string;
  updated_at: string;
}

// Extended user profile
interface UserProfile {
  id: string;                    // UUID (matches auth.users.id)
  username: string;              // Unique username
  full_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

// User preferences
interface UserPreferences {
  user_id: string;               // FK to users
  dietary_restrictions: DietaryRestriction[];
  allergies: Allergy[];
  cuisine_preferences: CuisineType[];
  cooking_skill_level: SkillLevel;
  household_size: number;
  preferred_meal_times: MealTimePreferences;
  nutrition_goals: NutritionGoals;
  shopping_preferences: ShoppingPreferences;
  notification_settings: NotificationSettings;
  updated_at: Date;
}
```

#### Recipes
```typescript
interface Recipe {
  id: string;                    // UUID
  name: string;
  slug: string;                  // URL-friendly name
  description: string;
  image_url?: string;
  video_url?: string;
  
  // Recipe details
  prep_time: number;             // minutes
  cook_time: number;             // minutes
  total_time: number;            // computed
  difficulty: DifficultyLevel;
  servings: number;
  serving_size?: string;
  
  // Content
  ingredients: RecipeIngredient[];
  instructions: Instruction[];
  equipment: Equipment[];
  tips?: string[];
  variations?: RecipeVariation[];
  
  // Metadata
  nutrition_per_serving: NutritionInfo;
  tags: string[];
  cuisine_types: CuisineType[];
  meal_types: MealType[];
  dietary_info: DietaryInfo;
  season?: Season[];
  
  // AI & Source
  ai_generated: boolean;
  ai_generation_params?: AIGenerationParams;
  source_url?: string;
  source_attribution?: string;
  
  // User data
  created_by: string;            // FK to users
  is_public: boolean;
  rating_average?: number;
  rating_count: number;
  favorite_count: number;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

interface RecipeIngredient {
  id: string;
  ingredient_id: string;         // FK to ingredients
  quantity: number;
  unit: string;
  preparation?: string;          // "diced", "minced", etc.
  optional: boolean;
  group_name?: string;           // "For the sauce", "For garnish"
  substitutions?: IngredientSubstitution[];
  order_index: number;
}

interface Instruction {
  id: string;
  step_number: number;
  instruction: string;
  duration?: number;             // minutes
  temperature?: Temperature;
  tips?: string[];
  media_url?: string;
  techniques?: CookingTechnique[];
}
```

#### Ingredients Master Data
```typescript
interface Ingredient {
  id: string;                    // UUID
  name: string;
  plural_name: string;
  description?: string;
  category: IngredientCategory;
  subcategory?: string;
  
  // Nutritional data (per 100g)
  nutrition: NutritionInfo;
  
  // Storage & Shopping
  typical_shelf_life: number;    // days
  storage_instructions?: string;
  storage_locations: StorageLocation[];
  typical_package_sizes: PackageSize[];
  average_price?: number;
  price_unit?: string;
  
  // Dietary info
  dietary_flags: DietaryFlag[];
  allergens: Allergen[];
  
  // Alternatives
  common_substitutes: string[];  // ingredient IDs
  
  // Search
  aliases: string[];
  search_keywords: string[];
  
  created_at: Date;
  updated_at: Date;
}
```

#### Meal Planning
```typescript
interface MealPlan {
  id: string;                    // UUID
  user_id: string;               // FK to users
  name?: string;                 // "Week of March 1st" or custom
  start_date: Date;
  end_date: Date;
  
  // Planning data
  target_calories?: number;
  target_macros?: MacroTargets;
  notes?: string;
  
  // Sharing
  is_template: boolean;
  is_public: boolean;
  template_category?: string;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  last_modified_by: string;
}

interface PlannedMeal {
  id: string;                    // UUID
  meal_plan_id: string;          // FK to meal_plans
  date: Date;
  meal_type: MealType;
  
  // Meal content
  recipe_id?: string;            // FK to recipes
  custom_meal?: CustomMeal;      // For non-recipe meals
  
  // Customization
  servings: number;
  notes?: string;
  
  // Status
  is_prepared: boolean;
  prepared_at?: Date;
  rating?: number;               // 1-5
  feedback?: string;
  
  // Scheduling
  planned_prep_time?: Date;
  reminder_sent: boolean;
  
  order_index: number;           // For same meal_type ordering
}

interface CustomMeal {
  name: string;
  description?: string;
  estimated_calories?: number;
  quick_ingredients?: string[];
  preparation_notes?: string;
}
```

#### Pantry Management
```typescript
interface PantryItem {
  id: string;                    // UUID
  user_id: string;               // FK to users
  ingredient_id: string;         // FK to ingredients
  
  // Quantity
  quantity: number;
  unit: string;
  
  // Storage
  location: StorageLocation;
  container_type?: string;
  
  // Dates
  purchase_date?: Date;
  expiration_date?: Date;
  opened_date?: Date;
  
  // Cost
  purchase_price?: number;
  purchase_location?: string;
  
  // Status
  status: PantryItemStatus;      // 'fresh', 'expiring_soon', 'expired'
  is_running_low: boolean;
  
  // Metadata
  notes?: string;
  barcode?: string;
  brand?: string;
  
  created_at: Date;
  updated_at: Date;
}

interface PantryTransaction {
  id: string;
  pantry_item_id: string;
  user_id: string;
  type: TransactionType;         // 'add', 'use', 'waste', 'adjust'
  quantity: number;
  unit: string;
  reason?: string;
  related_meal_id?: string;      // If used in a meal
  timestamp: Date;
}
```

#### Shopping
```typescript
interface ShoppingList {
  id: string;                    // UUID
  user_id: string;               // FK to users
  name: string;
  
  // List metadata
  status: ShoppingListStatus;    // 'planning', 'shopping', 'completed'
  planned_shopping_date?: Date;
  completed_at?: Date;
  
  // Source
  meal_plan_ids: string[];       // Generated from meal plans
  
  // Store info
  preferred_store_id?: string;
  estimated_total?: number;
  actual_total?: number;
  
  // Sharing
  shared_with: string[];         // user IDs
  is_collaborative: boolean;
  
  created_at: Date;
  updated_at: Date;
}

interface ShoppingItem {
  id: string;                    // UUID
  shopping_list_id: string;      // FK to shopping_lists
  
  // Item details
  ingredient_id?: string;        // FK to ingredients
  custom_item_name?: string;     // For non-ingredient items
  
  // Quantity
  quantity: number;
  unit: string;
  
  // Categorization
  category: ShoppingCategory;
  aisle?: string;
  
  // Status
  is_checked: boolean;
  checked_at?: Date;
  checked_by?: string;
  
  // Pricing
  estimated_price?: number;
  actual_price?: number;
  
  // Source
  source_type: SourceType;       // 'meal_plan', 'pantry', 'manual'
  source_id?: string;
  recipe_names?: string[];       // For context
  
  // Metadata
  notes?: string;
  priority: Priority;
  brand_preference?: string;
  
  order_index: number;
  created_at: Date;
  updated_at: Date;
}
```

### Supporting Types

```typescript
// Enums and Types
type DietaryRestriction = 'vegetarian' | 'vegan' | 'pescatarian' | 'gluten_free' | 
                         'dairy_free' | 'nut_free' | 'egg_free' | 'soy_free' | 
                         'shellfish_free' | 'low_carb' | 'keto' | 'paleo';

type Allergen = 'milk' | 'eggs' | 'fish' | 'shellfish' | 'tree_nuts' | 
                'peanuts' | 'wheat' | 'soybeans' | 'sesame';

type CuisineType = 'italian' | 'mexican' | 'chinese' | 'japanese' | 'indian' | 
                   'thai' | 'french' | 'mediterranean' | 'american' | 'korean';

type MealType = 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack' | 'dessert';

type DifficultyLevel = 'beginner' | 'easy' | 'intermediate' | 'advanced' | 'expert';

type SkillLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

type Season = 'spring' | 'summer' | 'fall' | 'winter';

type StorageLocation = 'pantry' | 'fridge' | 'freezer' | 'counter' | 'spice_rack';

type ShoppingCategory = 'produce' | 'meat' | 'seafood' | 'dairy' | 'bakery' | 
                       'frozen' | 'canned' | 'dry_goods' | 'beverages' | 
                       'condiments' | 'snacks' | 'household' | 'other';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

type PantryItemStatus = 'fresh' | 'good' | 'expiring_soon' | 'expired' | 'low_stock';

type ShoppingListStatus = 'draft' | 'planning' | 'ready' | 'shopping' | 'completed';

type TransactionType = 'add' | 'use' | 'waste' | 'adjust' | 'donate';

type SourceType = 'meal_plan' | 'pantry_low' | 'recipe' | 'manual' | 'recurring';

// Complex Types
interface NutritionInfo {
  calories: number;
  protein: number;              // grams
  carbohydrates: number;        // grams
  fat: number;                  // grams
  saturated_fat?: number;       // grams
  trans_fat?: number;           // grams
  cholesterol?: number;         // mg
  sodium?: number;              // mg
  potassium?: number;           // mg
  fiber?: number;               // grams
  sugar?: number;               // grams
  vitamin_a?: number;           // % DV
  vitamin_c?: number;           // % DV
  calcium?: number;             // % DV
  iron?: number;                // % DV
}

interface NutritionGoals {
  daily_calories: number;
  macros: MacroTargets;
  restrictions: NutritionRestriction[];
  goals: string[];              // "lose_weight", "gain_muscle", etc.
}

interface MacroTargets {
  protein_percentage: number;
  carbs_percentage: number;
  fat_percentage: number;
}

interface MealTimePreferences {
  breakfast_time?: string;      // "07:00"
  lunch_time?: string;
  dinner_time?: string;
  snack_times?: string[];
}

interface ShoppingPreferences {
  preferred_stores: Store[];
  budget_weekly?: number;
  preferred_brands: { [category: string]: string[] };
  avoid_brands: string[];
}

interface NotificationSettings {
  meal_reminders: boolean;
  shopping_reminders: boolean;
  expiration_alerts: boolean;
  weekly_planning_reminder: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  reminder_advance_time: number; // minutes
}
```

## 🔌 API Design

### RESTful Endpoints

#### Authentication
```typescript
// Supabase Auth handles these automatically
POST   /auth/signup
POST   /auth/signin
POST   /auth/signout
POST   /auth/reset-password
GET    /auth/user
PATCH  /auth/user
```

#### User Management
```typescript
GET    /api/users/profile
PATCH  /api/users/profile
GET    /api/users/preferences
PATCH  /api/users/preferences
DELETE /api/users/account
```

#### Recipes
```typescript
// Public recipes
GET    /api/recipes                    // List with filters
GET    /api/recipes/search            // Full-text search
GET    /api/recipes/featured          // Curated recipes
GET    /api/recipes/{id}              // Get single recipe
GET    /api/recipes/{id}/nutrition    // Detailed nutrition

// User recipes
GET    /api/users/recipes             // User's recipes
POST   /api/users/recipes             // Create recipe
PATCH  /api/users/recipes/{id}       // Update recipe
DELETE /api/users/recipes/{id}       // Delete recipe

// Interactions
POST   /api/recipes/{id}/favorite
DELETE /api/recipes/{id}/favorite
POST   /api/recipes/{id}/rating
GET    /api/recipes/{id}/reviews
```

#### Meal Planning
```typescript
GET    /api/meal-plans                // List user's plans
POST   /api/meal-plans                // Create plan
GET    /api/meal-plans/{id}          // Get plan details
PATCH  /api/meal-plans/{id}          // Update plan
DELETE /api/meal-plans/{id}          // Delete plan

// Meals
POST   /api/meal-plans/{id}/meals    // Add meal
PATCH  /api/meals/{id}               // Update meal
DELETE /api/meals/{id}               // Remove meal
POST   /api/meals/{id}/complete      // Mark as prepared

// Templates
GET    /api/meal-plan-templates      // Browse templates
POST   /api/meal-plans/{id}/save-as-template
```

#### Pantry
```typescript
GET    /api/pantry                   // List items
POST   /api/pantry                   // Add item
PATCH  /api/pantry/{id}             // Update item
DELETE /api/pantry/{id}             // Remove item

// Bulk operations
POST   /api/pantry/bulk-add         // Add multiple
PATCH  /api/pantry/bulk-update      // Update multiple

// Analytics
GET    /api/pantry/expiring         // Items expiring soon
GET    /api/pantry/low-stock        // Items running low
GET    /api/pantry/waste-report     // Waste analytics
```

#### Shopping
```typescript
GET    /api/shopping-lists           // List all
POST   /api/shopping-lists           // Create list
GET    /api/shopping-lists/{id}     // Get list
PATCH  /api/shopping-lists/{id}     // Update list
DELETE /api/shopping-lists/{id}     // Delete list

// Items
POST   /api/shopping-lists/{id}/items      // Add item
PATCH  /api/shopping-items/{id}           // Update item
DELETE /api/shopping-items/{id}           // Remove item
POST   /api/shopping-items/{id}/check     // Toggle checked

// Generation
POST   /api/shopping-lists/generate       // From meal plan
POST   /api/shopping-lists/{id}/optimize  // Optimize by store
```

#### AI Endpoints
```typescript
// Recipe AI
POST   /api/ai/recipes/generate           // Generate recipe
POST   /api/ai/recipes/suggest           // Suggest based on pantry
POST   /api/ai/recipes/substitute        // Ingredient substitutions
POST   /api/ai/recipes/scale            // Scale recipe

// Meal Planning AI
POST   /api/ai/meal-plans/generate      // Generate week plan
POST   /api/ai/meal-plans/balance      // Balance nutrition
POST   /api/ai/meal-plans/optimize     // Optimize for goals

// Assistant
POST   /api/ai/assistant/ask           // General cooking questions
POST   /api/ai/assistant/analyze-photo // Analyze food photo
```

### GraphQL Alternative (Future)
```graphql
type Query {
  # User queries
  me: User
  myRecipes(filter: RecipeFilter, pagination: Pagination): RecipeConnection
  myMealPlans(range: DateRange): [MealPlan]
  myPantry(filter: PantryFilter): [PantryItem]
  
  # Public queries  
  recipes(filter: RecipeFilter, pagination: Pagination): RecipeConnection
  recipe(id: ID!): Recipe
  ingredients(search: String): [Ingredient]
}

type Mutation {
  # Recipe mutations
  createRecipe(input: CreateRecipeInput!): Recipe
  updateRecipe(id: ID!, input: UpdateRecipeInput!): Recipe
  deleteRecipe(id: ID!): Boolean
  
  # Meal planning mutations
  createMealPlan(input: CreateMealPlanInput!): MealPlan
  addMealToPlan(planId: ID!, input: AddMealInput!): PlannedMeal
  
  # AI mutations
  generateRecipe(constraints: RecipeConstraints!): Recipe
  generateMealPlan(preferences: MealPlanPreferences!): MealPlan
}

type Subscription {
  # Real-time updates
  shoppingListUpdated(listId: ID!): ShoppingList
  pantryItemExpiring: PantryItem
}
```

## 🔐 Database Indexes & Performance

```sql
-- User lookups
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Recipe queries
CREATE INDEX idx_recipes_created_by ON recipes(created_by);
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_public_created ON recipes(is_public, created_at DESC);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_cuisine ON recipes USING GIN(cuisine_types);
CREATE INDEX idx_recipes_meal_types ON recipes USING GIN(meal_types);

-- Meal planning
CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, start_date DESC);
CREATE INDEX idx_planned_meals_plan_date ON planned_meals(meal_plan_id, date);
CREATE INDEX idx_planned_meals_date_type ON planned_meals(date, meal_type);

-- Pantry
CREATE INDEX idx_pantry_user_ingredient ON pantry_items(user_id, ingredient_id);
CREATE INDEX idx_pantry_expiration ON pantry_items(user_id, expiration_date)
  WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_pantry_status ON pantry_items(user_id, status);

-- Shopping
CREATE INDEX idx_shopping_lists_user_status ON shopping_lists(user_id, status);
CREATE INDEX idx_shopping_items_list_checked ON shopping_items(shopping_list_id, is_checked);

-- Full text search
CREATE INDEX idx_recipes_search ON recipes USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);
CREATE INDEX idx_ingredients_search ON ingredients USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(array_to_string(aliases, ' '), ''))
);
```

## 🛡️ Row Level Security Policies

```sql
-- User data protection
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Recipe policies
CREATE POLICY "Anyone can view public recipes"
  ON recipes FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = created_by);

-- Meal plan policies
CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR ALL
  USING (auth.uid() = user_id);

-- Pantry policies
CREATE POLICY "Users can manage own pantry"
  ON pantry_items FOR ALL
  USING (auth.uid() = user_id);

-- Shopping list policies
CREATE POLICY "Users can view shared shopping lists"
  ON shopping_lists FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = ANY(shared_with)
  );

CREATE POLICY "Users can manage own shopping lists"
  ON shopping_lists FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id);
```

This comprehensive data model provides a solid foundation for all features while maintaining flexibility for future enhancements.