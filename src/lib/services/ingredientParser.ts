/**
 * Parser inteligente de ingredientes para optimizar búsquedas en BuscaPrecios
 * Basado en el sistema del proyecto backup "A Comerla"
 */

export interface ParsedIngredient {
  originalText: string;
  simplifiedQuery: string;
  quantity?: number;
  unit?: string;
  productName: string;
  category?: string;
}

// Mapeo de unidades comunes
const UNIT_MAPPINGS: Record<string, string> = {
  // Peso
  'kg': 'kg',
  'kilogramo': 'kg',
  'kilogramos': 'kg',
  'kilo': 'kg',
  'kilos': 'kg',
  'g': 'g',
  'gr': 'g',
  'gramo': 'g',
  'gramos': 'g',
  
  // Volumen
  'l': 'l',
  'lt': 'l',
  'litro': 'l',
  'litros': 'l',
  'ml': 'ml',
  'mililitro': 'ml',
  'mililitros': 'ml',
  'cc': 'ml',
  
  // Unidades
  'unidad': 'un',
  'unidades': 'un',
  'un': 'un',
  'u': 'un',
  'paquete': 'paq',
  'paquetes': 'paq',
  'paq': 'paq',
  'docena': 'doc',
  'docenas': 'doc',
  'doc': 'doc',
  
  // Medidas caseras
  'taza': 'taza',
  'tazas': 'taza',
  'cucharada': 'cda',
  'cucharadas': 'cda',
  'cda': 'cda',
  'cucharadita': 'cdta',
  'cucharaditas': 'cdta',
  'cdta': 'cdta',
  'pizca': 'pizca',
  'pizcas': 'pizca',
};

// Mapeo de ingredientes complejos a términos simples para BuscaPrecios
const INGREDIENT_SIMPLIFICATIONS: Record<string, string> = {
  // Semillas y frutos secos
  'semillas de chia': 'chia',
  'semillas de lino': 'lino',
  'semillas de girasol': 'girasol',
  'semillas de sésamo': 'sésamo',
  'semillas de sesamo': 'sésamo',
  'nueces pecanas': 'nueces',
  'nueces de pecan': 'nueces',
  'almendras tostadas': 'almendras',
  'almendras fileteadas': 'almendras',
  
  // Condimentos específicos
  'mostaza con miel': 'mostaza',
  'mostaza dijon': 'mostaza',
  'salsa de soja': 'salsa soja',
  'aceite de oliva': 'aceite',
  'aceite de girasol': 'aceite',
  'vinagre balsámico': 'vinagre',
  'vinagre balsamico': 'vinagre',
  'vinagre blanco': 'vinagre',
  'vinagre de alcohol': 'vinagre',
  
  // Lácteos específicos
  'queso rallado': 'queso',
  'queso cremoso': 'queso',
  'queso crema': 'queso crema',
  'leche descremada': 'leche',
  'leche entera': 'leche',
  'leche deslactosada': 'leche',
  'yogur natural': 'yogur',
  'yogur griego': 'yogur',
  'yogurt natural': 'yogur',
  'yogurt griego': 'yogur',
  'manteca': 'manteca',
  'mantequilla': 'manteca',
  'crema de leche': 'crema',
  
  // Carnes específicas
  'pechuga de pollo': 'pollo',
  'pechugas de pollo': 'pollo',
  'muslo de pollo': 'pollo',
  'muslos de pollo': 'pollo',
  'pollo entero': 'pollo',
  'carne molida': 'carne picada',
  'carne picada': 'carne picada',
  'carne picada especial': 'carne picada',
  'lomo de cerdo': 'cerdo',
  'costillas de cerdo': 'cerdo',
  'bife de chorizo': 'carne',
  'bife de lomo': 'carne',
  'asado de tira': 'asado',
  
  // Verduras específicas
  'tomate perita': 'tomate',
  'tomates perita': 'tomate',
  'tomate cherry': 'tomate',
  'tomates cherry': 'tomate',
  'cebolla morada': 'cebolla',
  'cebolla colorada': 'cebolla',
  'cebolla blanca': 'cebolla',
  'cebolla de verdeo': 'cebolla verdeo',
  'papa blanca': 'papa',
  'papas blancas': 'papa',
  'papa colorada': 'papa',
  'papas coloradas': 'papa',
  'batata': 'batata',
  'batatas': 'batata',
  'zanahoria': 'zanahoria',
  'zanahorias': 'zanahoria',
  'apio': 'apio',
  'lechuga criolla': 'lechuga',
  'lechuga mantecosa': 'lechuga',
  'lechuga capuchina': 'lechuga',
  
  // Frutas específicas
  'manzana roja': 'manzana',
  'manzana verde': 'manzana',
  'manzanas rojas': 'manzana',
  'manzanas verdes': 'manzana',
  'banana': 'banana',
  'bananas': 'banana',
  'plátano': 'banana',
  'plátanos': 'banana',
  'naranja': 'naranja',
  'naranjas': 'naranja',
  'limón': 'limón',
  'limones': 'limón',
  'pera': 'pera',
  'peras': 'pera',
  
  // Productos procesados
  'pan integral': 'pan',
  'pan blanco': 'pan',
  'pan lactal': 'pan lactal',
  'pan de molde': 'pan lactal',
  'arroz integral': 'arroz',
  'arroz blanco': 'arroz',
  'arroz largo fino': 'arroz',
  'fideos integrales': 'fideos',
  'fideos de trigo': 'fideos',
  'fideos tallarines': 'fideos',
  'fideos spaghetti': 'fideos',
  'harina de trigo': 'harina',
  'harina integral': 'harina',
  'harina leudante': 'harina leudante',
  
  // Enlatados y conservas
  'atún al agua': 'atún',
  'atún en agua': 'atún',
  'atún al aceite': 'atún',
  'atún en aceite': 'atún',
  'tomate triturado': 'tomate triturado',
  'tomates triturados': 'tomate triturado',
  'puré de tomate': 'puré tomate',
  'pure de tomate': 'puré tomate',
  'arvejas en lata': 'arvejas',
  'arvejas enlatadas': 'arvejas',
  'choclo en lata': 'choclo',
  'choclo enlatado': 'choclo',
};

