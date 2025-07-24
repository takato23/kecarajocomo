import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PantryItem, PantryStats, IngredientCategory } from '@/types/pantry';

interface PantryStore {
  items: PantryItem[];
  stats: PantryStats;
  isLoading: boolean;
  error: string | null;
  filters: {
    lowStock: boolean;
    expiringSoon: boolean;
  };
  categories: string[];
  
  setItems: (items: PantryItem[]) => void;
  addItem: (userId: string, item: Partial<PantryItem>) => Promise<void>;
  updateItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  
  fetchPantryItems: (userId?: string) => Promise<void>;
  getUserPantryItems: () => PantryItem[];
  findIngredientByName: (name: string) => PantryItem | undefined;
  checkIngredientAvailability: (ingredientName: string, requiredQuantity?: number) => {
    available: boolean;
    currentQuantity: number;
    missingQuantity: number;
  };
  
  checkExpiring: () => PantryItem[];
  checkLowStock: () => PantryItem[];
  suggestRestocking: () => PantryItem[];
  setFilters: (filters: Partial<{ lowStock: boolean; expiringSoon: boolean }>) => void;
  
  calculateStats: () => void;
  reset: () => void;
}

const defaultStats: PantryStats = {
  total_items: 0,
  categories: {} as Record<IngredientCategory, number>,
  expiring_soon: 0,
  expired: 0,
  low_stock: 0,
  items_by_location: {}
};

export const usePantryStore = create<PantryStore>()(
  persist(
    (set, get) => ({
      items: [],
      stats: defaultStats,
      isLoading: false,
      error: null,
      filters: {
        lowStock: false,
        expiringSoon: false,
      },
      categories: [],

      setItems: (items) => {
        set({ items });
        get().calculateStats();
      },

      addItem: async (userId: string, item: Partial<PantryItem>) => {
        // Generate a temporary ID for the new item
        const newItem = {
          id: `temp-${Date.now()}`,
          user_id: userId,
          ingredient_id: `temp-ingredient-${Date.now()}`,
          quantity: 1,
          unit: 'pcs',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item,
          // If ingredient info is provided directly, create a full ingredient object
          ingredient: item.ingredient || {
            id: `temp-ingredient-${Date.now()}`,
            name: (item as any).ingredient?.name || 'Unknown',
            normalized_name: ((item as any).ingredient?.name || 'Unknown').toLowerCase(),
            category: (item as any).ingredient?.category || 'otros',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        } as PantryItem;
        
        set((state) => ({ items: [...state.items, newItem] }));
        get().calculateStats();
      },

      updateItem: async (id, updates) => {
        set((state) => ({
          items: state.items.map(item => 
            item.id === id ? { ...item, ...updates } : item
          )
        }));
        get().calculateStats();
      },

      deleteItem: async (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }));
        get().calculateStats();
      },

      fetchPantryItems: async () => {
        set({ isLoading: true, error: null });
        try {
          // Mock data for now
          set({ items: [], isLoading: false });
          get().calculateStats();
        } catch (error: unknown) {
          set({ error: error.message, isLoading: false });
        }
      },

      getUserPantryItems: () => get().items,

      findIngredientByName: (name: string) => {
        const { items } = get();
        return items.find(item => 
          item.ingredient?.name.toLowerCase() === name.toLowerCase()
        );
      },

      checkIngredientAvailability: (ingredientName: string, requiredQuantity = 0) => {
        const item = get().findIngredientByName(ingredientName);
        
        if (!item) {
          return {
            available: false,
            currentQuantity: 0,
            missingQuantity: requiredQuantity
          };
        }

        const available = item.quantity >= requiredQuantity;
        
        return {
          available,
          currentQuantity: item.quantity,
          missingQuantity: available ? 0 : requiredQuantity - item.quantity
        };
      },

      checkExpiring: () => {
        const { items } = get();
        const today = new Date();
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);
        
        return items.filter(item => {
          if (!item.expiration_date) return false;
          const expDate = new Date(item.expiration_date);
          return expDate <= threeDaysFromNow && expDate >= today;
        });
      },

      checkLowStock: () => {
        const { items } = get();
        return items.filter(item => {
          // Consider low stock if quantity is less than 20% of min_quantity
          // or less than 2 units for items without min_quantity
          const minQty = item.min_quantity || 10;
          return item.quantity < minQty * 0.2 || item.quantity < 2;
        });
      },

      suggestRestocking: () => {
        const { items } = get();
        return items.filter(item => {
          const minQty = item.min_quantity || 5;
          return item.quantity < minQty;
        });
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      calculateStats: () => {
        const { items } = get();
        set({ 
          stats: {
            ...defaultStats,
            total_items: items.length
          }
        });
      },

      reset: () => {
        set({
          items: [],
          stats: defaultStats,
          isLoading: false,
          error: null,
          filters: {
            lowStock: false,
            expiringSoon: false,
          },
          categories: []
        });
      }
    }),
    {
      name: 'pantry-storage',
      partialize: (state) => ({
        items: state.items
      })
    }
  )
);