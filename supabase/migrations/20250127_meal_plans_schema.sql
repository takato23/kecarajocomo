-- Crear tabla para planes de alimentación
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}', -- Almacena preferencias específicas del plan
  nutritional_goals JSONB DEFAULT '{}', -- Objetivos nutricionales del plan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para los items del plan (cada comida)
CREATE TABLE IF NOT EXISTS meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  servings INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  custom_recipe JSONB DEFAULT NULL, -- Para recetas generadas por IA no guardadas aún
  nutritional_info JSONB DEFAULT '{}', -- Información nutricional calculada
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meal_plan_id, date, meal_type)
);

-- Crear tabla para recetas generadas por IA
CREATE TABLE IF NOT EXISTS ai_generated_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_data JSONB NOT NULL, -- Datos completos de la receta
  name VARCHAR(255) NOT NULL,
  description TEXT,
  meal_type VARCHAR(50),
  dietary_tags TEXT[] DEFAULT '{}',
  cuisine VARCHAR(100),
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER DEFAULT 4,
  difficulty VARCHAR(50),
  nutritional_info JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false, -- Si la receta es visible para otros usuarios
  usage_count INTEGER DEFAULT 0, -- Cuántas veces se ha usado esta receta
  rating DECIMAL(3,2) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para el historial de planes
CREATE TABLE IF NOT EXISTS meal_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'completed', 'deleted'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_dates ON meal_plans(start_date, end_date);
CREATE INDEX idx_meal_plans_active ON meal_plans(is_active);
CREATE INDEX idx_meal_plan_items_plan_id ON meal_plan_items(meal_plan_id);
CREATE INDEX idx_meal_plan_items_recipe_id ON meal_plan_items(recipe_id);
CREATE INDEX idx_meal_plan_items_date ON meal_plan_items(date);
CREATE INDEX idx_ai_generated_recipes_user_id ON ai_generated_recipes(user_id);
CREATE INDEX idx_ai_generated_recipes_public ON ai_generated_recipes(is_public);
CREATE INDEX idx_ai_generated_recipes_tags ON ai_generated_recipes USING GIN (dietary_tags);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plan_items_updated_at BEFORE UPDATE ON meal_plan_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_generated_recipes_updated_at BEFORE UPDATE ON ai_generated_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_history ENABLE ROW LEVEL SECURITY;

-- Políticas para meal_plans
CREATE POLICY "Users can view their own meal plans" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans" ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans" ON meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para meal_plan_items
CREATE POLICY "Users can view their own meal plan items" ON meal_plan_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meal_plans 
      WHERE meal_plans.id = meal_plan_items.meal_plan_id 
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create items in their own meal plans" ON meal_plan_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans 
      WHERE meal_plans.id = meal_plan_items.meal_plan_id 
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their own meal plans" ON meal_plan_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM meal_plans 
      WHERE meal_plans.id = meal_plan_items.meal_plan_id 
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their own meal plans" ON meal_plan_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM meal_plans 
      WHERE meal_plans.id = meal_plan_items.meal_plan_id 
      AND meal_plans.user_id = auth.uid()
    )
  );

-- Políticas para ai_generated_recipes
CREATE POLICY "Users can view their own AI recipes" ON ai_generated_recipes
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own AI recipes" ON ai_generated_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI recipes" ON ai_generated_recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI recipes" ON ai_generated_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para meal_plan_history
CREATE POLICY "Users can view their own meal plan history" ON meal_plan_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plan history" ON meal_plan_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Función para obtener el plan activo del usuario
CREATE OR REPLACE FUNCTION get_active_meal_plan(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  start_date DATE,
  end_date DATE,
  preferences JSONB,
  nutritional_goals JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT mp.id, mp.name, mp.start_date, mp.end_date, mp.preferences, mp.nutritional_goals
  FROM meal_plans mp
  WHERE mp.user_id = p_user_id AND mp.is_active = true
  ORDER BY mp.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular estadísticas nutricionales del plan
CREATE OR REPLACE FUNCTION calculate_meal_plan_stats(p_meal_plan_id UUID)
RETURNS TABLE (
  date DATE,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  total_fiber NUMERIC,
  meal_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mpi.date,
    SUM((mpi.nutritional_info->>'calories')::NUMERIC) as total_calories,
    SUM((mpi.nutritional_info->>'protein')::NUMERIC) as total_protein,
    SUM((mpi.nutritional_info->>'carbs')::NUMERIC) as total_carbs,
    SUM((mpi.nutritional_info->>'fat')::NUMERIC) as total_fat,
    SUM((mpi.nutritional_info->>'fiber')::NUMERIC) as total_fiber,
    COUNT(*) as meal_count
  FROM meal_plan_items mpi
  WHERE mpi.meal_plan_id = p_meal_plan_id
  GROUP BY mpi.date
  ORDER BY mpi.date;
END;
$$ LANGUAGE plpgsql;