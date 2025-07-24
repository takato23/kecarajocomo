import { create } from 'zustand';

import { shoppingListService, ShoppingList, ShoppingItem } from '@/lib/services/shoppingListService';

interface ShoppingListItemForStore {
  id: string;
  ingredient_id?: string | null;
  custom_name?: string | null;
  quantity: number;
  unit: string;
  is_checked: boolean;
  price?: number | null;
  store?: string | null;
  notes?: string | null;
  ingredient?: {
    id: string;
    name: string;
    category?: string;
  } | null;
}

interface ShoppingListForStore {
  id: string;
  user_id: string;
  name: string;
  meal_plan_id?: string | null;
  is_active: boolean;
  budget?: number | null;
  created_at: string;
  updated_at: string;
  items?: ShoppingListItemForStore[];
}

interface ShoppingState {
  lists: ShoppingListForStore[];
  activeList: ShoppingListForStore | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchShoppingLists: (userId: string) => Promise<void>;
  fetchActiveList: (userId: string) => Promise<void>;
  createList: (userId: string, name: string, mealPlanId?: string) => Promise<ShoppingListForStore | null>;
  updateList: (id: string, updates: Partial<ShoppingListForStore>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  setActiveList: (id: string) => Promise<void>;
  
  // Item management
  addItem: (listId: string, item: Omit<ShoppingListItemForStore, 'id'>) => Promise<void>;
  updateItem: (listId: string, itemId: string, updates: Partial<ShoppingListItemForStore>) => Promise<void>;
  deleteItem: (listId: string, itemId: string) => Promise<void>;
  toggleItemChecked: (listId: string, itemId: string) => Promise<void>;
  
  reset: () => void;
}

// Transform Supabase types to store types
const transformShoppingItemToStore = (item: ShoppingItem): ShoppingListItemForStore => ({
  id: item.id,
  ingredient_id: null,
  custom_name: item.name,
  quantity: item.quantity,
  unit: item.unit || 'unidades',
  is_checked: item.checked,
  price: item.price,
  store: item.store,
  notes: item.notes,
  ingredient: null
});

const transformShoppingListToStore = (list: ShoppingList, items?: ShoppingItem[]): ShoppingListForStore => ({
  id: list.id,
  user_id: list.user_id,
  name: list.name,
  meal_plan_id: null,
  is_active: list.is_active,
  budget: list.budget,
  created_at: list.created_at,
  updated_at: list.updated_at,
  items: items?.map(transformShoppingItemToStore) || []
});

const transformStoreItemToSupabase = (item: Omit<ShoppingListItemForStore, 'id'>): Partial<ShoppingItem> => ({
  name: item.custom_name || '',
  quantity: item.quantity,
  unit: item.unit,
  category: 'other',
  store: item.store,
  price: item.price,
  checked: item.is_checked,
  notes: item.notes,
  position: 0
});

export const useShoppingStore = create<ShoppingState>()((set, get) => ({
  lists: [],
  activeList: null,
  isLoading: false,
  error: null,

  fetchShoppingLists: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // For now, we'll just get the active list since our service is focused on that
      const activeList = await shoppingListService.getActiveList(userId);
      if (activeList) {
        const items = await shoppingListService.getListItems(activeList.id);
        const storeList = transformShoppingListToStore(activeList, items);
        set({ 
          lists: [storeList],
          isLoading: false 
        });
      } else {
        set({ 
          lists: [],
          isLoading: false 
        });
      }
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to fetch shopping lists', 
        isLoading: false 
      });
    }
  },

  fetchActiveList: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const activeList = await shoppingListService.getActiveList(userId);
      if (activeList) {
        const items = await shoppingListService.getListItems(activeList.id);
        const storeList = transformShoppingListToStore(activeList, items);
        set({ 
          activeList: storeList,
          isLoading: false 
        });
      } else {
        // Create a new list if none exists
        const newList = await shoppingListService.createList(userId);
        const storeList = transformShoppingListToStore(newList, []);
        set({ 
          activeList: storeList,
          lists: [storeList],
          isLoading: false 
        });
      }
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to fetch active list', 
        isLoading: false 
      });
    }
  },

  createList: async (userId: string, name: string, mealPlanId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const newList = await shoppingListService.createList(userId, name, 1000);
      const storeList = transformShoppingListToStore(newList, []);

      set(state => ({
        lists: [...state.lists.map(list => ({ ...list, is_active: false })), storeList],
        activeList: storeList,
        isLoading: false,
      }));

      return storeList;
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to create shopping list', 
        isLoading: false 
      });
      return null;
    }
  },

  updateList: async (id: string, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // For now, we'll just update the local state since our service doesn't have updateList
      set(state => ({
        lists: state.lists.map(list => 
          list.id === id ? { ...list, ...updates, updated_at: new Date().toISOString() } : list
        ),
        activeList: state.activeList?.id === id 
          ? { ...state.activeList, ...updates, updated_at: new Date().toISOString() }
          : state.activeList,
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to update list', 
        isLoading: false 
      });
    }
  },

  deleteList: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Our service doesn't have delete list, so we'll just update local state
      set(state => ({
        lists: state.lists.filter(list => list.id !== id),
        activeList: state.activeList?.id === id ? null : state.activeList,
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to delete list', 
        isLoading: false 
      });
    }
  },

  setActiveList: async (id: string) => {
    const { lists } = get();
    const list = lists.find(l => l.id === id);
    if (!list) return;

    set({ isLoading: true, error: null });
    
    try {
      set(state => ({
        lists: state.lists.map(l => ({
          ...l,
          is_active: l.id === id,
        })),
        activeList: { ...list, is_active: true },
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to set active list', 
        isLoading: false 
      });
    }
  },

  addItem: async (listId: string, item) => {
    set({ isLoading: true, error: null });
    
    try {
      const supabaseItem = transformStoreItemToSupabase(item);
      const newItem = await shoppingListService.addItem(listId, supabaseItem);
      const storeItem = transformShoppingItemToStore(newItem);

      set(state => ({
        lists: state.lists.map(list => 
          list.id === listId 
            ? { ...list, items: [...(list.items || []), storeItem] }
            : list
        ),
        activeList: state.activeList?.id === listId
          ? { ...state.activeList, items: [...(state.activeList.items || []), storeItem] }
          : state.activeList,
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to add item', 
        isLoading: false 
      });
    }
  },

  updateItem: async (listId: string, itemId: string, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const supabaseUpdates: Partial<ShoppingItem> = {};
      if (updates.custom_name !== undefined) supabaseUpdates.name = updates.custom_name;
      if (updates.quantity !== undefined) supabaseUpdates.quantity = updates.quantity;
      if (updates.unit !== undefined) supabaseUpdates.unit = updates.unit;
      if (updates.is_checked !== undefined) supabaseUpdates.checked = updates.is_checked;
      if (updates.price !== undefined) supabaseUpdates.price = updates.price;
      if (updates.store !== undefined) supabaseUpdates.store = updates.store;
      if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;

      await shoppingListService.updateItem(itemId, supabaseUpdates);

      set(state => ({
        lists: state.lists.map(list => 
          list.id === listId 
            ? { 
                ...list, 
                items: list.items?.map(item => 
                  item.id === itemId ? { ...item, ...updates } : item
                ) 
              }
            : list
        ),
        activeList: state.activeList?.id === listId
          ? { 
              ...state.activeList, 
              items: state.activeList.items?.map(item => 
                item.id === itemId ? { ...item, ...updates } : item
              ) 
            }
          : state.activeList,
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to update item', 
        isLoading: false 
      });
    }
  },

  deleteItem: async (listId: string, itemId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await shoppingListService.deleteItem(itemId);

      set(state => ({
        lists: state.lists.map(list => 
          list.id === listId 
            ? { 
                ...list, 
                items: list.items?.filter(item => item.id !== itemId) 
              }
            : list
        ),
        activeList: state.activeList?.id === listId
          ? { 
              ...state.activeList, 
              items: state.activeList.items?.filter(item => item.id !== itemId) 
            }
          : state.activeList,
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to delete item', 
        isLoading: false 
      });
    }
  },

  toggleItemChecked: async (listId: string, itemId: string) => {
    const state = get();
    const list = state.lists.find(l => l.id === listId);
    const item = list?.items?.find(i => i.id === itemId);
    
    if (!item) return;

    try {
      await shoppingListService.toggleItem(itemId);
      await state.updateItem(listId, itemId, { is_checked: !item.is_checked });
    } catch (error: unknown) {
      set({ 
        error: error.message || 'Failed to toggle item', 
        isLoading: false 
      });
    }
  },

  reset: () => {
    set({
      lists: [],
      activeList: null,
      isLoading: false,
      error: null,
    });
  },
}));