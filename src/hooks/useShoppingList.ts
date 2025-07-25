import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { shoppingService } from '@/lib/supabase/shopping';
import { useAppStore } from '@/store';
import type { Database } from '@/lib/supabase/database.types';

type ShoppingList = Database['public']['Tables']['shopping_lists']['Row'] & {
  shopping_items?: ShoppingItem[];
};
type ShoppingItem = Database['public']['Tables']['shopping_items']['Row'];

export function useShoppingList() {
  const user = useAppStore((state) => state.user.profile);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all lists
  const fetchLists = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await shoppingService.getLists(user.id);
      setLists(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar las listas';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch active list with items
  const fetchActiveList = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await shoppingService.getActiveList(user.id);
      setActiveList(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar la lista activa';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create a new list
  const createList = useCallback(async (name: string, makeActive = false) => {
    if (!user) return;

    try {
      const newList = await shoppingService.createList(user.id, { name, is_active: makeActive });
      setLists(prev => [newList, ...prev]);
      if (makeActive) {
        setActiveList(newList);
      }
      toast.success('Lista creada exitosamente');
      return newList;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la lista';
      toast.error(message);
      throw err;
    }
  }, [user]);

  // Update list
  const updateList = useCallback(async (listId: string, updates: Partial<ShoppingList>) => {
    try {
      const updatedList = await shoppingService.updateList(listId, updates);
      setLists(prev => prev.map(list => list.id === listId ? { ...list, ...updatedList } : list));
      if (activeList?.id === listId) {
        setActiveList(prev => prev ? { ...prev, ...updatedList } : null);
      }
      toast.success('Lista actualizada');
      return updatedList;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar la lista';
      toast.error(message);
      throw err;
    }
  }, [activeList]);

  // Delete list
  const deleteList = useCallback(async (listId: string) => {
    try {
      await shoppingService.deleteList(listId);
      setLists(prev => prev.filter(list => list.id !== listId));
      if (activeList?.id === listId) {
        setActiveList(null);
      }
      toast.success('Lista eliminada');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la lista';
      toast.error(message);
      throw err;
    }
  }, [activeList]);

  // Add item to active list
  const addItem = useCallback(async (item: Omit<ShoppingItem, 'id' | 'list_id' | 'created_at' | 'updated_at' | 'position'>) => {
    if (!activeList) {
      toast.error('No hay una lista activa');
      return;
    }

    try {
      const newItem = await shoppingService.addItem(activeList.id, item);
      setActiveList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopping_items: [...(prev.shopping_items || []), newItem]
        };
      });
      toast.success('Item agregado');
      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar el item';
      toast.error(message);
      throw err;
    }
  }, [activeList]);

  // Update item
  const updateItem = useCallback(async (itemId: string, updates: Partial<ShoppingItem>) => {
    try {
      const updatedItem = await shoppingService.updateItem(itemId, updates);
      setActiveList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopping_items: prev.shopping_items?.map(item => 
            item.id === itemId ? { ...item, ...updatedItem } : item
          )
        };
      });
      return updatedItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el item';
      toast.error(message);
      throw err;
    }
  }, []);

  // Delete item
  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await shoppingService.deleteItem(itemId);
      setActiveList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopping_items: prev.shopping_items?.filter(item => item.id !== itemId)
        };
      });
      toast.success('Item eliminado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar el item';
      toast.error(message);
      throw err;
    }
  }, []);

  // Toggle item
  const toggleItem = useCallback(async (itemId: string) => {
    try {
      const updatedItem = await shoppingService.toggleItem(itemId);
      setActiveList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopping_items: prev.shopping_items?.map(item => 
            item.id === itemId ? updatedItem : item
          )
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el item';
      toast.error(message);
      throw err;
    }
  }, []);

  // Bulk toggle items
  const bulkToggleItems = useCallback(async (itemIds: string[], checked: boolean) => {
    if (!activeList) return;

    try {
      await shoppingService.bulkToggleItems(activeList.id, itemIds, checked);
      setActiveList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          shopping_items: prev.shopping_items?.map(item => 
            itemIds.includes(item.id) ? { ...item, checked } : item
          )
        };
      });
      toast.success(`${itemIds.length} items actualizados`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar los items';
      toast.error(message);
      throw err;
    }
  }, [activeList]);

  // Reorder items
  const reorderItems = useCallback(async (itemIds: string[]) => {
    if (!activeList) return;

    try {
      await shoppingService.reorderItems(activeList.id, itemIds);
      // Reorder locally
      setActiveList(prev => {
        if (!prev || !prev.shopping_items) return null;
        const itemMap = new Map(prev.shopping_items.map(item => [item.id, item]));
        const reorderedItems = itemIds.map((id, index) => {
          const item = itemMap.get(id);
          return item ? { ...item, position: index } : null;
        }).filter(Boolean) as ShoppingItem[];
        return { ...prev, shopping_items: reorderedItems };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reordenar los items';
      toast.error(message);
      throw err;
    }
  }, [activeList]);

  // Set active list
  const setActiveListById = useCallback(async (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (list) {
      // Fetch full list with items
      try {
        const data = await shoppingService.getItems(listId);
        setActiveList({ ...list, shopping_items: data });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar los items';
        toast.error(message);
      }
    }
  }, [lists]);

  // Initialize
  useEffect(() => {
    if (user) {
      fetchLists();
      fetchActiveList();
    }
  }, [user, fetchLists, fetchActiveList]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!activeList) return;

    const unsubscribe = shoppingService.subscribeToList(activeList.id, (payload) => {
      // Handle real-time updates
      if (payload.eventType === 'INSERT') {
        setActiveList(prev => {
          if (!prev) return null;
          return {
            ...prev,
            shopping_items: [...(prev.shopping_items || []), payload.new]
          };
        });
      } else if (payload.eventType === 'UPDATE') {
        setActiveList(prev => {
          if (!prev) return null;
          return {
            ...prev,
            shopping_items: prev.shopping_items?.map(item => 
              item.id === payload.new.id ? payload.new : item
            )
          };
        });
      } else if (payload.eventType === 'DELETE') {
        setActiveList(prev => {
          if (!prev) return null;
          return {
            ...prev,
            shopping_items: prev.shopping_items?.filter(item => item.id !== payload.old.id)
          };
        });
      }
    });

    return unsubscribe;
  }, [activeList?.id]);

  return {
    lists,
    activeList,
    isLoading,
    error,
    createList,
    updateList,
    deleteList,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    bulkToggleItems,
    reorderItems,
    setActiveListById,
    refresh: fetchActiveList
  };
}