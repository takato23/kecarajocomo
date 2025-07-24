-- Simple RLS policies for recipes table
-- Run this in Supabase SQL editor

-- First, check if RLS is enabled
-- If you get permission denied errors, RLS is likely enabled but has no policies

-- Option 1: Simple policies for development
-- This allows authenticated users to do everything with recipes

-- Enable RLS (if not already enabled)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view all recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;

-- Create simple policies
CREATE POLICY "Enable read access for authenticated users" ON recipes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON recipes TO authenticated;
GRANT SELECT ON recipes TO anon;

-- Option 2: If you just want to disable RLS for development
-- ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;