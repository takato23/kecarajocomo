import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { shoppingListService, ShoppingList, ShoppingItem } from '@/lib/services/shoppingListService';

import { usePriceIntegration } from './usePriceIntegration';

export interface UseShoppingListReturn {
  // State
  list: ShoppingList | null;
  items: ShoppingItem[];
  loading: boolean;
  error: string | null;
  
  // Stats
  stats: {
    totalItems: number;
    checkedItems: number;
    totalPrice: number;
    checkedPrice: number;
    progress: number;
    savings: number;
  };
  
  // Actions
  createList: (name?: string, budget?: number) => Promise<void>;
  addItem: (item: Partial<ShoppingItem>) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<ShoppingItem>) => Promise<void>;
  toggleItem: (itemId: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, change: number) => Promise<void>;
  clearCompleted: () => Promise<void>;
  duplicateList: () => Promise<void>;
  updateBudget: (budget: number) => Promise<void>;
  
  // Price integration
  optimizePrices: () => Promise<void>;
  isOptimizing: boolean;
  lastOptimization: any;
}

export function useShoppingList(): UseShoppingListReturn {
  const { user } = useAuth();
  const { optimizePrices: optimizePricesBase, lastOptimization, isOptimizing } = usePriceIntegration();
  
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate statistics
  const stats = (() => {
    const totalItems = items.length;
    const checkedItems = items.filter(item => item.checked).length;
    const totalPrice = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    const checkedPrice = items
      .filter(item => item.checked)
      .reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
    const savings = totalPrice * 0.15; // Estimated 15% savings

    return {
      totalItems,
      checkedItems,
      totalPrice,
      checkedPrice,
      progress,
      savings
    };
  })();

  // Load active list and items
  const loadListData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get active list
      let activeList = await shoppingListService.getActiveList(user.id);
      
      // Create a new list if none exists
      if (!activeList) {
        activeList = await shoppingListService.createList(user.id);
      }

      setList(activeList);

      // Get items for the list
      const listItems = await shoppingListService.getListItems(activeList.id);
      setItems(listItems);
    } catch (err: unknown) {
      console.error('Error loading shopping list:', err);
      setError('Error al cargar la lista de compras');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new list
  const createList = async (name?: string, budget?: number) => {
    if (!user) return;

    try {
      const newList = await shoppingListService.createList(user.id, name, budget);
      setList(newList);
      setItems([]); // Clear items for new list
    } catch (err: unknown) {
      console.error('Error creating list:', err);
      setError('Error al crear la lista');
    }
  };

  // Add item to list
  const addItem = async (item: Partial<ShoppingItem>) => {
    if (!list) return;

    try {
      const newItem = await shoppingListService.addItem(list.id, item);
      setItems(prev => [...prev, newItem]);
      
      // Save price history if price is provided
      if (newItem.price && newItem.store) {
        await shoppingListService.savePriceHistory(newItem.id, newItem.store, newItem.price, newItem.unit);
      }
    } catch (err: unknown) {
      console.error('Error adding item:', err);
      setError('Error al agregar el producto');
    }
  };

  // Update item
  const updateItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    try {
      const updatedItem = await shoppingListService.updateItem(itemId, updates);
      setItems(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ));
      
      // Save price history if price was updated
      if (updates.price && updatedItem.store) {
        await shoppingListService.savePriceHistory(itemId, updatedItem.store, updates.price, updatedItem.unit);
      }
    } catch (err: unknown) {
      console.error('Error updating item:', err);
      setError('Error al actualizar el producto');
    }
  };

  // Toggle item checked status
  const toggleItem = async (itemId: string) => {
    try {
      await shoppingListService.toggleItem(itemId);
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ));
    } catch (err: unknown) {
      console.error('Error toggling item:', err);
      setError('Error al actualizar el estado');
    }
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    try {
      await shoppingListService.deleteItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err: unknown) {
      console.error('Error deleting item:', err);
      setError('Error al eliminar el producto');
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, change: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + change);
    await updateItem(itemId, { quantity: newQuantity });
  };

  // Clear completed items
  const clearCompleted = async () => {
    if (!list) return;

    try {
      await shoppingListService.clearCompleted(list.id);
      setItems(prev => prev.filter(item => !item.checked));
    } catch (err: unknown) {
      console.error('Error clearing completed items:', err);
      setError('Error al limpiar completados');
    }
  };

  // Duplicate current list
  const duplicateList = async () => {
    if (!list || !user) return;

    try {
      const newList = await shoppingListService.duplicateList(list.id, user.id);
      setList(newList);
      await loadListData(); // Reload to get the new items
    } catch (err: unknown) {
      console.error('Error duplicating list:', err);
      setError('Error al duplicar la lista');
    }
  };

  // Update budget
  const updateBudget = async (budget: number) => {
    if (!list) return;

    try {
      await shoppingListService.updateItem(list.id, { budget });
      setList(prev => prev ? { ...prev, budget } : null);
    } catch (err: unknown) {
      console.error('Error updating budget:', err);
      setError('Error al actualizar el presupuesto');
    }
  };

  // Optimize prices integration
  const optimizePrices = async () => {
    const itemNames = items.map(item => `${item.quantity} ${item.name}`);
    const results = await optimizePricesBase(itemNames);
    
    // Update items with found prices
    if (results && results.itemsWithPrices) {
      for (const priceResult of results.itemsWithPrices) {
        const item = items.find(i => 
          i.name.toLowerCase().includes(priceResult.productName.toLowerCase()) ||
          priceResult.productName.toLowerCase().includes(i.name.toLowerCase())
        );
        
        if (item && priceResult.bestPrice) {
          await updateItem(item.id, {
            price: priceResult.bestPrice.price,
            store: priceResult.bestPrice.store
          });
        }
      }
    }
  };

  // Load data on mount and user change
  useEffect(() => {
    loadListData();
  }, [loadListData]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!list) return;

    const unsubscribe = shoppingListService.subscribeToListItems(list.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setItems(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setItems(prev => prev.map(item => 
          item.id === payload.new.id ? payload.new : item
        ));
      } else if (payload.eventType === 'DELETE') {
        setItems(prev => prev.filter(item => item.id !== payload.old.id));
      }
    });

    return unsubscribe;
  }, [list?.id]);

  return {
    list,
    items,
    loading,
    error,
    stats,
    createList,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    updateQuantity,
    clearCompleted,
    duplicateList,
    updateBudget,
    optimizePrices,
    isOptimizing,
    lastOptimization
  };
}