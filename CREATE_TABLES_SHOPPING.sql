-- Drop existing tables to start fresh (BE CAREFUL - this will delete all data)
-- Uncomment these lines only if you want to start completely fresh:
-- DROP TABLE IF EXISTS shopping_items CASCADE;
-- DROP TABLE IF EXISTS shopping_lists CASCADE;

-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create shopping_items table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_is_active ON shopping_lists(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_position ON shopping_items(list_id, position);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at 
    BEFORE UPDATE ON shopping_lists
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopping_items_updated_at ON shopping_items;
CREATE TRIGGER update_shopping_items_updated_at 
    BEFORE UPDATE ON shopping_items
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopping_lists
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

-- Create RLS policies for shopping_items
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
    )
    WITH CHECK (
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

-- Grant permissions
GRANT ALL ON shopping_lists TO authenticated;
GRANT ALL ON shopping_items TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;