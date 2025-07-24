-- ============================================================================
-- KECARajoCOMER - Supabase Database Schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- User profiles and preferences
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    dietary_restrictions text[] DEFAULT '{}',
    allergies text[] DEFAULT '{}',
    favorite_cuisines text[] DEFAULT '{}',
    cooking_skill_level text DEFAULT 'beginner' CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced')),
    budget_preferences jsonb DEFAULT '{}',
    household_size integer DEFAULT 1,
    preferences jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- ============================================================================
-- RECIPES AND INGREDIENTS
-- ============================================================================

-- Categories for recipes
CREATE TABLE IF NOT EXISTS public.recipe_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    icon text,
    created_at timestamp with time zone DEFAULT now()
);

-- Recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    preparation_time integer, -- in minutes
    cooking_time integer, -- in minutes
    servings integer DEFAULT 1,
    difficulty_level text DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    cuisine_type text,
    category_id uuid REFERENCES public.recipe_categories(id),
    image_url text,
    video_url text,
    instructions text[],
    ingredients jsonb NOT NULL DEFAULT '[]',
    macronutrients jsonb DEFAULT '{}',
    tags text[] DEFAULT '{}',
    is_ai_generated boolean DEFAULT false,
    is_public boolean DEFAULT false,
    is_favorite boolean DEFAULT false,
    rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    source_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Ingredients master table
CREATE TABLE IF NOT EXISTS public.ingredients (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    category text,
    default_unit text,
    nutritional_info jsonb DEFAULT '{}',
    common_names text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- PANTRY MANAGEMENT
-- ============================================================================

-- User pantry items
CREATE TABLE IF NOT EXISTS public.pantry_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    ingredient_id uuid REFERENCES public.ingredients(id),
    custom_name text, -- for items not in ingredients master
    quantity numeric NOT NULL DEFAULT 0,
    unit text NOT NULL DEFAULT 'units',
    purchase_date date,
    expiration_date date,
    location text, -- fridge, pantry, freezer
    notes text,
    cost numeric(10,2),
    barcode text,
    image_url text,
    is_running_low boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- MEAL PLANNING
-- ============================================================================

-- Planned meals
CREATE TABLE IF NOT EXISTS public.planned_meals (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
    custom_meal_name text, -- for meals without recipes
    plan_date date NOT NULL,
    meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
    servings integer DEFAULT 1,
    notes text,
    is_prepared boolean DEFAULT false,
    preparation_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, plan_date, meal_type, recipe_id, custom_meal_name)
);

-- ============================================================================
-- SHOPPING LISTS
-- ============================================================================

-- Shopping lists
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL DEFAULT 'Lista de Compras',
    description text,
    is_active boolean DEFAULT true,
    total_estimated_cost numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Shopping list items
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopping_list_id uuid REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
    ingredient_id uuid REFERENCES public.ingredients(id),
    custom_name text, -- for items not in ingredients master
    quantity numeric NOT NULL DEFAULT 1,
    unit text NOT NULL DEFAULT 'units',
    estimated_cost numeric(10,2),
    actual_cost numeric(10,2),
    category text,
    notes text,
    is_purchased boolean DEFAULT false,
    priority integer DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    source text, -- 'manual', 'recipe', 'pantry'
    source_id uuid, -- reference to planned_meal or pantry_item
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- SCANNING AND OCR
-- ============================================================================

-- Scanned receipts/tickets
CREATE TABLE IF NOT EXISTS public.scanned_receipts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    image_url text NOT NULL,
    ocr_text text,
    parsed_items jsonb DEFAULT '[]',
    store_name text,
    store_address text,
    receipt_date date,
    total_amount numeric(10,2),
    processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- NOTIFICATIONS AND REMINDERS
-- ============================================================================

