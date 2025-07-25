import { supabase } from './client';
import type { Database } from './database.types';

type ShoppingList = Database['public']['Tables']['shopping_lists']['Row'];
type ShoppingItem = Database['public']['Tables']['shopping_list_items']['Row'];
type ShoppingListInsert = Database['public']['Tables']['shopping_lists']['Insert'];
type ShoppingItemInsert = Database['public']['Tables']['shopping_list_items']['Insert'];
type ShoppingListUpdate = Database['public']['Tables']['shopping_lists']['Update'];
type ShoppingItemUpdate = Database['public']['Tables']['shopping_list_items']['Update'];

export const shoppingService = {
  // Shopping Lists
  async getLists(userId: string) {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getActiveList(userId: string) {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*, shopping_list_items(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      // If no active list exists, create one
      if (error.code === 'PGRST116') {
        return this.createList(userId, { name: 'Lista de Compras', is_active: true });
      }
      throw error;
    }
    return data;
  },

  async createList(userId: string, list: Partial<ShoppingListInsert>) {
    const { data, error } = await supabase
      .from('shopping_lists')
      .insert({ ...list, user_id: userId })
      .select('*, shopping_list_items(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async updateList(listId: string, updates: ShoppingListUpdate) {
    const { data, error } = await supabase
      .from('shopping_lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteList(listId: string) {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId);

    if (error) throw error;
  },

  // Shopping Items
  async getItems(listId: string) {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('shopping_list_id', listId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data;
  },

  async addItem(listId: string, item: Omit<ShoppingItemInsert, 'shopping_list_id'>) {
    // Get the highest priority in the list
    const { data: maxPriorityData } = await supabase
      .from('shopping_list_items')
      .select('priority')
      .eq('shopping_list_id', listId)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    const nextPriority = (maxPriorityData?.priority ?? -1) + 1;

    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({ ...item, shopping_list_id: listId, priority: nextPriority })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateItem(itemId: string, updates: ShoppingItemUpdate) {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteItem(itemId: string) {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },

  async toggleItem(itemId: string) {
    // First get the current state
    const { data: item, error: fetchError } = await supabase
      .from('shopping_list_items')
      .select('is_purchased')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the state
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({ is_purchased: !item.is_purchased })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkToggleItems(listId: string, itemIds: string[], is_purchased: boolean) {
    const { error } = await supabase
      .from('shopping_list_items')
      .update({ is_purchased })
      .in('id', itemIds)
      .eq('shopping_list_id', listId);

    if (error) throw error;
  },

  async reorderItems(listId: string, itemIds: string[]) {
    // Update priorities based on the new order
    const updates = itemIds.map((id, index) => ({
      id,
      shopping_list_id: listId,
      priority: index
    }));

    // Use upsert to update priorities
    const { error } = await supabase
      .from('shopping_list_items')
      .upsert(updates, { onConflict: 'id' });

    if (error) throw error;
  },

  // Price History
  async addPriceHistory(itemId: string, store: string, price: number, unit?: string) {
    const { data, error } = await supabase
      .from('price_history')
      .insert({ shopping_item_id: itemId, store, price, unit })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPriceHistory(itemId: string) {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('shopping_item_id', itemId)
      .order('found_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Shopping Preferences
  async getPreferences(userId: string) {
    const { data, error } = await supabase
      .from('shopping_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, create default ones
      if (error.code === 'PGRST116') {
        return this.createPreferences(userId);
      }
      throw error;
    }
    return data;
  },

  async createPreferences(userId: string, prefs?: Partial<Database['public']['Tables']['shopping_preferences']['Insert']>) {
    const { data, error } = await supabase
      .from('shopping_preferences')
      .insert({ user_id: userId, ...prefs })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePreferences(userId: string, updates: Database['public']['Tables']['shopping_preferences']['Update']) {
    const { data, error } = await supabase
      .from('shopping_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Real-time subscriptions
  subscribeToList(listId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`shopping_list:${listId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_list_items', filter: `shopping_list_id=eq.${listId}` },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};