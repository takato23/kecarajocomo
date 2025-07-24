import Tesseract from 'tesseract.js';

import type { HolisticFoodSystem } from '../core/HolisticSystem';
import { getGeminiService } from '../ai/GeminiService';

export interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  confidence: number;
  category?: string;
  brand?: string;
}

export interface ParsedReceipt {
  items: ScannedItem[];
  store: string | null;
  date: Date | null;
  total: number | null;
  rawText: string;
}

/**
 * Scanner de Tickets Inteligente con OCR
 */
export class ReceiptScanner {
  constructor(private system: HolisticFoodSystem) {}
  
  /**
   * Escanear un ticket completo
   */
  async scanReceipt(image: File): Promise<ParsedReceipt> {
    try {

      // 1. Realizar OCR
      const ocrText = await this.performOCR(image);

      // 2. Intentar parsear con IA primero
      let parsedReceipt: ParsedReceipt;
      
      try {

        const geminiService = getGeminiService();
        const aiResult = await geminiService.parseReceipt(ocrText);
        
        // Enriquecer items con información adicional
        const enrichedItems = await geminiService.enrichItems(aiResult.items);
        
        parsedReceipt = {
          items: enrichedItems.map(item => ({
            ...item,
            confidence: aiResult.confidence
          })),
          store: aiResult.store,
          date: new Date(aiResult.date),
          total: aiResult.total,
          rawText: ocrText
        };

      } catch (aiError: unknown) {
        console.warn('⚠️ Error en IA, usando método tradicional:', aiError);
        
        // Fallback a método tradicional
        const parsedItems = await this.parseReceiptText(ocrText);
        const storeInfo = this.detectStore(ocrText);
        const dateInfo = this.detectDate(ocrText);
        const totalInfo = this.detectTotal(ocrText);
        
        parsedReceipt = {
          items: parsedItems,
          store: storeInfo,
          date: dateInfo,
          total: totalInfo,
          rawText: ocrText
        };
      }
      
      return parsedReceipt;
      
    } catch (error: unknown) {
      console.error('Error en scanner:', error);
      throw new Error('Error al escanear el ticket');
    }
  }
  