// Palabras a eliminar para simplificar búsquedas
const WORDS_TO_REMOVE = [
  // Preparaciones
  'remojado', 'remojada', 'remojados', 'remojadas',
  'cocido', 'cocida', 'cocidos', 'cocidas',
  'hervido', 'hervida', 'hervidos', 'hervidas',
  'frito', 'frita', 'fritos', 'fritas',
  'asado', 'asada', 'asados', 'asadas',
  'picado', 'picada', 'picados', 'picadas',
  'cortado', 'cortada', 'cortados', 'cortadas',
  'rallado', 'rallada', 'rallados', 'ralladas',
  'molido', 'molida', 'molidos', 'molidas',
  'pelado', 'pelada', 'pelados', 'peladas',
  
  // Modificadores
  'sin piel', 'con piel', 'sin hueso', 'con hueso',
  'sin sal', 'con sal', 'sin azúcar', 'con azúcar',
  'sin grasa', 'bajo en grasa', 'light', 'diet',
  'orgánico', 'orgánica', 'orgánicos', 'orgánicas',
  'fresco', 'fresca', 'frescos', 'frescas',
  'congelado', 'congelada', 'congelados', 'congeladas',
  'enlatado', 'enlatada', 'enlatados', 'enlatadas',
  
  // Marcas y especificaciones
  'marca', 'premium', 'económico', 'económica',
  'importado', 'importada', 'nacional',
  
  // Conectores
  'de', 'del', 'la', 'el', 'los', 'las', 
  'un', 'una', 'unos', 'unas',
  'para', 'por', 'en', 'al', 'a la'
];

/**
 * Normaliza y limpia el texto de entrada
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^\w\s]/g, ' ') // Quitar caracteres especiales
    .replace(/\s+/g, ' ') // Múltiples espacios a uno
    .trim();
}

/**
 * Extrae cantidad y unidad del texto
 */
