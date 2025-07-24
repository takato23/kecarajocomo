// Core pantry types for kecarajocomer despensa feature

export interface Ingredient {
  id: string;
  name: string;
  normalized_name: string; // For matching similar items (pollo, pechuga de pollo → pollo)
  category: IngredientCategory;
  common_names: string[]; // Alternative names for autocomplete
  default_unit?: string;
  icon?: string;
  created_at: Date;
  updated_at: Date;
}

export type IngredientCategory = 
  | 'verduras'
  | 'frutas' 
  | 'carnes'
  | 'lacteos'
  | 'granos'
  | 'condimentos'
  | 'bebidas'
  | 'enlatados'
  | 'congelados'
  | 'panaderia'
  | 'snacks'
  | 'otros';

export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string;
  ingredient?: Ingredient; // Populated via join
  quantity: number;
  unit: string;
  expiration_date?: Date | string;
  purchase_date?: Date | string;
  location?: string; // 'refrigerador', 'despensa', 'congelador'
  notes?: string;
  photo_url?: string;
  low_stock_threshold?: number;
  min_quantity?: number; // Minimum quantity for restocking suggestions
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ParsedIngredientInput {
  name: string;
  quantity?: number;
  unit?: string;
  preparation?: string;
  category?: string;
  confidence: number;
  // Legacy fields for compatibility
  raw_text?: string;
  extracted_name?: string;
  normalized_name?: string;
  suggestions?: string[]; // Alternative interpretations
}

export interface IngredientSuggestion {
  ingredient: Ingredient;
  score: number; // Relevance score 0-1
  match_type: 'exact' | 'partial' | 'category' | 'phonetic';
}

export interface PantryStats {
  total_items: number;
  categories: Record<IngredientCategory, number>;
  expiring_soon: number; // Items expiring in next 7 days
  expired: number;
  low_stock: number;
  items_by_location: Record<string, number>;
}

export interface VoiceParseResult {
  transcript: string;
  parsed_items: ParsedIngredientInput[];
  confidence: number;
  processing_time: number;
}

// Parser configuration
export interface IngredientParserConfig {
  language: 'es' | 'en';
  auto_categorize: boolean;
  fuzzy_matching: boolean;
  phonetic_matching: boolean;
  confidence_threshold: number;
}

// UI State types
export interface PantryUIState {
  view_mode: 'grid' | 'list';
  sort_by: 'name' | 'category' | 'expiration' | 'quantity' | 'created_at';
  sort_order: 'asc' | 'desc';
  filter_category?: IngredientCategory;
  filter_location?: string;
  search_query: string;
  show_expired: boolean;
  show_low_stock: boolean;
}

export interface PantryFormData {
  ingredient_name: string;
  quantity: number;
  unit: string;
  expiration_date?: Date;
  location?: string;
  notes?: string;
  photo?: File;
}

// Real-time sync types
export interface PantryRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'pantry_items' | 'ingredients';
  record: PantryItem | Ingredient;
  old_record?: PantryItem | Ingredient;
  timestamp: Date;
}

// Categories with metadata
export const INGREDIENT_CATEGORIES: Record<IngredientCategory, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  verduras: {
    label: 'Verduras',
    icon: '🥬',
    color: 'green',
    description: 'Vegetales frescos y verduras de hoja'
  },
  frutas: {
    label: 'Frutas',
    icon: '🍎',
    color: 'red',
    description: 'Frutas frescas y secas'
  },
  carnes: {
    label: 'Carnes',
    icon: '🥩',
    color: 'red',
    description: 'Carnes rojas, pollo, pescados y mariscos'
  },
  lacteos: {
    label: 'Lácteos',
    icon: '🥛',
    color: 'blue',
    description: 'Leche, quesos, yogures y derivados'
  },
  granos: {
    label: 'Granos y Cereales',
    icon: '🌾',
    color: 'yellow',
    description: 'Arroz, pasta, quinoa, avena y legumbres'
  },
  condimentos: {
    label: 'Condimentos',
    icon: '🧂',
    color: 'gray',
    description: 'Especias, salsas, aceites y vinagres'
  },
  bebidas: {
    label: 'Bebidas',
    icon: '🧃',
    color: 'blue',
    description: 'Jugos, refrescos, aguas y bebidas alcohólicas'
  },
  enlatados: {
    label: 'Enlatados',
    icon: '🥫',
    color: 'gray',
    description: 'Conservas, enlatados y productos en lata'
  },
  congelados: {
    label: 'Congelados',
    icon: '🧊',
    color: 'cyan',
    description: 'Productos congelados y helados'
  },
  panaderia: {
    label: 'Panadería',
    icon: '🍞',
    color: 'orange',
    description: 'Pan, pasteles, galletas y productos horneados'
  },
  snacks: {
    label: 'Snacks',
    icon: '🍿',
    color: 'purple',
    description: 'Botanas, dulces y aperitivos'
  },
  otros: {
    label: 'Otros',
    icon: '📦',
    color: 'gray',
    description: 'Productos que no encajan en otras categorías'
  }
};

// Common units with conversions
export const COMMON_UNITS = {
  weight: [
    { value: 'g', label: 'gramos', factor: 1 },
    { value: 'kg', label: 'kilogramos', factor: 1000 },
    { value: 'lb', label: 'libras', factor: 453.592 },
    { value: 'oz', label: 'onzas', factor: 28.3495 }
  ],
  volume: [
    { value: 'ml', label: 'mililitros', factor: 1 },
    { value: 'l', label: 'litros', factor: 1000 },
    { value: 'cup', label: 'tazas', factor: 236.588 },
    { value: 'tbsp', label: 'cucharadas', factor: 14.7868 },
    { value: 'tsp', label: 'cucharaditas', factor: 4.92892 }
  ],
  count: [
    { value: 'pcs', label: 'piezas', factor: 1 },
    { value: 'pack', label: 'paquetes', factor: 1 },
    { value: 'bunch', label: 'manojos', factor: 1 }
  ]
};

export type UnitType = keyof typeof COMMON_UNITS;