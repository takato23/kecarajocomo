/**
 * Pantry Store Export
 * Re-exports pantry functionality from main store
 */

import { 
  usePantry, 
  usePantryActions,
  useAppStore
} from './index';

export { 
  usePantry, 
  usePantryActions,
  useAppStore as pantryStore
};

// For backward compatibility
export const usePantryStore = () => {
  const pantry = usePantry();
  const actions = usePantryActions();
  
  return {
    ...pantry,
    ...actions
  };
};