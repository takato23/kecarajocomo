import type { Recipe } from '@/types/recipes';
import type { PantryItem } from '@/types/pantry';

export const sampleRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Pasta con Tomate',
    description: 'Deliciosa pasta con salsa de tomate casera',
    prep_time: 10,
    cook_time: 15,
    total_time: 25,
    servings: 4,
    difficulty: 'facil',
    cuisine_type: 'italiana',
    dietary_tags: ['vegetariano'],
    image_url: '/images/pasta-tomato.jpg',
    ingredients: [
      {
        id: '1',
        ingredient_name: 'pasta',
        quantity: 400,
        unit: 'g',
        optional: false,
        notes: 'tipo espagueti o penne'
      },
      {
        id: '2',
        ingredient_name: 'tomate',
        quantity: 6,
        unit: 'unidad',
        optional: false,
        notes: 'tomates maduros'
      },
      {
        id: '3',
        ingredient_name: 'ajo',
        quantity: 3,
        unit: 'diente',
        optional: false,
        notes: ''
      },
      {
        id: '4',
        ingredient_name: 'aceite de oliva',
        quantity: 3,
        unit: 'cucharada',
        optional: false,
        notes: ''
      },
      {
        id: '5',
        ingredient_name: 'albahaca',
        quantity: 1,
        unit: 'manojo',
        optional: true,
        notes: 'fresca'
      },
      {
        id: '6',
        ingredient_name: 'sal',
        quantity: 1,
        unit: 'cucharadita',
        optional: false,
        notes: ''
      }
    ],
    instructions: [
      {
        step_number: 1,
        instruction: 'Hervir agua con sal para la pasta',
        estimated_time: 5
      },
      {
        step_number: 2,
        instruction: 'Picar finamente el ajo y cortar los tomates',
        estimated_time: 5
      },
      {
        step_number: 3,
        instruction: 'Calentar aceite y sofreír el ajo',
        estimated_time: 2
      },
      {
        step_number: 4,
        instruction: 'Agregar tomates y cocinar hasta reducir',
        estimated_time: 10
      },
      {
        step_number: 5,
        instruction: 'Cocinar la pasta según instrucciones del paquete',
        estimated_time: 8
      },
      {
        step_number: 6,
        instruction: 'Mezclar pasta con salsa y servir con albahaca',
        estimated_time: 2
      }
    ],
    nutrition: {
      calories: 320,
      protein: 12,
      carbs: 58,
      fat: 8,
      fiber: 4
    },
    tags: ['rapido', 'economico', 'facil'],
    is_favorite: false,
    times_cooked: 5,
    average_rating: 4.5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Arroz con Pollo',
    description: 'Clásico arroz con pollo español con azafrán',
    prep_time: 15,
    cook_time: 25,
    total_time: 40,
    servings: 6,
    difficulty: 'intermedio',
    cuisine_type: 'española',
    dietary_tags: ['sin_gluten'],
    image_url: '/images/arroz-pollo.jpg',
    ingredients: [
      {
        id: '1',
        ingredient_name: 'arroz',
        quantity: 300,
        unit: 'g',
        optional: false,
        notes: 'bomba o calasparra'
      },
      {
        id: '2',
        ingredient_name: 'pollo',
        quantity: 800,
        unit: 'g',
        optional: false,
        notes: 'trozos variados'
      },
      {
        id: '3',
        ingredient_name: 'caldo de pollo',
        quantity: 600,
        unit: 'ml',
        optional: false,
        notes: ''
      },
      {
        id: '4',
        ingredient_name: 'azafrán',
        quantity: 1,
        unit: 'sobre',
        optional: false,
        notes: ''
      },
      {
        id: '5',
        ingredient_name: 'pimiento rojo',
        quantity: 1,
        unit: 'unidad',
        optional: false,
        notes: ''
      },
      {
        id: '6',
        ingredient_name: 'judías verdes',
        quantity: 200,
        unit: 'g',
        optional: true,
        notes: ''
      },
      {
        id: '7',
        ingredient_name: 'aceite de oliva',
        quantity: 4,
        unit: 'cucharada',
        optional: false,
        notes: ''
      }
    ],
    instructions: [
      {
        step_number: 1,
        instruction: 'Dorar los trozos de pollo en aceite caliente',
        estimated_time: 8
      },
      {
        step_number: 2,
        instruction: 'Agregar pimiento y judías verdes',
        estimated_time: 5
      },
      {
        step_number: 3,
        instruction: 'Incorporar el arroz y remover 2 minutos',
        estimated_time: 3
      },
      {
        step_number: 4,
        instruction: 'Añadir caldo caliente con azafrán',
        estimated_time: 2
      },
      {
        step_number: 5,
        instruction: 'Cocinar sin remover durante 20 minutos',
        estimated_time: 20
      },
      {
        step_number: 6,
        instruction: 'Reposar 5 minutos antes de servir',
        estimated_time: 5
      }
    ],
    nutrition: {
      calories: 420,
      protein: 28,
      carbs: 45,
      fat: 12,
      fiber: 3
    },
    tags: ['tradicional', 'familiar'],
    is_favorite: true,
    times_cooked: 3,
    average_rating: 4.8,
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  },
  {
    id: '3',
    name: 'Ensalada César',
    description: 'Ensalada césar clásica con pollo y crutones',
    prep_time: 20,
    cook_time: 10,
    total_time: 30,
    servings: 4,
    difficulty: 'facil',
    cuisine_type: 'americana',
    dietary_tags: [],
    image_url: '/images/caesar-salad.jpg',
    ingredients: [
      {
        id: '1',
        ingredient_name: 'lechuga romana',
        quantity: 2,
        unit: 'unidad',
        optional: false,
        notes: ''
      },
      {
        id: '2',
        ingredient_name: 'pechuga de pollo',
        quantity: 400,
        unit: 'g',
        optional: false,
        notes: ''
      },
      {
        id: '3',
        ingredient_name: 'pan',
        quantity: 4,
        unit: 'rebanada',
        optional: false,
        notes: 'para crutones'
      },
      {
        id: '4',
        ingredient_name: 'queso parmesano',
        quantity: 100,
        unit: 'g',
        optional: false,
        notes: 'rallado'
      },
      {
        id: '5',
        ingredient_name: 'mayonesa',
        quantity: 4,
        unit: 'cucharada',
        optional: false,
        notes: ''
      },
      {
        id: '6',
        ingredient_name: 'limón',
        quantity: 1,
        unit: 'unidad',
        optional: false,
        notes: 'jugo'
      },
      {
        id: '7',
        ingredient_name: 'ajo',
        quantity: 2,
        unit: 'diente',
        optional: false,
        notes: ''
      }
    ],
    instructions: [
      {
        step_number: 1,
        instruction: 'Cocinar y cortar la pechuga de pollo',
        estimated_time: 10
      },
      {
        step_number: 2,
        instruction: 'Hacer crutones con el pan tostado',
        estimated_time: 5
      },
      {
        step_number: 3,
        instruction: 'Lavar y cortar la lechuga',
        estimated_time: 5
      },
      {
        step_number: 4,
        instruction: 'Preparar aderezo con mayonesa, limón y ajo',
        estimated_time: 3
      },
      {
        step_number: 5,
        instruction: 'Mezclar todos los ingredientes',
        estimated_time: 2
      }
    ],
    nutrition: {
      calories: 380,
      protein: 32,
      carbs: 18,
      fat: 22,
      fiber: 4
    },
    tags: ['saludable', 'proteico'],
    is_favorite: false,
    times_cooked: 2,
    average_rating: 4.2,
    created_at: '2024-01-12T12:00:00Z',
    updated_at: '2024-01-12T12:00:00Z'
  },
  {
    id: '4',
    name: 'Tortilla Española',
    description: 'Tortilla de patatas tradicional española',
    prep_time: 10,
    cook_time: 20,
    total_time: 30,
    servings: 4,
    difficulty: 'intermedio',
    cuisine_type: 'española',
    dietary_tags: ['vegetariano', 'sin_gluten'],
    image_url: '/images/tortilla-espanola.jpg',
    ingredients: [
      {
        id: '1',
        ingredient_name: 'patata',
        quantity: 4,
        unit: 'unidad',
        optional: false,
        notes: 'medianas'
      },
      {
        id: '2',
        ingredient_name: 'huevo',
        quantity: 6,
        unit: 'unidad',
        optional: false,
        notes: ''
      },
      {
        id: '3',
        ingredient_name: 'cebolla',
        quantity: 1,
        unit: 'unidad',
        optional: true,
        notes: 'mediana'
      },
      {
        id: '4',
        ingredient_name: 'aceite de oliva',
        quantity: 200,
        unit: 'ml',
        optional: false,
        notes: ''
      },
      {
        id: '5',
        ingredient_name: 'sal',
        quantity: 1,
        unit: 'cucharadita',
        optional: false,
        notes: ''
      }
    ],
    instructions: [
      {
        step_number: 1,
        instruction: 'Pelar y cortar patatas en láminas finas',
        estimated_time: 5
      },
      {
        step_number: 2,
        instruction: 'Freír patatas en aceite abundante',
        estimated_time: 10
      },
      {
        step_number: 3,
        instruction: 'Batir huevos con sal',
        estimated_time: 2
      },
      {
        step_number: 4,
        instruction: 'Mezclar patatas con huevos batidos',
        estimated_time: 2
      },
      {
        step_number: 5,
        instruction: 'Cuajar la tortilla por ambos lados',
        estimated_time: 8
      }
    ],
    nutrition: {
      calories: 290,
      protein: 14,
      carbs: 20,
      fat: 18,
      fiber: 2
    },
    tags: ['tradicional', 'economico'],
    is_favorite: true,
    times_cooked: 8,
    average_rating: 4.7,
    created_at: '2024-01-08T16:45:00Z',
    updated_at: '2024-01-08T16:45:00Z'
  }
];

