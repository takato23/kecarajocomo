/**
 * Argentine Meal Plan Prompt System
 * 
 * This module provides authentic Argentine meal planning prompts that reflect
 * real home cooking traditions, regional variations, and cultural meal patterns.
 */

export interface ArgentineMealContext {
  season: 'verano' | 'otoño' | 'invierno' | 'primavera';
  region: 'buenosAires' | 'interior' | 'litoral' | 'cuyo' | 'patagonia' | 'noroeste';
  budget: 'economico' | 'moderado' | 'amplio';
  cookingTime: 'rapido' | 'normal' | 'elaborado';
  familySize: number;
  dietaryRestrictions?: string[];
}

// Typical Argentine meal components by category
export const ARGENTINE_MEAL_COMPONENTS = {
  desayuno: {
    bebidas: ['mate', 'café con leche', 'té', 'mate cocido'],
    principales: [
      'medialunas', 
      'tostadas con manteca y mermelada',
      'tostadas con queso crema',
      'facturas',
      'pan con dulce de leche',
      'bizcochos',
      'galletitas'
    ],
    ocasional: ['huevos revueltos', 'sandwich de jamón y queso']
  },
  
  almuerzo: {
    platos_rapidos: [
      'milanesas con puré',
      'milanesas con ensalada',
      'milanesas a la napolitana',
      'empanadas (compradas o caseras)',
      'tartas (verdura, jamón y queso, pollo)',
      'sandwich de milanesa',
      'pizza (comprada o casera)',
      'fideos con manteca',
      'ravioles con tuco'
    ],
    platos_elaborados: [
      'asado (domingos)',
      'pastel de papas',
      'guiso de lentejas',
      'locro (fechas patrias)',
      'puchero',
      'matambre a la pizza',
      'pollo al horno con papas',
      'bifes a la criolla',
      'cazuela de mondongo',
      'ñoquis (29 del mes)'
    ],
    guarniciones: [
      'ensalada mixta',
      'ensalada de lechuga y tomate',
      'papas fritas',
      'puré de papas',
      'arroz blanco',
      'ensalada rusa'
    ]
  },
  
  merienda: {
    tipica: [
      'mate con facturas',
      'mate con bizcochos',
      'café con leche y medialunas',
      'té con tostadas',
      'sandwich de miga',
      'torta casera',
      'budín'
    ],
    para_chicos: [
      'chocolatada con vainillas',
      'leche con galletitas',
      'yogur con cereales',
      'licuado de banana'
    ]
  },
  
  cena: {
    liviana: [
      'sopa de verduras',
      'tortilla de papas',
      'revuelto de gramajo',
      'ensalada completa',
      'sandwich de lomito',
      'pizza a la parrilla',
      'empanadas'
    ],
    completa: [
      'milanesas con ensalada',
      'tallarines con salsa',
      'pollo al horno',
      'bife con ensalada',
      'pescado a la plancha',
      'hamburguesas caseras',
      'pastas caseras',
      'risotto'
    ]
  }
};

// Seasonal preferences
export const SEASONAL_PREFERENCES = {
  verano: {
    preferencias: ['ensaladas', 'comidas frías', 'asado', 'frutas'],
    evitar: ['guisos', 'sopas pesadas', 'comidas muy calóricas'],
    bebidas: ['agua', 'jugos naturales', 'cerveza fría', 'tereré']
  },
  invierno: {
    preferencias: ['guisos', 'sopas', 'puchero', 'locro', 'pastas'],
    platos_tipicos: ['guiso de lentejas', 'carbonada', 'cazuela'],
    bebidas: ['mate caliente', 'café', 'chocolate caliente', 'vino']
  },
  otoño: {
    transicion: true,
    platos: ['pastel de papas', 'tartas', 'empanadas', 'estofados']
  },
  primavera: {
    preferencias: ['ensaladas', 'tartas de verdura', 'milanesas', 'pastas livianas']
  }
};

