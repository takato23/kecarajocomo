-- This migration handles existing tables and adds missing columns

-- First, let's check if recipes table exists and add missing columns
DO $$ 
BEGIN
    -- Add cuisine column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='cuisine') THEN
        ALTER TABLE recipes ADD COLUMN cuisine TEXT;
    END IF;
    
    -- Add other columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='dietary_tags') THEN
        ALTER TABLE recipes ADD COLUMN dietary_tags TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='nutritional_info') THEN
        ALTER TABLE recipes ADD COLUMN nutritional_info JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='source_url') THEN
        ALTER TABLE recipes ADD COLUMN source_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='rating') THEN
        ALTER TABLE recipes ADD COLUMN rating NUMERIC(2, 1) CHECK (rating >= 0 AND rating <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='ratings_count') THEN
        ALTER TABLE recipes ADD COLUMN ratings_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='is_public') THEN
        ALTER TABLE recipes ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create pantry_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS pantry_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    quantity NUMERIC(10, 2) DEFAULT 1,
    unit TEXT DEFAULT 'unidad',
    expiration_date DATE,
    purchase_date DATE DEFAULT CURRENT_DATE,
    location TEXT DEFAULT 'pantry',
    notes TEXT,
    barcode TEXT,
    photo_url TEXT,
    price NUMERIC(10, 2),
    nutritional_info JSONB,
    is_running_low BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for pantry_items if they don't exist
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiration ON pantry_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_pantry_items_category ON pantry_items(category);
CREATE INDEX IF NOT EXISTS idx_pantry_items_location ON pantry_items(location);

-- Enable Row Level Security
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pantry_items
DROP POLICY IF EXISTS "Users can view their own pantry items" ON pantry_items;
CREATE POLICY "Users can view their own pantry items"
    ON pantry_items FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own pantry items" ON pantry_items;
CREATE POLICY "Users can create their own pantry items"
    ON pantry_items FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own pantry items" ON pantry_items;
CREATE POLICY "Users can update their own pantry items"
    ON pantry_items FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own pantry items" ON pantry_items;
CREATE POLICY "Users can delete their own pantry items"
    ON pantry_items FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    household_size INTEGER DEFAULT 1,
    dietary_restrictions TEXT[],
    favorite_cuisines TEXT[],
    cooking_skill_level TEXT DEFAULT 'beginner',
    weekly_budget NUMERIC(10, 2),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
CREATE POLICY "Users can create their own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Create meal_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    meals JSONB NOT NULL DEFAULT '{}',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for meal_plans
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_dates ON meal_plans(start_date, end_date);

-- Enable RLS for meal_plans
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meal_plans
DROP POLICY IF EXISTS "Users can view their own meal plans" ON meal_plans;
CREATE POLICY "Users can view their own meal plans"
    ON meal_plans FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own meal plans" ON meal_plans;
CREATE POLICY "Users can create their own meal plans"
    ON meal_plans FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own meal plans" ON meal_plans;
CREATE POLICY "Users can update their own meal plans"
    ON meal_plans FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own meal plans" ON meal_plans;
CREATE POLICY "Users can delete their own meal plans"
    ON meal_plans FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Create or recreate indexes for recipes with correct column names
DROP INDEX IF EXISTS idx_recipes_cuisine;
DROP INDEX IF EXISTS idx_recipes_cuisine_type;
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_pantry_items_updated_at ON pantry_items;
CREATE TRIGGER update_pantry_items_updated_at 
    BEFORE UPDATE ON pantry_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at 
    BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at 
    BEFORE UPDATE ON meal_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();