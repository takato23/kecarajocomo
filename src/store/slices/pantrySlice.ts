/**
 * Pantry Slice - Pantry state management
 */

import { StateCreator } from 'zustand';

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minimumStock?: number;
  maximumStock?: number;
  averageConsumption?: number; // per week
  lastPurchased?: Date;
  expirationDate?: Date;
  location?: string; // pantry, fridge, freezer
  barcode?: string;
  brand?: string;
  price?: number;
  store?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockAlert {
  id: string;
  itemId: string;
  type: 'low_stock' | 'expiring' | 'expired';
  threshold: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PantrySlice {
  pantry: {
    items: PantryItem[];
    alerts: StockAlert[];
    categories: string[];
    locations: string[];
    isLoading: boolean;
    lastSync?: Date;
  };
  
  // Actions
  addPantryItem: (item: Omit<PantryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePantryItem: (id: string, updates: Partial<PantryItem>) => void;
  deletePantryItem: (id: string) => void;
  updateStock: (id: string, quantity: number, operation: 'add' | 'subtract' | 'set') => void;
  addFromScan: (scannedData: any) => void;
  checkAlerts: () => void;
  dismissAlert: (alertId: string) => void;
  bulkUpdateStock: (updates: { id: string; quantity: number }[]) => void;
  setPantryLoading: (loading: boolean) => void;
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

const defaultLocations = [
  'despensa',
  'heladera',
  'freezer',
  'alacena'
];

export const createPantrySlice: StateCreator<PantrySlice> = (set, get) => ({
  pantry: {
    items: [],
    alerts: [],
    categories: defaultCategories,
    locations: defaultLocations,
    isLoading: false,
    lastSync: undefined
  },
  
  addPantryItem: (item) => set((state) => {
    const newItem: PantryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    state.pantry.items.push(newItem);
    
    // Add category if new
    if (!state.pantry.categories.includes(item.category)) {
      state.pantry.categories.push(item.category);
    }
    
    // Add location if new
    if (item.location && !state.pantry.locations.includes(item.location)) {
      state.pantry.locations.push(item.location);
    }
  }),
  
  updatePantryItem: (id, updates) => set((state) => {
    const index = state.pantry.items.findIndex(item => item.id === id);
    if (index !== -1) {
      Object.assign(state.pantry.items[index], updates, { updatedAt: new Date() });
    }
  }),
  
  deletePantryItem: (id) => set((state) => {
    state.pantry.items = state.pantry.items.filter(item => item.id !== id);
    state.pantry.alerts = state.pantry.alerts.filter(alert => alert.itemId !== id);
  }),
  
  updateStock: (id, quantity, operation) => set((state) => {
    const item = state.pantry.items.find(item => item.id === id);
    if (item) {
      switch (operation) {
        case 'add':
          item.currentStock += quantity;
          break;
        case 'subtract':
          item.currentStock = Math.max(0, item.currentStock - quantity);
          break;
        case 'set':
          item.currentStock = Math.max(0, quantity);
          break;
      }
      item.updatedAt = new Date();
      
      // Check for alerts after stock update
      get().checkAlerts();
    }
  }),
  
  addFromScan: (scannedData) => set((state) => {
    // Handle different scan types (barcode, receipt, manual)
    if (scannedData.type === 'barcode') {
      const existingItem = state.pantry.items.find(item => 
        item.barcode === scannedData.barcode || 
        item.name.toLowerCase() === scannedData.name?.toLowerCase()
      );
      
      if (existingItem) {
        // Update existing item
        existingItem.currentStock += scannedData.quantity || 1;
        existingItem.updatedAt = new Date();
        if (scannedData.expirationDate) {
          existingItem.expirationDate = new Date(scannedData.expirationDate);
        }
      } else {
        // Add new item
        const newItem: PantryItem = {
          id: Date.now().toString(),
          name: scannedData.name,
          category: scannedData.category || 'otros',
          currentStock: scannedData.quantity || 1,
          unit: scannedData.unit || 'unidad',
          barcode: scannedData.barcode,
          brand: scannedData.brand,
          price: scannedData.price,
          expirationDate: scannedData.expirationDate ? new Date(scannedData.expirationDate) : undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        state.pantry.items.push(newItem);
      }
    } else if (scannedData.type === 'receipt') {
      // Add multiple items from receipt
      scannedData.items.forEach((item: any) => {
        const existingItem = state.pantry.items.find(existing => 
          existing.name.toLowerCase() === item.name.toLowerCase()
        );
        
        if (existingItem) {
          existingItem.currentStock += item.quantity;
          existingItem.updatedAt = new Date();
        } else {
          const newItem: PantryItem = {
            id: `${Date.now()}-${Math.random()}`,
            name: item.name,
            category: item.category || 'otros',
            currentStock: item.quantity,
            unit: item.unit || 'unidad',
            price: item.price,
            store: scannedData.store,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          state.pantry.items.push(newItem);
        }
      });
    }
  }),
  
  checkAlerts: () => set((state) => {
    const now = new Date();
    const newAlerts: StockAlert[] = [];
    
    state.pantry.items.forEach(item => {
      // Check low stock
      if (item.minimumStock && item.currentStock <= item.minimumStock) {
        const existingAlert = state.pantry.alerts.find(alert => 
          alert.itemId === item.id && alert.type === 'low_stock' && alert.isActive
        );
        
        if (!existingAlert) {
          newAlerts.push({
            id: `${item.id}-low-${Date.now()}`,
            itemId: item.id,
            type: 'low_stock',
            threshold: item.minimumStock,
            isActive: true,
            createdAt: now
          });
        }
      }
      
      // Check expiration
      if (item.expirationDate) {
        const daysUntilExpiration = Math.ceil(
          (item.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilExpiration <= 0) {
          // Expired
          const existingAlert = state.pantry.alerts.find(alert => 
            alert.itemId === item.id && alert.type === 'expired' && alert.isActive
          );
          
          if (!existingAlert) {
            newAlerts.push({
              id: `${item.id}-expired-${Date.now()}`,
              itemId: item.id,
              type: 'expired',
              threshold: 0,
              isActive: true,
              createdAt: now
            });
          }
        } else if (daysUntilExpiration <= 3) {
          // Expiring soon
          const existingAlert = state.pantry.alerts.find(alert => 
            alert.itemId === item.id && alert.type === 'expiring' && alert.isActive
          );
          
          if (!existingAlert) {
            newAlerts.push({
              id: `${item.id}-expiring-${Date.now()}`,
              itemId: item.id,
              type: 'expiring',
              threshold: 3,
              isActive: true,
              createdAt: now
            });
          }
        }
      }
    });
    
    state.pantry.alerts.push(...newAlerts);
  }),
  
  dismissAlert: (alertId) => set((state) => {
    const alert = state.pantry.alerts.find(alert => alert.id === alertId);
    if (alert) {
      alert.isActive = false;
    }
  }),
  
  bulkUpdateStock: (updates) => set((state) => {
    updates.forEach(({ id, quantity }) => {
      const item = state.pantry.items.find(item => item.id === id);
      if (item) {
        item.currentStock = Math.max(0, quantity);
        item.updatedAt = new Date();
      }
    });
    
    // Check alerts after bulk update
    get().checkAlerts();
  }),
  
  setPantryLoading: (loading) => set((state) => {
    state.pantry.isLoading = loading;
  })
});