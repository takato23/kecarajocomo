import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  createMealPlanSlice, 
  MealPlanSlice,
  MealTypeSchema,
  ModeTypeSchema,
  RegionTypeSchema,
  ArgentineMealSchema,
  ArgentineWeeklyPlanSchema,
  type UserPreferences,
  type PantryItem,
  type ArgentineWeeklyPlan 
} from '../mealPlanSlice';
import { 
  mockWeeklyPlan, 
  mockUserPreferences, 
  mockPantryItems 
} from '@/__tests__/mocks/fixtures/argentineMealData';

// Create test store without persistence for testing
const createTestStore = () => create<MealPlanSlice>()(
  subscribeWithSelector(
    immer(
      createMealPlanSlice
    )
  )
);

describe('MealPlanSlice Store', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    // Reset to initial state
    store.getState().resetState();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState();

      expect(state.weeklyPlan).toBeNull();
      expect(state.preferences).toBeDefined();
      expect(state.preferences.cultural.region).toBe('pampa');
      expect(state.preferences.cultural.mateFrequency).toBe('diario');
      expect(state.pantry).toHaveLength(3); // Default pantry items
      expect(state.mode).toBe('normal');
      expect(state.weekKey).toBe('');
      expect(state.isDirty).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should include default Argentine pantry items', () => {
      const state = store.getState();
      const pantryNames = state.pantry.map(item => item.name);

      expect(pantryNames).toContain('Sal');
      expect(pantryNames).toContain('Aceite');
      expect(pantryNames).toContain('Yerba mate');
    });

    it('should have Argentine cultural defaults', () => {
      const state = store.getState();

      expect(state.preferences.cultural.region).toBe('pampa');
      expect(state.preferences.cultural.traditionLevel).toBe('media');
      expect(state.preferences.cultural.mateFrequency).toBe('diario');
      expect(state.preferences.cultural.asadoFrequency).toBe('quincenal');
      expect(state.preferences.dietary.favorites).toContain('asado');
      expect(state.preferences.dietary.favorites).toContain('empanadas');
      expect(state.preferences.budget.currency).toBe('ARS');
    });
  });

  describe('Weekly Plan Management', () => {
    it('should set weekly plan and mark as dirty', () => {
      const { setWeeklyPlan } = store.getState();

      setWeeklyPlan(mockWeeklyPlan);

      const state = store.getState();
      expect(state.weeklyPlan).toBe(mockWeeklyPlan);
      expect(state.isDirty).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should clear weekly plan', () => {
      const { setWeeklyPlan } = store.getState();

      // First set a plan
      setWeeklyPlan(mockWeeklyPlan);
      expect(store.getState().weeklyPlan).toBe(mockWeeklyPlan);

      // Then clear it
      setWeeklyPlan(null);
      expect(store.getState().weeklyPlan).toBeNull();
    });

    it('should set week key correctly', () => {
      const { setWeekKey } = store.getState();
      const testKey = 'user123:2024-01-15';

      setWeekKey(testKey);

      expect(store.getState().weekKey).toBe(testKey);
    });

    it('should manage dirty state', () => {
      const { setDirty } = store.getState();

      setDirty(true);
      expect(store.getState().isDirty).toBe(true);

      setDirty(false);
      expect(store.getState().isDirty).toBe(false);
    });
  });

  describe('Preferences Management', () => {
    it('should update preferences partially', () => {
      const { setPreferences } = store.getState();
      const newBudget = { weekly: 25000, currency: 'ARS' as const, flexibility: 'estricto' as const };

      setPreferences({
        budget: newBudget
      });

      const state = store.getState();
      expect(state.preferences.budget).toEqual(newBudget);
      expect(state.preferences.cultural).toBeDefined(); // Should preserve other preferences
      expect(state.isDirty).toBe(true);
    });

    it('should add favorite dish', () => {
      const { addFavoriteDish } = store.getState();
      const newFavorite = 'locro';

      addFavoriteDish(newFavorite);

      const state = store.getState();
      expect(state.preferences.dietary.favorites).toContain(newFavorite);
      expect(state.isDirty).toBe(true);
    });

    it('should not add duplicate favorite dish', () => {
      const { addFavoriteDish } = store.getState();
      const existingFavorite = 'asado'; // Already in defaults

      const initialCount = store.getState().preferences.dietary.favorites.length;
      
      addFavoriteDish(existingFavorite);

      const state = store.getState();
      expect(state.preferences.dietary.favorites.length).toBe(initialCount);
      expect(state.isDirty).toBe(false); // Should not mark as dirty if no change
    });

    it('should add disliked ingredient', () => {
      const { addDislikedIngredient } = store.getState();
      const dislikedIngredient = 'cilantro';

      addDislikedIngredient(dislikedIngredient);

      const state = store.getState();
      expect(state.preferences.dietary.dislikes).toContain(dislikedIngredient);
      expect(state.isDirty).toBe(true);
    });

    it('should not add duplicate disliked ingredient', () => {
      const { addDislikedIngredient } = store.getState();
      const ingredient = 'onions';

      // Add twice
      addDislikedIngredient(ingredient);
      const firstAddCount = store.getState().preferences.dietary.dislikes.length;
      
      addDislikedIngredient(ingredient);
      const secondAddCount = store.getState().preferences.dietary.dislikes.length;

      expect(firstAddCount).toBe(secondAddCount);
    });

    it('should update cultural preferences', () => {
      const { updateCulturalPreferences } = store.getState();
      const newCultural = {
        region: 'patagonia' as const,
        traditionLevel: 'alta' as const,
        mateFrequency: 'ocasional' as const
      };

      updateCulturalPreferences(newCultural);

      const state = store.getState();
      expect(state.preferences.cultural.region).toBe('patagonia');
      expect(state.preferences.cultural.traditionLevel).toBe('alta');
      expect(state.preferences.cultural.mateFrequency).toBe('ocasional');
      expect(state.preferences.cultural.asadoFrequency).toBe('quincenal'); // Should preserve
      expect(state.isDirty).toBe(true);
    });

    it('should update budget preferences', () => {
      const { updateBudgetPreferences } = store.getState();
      const newBudget = {
        weekly: 30000,
        flexibility: 'sin_limite' as const
      };

      updateBudgetPreferences(newBudget);

      const state = store.getState();
      expect(state.preferences.budget.weekly).toBe(30000);
      expect(state.preferences.budget.flexibility).toBe('sin_limite');
      expect(state.preferences.budget.currency).toBe('ARS'); // Should preserve
      expect(state.isDirty).toBe(true);
    });
  });

  describe('Pantry Management', () => {
    it('should add new pantry item', () => {
      const { upsertPantryItem } = store.getState();
      const newItem: PantryItem = {
        id: 'new-item',
        name: 'Tomates',
        category: 'verduras',
        amount: 500,
        unit: 'g',
        frequency: 'media'
      };

      upsertPantryItem(newItem);

      const state = store.getState();
      expect(state.pantry).toContainEqual(newItem);
      expect(state.isDirty).toBe(true);
    });

    it('should update existing pantry item', () => {
      const { upsertPantryItem } = store.getState();
      const existingItemId = 'sal'; // From default pantry
      const updatedItem: PantryItem = {
        id: existingItemId,
        name: 'Sal gruesa',
        category: 'condimentos',
        amount: 2,
        unit: 'kg',
        frequency: 'alta',
        expiryDate: '2024-12-31'
      };

      upsertPantryItem(updatedItem);

      const state = store.getState();
      const foundItem = state.pantry.find(item => item.id === existingItemId);
      expect(foundItem).toEqual(updatedItem);
      expect(state.isDirty).toBe(true);
    });

    it('should remove pantry item', () => {
      const { removePantryItem } = store.getState();
      const itemIdToRemove = 'sal';

      removePantryItem(itemIdToRemove);

      const state = store.getState();
      expect(state.pantry.find(item => item.id === itemIdToRemove)).toBeUndefined();
      expect(state.isDirty).toBe(true);
    });

    it('should update pantry item partially', () => {
      const { updatePantryItem } = store.getState();
      const itemId = 'sal';
      const updates = {
        amount: 5,
        expiryDate: '2024-06-30'
      };

      updatePantryItem(itemId, updates);

      const state = store.getState();
      const updatedItem = state.pantry.find(item => item.id === itemId);
      expect(updatedItem?.amount).toBe(5);
      expect(updatedItem?.expiryDate).toBe('2024-06-30');
      expect(updatedItem?.name).toBe('Sal'); // Should preserve other properties
      expect(state.isDirty).toBe(true);
    });

    it('should not update non-existent pantry item', () => {
      const { updatePantryItem } = store.getState();
      const nonExistentId = 'non-existent';
      const initialPantryLength = store.getState().pantry.length;

      updatePantryItem(nonExistentId, { amount: 100 });

      const state = store.getState();
      expect(state.pantry.length).toBe(initialPantryLength);
      expect(state.isDirty).toBe(false);
    });
  });

  describe('Mode Management', () => {
    it('should set mode and mark as dirty', () => {
      const { setMode } = store.getState();

      setMode('economico');

      const state = store.getState();
      expect(state.mode).toBe('economico');
      expect(state.isDirty).toBe(true);
    });

    it('should handle all valid modes', () => {
      const { setMode } = store.getState();
      const validModes = ['normal', 'economico', 'fiesta', 'dieta'] as const;

      validModes.forEach(mode => {
        setMode(mode);
        expect(store.getState().mode).toBe(mode);
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      const { clearError } = store.getState();
      
      // Manually set error for testing
      store.setState({ error: 'Test error' });
      expect(store.getState().error).toBe('Test error');

      clearError();
      expect(store.getState().error).toBeNull();
    });
  });

  describe('State Reset', () => {
    it('should reset to initial state', () => {
      const { setWeeklyPlan, setMode, addFavoriteDish, resetState } = store.getState();

      // Make some changes
      setWeeklyPlan(mockWeeklyPlan);
      setMode('economico');
      addFavoriteDish('new-favorite');

      // Verify changes
      let state = store.getState();
      expect(state.weeklyPlan).toBe(mockWeeklyPlan);
      expect(state.mode).toBe('economico');
      expect(state.isDirty).toBe(true);

      // Reset
      resetState();

      // Verify reset
      state = store.getState();
      expect(state.weeklyPlan).toBeNull();
      expect(state.mode).toBe('normal');
      expect(state.isDirty).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should not mutate original state when updating', () => {
      const { setPreferences, upsertPantryItem } = store.getState();
      const originalPreferences = store.getState().preferences;
      const originalPantry = store.getState().pantry;

      // Make changes
      setPreferences({
        budget: { weekly: 50000, currency: 'ARS', flexibility: 'flexible' }
      });

      upsertPantryItem({
        id: 'new-test-item',
        name: 'Test Item',
        category: 'otros',
        amount: 1,
        unit: 'unidad',
        frequency: 'baja'
      });

      // Original objects should not be mutated
      expect(originalPreferences).not.toBe(store.getState().preferences);
      expect(originalPantry).not.toBe(store.getState().pantry);
    });
  });

  describe('Zustand Subscription', () => {
    it('should notify subscribers on state changes', () => {
      const mockSubscriber = jest.fn();
      
      const unsubscribe = store.subscribe(mockSubscriber);

      store.getState().setMode('economico');

      expect(mockSubscriber).toHaveBeenCalled();
      
      unsubscribe();
    });

    it('should support selective subscriptions', () => {
      const mockModeSubscriber = jest.fn();
      
      const unsubscribe = store.subscribe(
        (state) => state.mode,
        mockModeSubscriber
      );

      // Change mode - should trigger
      store.getState().setMode('economico');
      expect(mockModeSubscriber).toHaveBeenCalledWith('economico', 'normal');

      // Change something else - should not trigger
      mockModeSubscriber.mockClear();
      store.getState().setDirty(true);
      expect(mockModeSubscriber).not.toHaveBeenCalled();
      
      unsubscribe();
    });
  });
});