  /**
   * Realizar OCR en la imagen
   */
  private async performOCR(image: File): Promise<string> {
    return new Promise((resolve, reject) => {
      Tesseract.recognize(
        image,
        'spa', // Español
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {

            }
          }
        }
      )
      .then(({ data: { text } }) => {
        resolve(text);
      })
      .catch (reject: unknown);
    });
  }
  
  /**
   * Parsear texto del ticket con patrones
   */
  private async parseReceiptText(text: string): Promise<ScannedItem[]> {
    const items: ScannedItem[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // Patrones comunes en tickets
    const itemPattern = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:x|X)?\s*\$?\s*(\d+(?:[.,]\d+)?)/;
    const pricePattern = /\$?\s*(\d+(?:[.,]\d+)?)/;
    
    for (const line of lines) {
      // Intentar extraer items con el patrón
      const match = line.match(itemPattern);
      if (match) {
        const [_, name, quantity, price] = match;
        
        items.push({
          name: this.cleanProductName(name),
          quantity: parseFloat(quantity.replace(',', '.')),
          unit: this.detectUnit(name),
          price: parseFloat(price.replace(',', '.')),
          confidence: 0.8 // Por ahora fijo, luego calcular basado en claridad
        });
      }
    }
    
    // Si no encontramos items con el patrón, intentar método alternativo
    if (items.length === 0) {

      return this.parseAlternativeMethod(lines);
    }
    
    return items;
  }
  
  /**
   * Método alternativo de parseo para tickets no estándar
   */
  private parseAlternativeMethod(lines: string[]): ScannedItem[] {
    const items: ScannedItem[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Buscar líneas que parecen productos (no son totales, fechas, etc)
      if (this.looksLikeProduct(line)) {
        // Buscar precio en la misma línea o la siguiente
        const priceMatch = line.match(/\$?\s*(\d+(?:[.,]\d+)?)\s*$/);
        let price = 0;
        
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(',', '.'));
        } else if (i + 1 < lines.length) {
          // Buscar precio en la siguiente línea
          const nextLinePrice = lines[i + 1].match(/\$?\s*(\d+(?:[.,]\d+)?)/);
          if (nextLinePrice) {
            price = parseFloat(nextLinePrice[1].replace(',', '.'));
          }
        }
        
        if (price > 0) {
          items.push({
            name: this.cleanProductName(line),
            quantity: 1, // Por defecto
            unit: 'unidad',
            price: price,
            confidence: 0.6
          });
        }
      }
    }
    
    return items;
  }
  
  /**
   * Limpiar nombre de producto
   */
  private cleanProductName(name: string): string {
    return name
      .replace(/\$?\s*\d+(?:[.,]\d+)?/g, '') // Quitar precios
      .replace(/\d+\s*(kg|g|l|ml|un)/gi, '') // Quitar cantidades
      .replace(/[^\w\s]/g, ' ') // Quitar caracteres especiales
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim()
      .toLowerCase();
  }
  
  /**
   * Detectar unidad del producto
   */
  private detectUnit(text: string): string {
    const units = {
      'kg': /\d+\s*kg/i,
      'g': /\d+\s*g/i,
      'l': /\d+\s*l/i,
      'ml': /\d+\s*ml/i,
      'un': /\d+\s*un/i,
    };
    
    for (const [unit, pattern] of Object.entries(units)) {
      if (pattern.test(text)) {
        return unit;
      }
    }
    
    return 'unidad';
  }
  
  /**
   * Detectar si una línea parece un producto
   */
  private looksLikeProduct(line: string): boolean {
    // Excluir líneas que son claramente no-productos
    const excludePatterns = [
      /^total/i,
      /^subtotal/i,
      /^fecha/i,
      /^hora/i,
      /^cuit/i,
      /^gracias/i,
      /^ticket/i,
      /^\d{2}\/\d{2}\/\d{4}/,
      /^-+$/,
      /^=+$/
    ];
    
    return !excludePatterns.some(pattern => pattern.test(line.trim()));
  }
  
  /**
   * Detectar nombre de la tienda
   */
  private detectStore(text: string): string | null {
    // Patrones comunes de tiendas en Argentina
    const storePatterns = [
      /carrefour/i,
      /coto/i,
      /dia/i,
      /jumbo/i,
      /disco/i,
      /vea/i,
      /walmart/i,
      /changomas/i,
    ];
    
    for (const pattern of storePatterns) {
      if (pattern.test(text)) {
        return pattern.source;
      }
    }
    
    // Buscar en las primeras líneas
    const firstLines = text.split('\n').slice(0, 5).join(' ');
    const words = firstLines.split(/\s+/);
    
    // Asumir que palabras en mayúsculas al inicio pueden ser el nombre
    const upperWords = words.filter(w => w.length > 3 && w === w.toUpperCase());
    if (upperWords.length > 0) {
      return upperWords[0];
    }
    
    return null;
  }
  
  /**
   * Detectar fecha del ticket
   */
  private detectDate(text: string): Date | null {
    // Patrones de fecha comunes
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const [_, day, month, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } catch (e: unknown) {
          continue;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Detectar total del ticket
   */
  private detectTotal(text: string): number | null {
    // Buscar patrones de total
    const totalPatterns = [
      /total\s*:?\s*\$?\s*(\d+(?:[.,]\d+)?)/i,
      /total\s+a\s+pagar\s*:?\s*\$?\s*(\d+(?:[.,]\d+)?)/i,
      /importe\s+total\s*:?\s*\$?\s*(\d+(?:[.,]\d+)?)/i,
    ];
    
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }
    
    // Si no encontramos, buscar el número más grande que parezca un total
    const numbers = text.match(/\$?\s*(\d+(?:[.,]\d+)?)/g) || [];
    const parsedNumbers = numbers
      .map(n => parseFloat(n.replace(/[$\s]/g, '').replace(',', '.')))
      .filter(n => n > 10) // Filtrar números muy pequeños
      .sort((a, b) => b - a);
    
    return parsedNumbers[0] || null;
  }
  
  /**
   * Validar y enriquecer items escaneados
   */
  async enrichScannedItems(items: ScannedItem[]): Promise<ScannedItem[]> {
    // TODO: Enriquecer con base de datos de productos
    // Por ahora solo normalizamos nombres
    
    return items.map(item => ({
      ...item,
      name: this.normalizeProductName(item.name)
    }));
  }
  
  /**
   * Normalizar nombres de productos
   */
  private normalizeProductName(name: string): string {
    // Diccionario de normalización
    const normalizations: Record<string, string> = {
      'leche': 'leche',
      'leche desc': 'leche descremada',
      'lch': 'leche',
      'pan': 'pan',
      'pan lac': 'pan lactal',
      'harina': 'harina',
      'har': 'harina',
      'azucar': 'azúcar',
      'azuc': 'azúcar',
      'aceite': 'aceite',
      'aceit': 'aceite',
      'huevos': 'huevos',
      'huev': 'huevos',
      'doc': 'docena',
    };
    
    // Buscar coincidencias parciales
    const lowerName = name.toLowerCase();
    for (const [key, value] of Object.entries(normalizations)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    
    return name;
  }
}