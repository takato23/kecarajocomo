import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from '@/services/logger';

import type {
  PantryItem,
  PantryStats,
  ExpirationAlert,
  PantryLocation,
  PantryFilter,
  AddPantryItemForm,
  UpdatePantryItemForm,
  BatchPantryOperation,
  BatchOperationResult,
  PantryAnalysis,
} from '../types';
import { samplePantryItems } from '../../../../lib/data/sample-data';

interface PantryState {
  // Core State
  items: PantryItem[];
  locations: PantryLocation[];
  expirationAlerts: ExpirationAlert[];
  stats: PantryStats | null;
  analysis: PantryAnalysis | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedItems: string[];
  filter: PantryFilter;
  
  // Cache & Sync
  lastSyncTimestamp: number;
  isDirty: boolean;
  
  // Actions
  // Item Management
  fetchItems: () => Promise<void>;
  addItem: (item: AddPantryItemForm) => Promise<PantryItem>;
  updateItem: (item: UpdatePantryItemForm) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  deleteItems: (itemIds: string[]) => Promise<void>;
  
  // Batch Operations
  batchOperation: (operation: BatchPantryOperation) => Promise<BatchOperationResult>;
  
  // Location Management
  fetchLocations: () => Promise<void>;
  addLocation: (location: Omit<PantryLocation, 'id' | 'user_id'>) => Promise<void>;
  updateLocation: (locationId: string, updates: Partial<PantryLocation>) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  
  // Expiration Management
  fetchExpirationAlerts: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  checkExpirations: () => void;
  
  // Statistics & Analytics
  fetchStats: () => Promise<void>;
  fetchAnalysis: () => Promise<void>;
  
  // Search & Filter
  setFilter: (filter: Partial<PantryFilter>) => void;
  clearFilter: () => void;
  searchItems: (query: string) => PantryItem[];
  
  // Selection
  selectItem: (itemId: string) => void;
  selectItems: (itemIds: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Consumption Tracking
  consumeItem: (itemId: string, quantity: number) => Promise<void>;
  
  // Sync & Cache
  syncData: () => Promise<void>;
  markDirty: () => void;
  
  // Utilities
  getFilteredItems: () => PantryItem[];
  getItemsByCategory: () => Record<string, PantryItem[]>;
  getExpiringItems: (days: number) => PantryItem[];
  getExpiredItems: () => PantryItem[];
  
  // Cleanup
  reset: () => void;
}

const initialFilter: PantryFilter = {
  sort_by: 'expiration_date',
  sort_order: 'asc',
};

const initialStats: PantryStats = {
  totalItems: 0,
  expiringItems: 0,
  expiredItems: 0,
  categories: {},
};

export const usePantryStore = create<PantryState>()(
  persist(
    immer((set, get) => ({
      // Initial State
      items: samplePantryItems,
      locations: [],
      expirationAlerts: [],
      stats: null,
      analysis: null,
      isLoading: false,
      error: null,
      selectedItems: [],
      filter: initialFilter,
      lastSyncTimestamp: 0,
      isDirty: false,
      
      // Item Management Actions
      fetchItems: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          // Use sample data temporarily for demo purposes

          set((state) => {
            state.items = samplePantryItems;
            state.isLoading = false;
            state.lastSyncTimestamp = Date.now();
            state.isDirty = false;
          });
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch items';
            state.isLoading = false;
          });
        }
      },
      
      addItem: async (itemForm: AddPantryItemForm) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          const response = await fetch('/api/pantry/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemForm),
          });
          
          if (!response.ok) throw new Error('Failed to add pantry item');
          
          const newItem = await response.json();
          
          set((state) => {
            state.items.push(newItem);
            state.isLoading = false;
            state.isDirty = true;
          });
          
          // Refresh stats
          get().fetchStats();
          get().checkExpirations();
          
