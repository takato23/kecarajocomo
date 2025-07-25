-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can do everything with their own lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can do everything with items in their lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can view their own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can create their own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update their own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete their own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Users can view items in their shopping lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can create items in their shopping lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can update items in their shopping lists" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete items in their shopping lists" ON shopping_items;

-- Create tables with correct structure
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
    checked BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns if tables already exist
DO $$ 
BEGIN
    -- Add checked column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shopping_items' AND column_name = 'checked') THEN
        ALTER TABLE shopping_items ADD COLUMN checked BOOLEAN DEFAULT false;
    END IF;
    
    -- Add position column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shopping_items' AND column_name = 'position') THEN
        ALTER TABLE shopping_items ADD COLUMN position INTEGER DEFAULT 0;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for authenticated users
CREATE POLICY "Enable all for authenticated users on shopping_lists"
    ON shopping_lists
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable all for authenticated users on shopping_items"
    ON shopping_items
    FOR ALL
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_position ON shopping_items(list_id, position);

-- Grant necessary permissions
GRANT ALL ON shopping_lists TO authenticated;
GRANT ALL ON shopping_items TO authenticated;