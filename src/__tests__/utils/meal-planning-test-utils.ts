import { format, addDays, startOfWeek } from 'date-fns';
import type { 
  WeekPlan, 
  MealSlot, 
  Recipe, 
  UserPreferences, 
  MealType,
  ShoppingList,
  Ingredient 
} from '@/features/meal-planning/types';

export const createMockRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: `recipe-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Recipe',
  description: 'A delicious test recipe',
  image: 'https://example.com/recipe.jpg',
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: 'easy',
  ingredients: [
    createMockIngredient({ name: 'Test Ingredient 1', amount: 100, unit: 'g' }),
    createMockIngredient({ name: 'Test Ingredient 2', amount: 200, unit: 'ml' }),
  ],
  instructions: [
    'Step 1: Prepare ingredients',
    'Step 2: Cook according to recipe',
    'Step 3: Serve and enjoy',
  ],
  nutrition: {
    calories: 300,
    protein: 20,
    carbs: 30,
    fat: 10,
  },
  dietaryLabels: ['omnivore'],
  cuisine: 'International',
  tags: ['main-dish', 'easy'],
  rating: 4.5,
  isAiGenerated: false,
  isFavorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockIngredient = (overrides: Partial<Ingredient> = {}): Ingredient => ({
  id: Math.random().toString(36).substr(2, 9),
  name: 'Test Ingredient',
  amount: 100,
  unit: 'g',
  category: 'produce',
  notes: '',
  ...overrides,
});

export const createMockMealSlot = (overrides: Partial<MealSlot> = {}): MealSlot => ({
  id: `slot-${Math.random().toString(36).substr(2, 9)}`,
  dayOfWeek: 1,
  mealType: 'almuerzo' as MealType,
  date: format(new Date(), 'yyyy-MM-dd'),
  servings: 2,
  isLocked: false,
  isCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockWeekPlan = (overrides: Partial<WeekPlan> = {}): WeekPlan => {
  const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(startDate), 6), 'yyyy-MM-dd');
  
  return {
    id: `week-${startDate}`,
    userId: 'test-user-id',
    startDate,
    endDate,
    slots: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};

export const createFullWeekPlan = (userId: string = 'test-user-id'): WeekPlan => {
  const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(startDate), 6), 'yyyy-MM-dd');
  
  const weekPlan = createMockWeekPlan({ userId, startDate, endDate });
  const mealTypes: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];
  
  // Create slots for all 7 days and 4 meal types
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = format(addDays(new Date(startDate), dayOffset), 'yyyy-MM-dd');
    const dayOfWeek = addDays(new Date(startDate), dayOffset).getDay();
    
    mealTypes.forEach(mealType => {
      weekPlan.slots.push(createMockMealSlot({
        id: `${date}-${mealType}`,
        dayOfWeek,
        mealType,
        date,
        servings: 2,
      }));
    });
  }
  
  return weekPlan;
};

export const createMockUserPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  userId: 'test-user-id',
  dietaryPreferences: ['omnivore'],
  dietProfile: 'balanced',
  cuisinePreferences: ['mediterranean', 'international'],
  excludedIngredients: [],
  preferredIngredients: [],
  allergies: [],
  cookingSkill: 'intermediate',
  maxCookingTime: 60,
  mealsPerDay: 3,
  servingsPerMeal: 2,
  budget: 'medium',
  preferVariety: true,
  useSeasonalIngredients: true,
  considerPantryItems: true,
  ...overrides,
});

export const createMockShoppingList = (overrides: Partial<ShoppingList> = {}): ShoppingList => ({
  id: `shopping-${Math.random().toString(36).substr(2, 9)}`,
  userId: 'test-user-id',
  weekPlanId: 'week-test',
  items: [
    {
      id: '1',
      name: 'Tomatoes',
      amount: 500,
      unit: 'g',
      category: 'produce',
      isChecked: false,
      estimatedPrice: 2.50,
    },
    {
      id: '2',
      name: 'Chicken Breast',
      amount: 1,
      unit: 'kg',
      category: 'meat',
      isChecked: false,
      estimatedPrice: 8.99,
    },
    {
      id: '3',
      name: 'Rice',
      amount: 500,
      unit: 'g',
      category: 'grains',
      isChecked: false,
      estimatedPrice: 1.50,
    },
  ],
  categories: [
    { name: 'produce', items: 1, totalPrice: 2.50 },
    { name: 'meat', items: 1, totalPrice: 8.99 },
    { name: 'grains', items: 1, totalPrice: 1.50 },
  ],
  estimatedTotal: 12.99,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Test data generators
export const generateArgentinianRecipes = (): Recipe[] => [
  createMockRecipe({
    id: 'asado-argentino',
    name: 'Asado Argentino',
    description: 'Traditional Argentine barbecue with chimichurri',
    cuisine: 'Argentina',
    prepTime: 30,
    cookTime: 120,
    difficulty: 'medium',
    ingredients: [
      createMockIngredient({ name: 'Beef ribs', amount: 1, unit: 'kg', category: 'meat' }),
      createMockIngredient({ name: 'Chorizo', amount: 4, unit: 'pieces', category: 'meat' }),
      createMockIngredient({ name: 'Parsley', amount: 1, unit: 'bunch', category: 'produce' }),
      createMockIngredient({ name: 'Garlic', amount: 4, unit: 'cloves', category: 'produce' }),
    ],
    tags: ['traditional', 'barbecue', 'meat'],
    rating: 4.8,
  }),
  createMockRecipe({
    id: 'empanadas-saltenas',
    name: 'Empanadas Salteñas',
    description: 'Traditional empanadas from Salta province',
    cuisine: 'Argentina',
    prepTime: 45,
    cookTime: 25,
    difficulty: 'medium',
    ingredients: [
      createMockIngredient({ name: 'Ground beef', amount: 500, unit: 'g', category: 'meat' }),
      createMockIngredient({ name: 'Onions', amount: 2, unit: 'pieces', category: 'produce' }),
      createMockIngredient({ name: 'Empanada dough', amount: 12, unit: 'pieces', category: 'pantry' }),
      createMockIngredient({ name: 'Hard boiled eggs', amount: 3, unit: 'pieces', category: 'dairy' }),
    ],
    tags: ['traditional', 'handheld', 'meat'],
    rating: 4.7,
  }),
  createMockRecipe({
    id: 'milanesa-napolitana',
    name: 'Milanesa Napolitana',
    description: 'Breaded cutlet topped with ham, tomato and cheese',
    cuisine: 'Argentina',
    prepTime: 20,
    cookTime: 20,
    difficulty: 'easy',
    ingredients: [
      createMockIngredient({ name: 'Beef cutlets', amount: 4, unit: 'pieces', category: 'meat' }),
      createMockIngredient({ name: 'Breadcrumbs', amount: 200, unit: 'g', category: 'pantry' }),
      createMockIngredient({ name: 'Ham', amount: 4, unit: 'slices', category: 'meat' }),
      createMockIngredient({ name: 'Mozzarella cheese', amount: 200, unit: 'g', category: 'dairy' }),
    ],
    tags: ['breaded', 'cheese', 'easy'],
    rating: 4.6,
  }),
];

export const generateVegetarianRecipes = (): Recipe[] => [
  createMockRecipe({
    id: 'quinoa-salad',
    name: 'Mediterranean Quinoa Salad',
    description: 'Fresh quinoa salad with vegetables and herbs',
    dietaryLabels: ['vegetarian', 'gluten-free'],
    difficulty: 'easy',
    prepTime: 15,
    cookTime: 15,
    ingredients: [
      createMockIngredient({ name: 'Quinoa', amount: 200, unit: 'g', category: 'grains' }),
      createMockIngredient({ name: 'Cherry tomatoes', amount: 200, unit: 'g', category: 'produce' }),
      createMockIngredient({ name: 'Cucumber', amount: 1, unit: 'piece', category: 'produce' }),
      createMockIngredient({ name: 'Feta cheese', amount: 100, unit: 'g', category: 'dairy' }),
    ],
    tags: ['healthy', 'fresh', 'salad'],
    rating: 4.4,
  }),
  createMockRecipe({
    id: 'vegetable-curry',
    name: 'Coconut Vegetable Curry',
    description: 'Creamy coconut curry with seasonal vegetables',
    dietaryLabels: ['vegetarian', 'vegan'],
    difficulty: 'medium',
    prepTime: 20,
    cookTime: 30,
    ingredients: [
      createMockIngredient({ name: 'Coconut milk', amount: 400, unit: 'ml', category: 'pantry' }),
      createMockIngredient({ name: 'Mixed vegetables', amount: 500, unit: 'g', category: 'produce' }),
      createMockIngredient({ name: 'Curry paste', amount: 2, unit: 'tbsp', category: 'pantry' }),
      createMockIngredient({ name: 'Basmati rice', amount: 200, unit: 'g', category: 'grains' }),
    ],
    tags: ['curry', 'vegetables', 'coconut'],
    rating: 4.5,
  }),
];

// Test utilities
export const addRecipeToSlot = (weekPlan: WeekPlan, slotId: string, recipe: Recipe): WeekPlan => {
  const updatedSlots = weekPlan.slots.map(slot =>
    slot.id === slotId
      ? { ...slot, recipeId: recipe.id, recipe, updatedAt: new Date().toISOString() }
      : slot
  );
  
  return {
    ...weekPlan,
    slots: updatedSlots,
    updatedAt: new Date().toISOString(),
  };
};

export const removeRecipeFromSlot = (weekPlan: WeekPlan, slotId: string): WeekPlan => {
  const updatedSlots = weekPlan.slots.map(slot =>
    slot.id === slotId
      ? { 
          ...slot, 
          recipeId: undefined, 
          recipe: undefined, 
          customMealName: undefined,
          updatedAt: new Date().toISOString() 
        }
      : slot
  );
  
  return {
    ...weekPlan,
    slots: updatedSlots,
    updatedAt: new Date().toISOString(),
  };
};

export const lockSlot = (weekPlan: WeekPlan, slotId: string, isLocked: boolean = true): WeekPlan => {
  const updatedSlots = weekPlan.slots.map(slot =>
    slot.id === slotId
      ? { ...slot, isLocked, updatedAt: new Date().toISOString() }
      : slot
  );
  
  return {
    ...weekPlan,
    slots: updatedSlots,
    updatedAt: new Date().toISOString(),
  };
};

export const markSlotCompleted = (weekPlan: WeekPlan, slotId: string, isCompleted: boolean = true): WeekPlan => {
  const updatedSlots = weekPlan.slots.map(slot =>
    slot.id === slotId
      ? { ...slot, isCompleted, updatedAt: new Date().toISOString() }
      : slot
  );
  
  return {
    ...weekPlan,
    slots: updatedSlots,
    updatedAt: new Date().toISOString(),
  };
};

// Validation utilities
export const validateWeekPlan = (weekPlan: WeekPlan): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!weekPlan.id) errors.push('WeekPlan must have an id');
  if (!weekPlan.userId) errors.push('WeekPlan must have a userId');
  if (!weekPlan.startDate) errors.push('WeekPlan must have a startDate');
  if (!weekPlan.endDate) errors.push('WeekPlan must have an endDate');
  
  // Validate slots
  if (!Array.isArray(weekPlan.slots)) {
    errors.push('WeekPlan slots must be an array');
  } else {
    weekPlan.slots.forEach((slot, index) => {
      if (!slot.id) errors.push(`Slot ${index} must have an id`);
      if (typeof slot.dayOfWeek !== 'number' || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        errors.push(`Slot ${index} must have a valid dayOfWeek (0-6)`);
      }
      if (!['desayuno', 'almuerzo', 'merienda', 'cena'].includes(slot.mealType)) {
        errors.push(`Slot ${index} must have a valid mealType`);
      }
      if (!slot.date || !slot.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        errors.push(`Slot ${index} must have a valid date in YYYY-MM-DD format`);
      }
      if (typeof slot.servings !== 'number' || slot.servings < 1) {
        errors.push(`Slot ${index} must have valid servings (> 0)`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRecipe = (recipe: Recipe): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!recipe.id) errors.push('Recipe must have an id');
  if (!recipe.name) errors.push('Recipe must have a name');
  if (!recipe.description) errors.push('Recipe must have a description');
  if (typeof recipe.prepTime !== 'number' || recipe.prepTime < 0) {
    errors.push('Recipe must have valid prepTime (>= 0)');
  }
  if (typeof recipe.cookTime !== 'number' || recipe.cookTime < 0) {
    errors.push('Recipe must have valid cookTime (>= 0)');
  }
  if (typeof recipe.servings !== 'number' || recipe.servings < 1) {
    errors.push('Recipe must have valid servings (> 0)');
  }
  if (!['easy', 'medium', 'hard'].includes(recipe.difficulty)) {
    errors.push('Recipe must have valid difficulty (easy, medium, hard)');
  }
  
  if (!Array.isArray(recipe.ingredients)) {
    errors.push('Recipe ingredients must be an array');
  } else if (recipe.ingredients.length === 0) {
    errors.push('Recipe must have at least one ingredient');
  }
  
  if (!Array.isArray(recipe.instructions)) {
    errors.push('Recipe instructions must be an array');
  } else if (recipe.instructions.length === 0) {
    errors.push('Recipe must have at least one instruction');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Performance testing utilities
export const measureRenderTime = async (renderFunction: () => Promise<void>): Promise<number> => {
  const startTime = performance.now();
  await renderFunction();
  const endTime = performance.now();
  return endTime - startTime;
};

export const generateLargeWeekPlan = (userId: string = 'test-user-id', weeksCount: number = 4): WeekPlan[] => {
  const weekPlans: WeekPlan[] = [];
  
  for (let week = 0; week < weeksCount; week++) {
    const startDate = format(
      addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), week * 7), 
      'yyyy-MM-dd'
    );
    const weekPlan = createFullWeekPlan(userId);
    weekPlan.startDate = startDate;
    weekPlan.endDate = format(addDays(new Date(startDate), 6), 'yyyy-MM-dd');
    
    // Fill with random recipes
    const recipes = [...generateArgentinianRecipes(), ...generateVegetarianRecipes()];
    weekPlan.slots.forEach(slot => {
      if (Math.random() > 0.3) { // 70% chance to have a recipe
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        slot.recipeId = randomRecipe.id;
        slot.recipe = randomRecipe;
      }
    });
    
    weekPlans.push(weekPlan);
  }
  
  return weekPlans;
};

// Export test constants
export const TEST_CONSTANTS = {
  DEFAULT_USER_ID: 'test-user-id',
  DEFAULT_SERVINGS: 2,
  MEAL_TYPES: ['desayuno', 'almuerzo', 'merienda', 'cena'] as MealType[],
  DAYS_OF_WEEK: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  DIFFICULTY_LEVELS: ['easy', 'medium', 'hard'] as const,
  DIET_PROFILES: ['balanced', 'low-carb', 'high-protein', 'vegetarian', 'vegan'] as const,
};