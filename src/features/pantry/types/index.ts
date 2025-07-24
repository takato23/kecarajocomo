// Core Pantry Types
export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  expiration_date?: Date;
  location?: string;
  category?: string;
  purchase_date?: Date;
  cost?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  default_unit: string;
  common_units: string[];
  average_shelf_life_days?: number;
  storage_instructions?: string;
  nutrition_per_100g?: NutritionInfo;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
}

// Pantry Management Types
export interface PantryStats {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  categories: Record<string, number>;
  totalValue?: number;
  wasteReduction?: number;
}

export interface ExpirationAlert {
  id: string;
  pantry_item_id: string;
  item_name: string;
  expiration_date: Date;
  days_until_expiration: number;
  alert_type: 'warning' | 'urgent' | 'expired';
  dismissed: boolean;
  created_at: Date;
}

export interface PantryLocation {
  id: string;
  name: string;
  description?: string;
  temperature_zone: 'freezer' | 'refrigerator' | 'pantry' | 'counter';
  user_id: string;
}

// Shopping Integration Types
export interface ShoppingListItem {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimated_cost?: number;
  checked: boolean;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  items: ShoppingListItem[];
  created_from_meal_plans?: string[];
  store_preference?: string;
  estimated_total?: number;
  created_at: Date;
  updated_at: Date;
}

// Recipe Integration Types
export interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  preparation?: string;
  optional: boolean;
  substitutes?: string[];
}

export interface PantryAvailability {
  ingredient_id: string;
  ingredient_name: string;
  required_quantity: number;
  required_unit: string;
  available_quantity: number;
  available_unit: string;
  sufficient: boolean;
  conversion_ratio?: number;
}

// Pantry Analysis Types
export interface PantryAnalysis {
  waste_analysis: {
    expired_items_last_month: number;
    waste_value: number;
    most_wasted_categories: string[];
  };
  usage_patterns: {
    most_used_ingredients: string[];
    seasonal_trends: Record<string, number>;
    shopping_frequency: number;
  };
  optimization_suggestions: {
    bulk_buy_recommendations: string[];
    storage_improvements: string[];
    recipe_suggestions: string[];
  };
}

// Search and Filter Types
export interface PantryFilter {
  category?: string;
  location?: string;
  expiring_within_days?: number;
  search_term?: string;
  sort_by?: 'name' | 'expiration_date' | 'quantity' | 'category';
  sort_order?: 'asc' | 'desc';
}

export interface PantrySearch {
  query: string;
  filters: PantryFilter;
  page: number;
  limit: number;
}

// Batch Operations Types
export interface BatchPantryOperation {
  operation: 'add' | 'update' | 'delete' | 'move';
  items: Partial<PantryItem>[];
  location?: string;
  expiration_date?: Date;
}

export interface BatchOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    item_id: string;
    error: string;
  }>;
}

// Event Types for State Management
export interface PantryEvent {
  type: 'add' | 'update' | 'delete' | 'expire' | 'consume';
  item_id: string;
  item?: PantryItem;
  previous_item?: PantryItem;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// API Response Types
export interface PantryAPIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PantryError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Form Types
export interface AddPantryItemForm {
  ingredient_name: string;
  quantity: number;
  unit: string;
  expiration_date?: string;
  location?: string;
  category?: string;
  cost?: number;
  notes?: string;
}

export interface UpdatePantryItemForm extends Partial<AddPantryItemForm> {
  id: string;
}

// Unit Conversion Types
export interface UnitConversion {
  from_unit: string;
  to_unit: string;
  conversion_factor: number;
  ingredient_specific: boolean;
}

export interface ConversionResult {
  original_quantity: number;
  original_unit: string;
  converted_quantity: number;
  converted_unit: string;
  conversion_factor: number;
}

// All types are already exported with their interface/type declarations