// Regional variations
export const REGIONAL_SPECIALTIES = {
  buenosAires: {
    tipico: ['pizza', 'empanadas', 'milanesas', 'pastas'],
    merienda: ['medialunas', 'facturas', 'sandwich de miga']
  },
  interior: {
    tipico: ['asado', 'empanadas salteñas', 'locro', 'humita'],
    tradicional: ['cabrito', 'empanadas fritas', 'tamales']
  },
  litoral: {
    tipico: ['chipá', 'sopa paraguaya', 'pescados de río', 'mandioca'],
    bebidas: ['tereré', 'mate']
  },
  cuyo: {
    tipico: ['empanadas mendocinas', 'asado con cuero', 'chivo'],
    acompañamiento: ['vino']
  },
  patagonia: {
    tipico: ['cordero patagónico', 'trucha', 'centolla'],
    postres: ['torta galesa', 'dulces caseros']
  },
  noroeste: {
    tipico: ['empanadas salteñas', 'tamales', 'humita', 'locro'],
    especias: ['pimentón', 'comino', 'ají']
  }
};

// Budget considerations
export const BUDGET_MEALS = {
  economico: {
    base: ['fideos', 'arroz', 'polenta', 'papas', 'huevos'],
    proteinas: ['pollo', 'carne picada', 'huevos', 'menudencias'],
    platos: [
      'guiso de fideos',
      'polenta con tuco',
      'tortilla de papas',
      'arroz con pollo',
      'fideos con manteca',
      'milanesas de pollo',
      'empanadas de carne'
    ]
  },
  moderado: {
    variedad: ['carne vacuna', 'pollo', 'cerdo', 'pescado ocasional'],
    platos: [
      'milanesas',
      'asado (cortes económicos)',
      'tartas variadas',
      'pastas caseras',
      'bifes',
      'pollo al horno'
    ]
  },
  amplio: {
    premium: ['cortes premium', 'pescados', 'mariscos'],
    platos: [
      'asado completo',
      'salmón',
      'lomo',
      'matambre relleno',
      'parrillada completa'
    ]
  }
};

// Cooking time categories
export const COOKING_TIME_CATEGORIES = {
  rapido: {
    tiempo: '15-30 minutos',
    ejemplos: [
      'sandwich de milanesa',
      'fideos con manteca',
      'huevos revueltos',
      'quesadilla',
      'ensaladas'
    ]
  },
  normal: {
    tiempo: '30-60 minutos',
    ejemplos: [
      'milanesas',
      'tartas',
      'pastas',
      'pollo al horno',
      'tortilla de papas'
    ]
  },
  elaborado: {
    tiempo: 'más de 1 hora',
    ejemplos: [
      'asado',
      'guisos',
      'puchero',
      'locro',
      'pastel de papas',
      'empanadas caseras'
    ]
  }
};

// Cultural context for Argentine meals
export const ARGENTINE_MEAL_CULTURE = `
- Horarios: Desayuno 7-10hs, Almuerzo 13-14hs, Merienda 17-18hs, Cena 21-22hs
- Mate: Fundamental en desayuno y merienda
- Domingos: Asado familiar (si el presupuesto lo permite)
- 29 del mes: Tradición de comer ñoquis
- Facturas: Típicas de desayuno/merienda de fin de semana
- Milanesas: El plato más versátil y querido
- Empanadas: Solución rápida para cualquier ocasión
- Pizza: Los viernes o sábados es tradición
`;

