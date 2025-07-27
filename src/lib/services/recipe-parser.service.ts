import type {
  ParsedRecipe,
  ParsedIngredient,
  RecipeImportResult,
  IngredientSuggestion,
  DifficultyLevel,
  RecipeCategory,
  CuisineType
} from '../../types/recipes';
import type { IngredientParserConfig } from '../../types/pantry';
import { supabase } from '../supabase/client';
import { logger } from '@/services/logger';

export class RecipeParserService {
  private static instance: RecipeParserService;
  
  static getInstance(): RecipeParserService {
    if (!RecipeParserService.instance) {
      RecipeParserService.instance = new RecipeParserService();
    }
    return RecipeParserService.instance;
  }

  private config: IngredientParserConfig = {
    language: 'es',
    auto_categorize: true,
    fuzzy_matching: true,
    phonetic_matching: true,
    confidence_threshold: 0.7
  };

  // =====================================================
  // MAIN PARSING METHODS
  // =====================================================

  async parseRecipeFromText(text: string): Promise<ParsedRecipe> {
    try {
      const sections = this.extractSections(text);
      
      const parsedRecipe: ParsedRecipe = {
        name: this.extractName(sections.title || text),
        description: this.extractDescription(sections.description),
        ingredients: await this.parseIngredients(sections.ingredients || []),
        instructions: this.parseInstructions(sections.instructions || []),
        cook_time: this.extractCookTime(text),
        prep_time: this.extractPrepTime(text),
        servings: this.extractServings(text),
        source_url: this.extractUrl(text),
        confidence: 0.8,
        warnings: []
      };

      // Validate parsed data
      const validation = this.validateParsedRecipe(parsedRecipe);
      parsedRecipe.confidence = validation.confidence;
      parsedRecipe.warnings = validation.warnings;

      return parsedRecipe;
    } catch (error: unknown) {
      throw new Error(`Failed to parse recipe: ${error.message}`);
    }
  }

