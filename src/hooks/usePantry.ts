'use client';

import { useState, useEffect, useCallback } from 'react';

import { usePantryStore } from '@/stores/pantry';
import { 
  fetchUserPantryItems,
  addPantryItem,
  addMultiplePantryItems,
  getOrCreateIngredient,
  subscribeToPantryChanges
} from '@/lib/pantry/database';
import { parseMultipleIngredients, categorizeIngredient } from '@/lib/pantry/parser';
import { PantryItem, ParsedIngredientInput } from '@/types/pantry';
import { logger } from '@/services/logger';

// Hook for pantry management with database integration
export function usePantry(userId?: string) {
  const {
    items,
    stats,
    isLoading,
    error,
    setItems,
    addItem,
    updateItem,
    deleteItem,
    setLoading,
    calculateStats,
    getOrCreateIngredient: getOrCreateIngredientLocal
  } = usePantryStore();

  // Local loading states
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isUpdatingItems, setIsUpdatingItems] = useState<Record<string, boolean>>({});

  // Fetch pantry items from database
  const fetchItems = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const items = await fetchUserPantryItems(userId);
      setItems(items);
    } catch (error: unknown) {
      logger.error('Error fetching pantry items', 'usePantry', error);
    } finally {
      setLoading(false);
    }
  }, [userId, setItems, setLoading]);

  // Add a single item to pantry
  const addItemToPantry = useCallback(async (formData: {
    ingredient_name: string;
    quantity: number;
    unit: string;
    expiration_date?: Date;
    location?: string;
    notes?: string;
    photo?: File;
  }) => {
    if (!userId) throw new Error('User ID is required');

    setIsAdding(true);
    try {
      // Get or create ingredient
      const category = categorizeIngredient(formData.ingredient_name);
      const ingredient = await getOrCreateIngredient(formData.ingredient_name, category);

      // Prepare pantry item data
      const itemData = {
        ingredient_id: ingredient.id,
        quantity: formData.quantity,
        unit: formData.unit,
        expiration_date: formData.expiration_date,
        location: formData.location || 'despensa',
        notes: formData.notes,
        // TODO: Handle photo upload
        photo_url: undefined,
        low_stock_threshold: Math.ceil(formData.quantity * 0.2) // 20% of current quantity
      };

      // Add to database
      const newItem = await addPantryItem(userId, itemData);
      
      // Update local store
      addItem(newItem);
      
      return newItem;
    } catch (error: unknown) {
      logger.error('Error adding item to pantry', 'usePantry', error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  }, [userId, addItem]);

  // Add multiple items from voice input
  const addMultipleItemsToPantry = useCallback(async (parsedItems: ParsedIngredientInput[]) => {
    if (!userId) throw new Error('User ID is required');

    setIsAdding(true);
    try {
      const itemsToAdd = [];

      // Process each parsed item
      for (const parsedItem of parsedItems) {
        const category = categorizeIngredient(parsedItem.normalized_name);
        const ingredient = await getOrCreateIngredient(parsedItem.extracted_name, category);

        itemsToAdd.push({
          ingredient_id: ingredient.id,
          quantity: parsedItem.quantity || 1,
          unit: parsedItem.unit || 'pcs',
          location: 'despensa',
          low_stock_threshold: Math.ceil((parsedItem.quantity || 1) * 0.2)
        });
      }

      // Add all items to database
      const newItems = await addMultiplePantryItems(userId, itemsToAdd);
      
      // Update local store
      newItems.forEach(item => addItem(item));
      
      return newItems;
    } catch (error: unknown) {
      logger.error('Error adding multiple items to pantry', 'usePantry', error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  }, [userId, addItem]);

  // Update a pantry item
  const updatePantryItem = useCallback(async (id: string, updates: Partial<PantryItem>) => {
    setIsUpdatingItems(prev => ({ ...prev, [id]: true }));
    try {
      const updatedItem = await updatePantryItem(id, updates);
      updateItem(id, updates);
      return updatedItem;
    } catch (error: unknown) {
      logger.error('Error updating pantry item', 'usePantry', error);
      throw error;
    } finally {
      setIsUpdatingItems(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [updateItem]);

  // Delete a pantry item
  const deletePantryItem = useCallback(async (id: string) => {
    setIsDeleting(prev => ({ ...prev, [id]: true }));
    try {
      await deletePantryItem(id);
      deleteItem(id);
    } catch (error: unknown) {
      logger.error('Error deleting pantry item', 'usePantry', error);
      throw error;
    } finally {
      setIsDeleting(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [deleteItem]);

  // Quick quantity update
  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    return updatePantryItem(id, { quantity });
  }, [updatePantryItem]);

  // Process voice input
  const processVoiceInput = useCallback(async (transcript: string) => {
    const parsedItems = parseMultipleIngredients(transcript);
    return addMultipleItemsToPantry(parsedItems);
  }, [addMultipleItemsToPantry]);

  // Setup realtime subscription
  useEffect(() => {
    if (!userId) return;

    const subscription = subscribeToPantryChanges(userId, (payload) => {
      logger.debug('Realtime update', 'usePantry', payload);
      // Refresh items when changes occur from other clients
      fetchItems();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchItems]);

  // Initial fetch
  useEffect(() => {
    if (userId && items.length === 0) {
      fetchItems();
    }
  }, [userId, items.length, fetchItems]);

  // Recalculate stats when items change
  useEffect(() => {
    calculateStats();
  }, [items, calculateStats]);

  return {
    // Data
    items,
    stats,
    
    // Loading states
    isLoading,
    isAdding,
    isDeleting,
    isUpdatingItems,
    error,
    
    // Actions
    fetchItems,
    addItemToPantry,
    addMultipleItemsToPantry,
    updatePantryItem,
    deletePantryItem,
    updateQuantity,
    processVoiceInput,
    
    // Utility functions
    getExpiringItems: usePantryStore((state) => state.getExpiringItems),
    getLowStockItems: usePantryStore((state) => state.getLowStockItems),
    getItemsByCategory: usePantryStore((state) => state.getItemsByCategory)
  };
}

// Hook for pantry UI state management
export function usePantryUI() {
  const {
    uiState,
    setUIState,
    resetFilters
  } = usePantryStore();

  const updateFilter = useCallback((key: keyof typeof uiState, value: any) => {
    setUIState({ [key]: value });
  }, [setUIState]);

  const toggleSort = useCallback(() => {
    setUIState({ 
      sort_order: uiState.sort_order === 'asc' ? 'desc' : 'asc' 
    });
  }, [uiState.sort_order, setUIState]);

  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    setUIState({ view_mode: mode });
  }, [setUIState]);

  const setSearch = useCallback((query: string) => {
    setUIState({ search_query: query });
  }, [setUIState]);

  const setSortBy = useCallback((sortBy: string) => {
    setUIState({ sort_by: sortBy as any });
  }, [setUIState]);

  const toggleFilter = useCallback((filter: 'show_expired' | 'show_low_stock') => {
    setUIState({ [filter]: !uiState[filter] });
  }, [uiState, setUIState]);

  return {
    uiState,
    updateFilter,
    toggleSort,
    setViewMode,
    setSearch,
    setSortBy,
    toggleFilter,
    resetFilters
  };
}

// Hook for filtered pantry items
export function useFilteredPantryItems() {
  return usePantryStore((state) => {
    let filtered = state.items;

    // Apply search filter
    if (state.uiState.search_query) {
      const query = state.uiState.search_query.toLowerCase();
      filtered = filtered.filter(item => 
        item.ingredient?.name.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (state.uiState.filter_category) {
      filtered = filtered.filter(item => 
        item.ingredient?.category === state.uiState.filter_category
      );
    }

    // Apply location filter
    if (state.uiState.filter_location) {
      filtered = filtered.filter(item => item.location === state.uiState.filter_location);
    }

    // Apply expired filter
    if (state.uiState.show_expired) {
      filtered = filtered.filter(item => {
        if (!item.expiration_date) return false;
        return new Date(item.expiration_date) < new Date();
      });
    }

    // Apply low stock filter
    if (state.uiState.show_low_stock) {
      filtered = filtered.filter(item => {
        if (!item.low_stock_threshold) return false;
        return item.quantity <= item.low_stock_threshold;
      });
    }

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (state.uiState.sort_by) {
        case 'name':
          aValue = a.ingredient?.name || '';
          bValue = b.ingredient?.name || '';
          break;
        case 'category':
          aValue = a.ingredient?.category || '';
          bValue = b.ingredient?.category || '';
          break;
        case 'expiration':
          aValue = a.expiration_date ? new Date(a.expiration_date) : new Date('9999-12-31');
          bValue = b.expiration_date ? new Date(b.expiration_date) : new Date('9999-12-31');
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a.ingredient?.name || '';
          bValue = b.ingredient?.name || '';
      }

      if (aValue < bValue) return state.uiState.sort_order === 'asc' ? -1 : 1;
      if (aValue > bValue) return state.uiState.sort_order === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });
}