-- Fix permissions for planned_meals table
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own planned meals" ON planned_meals;
DROP POLICY IF EXISTS "Users can create their own planned meals" ON planned_meals;
DROP POLICY IF EXISTS "Users can update their own planned meals" ON planned_meals;
DROP POLICY IF EXISTS "Users can delete their own planned meals" ON planned_meals;

-- Create policies
CREATE POLICY "Users can view their own planned meals" ON planned_meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own planned meals" ON planned_meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planned meals" ON planned_meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planned meals" ON planned_meals
    FOR DELETE USING (auth.uid() = user_id);

-- Also fix permissions for recipes table if needed
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can create their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;

-- Create policies for recipes
CREATE POLICY "Users can view their own recipes" ON recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recipes" ON recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;