// Generate meal plan prompt
export function generateArgentineMealPlanPrompt(context: ArgentineMealContext): string {
  const seasonalInfo = SEASONAL_PREFERENCES[context.season];
  const regionalInfo = REGIONAL_SPECIALTIES[context.region];
  const budgetInfo = BUDGET_MEALS[context.budget];
  const timeInfo = COOKING_TIME_CATEGORIES[context.cookingTime];
  
  const prompt = `
Genera un plan de comidas argentino auténtico para una semana.

CONTEXTO:
- Estación: ${context.season}
- Región: ${context.region}
- Presupuesto: ${context.budget}
- Tiempo de cocina: ${context.cookingTime}
- Personas: ${context.familySize}
${context.dietaryRestrictions ? `- Restricciones: ${context.dietaryRestrictions.join(', ')}` : ''}

REQUERIMIENTOS CULTURALES:
1. Respetar horarios argentinos:
   - Desayuno: 7-9 AM (liviano)
   - Almuerzo: 12:30-14:00 (comida principal)
   - Merienda: 17-18:00 (mate con algo dulce)
   - Cena: 21-22:00 (puede ser liviana o completa)

2. Incluir SIEMPRE:
   - Mate en desayuno o merienda
   - Al menos 2-3 comidas con carne por semana
   - Pastas al menos 1 vez por semana
   - Empanadas o pizza 1 vez por semana
   - Milanesas al menos 1 vez
   - Asado el domingo (si el presupuesto lo permite)

3. Consideraciones estacionales:
${context.season === 'verano' ? '   - Preferir ensaladas y comidas frías\n   - Incluir frutas de estación\n   - Bebidas frías' : ''}
${context.season === 'invierno' ? '   - Incluir guisos y sopas\n   - Comidas calóricas\n   - Mate caliente' : ''}

4. Especialidades regionales a incluir:
${regionalInfo.tipico.map(dish => `   - ${dish}`).join('\n')}

5. Restricciones de presupuesto:
${budgetInfo.platos.map(dish => `   - ${dish}`).join('\n')}

6. Tiempo de preparación:
   - ${timeInfo.tiempo}
   - Ejemplos: ${timeInfo.ejemplos.join(', ')}

FORMATO DE RESPUESTA:
Para cada día incluir:
- Desayuno
- Almuerzo (con guarnición si corresponde)
- Merienda
- Cena

USAR NOMBRES ARGENTINOS AUTÉNTICOS (no traducir):
- Milanesas (no "escalopes")
- Mate (no "té de yerba")
- Facturas (no "bollería")
- Empanadas (no "empanadillas")
- Asado (no "barbacoa")

RECORDAR:
- Los domingos son para asado o comidas especiales
- El 29 de cada mes se comen ñoquis
- Las tartas y empanadas son soluciones prácticas comunes
- El delivery de empanadas/pizza es normal 1 vez por semana
- La merienda SIEMPRE incluye mate o café con algo dulce
`;

  return prompt;
}

// Generate shopping list prompt
export function generateShoppingListPrompt(mealPlan: string, context: ArgentineMealContext): string {
  return `
Basándote en este plan de comidas argentino, genera una lista de compras organizada.

${mealPlan}

ORGANIZAR POR:
1. Verdulería:
   - Verduras frescas
   - Frutas
   - Papas, cebollas, ajo

2. Carnicería:
   - Cortes de carne
   - Pollo
   - Fiambres
   - Mencionar cortes argentinos específicos

3. Almacén:
   - Productos secos
   - Conservas
   - Aceite, vinagre
   - Yerba mate

4. Panadería:
   - Pan
   - Facturas
   - Medialunas
   - Prepizzas

5. Lácteos:
   - Leche
   - Quesos (cremoso, rallado, etc.)
   - Yogur
   - Manteca

6. Otros:
   - Huevos
   - Bebidas
   - Productos de limpieza básicos

INCLUIR CANTIDADES APROPIADAS PARA ${context.familySize} PERSONAS.

CONSIDERACIONES DE PRESUPUESTO ${context.budget.toUpperCase()}:
${context.budget === 'economico' ? '- Priorizar marcas económicas\n- Comprar ofertas\n- Cortes de carne económicos' : ''}
${context.budget === 'moderado' ? '- Balance entre calidad y precio\n- Algunos productos premium' : ''}
${context.budget === 'amplio' ? '- Productos de calidad\n- Cortes premium\n- Variedad de opciones' : ''}
`;
}

// Generate recipe adaptation prompt
export function generateRecipeAdaptationPrompt(originalRecipe: string, context: ArgentineMealContext): string {
  return `
Adapta esta receta al estilo argentino casero:

${originalRecipe}

ADAPTACIONES NECESARIAS:
1. Reemplazar ingredientes no comunes por alternativas argentinas
2. Ajustar técnicas de cocción a métodos caseros argentinos
3. Sugerir acompañamientos típicos argentinos
4. Adaptar porciones para ${context.familySize} personas
5. Considerar presupuesto ${context.budget}
6. Tiempo disponible: ${context.cookingTime}

MANTENER:
- Sabores auténticos argentinos
- Técnicas de cocina casera
- Ingredientes disponibles en Argentina
- Proporciones generosas (los argentinos comen bien)

SUGERIR:
- Qué comprar en la verdulería/carnicería del barrio
- Marcas argentinas comunes
- Tips de cocina argentina
- Cómo servirlo al estilo argentino
`;
}