  async parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
    try {
      // Fetch and extract content from URL
      const content = await this.fetchRecipeFromUrl(url);
      const parsedRecipe = await this.parseRecipeFromText(content);
      
      parsedRecipe.source_url = url;
      parsedRecipe.confidence *= 0.9; // Slight confidence reduction for web scraping

      return parsedRecipe;
    } catch (error: unknown) {
      throw new Error(`Failed to parse recipe from URL: ${error.message}`);
    }
  }

  async importRecipe(source: string, sourceType: 'text' | 'url' | 'image'): Promise<RecipeImportResult> {
    try {
      let parsedRecipe: ParsedRecipe;
      const errors: string[] = [];
      const warnings: string[] = [];

      switch (sourceType) {
        case 'text':
          parsedRecipe = await this.parseRecipeFromText(source);
          break;
        case 'url':
          parsedRecipe = await this.parseRecipeFromUrl(source);
          break;
        case 'image':
          // TODO: Implement OCR functionality
          throw new Error('Image parsing not yet implemented');
        default:
          throw new Error('Unsupported source type');
      }

      // Save import record
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        await supabase.from('recipe_imports').insert({
          user_id: user.data.user.id,
          source_type: sourceType,
          source_data: source,
          source_url: sourceType === 'url' ? source : undefined,
          parsing_confidence: parsedRecipe.confidence,
          parsing_warnings: parsedRecipe.warnings,
          parsed_data: parsedRecipe,
          success: parsedRecipe.confidence >= this.config.confidence_threshold
        });
      }

      return {
        success: parsedRecipe.confidence >= this.config.confidence_threshold,
        recipe: parsedRecipe.confidence >= this.config.confidence_threshold ? await this.convertToRecipe(parsedRecipe) : undefined,
        errors,
        warnings: [...warnings, ...parsedRecipe.warnings],
        parsed_data: parsedRecipe
      };
    } catch (error: unknown) {
      return {
        success: false,
        errors: [error.message],
        warnings: [],
        parsed_data: {} as ParsedRecipe
      };
    }
  }

  // =====================================================
  // INGREDIENT PARSING
  // =====================================================

  async parseIngredients(ingredientTexts: string[]): Promise<ParsedIngredient[]> {
    const parsedIngredients: ParsedIngredient[] = [];

    for (const text of ingredientTexts) {
      const parsed = await this.parseIngredient(text);
      parsedIngredients.push(parsed);
    }

    return parsedIngredients;
  }

  private async parseIngredient(text: string): Promise<ParsedIngredient> {
    const cleanText = text.trim();
    
    // Extract quantity and unit
    const quantityMatch = cleanText.match(/^(\d+(?:[.,]\d+)?)\s*([^\d\s]+)?/);
    const quantity = quantityMatch ? parseFloat(quantityMatch[1].replace(',', '.')) : undefined;
    const unit = quantityMatch ? this.normalizeUnit(quantityMatch[2]) : undefined;

    // Extract ingredient name (remove quantity/unit)
    let ingredientName = cleanText;
    if (quantityMatch) {
      ingredientName = cleanText.replace(quantityMatch[0], '').trim();
    }

    // Extract preparation notes
    const preparationMatch = ingredientName.match(/[,\(]([^,\)]+(?:picad[oa]|rallad[oa]|cortad[oa]|trozo|cubo|rebanada|diente|hoja)s?[^,\)]*)/i);
    const preparation = preparationMatch ? preparationMatch[1].trim() : undefined;
    
    if (preparation) {
      ingredientName = ingredientName.replace(preparationMatch[0], '').trim();
    }

    // Normalize ingredient name
    const normalizedName = this.normalizeIngredientName(ingredientName);

    // Find ingredient suggestions
    const suggestions = await this.findIngredientSuggestions(normalizedName);

    // Determine if optional
    const optional = /opcional|al gusto|si desea/i.test(cleanText);

    // Calculate confidence based on various factors
    let confidence = 0.5;
    if (quantity !== undefined) confidence += 0.2;
    if (unit !== undefined) confidence += 0.1;
    if (suggestions.length > 0 && suggestions[0].score > 0.8) confidence += 0.2;

    return {
      raw_text: cleanText,
      name: normalizedName,
      quantity,
      unit,
      preparation,
      optional,
      confidence,
      suggestions
    };
  }

  private async findIngredientSuggestions(name: string): Promise<IngredientSuggestion[]> {
    try {
      // Search in ingredients database
      const { data: ingredients, error } = await supabase
        .from('ingredients')
        .select('*')
        .or(`name.ilike.%${name}%,aliases.cs.{${name}},search_keywords.cs.{${name}}`);

      if (error) throw error;

      const suggestions: IngredientSuggestion[] = [];

      ingredients?.forEach(ingredient => {
        let score = 0;
        let matchType: 'exact' | 'partial' | 'category' | 'phonetic' = 'partial';

        // Exact match
        if (ingredient.name.toLowerCase() === name.toLowerCase()) {
          score = 1.0;
          matchType = 'exact';
        }
        // Partial match in name
        else if (ingredient.name.toLowerCase().includes(name.toLowerCase())) {
          score = 0.8;
          matchType = 'partial';
        }
        // Alias match
        else if (ingredient.aliases?.some(alias => 
          alias.toLowerCase().includes(name.toLowerCase())
        )) {
          score = 0.7;
          matchType = 'partial';
        }
        // Keyword match
        else if (ingredient.search_keywords?.some(keyword => 
          keyword.toLowerCase().includes(name.toLowerCase())
        )) {
          score = 0.6;
          matchType = 'category';
        }

        if (score > 0) {
          suggestions.push({
            ingredient,
            score,
            match_type: matchType
          });
        }
      });

      // Sort by score descending
      return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
    } catch (error: unknown) {
      logger.error('Error finding ingredient suggestions:', 'recipe-parser.service', error);
      return [];
    }
  }

  // =====================================================
  // TEXT EXTRACTION METHODS
  // =====================================================

  private extractSections(text: string) {
    const sections: any = {};
    
    // Common Spanish recipe section headers
    const patterns = {
      title: /^(.+?)(?:\n|ingredientes|instrucciones|preparación)/i,
      ingredients: /(?:ingredientes?|materiales?)[:\s]*\n?((?:.|\n)*?)(?:\n\s*(?:instrucciones?|preparación|modo|pasos?)|$)/i,
      instructions: /(?:instrucciones?|preparación|modo|pasos?)[:\s]*\n?((?:.|\n)*?)(?:\n\s*(?:notas?|tips?)|$)/i,
      description: /(?:descripción)[:\s]*\n?((?:.|\n)*?)(?:\n\s*(?:ingredientes?|instrucciones?)|$)/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        if (key === 'ingredients' || key === 'instructions') {
          sections[key] = match[1].split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.match(/^[-•*]\s*$/));
        } else {
          sections[key] = match[1].trim();
        }
      }
    }

    return sections;
  }

  private extractName(text: string): string {
    // Remove common prefixes and clean up
    const cleanName = text
      .replace(/^(receta\s+de?\s*|como\s+hacer\s*)/i, '')
      .split('\n')[0]
      .trim();
    
    return cleanName || 'Receta sin nombre';
  }

  private extractDescription(description?: string): string {
    return description?.trim() || '';
  }

  private extractCookTime(text: string): number | undefined {
    const patterns = [
      /(?:tiempo\s+de\s+)?cocci[óo]n[:\s]*(\d+)\s*(?:min|minutos?)/i,
      /cocinar\s+(?:por\s+)?(\d+)\s*(?:min|minutos?)/i,
      /hornear\s+(?:por\s+)?(\d+)\s*(?:min|minutos?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private extractPrepTime(text: string): number | undefined {
    const patterns = [
      /(?:tiempo\s+de\s+)?preparaci[óo]n[:\s]*(\d+)\s*(?:min|minutos?)/i,
      /preparar\s+(?:en\s+)?(\d+)\s*(?:min|minutos?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private extractServings(text: string): number | undefined {
    const patterns = [
      /(?:para\s+|rinde\s+|sirve\s+)?(\d+)\s*(?:personas?|porciones?|raciones?)/i,
      /(?:porciones?|raciones?)[:\s]*(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private extractUrl(text: string): string | undefined {
    const urlPattern = /https?:\/\/[^\s]+/i;
    const match = text.match(urlPattern);
    return match ? match[0] : undefined;
  }

  private parseInstructions(instructionTexts: string[]): string[] {
    return instructionTexts
      .map(text => text.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(text => text.length > 0);
  }

  // =====================================================
  // NORMALIZATION METHODS
  // =====================================================

  private normalizeUnit(unit?: string): string | undefined {
    if (!unit) return undefined;

    const unitMappings: Record<string, string> = {
      'gr': 'g',
      'gramos': 'g',
      'gramo': 'g',
      'kg': 'kg',
      'kilogramo': 'kg',
      'kilogramos': 'kg',
      'ml': 'ml',
      'mililitro': 'ml',
      'mililitros': 'ml',
      'l': 'l',
      'litro': 'l',
      'litros': 'l',
      'taza': 'cup',
      'tazas': 'cup',
      'cucharada': 'tbsp',
      'cucharadas': 'tbsp',
      'cdta': 'tsp',
      'cucharadita': 'tsp',
      'cucharaditas': 'tsp',
      'pizca': 'pinch',
      'pizcas': 'pinch',
      'unidad': 'pcs',
      'unidades': 'pcs',
      'pieza': 'pcs',
      'piezas': 'pcs',
      'diente': 'clove',
      'dientes': 'cloves',
      'rama': 'sprig',
      'ramas': 'sprigs',
      'hoja': 'leaf',
      'hojas': 'leaves'
    };

    const normalizedUnit = unit.toLowerCase().trim();
    return unitMappings[normalizedUnit] || normalizedUnit;
  }

  private normalizeIngredientName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '');
  }

  // =====================================================
  // WEB SCRAPING
  // =====================================================

  private async fetchRecipeFromUrl(url: string): Promise<string> {
    try {
      // This would typically use a web scraping service or API
      // For now, we'll simulate it or use a simple fetch
      const response = await fetch(url);
      const html = await response.text();

      // Extract text content from HTML
      // This is a simplified version - in production, you'd use a proper HTML parser
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return textContent;
    } catch (error: unknown) {
      throw new Error(`Failed to fetch recipe from URL: ${error.message}`);
    }
  }

  // =====================================================
  // VALIDATION AND CONVERSION
  // =====================================================

  private validateParsedRecipe(recipe: ParsedRecipe): { confidence: number; warnings: string[] } {
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check required fields
    if (!recipe.name || recipe.name === 'Receta sin nombre') {
      warnings.push('No se pudo extraer el nombre de la receta');
      confidence -= 0.2;
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      warnings.push('No se encontraron ingredientes');
      confidence -= 0.3;
    }

    if (!recipe.instructions || recipe.instructions.length === 0) {
      warnings.push('No se encontraron instrucciones');
      confidence -= 0.3;
    }

    // Check ingredient confidence
    const lowConfidenceIngredients = recipe.ingredients?.filter(ing => ing.confidence < 0.5) || [];
    if (lowConfidenceIngredients.length > 0) {
      warnings.push(`${lowConfidenceIngredients.length} ingredientes tienen baja confianza de parsing`);
      confidence -= 0.1;
    }

    // Check for missing units or quantities
    const missingQuantities = recipe.ingredients?.filter(ing => ing.quantity === undefined) || [];
    if (missingQuantities.length > recipe.ingredients?.length * 0.5) {
      warnings.push('Muchos ingredientes no tienen cantidad especificada');
      confidence -= 0.1;
    }

    return { confidence: Math.max(0, confidence), warnings };
  }

  private async convertToRecipe(parsedRecipe: ParsedRecipe): Promise<any> {
    // Convert ParsedRecipe to Recipe format for database insertion
    return {
      name: parsedRecipe.name,
      description: parsedRecipe.description || '',
      prep_time: parsedRecipe.prep_time || 0,
      cook_time: parsedRecipe.cook_time || 0,
      servings: parsedRecipe.servings || 4,
      difficulty: this.estimateDifficulty(parsedRecipe),
      category: this.categorizeRecipe(parsedRecipe),
      cuisine_type: this.detectCuisine(parsedRecipe),
      source_url: parsedRecipe.source_url,
      ai_generated: false,
      ingredients: parsedRecipe.ingredients,
      instructions: parsedRecipe.instructions
    };
  }

  private estimateDifficulty(recipe: ParsedRecipe): DifficultyLevel {
    let difficultyScore = 0;

    // Factor in number of ingredients
    const ingredientCount = recipe.ingredients?.length || 0;
    if (ingredientCount > 15) difficultyScore += 2;
    else if (ingredientCount > 10) difficultyScore += 1;

    // Factor in number of steps
    const stepCount = recipe.instructions?.length || 0;
    if (stepCount > 10) difficultyScore += 2;
    else if (stepCount > 5) difficultyScore += 1;

    // Factor in cooking time
    const totalTime = (recipe.cook_time || 0) + (recipe.prep_time || 0);
    if (totalTime > 120) difficultyScore += 2;
    else if (totalTime > 60) difficultyScore += 1;

    // Check for complex techniques in instructions
    const complexTechniques = [
      'temperar', 'flamear', 'glasear', 'reducir', 'emulsionar',
      'blanquear', 'confit', 'sous vide', 'marinado'
    ];
    const hasComplexTechniques = recipe.instructions?.some(instruction =>
      complexTechniques.some(technique => instruction.toLowerCase().includes(technique))
    );
    if (hasComplexTechniques) difficultyScore += 2;

    // Convert score to difficulty level
    if (difficultyScore >= 5) return 'experto';
    if (difficultyScore >= 3) return 'dificil';
    if (difficultyScore >= 1) return 'intermedio';
    return 'facil';
  }

  private categorizeRecipe(recipe: ParsedRecipe): RecipeCategory {
    const name = recipe.name.toLowerCase();
    const description = (recipe.description || '').toLowerCase();
    const text = `${name} ${description}`.toLowerCase();

    // Category keywords
    const categoryKeywords: Record<RecipeCategory, string[]> = {
      desayuno: ['desayuno', 'mañana', 'café', 'jugo', 'cereal', 'tostada', 'huevo', 'pancake'],
      almuerzo: ['almuerzo', 'comida', 'mediodía'],
      cena: ['cena', 'noche'],
      postre: ['postre', 'dulce', 'pastel', 'helado', 'flan', 'torta', 'galleta', 'chocolate'],
      bebida: ['bebida', 'jugo', 'smoothie', 'batido', 'agua', 'té', 'café', 'coctel'],
      ensalada: ['ensalada', 'lechuga', 'verdura'],
      sopa: ['sopa', 'caldo', 'crema', 'consomé'],
      pasta: ['pasta', 'espagueti', 'macarrón', 'lasaña', 'fideos'],
      pizza: ['pizza'],
      sandwich: ['sandwich', 'bocadillo', 'torta', 'hamburguesa'],
      snack: ['snack', 'botana', 'aperitivo', 'antojito'],
      aperitivo: ['aperitivo', 'entrada', 'canapé'],
      parrilla: ['parrilla', 'asado', 'barbacoa', 'grill'],
      vegetariano: ['vegetariano', 'vegetal'],
      vegano: ['vegano'],
      sin_gluten: ['sin gluten', 'libre de gluten']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category as RecipeCategory;
      }
    }

    return 'otros';
  }

  private detectCuisine(recipe: ParsedRecipe): CuisineType | undefined {
    const text = `${recipe.name} ${recipe.description || ''}`.toLowerCase();

    const cuisineKeywords: Record<CuisineType, string[]> = {
      mexicana: ['mexicana', 'tacos', 'quesadilla', 'chile', 'salsa', 'tortilla', 'mole'],
      italiana: ['italiana', 'pasta', 'pizza', 'risotto', 'parmesano', 'albahaca', 'tomate'],
      asiatica: ['asiática', 'soja', 'jengibre', 'sesamo', 'wasabi'],
      china: ['china', 'wok', 'soja', 'arroz frito'],
      japonesa: ['japonesa', 'sushi', 'sashimi', 'tempura', 'miso'],
      tailandesa: ['tailandesa', 'curry', 'coco', 'lima'],
      francesa: ['francesa', 'beurre', 'croissant', 'baguette'],
      americana: ['americana', 'hamburguesa', 'barbacoa', 'maple'],
      mediterranea: ['mediterránea', 'oliva', 'aceitunas', 'feta'],
      india: ['india', 'curry', 'especias', 'garam masala', 'tandoor'],
      peruana: ['peruana', 'ceviche', 'ají', 'quinoa'],
      argentina: ['argentina', 'asado', 'chimichurri', 'empanada'],
      fusion: ['fusión', 'fusion'],
      internacional: ['internacional']
    };

    for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return cuisine as CuisineType;
      }
    }

    return undefined;
  }
}

// Export singleton instance
export const recipeParserService = RecipeParserService.getInstance();