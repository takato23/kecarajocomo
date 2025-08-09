/**
 * Receipt Processing Service
 * Advanced receipt OCR and item extraction for shopping list automation
 */

import { logger } from '@/services/logger';
import { receiptOCR, type ReceiptItem, type ReceiptData } from '@/lib/services/receiptOCR';

export interface ProcessedReceiptItem extends ReceiptItem {
  matchedPantryItem?: {
    id: string;
    name: string;
    category: string;
  };
  confidence: number;
  suggestedAction: 'add_to_pantry' | 'mark_purchased' | 'ignore';
  reasoning: string;
}

export interface ReceiptProcessingResult {
  receipt: ReceiptData;
  processedItems: ProcessedReceiptItem[];
  summary: {
    totalItems: number;
    totalAmount: number;
    pantryMatches: number;
    shoppingListMatches: number;
    newItems: number;
    confidence: number;
  };
  suggestions: {
    pantryAdditions: ProcessedReceiptItem[];
    shoppingListUpdates: ProcessedReceiptItem[];
    priceUpdates: Array<{
      item: string;
      oldPrice?: number;
      newPrice: number;
      store: string;
    }>;
  };
}

export interface ReceiptProcessingOptions {
  autoAddToPantry: boolean;
  autoMarkPurchased: boolean;
  confidenceThreshold: number;
  includeNonFoodItems: boolean;
  suggestPriceTracking: boolean;
}

export class ReceiptProcessor {
  private foodKeywords = [
    // Carnes
    'carne', 'pollo', 'pescado', 'cerdo', 'cordero', 'pavo', 'chorizo', 'jamón', 'salchicha',
    // Lácteos
    'leche', 'queso', 'yogur', 'manteca', 'crema', 'ricota', 'mozzarella',
    // Verduras
    'tomate', 'cebolla', 'papa', 'zanahoria', 'lechuga', 'brócoli', 'espinaca', 'apio',
    // Frutas
    'manzana', 'banana', 'naranja', 'pera', 'durazno', 'uva', 'limón', 'pomelo',
    // Granos y cereales
    'arroz', 'pasta', 'harina', 'pan', 'avena', 'quinoa', 'fideos',
    // Despensa
    'aceite', 'vinagre', 'sal', 'azúcar', 'miel', 'condimento', 'salsa', 'conserva',
    // Bebidas
    'agua', 'gaseosa', 'jugo', 'vino', 'cerveza', 'café', 'té'
  ];

  private storeChains = {
    'carrefour': ['carrefour', 'carrefur'],
    'coto': ['coto', 'coto centro'],
    'dia': ['dia', 'dia market'],
    'jumbo': ['jumbo', 'easy'],
    'disco': ['disco', 'vea'],
    'walmart': ['walmart'],
    'la anonima': ['la anonima', 'anonima'],
    'changomas': ['changomas']
  };

  /**
   * Process receipt image and extract structured data
   */
  async processReceiptImage(
    imageFile: File,
    options: ReceiptProcessingOptions = {
      autoAddToPantry: false,
      autoMarkPurchased: true,
      confidenceThreshold: 0.7,
      includeNonFoodItems: false,
      suggestPriceTracking: true
    }
  ): Promise<ReceiptProcessingResult> {
    try {
      logger.info('Processing receipt image', 'ReceiptProcessor', {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        options
      });

      // Extract text from receipt using OCR
      const ocrResult = await receiptOCR.processReceipt(imageFile);

      if (!ocrResult.success || !ocrResult.receipt) {
        throw new Error(ocrResult.error || 'Failed to process receipt');
      }

      const receipt = ocrResult.receipt;

      // Enhance and process items
      const processedItems = await this.processReceiptItems(
        receipt.items,
        receipt.store,
        options
      );

      // Calculate summary
      const summary = this.calculateSummary(processedItems, receipt);

      // Generate suggestions
      const suggestions = this.generateSuggestions(processedItems, receipt, options);

      const result: ReceiptProcessingResult = {
        receipt,
        processedItems,
        summary,
        suggestions
      };

      logger.info('Receipt processed successfully', 'ReceiptProcessor', {
        totalItems: summary.totalItems,
        confidence: summary.confidence,
        pantryMatches: summary.pantryMatches
      });

      return result;
    } catch (error) {
      logger.error('Error processing receipt', 'ReceiptProcessor', error);
      throw error;
    }
  }

  /**
   * Process and enhance individual receipt items
   */
  private async processReceiptItems(
    items: ReceiptItem[],
    store?: string,
    options: ReceiptProcessingOptions = {} as ReceiptProcessingOptions
  ): Promise<ProcessedReceiptItem[]> {
    const processedItems: ProcessedReceiptItem[] = [];

    for (const item of items) {
      const processed = await this.processIndividualItem(item, store, options);
      processedItems.push(processed);
    }

    return processedItems;
  }

  /**
   * Process a single receipt item
   */
  private async processIndividualItem(
    item: ReceiptItem,
    store?: string,
    options: ReceiptProcessingOptions = {} as ReceiptProcessingOptions
  ): Promise<ProcessedReceiptItem> {
    // Normalize item name
    const normalizedName = this.normalizeItemName(item.name);
    
    // Calculate confidence based on various factors
    const confidence = this.calculateItemConfidence(item, normalizedName);
    
    // Determine if it's a food item
    const isFoodItem = this.isFoodItem(normalizedName);
    
    // Suggest action based on item type and options
    let suggestedAction: ProcessedReceiptItem['suggestedAction'] = 'ignore';
    let reasoning = '';

    if (isFoodItem || options.includeNonFoodItems) {
      if (confidence >= options.confidenceThreshold) {
        if (this.shouldAddToPantry(normalizedName)) {
          suggestedAction = 'add_to_pantry';
          reasoning = 'Item identified as pantry staple';
        } else {
          suggestedAction = 'mark_purchased';
          reasoning = 'Item likely from shopping list';
        }
      } else {
        reasoning = 'Low confidence in item identification';
      }
    } else {
      reasoning = 'Non-food item excluded from processing';
    }

    const processedItem: ProcessedReceiptItem = {
      ...item,
      name: normalizedName,
      confidence,
      suggestedAction,
      reasoning
    };

    return processedItem;
  }

