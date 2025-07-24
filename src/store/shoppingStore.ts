/**
 * Shopping Store Export
 * Re-exports shopping functionality from main store
 */

import { 
  useShopping, 
  useShoppingActions,
  useAppStore
} from './index';

export { 
  useShopping, 
  useShoppingActions,
  useAppStore as shoppingStore
};

// For backward compatibility
export const useShoppingStore = () => {
  const shopping = useShopping();
  const actions = useShoppingActions();
  
  return {
    ...shopping,
    ...actions
  };
};

// Add the missing export that UltraDashboardPage needs
export const useShoppingListStore = () => {
  const shopping = useShopping();
  const actions = useShoppingActions();
  
  return {
    lists: shopping.lists,
    addList: actions.addShoppingList,
    updateList: actions.updateShoppingList,
    deleteList: actions.deleteShoppingList,
    ...actions
  };
};