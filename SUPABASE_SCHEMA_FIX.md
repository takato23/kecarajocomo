# Supabase Schema Cache Fix

## Problem
The PostgREST schema cache is out of sync with the actual database schema, causing errors when trying to save recipes with fields like `cooking_time` and `cuisine_type`.

## Solution Options

### Option 1: Refresh Schema Cache in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Click "Reload Schema Cache" button
4. Wait a few seconds for the cache to refresh

### Option 2: Use SQL Function (Recommended)
Run the following SQL in your Supabase SQL editor:

```sql
-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Or if that doesn't work, try:
SELECT pg_notify('pgrst', 'reload schema');
```

### Option 3: Create RPC Function for Recipe Creation
If the schema cache issue persists, run the SQL function in `src/lib/supabase/create-recipe-function.sql` to create an RPC function that bypasses the PostgREST cache.

### Option 4: Restart PostgREST Service
In some cases, you may need to restart the PostgREST service:
1. Go to Supabase Dashboard > Settings > Infrastructure
2. Restart the API service

## Current Workaround
The app currently saves recipes with minimal fields (name, ingredients, user_id) to avoid the schema cache error. Once the cache is refreshed, all fields will work properly.

## Prevention
To prevent this in the future:
- Always refresh the schema cache after making database schema changes
- Use database migrations to track schema changes
- Consider using RPC functions for complex operations