// Helper function to get meal suggestions
export function getMealSuggestions(
  mealType: keyof typeof ARGENTINE_MEAL_COMPONENTS, 
  budget: 'economico' | 'moderado' | 'amplio',
  cookingTime: 'rapido' | 'normal' | 'elaborado',
  season: 'verano' | 'otoño' | 'invierno' | 'primavera'
): string[] {
  const context: ArgentineMealContext = {
    season,
    region: 'buenosAires',
    budget,
    cookingTime,
    familySize: 2,
    dietaryRestrictions: []
  };
  
  return getMealSuggestionsWithContext(mealType, context);
}

// Internal helper function with full context
function getMealSuggestionsWithContext(mealType: keyof typeof ARGENTINE_MEAL_COMPONENTS, context: ArgentineMealContext) {
  const meals = ARGENTINE_MEAL_COMPONENTS[mealType];
  const seasonal = SEASONAL_PREFERENCES[context.season];
  const regional = REGIONAL_SPECIALTIES[context.region];
  const budget = BUDGET_MEALS[context.budget];
  
  // Filter and prioritize based on context
  let suggestions: string[] = [];
  
  // Add meals from the specific meal type
  Object.values(meals).forEach(mealArray => {
    if (Array.isArray(mealArray)) {
      suggestions.push(...mealArray);
    }
  });
  
  // Add regional specialties
  if (regional.tipico) {
    suggestions.push(...regional.tipico);
  }
  
  // Filter by budget if needed
  if (context.budget === 'economico' && budget.platos) {
    suggestions = suggestions.filter(meal => 
      budget.platos.some(budgetMeal => meal.includes(budgetMeal))
    );
  }
  
  return [...new Set(suggestions)]; // Remove duplicates
}

