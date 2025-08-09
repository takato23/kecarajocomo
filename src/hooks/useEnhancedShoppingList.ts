/**
 * Enhanced Shopping List Hook
 * Integrates automatic generation, barcode scanning, and receipt processing
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/services/logger';
import { useMealPlanningStore } from '@/features/meal-planning/store/useMealPlanningStore';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import { autoShoppingListGenerator, type ShoppingListGeneration } from '@/services/shopping/AutoShoppingListGenerator';
import { shoppingListService, type ShoppingItem } from '@/lib/services/shoppingListService';
import { receiptOCR, type ReceiptItem } from '@/lib/services/receiptOCR';

export interface ShoppingListState {
  currentList: ShoppingListGeneration | null;
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
  isScanningBarcode: boolean;
  isProcessingReceipt: boolean;
}

export interface ShoppingListFilters {
  category?: string;
  store?: string;
  priceRange?: { min: number; max: number };
  showPurchased?: boolean;
}

export interface BarcodeProductInfo {
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  nutrition?: any;
  image?: string;
}

export interface ReceiptProcessingResult {
  items: ReceiptItem[];
  totalAmount: number;
  store?: string;
  date?: Date;
  matchedPantryItems: number;
  addedToShoppingList: number;
}

export function useEnhancedShoppingList() {
  const [state, setState] = useState<ShoppingListState>({
    currentList: null,
    isLoading: false,
    error: null,
    isGenerating: false,
    isScanningBarcode: false,
    isProcessingReceipt: false
  });

  const [filters, setFilters] = useState<ShoppingListFilters>({
    showPurchased: false
  });

  const { currentWeekPlan } = useMealPlanningStore();
  const { items: pantryItems, addItem: addPantryItem } = usePantryStore();

  /**
   * Generate automatic shopping list from current meal plan
   */
  const generateFromMealPlan = useCallback(async (userId: string) => {
    if (!currentWeekPlan) {
      setState(prev => ({ ...prev, error: 'No hay plan de comidas activo' }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const generation = await autoShoppingListGenerator.generateFromMealPlan(
        currentWeekPlan,
        pantryItems,
        userId,
        {
          organizeByStore: true,
          groupByCategory: true,
          prioritizeByExpiration: true,
          includePriceComparisons: true,
          suggestAlternatives: true,
          optimizeRoute: false
        }
      );

      setState(prev => ({
        ...prev,
        currentList: generation,
        isGenerating: false
      }));

      logger.info('Shopping list generated from meal plan', 'useEnhancedShoppingList', {
        totalItems: generation.summary.totalItems,
        estimatedCost: generation.summary.estimatedCost
      });

      return generation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error generando lista';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isGenerating: false
      }));
      logger.error('Error generating shopping list', 'useEnhancedShoppingList', error);
      throw error;
    }
  }, [currentWeekPlan, pantryItems]);

  /**
   * Process barcode scan and add product to list
   */
  const processBarcodeScan = useCallback(async (barcode: string): Promise<BarcodeProductInfo | null> => {
    setState(prev => ({ ...prev, isScanningBarcode: true, error: null }));

    try {
      // In a real implementation, this would call a barcode API service
      const productInfo = await fetchProductInfoFromBarcode(barcode);
      
      if (productInfo && state.currentList) {
        // Add to current shopping list
        await addItemToList({
          name: productInfo.name,
          quantity: 1,
          category: productInfo.category || 'other',
          price: productInfo.price,
          notes: `Añadido por código de barras: ${barcode}`
        });
      }

      setState(prev => ({ ...prev, isScanningBarcode: false }));
      return productInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando código de barras';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isScanningBarcode: false
      }));
      logger.error('Error processing barcode', 'useEnhancedShoppingList', error);
      return null;
    }
  }, [state.currentList]);

  /**
   * Process receipt image and extract items
   */
  const processReceiptScan = useCallback(async (imageFile: File): Promise<ReceiptProcessingResult | null> => {
    setState(prev => ({ ...prev, isProcessingReceipt: true, error: null }));

    try {
      // Process receipt with OCR
      const ocrResult = await receiptOCR.processReceipt(imageFile);

      if (!ocrResult.success || !ocrResult.receipt) {
        throw new Error(ocrResult.error || 'Error procesando ticket');
      }

      const receipt = ocrResult.receipt;
      let matchedPantryItems = 0;
      let addedToShoppingList = 0;

      // Process each item from receipt
      for (const item of receipt.items) {
        // Check if item exists in current shopping list
        const existsInShoppingList = state.currentList?.shoppingList.items.some(
          listItem => listItem.ingredientName.toLowerCase().includes(item.name.toLowerCase())
        );

        if (existsInShoppingList) {
          // Mark as purchased in shopping list
          await toggleItemPurchased(item.name, true);
          addedToShoppingList++;
        }

        // Check if item should be added to pantry
        const shouldAddToPantry = await confirmAddToPantry(item);
        if (shouldAddToPantry) {
          await addPantryItem({
            ingredient_name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || 'unidades',
            category: item.category || 'other',
            purchase_date: new Date().toISOString(),
            purchase_price: item.price,
            store: receipt.store || 'Desconocido',
            notes: `Añadido desde ticket - ${receipt.date || new Date().toISOString()}`
          });
          matchedPantryItems++;
        }
      }

      const result: ReceiptProcessingResult = {
        items: receipt.items,
        totalAmount: receipt.total || 0,
        store: receipt.store,
        date: receipt.date ? new Date(receipt.date) : new Date(),
        matchedPantryItems,
        addedToShoppingList
      };

      setState(prev => ({ ...prev, isProcessingReceipt: false }));

      logger.info('Receipt processed successfully', 'useEnhancedShoppingList', {
        itemsCount: receipt.items.length,
        matchedPantryItems,
        addedToShoppingList
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando ticket';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessingReceipt: false
      }));
      logger.error('Error processing receipt', 'useEnhancedShoppingList', error);
      return null;
    }
  }, [state.currentList, addPantryItem]);

  /**
   * Add item to shopping list
   */
  const addItemToList = useCallback(async (item: Partial<ShoppingItem>) => {
    if (!state.currentList?.shoppingList.id) {
      setState(prev => ({ ...prev, error: 'No hay lista activa' }));
      return;
    }

    try {
      await shoppingListService.addItem(state.currentList.shoppingList.id, item);
      
      // Refresh current list
      if (currentWeekPlan) {
        const userId = state.currentList.shoppingList.userId;
        await generateFromMealPlan(userId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error añadiendo item';
      setState(prev => ({ ...prev, error: errorMessage }));
      logger.error('Error adding item to list', 'useEnhancedShoppingList', error);
    }
  }, [state.currentList, currentWeekPlan, generateFromMealPlan]);

  /**
   * Toggle item purchased status
   */
  const toggleItemPurchased = useCallback(async (itemName: string, purchased: boolean) => {
    if (!state.currentList) return;

    try {
      const item = state.currentList.shoppingList.items.find(
        i => i.ingredientName.toLowerCase().includes(itemName.toLowerCase())
      );

      if (item) {
        // Update the item in the shopping list service
        // This would need to be implemented in the service
        logger.info('Toggling item purchased status', 'useEnhancedShoppingList', {
          itemName,
          purchased
        });
      }
    } catch (error) {
      logger.error('Error toggling item purchased status', 'useEnhancedShoppingList', error);
    }
  }, [state.currentList]);

  /**
   * Get optimized shopping route
   */
  const getOptimizedRoute = useCallback(async (storeId: string): Promise<string[]> => {
    if (!state.currentList) return [];

    // Organize items by store layout (simplified)
    const storeLayout: Record<string, number> = {
      'produce': 1,
      'dairy': 2,
      'meat': 3,
      'grains': 4,
      'pantry': 5,
      'frozen': 6,
      'beverages': 7,
      'other': 8
    };

    const sortedItems = state.currentList.shoppingList.items
      .filter(item => !item.isPurchased)
      .sort((a, b) => (storeLayout[a.category] || 999) - (storeLayout[b.category] || 999))
      .map(item => item.ingredientName);

    return sortedItems;
  }, [state.currentList]);

  /**
   * Export shopping list in different formats
   */
  const exportShoppingList = useCallback((format: 'pdf' | 'txt' | 'json') => {
    if (!state.currentList) return;

    switch (format) {
      case 'txt':
        return exportAsText();
      case 'json':
        return exportAsJSON();
      case 'pdf':
        return exportAsPDF();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }, [state.currentList]);

  const exportAsText = () => {
    if (!state.currentList) return '';

    const lines = [
      'LISTA DE COMPRAS',
      '================',
      '',
      `Generada: ${new Date().toLocaleDateString()}`,
      `Total estimado: $${state.currentList.summary.estimatedCost}`,
      `Items: ${state.currentList.summary.totalItems}`,
      '',
      'PRODUCTOS POR CATEGORÍA',
      '----------------------'
    ];

    state.currentList.shoppingList.categories.forEach(category => {
      lines.push(`\n${category.name.toUpperCase()}:`);
      category.items.forEach(item => {
        const check = item.isPurchased ? '✓' : '☐';
        lines.push(`${check} ${item.ingredientName} - ${item.totalAmount} ${item.unit}`);
      });
    });

    if (state.currentList.optimizations.bulkBuyOpportunities.length > 0) {
      lines.push('\nOPORTUNIDADES DE AHORRO:');
      state.currentList.optimizations.bulkBuyOpportunities.forEach(opp => {
        lines.push(`• ${opp.ingredientName}: Ahorro de $${opp.savings.toFixed(2)}`);
      });
    }

    return lines.join('\n');
  };

  const exportAsJSON = () => {
    return JSON.stringify(state.currentList, null, 2);
  };

  const exportAsPDF = async () => {
    // This would generate a PDF using a library like jsPDF
    // For now, return the text content
    return exportAsText();
  };

  /**
   * Apply filters to shopping list
   */
  const applyFilters = useCallback((newFilters: Partial<ShoppingListFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Get filtered items
   */
  const getFilteredItems = useCallback(() => {
    if (!state.currentList) return [];

    let items = state.currentList.shoppingList.items;

    if (filters.category) {
      items = items.filter(item => item.category === filters.category);
    }

    if (!filters.showPurchased) {
      items = items.filter(item => !item.isPurchased);
    }

    if (filters.priceRange) {
      items = items.filter(item => {
        const price = item.estimatedPrice || 0;
        return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
      });
    }

    return items;
  }, [state.currentList, filters]);

  /**
   * Get price comparison recommendations
   */
  const getPriceRecommendations = useCallback(() => {
    if (!state.currentList) return [];

    return state.currentList.summary.priceComparisons
      .filter(comparison => comparison.availableItems > state.currentList!.summary.totalItems * 0.8)
      .slice(0, 3); // Top 3 recommendations
  }, [state.currentList]);

  return {
    // State
    ...state,
    filters,
    
    // Actions
    generateFromMealPlan,
    processBarcodeScan,
    processReceiptScan,
    addItemToList,
    toggleItemPurchased,
    applyFilters,
    exportShoppingList,
    
    // Computed
    getFilteredItems,
    getOptimizedRoute,
    getPriceRecommendations,
    
    // Utils
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}

/**
 * Helper functions
 */
async function fetchProductInfoFromBarcode(barcode: string): Promise<BarcodeProductInfo | null> {
  try {
    // This would call a real barcode API service like Open Food Facts
    // For now, return mock data
    return {
      name: `Producto ${barcode.slice(-4)}`,
      brand: 'Marca Ejemplo',
      category: 'pantry',
      price: Math.random() * 1000 + 100,
      image: `https://via.placeholder.com/150?text=${barcode.slice(-4)}`
    };
  } catch (error) {
    logger.error('Error fetching product info from barcode', 'fetchProductInfoFromBarcode', error);
    return null;
  }
}

async function confirmAddToPantry(item: ReceiptItem): Promise<boolean> {
  // In a real app, this would show a user confirmation dialog
  // For now, auto-confirm items that seem like pantry items
  const pantryKeywords = ['aceite', 'sal', 'azucar', 'harina', 'arroz', 'pasta', 'conserva'];
  return pantryKeywords.some(keyword => 
    item.name.toLowerCase().includes(keyword)
  );
}