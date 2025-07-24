/**
 * Shopping Slice - Shopping list state management
 */

import { StateCreator } from 'zustand';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  price?: number;
  store?: string;
  notes?: string;
  addedAt: Date;
  completedAt?: Date;
  addedBy?: 'user' | 'voice' | 'scan' | 'meal-plan' | 'ai';
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: Date;
  updatedAt: Date;
  shared: boolean;
  archived: boolean;
  totalEstimatedPrice?: number;
  optimizedRoute?: string[];
  sharedWith?: string[]; // user IDs
  completedAt?: Date;
}

export interface ShoppingOptimization {
  id: string;
  listId: string;
  type: 'route' | 'price' | 'time' | 'store';
  suggestions: {
    title: string;
    description: string;
    savings?: number;
    timeReduction?: number;
    effort: 'low' | 'medium' | 'high';
    applied: boolean;
  }[];
  generatedAt: Date;
}

export interface ShoppingSlice {
  shopping: {
    lists: ShoppingList[];
    activeListId?: string;
    optimizations: ShoppingOptimization[];
    categories: string[];
    stores: string[];
    recentItems: string[]; // frequently added items
    templates: {
      id: string;
      name: string;
      items: Omit<ShoppingItem, 'id' | 'completed' | 'addedAt' | 'completedAt'>[];
      createdAt: Date;
    }[];
    settings: {
      autoOptimize: boolean;
      shareByDefault: boolean;
      voiceEnabled: boolean;
      scanEnabled: boolean;
      smartSuggestions: boolean;
      budgetTracking: boolean;
      weeklyBudget?: number;
    };
    isLoading: boolean;
    lastSync?: Date;
  };
  
  // Actions
  addShoppingList: (list: Omit<ShoppingList, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateShoppingList: (id: string, updates: Partial<ShoppingList>) => void;
  deleteShoppingList: (id: string) => void;
  setActiveList: (id: string) => void;
  duplicateShoppingList: (id: string, newName?: string) => void;
  
  addShoppingItem: (listId: string, item: Omit<ShoppingItem, 'id' | 'addedAt'>) => void;
  updateShoppingItem: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
  deleteShoppingItem: (listId: string, itemId: string) => void;
  toggleShoppingItem: (listId: string, itemId: string) => void;
  bulkToggleItems: (listId: string, itemIds: string[], completed: boolean) => void;
  
  optimizeShoppingList: (listId: string, type?: ShoppingOptimization['type']) => void;
  applyOptimization: (optimizationId: string, suggestionIndex: number) => void;
  
  addItemsFromVoice: (listId: string, items: any[]) => void;
  addItemsFromScan: (listId: string, scannedData: any) => void;
  addItemsFromMealPlan: (listId: string, ingredients: any[]) => void;
  
  saveAsTemplate: (listId: string, name: string) => void;
  applyTemplate: (templateId: string, listId: string) => void;
  deleteTemplate: (templateId: string) => void;
  
  shareList: (listId: string, userIds: string[]) => void;
  unshareList: (listId: string) => void;
  
  updateShoppingSettings: (settings: Partial<typeof shopping.settings>) => void;
  addToRecentItems: (itemName: string) => void;
  clearRecentItems: () => void;
  setShoppingLoading: (loading: boolean) => void;
}

const defaultCategories = [
  'lacteos',
  'carnes',
  'vegetales',
  'frutas',
  'granos',
  'condimentos',
  'panaderia',
  'bebidas',
  'limpieza',
  'otros'
];

const defaultStores = [
  'carrefour',
  'disco',
  'jumbo',
  'coto',
  'dia',
  'walmart',
  'farmacity',
  'verdulería',
  'carnicería',
  'panadería'
];

const defaultSettings = {
  autoOptimize: true,
  shareByDefault: false,
  voiceEnabled: true,
  scanEnabled: true,
  smartSuggestions: true,
  budgetTracking: true,
  weeklyBudget: 5000
};

export const createShoppingSlice: StateCreator<ShoppingSlice> = (set, get) => ({
  shopping: {
    lists: [],
    activeListId: undefined,
    optimizations: [],
    categories: defaultCategories,
    stores: defaultStores,
    recentItems: [],
    templates: [],
    settings: defaultSettings,
    isLoading: false,
    lastSync: undefined
  },
  
  addShoppingList: (list) => set((state) => {
    const newList: ShoppingList = {
      ...list,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    state.shopping.lists.push(newList);
    
    // Set as active if no active list
    if (!state.shopping.activeListId) {
      state.shopping.activeListId = newList.id;
    }
  }),
  
  updateShoppingList: (id, updates) => set((state) => {
    const index = state.shopping.lists.findIndex(list => list.id === id);
    if (index !== -1) {
      Object.assign(state.shopping.lists[index], updates, { updatedAt: new Date() });
    }
  }),
  
  deleteShoppingList: (id) => set((state) => {
    state.shopping.lists = state.shopping.lists.filter(list => list.id !== id);
    state.shopping.optimizations = state.shopping.optimizations.filter(opt => opt.listId !== id);
    
    // Update active list if deleted
    if (state.shopping.activeListId === id) {
      state.shopping.activeListId = state.shopping.lists[0]?.id;
    }
  }),
  
  setActiveList: (id) => set((state) => {
    state.shopping.activeListId = id;
  }),
  
  duplicateShoppingList: (id, newName) => set((state) => {
    const original = state.shopping.lists.find(list => list.id === id);
    if (original) {
      const duplicate: ShoppingList = {
        ...original,
        id: Date.now().toString(),
        name: newName || `${original.name} (Copia)`,
        items: original.items.map(item => ({
          ...item,
          id: Date.now().toString() + Math.random(),
          completed: false,
          addedAt: new Date(),
          completedAt: undefined
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        shared: false,
        sharedWith: [],
        completedAt: undefined
      };
      
      state.shopping.lists.push(duplicate);
    }
  }),
  
  addShoppingItem: (listId, item) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      const newItem: ShoppingItem = {
        ...item,
        id: Date.now().toString() + Math.random(),
        addedAt: new Date()
      };
      
      list.items.push(newItem);
      list.updatedAt = new Date();
      
      // Add to recent items
      get().addToRecentItems(item.name);
      
      // Add category and store if new
      if (!state.shopping.categories.includes(item.category)) {
        state.shopping.categories.push(item.category);
      }
      
      if (item.store && !state.shopping.stores.includes(item.store)) {
        state.shopping.stores.push(item.store);
      }
    }
  }),
  
  updateShoppingItem: (listId, itemId, updates) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      const item = list.items.find(item => item.id === itemId);
      if (item) {
        Object.assign(item, updates);
        list.updatedAt = new Date();
      }
    }
  }),
  
