# Database Schema Design - kecarajocomer

## Overview

PostgreSQL database schema optimized for a meal planning application with AI features, using Supabase as the backend platform.

## Design Principles

1. **Normalization**: Properly normalized to avoid data redundancy
2. **Performance**: Strategic indexes and materialized views
3. **Security**: Row Level Security (RLS) policies
4. **Flexibility**: JSONB for semi-structured data
5. **Scalability**: Partitioning ready for large datasets

## Core Tables

### Users & Authentication

```sql
-- Supabase Auth handles the users table
-- Extended with profile information

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dietary_restrictions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  disliked_ingredients TEXT[] DEFAULT '{}',
  cuisine_preferences TEXT[] DEFAULT '{}',
  cooking_skill_level TEXT CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced')),
  max_cooking_time INTEGER, -- in minutes
  household_size INTEGER DEFAULT 2,
  budget_preference TEXT CHECK (budget_preference IN ('economy', 'moderate', 'premium')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nutrition_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_calories INTEGER,
  daily_protein DECIMAL(10,2), -- grams
  daily_carbs DECIMAL(10,2), -- grams
  daily_fat DECIMAL(10,2), -- grams
  daily_fiber DECIMAL(10,2), -- grams
  weekly_budget DECIMAL(10,2), -- currency
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Ingredients & Categories

```sql
CREATE TABLE ingredient_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  name_plural TEXT,
  category_id UUID REFERENCES ingredient_categories(id),
  default_unit TEXT NOT NULL,
  alternative_names TEXT[] DEFAULT '{}',
  barcode TEXT,
  is_common BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ingredient_nutrition (
  ingredient_id UUID PRIMARY KEY REFERENCES ingredients(id) ON DELETE CASCADE,
  calories_per_100g DECIMAL(10,2),
  protein_per_100g DECIMAL(10,2),
  carbs_per_100g DECIMAL(10,2),
  fat_per_100g DECIMAL(10,2),
  fiber_per_100g DECIMAL(10,2),
  sugar_per_100g DECIMAL(10,2),
  sodium_per_100mg DECIMAL(10,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unit conversions for ingredients
CREATE TABLE unit_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  from_unit TEXT NOT NULL,
  to_unit TEXT NOT NULL,
  multiplier DECIMAL(10,4) NOT NULL,
  UNIQUE(ingredient_id, from_unit, to_unit)
);
```

### Recipes

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  instructions JSONB NOT NULL, -- Array of step objects
  prep_time INTEGER, -- minutes
  cook_time INTEGER, -- minutes
  total_time INTEGER GENERATED ALWAYS AS (prep_time + cook_time) STORED,
  servings INTEGER DEFAULT 4,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cuisine_type TEXT,
  meal_types TEXT[] DEFAULT '{}', -- breakfast, lunch, dinner, snack
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  video_url TEXT,
  source_url TEXT,
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT, -- Store the prompt used if AI generated
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  amount DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT, -- e.g., "finely chopped", "optional"
  ingredient_group TEXT, -- e.g., "For the sauce", "For the marinade"
  sort_order INTEGER DEFAULT 0
);

-- Calculated nutrition per serving
CREATE TABLE recipe_nutrition (
  recipe_id UUID PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  calories DECIMAL(10,2),
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fat DECIMAL(10,2),
  fiber DECIMAL(10,2),
  sugar DECIMAL(10,2),
  sodium DECIMAL(10,2),
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

CREATE TABLE saved_recipes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);
```

### Meal Planning

```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  week_start DATE NOT NULL,
  week_end DATE GENERATED ALWAYS AS (week_start + INTERVAL '6 days') STORED,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE TABLE planned_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id),
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  servings INTEGER DEFAULT 1,
  notes TEXT,
  is_prepared BOOLEAN DEFAULT false,
  prepared_at TIMESTAMPTZ,
  UNIQUE(meal_plan_id, date, meal_type)
);

-- For meal plan templates
CREATE TABLE meal_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  meals JSONB NOT NULL, -- Array of template meals
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pantry Management

```sql
CREATE TABLE pantry_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('fridge', 'freezer', 'pantry', 'other')),
  sort_order INTEGER DEFAULT 0,
  UNIQUE(user_id, name)
);

CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  location_id UUID REFERENCES pantry_locations(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  notes TEXT,
  is_running_low BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track pantry usage for smart predictions
CREATE TABLE pantry_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity_used DECIMAL(10,2),
  unit TEXT,
  used_for TEXT, -- 'meal_plan', 'manual', etc.
  used_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Shopping

```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  category_id UUID REFERENCES ingredient_categories(id),
  is_purchased BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  purchased_at TIMESTAMPTZ
);

-- Store preferences and price tracking
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT,
  is_default BOOLEAN DEFAULT false,
  UNIQUE(user_id, name)
);

CREATE TABLE ingredient_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_recipes_meal_types ON recipes USING GIN(meal_types);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_created_by ON recipes(created_by);
CREATE INDEX idx_recipes_slug ON recipes(slug);

CREATE INDEX idx_meal_plans_user_week ON meal_plans(user_id, week_start);
CREATE INDEX idx_planned_meals_date ON planned_meals(meal_plan_id, date);

CREATE INDEX idx_pantry_items_user ON pantry_items(user_id);
CREATE INDEX idx_pantry_items_expiration ON pantry_items(user_id, expiration_date);

CREATE INDEX idx_shopping_items_list ON shopping_items(shopping_list_id, is_purchased);

-- Full text search
CREATE INDEX idx_recipes_search ON recipes USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

CREATE INDEX idx_ingredients_search ON ingredients USING gin(
  to_tsvector('english', name || ' ' || array_to_string(alternative_names, ' '))
);
```

## Views and Materialized Views

```sql
-- User's active meal plan view
CREATE VIEW active_meal_plans AS
SELECT 
  mp.*,
  COUNT(pm.id) as total_meals,
  COUNT(CASE WHEN pm.is_prepared THEN 1 END) as prepared_meals
FROM meal_plans mp
LEFT JOIN planned_meals pm ON mp.id = pm.meal_plan_id
WHERE mp.is_active = true
GROUP BY mp.id;

-- Recipe popularity
CREATE MATERIALIZED VIEW recipe_popularity AS
SELECT 
  r.id,
  r.name,
  COUNT(DISTINCT pm.meal_plan_id) as times_planned,
  AVG(rr.rating) as avg_rating,
  COUNT(DISTINCT rr.user_id) as rating_count,
  COUNT(DISTINCT sr.user_id) as save_count
FROM recipes r
LEFT JOIN planned_meals pm ON r.id = pm.recipe_id
LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id
LEFT JOIN saved_recipes sr ON r.id = sr.recipe_id
GROUP BY r.id, r.name;

-- Refresh periodically
CREATE INDEX idx_recipe_popularity ON recipe_popularity(times_planned DESC, avg_rating DESC);

-- Pantry expiration summary
CREATE VIEW pantry_expiration_summary AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE expiration_date < CURRENT_DATE) as expired_items,
  COUNT(*) FILTER (WHERE expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 3) as expiring_soon,
  COUNT(*) FILTER (WHERE is_running_low = true) as low_stock_items
FROM pantry_items
GROUP BY user_id;

-- Weekly nutrition summary
CREATE MATERIALIZED VIEW weekly_nutrition_summary AS
SELECT 
  mp.user_id,
  mp.week_start,
  AVG(rn.calories * pm.servings) as avg_daily_calories,
  AVG(rn.protein * pm.servings) as avg_daily_protein,
  AVG(rn.carbs * pm.servings) as avg_daily_carbs,
  AVG(rn.fat * pm.servings) as avg_daily_fat,
  AVG(rn.fiber * pm.servings) as avg_daily_fiber
FROM meal_plans mp
JOIN planned_meals pm ON mp.id = pm.meal_plan_id
JOIN recipe_nutrition rn ON pm.recipe_id = rn.recipe_id
GROUP BY mp.user_id, mp.week_start;
```

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Recipe policies
CREATE POLICY "Public recipes are viewable by all" ON recipes
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create recipes" ON recipes
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (created_by = auth.uid());

-- Meal plan policies
CREATE POLICY "Users can view own meal plans" ON meal_plans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meal plans" ON meal_plans
  FOR UPDATE USING (user_id = auth.uid());

-- Pantry policies
CREATE POLICY "Users can manage own pantry" ON pantry_items
  FOR ALL USING (user_id = auth.uid());

-- Shopping list policies
CREATE POLICY "Users can manage own shopping lists" ON shopping_lists
  FOR ALL USING (user_id = auth.uid());
```

## Functions and Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate recipe nutrition
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition()
RETURNS TRIGGER AS $$
DECLARE
  total_nutrition RECORD;
BEGIN
  SELECT 
    SUM(in.calories_per_100g * ri.amount * uc.multiplier / 100) as calories,
    SUM(in.protein_per_100g * ri.amount * uc.multiplier / 100) as protein,
    SUM(in.carbs_per_100g * ri.amount * uc.multiplier / 100) as carbs,
    SUM(in.fat_per_100g * ri.amount * uc.multiplier / 100) as fat,
    SUM(in.fiber_per_100g * ri.amount * uc.multiplier / 100) as fiber,
    SUM(in.sugar_per_100g * ri.amount * uc.multiplier / 100) as sugar,
    SUM(in.sodium_per_100mg * ri.amount * uc.multiplier / 100) as sodium
  INTO total_nutrition
  FROM recipe_ingredients ri
  JOIN ingredient_nutrition in ON ri.ingredient_id = in.ingredient_id
  LEFT JOIN unit_conversions uc ON 
    uc.ingredient_id = ri.ingredient_id AND 
    uc.from_unit = ri.unit AND 
    uc.to_unit = 'gram'
  WHERE ri.recipe_id = NEW.recipe_id;

  INSERT INTO recipe_nutrition (
    recipe_id, calories, protein, carbs, fat, fiber, sugar, sodium
  ) VALUES (
    NEW.recipe_id,
    total_nutrition.calories / COALESCE((SELECT servings FROM recipes WHERE id = NEW.recipe_id), 1),
    total_nutrition.protein / COALESCE((SELECT servings FROM recipes WHERE id = NEW.recipe_id), 1),
    total_nutrition.carbs / COALESCE((SELECT servings FROM recipes WHERE id = NEW.recipe_id), 1),
    total_nutrition.fat / COALESCE((SELECT servings FROM recipes WHERE id = NEW.recipe_id), 1),
    total_nutrition.fiber / COALESCE((SELECT servings FROM recipes WHERE id = NEW.recipe_id), 1),
    total_nutrition.sugar / COALESCE((SELECT servings FROM recipes WHERE id = NEW.recipe_id), 1),
    total_nutrition.sodium / COALESCE((SELECT servings FROM recipes WHERE id = NEW.recipe_id), 1)
  )
  ON CONFLICT (recipe_id) DO UPDATE SET
    calories = EXCLUDED.calories,
    protein = EXCLUDED.protein,
    carbs = EXCLUDED.carbs,
    fat = EXCLUDED.fat,
    fiber = EXCLUDED.fiber,
    sugar = EXCLUDED.sugar,
    sodium = EXCLUDED.sodium,
    last_calculated = NOW();

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_nutrition_on_ingredient_change
AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients
FOR EACH ROW EXECUTE FUNCTION calculate_recipe_nutrition();

-- Generate recipe slug
CREATE OR REPLACE FUNCTION generate_recipe_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug = lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Add random suffix if slug exists
  WHILE EXISTS (SELECT 1 FROM recipes WHERE slug = NEW.slug AND id != NEW.id) LOOP
    NEW.slug = NEW.slug || '-' || substr(md5(random()::text), 1, 6);
  END LOOP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_recipe_slug_trigger
BEFORE INSERT OR UPDATE OF name ON recipes
FOR EACH ROW EXECUTE FUNCTION generate_recipe_slug();

-- Smart shopping list generation
CREATE OR REPLACE FUNCTION generate_shopping_list(
  p_user_id UUID,
  p_meal_plan_id UUID
) RETURNS UUID AS $$
DECLARE
  v_shopping_list_id UUID;
  v_pantry_item RECORD;
  v_needed_item RECORD;
BEGIN
  -- Create new shopping list
  INSERT INTO shopping_lists (user_id, meal_plan_id)
  VALUES (p_user_id, p_meal_plan_id)
  RETURNING id INTO v_shopping_list_id;

  -- Get all needed ingredients from meal plan
  FOR v_needed_item IN
    SELECT 
      ri.ingredient_id,
      i.category_id,
      SUM(ri.amount * pm.servings) as total_amount,
      ri.unit
    FROM planned_meals pm
    JOIN recipe_ingredients ri ON pm.recipe_id = ri.recipe_id
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE pm.meal_plan_id = p_meal_plan_id
    GROUP BY ri.ingredient_id, i.category_id, ri.unit
  LOOP
    -- Check pantry stock
    SELECT 
      COALESCE(SUM(quantity), 0) as available_quantity
    INTO v_pantry_item
    FROM pantry_items
    WHERE user_id = p_user_id 
      AND ingredient_id = v_needed_item.ingredient_id
      AND unit = v_needed_item.unit;

    -- Add to shopping list if not enough in pantry
    IF v_needed_item.total_amount > v_pantry_item.available_quantity THEN
      INSERT INTO shopping_items (
        shopping_list_id,
        ingredient_id,
        quantity,
        unit,
        category_id
      ) VALUES (
        v_shopping_list_id,
        v_needed_item.ingredient_id,
        v_needed_item.total_amount - v_pantry_item.available_quantity,
        v_needed_item.unit,
        v_needed_item.category_id
      );
    END IF;
  END LOOP;

  RETURN v_shopping_list_id;
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Run migrations in order
-- 1. Create tables
-- 2. Add indexes
-- 3. Create views
-- 4. Enable RLS
-- 5. Add policies
-- 6. Create functions and triggers

-- Seed data for categories
INSERT INTO ingredient_categories (name, icon, sort_order) VALUES
  ('Produce', '🥬', 1),
  ('Proteins', '🥩', 2),
  ('Dairy', '🥛', 3),
  ('Grains', '🌾', 4),
  ('Pantry', '🥫', 5),
  ('Spices', '🧂', 6),
  ('Condiments', '🍯', 7),
  ('Beverages', '🥤', 8);
```

## Performance Considerations

1. **Partitioning**: Consider partitioning `pantry_usage_history` and `ingredient_prices` by date for large datasets
2. **Materialized Views**: Refresh `recipe_popularity` and `weekly_nutrition_summary` daily via cron
3. **Connection Pooling**: Use Supabase's built-in connection pooler
4. **Query Optimization**: Monitor slow queries and add indexes as needed
5. **Archival**: Move old meal plans and shopping lists to archive tables after 1 year

## Backup Strategy

1. **Continuous Backups**: Supabase provides automatic daily backups
2. **Point-in-Time Recovery**: Available for Pro plan
3. **Export Critical Data**: Weekly exports of user preferences and recipes
4. **Test Restores**: Monthly restore tests to verify backup integrity