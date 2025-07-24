import { IngredientCategory } from '@/types/pantry';

// Mapeo de productos argentinos a categorías
const PRODUCT_CATEGORIES: Record<string, IngredientCategory> = {
  // Verduras
  'papa': 'verduras',
  'papas': 'verduras',
  'tomate': 'verduras',
  'tomates': 'verduras',
  'cebolla': 'verduras',
  'cebollas': 'verduras',
  'lechuga': 'verduras',
  'zapallo': 'verduras',
  'zanahoria': 'verduras',
  'zanahorias': 'verduras',
  'apio': 'verduras',
  'brócoli': 'verduras',
  'brocoli': 'verduras',
  'coliflor': 'verduras',
  'espinaca': 'verduras',
  'espinacas': 'verduras',
  'acelga': 'verduras',
  'acelgas': 'verduras',
  'palta': 'verduras',
  'paltas': 'verduras',
  'aguacate': 'verduras',
  'rúcula': 'verduras',
  'rucula': 'verduras',
  'radicheta': 'verduras',
  'morrón': 'verduras',
  'morron': 'verduras',
  'pimiento': 'verduras',
  
  // Frutas
  'manzana': 'frutas',
  'manzanas': 'frutas',
  'banana': 'frutas',
  'bananas': 'frutas',
  'plátano': 'frutas',
  'platanos': 'frutas',
  'naranja': 'frutas',
  'naranjas': 'frutas',
  'limón': 'frutas',
  'limon': 'frutas',
  'limones': 'frutas',
  'mandarina': 'frutas',
  'mandarinas': 'frutas',
  'pera': 'frutas',
  'peras': 'frutas',
  'uva': 'frutas',
  'uvas': 'frutas',
  'frutilla': 'frutas',
  'frutillas': 'frutas',
  'durazno': 'frutas',
  'duraznos': 'frutas',
  'ananá': 'frutas',
  'anana': 'frutas',
  'piña': 'frutas',
  'kiwi': 'frutas',
  'melón': 'frutas',
  'melon': 'frutas',
  'sandía': 'frutas',
  'sandia': 'frutas',
  
  // Carnes
  'pollo': 'carnes',
  'pechuga': 'carnes',
  'muslo': 'carnes',
  'carne': 'carnes',
  'bife': 'carnes',
  'asado': 'carnes',
  'costilla': 'carnes',
  'costillas': 'carnes',
  'milanesa': 'carnes',
  'milanesas': 'carnes',
  'churrasco': 'carnes',
  'nalga': 'carnes',
  'cuadril': 'carnes',
  'vacío': 'carnes',
  'vacio': 'carnes',
  'matambre': 'carnes',
  'cerdo': 'carnes',
  'bondiola': 'carnes',
  'jamón': 'carnes',
  'jamon': 'carnes',
  'salame': 'carnes',
  'chorizo': 'carnes',
  'morcilla': 'carnes',
  'pescado': 'carnes',
  'merluza': 'carnes',
  'salmón': 'carnes',
  'salmon': 'carnes',
  
  // Lácteos
  'leche': 'lacteos',
  'yogur': 'lacteos',
  'yogurt': 'lacteos',
  'queso': 'lacteos',
  'manteca': 'lacteos',
  'margarina': 'lacteos',
  'crema': 'lacteos',
  'ricota': 'lacteos',
  'muzzarella': 'lacteos',
  'muzarela': 'lacteos',
  'roquefort': 'lacteos',
  'cremoso': 'lacteos',
  'provoleta': 'lacteos',
  
  // Granos y Cereales
  'arroz': 'granos',
  'fideos': 'granos',
  'pasta': 'granos',
  'espaguetis': 'granos',
  'ñoquis': 'granos',
  'noquis': 'granos',
  'lentejas': 'granos',
  'garbanzos': 'granos',
  'porotos': 'granos',
  'avena': 'granos',
  'quinoa': 'granos',
  'polenta': 'granos',
  'harina': 'granos',
  'pan': 'panaderia',
  'tostadas': 'panaderia',
  'galletas': 'panaderia',
  'galletitas': 'panaderia',
  'facturas': 'panaderia',
  'medialunas': 'panaderia',
  
  // Condimentos y Especias
  'sal': 'condimentos',
  'pimienta': 'condimentos',
  'azúcar': 'condimentos',
  'azucar': 'condimentos',
  'aceite': 'condimentos',
  'vinagre': 'condimentos',
  'mayonesa': 'condimentos',
  'ketchup': 'condimentos',
  'mostaza': 'condimentos',
  'chimichurri': 'condimentos',
  'provenzal': 'condimentos',
  'orégano': 'condimentos',
  'oregano': 'condimentos',
  'perejil': 'condimentos',
  'ajo': 'condimentos',
  'ajos': 'condimentos',
  
  // Bebidas
  'agua': 'bebidas',
  'coca': 'bebidas',
  'coca cola': 'bebidas',
  'pepsi': 'bebidas',
  'sprite': 'bebidas',
  'fanta': 'bebidas',
  'manaos': 'bebidas',
  'jugo': 'bebidas',
  'gaseosa': 'bebidas',
  'cerveza': 'bebidas',
  'vino': 'bebidas',
  'fernet': 'bebidas',
  'whisky': 'bebidas',
  'vodka': 'bebidas',
  'té': 'bebidas',
  'te': 'bebidas',
  'café': 'bebidas',
  'cafe': 'bebidas',
  'mate': 'bebidas',
  'yerba': 'bebidas',
  'yerba mate': 'bebidas',
  'cindor': 'bebidas',
  
  // Enlatados
  'atún': 'enlatados',
  'atun': 'enlatados',
  'sardinas': 'enlatados',
  'tomates': 'enlatados',
  'arvejas': 'enlatados',
  'choclo': 'enlatados',
  'duraznos': 'enlatados',
  'pera': 'enlatados',
  
  // Congelados
  'helado': 'congelados',
  'hamburguesas': 'congelados',
  'papas fritas': 'congelados',
  'pizza': 'congelados',
  'empanadas': 'congelados',
  
  // Snacks
  'papitas': 'snacks',
  'chips': 'snacks',
  'maní': 'snacks',
  'mani': 'snacks',
  'chocolates': 'snacks',
  'chocolate': 'snacks',
  'caramelos': 'snacks',
  'chicles': 'snacks',
  'alfajores': 'snacks',
  'turrones': 'snacks',
  'palitos': 'snacks',
  'conitos': 'snacks',
  'criollitos': 'snacks'
};

