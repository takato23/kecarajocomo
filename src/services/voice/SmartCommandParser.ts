/**
 * Smart Command Parser
 * Intelligent parsing of voice commands with context awareness
 */

import { ParsedCommand, VoiceParserOptions, VoiceServiceConfig } from './types';

interface CommandPattern {
  pattern: RegExp;
  action: string;
  extract: (match: RegExpMatchArray) => Partial<ParsedCommand>;
}

export class SmartCommandParser {
  private config: Required<VoiceServiceConfig>;
  private commandPatterns: CommandPattern[] = [];
  private ingredientPatterns: RegExp[];
  private unitPatterns: Map<string, string>;

  constructor(config: Required<VoiceServiceConfig>) {
    this.config = config;
    this.initializePatterns();
    this.ingredientPatterns = this.buildIngredientPatterns();
    this.unitPatterns = this.buildUnitMap();
  }

  private initializePatterns(): void {
    // Spanish patterns
    const spanishPatterns: CommandPattern[] = [
      {
        pattern: /^(agrega|añade|agregar|añadir)\s+(.+)$/i,
        action: 'add',
        extract: (match) => ({
          target: match[2],
          parameters: { action: 'add' }
        })
      },
      {
        pattern: /^(busca|buscar|encuentra|encontrar)\s+(.+)$/i,
        action: 'search',
        extract: (match) => ({
          target: match[2],
          parameters: { action: 'search' }
        })
      },
      {
        pattern: /^(ir a|ve a|navega a|abre|abrir)\s+(.+)$/i,
        action: 'navigate',
        extract: (match) => ({
          target: match[2],
          parameters: { action: 'navigate' }
        })
      },
      {
        pattern: /^(pon|poner|establece|establecer)\s+(un\s+)?temporizador\s+(de\s+)?(\d+)\s*(minutos?|segundos?|horas?)$/i,
        action: 'timer',
        extract: (match) => ({
          target: 'timer',
          parameters: {
            action: 'timer',
            duration: parseInt(match[4]),
            unit: match[5]
          }
        })
      },
      {
        pattern: /^(muestra|mostrar|dame|dar)\s+(recetas?)\s+(con|que tengan|para)\s+(.+)$/i,
        action: 'recipe',
        extract: (match) => ({
          target: 'recipe',
          parameters: {
            action: 'recipe',
            ingredients: match[4]
          }
        })
      },
      {
        pattern: /^(qué|que)\s+(puedo|podría)\s+(cocinar|hacer|preparar)(\s+con\s+(.+))?$/i,
        action: 'recipe',
        extract: (match) => ({
          target: 'recipe_suggestion',
          parameters: {
            action: 'recipe',
            type: 'suggestion',
            ingredients: match[5] || 'pantry'
          }
        })
      }
    ];

    // English patterns (for multilingual support)
    const englishPatterns: CommandPattern[] = [
      {
        pattern: /^(add|put)\s+(.+)$/i,
        action: 'add',
        extract: (match) => ({
          target: match[2],
          parameters: { action: 'add' }
        })
      },
      {
        pattern: /^(search|find|look for)\s+(.+)$/i,
        action: 'search',
        extract: (match) => ({
          target: match[2],
          parameters: { action: 'search' }
        })
      },
      {
        pattern: /^(go to|open|navigate to)\s+(.+)$/i,
        action: 'navigate',
        extract: (match) => ({
          target: match[2],
          parameters: { action: 'navigate' }
        })
      },
      {
        pattern: /^(set|create)\s+(a\s+)?timer\s+(for\s+)?(\d+)\s*(minutes?|seconds?|hours?)$/i,
        action: 'timer',
        extract: (match) => ({
          target: 'timer',
          parameters: {
            action: 'timer',
            duration: parseInt(match[4]),
            unit: match[5]
          }
        })
      }
    ];

    // Select patterns based on language
    this.commandPatterns = this.config.language.startsWith('es') 
      ? spanishPatterns 
      : englishPatterns;
  }

  private buildIngredientPatterns(): RegExp[] {
    return [
      // Quantity + unit + ingredient
      /(\d+(?:\.\d+)?)\s*(kg|kilos?|gramos?|g|litros?|l|ml|tazas?|cucharadas?|cdas?|cdtas?|unidades?|piezas?)\s+(?:de\s+)?(.+)/i,
      // Quantity + ingredient
      /(\d+(?:\.\d+)?)\s+(.+)/i,
      // Descriptive quantities
      /(un|una|dos|tres|cuatro|cinco|medio|media)\s+(.+)/i,
    ];
  }

  private buildUnitMap(): Map<string, string> {
    return new Map([
      ['kilo', 'kg'],
      ['kilos', 'kg'],
      ['kilogramo', 'kg'],
      ['kilogramos', 'kg'],
      ['gramo', 'g'],
      ['gramos', 'g'],
      ['gr', 'g'],
      ['litro', 'l'],
      ['litros', 'l'],
      ['lt', 'l'],
      ['mililitro', 'ml'],
      ['mililitros', 'ml'],
      ['taza', 'cup'],
      ['tazas', 'cups'],
      ['cucharada', 'tbsp'],
      ['cucharadas', 'tbsp'],
      ['cda', 'tbsp'],
      ['cdas', 'tbsp'],
      ['cucharadita', 'tsp'],
      ['cucharaditas', 'tsp'],
      ['cdta', 'tsp'],
      ['cdtas', 'tsp'],
      ['unidad', 'unit'],
      ['unidades', 'units'],
      ['pieza', 'piece'],
      ['piezas', 'pieces'],
    ]);
  }

