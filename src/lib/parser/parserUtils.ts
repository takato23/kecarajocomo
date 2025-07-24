// Common Spanish ingredient modifiers to remove
const MODIFIERS = [
  'fresco', 'fresca', 'frescos', 'frescas',
  'cocido', 'cocida', 'cocidos', 'cocidas',
  'crudo', 'cruda', 'crudos', 'crudas',
  'grande', 'grandes', 'pequeño', 'pequeña',
  'maduro', 'madura', 'verde', 'verdes',
  'picado', 'picada', 'picados', 'picadas',
  'rallado', 'rallada', 'rallados', 'ralladas',
  'molido', 'molida', 'molidos', 'molidas'
];

// Category keywords mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Lácteos': ['leche', 'yogur', 'queso', 'manteca', 'crema', 'ricotta', 'mantequilla'],
  'Carnes': ['carne', 'pollo', 'cerdo', 'vaca', 'pescado', 'atún', 'salmón', 'ternera'],
  'Verduras': ['lechuga', 'tomate', 'cebolla', 'papa', 'zanahoria', 'zapallo', 'espinaca', 'brócoli'],
  'Frutas': ['manzana', 'banana', 'naranja', 'pera', 'uva', 'frutilla', 'durazno', 'limón'],
  'Panadería': ['pan', 'galletas', 'tostadas', 'facturas', 'medialunas', 'bizcochos'],
  'Almacén': ['arroz', 'fideos', 'aceite', 'azúcar', 'sal', 'harina', 'pasta', 'polenta'],
  'Bebidas': ['agua', 'jugo', 'gaseosa', 'cerveza', 'vino', 'café', 'té', 'mate'],
  'Limpieza': ['detergente', 'jabón', 'lavandina', 'esponja', 'papel', 'servilletas'],
  'Especias': ['sal', 'pimienta', 'orégano', 'perejil', 'ajo', 'cebolla', 'comino', 'pimentón'],
  'Congelados': ['helado', 'hamburguesa', 'milanesa', 'empanada', 'pizza'],
};

// Unit conversions and normalizations
const UNIT_NORMALIZATIONS: Record<string, string> = {
  'kilo': 'kg',
  'kilos': 'kg',
  'kilogramo': 'kg',
  'kilogramos': 'kg',
  'gramo': 'g',
  'gramos': 'g',
  'gr': 'g',
  'litro': 'l',
  'litros': 'l',
  'lt': 'l',
  'mililitro': 'ml',
  'mililitros': 'ml',
  'cc': 'ml',
  'unidad': 'un',
  'unidades': 'un',
  'u': 'un',
  'docena': 'doc',
  'docenas': 'doc',
  'paquete': 'paq',
  'paquetes': 'paq',
  'bolsa': 'bolsa',
  'bolsas': 'bolsa',
  'atado': 'atado',
  'atados': 'atado',
  'lata': 'lata',
  'latas': 'lata',
};

export const parserUtils = {
  // Extract base ingredient name by removing modifiers
  extractBaseIngredientName(query: string): string {
    let normalized = query.toLowerCase().trim();
    
    // Remove quantities and units
    normalized = normalized.replace(/\d+(?:\.\d+)?\s*(kg|g|l|ml|cc|unidades?|paquetes?|bolsas?|docenas?|latas?|atados?)/gi, '');
    
    // Remove modifiers
    MODIFIERS.forEach(modifier => {
      const regex = new RegExp(`\\b${modifier}\\b`, 'gi');
      normalized = normalized.replace(regex, '');
    });
    
    // Remove preparation methods
    const preparations = ['en cubos', 'en rodajas', 'en juliana', 'en tiras', 'en dados'];
    preparations.forEach(prep => {
      normalized = normalized.replace(prep, '');
    });
    
    // Remove extra spaces
    return normalized.replace(/\s+/g, ' ').trim();
  },

  // Normalize product name for consistency
  normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' ')
      .trim();
  },

  // Simplify ingredient query for search
  simplifyIngredientQuery(query: string): string {
    const base = this.extractBaseIngredientName(query);
    
    // Map to simpler terms for better search results
    const simplifications: Record<string, string> = {
      'mantequilla': 'manteca',
      'mantequilla de maní': 'mantequilla mani',
      'pasta de dientes': 'dentifrico',
      'papel higiénico': 'papel higienico',
      'aceite de oliva': 'aceite oliva',
      'queso crema': 'queso crema philadelphia',
      'crema de leche': 'crema',
      'harina de trigo': 'harina',
      'azúcar blanca': 'azucar',
      'sal fina': 'sal',
      'pimienta negra': 'pimienta',
    };
    
    return simplifications[base] || base;
  },

  // Categorize product based on name
  categorizeProduct(name: string): string {
    const normalized = this.normalizeProductName(name);
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        return category;
      }
    }
    
    return 'Otros';
  },

  // Parse quantity from text
  parseQuantity(text: string): { amount: number; unit: string } {
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?/);
    
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      const unitRaw = match[2]?.toLowerCase() || 'unidad';
      const unit = UNIT_NORMALIZATIONS[unitRaw] || unitRaw;
      
      return { amount, unit };
    }
    
    return { amount: 1, unit: 'un' };
  },

  // Normalize units for consistency
  normalizeUnit(unit: string): string {
    const normalized = unit.toLowerCase().trim();
    return UNIT_NORMALIZATIONS[normalized] || normalized;
  },

  // Parse price from text (handles Argentine format)
  parsePrice(text: string): number | null {
    // Remove currency symbols and spaces
    const cleaned = text.replace(/[$\s.]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    
    return isNaN(price) ? null : price;
  },

  // Extract brand from product name
  extractBrand(productName: string): { name: string; brand: string | null } {
    // Common Argentine brands
    const brands = [
      'La Serenísima', 'Sancor', 'Marolio', 'Muy Bueno', 'Arcor',
      'Bagley', 'Terrabusi', 'Molinos', 'Ledesma', 'Quilmes',
      'Coca Cola', 'Pepsi', 'Sprite', 'Fanta', 'Cunnington',
      'Knorr', 'Maggi', 'Hellmanns', 'Natura', 'Cocinero',
      'Skip', 'Ala', 'Magistral', 'Ariel', 'Comfort'
    ];
    
    const normalizedName = productName;
    let foundBrand: string | null = null;
    let cleanName = normalizedName;
    
    for (const brand of brands) {
      const brandRegex = new RegExp(`\\b${brand}\\b`, 'i');
      if (brandRegex.test(normalizedName)) {
        foundBrand = brand;
        cleanName = normalizedName.replace(brandRegex, '').trim();
        break;
      }
    }
    
    return {
      name: cleanName,
      brand: foundBrand
    };
  },

  // Format product for display
  formatProductDisplay(product: {
    name: string;
    brand?: string | null;
    quantity?: number;
    unit?: string;
    price?: number;
  }): string {
    let display = product.name;
    
    if (product.brand) {
      display = `${product.brand} ${display}`;
    }
    
    if (product.quantity && product.unit) {
      display += ` ${product.quantity}${product.unit}`;
    }
    
    if (product.price) {
      display += ` - $${product.price.toFixed(2)}`;
    }
    
    return display;
  }
};