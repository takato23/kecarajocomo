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
    category: 'pasta',
    tags: ['pasta', 'tomate', 'vegetariano'],
    dietary_info: {
      vegetarian: true,
      vegan: false,
      gluten_free: false,
      dairy_free: false,
      nut_free: true,
      low_carb: false,
      keto: false,
      paleo: false,
      allergies: []
    },
    ai_generated: false,
    created_by: 'system',
    image_url: '/images/pasta-tomato.jpg',
    ingredients: [
      {
        id: '1',
        recipe_id: '1',
        ingredient_id: 'pasta-1',
        ingredient: {
          id: 'pasta-1',
          name: 'Pasta',
          normalized_name: 'pasta',
          category: 'granos',
          common_names: ['pasta', 'spaghetti', 'penne'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 400,
        unit: 'g',
        optional: false,
        notes: 'tipo espagueti o penne',
        order: 1
      },
      {
        id: '2',
        recipe_id: '1',
        ingredient_id: 'tomate-1',
        ingredient: {
          id: 'tomate-1',
          name: 'Tomates',
          normalized_name: 'tomate',
          category: 'verduras',
          common_names: ['tomate', 'tomates', 'jitomate'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 6,
        unit: 'unidades',
        optional: false,
        preparation: 'pelados y picados',
        order: 2
      },
      {
        id: '3',
        recipe_id: '1',
        ingredient_id: 'ajo-1',
        ingredient: {
          id: 'ajo-1',
          name: 'Ajo',
          normalized_name: 'ajo',
          category: 'condimentos',
          common_names: ['ajo', 'diente de ajo'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 3,
        unit: 'dientes',
        optional: false,
        preparation: 'picados finamente',
        order: 3
      },
      {
        id: '4',
        recipe_id: '1',
        ingredient_id: 'aceite-oliva-1',
        ingredient: {
          id: 'aceite-oliva-1',
          name: 'Aceite de oliva',
          normalized_name: 'aceite_oliva',
          category: 'condimentos',
          common_names: ['aceite', 'aceite de oliva', 'AOVE'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 3,
        unit: 'cucharadas',
        optional: false,
        order: 4
      },
      {
        id: '5',
        recipe_id: '1',
        ingredient_id: 'sal-1',
        ingredient: {
          id: 'sal-1',
          name: 'Sal',
          normalized_name: 'sal',
          category: 'condimentos',
          common_names: ['sal', 'sal marina', 'sal de mesa'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 1,
        unit: 'cucharadita',
        optional: false,
        order: 5
      },
      {
        id: '6',
        recipe_id: '1',
        ingredient_id: 'pimienta-1',
        ingredient: {
          id: 'pimienta-1',
          name: 'Pimienta negra',
          normalized_name: 'pimienta_negra',
          category: 'condimentos',
          common_names: ['pimienta', 'pimienta negra'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 0.5,
        unit: 'cucharadita',
        optional: true,
        order: 6
      }
    ],
    instructions: [
      {
        id: '1',
        recipe_id: '1',
        step_number: 1,
        instruction: 'Hervir agua con sal en una olla grande para la pasta',
        duration: 5
      },
      {
        id: '2',
        recipe_id: '1',
        step_number: 2,
        instruction: 'Calentar aceite de oliva en una sartén a fuego medio',
        duration: 2
      },
      {
        id: '3',
        recipe_id: '1',
        step_number: 3,
        instruction: 'Agregar ajo picado y sofreír hasta que esté dorado',
        duration: 2
      },
      {
        id: '4',
        recipe_id: '1',
        step_number: 4,
        instruction: 'Añadir tomates picados, sal y pimienta. Cocinar hasta que se forme una salsa',
        duration: 10
      },
      {
        id: '5',
        recipe_id: '1',
        step_number: 5,
        instruction: 'Cocinar la pasta según las instrucciones del paquete',
        duration: 8
      },
      {
        id: '6',
        recipe_id: '1',
        step_number: 6,
        instruction: 'Escurrir la pasta y mezclar con la salsa de tomate. Servir caliente',
        duration: 2
      }
    ],
    nutrition: {
      calories: 485,
      protein: 15,
      carbs: 78,
      fat: 12,
      fiber: 6,
      sugar: 8,
      sodium: 245,
      calculated_at: new Date('2024-01-01')
    },
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Ensalada César',
    description: 'Clásica ensalada césar con pollo a la parrilla',
    prep_time: 15,
    cook_time: 10,
    total_time: 25,
    servings: 2,
    difficulty: 'facil',
    cuisine_type: 'americana',
    category: 'ensalada',
    tags: ['ensalada', 'pollo', 'cesar'],
    dietary_info: {
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      dairy_free: false,
      nut_free: true,
      low_carb: true,
      keto: false,
      paleo: false,
      allergies: []
    },
    ai_generated: false,
    created_by: 'system',
    image_url: '/images/caesar-salad.jpg',
    ingredients: [
      {
        id: '7',
        recipe_id: '2',
        ingredient_id: 'lechuga-1',
        ingredient: {
          id: 'lechuga-1',
          name: 'Lechuga romana',
          normalized_name: 'lechuga_romana',
          category: 'verduras',
          common_names: ['lechuga', 'lechuga romana'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 2,
        unit: 'cabezas',
        optional: false,
        preparation: 'lavada y cortada',
        order: 1
      },
      {
        id: '8',
        recipe_id: '2',
        ingredient_id: 'pollo-1',
        ingredient: {
          id: 'pollo-1',
          name: 'Pechuga de pollo',
          normalized_name: 'pechuga_pollo',
          category: 'carnes',
          common_names: ['pollo', 'pechuga de pollo', 'pechuga'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 300,
        unit: 'g',
        optional: false,
        preparation: 'a la parrilla',
        order: 2
      },
      {
        id: '9',
        recipe_id: '2',
        ingredient_id: 'parmesano-1',
        ingredient: {
          id: 'parmesano-1',
          name: 'Queso parmesano',
          normalized_name: 'queso_parmesano',
          category: 'lacteos',
          common_names: ['parmesano', 'queso parmesano', 'parmigiano'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 50,
        unit: 'g',
        optional: false,
        preparation: 'rallado',
        order: 3
      },
      {
        id: '10',
        recipe_id: '2',
        ingredient_id: 'crutones-1',
        ingredient: {
          id: 'crutones-1',
          name: 'Crutones',
          normalized_name: 'crutones',
          category: 'panaderia',
          common_names: ['crutones', 'croutons', 'pan tostado'],
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        quantity: 100,
        unit: 'g',
        optional: true,
        order: 4
      }
    ],
    instructions: [
      {
        id: '7',
        recipe_id: '2',
        step_number: 1,
        instruction: 'Lavar y cortar la lechuga romana en trozos medianos',
        duration: 5
      },
      {
        id: '8',
        recipe_id: '2',
        step_number: 2,
        instruction: 'Cocinar la pechuga de pollo a la parrilla hasta que esté dorada',
        duration: 8
      },
      {
        id: '9',
        recipe_id: '2',
        step_number: 3,
        instruction: 'Cortar el pollo en tiritas',
        duration: 2
      },
      {
        id: '10',
        recipe_id: '2',
        step_number: 4,
        instruction: 'Mezclar lechuga, pollo, parmesano y crutones con aderezo césar',
        duration: 5
      },
      {
        id: '11',
        recipe_id: '2',
        step_number: 5,
        instruction: 'Servir inmediatamente',
        duration: 1
      }
    ],
    nutrition: {
      calories: 420,
      protein: 35,
      carbs: 15,
      fat: 25,
      fiber: 4,
      sugar: 5,
      sodium: 680,
      calculated_at: new Date('2024-01-01')
    },
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];

export const samplePantryItems: PantryItem[] = [
  {
    id: '1',
    user_id: 'user-1',
    ingredient_id: 'arroz-1',
    ingredient: {
      id: 'arroz-1',
      name: 'Arroz blanco',
      normalized_name: 'arroz_blanco',
      category: 'granos',
      common_names: ['arroz', 'arroz blanco'],
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    quantity: 2,
    unit: 'kg',
    expiration_date: new Date('2024-12-31'),
    location: 'despensa',
    purchase_date: new Date('2024-01-15'),
    notes: 'Marca Hacendado',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: '2',
    user_id: 'user-1',
    ingredient_id: 'aceite-oliva-1',
    ingredient: {
      id: 'aceite-oliva-1',
      name: 'Aceite de oliva virgen extra',
      normalized_name: 'aceite_oliva_virgen_extra',
      category: 'condimentos',
      common_names: ['aceite', 'aceite de oliva', 'AOVE'],
      created_at: new Date('2024-01-10'),
      updated_at: new Date('2024-01-10')
    },
    quantity: 1,
    unit: 'litro',
    expiration_date: new Date('2025-06-30'),
    location: 'despensa',
    purchase_date: new Date('2024-01-10'),
    notes: 'Primera presión en frío',
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10')
  },
  {
    id: '3',
    user_id: 'user-1',
    ingredient_id: 'leche-1',
    ingredient: {
      id: 'leche-1',
      name: 'Leche entera',
      normalized_name: 'leche_entera',
      category: 'lacteos',
      common_names: ['leche', 'leche entera'],
      created_at: new Date('2024-01-28'),
      updated_at: new Date('2024-01-28')
    },
    quantity: 1,
    unit: 'litro',
    expiration_date: new Date('2024-02-05'),
    location: 'nevera',
    purchase_date: new Date('2024-01-28'),
    created_at: new Date('2024-01-28'),
    updated_at: new Date('2024-01-28')
  },
  {
    id: '4',
    user_id: 'user-1',
    ingredient_id: 'tomate-pera-1',
    ingredient: {
      id: 'tomate-pera-1',
      name: 'Tomates pera',
      normalized_name: 'tomate_pera',
      category: 'verduras',
      common_names: ['tomate', 'tomates pera', 'jitomate'],
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-01')
    },
    quantity: 1.5,
    unit: 'kg',
    expiration_date: new Date('2024-02-08'),
    location: 'nevera',
    purchase_date: new Date('2024-02-01'),
    notes: 'Tomates de temporada',
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-02-01')
  },
  {
    id: '5',
    user_id: 'user-1',
    ingredient_id: 'pasta-espagueti-1',
    ingredient: {
      id: 'pasta-espagueti-1',
      name: 'Pasta espaguetis',
      normalized_name: 'pasta_espagueti',
      category: 'granos',
      common_names: ['pasta', 'espagueti', 'spaghetti'],
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20')
    },
    quantity: 500,
    unit: 'g',
    expiration_date: new Date('2025-01-31'),
    location: 'despensa',
    purchase_date: new Date('2024-01-20'),
    notes: 'Pasta italiana',
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-20')
  }
];