-- Authentication & Onboarding Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step TEXT DEFAULT 'welcome',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    dietary_restrictions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    cuisine_preferences TEXT[] DEFAULT '{}',
    cooking_skill_level TEXT DEFAULT 'intermediate',
    household_size INTEGER DEFAULT 2,
    weekly_budget DECIMAL(10,2),
    preferred_meal_times JSONB DEFAULT '{}',
    nutrition_goals JSONB DEFAULT '{}',
    cooking_time_preference TEXT DEFAULT 'moderate',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pantry categories table
CREATE TABLE IF NOT EXISTS pantry_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pantry categories
INSERT INTO pantry_categories (name, description, icon) VALUES
    ('proteins', 'Meat, fish, eggs, legumes', '🥩'),
    ('grains', 'Rice, pasta, bread, cereals', '🌾'),
    ('dairy', 'Milk, cheese, yogurt, butter', '🥛'),
    ('vegetables', 'Fresh and frozen vegetables', '🥕'),
    ('fruits', 'Fresh and frozen fruits', '🍎'),
    ('condiments', 'Sauces, dressings, spreads', '🍯'),
    ('spices', 'Herbs, spices, seasonings', '🌿'),
    ('oils', 'Cooking oils, vinegars', '🫒'),
    ('canned_goods', 'Canned and jarred items', '🥫'),
    ('frozen', 'Frozen meals and ingredients', '🧊'),
    ('baking', 'Flour, sugar, baking supplies', '🧁'),
    ('snacks', 'Nuts, crackers, chips', '🥨'),
    ('beverages', 'Water, juice, coffee, tea', '☕')
ON CONFLICT (name) DO NOTHING;

-- Pantry items table
CREATE TABLE IF NOT EXISTS pantry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT REFERENCES pantry_categories(name) DEFAULT 'other',
    quantity DECIMAL(10,2),
    unit TEXT,
    expiration_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal plans table
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'Weekly Meal Plan',
    week_start DATE NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, active, archived
    ai_generated BOOLEAN DEFAULT FALSE,
    generation_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Planned meals table
CREATE TABLE IF NOT EXISTS planned_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    servings INTEGER DEFAULT 1,
    custom_meal TEXT, -- For non-recipe meals
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions tracking (for analytics)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_start TIMESTAMPTZ DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_category ON pantry_items(category);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiration ON pantry_items(user_id, expiration_date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_week ON meal_plans(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_planned_meals_plan_date ON planned_meals(meal_plan_id, date);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pantry_items_updated_at BEFORE UPDATE ON pantry_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Pantry items policies
CREATE POLICY "Users can view own pantry items" ON pantry_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry items" ON pantry_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry items" ON pantry_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items" ON pantry_items
    FOR DELETE USING (auth.uid() = user_id);

-- Meal plans policies
CREATE POLICY "Users can view own meal plans" ON meal_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" ON meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" ON meal_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" ON meal_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Planned meals policies (through meal_plans)
CREATE POLICY "Users can view own planned meals" ON planned_meals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = planned_meals.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own planned meals" ON planned_meals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = planned_meals.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own planned meals" ON planned_meals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = planned_meals.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own planned meals" ON planned_meals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = planned_meals.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

-- User sessions policies (users can only view their own sessions)
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Pantry categories are public (read-only)
ALTER TABLE pantry_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pantry categories" ON pantry_categories
    FOR SELECT USING (true);

-- Functions for user management

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get user's onboarding progress
CREATE OR REPLACE FUNCTION get_onboarding_progress(user_uuid UUID)
RETURNS TABLE (
    step TEXT,
    completed BOOLEAN,
    completion_percentage INTEGER
) AS $$
DECLARE
    profile_exists BOOLEAN;
    preferences_exists BOOLEAN;
    pantry_items_count INTEGER;
    total_steps INTEGER := 6;
    completed_steps INTEGER := 0;
BEGIN
    -- Check if profile exists and is complete
    SELECT EXISTS(
        SELECT 1 FROM user_profiles 
        WHERE user_id = user_uuid 
        AND display_name IS NOT NULL
    ) INTO profile_exists;
    
    -- Check if preferences exist
    SELECT EXISTS(
        SELECT 1 FROM user_preferences 
        WHERE user_id = user_uuid
    ) INTO preferences_exists;
    
    -- Count pantry items
    SELECT COUNT(*) FROM pantry_items 
    WHERE user_id = user_uuid
    INTO pantry_items_count;
    
    -- Calculate completed steps
    IF profile_exists THEN completed_steps := completed_steps + 1; END IF;
    IF preferences_exists THEN completed_steps := completed_steps + 4; END IF; -- Covers multiple preference steps
    IF pantry_items_count > 0 THEN completed_steps := completed_steps + 1; END IF;
    
    -- Return progress
    RETURN QUERY
    SELECT 
        'profile_setup'::TEXT as step,
        profile_exists as completed,
        (completed_steps * 100 / total_steps) as completion_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete onboarding
CREATE OR REPLACE FUNCTION complete_onboarding(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_profiles 
    SET onboarding_completed = TRUE,
        onboarding_step = 'completion',
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;