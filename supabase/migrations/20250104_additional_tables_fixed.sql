-- Create ingredients table for price tracking
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'unidad',
    average_price NUMERIC(10, 2),
    price_per_unit NUMERIC(10, 2),
    nutritional_info JSONB,
    aliases TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

-- Create item_usage_history table
CREATE TABLE IF NOT EXISTS item_usage_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_name TEXT NOT NULL,
    quantity_used NUMERIC(10, 2),
    unit TEXT,
    used_date DATE DEFAULT CURRENT_DATE,
    context TEXT, -- 'recipe', 'direct_consumption', 'expired', etc.
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for usage history
CREATE INDEX IF NOT EXISTS idx_usage_history_user_id ON item_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_item ON item_usage_history(item_name);
CREATE INDEX IF NOT EXISTS idx_usage_history_date ON item_usage_history(used_date);

-- Enable RLS
ALTER TABLE item_usage_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for item_usage_history
DROP POLICY IF EXISTS "Users can view their own usage history" ON item_usage_history;
CREATE POLICY "Users can view their own usage history"
    ON item_usage_history FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own usage history" ON item_usage_history;
CREATE POLICY "Users can create their own usage history"
    ON item_usage_history FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Create user_savings table
CREATE TABLE IF NOT EXISTS user_savings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month DATE NOT NULL, -- First day of the month
    total_spent NUMERIC(10, 2) DEFAULT 0,
    estimated_saved NUMERIC(10, 2) DEFAULT 0,
    waste_cost NUMERIC(10, 2) DEFAULT 0,
    deals_saved NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, month)
);

-- Create indexes for user_savings
CREATE INDEX IF NOT EXISTS idx_user_savings_user_id ON user_savings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_savings_month ON user_savings(month);

-- Enable RLS
ALTER TABLE user_savings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_savings
DROP POLICY IF EXISTS "Users can view their own savings" ON user_savings;
CREATE POLICY "Users can view their own savings"
    ON user_savings FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own savings" ON user_savings;
CREATE POLICY "Users can create their own savings"
    ON user_savings FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own savings" ON user_savings;
CREATE POLICY "Users can update their own savings"
    ON user_savings FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create receipt_scans table
CREATE TABLE IF NOT EXISTS receipt_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    store_name TEXT,
    scan_date DATE DEFAULT CURRENT_DATE,
    total_amount NUMERIC(10, 2),
    items JSONB NOT NULL DEFAULT '[]',
    raw_text TEXT,
    image_url TEXT,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for receipt_scans
CREATE INDEX IF NOT EXISTS idx_receipt_scans_user_id ON receipt_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_scans_date ON receipt_scans(scan_date);
CREATE INDEX IF NOT EXISTS idx_receipt_scans_store ON receipt_scans(store_name);

-- Enable RLS
ALTER TABLE receipt_scans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for receipt_scans
DROP POLICY IF EXISTS "Users can view their own receipt scans" ON receipt_scans;
CREATE POLICY "Users can view their own receipt scans"
    ON receipt_scans FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own receipt scans" ON receipt_scans;
CREATE POLICY "Users can create their own receipt scans"
    ON receipt_scans FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own receipt scans" ON receipt_scans;
CREATE POLICY "Users can update their own receipt scans"
    ON receipt_scans FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create user_savings_summary view
CREATE OR REPLACE VIEW user_savings_summary AS
SELECT 
    user_id,
    SUM(total_spent) as total_spent_all_time,
    SUM(estimated_saved) as total_saved_all_time,
    SUM(waste_cost) as total_waste_all_time,
    AVG(total_spent) as avg_monthly_spending,
    MAX(month) as last_updated_month
FROM user_savings
GROUP BY user_id;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_user_savings_updated_at ON user_savings;
CREATE TRIGGER update_user_savings_updated_at 
    BEFORE UPDATE ON user_savings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ingredients_updated_at ON ingredients;
CREATE TRIGGER update_ingredients_updated_at 
    BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();