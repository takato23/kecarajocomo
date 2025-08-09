-- Shopping Lists and Enhanced Shopping Features Migration
-- Creates tables for shopping lists, items, price tracking, and barcode data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shopping Lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    summary JSONB NOT NULL DEFAULT '{}',
    optimizations JSONB NOT NULL DEFAULT '{}',
    budget DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping Items table
CREATE TABLE IF NOT EXISTS shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'unidades',
    category TEXT DEFAULT 'other',
    store TEXT,
    estimated_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),
    recipe_names TEXT[] DEFAULT '{}',
    checked BOOLEAN DEFAULT false,
    notes TEXT,
    position INTEGER DEFAULT 0,
    barcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (for barcode scanning and price tracking)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    description TEXT,
    image_url TEXT,
    ingredients TEXT[],
    nutrition_info JSONB DEFAULT '{}',
    last_known_price DECIMAL(10,2),
    source TEXT DEFAULT 'manual',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    chain TEXT,
    address TEXT,
    city TEXT,
    coordinates POINT,
    opening_hours JSONB DEFAULT '{}',
    delivery_available BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prices table (for price tracking across stores)
CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT 'unidades',
    promotion BOOLEAN DEFAULT false,
    promotion_details TEXT,
    found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price History table (for tracking price changes over time)
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopping_item_id UUID REFERENCES shopping_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    store TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT 'unidades',
    found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping Preferences table
CREATE TABLE IF NOT EXISTS shopping_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_stores TEXT[] DEFAULT '{}',
    default_budget DECIMAL(10,2) DEFAULT 1000,
    currency TEXT DEFAULT 'ARS',
    auto_save BOOLEAN DEFAULT true,
    price_alerts BOOLEAN DEFAULT true,
    bulk_buy_suggestions BOOLEAN DEFAULT true,
    seasonal_recommendations BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Receipt Processing Log (for tracking receipt OCR processing)
CREATE TABLE IF NOT EXISTS receipt_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT,
    store TEXT,
    total_amount DECIMAL(10,2),
    items_extracted INTEGER DEFAULT 0,
    items_matched INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    error_message TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_week_plan_id ON shopping_lists(week_plan_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_is_active ON shopping_lists(is_active);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_checked ON shopping_items(checked);
CREATE INDEX IF NOT EXISTS idx_shopping_items_position ON shopping_items(position);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_store_id ON prices(store_id);
CREATE INDEX IF NOT EXISTS idx_prices_price ON prices(price);
CREATE INDEX IF NOT EXISTS idx_prices_found_at ON prices(found_at);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_store ON price_history(store);
CREATE INDEX IF NOT EXISTS idx_price_history_found_at ON price_history(found_at);
CREATE INDEX IF NOT EXISTS idx_shopping_preferences_user_id ON shopping_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_processing_log_user_id ON receipt_processing_log(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_processing_log_created_at ON receipt_processing_log(created_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON shopping_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_preferences_updated_at BEFORE UPDATE ON shopping_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_processing_log ENABLE ROW LEVEL SECURITY;

-- Policies for shopping_lists
CREATE POLICY "Users can view their own shopping lists" ON shopping_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shopping lists" ON shopping_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists" ON shopping_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists" ON shopping_lists
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for shopping_items
CREATE POLICY "Users can view items in their shopping lists" ON shopping_items
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM shopping_lists WHERE id = shopping_items.list_id
        )
    );

CREATE POLICY "Users can create items in their shopping lists" ON shopping_items
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM shopping_lists WHERE id = shopping_items.list_id
        )
    );

CREATE POLICY "Users can update items in their shopping lists" ON shopping_items
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM shopping_lists WHERE id = shopping_items.list_id
        )
    );

CREATE POLICY "Users can delete items in their shopping lists" ON shopping_items
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM shopping_lists WHERE id = shopping_items.list_id
        )
    );

-- Policies for shopping_preferences
CREATE POLICY "Users can view their own shopping preferences" ON shopping_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shopping preferences" ON shopping_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping preferences" ON shopping_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping preferences" ON shopping_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for receipt_processing_log
CREATE POLICY "Users can view their own receipt processing logs" ON receipt_processing_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receipt processing logs" ON receipt_processing_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for products, stores, and prices (for price comparison)
CREATE POLICY "Products are publicly readable" ON products
    FOR SELECT USING (true);

CREATE POLICY "Stores are publicly readable" ON stores
    FOR SELECT USING (true);

CREATE POLICY "Prices are publicly readable" ON prices
    FOR SELECT USING (true);

-- Insert sample stores for Argentina
INSERT INTO stores (name, chain, city, active) VALUES
    ('Carrefour San Isidro', 'carrefour', 'San Isidro', true),
    ('Coto Centro', 'coto', 'Buenos Aires', true),
    ('Día Market Palermo', 'dia', 'Buenos Aires', true),
    ('Jumbo Unicenter', 'jumbo', 'Martínez', true),
    ('Disco Villa Crespo', 'disco', 'Buenos Aires', true),
    ('Walmart Avellaneda', 'walmart', 'Avellaneda', true)
ON CONFLICT DO NOTHING;

-- Insert sample product categories
INSERT INTO products (name, category, active) VALUES
    ('Aceite de Girasol', 'pantry', true),
    ('Sal Fina', 'spices', true),
    ('Azúcar Común', 'pantry', true),
    ('Harina 0000', 'grains', true),
    ('Arroz Largo Fino', 'grains', true),
    ('Leche Entera', 'dairy', true),
    ('Pan Lactal', 'grains', true),
    ('Tomate en Lata', 'pantry', true)
ON CONFLICT DO NOTHING;

-- Create a function to get shopping list with analytics
CREATE OR REPLACE FUNCTION get_shopping_list_analytics(list_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'list_info', (
            SELECT json_build_object(
                'id', id,
                'name', name,
                'budget', budget,
                'total_items', (SELECT COUNT(*) FROM shopping_items WHERE list_id = list_uuid),
                'checked_items', (SELECT COUNT(*) FROM shopping_items WHERE list_id = list_uuid AND checked = true),
                'estimated_total', COALESCE((SELECT SUM(estimated_price * quantity) FROM shopping_items WHERE list_id = list_uuid), 0),
                'actual_total', COALESCE((SELECT SUM(actual_price * quantity) FROM shopping_items WHERE list_id = list_uuid AND actual_price IS NOT NULL), 0)
            )
            FROM shopping_lists WHERE id = list_uuid
        ),
        'category_breakdown', (
            SELECT json_agg(
                json_build_object(
                    'category', category,
                    'items', count(*),
                    'estimated_cost', COALESCE(SUM(estimated_price * quantity), 0)
                )
            )
            FROM shopping_items 
            WHERE list_id = list_uuid 
            GROUP BY category
        ),
        'completion_rate', (
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 0 
                ELSE ROUND((COUNT(*) FILTER (WHERE checked = true)::DECIMAL / COUNT(*)) * 100, 2)
            END
            FROM shopping_items WHERE list_id = list_uuid
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE shopping_lists IS 'Main shopping lists with metadata and analytics';
COMMENT ON TABLE shopping_items IS 'Individual items in shopping lists';
COMMENT ON TABLE products IS 'Product catalog for barcode scanning and price tracking';
COMMENT ON TABLE stores IS 'Store locations and information';
COMMENT ON TABLE prices IS 'Current prices across stores';
COMMENT ON TABLE price_history IS 'Historical price tracking data';
COMMENT ON TABLE shopping_preferences IS 'User shopping preferences and settings';
COMMENT ON TABLE receipt_processing_log IS 'Log of receipt OCR processing attempts';