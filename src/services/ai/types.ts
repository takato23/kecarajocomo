/**
 * AI Service Types and Interfaces
 * Unified types for all AI-related functionality
 */

// Provider types
export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'auto';

// Model types
export type AIModel = 
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'gemini-pro'
  | 'gemini-pro-vision';

// Common AI service configuration
export interface AIServiceConfig {
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Request types
export interface AITextRequest {
  prompt: string;
  systemPrompt?: string;
  context?: string;
  examples?: Array<{ input: string; output: string }>;
  format?: 'text' | 'json' | 'markdown';
  stream?: boolean;
}

export interface AIImageRequest {
  prompt?: string;
  image: string | Buffer | Blob;
  mimeType?: string;
  context?: string;
  analysisType?: 'ocr' | 'description' | 'analysis' | 'custom';
}

export interface AIRecipeRequest {
  ingredients?: string[];
  pantryItems?: PantryItem[];
  preferences?: UserPreferences;
  mealType?: MealType;
  cuisine?: string;
  difficulty?: RecipeDifficulty;
  servings?: number;
  maxTime?: number;
  constraints?: RecipeConstraints;
}

// Response types
export interface AIResponse<T = any> {
  data: T;
  provider: AIProvider;
  model: AIModel;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
  };
}

export interface AITextResponse extends AIResponse<string> {
  format: 'text' | 'json' | 'markdown';
}

export interface AIJSONResponse<T = any> extends AIResponse<T> {
  format: 'json';
  schema?: any;
}

export interface AIStreamResponse {
  stream: ReadableStream<string>;
  provider: AIProvider;
  model: AIModel;
}

// Recipe-specific types
export interface GeneratedRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  nutrition: NutritionInfo;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: RecipeDifficulty;
  cuisine: string;
  tags: string[];
  imagePrompt?: string;
  aiGenerated: true;
  confidence: number;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  optional?: boolean;
  substitutions?: string[];
}

export interface RecipeInstruction {
  step: number;
  instruction: string;
  duration?: number;
  temperature?: { value: number; unit: 'C' | 'F' };
  tips?: string[];
  warnings?: string[];
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  [key: string]: number;
}

export type RecipeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export interface RecipeConstraints {
  dietary?: Array<'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'keto' | 'paleo'>;
  allergies?: string[];
  equipment?: string[];
  excludeIngredients?: string[];
}

// Pantry and shopping analysis
export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate?: Date;
  location?: string;
}

export interface ShoppingRecommendation {
  item: string;
  quantity: number;
  unit: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedPrice?: number;
  stores?: StorePrice[];
}

export interface StorePrice {
  store: string;
  price: number;
  inStock: boolean;
  lastUpdated: Date;
}

// Receipt parsing
export interface ParsedReceipt {
  items: ReceiptItem[];
  store: string;
  date: Date;
  total: number;
  tax?: number;
  subtotal?: number;
  paymentMethod?: string;
  confidence: number;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category?: string;
  brand?: string;
  barcode?: string;
}

// Meal planning
export interface MealPlanRequest {
  days: number;
  peopleCount: number;
  preferences: UserPreferences;
  pantryItems: PantryItem[];
  budget?: number;
  includeLeftovers?: boolean;
  avoidRepetition?: boolean;
}

export interface GeneratedMealPlan {
  id: string;
  startDate: Date;
  endDate: Date;
  meals: PlannedMeal[];
  shoppingList: ShoppingRecommendation[];
  estimatedCost: number;
  nutritionSummary: NutritionInfo;
  aiGenerated: true;
}

export interface PlannedMeal {
  date: Date;
  mealType: MealType;
  recipe: GeneratedRecipe | { id: string; name: string };
  servings: number;
  notes?: string;
}

// User preferences
export interface UserPreferences {
  dietary?: string[];
  allergies?: string[];
  cuisinePreferences?: string[];
  dislikedIngredients?: string[];
  cookingSkillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  kitchenEquipment?: string[];
  familySize?: number;
  budgetLevel?: 'tight' | 'moderate' | 'flexible';
}

// Error handling
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public provider?: AIProvider,
    public details?: any
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export type AIErrorCode =
  | 'PROVIDER_ERROR'
  | 'RATE_LIMIT'
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNSUPPORTED_OPERATION'
  | 'PARSING_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UNKNOWN';