  async parse(transcript: string, options: VoiceParserOptions = {}): Promise<ParsedCommand> {
    const normalizedTranscript = this.normalizeTranscript(transcript);
    
    // Try to match command patterns
    for (const pattern of this.commandPatterns) {
      const match = normalizedTranscript.match(pattern.pattern);
      if (match) {
        const extracted = pattern.extract(match);
        const command = await this.enrichCommand({
          action: pattern.action,
          target: extracted.target,
          parameters: extracted.parameters || {},
          entities: {},
          confidence: this.calculateConfidence(transcript, match),
          context: options.context
        }, normalizedTranscript);
        
        return command;
      }
    }

    // If no pattern matches, try to infer intent
    return this.inferIntent(normalizedTranscript, options);
  }

  private normalizeTranscript(transcript: string): string {
    return transcript
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[¿?¡!]/g, '');
  }

  private async enrichCommand(
    command: ParsedCommand, 
    transcript: string
  ): Promise<ParsedCommand> {
    // Extract entities based on command action
    switch (command.action) {
      case 'add':
        command.entities.ingredients = this.extractIngredients(command.target || transcript);
        break;
      case 'search':
        command.entities.ingredients = this.extractIngredients(command.target || transcript);
        break;
      case 'recipe':
        if (command.parameters.ingredients) {
          command.entities.ingredients = this.extractIngredients(command.parameters.ingredients);
        }
        break;
      case 'navigate':
        command.entities.locations = this.extractLocations(command.target || transcript);
        break;
    }

    return command;
  }

  private extractIngredients(text: string): Array<{ name: string; quantity?: number; unit?: string }> {
    const ingredients: Array<{ name: string; quantity?: number; unit?: string }> = [];
    
    // Split by common separators
    const items = text.split(/\s*(?:,|y|e)\s*/i);
    
    for (const item of items) {
      let matched = false;
      
      // Try each pattern
      for (const pattern of this.ingredientPatterns) {
        const match = item.match(pattern);
        if (match) {
          const quantity = this.parseQuantity(match[1]);
          const unit = match[2] ? this.normalizeUnit(match[2]) : undefined;
          const name = match[3] || match[2];
          
          ingredients.push({
            name: name.trim(),
            quantity,
            unit
          });
          
          matched = true;
          break;
        }
      }
      
      // If no pattern matched, add as simple ingredient
      if (!matched && item.trim()) {
        ingredients.push({ name: item.trim() });
      }
    }
    
    return ingredients;
  }

  private parseQuantity(quantityStr: string): number {
    const numbers: Record<string, number> = {
      'un': 1,
      'una': 1,
      'dos': 2,
      'tres': 3,
      'cuatro': 4,
      'cinco': 5,
      'seis': 6,
      'siete': 7,
      'ocho': 8,
      'nueve': 9,
      'diez': 10,
      'medio': 0.5,
      'media': 0.5,
    };
    
    return numbers[quantityStr.toLowerCase()] || parseFloat(quantityStr) || 1;
  }

  private normalizeUnit(unit: string): string {
    return this.unitPatterns.get(unit.toLowerCase()) || unit.toLowerCase();
  }

  private extractLocations(text: string): string[] {
    const locations: Record<string, string[]> = {
      'despensa': ['pantry', 'despensa'],
      'pantry': ['pantry', 'despensa'],
      'recetas': ['recipes', 'recetas'],
      'recipes': ['recipes', 'recetas'],
      'lista': ['shopping', 'lista de compras'],
      'compras': ['shopping', 'lista de compras'],
      'shopping': ['shopping', 'lista de compras'],
      'perfil': ['profile', 'perfil'],
      'profile': ['profile', 'perfil'],
      'configuración': ['settings', 'configuración'],
      'settings': ['settings', 'configuración'],
      'inicio': ['home', 'inicio'],
      'home': ['home', 'inicio'],
    };
    
    const words = text.toLowerCase().split(/\s+/);
    const found: string[] = [];
    
    for (const word of words) {
      if (locations[word]) {
        found.push(locations[word][0]); // Return English key
      }
    }
    
    return found.length > 0 ? found : [text];
  }

  private calculateConfidence(transcript: string, match: RegExpMatchArray): number {
    // Base confidence from transcript length and match quality
    const baseConfidence = 0.7;
    
    // Bonus for exact matches
    const exactMatchBonus = match[0] === transcript ? 0.2 : 0;
    
    // Penalty for very short transcripts
    const lengthPenalty = transcript.length < 5 ? -0.1 : 0;
    
    return Math.min(1, Math.max(0, baseConfidence + exactMatchBonus + lengthPenalty));
  }

  private async inferIntent(
    transcript: string, 
    options: VoiceParserOptions
  ): Promise<ParsedCommand> {
    // Keywords for intent inference
    const intentKeywords = {
      add: ['agrega', 'añade', 'pon', 'agregar', 'añadir', 'poner', 'necesito', 'comprar'],
      search: ['busca', 'encuentra', 'dónde', 'donde', 'buscar', 'encontrar'],
      navigate: ['ir', 've', 'abre', 'muestra', 'llévame', 'abrir', 'mostrar'],
      recipe: ['receta', 'cocinar', 'preparar', 'hacer', 'comer'],
      timer: ['timer', 'temporizador', 'alarma', 'tiempo'],
    };
    
    let bestIntent = 'unknown';
    let bestScore = 0;
    
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      const score = keywords.filter(kw => transcript.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }
    
    return {
      action: bestIntent,
      target: transcript,
      parameters: { inferred: true },
      entities: {
        ingredients: this.extractIngredients(transcript),
      },
      confidence: bestScore > 0 ? 0.5 : 0.3,
      context: options.context
    };
  }

  updateConfig(config: Required<VoiceServiceConfig>): void {
    this.config = config;
    this.initializePatterns();
  }
}