/**
 * Tipos de datos para el Planificador de Comidas
 * Siguiendo el design system y patrones del proyecto
 */

// =============================================
// TIPOS BASE DEL DOMINIO
// =============================================

export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=domingo, 6=sábado
export type CookingTimePreference = 'rapido' | 'medio' | 'elaborado';

export interface SlotPosition {
  row: number;    // 0-3 (desayuno-cena)
  col: number;    // 0-6 (domingo-sábado)
}

export interface MealSlot {
  id: string;
  weekId: string;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  recipeId?: string;
  servings: number;
  notes?: string;
  position: SlotPosition;
  isLocked?: boolean;        // Slot bloqueado por el usuario
  createdAt: Date;
  updatedAt: Date;
}

export interface WeekPlan {
  id: string;
  userId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  slots: MealSlot[];
  isActive: boolean;
  name?: string;
  metadata: WeekMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeekMetadata {
  totalRecipes: number;
  totalServings: number;
  avgPrepTime: number;
  avgCookTime: number;
  dietaryLabels: string[];
  estimatedCost?: number;
  nutritionSummary?: NutritionSummary;
}

export interface NutritionSummary {
  totalCalories: number;
  avgCaloriesPerMeal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}

// =============================================
// CONFIGURACIÓN DE AI PLANNING
// =============================================

export interface AIPlanningConfig {
  // Targets
  targetDays: DayOfWeek[];           // Días a planificar
  mealTypes: MealType[];             // Tipos de comida a incluir
  
  // Restricciones dietéticas
  dietaryRestrictions: string[];     // ['vegetariano', 'sin_gluten', etc.]
  allergies: string[];               // ['lactosa', 'frutos_secos', etc.]
  
  // Preferencias
  preferredProteins: string[];       // ['pollo', 'pescado', 'legumbres']
  cookingTime: CookingTimePreference;
  servings: number;
  
  // Comportamiento
  useProfilePreferences: boolean;
  excludeRecipes?: string[];         // IDs de recetas a evitar
  favoriteRecipes?: string[];        // IDs de recetas favoritas
  
  // Variedad
  allowRepeats: boolean;             // Permitir repetir recetas en la semana
  maxRepeatsPerWeek: number;         // Máximo de repeticiones
  
  // Nutrición (opcional)
  targetCalories?: number;
  macroTargets?: {
    protein?: number;    // % de calorías
    carbs?: number;      // % de calorías
    fat?: number;        // % de calorías
  };
}

export interface AIPlanningRequest {
  config: AIPlanningConfig;
  existingSlots?: MealSlot[];        // Slots ya ocupados a respetar
  userContext?: UserPlanningContext;
}

export interface UserPlanningContext {
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  availableTime: 'low' | 'medium' | 'high';
  budgetConstraint: 'low' | 'medium' | 'high';
  householdSize: number;
  kitchenEquipment: string[];        // ['horno', 'microondas', 'batidora', etc.]
}

// =============================================
// DRAG & DROP SYSTEM
// =============================================

export interface DragState {
  isDragging: boolean;
  draggedSlot?: MealSlot;
  draggedRecipe?: RecipeInfo;        // Para arrastrar desde biblioteca
  dropTarget?: SlotPosition;
  isValidDrop: boolean;
  dragOffset: { x: number; y: number };
  dragStartTime: number;
}

export interface DropValidation {
  isValid: boolean;
  reason?: DropReason;
  suggestion?: string;
  canOverride?: boolean;              // Usuario puede forzar el drop
}

export type DropReason = 
  | 'same-position' 
  | 'invalid-meal-time' 
  | 'slot-occupied' 
  | 'locked-slot'
  | 'dietary-restriction'
  | 'serving-mismatch';

export interface DragHandlers {
  onDragStart: (slot: MealSlot, event: React.DragEvent) => void;
  onDragEnd: (event: React.DragEvent) => void;
  onDragOver: (position: SlotPosition, event: React.DragEvent) => void;
  onDrop: (position: SlotPosition, event: React.DragEvent) => Promise<void>;
}

// =============================================
// UI STATE & INTERACTIONS
// =============================================

export interface PlannerUIState {
  currentWeek: Date;
  selectedSlots: string[];           // IDs de slots seleccionados
  viewMode: ViewMode;
  isLoading: boolean;
  isDirty: boolean;                  // Hay cambios sin guardar
  
  // Modals
  aiModalOpen: boolean;
  recipeModalOpen: boolean;
  settingsModalOpen: boolean;
  
  // Filters
  activeFilters: PlannerFilters;
  
  // Drag state
  dragState: DragState;
}

export type ViewMode = 'grid' | 'list' | 'calendar';

export interface PlannerFilters {
  mealTypes: MealType[];
  showEmpty: boolean;
  showLocked: boolean;
  dietaryLabels: string[];
}

// =============================================
// RECIPE INTEGRATION
// =============================================

export interface RecipeInfo {
  id: string;
  name: string;
  description?: string;
  image?: string;
  prepTime: number;        // minutos
  cookTime: number;        // minutos
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rating?: number;
  