-- User notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('expiration', 'low_stock', 'meal_suggestion', 'recipe_recommendation', 'shopping_reminder')),
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    is_dismissed boolean DEFAULT false,
    scheduled_for timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Recipe indexes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON public.recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_type ON public.recipes(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON public.recipes USING GIN(tags);

-- Pantry indexes
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_ingredient_id ON public.pantry_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiration_date ON public.pantry_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_pantry_items_location ON public.pantry_items(location);

-- Meal planning indexes
CREATE INDEX IF NOT EXISTS idx_planned_meals_user_id ON public.planned_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_recipe_id ON public.planned_meals(recipe_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_plan_date ON public.planned_meals(plan_date);
CREATE INDEX IF NOT EXISTS idx_planned_meals_meal_type ON public.planned_meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_planned_meals_user_date_type ON public.planned_meals(user_id, plan_date, meal_type);

-- Shopping list indexes
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON public.shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON public.shopping_list_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_ingredient_id ON public.shopping_list_items(ingredient_id);

-- Scanning indexes
CREATE INDEX IF NOT EXISTS idx_scanned_receipts_user_id ON public.scanned_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_scanned_receipts_status ON public.scanned_receipts(processing_status);
CREATE INDEX IF NOT EXISTS idx_scanned_receipts_date ON public.scanned_receipts(receipt_date);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON public.notifications(scheduled_for);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanned_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- User profiles policies
CREATE POLICY "Users can read own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Recipe policies
CREATE POLICY "Users can read own recipes" ON public.recipes
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own recipes" ON public.recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON public.recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON public.recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Pantry policies
CREATE POLICY "Users can manage own pantry" ON public.pantry_items
    FOR ALL USING (auth.uid() = user_id);

-- Planned meals policies
CREATE POLICY "Users can manage own planned meals" ON public.planned_meals
    FOR ALL USING (auth.uid() = user_id);

-- Shopping list policies
CREATE POLICY "Users can manage own shopping lists" ON public.shopping_lists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own shopping list items" ON public.shopping_list_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.shopping_lists
        WHERE shopping_lists.id = shopping_list_items.shopping_list_id
        AND shopping_lists.user_id = auth.uid()
    ));

-- Scanning policies
CREATE POLICY "Users can manage own scanned receipts" ON public.scanned_receipts
    FOR ALL USING (auth.uid() = user_id);

-- Notification policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at 
    BEFORE UPDATE ON public.recipes 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pantry_items_updated_at 
    BEFORE UPDATE ON public.pantry_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planned_meals_updated_at 
    BEFORE UPDATE ON public.planned_meals 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at 
    BEFORE UPDATE ON public.shopping_lists 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_list_items_updated_at 
    BEFORE UPDATE ON public.shopping_list_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scanned_receipts_updated_at 
    BEFORE UPDATE ON public.scanned_receipts 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();
    
    INSERT INTO public.user_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default recipe categories
INSERT INTO public.recipe_categories (name, description, icon) VALUES
    ('Desayuno', 'Comidas para empezar el día', '🌅'),
    ('Almuerzo', 'Comidas principales del mediodía', '🍽️'),
    ('Cena', 'Comidas para la noche', '🌙'),
    ('Snacks', 'Bocadillos y meriendas', '🍎'),
    ('Postres', 'Dulces y postres', '🍰'),
    ('Bebidas', 'Bebidas y jugos', '🥤'),
    ('Sopas', 'Sopas y caldos', '🍲'),
    ('Ensaladas', 'Ensaladas y platos fríos', '🥗'),
    ('Carnes', 'Platos con carne', '🥩'),
    ('Vegetarianos', 'Platos sin carne', '🥕'),
    ('Veganos', 'Platos sin productos animales', '🌱'),
    ('Sin Gluten', 'Platos aptos para celíacos', '🌾')
ON CONFLICT DO NOTHING;

-- Insert common ingredients
INSERT INTO public.ingredients (name, category, default_unit, common_names) VALUES
    ('Arroz', 'Granos', 'kg', ARRAY['arroz blanco', 'arroz integral']),
    ('Pollo', 'Carnes', 'kg', ARRAY['pollo entero', 'pechuga de pollo', 'muslos de pollo']),
    ('Cebolla', 'Verduras', 'kg', ARRAY['cebolla blanca', 'cebolla morada']),
    ('Tomate', 'Verduras', 'kg', ARRAY['tomate rojo', 'tomate cherry']),
    ('Ajo', 'Verduras', 'cabezas', ARRAY['ajo fresco', 'dientes de ajo']),
    ('Aceite', 'Condimentos', 'litros', ARRAY['aceite de oliva', 'aceite vegetal']),
    ('Sal', 'Condimentos', 'kg', ARRAY['sal fina', 'sal gruesa']),
    ('Azúcar', 'Endulzantes', 'kg', ARRAY['azúcar blanca', 'azúcar morena']),
    ('Leche', 'Lácteos', 'litros', ARRAY['leche entera', 'leche descremada']),
    ('Huevos', 'Proteínas', 'unidades', ARRAY['huevos de gallina', 'huevos orgánicos']),
    ('Pan', 'Panadería', 'unidades', ARRAY['pan de molde', 'pan integral']),
    ('Pasta', 'Granos', 'kg', ARRAY['fideos', 'macarrones', 'spaghetti']),
    ('Queso', 'Lácteos', 'kg', ARRAY['queso fresco', 'queso rallado']),
    ('Carne molida', 'Carnes', 'kg', ARRAY['carne picada', 'carne molida de res']),
    ('Frijoles', 'Legumbres', 'kg', ARRAY['frijoles negros', 'frijoles rojos'])
ON CONFLICT DO NOTHING;