  deleteShoppingItem: (listId, itemId) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      list.items = list.items.filter(item => item.id !== itemId);
      list.updatedAt = new Date();
    }
  }),
  
  toggleShoppingItem: (listId, itemId) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      const item = list.items.find(item => item.id === itemId);
      if (item) {
        item.completed = !item.completed;
        item.completedAt = item.completed ? new Date() : undefined;
        list.updatedAt = new Date();
        
        // Check if all items are completed
        const allCompleted = list.items.every(item => item.completed);
        if (allCompleted && !list.completedAt) {
          list.completedAt = new Date();
        } else if (!allCompleted && list.completedAt) {
          list.completedAt = undefined;
        }
      }
    }
  }),
  
  bulkToggleItems: (listId, itemIds, completed) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      list.items.forEach(item => {
        if (itemIds.includes(item.id)) {
          item.completed = completed;
          item.completedAt = completed ? new Date() : undefined;
        }
      });
      list.updatedAt = new Date();
    }
  }),
  
  optimizeShoppingList: (listId, type) => set((state) => {
    // This would integrate with the optimization service
    // For now, create a mock optimization
    const optimization: ShoppingOptimization = {
      id: Date.now().toString(),
      listId,
      type: type || 'route',
      suggestions: [
        {
          title: 'Optimizar ruta de tiendas',
          description: 'Reorganizar el orden de tiendas para ahorrar 15 minutos',
          timeReduction: 15,
          effort: 'low',
          applied: false
        },
        {
          title: 'Sustituir productos',
          description: 'Cambiar marcas premium por equivalentes más baratos',
          savings: 450,
          effort: 'medium',
          applied: false
        }
      ],
      generatedAt: new Date()
    };
    
    state.shopping.optimizations.push(optimization);
  }),
  
  applyOptimization: (optimizationId, suggestionIndex) => set((state) => {
    const optimization = state.shopping.optimizations.find(opt => opt.id === optimizationId);
    if (optimization && optimization.suggestions[suggestionIndex]) {
      optimization.suggestions[suggestionIndex].applied = true;
      
      // Apply the actual optimization logic here
      // This would depend on the type of optimization
    }
  }),
  
  addItemsFromVoice: (listId, items) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      items.forEach(voiceItem => {
        const newItem: ShoppingItem = {
          id: Date.now().toString() + Math.random(),
          name: voiceItem.name,
          quantity: voiceItem.quantity || 1,
          unit: voiceItem.unit || 'unidad',
          category: voiceItem.category || 'otros',
          priority: 'medium',
          completed: false,
          addedAt: new Date(),
          addedBy: 'voice'
        };
        
        list.items.push(newItem);
      });
      
      list.updatedAt = new Date();
    }
  }),
  
  addItemsFromScan: (listId, scannedData) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      if (scannedData.type === 'receipt') {
        scannedData.items.forEach((item: any) => {
          const newItem: ShoppingItem = {
            id: Date.now().toString() + Math.random(),
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'unidad',
            category: item.category || 'otros',
            priority: 'medium',
            completed: false,
            price: item.price,
            store: scannedData.store,
            addedAt: new Date(),
            addedBy: 'scan'
          };
          
          list.items.push(newItem);
        });
      } else if (scannedData.type === 'barcode') {
        const newItem: ShoppingItem = {
          id: Date.now().toString(),
          name: scannedData.name,
          quantity: 1,
          unit: 'unidad',
          category: scannedData.category || 'otros',
          priority: 'medium',
          completed: false,
          price: scannedData.price,
          addedAt: new Date(),
          addedBy: 'scan'
        };
        
        list.items.push(newItem);
      }
      
      list.updatedAt = new Date();
    }
  }),
  
  addItemsFromMealPlan: (listId, ingredients) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      ingredients.forEach(ingredient => {
        const newItem: ShoppingItem = {
          id: Date.now().toString() + Math.random(),
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category || 'otros',
          priority: 'medium',
          completed: false,
          addedAt: new Date(),
          addedBy: 'meal-plan'
        };
        
        list.items.push(newItem);
      });
      
      list.updatedAt = new Date();
    }
  }),
  
  saveAsTemplate: (listId, name) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      const template = {
        id: Date.now().toString(),
        name,
        items: list.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          priority: item.priority,
          notes: item.notes
        })),
        createdAt: new Date()
      };
      
      state.shopping.templates.push(template);
    }
  }),
  
  applyTemplate: (templateId, listId) => set((state) => {
    const template = state.shopping.templates.find(t => t.id === templateId);
    const list = state.shopping.lists.find(list => list.id === listId);
    
    if (template && list) {
      template.items.forEach(templateItem => {
        const newItem: ShoppingItem = {
          ...templateItem,
          id: Date.now().toString() + Math.random(),
          completed: false,
          addedAt: new Date(),
          addedBy: 'user'
        };
        
        list.items.push(newItem);
      });
      
      list.updatedAt = new Date();
    }
  }),
  
  deleteTemplate: (templateId) => set((state) => {
    state.shopping.templates = state.shopping.templates.filter(t => t.id !== templateId);
  }),
  
  shareList: (listId, userIds) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      list.shared = true;
      list.sharedWith = userIds;
      list.updatedAt = new Date();
    }
  }),
  
  unshareList: (listId) => set((state) => {
    const list = state.shopping.lists.find(list => list.id === listId);
    if (list) {
      list.shared = false;
      list.sharedWith = [];
      list.updatedAt = new Date();
    }
  }),
  
  updateShoppingSettings: (settings) => set((state) => {
    Object.assign(state.shopping.settings, settings);
  }),
  
  addToRecentItems: (itemName) => set((state) => {
    const trimmedName = itemName.trim().toLowerCase();
    
    // Remove if already exists and add to front
    state.shopping.recentItems = state.shopping.recentItems.filter(item => item !== trimmedName);
    state.shopping.recentItems.unshift(trimmedName);
    
    // Keep only last 20 items
    if (state.shopping.recentItems.length > 20) {
      state.shopping.recentItems = state.shopping.recentItems.slice(0, 20);
    }
  }),
  
  clearRecentItems: () => set((state) => {
    state.shopping.recentItems = [];
  }),
  
  setShoppingLoading: (loading) => set((state) => {
    state.shopping.isLoading = loading;
  })
});