-- KeCaraJoComer Database Schema
-- Version: 1.0.0
-- Description: Complete database schema for the cooking assistant app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dietary_restrictions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  cuisine_preferences TEXT[] DEFAULT '{}',
  cooking_skill_level TEXT CHECK (cooking_skill_level IN ('novice', 'beginner', 'intermediate', 'advanced', 'expert')),
  household_size INTEGER DEFAULT 1,
  preferred_meal_times JSONB DEFAULT '{}',
  nutrition_goals JSONB DEFAULT '{}',
  shopping_preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INGREDIENTS MASTER DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plural_name TEXT,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Nutritional data (per 100g)
  nutrition JSONB DEFAULT '{}',
  
  -- Storage & Shopping
  typical_shelf_life INTEGER, -- days
  storage_instructions TEXT,
  storage_locations TEXT[] DEFAULT '{}',
  typical_package_sizes JSONB DEFAULT '[]',
  average_price DECIMAL(10,2),
  price_unit TEXT,
  
  -- Dietary info
  dietary_flags TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  
  -- Alternatives
  common_substitutes UUID[] DEFAULT '{}',
  
  -- Search
  aliases TEXT[] DEFAULT '{}',
  search_keywords TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RECIPES
-- =====================================================

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  
  -- Recipe details
  prep_time INTEGER NOT NULL, -- minutes
  cook_time INTEGER NOT NULL, -- minutes
  total_time INTEGER GENERATED ALWAYS AS (prep_time + cook_time) STORED,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'easy', 'intermediate', 'advanced', 'expert')),
  servings INTEGER DEFAULT 4,
  serving_size TEXT,
  
  -- Content (stored as JSONB for flexibility)
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions JSONB NOT NULL DEFAULT '[]',
  equipment TEXT[] DEFAULT '{}',
  tips TEXT[] DEFAULT '{}',
  variations JSONB DEFAULT '[]',
  
  -- Metadata
  nutrition_per_serving JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  cuisine_types TEXT[] DEFAULT '{}',
  meal_types TEXT[] DEFAULT '{}',
  dietary_info JSONB DEFAULT '{}',
  season TEXT[] DEFAULT '{}',
  
  -- AI & Source
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_generation_params JSONB,
  source_url TEXT,
  source_attribution TEXT,
  
  -- User data
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE,
  rating_average DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Recipe ratings
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- =====================================================
-- MEAL PLANNING
-- =====================================================

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Planning data
  target_calories INTEGER,
  target_macros JSONB,
  notes TEXT,
  
  -- Sharing
  is_template BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  template_category TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_by UUID REFERENCES auth.users(id),
  
  UNIQUE(user_id, start_date, end_date)
);

CREATE TABLE IF NOT EXISTS planned_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'brunch', 'lunch', 'dinner', 'snack', 'dessert')),
  
  -- Meal content
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  custom_meal JSONB, -- For non-recipe meals
  
  -- Customization
  servings INTEGER DEFAULT 1,
  notes TEXT,
  
  -- Status
  is_prepared BOOLEAN DEFAULT FALSE,
  prepared_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- Scheduling
  planned_prep_time TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PANTRY MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  
  -- Quantity
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  
  -- Storage
  location TEXT CHECK (location IN ('pantry', 'fridge', 'freezer', 'counter', 'spice_rack')),
  container_type TEXT,
  
  -- Dates
  purchase_date DATE,
  expiration_date DATE,
  opened_date DATE,
  
  -- Cost
  purchase_price DECIMAL(10,2),
  purchase_location TEXT,
  
  -- Status
  status TEXT DEFAULT 'good' CHECK (status IN ('fresh', 'good', 'expiring_soon', 'expired', 'low_stock')),
  is_running_low BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  notes TEXT,
  barcode TEXT,
  brand TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, ingredient_id, expiration_date)
);

CREATE TABLE IF NOT EXISTS pantry_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pantry_item_id UUID NOT NULL REFERENCES pantry_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('add', 'use', 'waste', 'adjust', 'donate')),
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  reason TEXT,
  related_meal_id UUID REFERENCES planned_meals(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SHOPPING
-- =====================================================

CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  
  -- List metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'planning', 'ready', 'shopping', 'completed')),
  planned_shopping_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Source
  meal_plan_ids UUID[] DEFAULT '{}',
  
  -- Store info
  preferred_store_id UUID,
  estimated_total DECIMAL(10,2),
  actual_total DECIMAL(10,2),
  
  -- Sharing
  shared_with UUID[] DEFAULT '{}',
  is_collaborative BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  
  -- Item details
  ingredient_id UUID REFERENCES ingredients(id),
  custom_item_name TEXT,
  
  -- Quantity
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  
  -- Categorization
  category TEXT NOT NULL,
  aisle TEXT,
  
  -- Status
  is_checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMPTZ,
  checked_by UUID REFERENCES auth.users(id),
  
  -- Pricing
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  
  -- Source
  source_type TEXT CHECK (source_type IN ('meal_plan', 'pantry_low', 'recipe', 'manual', 'recurring')),
  source_id UUID,
  recipe_names TEXT[],
  
  -- Metadata
  notes TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  brand_preference TEXT,
  
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (ingredient_id IS NOT NULL OR custom_item_name IS NOT NULL)
);

