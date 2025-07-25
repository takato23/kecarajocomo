# Shopping Lists Setup Guide

## Issue
You're seeing a 403 Forbidden error with the message "permission denied for table shopping_items". This could be because:
1. The tables don't exist yet
2. Row Level Security (RLS) is not enabled
3. RLS policies haven't been created

## Solution

### Complete Setup (Recommended)

Run the complete migration that creates tables and sets up RLS:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to the **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20240301_create_shopping_tables.sql`
4. Click **"Run"** to execute the SQL

This will:
- Create the `shopping_lists` and `shopping_items` tables (if they don't exist)
- Enable Row Level Security (RLS)
- Create all necessary policies
- Set up triggers for `updated_at` timestamps

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Apply the migration
supabase db push
```

### Option 3: Manual SQL Execution

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable RLS on shopping tables
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Create policies for shopping_lists
CREATE POLICY "Users can view their own shopping lists"
    ON shopping_lists FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own shopping lists"
    ON shopping_lists FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own shopping lists"
    ON shopping_lists FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own shopping lists"
    ON shopping_lists FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Create policies for shopping_items
CREATE POLICY "Users can view items in their shopping lists"
    ON shopping_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create items in their shopping lists"
    ON shopping_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in their shopping lists"
    ON shopping_items FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items in their shopping lists"
    ON shopping_items FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );
```

## What These Policies Do

1. **shopping_lists table**:
   - Users can only see, create, update, and delete their own shopping lists
   - The `user_id` must match the authenticated user's ID

2. **shopping_items table**:
   - Users can only interact with items that belong to their shopping lists
   - Checks are done through the relationship with shopping_lists table

## Testing

After applying the RLS policies:

1. Refresh your application
2. Try creating a new shopping list
3. Add items to the list
4. The 403 error should be resolved

## Troubleshooting

If you still see errors:

1. Ensure you're logged in (authenticated)
2. Check that the tables exist in your Supabase database
3. Verify the user_id is being properly set when creating lists
4. Check the Supabase logs for more detailed error messages