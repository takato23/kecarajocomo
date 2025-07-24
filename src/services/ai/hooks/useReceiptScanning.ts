'use client';

/**
 * useReceiptScanning Hook
 * Specialized hook for AI-powered receipt scanning and parsing
 */

import { useState, useCallback } from 'react';

import {
  AIImageRequest,
  ParsedReceipt,
  ReceiptItem,
  PantryItem,
} from '../types';

import { useAIService } from './useAIService';

export interface UseReceiptScanningOptions {
  onReceiptParsed?: (receipt: ParsedReceipt) => void;
  onItemsExtracted?: (items: ReceiptItem[]) => void;
  onError?: (error: Error) => void;
  provider?: 'openai' | 'anthropic' | 'gemini' | 'auto';
}

export interface UseReceiptScanningReturn {
  isScanning: boolean;
  error: Error | null;
  lastReceipt: ParsedReceipt | null;
  extractedItems: ReceiptItem[];
  
  scanReceipt: (image: File | Blob | string) => Promise<ParsedReceipt>;
  parseReceiptText: (text: string) => Promise<ParsedReceipt>;
  convertToPantryItems: (items: ReceiptItem[]) => PantryItem[];
  categorizeItems: (items: ReceiptItem[]) => Promise<ReceiptItem[]>;
  validateReceipt: (receipt: ParsedReceipt) => ValidationResult;
  reset: () => void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
}

export function useReceiptScanning(options: UseReceiptScanningOptions = {}): UseReceiptScanningReturn {
  const [lastReceipt, setLastReceipt] = useState<ParsedReceipt | null>(null);
  const [extractedItems, setExtractedItems] = useState<ReceiptItem[]>([]);
  
  const aiService = useAIService({
    provider: options.provider || 'gemini', // Gemini is best for vision tasks
    onError: options.onError,
  });

  const scanReceipt = useCallback(async (image: File | Blob | string): Promise<ParsedReceipt> => {
    let imageRequest: AIImageRequest;
    
    if (typeof image === 'string') {
      // URL or base64
      imageRequest = {
        image,
        analysisType: 'ocr',
        prompt: 'Extract all text from this receipt. Include store name, date, items with prices and quantities, and total amount.',
      };
    } else {
      // File or Blob
      imageRequest = {
        image,
        mimeType: image.type,
        analysisType: 'ocr',
        prompt: 'Extract all text from this receipt. Include store name, date, items with prices and quantities, and total amount.',
      };
    }

    const receipt = await aiService.parseReceipt(imageRequest);
    
    setLastReceipt(receipt);
    setExtractedItems(receipt.items);
    
    options.onReceiptParsed?.(receipt);
    options.onItemsExtracted?.(receipt.items);
    
    return receipt;
  }, [aiService, options]);

  const parseReceiptText = useCallback(async (text: string): Promise<ParsedReceipt> => {
    const receipt = await aiService.parseReceipt(text);
    
    setLastReceipt(receipt);
    setExtractedItems(receipt.items);
    
    options.onReceiptParsed?.(receipt);
    options.onItemsExtracted?.(receipt.items);
    
    return receipt;
  }, [aiService, options]);

  const convertToPantryItems = useCallback((items: ReceiptItem[]): PantryItem[] => {
    return items.map(item => ({
      id: `pantry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category || 'uncategorized',
      expirationDate: calculateExpirationDate(item.category),
      location: 'pantry',
    }));
  }, []);

  const categorizeItems = useCallback(async (items: ReceiptItem[]): Promise<ReceiptItem[]> => {
    if (items.every(item => item.category)) {
      return items; // Already categorized
    }

    const prompt = `Categorize these grocery items into appropriate categories:

${JSON.stringify(items.map(i => ({ name: i.name })))}

Categories to use: dairy, meat, produce, grains, beverages, snacks, frozen, canned, condiments, baking, personal care, household, other.

Return the same items with a "category" field added to each in JSON format.`;

    const response = await aiService.generateJSON<ReceiptItem[]>(
      { prompt, format: 'json' },
      undefined
    );

    const categorizedItems = items.map((item, index) => ({
      ...item,
      category: response.data[index]?.category || 'other',
    }));

    setExtractedItems(categorizedItems);
    return categorizedItems;
  }, [aiService]);

  const validateReceipt = useCallback((receipt: ParsedReceipt): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = receipt.confidence || 0.5;

    // Validation checks
    if (!receipt.store) {
      errors.push('Store name is missing');
      confidence -= 0.1;
    }

    if (!receipt.date) {
      warnings.push('Date is missing');
      confidence -= 0.05;
    }

    if (!receipt.items || receipt.items.length === 0) {
      errors.push('No items found in receipt');
      confidence -= 0.2;
    }

    if (receipt.total <= 0) {
      errors.push('Total amount is invalid');
      confidence -= 0.1;
    }

    // Check if item prices sum to total (within 5% margin)
    const itemTotal = receipt.items.reduce((sum, item) => sum + item.price, 0);
    const difference = Math.abs(itemTotal - receipt.total);
    const margin = receipt.total * 0.05;
    
    if (difference > margin) {
      warnings.push(`Item total ($${itemTotal.toFixed(2)}) doesn't match receipt total ($${receipt.total.toFixed(2)})`);
      confidence -= 0.1;
    }

    // Check for missing prices
    const itemsWithoutPrice = receipt.items.filter(item => !item.price || item.price <= 0);
    if (itemsWithoutPrice.length > 0) {
      warnings.push(`${itemsWithoutPrice.length} items have no price`);
      confidence -= 0.05 * itemsWithoutPrice.length;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence: Math.max(0, Math.min(1, confidence)),
    };
  }, []);

  const reset = useCallback(() => {
    setLastReceipt(null);
    setExtractedItems([]);
    aiService.reset();
  }, [aiService]);

  return {
    isScanning: aiService.isLoading,
    error: aiService.error,
    lastReceipt,
    extractedItems,
    
    scanReceipt,
    parseReceiptText,
    convertToPantryItems,
    categorizeItems,
    validateReceipt,
    reset,
  };
}

// Helper function to calculate expiration dates based on category
function calculateExpirationDate(category?: string): Date {
  const today = new Date();
  const expirationDate = new Date(today);

  switch (category) {
    case 'dairy':
      expirationDate.setDate(today.getDate() + 7); // 1 week
      break;
    case 'meat':
      expirationDate.setDate(today.getDate() + 3); // 3 days
      break;
    case 'produce':
      expirationDate.setDate(today.getDate() + 5); // 5 days
      break;
    case 'canned':
      expirationDate.setFullYear(today.getFullYear() + 2); // 2 years
      break;
    case 'frozen':
      expirationDate.setMonth(today.getMonth() + 6); // 6 months
      break;
    case 'grains':
    case 'condiments':
      expirationDate.setMonth(today.getMonth() + 12); // 1 year
      break;
    default:
      expirationDate.setMonth(today.getMonth() + 3); // 3 months default
  }

  return expirationDate;
}