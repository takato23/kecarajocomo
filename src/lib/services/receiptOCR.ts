import { GoogleGenerativeAI } from '@google/generative-ai';

import { parserUtils } from '../parser/parserUtils';

import { cacheService } from './cacheService';

export interface ReceiptItem {
  id: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  confidence: number;
  rawText: string;
  selected: boolean;
}

export interface ReceiptData {
  storeName?: string;
  date?: string;
  total?: number;
  items: ReceiptItem[];
  rawText: string;
  confidence: number;
}

export interface OCRResult {
  success: boolean;
  receipt?: ReceiptData;
  error?: string;
}

export class ReceiptOCR {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY is required for receipt OCR');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async processReceipt(imageFile: File): Promise<OCRResult> {
    try {
      // Generate cache key based on file content
      const imageBuffer = await imageFile.arrayBuffer();
      const imageHash = await this.generateImageHash(imageBuffer);
      const cacheKey = `receipt:${imageHash}`;
      
      // Check cache first
      const cached = await cacheService.get<ReceiptData>(cacheKey);
      if (cached) {
        return {
          success: true,
          receipt: cached
        };
      }

      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Process with Gemini
      const result = await this.extractTextFromImage(base64Image);
      
      if (!result.success) {
        return result;
      }

      // Parse the extracted text
      const parsedReceipt = await this.parseReceiptText(result.receipt!.rawText);
      
      // Cache the result
      await cacheService.set(cacheKey, parsedReceipt, this.CACHE_TTL);
      
      return {
        success: true,
        receipt: parsedReceipt
      };

    } catch (error: unknown) {
      console.error('Receipt OCR error:', error);
      return {
        success: false,
        error: 'Error procesando el ticket'
      };
    }
  }

  private async extractTextFromImage(base64Image: string): Promise<OCRResult> {
    try {
      const prompt = `
        Analiza este ticket de compra argentino y extrae toda la información en formato JSON.
        
        Instrucciones:
        1. Extrae el nombre de la tienda (si está visible)
        2. Extrae la fecha (si está visible)
        3. Extrae el total (si está visible)
        4. Extrae TODOS los productos con sus cantidades y precios
        5. Para cada producto, incluye el texto exacto como aparece en el ticket
        
        Formato de respuesta JSON:
        {
          "store_name": "nombre de la tienda o null",
          "date": "fecha en formato ISO o null",
          "total": número del total o null,
          "raw_text": "texto completo extraído del ticket",
          "items": [
            {
              "raw_text": "texto exacto del producto en el ticket",
              "name": "nombre del producto normalizado",
              "quantity": número de cantidad,
              "unit": "unidad (kg, g, l, ml, un, etc)",
              "price": número del precio,
              "confidence": número entre 0.0 y 1.0
            }
          ]
        }
        
        Reglas importantes:
        - Si no puedes determinar un valor, usa null
        - Normaliza los nombres de productos (ej: "LECHE DESCR 1L" → "leche descremada")
        - Identifica las unidades correctas (kg, g, l, ml, un, paq, etc)
        - Asigna confidence basado en qué tan seguro estás de la extracción
        - Incluye solo productos alimenticios y bebidas
        - Excluye bolsas, descuentos, impuestos
        
        Responde SOLO con el JSON, sin texto adicional.
      `;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      try {
        const jsonData = JSON.parse(text);
        
        // Validate the response structure
        if (!jsonData.items || !Array.isArray(jsonData.items)) {
          throw new Error('Invalid response format');
        }

        const receiptData: ReceiptData = {
          storeName: jsonData.store_name || undefined,
          date: jsonData.date || undefined,
          total: jsonData.total || undefined,
          rawText: jsonData.raw_text || text,
          items: jsonData.items.map((item: any, index: number) => ({
            id: `item_${index}`,
            name: item.name || 'Producto desconocido',
            normalizedName: parserUtils.normalizeProductName(item.name || 'Producto desconocido'),
            quantity: item.quantity || 1,
            unit: item.unit || 'un',
            price: item.price || 0,
            category: parserUtils.categorizeProduct(item.name || 'Producto desconocido'),
            confidence: item.confidence || 0.5,
            rawText: item.raw_text || '',
            selected: true
          })),
          confidence: this.calculateOverallConfidence(jsonData.items)
        };

        return {
          success: true,
          receipt: receiptData
        };

      } catch (parseError: unknown) {
        console.error('JSON parsing error:', parseError);
        return {
          success: false,
          error: 'Error procesando la respuesta del OCR'
        };
      }

    } catch (error: unknown) {
      console.error('OCR extraction error:', error);
      return {
        success: false,
        error: 'Error extrayendo texto del ticket'
      };
    }
  }

  private async parseReceiptText(rawText: string): Promise<ReceiptData> {
    // This is a fallback parser if the AI response is not in JSON format
    const lines = rawText.split('\n').filter(line => line.trim());
    
    const items: ReceiptItem[] = [];
    let total: number | undefined;
    let storeName: string | undefined;
    let date: string | undefined;
    
    // Simple patterns for Argentine receipts
    const pricePattern = /\$?\s*(\d+[.,]\d{2})/;
    const totalPattern = /total|subtotal|importe/i;
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Try to extract date
      if (!date) {
        const dateMatch = line.match(datePattern);
        if (dateMatch) {
          date = dateMatch[0];
        }
      }
      
      // Try to extract total
      if (totalPattern.test(line)) {
        const priceMatch = line.match(pricePattern);
        if (priceMatch) {
          total = parseFloat(priceMatch[1].replace(',', '.'));
        }
      }
      
      // Try to extract store name (usually in the first few lines)
      if (i < 3 && !storeName && line.length > 3 && !pricePattern.test(line)) {
        storeName = line;
      }
      
      // Try to extract items (lines with prices)
      const priceMatch = line.match(pricePattern);
      if (priceMatch && !totalPattern.test(line)) {
        const price = parseFloat(priceMatch[1].replace(',', '.'));
        const productName = line.replace(pricePattern, '').trim();
        
        if (productName.length > 1) {
          items.push({
            id: `item_${items.length}`,
            name: productName,
            normalizedName: parserUtils.normalizeProductName(productName),
            quantity: 1,
            unit: 'un',
            price,
            category: parserUtils.categorizeProduct(productName),
            confidence: 0.6,
            rawText: line,
            selected: true
          });
        }
      }
    }
    
    return {
      storeName,
      date,
      total,
      items,
      rawText,
      confidence: 0.6
    };
  }

  private calculateOverallConfidence(items: any[]): number {
    if (!items || items.length === 0) return 0;
    
    const avgConfidence = items.reduce((sum, item) => sum + (item.confidence || 0.5), 0) / items.length;
    
    // Boost confidence if we have good structure
    let structureBoost = 0;
    if (items.length > 1) structureBoost += 0.1;
    if (items.every(item => item.price > 0)) structureBoost += 0.1;
    if (items.every(item => item.name && item.name.length > 2)) structureBoost += 0.1;
    
    return Math.min(avgConfidence + structureBoost, 1.0);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async generateImageHash(buffer: ArrayBuffer): Promise<string> {
    // Simple hash based on buffer size and first few bytes
    const bytes = new Uint8Array(buffer);
    const sample = bytes.slice(0, 100);
    const hash = Array.from(sample).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${buffer.byteLength}_${hash}`;
  }

  // Method to validate and clean extracted items
  validateAndCleanItems(items: ReceiptItem[]): ReceiptItem[] {
    return items
      .filter(item => {
        // Filter out invalid items
        if (!item.name || item.name.length < 2) return false;
        if (item.price <= 0) return false;
        if (item.quantity <= 0) return false;
        
        // Filter out non-food items
        const nonFoodKeywords = ['bolsa', 'descuento', 'impuesto', 'tarjeta', 'efectivo'];
        const lowerName = item.name.toLowerCase();
        return !nonFoodKeywords.some(keyword => lowerName.includes(keyword));
      })
      .map(item => ({
        ...item,
        name: parserUtils.normalizeProductName(item.name),
        category: parserUtils.categorizeProduct(item.name),
        unit: parserUtils.parseQuantity(item.name).unit || item.unit
      }));
  }
}

// Export singleton instance
export const receiptOCR = new ReceiptOCR();