          return newItem;
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to add item';
            state.isLoading = false;
          });
          throw error;
        }
      },
      
      updateItem: async (itemUpdate: UpdatePantryItemForm) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          const response = await fetch(`/api/pantry/items/${itemUpdate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemUpdate),
          });
          
          if (!response.ok) throw new Error('Failed to update pantry item');
          
          const updatedItem = await response.json();
          
          set((state) => {
            const index = state.items.findIndex((item) => item.id === itemUpdate.id);
            if (index !== -1) {
              state.items[index] = updatedItem;
            }
            state.isLoading = false;
            state.isDirty = true;
          });
          
          get().fetchStats();
          get().checkExpirations();
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to update item';
            state.isLoading = false;
          });
          throw error;
        }
      },
      
      deleteItem: async (itemId: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          const response = await fetch(`/api/pantry/items/${itemId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) throw new Error('Failed to delete pantry item');
          
          set((state) => {
            state.items = state.items.filter((item) => item.id !== itemId);
            state.selectedItems = state.selectedItems.filter((id) => id !== itemId);
            state.isLoading = false;
            state.isDirty = true;
          });
          
          get().fetchStats();
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to delete item';
            state.isLoading = false;
          });
          throw error;
        }
      },
      
      deleteItems: async (itemIds: string[]) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          const response = await fetch('/api/pantry/items/batch', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_ids: itemIds }),
          });
          
          if (!response.ok) throw new Error('Failed to delete pantry items');
          
          set((state) => {
            state.items = state.items.filter((item) => !itemIds.includes(item.id));
            state.selectedItems = state.selectedItems.filter((id) => !itemIds.includes(id));
            state.isLoading = false;
            state.isDirty = true;
          });
          
          get().fetchStats();
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to delete items';
            state.isLoading = false;
          });
          throw error;
        }
      },
      
      // Batch Operations
      batchOperation: async (operation: BatchPantryOperation) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        
        try {
          const response = await fetch('/api/pantry/items/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(operation),
          });
          
          if (!response.ok) throw new Error('Batch operation failed');
          
          const result = await response.json();
          
          // Refresh data after batch operation
          await get().fetchItems();
          
          set((state) => {
            state.isLoading = false;
            state.isDirty = true;
          });
          
          return result;
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Batch operation failed';
            state.isLoading = false;
          });
          throw error;
        }
      },
      
      // Location Management
      fetchLocations: async () => {
        try {
          const response = await fetch('/api/pantry/locations');
          if (!response.ok) throw new Error('Failed to fetch locations');
          
          const data = await response.json();
          
          set((state) => {
            state.locations = data.locations || [];
          });
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch locations';
          });
        }
      },
      
      addLocation: async (location) => {
        try {
          const response = await fetch('/api/pantry/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location),
          });
          
          if (!response.ok) throw new Error('Failed to add location');
          
          const newLocation = await response.json();
          
          set((state) => {
            state.locations.push(newLocation);
          });
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to add location';
          });
          throw error;
        }
      },
      
      updateLocation: async (locationId, updates) => {
        try {
          const response = await fetch(`/api/pantry/locations/${locationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          
          if (!response.ok) throw new Error('Failed to update location');
          
          const updatedLocation = await response.json();
          
          set((state) => {
            const index = state.locations.findIndex((loc) => loc.id === locationId);
            if (index !== -1) {
              state.locations[index] = updatedLocation;
            }
          });
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to update location';
          });
          throw error;
        }
      },
      
      deleteLocation: async (locationId) => {
        try {
          const response = await fetch(`/api/pantry/locations/${locationId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) throw new Error('Failed to delete location');
          
          set((state) => {
            state.locations = state.locations.filter((loc) => loc.id !== locationId);
          });
        } catch (error: unknown) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to delete location';
          });
          throw error;
        }
      },
      
      // Expiration Management
      fetchExpirationAlerts: async () => {
        try {
          const response = await fetch('/api/pantry/expiration-alerts');
          if (!response.ok) throw new Error('Failed to fetch expiration alerts');
          
          const data = await response.json();
          
          set((state) => {
            state.expirationAlerts = data.alerts || [];
          });
        } catch (error: unknown) {
          logger.error('Failed to fetch expiration alerts:', 'pantry:pantryStore', error);
        }
      },
      
      dismissAlert: async (alertId) => {
        try {
          const response = await fetch(`/api/pantry/expiration-alerts/${alertId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dismissed: true }),
          });
          
          if (!response.ok) throw new Error('Failed to dismiss alert');
          
          set((state) => {
            const alert = state.expirationAlerts.find((a) => a.id === alertId);
            if (alert) {
              alert.dismissed = true;
            }
          });
        } catch (error: unknown) {
          logger.error('Failed to dismiss alert:', 'pantry:pantryStore', error);
        }
      },
      
      checkExpirations: () => {
        const now = new Date();
        const items = get().items;
        
        const alerts: ExpirationAlert[] = items
          .filter((item) => item.expiration_date)
          .map((item) => {
            const expirationDate = new Date(item.expiration_date!);
            const daysUntilExpiration = Math.ceil(
              (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            let alertType: 'warning' | 'urgent' | 'expired';
            if (daysUntilExpiration < 0) {
              alertType = 'expired';
            } else if (daysUntilExpiration <= 2) {
              alertType = 'urgent';
            } else if (daysUntilExpiration <= 7) {
              alertType = 'warning';
            } else {
              return null;
            }
            
            return {
              id: `alert-${item.id}`,
              pantry_item_id: item.id,
              item_name: item.ingredient_name,
              expiration_date: expirationDate,
              days_until_expiration: daysUntilExpiration,
              alert_type: alertType,
              dismissed: false,
              created_at: now,
            };
          })
          .filter(Boolean) as ExpirationAlert[];
        
        set((state) => {
          state.expirationAlerts = alerts;
        });
      },
      
      // Statistics & Analytics
      fetchStats: async () => {
        try {
          const response = await fetch('/api/pantry/stats');
          if (!response.ok) throw new Error('Failed to fetch pantry stats');
          
          const stats = await response.json();
          
          set((state) => {
            state.stats = stats;
          });
        } catch (error: unknown) {
          logger.error('Failed to fetch pantry stats:', 'pantry:pantryStore', error);
        }
      },
      
      fetchAnalysis: async () => {
        try {
          const response = await fetch('/api/pantry/analysis');
          if (!response.ok) throw new Error('Failed to fetch pantry analysis');
          
          const analysis = await response.json();
          
          set((state) => {
            state.analysis = analysis;
          });
        } catch (error: unknown) {
          logger.error('Failed to fetch pantry analysis:', 'pantry:pantryStore', error);
        }
      },
      
      // Search & Filter
      setFilter: (newFilter) => {
        set((state) => {
          state.filter = { ...state.filter, ...newFilter };
        });
      },
      
      clearFilter: () => {
        set((state) => {
          state.filter = initialFilter;
        });
      },
      
      searchItems: (query) => {
        const items = get().items;
        const lowerQuery = query.toLowerCase();
        
        return items.filter((item) =>
          item.ingredient_name.toLowerCase().includes(lowerQuery) ||
          item.category?.toLowerCase().includes(lowerQuery) ||
          item.location?.toLowerCase().includes(lowerQuery) ||
          item.notes?.toLowerCase().includes(lowerQuery)
        );
      },
      
      // Selection
      selectItem: (itemId) => {
        set((state) => {
          if (state.selectedItems.includes(itemId)) {
            state.selectedItems = state.selectedItems.filter((id) => id !== itemId);
          } else {
            state.selectedItems.push(itemId);
          }
        });
      },
      
      selectItems: (itemIds) => {
        set((state) => {
          state.selectedItems = itemIds;
        });
      },
      
      selectAll: () => {
        const filteredItems = get().getFilteredItems();
        set((state) => {
          state.selectedItems = filteredItems.map((item) => item.id);
        });
      },
      
      clearSelection: () => {
        set((state) => {
          state.selectedItems = [];
        });
      },
      
      // Consumption Tracking
      consumeItem: async (itemId, quantity) => {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return;
        
        const newQuantity = Math.max(0, item.quantity - quantity);
        
        if (newQuantity === 0) {
          await get().deleteItem(itemId);
        } else {
          await get().updateItem({ id: itemId, quantity: newQuantity });
        }
      },
      
      // Sync & Cache
      syncData: async () => {
        await Promise.all([
          get().fetchItems(),
          get().fetchLocations(),
          get().fetchExpirationAlerts(),
          get().fetchStats(),
        ]);
      },
      
      markDirty: () => {
        set((state) => {
          state.isDirty = true;
        });
      },
      
      // Utility Functions
      getFilteredItems: () => {
        const { items, filter } = get();
        let filtered = [...items];
        
        // Apply filters
        if (filter.category) {
          filtered = filtered.filter((item) => item.category === filter.category);
        }
        
        if (filter.location) {
          filtered = filtered.filter((item) => item.location === filter.location);
        }
        
        if (filter.expiring_within_days) {
          const now = new Date();
          const cutoffDate = new Date(now.getTime() + filter.expiring_within_days * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((item) => {
            if (!item.expiration_date) return false;
            return new Date(item.expiration_date) <= cutoffDate;
          });
        }
        
        if (filter.search_term) {
          const query = filter.search_term.toLowerCase();
          filtered = filtered.filter((item) =>
            item.ingredient_name.toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query) ||
            item.location?.toLowerCase().includes(query)
          );
        }
        
        // Apply sorting
        if (filter.sort_by) {
          filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;
            
            switch (filter.sort_by) {
              case 'name':
                aValue = a.ingredient_name;
                bValue = b.ingredient_name;
                break;
              case 'expiration_date':
                aValue = a.expiration_date ? new Date(a.expiration_date) : new Date(9999, 11, 31);
                bValue = b.expiration_date ? new Date(b.expiration_date) : new Date(9999, 11, 31);
                break;
              case 'quantity':
                aValue = a.quantity;
                bValue = b.quantity;
                break;
              case 'category':
                aValue = a.category || '';
                bValue = b.category || '';
                break;
              default:
                return 0;
            }
            
            if (aValue < bValue) return filter.sort_order === 'asc' ? -1 : 1;
            if (aValue > bValue) return filter.sort_order === 'asc' ? 1 : -1;
            return 0;
          });
        }
        
        return filtered;
      },
      
      getItemsByCategory: () => {
        const items = get().items;
        const categorized: Record<string, PantryItem[]> = {};
        
        items.forEach((item) => {
          const category = item.category || 'Uncategorized';
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(item);
        });
        
        return categorized;
      },
      
      getExpiringItems: (days) => {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        return get().items.filter((item) => {
          if (!item.expiration_date) return false;
          const expDate = new Date(item.expiration_date);
          return expDate <= cutoffDate && expDate >= now;
        });
      },
      
      getExpiredItems: () => {
        const now = new Date();
        
        return get().items.filter((item) => {
          if (!item.expiration_date) return false;
          return new Date(item.expiration_date) < now;
        });
      },
      
      // Cleanup
      reset: () => {
        set((state) => {
          state.items = [];
          state.locations = [];
          state.expirationAlerts = [];
          state.stats = null;
          state.analysis = null;
          state.isLoading = false;
          state.error = null;
          state.selectedItems = [];
          state.filter = initialFilter;
          state.lastSyncTimestamp = 0;
          state.isDirty = false;
        });
      },
    })),
    {
      name: 'pantry-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        locations: state.locations,
        filter: state.filter,
        lastSyncTimestamp: state.lastSyncTimestamp,
      }),
    }
  )
);