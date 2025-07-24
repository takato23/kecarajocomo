-- Create shopping_lists table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    meal_plan_id UUID,
    is_active BOOLEAN DEFAULT true,
    budget DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping_list_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id),
    custom_name VARCHAR(255),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    is_checked BOOLEAN DEFAULT false,
    price DECIMAL(10, 2),
    store VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON public.shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_is_active ON public.shopping_lists(is_active);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON public.shopping_list_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_ingredient_id ON public.shopping_list_items(ingredient_id);

-- Enable Row Level Security
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create policies for shopping_lists
CREATE POLICY "Users can view their own shopping lists" ON public.shopping_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shopping lists" ON public.shopping_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists" ON public.shopping_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists" ON public.shopping_lists
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for shopping_list_items
CREATE POLICY "Users can view items from their shopping lists" ON public.shopping_list_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add items to their shopping lists" ON public.shopping_list_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in their shopping lists" ON public.shopping_list_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items from their shopping lists" ON public.shopping_list_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.shopping_list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_list_items_updated_at BEFORE UPDATE ON public.shopping_list_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();