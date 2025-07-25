// =============================================
// PLANNING V2 TYPE DEFINITIONS
// =============================================

export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
export type DietaryPreference = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'glutenFree' | 'dairyFree';
export type DietProfile = 'balanced' | 'protein-rich' | 'low-carb' | 'mediterranean' | 'low-fat';
export type BudgetLevel = 'low' | 'medium' | 'high';

// =============================================
// CORE DOMAIN TYPES
// =============================================

export interface PlannedMealV2 {
  id: string;
  userId: string;
  planDate: string; // YYYY-MM-DD format
  mealType: MealType;
  recipeId?: string;
  customMealName?: string;
  recipe?: RecipeV2;
  notes?: string;
  servings: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeV2 {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: IngredientV2[];
  instructions: string[];
  nutrition?: NutritionInfo;
  dietaryLabels: DietaryPreference[];
  cuisine?: string;
  tags: string[];
  rating?: number;
  isAiGenerated?: boolean;
}

export interface IngredientV2 {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
  notes?: string;
  isOptional?: boolean;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
}

export type IngredientCategory = 
  | 'produce'
  | 'meat'
  | 'dairy'
  | 'grains'
  | 'pantry'
  | 'spices'
  | 'frozen'
  | 'beverages'
  | 'other';

// =============================================
// UI & DISPLAY TYPES
// =============================================

export interface DayPlanV2 {
  date: string;
  dayOfWeek: number;
  meals: {
    desayuno?: PlannedMealV2;
    almuerzo?: PlannedMealV2;
    merienda?: PlannedMealV2;
    cena?: PlannedMealV2;
  };
  nutritionSummary?: NutritionInfo;
  isToday: boolean;
}

export interface WeekPlanV2 {
  startDate: string;
  endDate: string;
  days: DayPlanV2[];
  totalMeals: number;
  completedMeals: number;
  nutritionAverage?: NutritionInfo;
}

// =============================================
// AI PLANNING TYPES
// =============================================

export interface AIPlannerConfig {
  userId: string;
  startDate: string;
  numberOfDays: number;
  mealsPerDay: MealType[];
  dietaryPreferences: DietaryPreference[];
  dietProfile: DietProfile;
  cuisine?: string[];
  budget: BudgetLevel;
  excludedIngredients?: string[];
  preferredIngredients?: string[];
  maxPrepTime?: number;
  servingsPerMeal: number;
  preferVariety: boolean;
  useSeasonalIngredients: boolean;
  considerPantryItems: boolean;
}

export interface AIGeneratedMealPlan {
  id: string;
  config: AIPlannerConfig;
  meals: PlannedMealV2[];
  shoppingList: ShoppingListV2;
  nutritionSummary: {
    daily: NutritionInfo;
    weekly: NutritionInfo;
  };
  estimatedCost?: {
    total: number;
    perMeal: number;
    perServing: number;
  };
  generatedAt: string;
  suggestions: string[];
}

// =============================================
// SHOPPING LIST TYPES
// =============================================

export interface ShoppingListV2 {
  id: string;
  userId: string;
  weekStartDate: string;
  items: ShoppingListItem[];
  categories: ShoppingListCategory[];
  estimatedTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  ingredientName: string;
  totalAmount: number;
  unit: string;
  category: IngredientCategory;
  recipes: string[]; // Recipe names that use this ingredient
  isPurchased: boolean;
  estimatedPrice?: number;
  notes?: string;
  packageSize?: {
    amount: number;
    unit: string;
    quantity: number;
  };
}

export interface ShoppingListCategory {
  name: IngredientCategory;
  items: ShoppingListItem[];
  subtotal?: number;
}

// =============================================
// STORE TYPES
// =============================================

export interface PlanningV2Store {
  // State
  plannedMeals: PlannedMealV2[];
  currentDate: Date;
  selectedWeek: WeekPlanV2 | null;
  isLoading: boolean;
  error: string | null;
  
  // UI State
  activeModal: 'add' | 'edit' | 'ai-planner' | 'shopping-list' | null;
  selectedMeal: PlannedMealV2 | null;
  draggedMeal: PlannedMealV2 | null;
  
  // Actions - CRUD
  fetchWeekMeals: (startDate: string, endDate: string) => Promise<void>;
  addMeal: (meal: Omit<PlannedMealV2, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMeal: (id: string, updates: Partial<PlannedMealV2>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  
  // Actions - Batch Operations
  addMultipleMeals: (meals: Omit<PlannedMealV2, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  clearWeek: (startDate: string, endDate: string) => Promise<void>;
  copyWeek: (sourceStartDate: string, targetStartDate: string) => Promise<void>;
  
  // Actions - UI
  setCurrentDate: (date: Date) => void;
  setActiveModal: (modal: PlanningV2Store['activeModal']) => void;
  setSelectedMeal: (meal: PlannedMealV2 | null) => void;
  setDraggedMeal: (meal: PlannedMealV2 | null) => void;
  
  // Actions - AI Planning
  generateAIPlan: (config: AIPlannerConfig) => Promise<AIGeneratedMealPlan>;
  applyAIPlan: (plan: AIGeneratedMealPlan) => Promise<void>;
  
  // Selectors
  getMealsByDate: (date: string) => PlannedMealV2[];
  getMealBySlot: (date: string, mealType: MealType) => PlannedMealV2 | undefined;
  getWeekSummary: () => WeekPlanV2 | null;
  getShoppingList: (startDate: string, endDate: string) => Promise<ShoppingListV2>;
}

// =============================================
// SERVICE RESPONSE TYPES
// =============================================

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================
// UI COMPONENT PROPS
// =============================================

export interface MealSlotProps {
  date: string;
  mealType: MealType;
  meal?: PlannedMealV2;
  isToday?: boolean;
  isSelected?: boolean;
  isDragOver?: boolean;
  onEdit?: (meal: PlannedMealV2) => void;
  onDelete?: (meal: PlannedMealV2) => void;
  onDrop?: (meal: PlannedMealV2) => void;
  onAddNew?: () => void;
}

export interface DayColumnProps {
  dayPlan: DayPlanV2;
  onMealAction: (action: 'add' | 'edit' | 'delete', meal?: PlannedMealV2) => void;
}

export interface WeekNavigatorProps {
  currentWeek: Date;
  onWeekChange: (direction: 'prev' | 'next' | 'today') => void;
  summary: WeekPlanV2 | null;
}