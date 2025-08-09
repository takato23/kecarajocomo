import { 
  ArgentineWeeklyPlan, 
  ArgentineDayPlan, 
  ArgentineMeal,
  Recipe,
  UserPreferences,
  PantryItem,
  ShoppingList,
  WeeklyNutritionSummary,
  MealPlanRecord 
} from '@/store/slices/mealPlanSlice';

// Mock recipes for testing
export const mockAsadoRecipe: Recipe = {
  id: 'asado-tradicional',
  name: 'Asado Tradicional Argentino',
  description: 'Asado con chorizo, morcilla y vacío',
  image: '/images/asado.jpg',
  ingredients: [
    {
      id: 'vacio',
      name: 'Vacío',
      amount: 1.5,
      unit: 'kg',
      category: 'carnes'
    },
    {
      id: 'chorizo',
      name: 'Chorizo criollo',
      amount: 6,
      unit: 'unidades',
      category: 'carnes'
    },
    {
      id: 'morcilla',
      name: 'Morcilla',
      amount: 400,
      unit: 'g',
      category: 'carnes'
    },
    {
      id: 'sal-gruesa',
      name: 'Sal gruesa',
      amount: 2,
      unit: 'cucharadas',
      category: 'condimentos'
    }
  ],
  instructions: [
    'Encender el fuego 1 hora antes',
    'Salar la carne 30 min antes',
    'Cocinar chorizo y morcilla primero',
    'Asar el vacío vuelta y vuelta'
  ],
  nutrition: {
    calories: 650,
    protein: 45,
    carbs: 2,
    fat: 50
  },
  prepTime: 30,
  cookTime: 120,
  servings: 6,
  difficulty: 'medio',
  tags: ['tradicional', 'domingo', 'parrilla'],
  region: 'pampa',
  season: 'otono',
  cultural: {
    isTraditional: true,
    occasion: 'domingo',
    significance: 'Tradición argentina dominical'
  },
  cost: {
    total: 8500,
    perServing: 1417,
    currency: 'ARS'
  },
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

export const mockMilanesasRecipe: Recipe = {
  id: 'milanesas-napolitana',
  name: 'Milanesas a la Napolitana',
  description: 'Milanesas de carne con salsa, jamón y queso',
  image: '/images/milanesas.jpg',
  ingredients: [
    {
      id: 'nalga',
      name: 'Nalga',
      amount: 800,
      unit: 'g',
      category: 'carnes'
    },
    {
      id: 'pan-rallado',
      name: 'Pan rallado',
      amount: 200,
      unit: 'g',
      category: 'cereales'
    },
    {
      id: 'huevos',
      name: 'Huevos',
      amount: 3,
      unit: 'unidades',
      category: 'lacteos'
    },
    {
      id: 'jamon-cocido',
      name: 'Jamón cocido',
      amount: 200,
      unit: 'g',
      category: 'carnes'
    },
    {
      id: 'queso-muzzarella',
      name: 'Queso muzzarella',
      amount: 200,
      unit: 'g',
      category: 'lacteos'
    }
  ],
  instructions: [
    'Batir los huevos en un plato hondo',
    'Pasar la carne por huevo y pan rallado',
    'Freír en aceite caliente hasta dorar',
    'Cubrir con jamón y queso, gratinar'
  ],
  nutrition: {
    calories: 520,
    protein: 35,
    carbs: 25,
    fat: 30
  },
  prepTime: 20,
  cookTime: 25,
  servings: 4,
  difficulty: 'facil',
  tags: ['familiar', 'fácil', 'económico'],
  region: 'pampa',
  cultural: {
    isTraditional: true,
    significance: 'Comida familiar argentina'
  },
  cost: {
    total: 4200,
    perServing: 1050,
    currency: 'ARS'
  },
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

export const mockNoquis29Recipe: Recipe = {
  id: 'noquis-29',
  name: 'Ñoquis del 29',
  description: 'Ñoquis de papa tradicionales para el 29 de cada mes',
  image: '/images/noquis.jpg',
  ingredients: [
    {
      id: 'papas',
      name: 'Papas',
      amount: 1,
      unit: 'kg',
      category: 'verduras'
    },
    {
      id: 'harina',
      name: 'Harina 0000',
      amount: 300,
      unit: 'g',
      category: 'cereales'
    },
    {
      id: 'huevo',
      name: 'Huevo',
      amount: 1,
      unit: 'unidad',
      category: 'lacteos'
    },
    {
      id: 'salsa-tomate',
      name: 'Salsa de tomate',
      amount: 400,
      unit: 'ml',
      category: 'condimentos'
    }
  ],
  instructions: [
    'Hervir las papas con cáscara hasta que estén tiernas',
    'Pelar y pisar las papas',
    'Mezclar con harina y huevo',
    'Formar los ñoquis y cocinar en agua hirviendo'
  ],
  nutrition: {
    calories: 380,
    protein: 12,
    carbs: 75,
    fat: 3
  },
  prepTime: 45,
  cookTime: 30,
  servings: 4,
  difficulty: 'medio',
  tags: ['tradicional', 'día-29', 'económico'],
  cultural: {
    isTraditional: true,
    occasion: 'dia29',
    significance: 'Tradición del 29 para atraer prosperidad'
  },
  cost: {
    total: 1800,
    perServing: 450,
    currency: 'ARS'
  },
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

export const mockMateRecipe: Recipe = {
  id: 'mate-tradicional',
  name: 'Mate Tradicional',
  description: 'Mate cebado con yerba argentina',
  ingredients: [
    {
      id: 'yerba-mate',
      name: 'Yerba mate',
      amount: 50,
      unit: 'g',
      category: 'bebidas'
    },
    {
      id: 'agua-caliente',
      name: 'Agua caliente',
      amount: 500,
      unit: 'ml',
      category: 'bebidas'
    }
  ],
  instructions: [
    'Llenar 3/4 del mate con yerba',
    'Calentar agua a 80°C',
    'Cebar y tomar en ronda'
  ],
  nutrition: {
    calories: 5,
    protein: 0.5,
    carbs: 1,
    fat: 0
  },
  prepTime: 5,
  cookTime: 0,
  servings: 4,
  difficulty: 'facil',
  tags: ['bebida', 'tradicional', 'compartir'],
  cultural: {
    isTraditional: true,
    significance: 'Bebida nacional argentina, ritual social'
  },
  cost: {
    total: 300,
    perServing: 75,
    currency: 'ARS'
  },
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

// Mock meals
export const mockAsadoMeal: ArgentineMeal = {
  recipe: mockAsadoRecipe,
  servings: 6,
  notes: 'Para el domingo familiar',
  locked: false,
  alternatives: [mockMilanesasRecipe],
  cost: 8500,
  nutrition: mockAsadoRecipe.nutrition
};

export const mockMilanesasMeal: ArgentineMeal = {
  recipe: mockMilanesasRecipe,
  servings: 4,
  cost: 4200,
  nutrition: mockMilanesasRecipe.nutrition
};

export const mockNoquisMeal: ArgentineMeal = {
  recipe: mockNoquis29Recipe,
  servings: 4,
  notes: 'Tradición del 29',
  cost: 1800,
  nutrition: mockNoquis29Recipe.nutrition
};

export const mockMateMeal: ArgentineMeal = {
  recipe: mockMateRecipe,
  servings: 4,
  cost: 300,
  nutrition: mockMateRecipe.nutrition
};

// Mock day plans
export const mockSundayPlan: ArgentineDayPlan = {
  date: '2024-01-21', // Sunday
  dayOfWeek: 0,
  dayName: 'Domingo',
  desayuno: mockMateMeal,
  almuerzo: mockAsadoMeal,
  merienda: mockMateMeal,
  cena: {
    recipe: {
      ...mockMilanesasRecipe,
      name: 'Ensalada mixta'
    },
    servings: 4,
    cost: 1500,
    nutrition: { calories: 200, protein: 5, carbs: 15, fat: 8 }
  },
  cultural: {
    isSpecialDay: true,
    occasion: 'domingo',
    notes: 'Domingo familiar con asado'
  },
  dailyNutrition: {
    calories: 1375,
    protein: 85.5,
    carbs: 43,
    fat: 91
  },
  dailyCost: 12100
};

export const mockMondayPlan: ArgentineDayPlan = {
  date: '2024-01-29', // 29th for ñoquis
  dayOfWeek: 1,
  dayName: 'Lunes',
  desayuno: mockMateMeal,
  almuerzo: mockMilanesasMeal,
  merienda: mockMateMeal,
  cena: mockNoquisMeal,
  cultural: {
    isSpecialDay: true,
    occasion: 'dia29',
    notes: 'Ñoquis del 29 para la prosperidad'
  },
  dailyNutrition: {
    calories: 1210,
    protein: 53,
    carbs: 102,
    fat: 41
  },
  dailyCost: 6600
};

// Mock weekly plan
export const mockWeeklyPlan: ArgentineWeeklyPlan = {
  planId: 'plan-test-week-1',
  userId: 'test-user-id',
  weekStart: '2024-01-15', // Monday
  weekEnd: '2024-01-21', // Sunday
  days: [
    mockMondayPlan,
    {
      ...mockMondayPlan,
      date: '2024-01-16',
      dayOfWeek: 2,
      dayName: 'Martes',
      cultural: { isSpecialDay: false }
    },
    {
      ...mockMondayPlan,
      date: '2024-01-17',
      dayOfWeek: 3,
      dayName: 'Miércoles',
      cultural: { isSpecialDay: false }
    },
    {
      ...mockMondayPlan,
      date: '2024-01-18',
      dayOfWeek: 4,
      dayName: 'Jueves',
      cultural: { isSpecialDay: false }
    },
    {
      ...mockMondayPlan,
      date: '2024-01-19',
      dayOfWeek: 5,
      dayName: 'Viernes',
      cultural: { isSpecialDay: false }
    },
    {
      ...mockMondayPlan,
      date: '2024-01-20',
      dayOfWeek: 6,
      dayName: 'Sábado',
      cultural: { isSpecialDay: false }
    },
    mockSundayPlan
  ],
  weeklyNutrition: {
    calories: 9625,
    protein: 367.5,
    carbs: 301,
    fat: 287
  },
  weeklyCost: 48700,
  generatedAt: '2024-01-15T10:00:00Z',
  lastModified: '2024-01-15T10:00:00Z',
  mode: 'normal',
  region: 'pampa',
  season: 'verano',
  cultural: {
    hasAsado: true,
    hasMate: true,
    hasNoquis29: true,
    specialOccasions: ['domingo', 'dia29']
  }
};

// Mock user preferences
export const mockUserPreferences: UserPreferences = {
  dietary: {
    restrictions: [],
    allergies: ['nueces'],
    dislikes: ['berenjenas'],
    favorites: ['asado', 'milanesas', 'empanadas', 'mate']
  },
  cooking: {
    skill: 'intermedio',
    timeAvailable: 60,
    equipment: ['horno', 'parrilla', 'microondas', 'licuadora'],
    preferredTechniques: ['plancha', 'horno', 'parrilla']
  },
  cultural: {
    region: 'pampa',
    traditionLevel: 'alta',
    mateFrequency: 'diario',
    asadoFrequency: 'semanal'
  },
  family: {
    householdSize: 4,
    hasChildren: true,
    ageRanges: ['adulto', 'niño'],
    specialNeeds: []
  },
  budget: {
    weekly: 20000,
    currency: 'ARS',
    flexibility: 'flexible'
  },
  shopping: {
    preferredStores: ['carnicería', 'verdulería', 'supermercado'],
    buysBulk: false,
    prefersLocal: true,
    hasGarden: false
  }
};

// Mock pantry items
export const mockPantryItems: PantryItem[] = [
  {
    id: 'yerba-mate-pantry',
    name: 'Yerba mate',
    category: 'bebidas',
    amount: 1,
    unit: 'kg',
    expiryDate: '2024-12-31',
    cost: 2500,
    frequency: 'alta'
  },
  {
    id: 'sal-gruesa-pantry',
    name: 'Sal gruesa',
    category: 'condimentos',
    amount: 2,
    unit: 'kg',
    frequency: 'alta'
  },
  {
    id: 'aceite-girasol',
    name: 'Aceite de girasol',
    category: 'condimentos',
    amount: 1.5,
    unit: 'litros',
    expiryDate: '2024-08-15',
    cost: 1200,
    frequency: 'alta'
  },
  {
    id: 'harina-0000',
    name: 'Harina 0000',
    category: 'cereales',
    amount: 2,
    unit: 'kg',
    cost: 800,
    frequency: 'media'
  }
];

// Mock alternative recipes
export const mockAlternativeRecipes: Recipe[] = [
  {
    ...mockMilanesasRecipe,
    id: 'milanesas-pollo',
    name: 'Milanesas de Pollo',
    description: 'Milanesas de pechuga de pollo',
    cost: { total: 3500, perServing: 875, currency: 'ARS' }
  },
  {
    ...mockAsadoRecipe,
    id: 'pollo-parrilla',
    name: 'Pollo a la Parrilla',
    description: 'Pollo entero a la parrilla con chimichurri',
    cost: { total: 3200, perServing: 533, currency: 'ARS' }
  },
  {
    ...mockNoquis29Recipe,
    id: 'pasta-tuco',
    name: 'Pasta con Tuco',
    description: 'Fideos con salsa de tomate casera',
    cost: { total: 1500, perServing: 375, currency: 'ARS' }
  }
];

// Mock regenerated meal
export const mockRegeneratedMeal: ArgentineMeal = {
  recipe: {
    ...mockMilanesasRecipe,
    id: 'milanesas-regeneradas',
    name: 'Milanesas de Ternera',
    description: 'Milanesas tiernas con papas fritas',
    ingredients: [
      ...mockMilanesasRecipe.ingredients,
      {
        id: 'papas-fritas',
        name: 'Papas para freír',
        amount: 800,
        unit: 'g',
        category: 'verduras'
      }
    ]
  },
  servings: 4,
  cost: 5200,
  nutrition: {
    calories: 620,
    protein: 38,
    carbs: 45,
    fat: 35
  }
};

// Mock nutrition summary
export const mockNutritionSummary: WeeklyNutritionSummary = {
  daily: {
    calories: 1375,
    protein: 52.5,
    carbs: 43,
    fat: 41
  },
  weekly: {
    calories: 9625,
    protein: 367.5,
    carbs: 301,
    fat: 287
  },
  balance: {
    varietyScore: 8.5,
    nutritionScore: 7.8,
    culturalScore: 9.2
  },
  recommendations: [
    'Incluir más verduras en las comidas',
    'Considerar pescado una vez por semana',
    'Mantener la tradición del mate y asado'
  ]
};

// Mock shopping list
export const mockShoppingList: ShoppingList = {
  id: 'shopping-list-1',
  weekPlanId: 'plan-test-week-1',
  items: [
    {
      id: 'item-vacio',
      name: 'Vacío',
      category: 'carnes',
      amount: 1.5,
      unit: 'kg',
      estimatedCost: 4500,
      priority: 'alta',
      inPantry: false,
      recipes: ['Asado Tradicional Argentino'],
      checked: false
    },
    {
      id: 'item-chorizo',
      name: 'Chorizo criollo',
      category: 'carnes',
      amount: 6,
      unit: 'unidades',
      estimatedCost: 1800,
      priority: 'alta',
      inPantry: false,
      recipes: ['Asado Tradicional Argentino'],
      checked: false
    },
    {
      id: 'item-nalga',
      name: 'Nalga',
      category: 'carnes',
      amount: 800,
      unit: 'g',
      estimatedCost: 3200,
      priority: 'media',
      inPantry: false,
      recipes: ['Milanesas a la Napolitana'],
      checked: false
    }
  ],
  totalCost: 9500,
  generatedAt: '2024-01-15T10:00:00Z',
  categories: [
    {
      name: 'carnes',
      items: [
        {
          id: 'item-vacio',
          name: 'Vacío',
          category: 'carnes',
          amount: 1.5,
          unit: 'kg',
          estimatedCost: 4500,
          priority: 'alta',
          inPantry: false,
          recipes: ['Asado Tradicional Argentino'],
          checked: false
        }
      ],
      subtotal: 9500
    }
  ]
};

// Mock meal plan record for Supabase
export const mockMealPlanRecord: MealPlanRecord = {
  id: 'record-1',
  user_id: 'test-user-id',
  week_start: '2024-01-15',
  week_end: '2024-01-21',
  plan_data: mockWeeklyPlan,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
};