# 🚨 QUICK FIX FOR SHOPPING LISTS

## The Error
You're getting `403 Forbidden` and `permission denied for table shopping_items` because the tables need Row Level Security (RLS) setup.

## Immediate Fix (Copy & Paste This)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Click on **SQL Editor** in the left sidebar
3. Copy and paste ALL of this SQL:

```sql
-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shopping_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit TEXT,
    price NUMERIC(10, 2),
    product_id TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can do everything with their own lists"
    ON shopping_lists FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can do everything with items in their lists"
    ON shopping_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shopping_lists
            WHERE shopping_lists.id = shopping_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );
```

4. Click **"Run"** button
5. Refresh your app - it should work now!

## What This Does
- Creates the tables if missing
- Enables security so users only see their own data
- Allows authenticated users to manage their shopping lists

## Still Having Issues?
Make sure you're logged in to your app before trying to use shopping lists!