// Palabras clave por categoría para coincidencias parciales
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  verduras: ['vegetal', 'verde', 'hoja', 'ensalada'],
  frutas: ['frut', 'dulce', 'jugo', 'natural'],
  carnes: ['carne', 'pollo', 'pescado', 'proteína', 'proteina'],
  lacteos: ['leche', 'queso', 'lácteo', 'lacteo'],
  granos: ['cereal', 'pasta', 'arroz', 'grano'],
  condimentos: ['condimento', 'especia', 'salsa', 'sabor'],
  bebidas: ['bebida', 'líquido', 'liquido', 'refresco'],
  enlatados: ['lata', 'conserva', 'enlatado'],
  congelados: ['congelado', 'frozen', 'helado'],
  panaderia: ['pan', 'harina', 'masa', 'horneado'],
  snacks: ['snack', 'aperitivo', 'dulce', 'golosina'],
  otros: []
};

/**
 * Categoriza automáticamente un producto basado en su nombre
 */
export function categorizeProduct(productName: string): IngredientCategory {
  const normalized = productName.toLowerCase().trim();
  
  // Búsqueda exacta primero
  if (PRODUCT_CATEGORIES[normalized]) {
    return PRODUCT_CATEGORIES[normalized];
  }
  
  // Búsqueda por palabras parciales
  for (const [product, category] of Object.entries(PRODUCT_CATEGORIES)) {
    if (normalized.includes(product) || product.includes(normalized)) {
      return category;
    }
  }
  
  // Búsqueda por palabras clave
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category as IngredientCategory;
      }
    }
  }
  
  // Por defecto, otros
  return 'otros';
}

/**
 * Obtiene sugerencias de categoría para un producto
 */
export function getCategorySuggestions(productName: string): IngredientCategory[] {
  const normalized = productName.toLowerCase().trim();
  const suggestions: Set<IngredientCategory> = new Set();
  
  // Coincidencias parciales
  for (const [product, category] of Object.entries(PRODUCT_CATEGORIES)) {
    if (normalized.includes(product) || product.includes(normalized)) {
      suggestions.add(category);
    }
  }
  
  // Coincidencias por palabras clave
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        suggestions.add(category as IngredientCategory);
      }
    }
  }
  
  return Array.from(suggestions);
}