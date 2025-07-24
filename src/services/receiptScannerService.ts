// Legacy Receipt Scanner Service - Redirects to unified AI service
// This file is kept for backward compatibility during migration
// TODO: Remove this file once all imports are updated

import { UnifiedAIService } from '@/services/ai';

const aiService = new UnifiedAIService();

export interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  category?: string;
}

export interface ReceiptData {
  store?: string;
  date?: string;
  total?: number;
  items: ScannedItem[];
}

export class ReceiptScannerService {
  /**
   * Process receipt image and extract items
   */
  static async scanReceipt(imageBase64: string): Promise<ReceiptData> {
    console.warn('Deprecated: Use UnifiedAIService.scanReceipt() instead');
    return aiService.scanReceipt(imageBase64);
  }

  /**
   * Validate receipt data
   */
  static validateReceiptData(data: ReceiptData): boolean {
    console.warn('Deprecated: Use UnifiedAIService.validateReceiptData() instead');
    if (!data.items || data.items.length === 0) {
      return false;
    }

    return data.items.every(item => 
      item.name && 
      typeof item.quantity === 'number' && 
      item.quantity > 0 &&
      item.unit
    );
  }
}