  // Categorización
  mealTypes: MealType[];   // Para qué comidas es apropiada
  tags: string[];
  cuisine?: string;
  
  // Nutrición
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  
  // Restricciones
  dietaryLabels: string[];
  allergens: string[];
  
  // Metadata
  isAiGenerated: boolean;
  isFavorite: boolean;
  lastUsed?: Date;
  usageCount: number;
}

// =============================================
// RESPONSIVENESS & LAYOUT
// =============================================

export interface ResponsiveLayout {
  columns: number;
  rows: number;
  orientation: 'horizontal' | 'vertical';
  slotSize: {
    width: number;
    height: number;
  };
  gaps: {
    horizontal: number;
    vertical: number;
  };
}

export interface BreakpointConfig {
  mobile: ResponsiveLayout;
  tablet: ResponsiveLayout;
  desktop: ResponsiveLayout;
}

// =============================================
// ANIMATIONS & EFFECTS
// =============================================

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface LiquidAnimations {
  slotHover: AnimationConfig;
  slotPress: AnimationConfig;
  dragStart: AnimationConfig;
  dragDrop: AnimationConfig;
  modalEnter: AnimationConfig;
  modalExit: AnimationConfig;
  shimmer: AnimationConfig;
}

// =============================================
// ERROR HANDLING
// =============================================

export class PlannerError extends Error {
  constructor(
    message: string,
    public code: PlannerErrorCode,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'PlannerError';
  }
}

export type PlannerErrorCode = 
  | 'INVALID_SLOT_POSITION'
  | 'SLOT_ALREADY_OCCUPIED'
  | 'INVALID_MEAL_TIME'
  | 'DIETARY_RESTRICTION_VIOLATION'
  | 'AI_GENERATION_FAILED'
  | 'PERSISTENCE_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR';

// =============================================
// HOOK RETURN TYPES
// =============================================

export interface UseMealPlannerReturn {
  // Estado
  currentWeek: Date;
  weekPlan: WeekPlan | null;
  slots: MealSlot[];
  uiState: PlannerUIState;
  isLoading: boolean;
  error: PlannerError | null;
  
  // Navegación
  navigateWeek: (direction: 'prev' | 'next' | Date) => void;
  goToCurrentWeek: () => void;
  
  // Slot operations
  updateSlot: (slotId: string, updates: Partial<MealSlot>) => Promise<void>;
  clearSlot: (slotId: string) => Promise<void>;
  lockSlot: (slotId: string, locked: boolean) => Promise<void>;
  
  // Bulk operations
  clearWeek: () => Promise<void>;
  copyWeek: (sourceWeek: Date, targetWeek: Date) => Promise<void>;
  
  // AI integration
  generateAIPlan: (config: AIPlanningConfig) => Promise<void>;
  
  // Drag & drop
  dragHandlers: DragHandlers;
  
  // UI actions
  selectSlot: (slotId: string, multi?: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  openModal: (modal: 'ai' | 'recipe' | 'settings') => void;
  closeModal: () => void;
}

export interface UseAIPlanningReturn {
  isGenerating: boolean;
  config: AIPlanningConfig | null;
  lastGenerated: Date | null;
  error: PlannerError | null;
  
  generatePlan: (config: AIPlanningConfig) => Promise<MealSlot[]>;
  setConfig: (config: AIPlanningConfig) => void;
  clearConfig: () => void;
}

export interface UseDragAndDropReturn {
  dragState: DragState;
  dragHandlers: DragHandlers;
  dropValidation: DropValidation | null;
  
  startDrag: (slot: MealSlot, offset: { x: number; y: number }) => void;
  endDrag: () => void;
  validateDrop: (source: SlotPosition, target: SlotPosition) => DropValidation;
}

// =============================================
// CONSTANTS
// =============================================

export const MEAL_TYPE_ORDER: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

export const MEAL_TYPE_COLORS = {
  desayuno: 'food-golden',
  almuerzo: 'food-warm', 
  merienda: 'food-fresh',
  cena: 'food-rich'
} as const;

export const MEAL_TYPE_ICONS = {
  desayuno: '☀️',
  almuerzo: '🌅', 
  merienda: '🌆',
  cena: '🌙'
} as const;

export const COOKING_TIME_RANGES = {
  rapido: { min: 0, max: 30 },      // 0-30 minutos
  medio: { min: 30, max: 60 },      // 30-60 minutos
  elaborado: { min: 60, max: 180 }  // 1-3 horas
} as const;

export const DEFAULT_SERVINGS = 4;
export const MAX_SLOTS_PER_WEEK = 28; // 7 días × 4 comidas
export const MIN_WEEK_SELECTION = 1;  // Mínimo 1 día para planificar