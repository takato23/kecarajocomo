import { parserUtils } from '../parser/parserUtils';

import { StoreScraper } from './storeScraper';
import { cacheService } from './cacheService';

export interface ScannedProduct {
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  price?: number;
  store?: string;
  unit?: string;
  confidence: number;
  normalized: {
    name: string;
    category: string;
    unit: string;
  };
}

export interface ScanResult {
  success: boolean;
  product?: ScannedProduct;
  error?: string;
  suggestions?: string[];
}

export class SmartScanner {
  private storeScraper: StoreScraper;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.storeScraper = new StoreScraper();
  }

  async scanBarcode(barcode: string): Promise<ScanResult> {
    try {
      // Check cache first
      const cacheKey = `barcode:${barcode}`;
      const cached = await cacheService.get<ScannedProduct>(cacheKey);
      
      if (cached) {
        return {
          success: true,
          product: cached
        };
      }

      // Try to find product by barcode
      const product = await this.storeScraper.getProductByBarcode(barcode);
      
      if (product) {
        const scannedProduct = this.processProduct(product, barcode);
        
        // Cache the result
        await cacheService.set(cacheKey, scannedProduct, this.CACHE_TTL);
        
        return {
          success: true,
          product: scannedProduct
        };
      }

      // If no exact match, try partial matches
      const suggestions = await this.generateSuggestions(barcode);
      
      return {
        success: false,
        error: 'Producto no encontrado',
        suggestions
      };

    } catch (error: unknown) {
      console.error('Smart scanner error:', error);
      return {
        success: false,
        error: 'Error al procesar el código de barras'
      };
    }
  }

  private processProduct(product: any, barcode: string): ScannedProduct {
    const normalized = {
      name: parserUtils.normalizeProductName(product.name),
      category: parserUtils.categorizeProduct(product.name),
      unit: this.extractUnit(product.name) || 'un'
    };

    return {
      barcode,
      name: product.name,
      brand: parserUtils.extractBrand(product.name),
      category: normalized.category,
      price: product.price,
      store: product.store,
      unit: normalized.unit,
      confidence: this.calculateConfidence(product),
      normalized
    };
  }

  private calculateConfidence(product: any): number {
    let confidence = 0.8; // Base confidence
    
    // Increase confidence if we have price info
    if (product.price && product.price > 0) {
      confidence += 0.1;
    }
    
    // Increase confidence if we have store info
    if (product.store) {
      confidence += 0.05;
    }
    
    // Increase confidence based on name completeness
    if (product.name && product.name.length > 10) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 1.0);
  }

  private extractUnit(productName: string): string | undefined {
    const unitPatterns = [
      /(\d+)\s*(kg|g|gr|gramos?)/i,
      /(\d+)\s*(l|lt|litros?|ml|cc)/i,
      /(\d+)\s*(un|unidades?|piezas?)/i,
      /(\d+)\s*(pack|paq|paquetes?)/i,
      /(\d+)\s*(lata|latas)/i,
      /(\d+)\s*(doc|docena)/i
    ];

    for (const pattern of unitPatterns) {
      const match = productName.match(pattern);
      if (match) {
        return match[2].toLowerCase();
      }
    }

    return undefined;
  }

  private async generateSuggestions(barcode: string): Promise<string[]> {
    // Extract potential product identifiers from barcode
    const suggestions: string[] = [];
    
    // Try different barcode formats
    const barcodeVariants = [
      barcode.substring(0, 8), // First 8 digits
      barcode.substring(0, 12), // First 12 digits
      barcode.substring(3), // Remove first 3 digits (country code)
    ];

    for (const variant of barcodeVariants) {
      try {
        const results = await this.storeScraper.searchProducts(variant);
        if (results.length > 0) {
          suggestions.push(...results.slice(0, 3).map(p => p.name));
        }
      } catch (error: unknown) {
        // Continue with other variants
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  // Method to manually add a product association
  async associateBarcode(barcode: string, productName: string): Promise<void> {
    const scannedProduct: ScannedProduct = {
      barcode,
      name: productName,
      category: parserUtils.categorizeProduct(productName),
      unit: 'un',
      confidence: 0.9,
      normalized: {
        name: parserUtils.normalizeProductName(productName),
        category: parserUtils.categorizeProduct(productName),
        unit: 'un'
      }
    };

    const cacheKey = `barcode:${barcode}`;
    await cacheService.set(cacheKey, scannedProduct, this.CACHE_TTL);
  }

  // Method to get scanning statistics
  async getScanningStats(): Promise<{
    totalScans: number;
    successRate: number;
    topCategories: string[];
  }> {
    // This would typically come from a database
    // For now, return mock data
    return {
      totalScans: 0,
      successRate: 0,
      topCategories: []
    };
  }
}

// Export singleton instance
export const smartScanner = new SmartScanner();