export const samplePantryItems: PantryItem[] = [
  {
    id: '1',
    ingredient_name: 'pasta',
    quantity: 2000,
    unit: 'g',
    category: 'granos',
    location: 'despensa',
    expiry_date: '2024-12-31',
    purchase_date: '2024-01-01',
    notes: 'varios tipos'
  },
  {
    id: '2',
    ingredient_name: 'arroz',
    quantity: 1500,
    unit: 'g',
    category: 'granos',
    location: 'despensa',
    expiry_date: '2024-12-31',
    purchase_date: '2024-01-01',
    notes: ''
  },
  {
    id: '3',
    ingredient_name: 'aceite de oliva',
    quantity: 500,
    unit: 'ml',
    category: 'aceites',
    location: 'despensa',
    expiry_date: '2024-06-30',
    purchase_date: '2024-01-01',
    notes: 'extra virgen'
  },
  {
    id: '4',
    ingredient_name: 'ajo',
    quantity: 1,
    unit: 'cabeza',
    category: 'vegetales',
    location: 'nevera',
    expiry_date: '2024-02-15',
    purchase_date: '2024-01-10',
    notes: ''
  },
  {
    id: '5',
    ingredient_name: 'sal',
    quantity: 1,
    unit: 'kg',
    category: 'condimentos',
    location: 'despensa',
    expiry_date: '2025-12-31',
    purchase_date: '2024-01-01',
    notes: 'sal marina'
  },
  {
    id: '6',
    ingredient_name: 'huevo',
    quantity: 12,
    unit: 'unidad',
    category: 'lácteos',
    location: 'nevera',
    expiry_date: '2024-02-01',
    purchase_date: '2024-01-15',
    notes: 'cartón de 12'
  },
  {
    id: '7',
    ingredient_name: 'mayonesa',
    quantity: 400,
    unit: 'ml',
    category: 'condimentos',
    location: 'nevera',
    expiry_date: '2024-03-31',
    purchase_date: '2024-01-05',
    notes: ''
  },
  {
    id: '8',
    ingredient_name: 'queso parmesano',
    quantity: 200,
    unit: 'g',
    category: 'lácteos',
    location: 'nevera',
    expiry_date: '2024-02-28',
    purchase_date: '2024-01-12',
    notes: 'rallado'
  }
];