describe('MealPlan Validation Schemas', () => {
  describe('MealTypeSchema', () => {
    it('should validate correct meal types', () => {
      const validMealTypes = ['desayuno', 'almuerzo', 'merienda', 'cena'];
      
      validMealTypes.forEach(mealType => {
        expect(() => MealTypeSchema.parse(mealType)).not.toThrow();
      });
    });

    it('should reject invalid meal types', () => {
      const invalidMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      
      invalidMealTypes.forEach(mealType => {
        expect(() => MealTypeSchema.parse(mealType)).toThrow();
      });
    });
  });

  describe('ModeTypeSchema', () => {
    it('should validate correct mode types', () => {
      const validModes = ['normal', 'economico', 'fiesta', 'dieta'];
      
      validModes.forEach(mode => {
        expect(() => ModeTypeSchema.parse(mode)).not.toThrow();
      });
    });

    it('should reject invalid mode types', () => {
      const invalidModes = ['budget', 'party', 'diet', 'regular'];
      
      invalidModes.forEach(mode => {
        expect(() => ModeTypeSchema.parse(mode)).toThrow();
      });
    });
  });

  describe('RegionTypeSchema', () => {
    it('should validate correct region types', () => {
      const validRegions = ['pampa', 'patagonia', 'norte', 'cuyo', 'centro', 'litoral'];
      
      validRegions.forEach(region => {
        expect(() => RegionTypeSchema.parse(region)).not.toThrow();
      });
    });

    it('should reject invalid region types', () => {
      const invalidRegions = ['buenos-aires', 'cordoba', 'mendoza'];
      
      invalidRegions.forEach(region => {
        expect(() => RegionTypeSchema.parse(region)).toThrow();
      });
    });
  });

  describe('ArgentineMealSchema', () => {
    it('should validate correct meal object', () => {
      const validMeal = {
        recipe: { id: 'test', name: 'Test Recipe' },
        servings: 4,
        notes: 'Test notes',
        locked: false,
        alternatives: [],
        cost: 1500,
        nutrition: {
          calories: 500,
          protein: 25,
          carbs: 50,
          fat: 15
        }
      };

      expect(() => ArgentineMealSchema.parse(validMeal)).not.toThrow();
    });

    it('should reject meal with invalid servings', () => {
      const invalidMeal = {
        recipe: { id: 'test', name: 'Test Recipe' },
        servings: 0, // Invalid: must be at least 1
        cost: 1500,
        nutrition: {
          calories: 500,
          protein: 25,
          carbs: 50,
          fat: 15
        }
      };

      expect(() => ArgentineMealSchema.parse(invalidMeal)).toThrow();
    });

    it('should reject meal with negative cost', () => {
      const invalidMeal = {
        recipe: { id: 'test', name: 'Test Recipe' },
        servings: 4,
        cost: -100, // Invalid: must be positive
        nutrition: {
          calories: 500,
          protein: 25,
          carbs: 50,
          fat: 15
        }
      };

      expect(() => ArgentineMealSchema.parse(invalidMeal)).toThrow();
    });
  });

  describe('ArgentineWeeklyPlanSchema', () => {
    it('should validate correct weekly plan structure', () => {
      const validPlan = {
        planId: 'plan-123',
        userId: 'user-456',
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        days: [],
        mode: 'normal',
        region: 'pampa',
        generatedAt: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };

      expect(() => ArgentineWeeklyPlanSchema.parse(validPlan)).not.toThrow();
    });

    it('should reject plan with invalid date format', () => {
      const invalidPlan = {
        planId: 'plan-123',
        userId: 'user-456',
        weekStart: '15/01/2024', // Invalid format
        weekEnd: '2024-01-21',
        days: [],
        mode: 'normal',
        region: 'pampa',
        generatedAt: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };

      expect(() => ArgentineWeeklyPlanSchema.parse(invalidPlan)).toThrow();
    });

    it('should reject plan with invalid mode', () => {
      const invalidPlan = {
        planId: 'plan-123',
        userId: 'user-456',
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        days: [],
        mode: 'invalid-mode', // Invalid mode
        region: 'pampa',
        generatedAt: '2024-01-15T10:00:00Z',
        lastModified: '2024-01-15T10:00:00Z'
      };

      expect(() => ArgentineWeeklyPlanSchema.parse(invalidPlan)).toThrow();
    });
  });
});