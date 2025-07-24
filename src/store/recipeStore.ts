/**
 * Recipe Store Export
 * Re-exports recipe functionality from main store
 */

import { 
  useRecipes, 
  useRecipeActions,
  useAppStore
} from './index';

export { 
  useRecipes, 
  useRecipeActions,
  useAppStore as recipeStore
};

// For backward compatibility
export const useRecipeStore = () => {
  const recipes = useRecipes();
  const actions = useRecipeActions();
  
  return {
    ...recipes,
    ...actions
  };
};