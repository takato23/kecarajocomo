-- KeCarajoComer Complete Database Schema
-- Agrega tablas faltantes para presupuesto y precios

-- Tabla para tracking de presupuestos semanales
CREATE TABLE IF NOT EXISTS weekly_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  planned_budget_ars DECIMAL(10,2) NOT NULL,
  actual_spent_ars DECIMAL(10,2) DEFAULT 0,
  estimated_total_ars DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, week_start_date)
);

-- Tabla para histórico de precios (integración buscaprecios)
CREATE TABLE IF NOT EXISTS ingredient_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL, -- Para ingredientes custom sin ID
  price_per_unit DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  store_name TEXT,
  store_location TEXT,
  source TEXT DEFAULT 'buscaprecios', -- buscaprecios, manual, ocr
  source_data JSONB, -- metadata del API
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'), -- cache 7 días
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX(ingredient_name, expires_at),
  INDEX(ingredient_id, expires_at)
);

-- Tabla para packs de onboarding de despensa
CREATE TABLE IF NOT EXISTS pantry_starter_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'basico', 'vegetariano', 'fitness', 'familia'
  target_audience TEXT[], -- ['estudiante', 'familia', 'fitness']
  estimated_cost_ars DECIMAL(10,2),
  ingredients JSONB NOT NULL, -- [{"name": "arroz", "quantity": 1, "unit": "kg", "priority": 1}]
  popularity_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para meal plans completos (semanas enteras generadas por AI)
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  generation_prompt TEXT, -- prompt usado para generar con Gemini
  ai_response JSONB, -- respuesta completa de Gemini
  total_estimated_cost_ars DECIMAL(10,2),
  total_kcal INTEGER,
  total_protein_g DECIMAL(8,2),
  dietary_tags TEXT[], -- ['alto_proteina', 'bajo_costo', 'rapido']
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, week_start_date)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_expiration ON pantry_items(user_id, expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_running_low ON pantry_items(user_id, is_running_low) WHERE is_running_low = TRUE;
CREATE INDEX IF NOT EXISTS idx_planned_meals_user_date ON planned_meals(user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_purchased ON shopping_list_items(shopping_list_id, is_purchased);
CREATE INDEX IF NOT EXISTS idx_recipes_public_rating ON recipes(is_public, rating) WHERE is_public = TRUE;

-- RLS (Row Level Security) policies
ALTER TABLE weekly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_starter_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can manage their own budgets" ON weekly_budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read all price data" ON ingredient_prices
  FOR SELECT USING (TRUE);

CREATE POLICY "Only service role can manage prices" ON ingredient_prices
  FOR INSERT WITH CHECK (FALSE); -- Solo por API/service role

CREATE POLICY "Everyone can read starter packs" ON pantry_starter_packs
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can manage their meal plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weekly_budgets_updated_at BEFORE UPDATE ON weekly_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pantry_starter_packs_updated_at BEFORE UPDATE ON pantry_starter_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales: Starter packs
INSERT INTO pantry_starter_packs (name, description, category, target_audience, estimated_cost_ars, ingredients) VALUES
(
  'Pack Básico Argentino',
  'Esenciales para cocinar todos los días. Perfecto para empezar.',
  'basico',
  ARRAY['estudiante', 'solo', 'principiante'],
  15000,
  '[
    {"name": "arroz", "quantity": 1, "unit": "kg", "priority": 1},
    {"name": "fideos", "quantity": 500, "unit": "g", "priority": 1},
    {"name": "aceite", "quantity": 1, "unit": "l", "priority": 1},
    {"name": "sal", "quantity": 1, "unit": "kg", "priority": 1},
    {"name": "cebolla", "quantity": 2, "unit": "kg", "priority": 2},
    {"name": "ajo", "quantity": 1, "unit": "cabeza", "priority": 2},
    {"name": "tomate triturado", "quantity": 4, "unit": "lata", "priority": 2},
    {"name": "huevos", "quantity": 12, "unit": "unidad", "priority": 3}
  ]'::jsonb
),
(
  'Pack Fitness Alto Proteína',
  'Para quien entrena y necesita proteína. Pollo, huevos y legumbres.',
  'fitness',
  ARRAY['fitness', 'deportista', 'musculacion'],
  25000,
  '[
    {"name": "pechuga de pollo", "quantity": 2, "unit": "kg", "priority": 1},
    {"name": "huevos", "quantity": 30, "unit": "unidad", "priority": 1},
    {"name": "atún al agua", "quantity": 6, "unit": "lata", "priority": 1},
    {"name": "lentejas", "quantity": 500, "unit": "g", "priority": 2},
    {"name": "avena", "quantity": 1, "unit": "kg", "priority": 2},
    {"name": "arroz integral", "quantity": 1, "unit": "kg", "priority": 3},
    {"name": "banana", "quantity": 1, "unit": "kg", "priority": 3}
  ]'::jsonb
),
(
  'Pack Familia Numerosa',
  'Para 4+ personas. Rendidor y económico.',
  'familia',
  ARRAY['familia', 'numerosa', 'economico'],
  35000,
  '[
    {"name": "arroz", "quantity": 5, "unit": "kg", "priority": 1},
    {"name": "fideos", "quantity": 2, "unit": "kg", "priority": 1},
    {"name": "aceite", "quantity": 2, "unit": "l", "priority": 1},
    {"name": "harina", "quantity": 2, "unit": "kg", "priority": 2},
    {"name": "polenta", "quantity": 1, "unit": "kg", "priority": 2},
    {"name": "cebolla", "quantity": 5, "unit": "kg", "priority": 2},
    {"name": "papa", "quantity": 5, "unit": "kg", "priority": 3},
    {"name": "carne picada", "quantity": 2, "unit": "kg", "priority": 3}
  ]'::jsonb
);

-- Comentarios para documentación
COMMENT ON TABLE weekly_budgets IS 'Presupuestos semanales planificados vs gastado real';
COMMENT ON TABLE ingredient_prices IS 'Histórico de precios con caché de 7 días para buscaprecios API';
COMMENT ON TABLE pantry_starter_packs IS 'Packs preconfigurados para onboarding rápido de despensa';
COMMENT ON TABLE meal_plans IS 'Planes semanales completos generados por AI (Gemini)';