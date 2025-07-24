# Supabase Row Level Security (RLS) Fix

## Problem
Getting "permission denied for table recipes" error (403 Forbidden) when trying to insert recipes. This indicates that Row Level Security (RLS) is enabled but no policies are configured.

## Solution

### Option 1: Add RLS Policies (Recommended)
Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable RLS on recipes table
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read all recipes (temporary - adjust as needed)
CREATE POLICY "Authenticated users can view all recipes" 
ON recipes FOR SELECT 
USING (auth.role() = 'authenticated');

-- Alternative: Users can only read their own recipes
-- CREATE POLICY "Users can view own recipes" 
-- ON recipes FOR SELECT 
-- USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own recipes
CREATE POLICY "Users can insert own recipes" 
ON recipes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own recipes
CREATE POLICY "Users can update own recipes" 
ON recipes FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own recipes
CREATE POLICY "Users can delete own recipes" 
ON recipes FOR DELETE 
USING (auth.uid() = user_id);

-- Grant usage on the table
GRANT ALL ON recipes TO authenticated;
GRANT SELECT ON recipes TO anon;
```

### Option 2: Disable RLS (Not Recommended for Production)
If you're in development and want to disable RLS temporarily:

```sql
-- Disable RLS on recipes table
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
```

### Option 3: Service Role Key
If you need to bypass RLS for admin operations, use the service role key instead of the anon key in your API routes.

## Verification

After applying the policies, test by:
1. Ensuring you're logged in (check auth state)
2. Trying to create a recipe through the UI
3. Checking that the user_id matches the authenticated user's ID

## Common Issues

1. **User ID Mismatch**: Ensure the user_id in the recipe matches the authenticated user's ID
2. **Not Authenticated**: Make sure the user is logged in before trying to save recipes
3. **Wrong Key**: Using anon key when service role key is needed for admin operations