import { supabase } from '@/lib/supabase/client';

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  budget: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  store?: string;
  price?: number;
  checked: boolean;
  notes?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface PriceHistoryEntry {
  id: string;
  shopping_item_id: string;
  store: string;
  price: number;
  unit?: string;
  found_at: string;
}

export interface ShoppingPreferences {
  id: string;
  user_id: string;
  preferred_stores: string[];
  default_budget: number;
  currency: string;
  auto_save: boolean;
}

class ShoppingListService {
  // Get active shopping list for user
  async getActiveList(userId: string): Promise<ShoppingList | null> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching active list:', error);
      throw error;
    }

    return data;
  }

  // Create a new shopping list
  async createList(userId: string, name?: string, budget?: number): Promise<ShoppingList> {
    // First, deactivate any existing active lists
    await supabase
      .from('shopping_lists')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        name: name || 'Lista de Compras',
        budget: budget || 1000,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating list:', error);
      throw error;
    }

    return data;
  }

  // Get all items for a list
  async getListItems(listId: string): Promise<ShoppingItem[]> {
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('list_id', listId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching items:', error);
      throw error;
    }

    return data || [];
  }

  // Add item to list
  async addItem(listId: string, item: Partial<ShoppingItem>): Promise<ShoppingItem> {
    // Get current max position
    const { data: maxPosData } = await supabase
      .from('shopping_items')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = maxPosData?.[0]?.position ? maxPosData[0].position + 1 : 0;

    const { data, error } = await supabase
      .from('shopping_items')
      .insert({
        list_id: listId,
        name: item.name!,
        quantity: item.quantity || 1,
        unit: item.unit,
        category: item.category || 'other',
        store: item.store,
        price: item.price,
        checked: false,
        notes: item.notes,
        position: nextPosition
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding item:', error);
      throw error;
    }

    return data;
  }

  // Update item
  async updateItem(itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const { data, error } = await supabase
      .from('shopping_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      throw error;
    }

    return data;
  }

  // Toggle item checked status
  async toggleItem(itemId: string): Promise<void> {
    const { data: item } = await supabase
      .from('shopping_items')
      .select('checked')
      .eq('id', itemId)
      .single();

    if (item) {
      await this.updateItem(itemId, { checked: !item.checked });
    }
  }

  // Delete item
  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // Update item quantity
  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    await this.updateItem(itemId, { quantity: Math.max(1, quantity) });
  }

  // Clear completed items
  async clearCompleted(listId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('list_id', listId)
      .eq('checked', true);

    if (error) {
      console.error('Error clearing completed items:', error);
      throw error;
    }
  }

  // Save price history
  async savePriceHistory(itemId: string, store: string, price: number, unit?: string): Promise<void> {
    const { error } = await supabase
      .from('price_history')
      .insert({
        shopping_item_id: itemId,
        store,
        price,
        unit
      });

    if (error) {
      console.error('Error saving price history:', error);
      // Don't throw - price history is not critical
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<ShoppingPreferences | null> {
    const { data, error } = await supabase
      .from('shopping_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error);
      throw error;
    }

    // Create default preferences if none exist
    if (!data) {
      const { data: newPrefs, error: createError } = await supabase
        .from('shopping_preferences')
        .insert({
          user_id: userId,
          preferred_stores: ['carrefour', 'dia', 'coto', 'jumbo'],
          default_budget: 1000,
          currency: 'ARS',
          auto_save: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating preferences:', error);
        throw createError;
      }

      return newPrefs;
    }

    return data;
  }

  // Update user preferences
  async updatePreferences(userId: string, updates: Partial<ShoppingPreferences>): Promise<void> {
    const { error } = await supabase
      .from('shopping_preferences')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  // Duplicate list
  async duplicateList(listId: string, userId: string): Promise<ShoppingList> {
    // Get the original list
    const { data: originalList } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', listId)
      .single();

    if (!originalList) {
      throw new Error('List not found');
    }

    // Get all items from the original list
    const items = await this.getListItems(listId);

    // Create new list
    const newList = await this.createList(
      userId,
      `${originalList.name} (Copia)`,
      originalList.budget
    );

    // Copy all items to the new list
    for (const item of items) {
      await this.addItem(newList.id, {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        store: item.store,
        price: item.price,
        notes: item.notes
      });
    }

    return newList;
  }

  // Get lists history
  async getListsHistory(userId: string, limit = 10): Promise<ShoppingList[]> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching lists history:', error);
      throw error;
    }

    return data || [];
  }

  // Real-time subscription to list items
  subscribeToListItems(listId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`shopping_items:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${listId}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const shoppingListService = new ShoppingListService();