-- =====================================================
-- STORES
-- =====================================================

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  store_layout JSONB, -- Aisle mappings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

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
CREATE INDEX idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);

-- Meal planning
CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, start_date DESC);
CREATE INDEX idx_planned_meals_plan_date ON planned_meals(meal_plan_id, date);
CREATE INDEX idx_planned_meals_date_type ON planned_meals(date, meal_type);

-- Pantry
CREATE INDEX idx_pantry_user_ingredient ON pantry_items(user_id, ingredient_id);
CREATE INDEX idx_pantry_expiration ON pantry_items(user_id, expiration_date)
  WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_pantry_status ON pantry_items(user_id, status);
CREATE INDEX idx_pantry_transactions_item ON pantry_transactions(pantry_item_id);

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

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view any profile" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recipe policies
CREATE POLICY "Anyone can view public recipes" ON recipes
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = created_by);

-- Recipe ratings policies
CREATE POLICY "Anyone can view ratings" ON recipe_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create own ratings" ON recipe_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON recipe_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON recipe_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- User favorites policies
CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Meal plan policies
CREATE POLICY "Users can view own meal plans" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own meal plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id);

-- Planned meals policies
CREATE POLICY "Users can view own planned meals" ON planned_meals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = planned_meals.meal_plan_id
      AND (meal_plans.user_id = auth.uid() OR meal_plans.is_public = true)
    )
  );

CREATE POLICY "Users can manage own planned meals" ON planned_meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = planned_meals.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

-- Pantry policies
CREATE POLICY "Users can manage own pantry" ON pantry_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pantry transactions" ON pantry_transactions
  FOR ALL USING (auth.uid() = user_id);

-- Shopping list policies
CREATE POLICY "Users can view shared shopping lists" ON shopping_lists
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = ANY(shared_with)
  );

CREATE POLICY "Users can manage own shopping lists" ON shopping_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists" ON shopping_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists" ON shopping_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Shopping items policies
CREATE POLICY "Users can view shopping items" ON shopping_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.shopping_list_id
      AND (shopping_lists.user_id = auth.uid() OR auth.uid() = ANY(shopping_lists.shared_with))
    )
  );

CREATE POLICY "Users can manage shopping items" ON shopping_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.shopping_list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_ratings_updated_at BEFORE UPDATE ON recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planned_meals_updated_at BEFORE UPDATE ON planned_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pantry_items_updated_at BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON shopping_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update recipe rating average
CREATE OR REPLACE FUNCTION update_recipe_rating_average()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET 
    rating_average = (
      SELECT AVG(rating)::DECIMAL(2,1)
      FROM recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM recipe_ratings
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    )
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipe_rating_on_insert
  AFTER INSERT ON recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION update_recipe_rating_average();

CREATE TRIGGER update_recipe_rating_on_update
  AFTER UPDATE ON recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION update_recipe_rating_average();

CREATE TRIGGER update_recipe_rating_on_delete
  AFTER DELETE ON recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION update_recipe_rating_average();

-- Function to update recipe favorite count
CREATE OR REPLACE FUNCTION update_recipe_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET favorite_count = (
    SELECT COUNT(*)
    FROM user_favorites
    WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
  )
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_favorite_count_on_insert
  AFTER INSERT ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION update_recipe_favorite_count();

CREATE TRIGGER update_favorite_count_on_delete
  AFTER DELETE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION update_recipe_favorite_count();

-- Function to check pantry item expiration status
CREATE OR REPLACE FUNCTION update_pantry_item_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiration_date IS NOT NULL THEN
    IF NEW.expiration_date < CURRENT_DATE THEN
      NEW.status = 'expired';
    ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN
      NEW.status = 'expiring_soon';
    ELSE
      NEW.status = 'good';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_pantry_expiration
  BEFORE INSERT OR UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION update_pantry_item_status();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert common ingredient categories
INSERT INTO ingredients (name, plural_name, category, typical_shelf_life) VALUES
  ('Salt', 'Salt', 'Seasonings', 9999),
  ('Black Pepper', 'Black Pepper', 'Seasonings', 1095),
  ('Olive Oil', 'Olive Oil', 'Oils', 730),
  ('All-Purpose Flour', 'All-Purpose Flour', 'Baking', 365),
  ('Granulated Sugar', 'Granulated Sugar', 'Baking', 9999),
  ('Eggs', 'Eggs', 'Dairy', 28),
  ('Whole Milk', 'Whole Milk', 'Dairy', 7),
  ('Butter', 'Butter', 'Dairy', 90),
  ('Chicken Breast', 'Chicken Breasts', 'Meat', 2),
  ('Ground Beef', 'Ground Beef', 'Meat', 2)
ON CONFLICT DO NOTHING;