// Validate meal plan for cultural authenticity
export function validateArgentineMealPlan(mealPlan: any): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for cultural elements
  if (!mealPlan.includesMate) {
    issues.push('Falta mate en el plan semanal');
    suggestions.push('Agregar mate en desayunos o meriendas');
  }
  
  if (!mealPlan.includesAsado && mealPlan.budget !== 'economico') {
    issues.push('Falta asado dominical');
    suggestions.push('Incluir asado el domingo');
  }
  
  if (!mealPlan.includesPasta) {
    issues.push('Falta pasta en el plan semanal');
    suggestions.push('Agregar fideos, ñoquis o ravioles');
  }
  
  if (!mealPlan.includesMilanesas) {
    issues.push('Faltan milanesas');
    suggestions.push('Las milanesas son fundamentales en la cocina argentina');
  }
  
  // Check meal timing
  if (mealPlan.dinnerTime && mealPlan.dinnerTime < 21) {
    issues.push('Horario de cena muy temprano');
    suggestions.push('La cena argentina es típicamente después de las 21:00');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

// Generate weekly menu display
export function generateWeeklyMenuDisplay(mealPlan: any, context: ArgentineMealContext): string {
  return `
🇦🇷 MENÚ SEMANAL ARGENTINO 🇦🇷
${context.familySize} personas | Presupuesto ${context.budget} | ${context.season}

${'='.repeat(50)}

${mealPlan.days.map((day: any) => `
📅 ${day.name.toUpperCase()}
${'─'.repeat(30)}
☕ DESAYUNO (${day.breakfast.time})
   ${day.breakfast.items.join(', ')}
   
🍽️ ALMUERZO (${day.lunch.time})
   ${day.lunch.main}
   ${day.lunch.side ? `Guarnición: ${day.lunch.side}` : ''}
   
🧉 MERIENDA (${day.snack.time})
   ${day.snack.items.join(', ')}
   
🌙 CENA (${day.dinner.time})
   ${day.dinner.main}
   ${day.dinner.side ? `Guarnición: ${day.dinner.side}` : ''}
`).join('\n')}

${'='.repeat(50)}

💡 TIPS DE COCINA ARGENTINA:
${mealPlan.tips.map((tip: string) => `• ${tip}`).join('\n')}

🛒 RECORDAR COMPRAR:
• Yerba mate suficiente para toda la semana
• Pan fresco diario (o cada 2 días)
• Facturas para el fin de semana
`;
}

// Export meal timing constants
export const ARGENTINE_MEAL_TIMES = {
  desayuno: { start: '07:00', end: '09:00', typical: '08:00' },
  almuerzo: { start: '12:30', end: '14:00', typical: '13:00' },
  merienda: { start: '17:00', end: '18:30', typical: '17:30' },
  cena: { start: '21:00', end: '23:00', typical: '21:30' }
};

// Common Argentine cooking terms
export const COOKING_TERMS = {
  cortes_carne: {
    'asado': 'costilla',
    'vacio': 'corte típico argentino',
    'entraña': 'corte para parrilla',
    'matambre': 'corte fino',
    'bife de chorizo': 'bife ancho',
    'ojo de bife': 'sin hueso',
    'tapa de asado': 'corte económico',
    'carnaza': 'para guisos',
    'roast beef': 'para milanesas',
    'nalga': 'para milanesas',
    'bola de lomo': 'para milanesas',
    'peceto': 'para hornear',
    'colita de cuadril': 'para parrilla'
  },
  metodos_coccion: {
    'a la parrilla': 'sobre brasas',
    'a la plancha': 'en superficie plana',
    'al horno': 'cocción lenta',
    'hervido': 'en agua',
    'frito': 'en aceite abundante',
    'salteado': 'cocción rápida',
    'guisado': 'cocción lenta con líquido',
    'al vapor': 'cocción saludable'
  },
  condimentos_tipicos: [
    'chimichurri',
    'provenzal',
    'perejil',
    'ajo',
    'orégano',
    'pimentón',
    'laurel',
    'comino',
    'ají molido'
  ]
};

// NEW: Build weekly plan prompt for Zenith system
export function buildWeeklyPlanPrompt(context: {
  weekStart: string;
  season: string;
  region: string;
  preferences: any;
  pantry: any[];
  mode: string;
}): string {
  const { weekStart, season, region, preferences, pantry, mode } = context;
  
  const culturalRules = getCulturalRules(preferences);
  const modeGuidelines = getModeGuidelines(mode);
  const pantryList = formatPantryItems(pantry);
  const dietaryRestrictions = formatDietaryRestrictions(preferences);
  
  return `
Genera un plan de comidas argentino completo para la semana del ${weekStart}.

CONTEXTO:
- Temporada: ${season}
- Región: ${region}
- Modo: ${mode}
- Tamaño familiar: ${preferences?.family?.householdSize || 2} personas

REGLAS CULTURALES OBLIGATORIAS:
${culturalRules}

MODO ${mode.toUpperCase()} - DIRECTRICES:
${modeGuidelines}

RESTRICCIONES DIETÉTICAS:
${dietaryRestrictions}

INGREDIENTES EN DESPENSA:
${pantryList}

HORARIOS DE COMIDA:
- Desayuno: ${preferences?.family?.eatingSchedule?.desayuno || '08:00'}
- Almuerzo: ${preferences?.family?.eatingSchedule?.almuerzo || '13:00'}
- Merienda: ${preferences?.family?.eatingSchedule?.merienda || '17:30'}
- Cena: ${preferences?.family?.eatingSchedule?.cena || '21:30'}

FORMATO DE RESPUESTA OBLIGATORIO:
Genera un JSON válido con exactamente esta estructura:

{
  "planId": "plan_[timestamp]",
  "weekStart": "${weekStart}",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayOfWeek": 0-6,
      "dayName": "Lunes",
      "meals": {
        "desayuno": {
          "recipe": {
            "id": "recipe_id",
            "name": "Nombre del plato",
            "description": "Descripción breve",
            "ingredients": [
              {
                "name": "ingrediente",
                "quantity": 100,
                "unit": "g"
              }
            ],
            "instructions": "Paso 1\\nPaso 2\\nPaso 3",
            "nutrition": {
              "calories": 300,
              "protein": 15,
              "carbs": 40,
              "fat": 10
            },
            "time": {
              "prep": 10,
              "cook": 15,
              "total": 25
            },
            "servings": ${preferences?.family?.householdSize || 2},
            "difficulty": "facil|medio|dificil",
            "tags": ["desayuno", "tradicional"],
            "estimatedCost": 200
          }
        },
        "almuerzo": { /* mismo formato */ },
        "merienda": { /* mismo formato */ },
        "cena": { /* mismo formato */ }
      }
    }
    /* ... 7 días en total */
  ],
  "nutritionSummary": {
    "avgCaloriesPerDay": 2000,
    "avgProteinPerDay": 80,
    "avgCarbsPerDay": 250,
    "avgFatPerDay": 70
  },
  "costSummary": {
    "totalWeekly": 15000,
    "avgPerDay": 2143,
    "avgPerMeal": 536,
    "withinBudget": true
  },
  "cultural": {
    "hasAsado": true,
    "hasMate": true,
    "hasNoquis29": false,
    "traditionalDishes": 12,
    "varietyScore": 8
  }
}

IMPORTANTE:
1. Respetar TODAS las tradiciones argentinas
2. Los domingos SIEMPRE incluir asado o comida familiar abundante
3. El 29 del mes SIEMPRE incluir ñoquis
4. Incluir mate en las meriendas según preferencia
5. Usar ingredientes de temporada y locales
6. Balancear comidas tradicionales con modernas
7. Considerar el presupuesto según el modo
8. Maximizar uso de ingredientes en despensa
`;
}

// Helper functions for buildWeeklyPlanPrompt
function getCulturalRules(preferences: any): string {
  const rules = [];
  
  // Mate frequency
  if (preferences?.cultural?.mateFrequency !== 'nunca') {
    rules.push(`- Incluir mate en meriendas (frecuencia: ${preferences?.cultural?.mateFrequency || 'ocasional'})`);
  }
  
  // Asado frequency
  if (preferences?.cultural?.asadoFrequency !== 'nunca') {
    rules.push(`- Planificar asados los domingos (frecuencia: ${preferences?.cultural?.asadoFrequency || 'quincenal'})`);
  }
  
  // Tradition level
  rules.push(`- Nivel de tradición: ${preferences?.cultural?.traditionLevel || 'media'}`);
  
  // Special occasions
  rules.push('- Respetar fechas especiales: 29 del mes = ñoquis');
  rules.push('- Domingos = comida familiar abundante');
  
  // Regional preferences
  if (preferences?.cultural?.preferLocalIngredients) {
    rules.push('- Priorizar ingredientes locales y de temporada');
  }
  
  return rules.join('\n');
}

function getModeGuidelines(mode: string): string {
  const guidelines: Record<string, string> = {
    economico: `
- Maximizar rendimiento por peso argentino
- Usar cortes económicos de carne
- Aprovechar verduras de temporada
- Preparaciones que rindan varias porciones
- Guisos, tartas, y comidas que se puedan freezar
- Presupuesto máximo: $300 por porción`,
    
    dieta: `
- Porciones controladas
- Reducir carbohidratos refinados
- Incluir más verduras y proteínas magras
- Métodos de cocción saludables (plancha, horno, vapor)
- Limitar frituras y grasas saturadas
- Objetivo: 400-500 calorías por comida principal`,
    
    fiesta: `
- Porciones abundantes para compartir
- Incluir entradas y platos principales generosos
- Asados completos con variedad de cortes
- Postres tradicionales
- Bebidas incluidas en el presupuesto
- Presupuesto flexible para ocasiones especiales`,
    
    normal: `
- Balance entre economía y variedad
- Mix de comidas tradicionales y modernas
- Porciones estándar para familia argentina
- Variedad en proteínas y vegetales
- Presupuesto moderado: $400-600 por porción`
  };
  
  return guidelines[mode] || guidelines.normal;
}

function formatPantryItems(pantry: any[]): string {
  if (!pantry?.length) return 'Sin ingredientes en despensa';
  
  return pantry
    .map(item => `- ${item.name}: ${item.quantity} ${item.unit}`)
    .join('\n');
}

function formatDietaryRestrictions(preferences: any): string {
  const restrictions = [];
  
  if (preferences?.dietary?.restrictions?.length > 0) {
    restrictions.push(`Restricciones: ${preferences.dietary.restrictions.join(', ')}`);
  }
  
  if (preferences?.dietary?.allergies?.length > 0) {
    restrictions.push(`Alergias: ${preferences.dietary.allergies.join(', ')}`);
  }
  
  if (preferences?.dietary?.dislikes?.length > 0) {
    restrictions.push(`No le gusta: ${preferences.dietary.dislikes.join(', ')}`);
  }
  
  if (preferences?.dietary?.avoidIngredients?.length > 0) {
    restrictions.push(`Evitar: ${preferences.dietary.avoidIngredients.join(', ')}`);
  }
  
  return restrictions.length > 0 
    ? restrictions.join('\n') 
    : 'Sin restricciones dietéticas';
}