function extractQuantityAndUnit(text: string): {
  quantity?: number;
  unit?: string;
  remainingText: string;
} {
  // Patrón para detectar cantidad y unidad
  const patterns = [
    // Números con unidades directas: "2kg", "500g", "1.5l"
    /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/,
    // Números con unidades separadas: "2 kg", "500 g"
    /^(\d+(?:[.,]\d+)?)\s+([a-zA-Z]+)/,
    // Fracciones: "1/2", "3/4"
    /^(\d+\/\d+)\s*([a-zA-Z]+)?/,
    // Solo números: "2", "10"
    /^(\d+(?:[.,]\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const quantityStr = match[1].replace(',', '.');
      const quantity = quantityStr.includes('/') 
        ? eval(quantityStr) // Evaluar fracciones
        : parseFloat(quantityStr);
      
      const unitRaw = match[2]?.toLowerCase();
      const unit = unitRaw ? (UNIT_MAPPINGS[unitRaw] || unitRaw) : undefined;
      
      const remainingText = text.substring(match[0].length).trim();
      
      return { quantity, unit, remainingText };
    }
  }

  return { remainingText: text };
}

/**
 * Simplifica el nombre del producto para búsqueda en BuscaPrecios
 */
function simplifyProductName(text: string): string {
  const simplified = normalizeText(text);
  
  // Buscar en el mapeo de simplificaciones
  for (const [complex, simple] of Object.entries(INGREDIENT_SIMPLIFICATIONS)) {
    if (simplified.includes(complex)) {
      return simple;
    }
  }
  
  // Eliminar palabras no relevantes
  const words = simplified.split(' ');
  const filteredWords = words.filter(word => 
    !WORDS_TO_REMOVE.includes(word) && word.length > 2
  );
  
  // Si queda muy corto, intentar con la primera palabra significativa
  if (filteredWords.length === 0) {
    const significantWord = words.find(w => w.length > 3);
    return significantWord || simplified;
  }
  
  // Tomar las primeras 2 palabras significativas máximo
  return filteredWords.slice(0, 2).join(' ');
}

/**
 * Determina la categoría del ingrediente
 */
function determineCategory(productName: string): string {
  const categories: Record<string, string[]> = {
    'Carnes y Pescados': ['pollo', 'carne', 'cerdo', 'pescado', 'atún', 'salmón', 'merluza'],
    'Lácteos': ['leche', 'queso', 'yogur', 'manteca', 'crema', 'ricota'],
    'Frutas y Verduras': ['manzana', 'banana', 'naranja', 'tomate', 'lechuga', 'papa', 'cebolla', 'zanahoria'],
    'Panadería': ['pan', 'galletas', 'tostadas', 'facturas'],
    'Despensa': ['arroz', 'fideos', 'harina', 'aceite', 'azúcar', 'sal'],
    'Bebidas': ['agua', 'jugo', 'gaseosa', 'vino', 'cerveza'],
    'Congelados': ['helado', 'verduras congeladas', 'pizza'],
    'Limpieza': ['detergente', 'lavandina', 'jabón'],
  };

  const normalizedName = productName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => normalizedName.includes(keyword))) {
      return category;
    }
  }
  
  return 'Otros';
}

/**
 * Parser principal de ingredientes
 */
export function parseIngredient(text: string): ParsedIngredient {
  const originalText = text.trim();
  const normalized = normalizeText(text);
  
  // Extraer cantidad y unidad
  const { quantity, unit, remainingText } = extractQuantityAndUnit(normalized);
  
  // Simplificar nombre del producto
  const productName = remainingText || normalized;
  const simplifiedQuery = simplifyProductName(productName);
  
  // Determinar categoría
  const category = determineCategory(simplifiedQuery);
  
  return {
    originalText,
    simplifiedQuery,
    quantity,
    unit,
    productName,
    category
  };
}

/**
 * Parser para múltiples ingredientes separados por comas o saltos de línea
 */
export function parseMultipleIngredients(text: string): ParsedIngredient[] {
  // Dividir por comas o saltos de línea
  const lines = text.split(/[,\n]+/).map(line => line.trim()).filter(Boolean);
  
  return lines.map(line => parseIngredient(line));
}

/**
 * Función helper para obtener solo las queries simplificadas
 */
export function getSimplifiedQueries(ingredients: string[]): string[] {
  return ingredients.map(ing => parseIngredient(ing).simplifiedQuery);
}

/**
 * Función para agrupar ingredientes por categoría
 */
export function groupIngredientsByCategory(ingredients: ParsedIngredient[]): Record<string, ParsedIngredient[]> {
  return ingredients.reduce((acc, ingredient) => {
    const category = ingredient.category || 'Otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ingredient);
    return acc;
  }, {} as Record<string, ParsedIngredient[]>);
}