  /**
   * Normalize item names for better matching
   */
  private normalizeItemName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/\d+/g, '') // Remove numbers (sizes, codes)
      .trim();
  }

  /**
   * Calculate confidence score for item identification
   */
  private calculateItemConfidence(item: ReceiptItem, normalizedName: string): number {
    let confidence = 0.5; // Base confidence

    // Name clarity (length and structure)
    if (normalizedName.length >= 3 && normalizedName.length <= 30) {
      confidence += 0.2;
    }

    // Price reasonableness
    if (item.price && item.price > 0 && item.price < 10000) {
      confidence += 0.1;
    }

    // Quantity present
    if (item.quantity && item.quantity > 0) {
      confidence += 0.1;
    }

    // Food keyword match
    if (this.isFoodItem(normalizedName)) {
      confidence += 0.2;
    }

    // Unit recognition
    if (item.unit && ['kg', 'g', 'l', 'ml', 'unidades', 'pack'].includes(item.unit.toLowerCase())) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Check if item is likely a food item
   */
  private isFoodItem(normalizedName: string): boolean {
    return this.foodKeywords.some(keyword => 
      normalizedName.includes(keyword) || keyword.includes(normalizedName)
    );
  }

  /**
   * Determine if item should be added to pantry vs marked as purchased
   */
  private shouldAddToPantry(normalizedName: string): boolean {
    // Items that are typically stored in pantry
    const pantryItems = [
      'aceite', 'vinagre', 'sal', 'azúcar', 'harina', 'arroz', 'pasta',
      'conserva', 'lata', 'condimento', 'especias', 'té', 'café'
    ];

    return pantryItems.some(item => normalizedName.includes(item));
  }

  /**
   * Calculate processing summary
   */
  private calculateSummary(
    processedItems: ProcessedReceiptItem[],
    receipt: ReceiptData
  ): ReceiptProcessingResult['summary'] {
    const totalItems = processedItems.length;
    const pantryMatches = processedItems.filter(item => 
      item.suggestedAction === 'add_to_pantry'
    ).length;
    const shoppingListMatches = processedItems.filter(item => 
      item.suggestedAction === 'mark_purchased'
    ).length;
    const newItems = pantryMatches + shoppingListMatches;
    
    const avgConfidence = processedItems.reduce((sum, item) => sum + item.confidence, 0) / totalItems;

    return {
      totalItems,
      totalAmount: receipt.total || 0,
      pantryMatches,
      shoppingListMatches,
      newItems,
      confidence: Math.round(avgConfidence * 100) / 100
    };
  }

  /**
   * Generate actionable suggestions
   */
  private generateSuggestions(
    processedItems: ProcessedReceiptItem[],
    receipt: ReceiptData,
    options: ReceiptProcessingOptions
  ): ReceiptProcessingResult['suggestions'] {
    const pantryAdditions = processedItems.filter(item => 
      item.suggestedAction === 'add_to_pantry'
    );

    const shoppingListUpdates = processedItems.filter(item => 
      item.suggestedAction === 'mark_purchased'
    );

    const priceUpdates = processedItems
      .filter(item => item.price && item.price > 0)
      .map(item => ({
        item: item.name,
        newPrice: item.price!,
        store: receipt.store || 'Desconocido'
      }));

    return {
      pantryAdditions,
      shoppingListUpdates,
      priceUpdates
    };
  }

  /**
   * Identify store from receipt text
   */
  private identifyStore(receiptText: string): string | undefined {
    const text = receiptText.toLowerCase();
    
    for (const [storeName, variants] of Object.entries(this.storeChains)) {
      if (variants.some(variant => text.includes(variant))) {
        return storeName;
      }
    }

    return undefined;
  }

  /**
   * Extract date from receipt text
   */
  private extractDate(receiptText: string): Date | undefined {
    // Common date patterns in Argentine receipts
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
      /(\d{1,2})-(\d{1,2})-(\d{2,4})/,
      /(\d{2,4})\/(\d{1,2})\/(\d{1,2})/
    ];

    for (const pattern of datePatterns) {
      const match = receiptText.match(pattern);
      if (match) {
        try {
          const [, day, month, year] = match;
          const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
          return new Date(fullYear, parseInt(month) - 1, parseInt(day));
        } catch (error) {
          continue;
        }
      }
    }

    return undefined;
  }

  /**
   * Validate processed receipt data
   */
  validateReceiptData(result: ReceiptProcessingResult): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if we have any items
    if (result.processedItems.length === 0) {
      errors.push('No items found in receipt');
    }

    // Check confidence levels
    if (result.summary.confidence < 0.5) {
      warnings.push('Low overall confidence in item recognition');
    }

    // Check for reasonable total
    if (result.receipt.total && result.receipt.total <= 0) {
      warnings.push('Invalid or missing total amount');
    }

    // Check for items with very low confidence
    const lowConfidenceItems = result.processedItems.filter(item => item.confidence < 0.3);
    if (lowConfidenceItems.length > 0) {
      warnings.push(`${lowConfidenceItems.length} items have very low confidence`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const receiptProcessor = new ReceiptProcessor();