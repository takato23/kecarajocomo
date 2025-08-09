¡Vamos con todo! Abajo tenés un sistema completo y listo para pegar: hook principal, servicios de IA y Supabase, tipos, store Zustand, prompts, componentes UI con glassmorphism, tests (unit/integration/E2E), y documentación de implementación. Todo en TypeScript, pensado para Next.js 14 (App Router), optimizado, accesible y con fallbacks robustos.

Sugerencia: copiá los archivos en los paths indicados. El orden recomendado es:

1) Hook principal  
2) Tipos y Store Zustand  
3) Servicios (Supabase, Gemini, prompts)  
4) Componentes UI  
5) Tests  
6) CSS y configuración  
7) Documentación y SQL

---

## 1) Hook principal — `/hooks/meal-planning/useMealPlanning.ts`

```ts
'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import debounce from 'lodash.debounce';
import { createSelector } from 'reselect';
import { supabaseClient } from '@/lib/services/supabaseClient';
import { callGeminiWeeklyPlan, callGeminiRegenerateMeal, callGeminiAlternatives } from '@/lib/services/geminiClient';
import { buildWeeklyPlanPrompt, buildMealRegenerationPrompt, validateWeeklyPlan, validateRecipe, validateMealAlternatives } from '@/lib/prompts/argentineMealPrompts';
import { useMealPlanStore } from '@/store/slices/mealPlanSlice';
import {
  ArgentineWeeklyPlan,
  ArgentineDayPlan,
  MealType,
  Recipe,
  ShoppingList,
  ShoppingCategory,
  UserPreferences,
  ModeType,
  MealPlanRecord,
  WeeklyNutritionSummary,
  PantryItem,
} from '@/types/meal';
import { aggregateShoppingList } from '@/lib/utils/shoppingList';
import { deriveNutritionSummary } from '@/lib/utils/nutrition';
import { isSunday, isTwentyNinth, normalizeDate, getSeasonFromDate, getRegionFromTimezone } from '@/lib/utils/dates';
import { dedupeRecipes, enforceCulturalRules, generateFallbackWeeklyPlan, generateFallbackMeal, mapRecipeIds, ensureMate, ensureAsado, ensureNoquis29 } from '@/lib/utils/fallbacks';
import { retry } from '@/lib/utils/retry';
import { safeJsonParse } from '@/lib/utils/safeJson';
import { MetricStopwatch } from '@/lib/utils/metrics';

dayjs.extend(weekday);
dayjs.extend(isoWeek);

const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAYS = [400, 800, 1500];

const weeklyPlanSelector = (state: ReturnType<typeof useMealPlanStore.getState>) => state.weeklyPlan;
const preferencesSelector = (state: ReturnType<typeof useMealPlanStore.getState>) => state.preferences;
const pantrySelector = (state: ReturnType<typeof useMealPlanStore.getState>) => state.pantry;
const modeSelector = (state: ReturnType<typeof useMealPlanStore.getState>) => state.mode;
const weekKeySelector = (state: ReturnType<typeof useMealPlanStore.getState>) => state.weekKey;
const isDirtySelector = (state: ReturnType<typeof useMealPlanStore.getState>) => state.isDirty;

const memoizedSelectors = {
  weeklyPlan: createSelector(weeklyPlanSelector, (x) => x),
  preferences: createSelector(preferencesSelector, (x) => x),
  pantry: createSelector(pantrySelector, (x) => x),
  mode: createSelector(modeSelector, (x) => x),
  weekKey: createSelector(weekKeySelector, (x) => x),
  isDirty: createSelector(isDirtySelector, (x) => x),
};

type UseMealPlanningOptions = {
  initialWeekStart?: string; // ISO date
};

export const useMealPlanning = ({ initialWeekStart }: UseMealPlanningOptions = {}) => {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? getAnonymousUserId();
  const client = supabaseClient();

  const weeklyPlan = useMealPlanStore(memoizedSelectors.weeklyPlan);
  const preferences = useMealPlanStore(memoizedSelectors.preferences);
  const pantry = useMealPlanStore(memoizedSelectors.pantry);
  const mode = useMealPlanStore(memoizedSelectors.mode);
  const weekKey = useMealPlanStore(memoizedSelectors.weekKey);
  const isDirty = useMealPlanStore(memoizedSelectors.isDirty);

  const setWeeklyPlan = useMealPlanStore((s) => s.setWeeklyPlan);
  const setWeekKey = useMealPlanStore((s) => s.setWeekKey);
  const setDirty = useMealPlanStore((s) => s.setDirty);
  const setPreferences = useMealPlanStore((s) => s.setPreferences);
  const addFavoriteDish = useMealPlanStore((s) => s.addFavoriteDish);
  const addDislikedIngredient = useMealPlanStore((s) => s.addDislikedIngredient);
  const setMode = useMealPlanStore((s) => s.setMode);
  const upsertPantryItem = useMealPlanStore((s) => s.upsertPantryItem);
  const removePantryItem = useMealPlanStore((s) => s.removePantryItem);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Recipe[]>([]);
  const [nutritionSummary, setNutritionSummary] = useState<WeeklyNutritionSummary | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const currentWeekStart = useMemo(() => {
    if (initialWeekStart) return normalizeDate(initialWeekStart);
    return dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'); // Monday start in Argentina
  }, [initialWeekStart]);

  const currentWeekEnd = useMemo(() => dayjs(currentWeekStart).add(6, 'day').format('YYYY-MM-DD'), [currentWeekStart]);

  useEffect(() => {
    const wk = `${userId}:${currentWeekStart}`;
    setWeekKey(wk);
  }, [userId, currentWeekStart, setWeekKey]);

  const stopwatch = useRef(new MetricStopwatch('meal_planning'));

  const ensurePlanNutrition = useCallback((plan: ArgentineWeeklyPlan) => {
    const summary = deriveNutritionSummary(plan);
    setNutritionSummary(summary);
    return summary;
  }, []);

  const fetchExistingPlan = useCallback(async () => {
    setError(null);
    if (!userId) return null;

    const { data, error: dbError } = await client
      .from('meal_plans')
      .select('id, plan_data, week_start, week_end, updated_at')
      .eq('user_id', userId)
      .eq('week_start', currentWeekStart)
      .maybeSingle();

    if (dbError) {
      setError('Error al cargar el plan desde Supabase.');
      return null;
    }

    if (data?.plan_data) {
      const parsed = safeJsonParse<ArgentineWeeklyPlan>(data.plan_data);
      if (parsed) {
        setWeeklyPlan(parsed);
        ensurePlanNutrition(parsed);
        setDirty(false);
        if (data.updated_at) setLastSavedAt(new Date(data.updated_at));
        return parsed;
      }
    }

    return null;
  }, [client, userId, currentWeekStart, setWeeklyPlan, setDirty, ensurePlanNutrition]);

  const subscribeRealtime = useCallback(async () => {
    if (!userId) return;
    const channel = client
      .channel(`meal_plans_user_${userId}_week_${currentWeekStart}`, { config: { broadcast: { ack: true } } })
      .on(
        'postgres_changes',
        {
          schema: 'public',
          table: 'meal_plans',
          event: '*',
          filter: `user_id=eq.${userId},week_start=eq.${currentWeekStart}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const planData = (payload.new as any)?.plan_data;
            const parsed = safeJsonParse<ArgentineWeeklyPlan>(planData);
            if (parsed) {
              setWeeklyPlan(parsed);
              ensurePlanNutrition(parsed);
              setDirty(false);
            }
          }
        },
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      client.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [client, userId, currentWeekStart, setWeeklyPlan, setDirty, ensurePlanNutrition]);

  useEffect(() => {
    fetchExistingPlan();
    const unsubPromise = subscribeRealtime();
    return () => {
      unsubPromise.then((unsub) => unsub?.());
    };
  }, [fetchExistingPlan, subscribeRealtime]);

  const generatePlan = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      stopwatch.current.start('generate_plan');

      try {
        if (!force) {
          const existing = await fetchExistingPlan();
          if (existing) {
            stopwatch.current.end('generate_plan', { source: 'db' });
            return existing;
          }
        }

        const season = getSeasonFromDate(currentWeekStart);
        const region = getRegionFromTimezone();
        const prompt = buildWeeklyPlanPrompt({
          weekStart: currentWeekStart,
          season,
          region,
          preferences,
          pantry,
          mode,
        });

        const plan = await retry<ArgentineWeeklyPlan>(
          async () => {
            const response = await callGeminiWeeklyPlan(prompt);
            const parsed = validateWeeklyPlan(response);
            const curated = enforceCulturalRules(parsed, currentWeekStart);
            const deduped = dedupeRecipes(curated);
            const mapped = mapRecipeIds(deduped);
            const ensuredMate = ensureMate(mapped);
            const ensuredAsado = ensureAsado(ensuredMate);
            const ensuredNoquis = ensureNoquis29(ensuredAsado);
            return ensuredNoquis;
          },
          {
            retries: DEFAULT_MAX_RETRIES,
            delays: RETRY_DELAYS,
            onRetry: (attempt, err) => {
              console.warn('Retry generating weekly plan', attempt, err);
            },
          },
        );

        setWeeklyPlan(plan);
        setDirty(true);
        ensurePlanNutrition(plan);
        stopwatch.current.end('generate_plan', { source: 'ai' });
        return plan;
      } catch (err) {
        console.error(err);
        const fallback = generateFallbackWeeklyPlan({
          weekStart: currentWeekStart,
          preferences,
          pantry,
          mode,
        });
        setWeeklyPlan(fallback);
        setDirty(true);
        ensurePlanNutrition(fallback);
        setError('Hubo un problema con la IA. Generamos un plan alternativo.');
        stopwatch.current.end('generate_plan', { source: 'fallback' });
        return fallback;
      } finally {
        setLoading(false);
      }
    },
    [currentWeekStart, preferences, pantry, mode, setWeeklyPlan, setDirty, ensurePlanNutrition, fetchExistingPlan],
  );

  const regenerateMeal = useCallback(
    async (dayIndex: number, mealType: MealType) => {
      setLoading(true);
      setError(null);
      stopwatch.current.start('regenerate_meal');

      try {
        const day = weeklyPlan.days[dayIndex];
        if (!day) throw new Error('Día inválido');
        const date = day.date;
        const season = getSeasonFromDate(date);
        const region = getRegionFromTimezone();

        const prompt = buildMealRegenerationPrompt({
          weekPlan: weeklyPlan,
          dayIndex,
          mealType,
          season,
          region,
          preferences,
          pantry,
          mode,
        });

        const newRecipe = await retry<Recipe>(
          async () => {
            const resp = await callGeminiRegenerateMeal(prompt);
            const parsed = validateRecipe(resp);
            return parsed;
          },
          {
            retries: DEFAULT_MAX_RETRIES,
            delays: RETRY_DELAYS,
            onRetry: (attempt, err) => {
              console.warn('Retry regenerating meal', attempt, err);
            },
          },
        );

        const updated: ArgentineWeeklyPlan = {
          ...weeklyPlan,
          days: weeklyPlan.days.map((d, idx) =>
            idx === dayIndex
              ? {
                  ...d,
                  meals: {
                    ...d.meals,
                    [mealType]: {
                      ...d.meals[mealType],
                      recipe: { ...newRecipe, id: newRecipe.id || nanoid() },
                      recipeId: newRecipe.id || nanoid(),
                      pinned: false,
                    },
                  },
                }
              : d,
          ),
        };

        const curated = enforceCulturalRules(updated, currentWeekStart);
        const deduped = dedupeRecipes(curated);
        const mapped = mapRecipeIds(deduped);

        setWeeklyPlan(mapped);
        setDirty(true);
        ensurePlanNutrition(mapped);
        stopwatch.current.end('regenerate_meal', { source: 'ai' });
        return mapped;
      } catch (err) {
        console.error(err);
        const fallbackRecipe = generateFallbackMeal({
          weeklyPlan,
          dayIndex,
          mealType,
          preferences,
          pantry,
          mode,
        });
        const updated: ArgentineWeeklyPlan = {
          ...weeklyPlan,
          days: weeklyPlan.days.map((d, idx) =>
            idx === dayIndex
              ? {
                  ...d,
                  meals: {
                    ...d.meals,
                    [mealType]: {
                      ...d.meals[mealType],
                      recipe: fallbackRecipe,
                      recipeId: fallbackRecipe.id,
                      pinned: false,
                    },
                  },
                }
              : d,
          ),
        };
        setWeeklyPlan(updated);
        setDirty(true);
        ensurePlanNutrition(updated);
        setError('No pudimos regenerar con IA. Usamos una alternativa local.');
        stopwatch.current.end('regenerate_meal', { source: 'fallback' });
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [weeklyPlan, currentWeekStart, preferences, pantry, mode, setWeeklyPlan, setDirty, ensurePlanNutrition],
  );

  const getAlternatives = useCallback(
    async (dayIndex: number, mealType: MealType) => {
      setError(null);
      try {
        const day = weeklyPlan.days[dayIndex];
        if (!day) throw new Error('Día inválido');
        const season = getSeasonFromDate(day.date);
        const region = getRegionFromTimezone();

        const prompt = buildMealRegenerationPrompt({
          weekPlan: weeklyPlan,
          dayIndex,
          mealType,
          season,
          region,
          preferences,
          pantry,
          mode,
          alternatives: true,
        });

        const list = await retry<Recipe[]>(
          async () => {
            const resp = await callGeminiAlternatives(prompt);
            const parsed = validateMealAlternatives(resp);
            return parsed.map((r) => ({ ...r, id: r.id || nanoid() }));
          },
          {
            retries: DEFAULT_MAX_RETRIES,
            delays: RETRY_DELAYS,
          },
        );

        setAlternatives(list);
        return list;
      } catch (err) {
        console.error(err);
        setError('No pudimos obtener alternativas. Probá de nuevo.');
        setAlternatives([]);
        return [];
      }
    },
    [weeklyPlan, preferences, pantry, mode],
  );

  const applyAlternative = useCallback(
    (dayIndex: number, mealType: MealType, recipe: Recipe) => {
      const updated: ArgentineWeeklyPlan = {
        ...weeklyPlan,
        days: weeklyPlan.days.map((d, idx) =>
          idx === dayIndex
            ? {
                ...d,
                meals: {
                  ...d.meals,
                  [mealType]: {
                    ...d.meals[mealType],
                    recipe,
                    recipeId: recipe.id,
                  },
                },
              }
            : d,
        ),
      };
      setWeeklyPlan(updated);
      setDirty(true);
      ensurePlanNutrition(updated);
    },
    [weeklyPlan, setWeeklyPlan, setDirty, ensurePlanNutrition],
  );

  const togglePinned = useCallback(
    (dayIndex: number, mealType: MealType) => {
      const updated: ArgentineWeeklyPlan = {
        ...weeklyPlan,
        days: weeklyPlan.days.map((d, idx) =>
          idx === dayIndex
            ? {
                ...d,
                meals: {
                  ...d.meals,
                  [mealType]: {
                    ...d.meals[mealType],
                    pinned: !d.meals[mealType].pinned,
                  },
                },
              }
            : d,
        ),
      };
      setWeeklyPlan(updated);
      setDirty(true);
    },
    [weeklyPlan, setWeeklyPlan, setDirty],
  );

  const markAccepted = useCallback(
    (recipe: Recipe) => {
      if (!recipe?.name) return;
      addFavoriteDish(recipe.name);
      const newPrefs: UserPreferences = {
        ...preferences,
        favoriteDishes: Array.from(new Set([...(preferences.favoriteDishes || []), recipe.name])),
      };
      setPreferences(newPrefs);
      debounceSavePreferences(newPrefs);
    },
    [preferences, addFavoriteDish, setPreferences],
  );

  const markRejected = useCallback(
    (recipe: Recipe) => {
      if (!recipe?.ingredients) return;
      const dislikedSet = new Set(preferences.dislikedIngredients || []);
      for (const ing of recipe.ingredients) {
        const lower = ing.name.toLowerCase();
        if (lower.length >= 3) dislikedSet.add(lower);
      }
      const newPrefs: UserPreferences = {
        ...preferences,
        dislikedIngredients: Array.from(dislikedSet),
      };
      setPreferences(newPrefs);
      addDislikedIngredient(...Array.from(dislikedSet));
      debounceSavePreferences(newPrefs);
    },
    [preferences, setPreferences, addDislikedIngredient],
  );

  const debounceSavePreferences = useMemo(
    () =>
      debounce(async (prefs: UserPreferences) => {
        try {
          await client.from('user_preferences').upsert({
            user_id: userId,
            dietary_restrictions: prefs.dietaryRestrictions ?? [],
            favorite_dishes: prefs.favoriteDishes ?? [],
            disliked_ingredients: prefs.dislikedIngredients ?? [],
            household_size: prefs.householdSize ?? 1,
            budget_weekly: prefs.budgetWeekly ?? 0,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          console.error('No se pudieron guardar preferencias', e);
        }
      }, 500),
    [client, userId],
  );

  const buildShoppingList = useCallback((): ShoppingList => {
    return aggregateShoppingList(weeklyPlan, pantry);
  }, [weeklyPlan, pantry]);

  const savePlan = useCallback(
    async (opts?: { isPublic?: boolean }) => {
      setSaving(true);
      setError(null);

      try {
        const payload: MealPlanRecord = {
          id: nanoid(),
          user_id: userId,
          week_start: currentWeekStart,
          week_end: currentWeekEnd,
          plan_data: weeklyPlan,
          is_public: !!opts?.isPublic,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Optimistic update timestamp
        setLastSavedAt(new Date());

        const { error: dbError } = await client.from('meal_plans').upsert(
          {
            id: payload.id,
            user_id: payload.user_id,
            week_start: payload.week_start,
            week_end: payload.week_end,
            plan_data: payload.plan_data,
            is_public: payload.is_public,
            updated_at: payload.updated_at,
          },
          { onConflict: 'user_id,week_start' },
        );

        if (dbError) {
          setError('No se pudo guardar el plan.');
          return false;
        }

        setDirty(false);
        return true;
      } catch (err) {
        console.error(err);
        setError('Error inesperado al guardar.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [client, userId, currentWeekStart, currentWeekEnd, weeklyPlan],
  );

  const switchMode = useCallback(
    (newMode: ModeType) => {
      setMode(newMode);
      setDirty(true);
    },
    [setMode, setDirty],
  );

  const upsertPantry = useCallback(
    (item: PantryItem) => {
      upsertPantryItem(item);
      setDirty(true);
    },
    [upsertPantryItem, setDirty],
  );

  const removePantry = useCallback(
    (id: string) => {
      removePantryItem(id);
      setDirty(true);
    },
    [removePantryItem, setDirty],
  );

  useEffect(() => {
    if (weeklyPlan) {
      ensurePlanNutrition(weeklyPlan);
    }
  }, [weeklyPlan, ensurePlanNutrition]);

  return {
    // state
    userId,
    weeklyPlan,
    preferences,
    pantry,
    mode,
    weekKey,
    isDirty,
    loading,
    saving,
    error,
    lastSavedAt,
    alternatives,
    nutritionSummary,
    realtimeConnected,

    // computed
    currentWeekStart,
    currentWeekEnd,

    // actions
    generatePlan,
    regenerateMeal,
    getAlternatives,
    applyAlternative,
    togglePinned,
    markAccepted,
    markRejected,
    buildShoppingList,
    savePlan,
    switchMode,
    upsertPantry,
    removePantry,
    setError,
  };
};

function getAnonymousUserId(): string {
  if (typeof window === 'undefined') return 'anon';
  const key = 'kcc:anonUser';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = nanoid();
  window.localStorage.setItem(key, id);
  return id;
}
```

---

## 2) Tipos — `/types/meal.ts`

```ts
export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';

export type ShoppingCategory = 'Verdulería' | 'Carnicería' | 'Almacén' | 'Panadería' | 'Fiambrería' | 'Otros';

export type ModeType = 'normal' | 'economico' | 'fiesta' | 'dieta';

export interface Ingredient {
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  category?: ShoppingCategory;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutrition: NutritionalInfo;
  culturalNotes?: string;
}

export interface MealSlotData {
  recipeId?: string;
  recipe?: Recipe;
  pinned?: boolean;
  scheduledAt?: string;
}

export interface ArgentineDayPlan {
  date: string; // ISO
  label: string; // "Lunes", "Martes", etc.
  meals: Record<MealType, MealSlotData>;
}

export interface ArgentineWeeklyPlan {
  weekStart: string; // ISO
  weekEnd: string; // ISO
  days: ArgentineDayPlan[];
  metadata: {
    season: string;
    region: string;
    mode: ModeType;
    createdAt: string;
  };
}

export interface ShoppingListItem {
  name: string;
  totalQuantity?: number;
  unit?: string;
  notes?: string;
  category: ShoppingCategory;
  sources?: { day: string; recipe: string }[];
  owned?: boolean;
}

export interface ShoppingList {
  items: ShoppingListItem[];
  groups: Record<ShoppingCategory, ShoppingListItem[]>;
}

export interface UserPreferences {
  userId?: string;
  dietaryRestrictions?: string[];
  favoriteDishes?: string[];
  dislikedIngredients?: string[];
  householdSize?: number;
  budgetWeekly?: number;
  region?: string;
  season?: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  expiresAt?: string | null;
  category?: ShoppingCategory;
}

export interface WeeklyNutritionSummary {
  totalCalories: number;
  avgCaloriesPerDay: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanRecord {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  plan_data: ArgentineWeeklyPlan;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 3) Store Zustand — `/store/slices/mealPlanSlice.ts`

```ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { ArgentineWeeklyPlan, PantryItem, UserPreferences, ModeType } from '@/types/meal';

type State = {
  weeklyPlan: ArgentineWeeklyPlan | null;
  preferences: UserPreferences;
  pantry: PantryItem[];
  mode: ModeType;
  weekKey: string | null;
  isDirty: boolean;
};

type Actions = {
  setWeeklyPlan: (plan: ArgentineWeeklyPlan) => void;
  setPreferences: (prefs: UserPreferences) => void;
  addFavoriteDish: (dish: string) => void;
  addDislikedIngredient: (...ings: string[]) => void;
  setMode: (mode: ModeType) => void;
  setWeekKey: (key: string) => void;
  setDirty: (dirty: boolean) => void;
  upsertPantryItem: (item: PantryItem) => void;
  removePantryItem: (id: string) => void;
};

export const useMealPlanStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      weeklyPlan: null,
      preferences: {
        dietaryRestrictions: [],
        favoriteDishes: [],
        dislikedIngredients: [],
        householdSize: 2,
        budgetWeekly: 0,
      },
      pantry: [],
      mode: 'normal',
      weekKey: null,
      isDirty: false,

      setWeeklyPlan: (plan) => set({ weeklyPlan: plan }),
      setPreferences: (prefs) => set({ preferences: { ...get().preferences, ...prefs } }),
      addFavoriteDish: (dish) =>
        set({
          preferences: {
            ...get().preferences,
            favoriteDishes: Array.from(new Set([...(get().preferences.favoriteDishes || []), dish])),
          },
        }),
      addDislikedIngredient: (...ings) =>
        set({
          preferences: {
            ...get().preferences,
            dislikedIngredients: Array.from(
              new Set([...(get().preferences.dislikedIngredients || []), ...ings.map((i) => i.toLowerCase())]),
            ),
          },
        }),
      setMode: (mode) => set({ mode }),
      setWeekKey: (key) => set({ weekKey: key }),
      setDirty: (dirty) => set({ isDirty: dirty }),
      upsertPantryItem: (item) => {
        const existing = get().pantry;
        const idx = existing.findIndex((i) => i.id === item.id);
        let next: PantryItem[];
        if (idx >= 0) {
          next = [...existing];
          next[idx] = { ...existing[idx], ...item };
        } else {
          next = [...existing, { ...item, id: item.id || nanoid() }];
        }
        set({ pantry: next });
      },
      removePantryItem: (id) => {
        set({ pantry: get().pantry.filter((i) => i.id !== id) });
      },
    }),
    {
      name: 'kcc:meal-plan',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({
        weeklyPlan: state.weeklyPlan,
        preferences: state.preferences,
        pantry: state.pantry,
        mode: state.mode,
        weekKey: state.weekKey,
        isDirty: state.isDirty,
      }),
      migrate: (persisted, version) => {
        return persisted as any;
      },
    },
  ),
);
```

---

## 4) Servicios — Supabase & Gemini

### 4.1 `/lib/services/supabaseClient.ts`

```ts
import { createClient } from '@supabase/supabase-js';

let _client: ReturnType<typeof createClient> | null = null;

export function supabaseClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });
  return _client;
}
```

### 4.2 `/lib/services/geminiClient.ts`

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

function getModel() {
  const genAI = new GoogleGenerativeAI(apiKey!);
  // Gemini 1.5 Pro ideal para JSON
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: {
      temperature: 0.65,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
    safetySettings: [],
  });
}

export async function callGeminiWeeklyPlan(prompt: string): Promise<any> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  const txt = result.response.text();
  return JSON.parse(txt);
}

export async function callGeminiRegenerateMeal(prompt: string): Promise<any> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  const txt = result.response.text();
  return JSON.parse(txt);
}

export async function callGeminiAlternatives(prompt: string): Promise<any> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  const txt = result.response.text();
  return JSON.parse(txt);
}
```

---

## 5) Prompts y Validación — `/lib/prompts/argentineMealPrompts.ts`

```ts
import { z } from 'zod';
import { ArgentineWeeklyPlan, Recipe, MealType, UserPreferences, PantryItem, ModeType } from '@/types/meal';
import dayjs from 'dayjs';
import { isSunday, isTwentyNinth } from '@/lib/utils/dates';

export const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export const nutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number().optional(),
  sodium: z.number().optional(),
});

export const recipeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(z.string()),
  prepTime: z.number(),
  cookTime: z.number(),
  servings: z.number(),
  nutrition: nutritionSchema,
  culturalNotes: z.string().optional(),
});

export const mealSlotSchema = z.object({
  recipeId: z.string().optional(),
  recipe: recipeSchema.optional(),
  pinned: z.boolean().optional(),
  scheduledAt: z.string().optional(),
});

export const dayPlanSchema = z.object({
  date: z.string(),
  label: z.string(),
  meals: z.object({
    desayuno: mealSlotSchema,
    almuerzo: mealSlotSchema,
    merienda: mealSlotSchema,
    cena: mealSlotSchema,
  }),
});

export const weeklyPlanSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  days: z.array(dayPlanSchema).length(7),
  metadata: z.object({
    season: z.string(),
    region: z.string(),
    mode: z.enum(['normal', 'economico', 'fiesta', 'dieta']),
    createdAt: z.string(),
  }),
});

export function validateWeeklyPlan(json: any): ArgentineWeeklyPlan {
  return weeklyPlanSchema.parse(json);
}

export function validateRecipe(json: any): Recipe {
  return recipeSchema.parse(json);
}

export function validateMealAlternatives(json: any): Recipe[] {
  return z.array(recipeSchema).parse(json);
}

type BuildPlanPromptArgs = {
  weekStart: string;
  season: string;
  region: string;
  preferences: UserPreferences;
  pantry: PantryItem[];
  mode: ModeType;
};

export function buildWeeklyPlanPrompt(args: BuildPlanPromptArgs) {
  const { weekStart, season, region, preferences, pantry, mode } = args;
  const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');

  const pantryText = pantry.map((p) => `- ${p.name} ${p.quantity ?? ''} ${p.unit ?? ''}`).join('\n') || 'Ninguno';

  const restrictions = (preferences.dietaryRestrictions || []).join(', ') || 'Ninguna';
  const disliked = (preferences.dislikedIngredients || []).join(', ') || 'Ninguno';
  const favorites = (preferences.favoriteDishes || []).join(', ') || 'Ninguno';

  return `
Eres un chef argentino experto. Genera un plan semanal auténtico argentino en formato JSON estricto.

Requisitos culturales obligatorios:
- Desayuno y merienda incluyen mate frecuentemente.
- Cena alrededor de 21-22hs.
- Asado el domingo (almuerzo o cena).
- Ñoquis el 29 de cada mes (si la semana incluye el 29).
- Evitar repeticiones muy seguidas.
- Cortes de carne argentinos y nombres locales (nalga, roast beef, cuadril, vacío, tapa de asado, matambre).
- Empanadas, milanesas, guisos, pastel de papa, tarta de verdura, locro en invierno, ensaladas frescas en verano.

Contexto:
- Semana: ${weekStart} a ${weekEnd}
- Estación: ${season}
- Región: ${region}
- Modo: ${mode} (normal | economico | fiesta | dieta)
- Tamaño del hogar: ${preferences.householdSize ?? 2}
- Presupuesto semanal estimado: ${preferences.budgetWeekly ?? 0}
- Restricciones: ${restrictions}
- Ingredientes no deseados: ${disliked}
- Platos favoritos: ${favorites}
- Despensa disponible:
${pantryText}

Criterios nutricionales:
- Balance semanal razonable.
- Evitar calorías excesivas en modo "dieta".
- Opciones económicas y rendidoras en modo "economico".
- Opciones más festivas y abundantes en modo "fiesta".

Salida JSON DEBE seguir este esquema:
${weeklyPlanSchema.toString()}

Asegúrate de:
- Incluir 7 días con: desayuno, almuerzo, merienda y cena.
- Incluir recetas completas con ingredientes e instrucciones.
- Asegurar mate en varios desayunos/meriendas.
- Incluir asado el domingo.
- Incluir ñoquis si el 29 cae en la semana.
- Nombres y sabores típicamente argentinos.

Responde SOLO con JSON válido.
`;
}

type RegenArgs = {
  weekPlan: any;
  dayIndex: number;
  mealType: MealType;
  season: string;
  region: string;
  preferences: UserPreferences;
  pantry: PantryItem[];
  mode: ModeType;
  alternatives?: boolean;
};

export function buildMealRegenerationPrompt(args: RegenArgs) {
  const { weekPlan, dayIndex, mealType, season, region, preferences, pantry, mode, alternatives } = args;
  const pantryText = pantry.map((p) => `- ${p.name} ${p.quantity ?? ''} ${p.unit ?? ''}`).join('\n') || 'Ninguno';

  const restrictions = (preferences.dietaryRestrictions || []).join(', ') || 'Ninguna';
  const disliked = (preferences.dislikedIngredients || []).join(', ') || 'Ninguno';
  const favorites = (preferences.favoriteDishes || []).join(', ') || 'Ninguno';

  const outSchema = alternatives ? `Array<Recipe>` : `Recipe`;
  return `
Eres un chef argentino. Regenera una ${mealType} para el día index ${dayIndex} (0=Lunes).
Mantén coherencia con el resto del plan y evita repeticiones cercanas.

Contexto:
- Estación: ${season}
- Región: ${region}
- Modo: ${mode}
- Restricciones: ${restrictions}
- Ingredientes no deseados: ${disliked}
- Platos favoritos: ${favorites}
- Despensa:
${pantryText}

Plan actual (JSON):
${JSON.stringify(weekPlan)}

Debes devolver un ${outSchema} en JSON válido siguiendo el schema:

Recipe:
${recipeSchema.toString()}

${alternatives ? 'Devuelve 3 alternativas relevantes en un array.' : 'Devuelve una sola receta completa.'}

Requisitos culturales: recetas argentinas auténticas, uso de cortes de carne locales cuando corresponda, uso de mate en desayuno/merienda cuando corresponda. Evita ingredientes no deseados.
Responde SOLO JSON.
`;
}
```

---

## 6) Utilidades — `/lib/utils/*`

### 6.1 Fechas — `/lib/utils/dates.ts`

```ts
import dayjs from 'dayjs';

export function normalizeDate(d: string) {
  return dayjs(d).format('YYYY-MM-DD');
}

export function isSunday(d: string) {
  return dayjs(d).day() === 0;
}

export function isTwentyNinth(d: string) {
  return dayjs(d).date() === 29;
}

export function getSeasonFromDate(date: string) {
  const m = dayjs(date).month() + 1;
  if (m >= 12 || m <= 2) return 'verano';
  if (m >= 3 && m <= 5) return 'otoño';
  if (m >= 6 && m <= 8) return 'invierno';
  return 'primavera';
}

export function getRegionFromTimezone() {
  // Simple: Argentina
  return 'Argentina';
}
```

### 6.2 Retry — `/lib/utils/retry.ts`

```ts
type RetryOpts = {
  retries: number;
  delays?: number[];
  onRetry?: (attempt: number, error: unknown) => void;
};

export async function retry<T>(fn: () => Promise<T>, opts: RetryOpts): Promise<T> {
  const { retries, delays = [] } = opts;
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      if (opts.onRetry) opts.onRetry(attempt + 1, err);
      const delay = delays[attempt] ?? 500 * (attempt + 1);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
  throw lastError;
}
```

### 6.3 Safe JSON — `/lib/utils/safeJson.ts`

```ts
export function safeJsonParse<T>(value: any): T | null {
  try {
    if (typeof value === 'string') return JSON.parse(value) as T;
    return value as T;
  } catch {
    return null;
  }
}
```

### 6.4 Metrics — `/lib/utils/metrics.ts`

```ts
export class MetricStopwatch {
  private label: string;
  private starts: Record<string, number> = {};

  constructor(label: string) {
    this.label = label;
  }

  start(name: string) {
    this.starts[name] = performance.now();
  }

  end(name: string, metadata?: Record<string, any>) {
    const start = this.starts[name];
    if (!start) return;
    const dur = performance.now() - start;
    // Simple console metric; could integrate with analytics.
    console.info(`[Metric] ${this.label}:${name} ${dur.toFixed(0)}ms`, metadata || {});
    delete this.starts[name];
  }
}
```

### 6.5 Fallbacks — `/lib/utils/fallbacks.ts`

```ts
import { ArgentineWeeklyPlan, Recipe, MealType, UserPreferences, PantryItem, ModeType, ArgentineDayPlan } from '@/types/meal';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { isSunday, isTwentyNinth } from './dates';

const baseRecipes: Record<string, Recipe> = {
  'Asado clásico': {
    id: 'asado-clasico',
    name: 'Asado clásico',
    ingredients: [
      { name: 'Vacío', quantity: 1, unit: 'kg', category: 'Carnicería' },
      { name: 'Chorizos', quantity: 4, unit: 'u', category: 'Carnicería' },
      { name: 'Provoleta', quantity: 1, unit: 'u', category: 'Fiambrería' },
      { name: 'Chimichurri', quantity: 100, unit: 'g', category: 'Almacén' },
      { name: 'Pan', quantity: 1, unit: 'kg', category: 'Panadería' },
      { name: 'Ensalada mixta', quantity: 1, unit: 'bandeja', category: 'Verdulería' },
    ],
    instructions: [
      'Encender la parrilla con brasas.',
      'Cocinar el vacío y los chorizos a fuego medio.',
      'Servir con provolone a la parrilla, pan y ensalada.',
    ],
    prepTime: 20,
    cookTime: 60,
    servings: 4,
    nutrition: { calories: 800, protein: 60, carbs: 20, fat: 50 },
    culturalNotes: 'Clásico asado dominical argentino.',
  },
  'Ñoquis caseros': {
    id: 'noquis-caseros',
    name: 'Ñoquis caseros',
    ingredients: [
      { name: 'Papas', quantity: 1, unit: 'kg', category: 'Verdulería' },
      { name: 'Harina', quantity: 300, unit: 'g', category: 'Almacén' },
      { name: 'Huevo', quantity: 1, unit: 'u', category: 'Almacén' },
      { name: 'Salsa de tomate', quantity: 400, unit: 'g', category: 'Almacén' },
      { name: 'Queso rallado', quantity: 100, unit: 'g', category: 'Fiambrería' },
    ],
    instructions: [
      'Hervir papas, hacer puré.',
      'Mezclar con harina y huevo hasta formar masa.',
      'Formar tiras y cortar ñoquis.',
      'Hervir y servir con salsa.',
    ],
    prepTime: 30,
    cookTime: 20,
    servings: 4,
    nutrition: { calories: 600, protein: 20, carbs: 110, fat: 10 },
    culturalNotes: 'Ñoquis del 29, tradición para la prosperidad.',
  },
  'Mate con tostadas': {
    id: 'mate-tostadas',
    name: 'Mate con tostadas',
    ingredients: [
      { name: 'Yerba mate', quantity: 100, unit: 'g', category: 'Almacén' },
      { name: 'Pan', quantity: 4, unit: 'rodajas', category: 'Panadería' },
      { name: 'Manteca', quantity: 30, unit: 'g', category: 'Almacén' },
      { name: 'Dulce de leche', quantity: 40, unit: 'g', category: 'Almacén' },
    ],
    instructions: ['Cebar mate.', 'Tostar pan y untar con manteca y dulce de leche.'],
    prepTime: 5,
    cookTime: 0,
    servings: 2,
    nutrition: { calories: 350, protein: 6, carbs: 50, fat: 12 },
    culturalNotes: 'Infaltable en desayunos y meriendas.',
  },
  'Milanesas con puré': {
    id: 'milanesas-pure',
    name: 'Milanesas con puré de papas',
    ingredients: [
      { name: 'Nalga para milanesa', quantity: 600, unit: 'g', category: 'Carnicería' },
      { name: 'Huevos', quantity: 2, unit: 'u', category: 'Almacén' },
      { name: 'Pan rallado', quantity: 200, unit: 'g', category: 'Almacén' },
      { name: 'Papas', quantity: 800, unit: 'g', category: 'Verdulería' },
      { name: 'Leche', quantity: 100, unit: 'ml', category: 'Almacén' },
    ],
    instructions: [
      'Empanar lonjas de carne pasándolas por huevo y pan rallado.',
      'Freír u hornear.',
      'Hacer puré con papas hervidas y leche.',
    ],
    prepTime: 25,
    cookTime: 25,
    servings: 4,
    nutrition: { calories: 700, protein: 40, carbs: 60, fat: 30 },
  },
};

const breakfastMate: Recipe = baseRecipes['Mate con tostadas'];

function buildDayLabel(idx: number) {
  return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][idx];
}

export function generateFallbackWeeklyPlan(args: {
  weekStart: string;
  preferences: UserPreferences;
  pantry: PantryItem[];
  mode: ModeType;
}): ArgentineWeeklyPlan {
  const { weekStart } = args;
  const start = dayjs(weekStart);
  const days: ArgentineDayPlan[] = Array.from({ length: 7 }).map((_, idx) => {
    const date = start.add(idx, 'day').format('YYYY-MM-DD');
    return {
      date,
      label: buildDayLabel(idx),
      meals: {
        desayuno: { recipe: breakfastMate, recipeId: breakfastMate.id },
        almuerzo: { recipe: baseRecipes['Milanesas con puré'], recipeId: baseRecipes['Milanesas con puré'].id },
        merienda: { recipe: breakfastMate, recipeId: breakfastMate.id },
        cena: { recipe: baseRecipes['Milanesas con puré'], recipeId: baseRecipes['Milanesas con puré'].id },
      },
    };
  });

  // Asado domingo
  const sundayIdx = 6;
  days[sundayIdx].meals.almuerzo = { recipe: baseRecipes['Asado clásico'], recipeId: baseRecipes['Asado clásico'].id };

  // Ñoquis 29 si corresponde
  days.forEach((d) => {
    if (isTwentyNinth(d.date)) {
      d.meals.almuerzo = { recipe: baseRecipes['Ñoquis caseros'], recipeId: baseRecipes['Ñoquis caseros'].id };
    }
  });

  return {
    weekStart: weekStart,
    weekEnd: start.add(6, 'day').format('YYYY-MM-DD'),
    days,
    metadata: {
      season: 'auto',
      region: 'Argentina',
      mode: args.mode,
      createdAt: new Date().toISOString(),
    },
  };
}

export function generateFallbackMeal(args: {
  weeklyPlan: ArgentineWeeklyPlan;
  dayIndex: number;
  mealType: MealType;
  preferences: UserPreferences;
  pantry: PantryItem[];
  mode: ModeType;
}): Recipe {
  const { mealType } = args;
  if (mealType === 'desayuno' || mealType === 'merienda') return breakfastMate;
  return baseRecipes['Milanesas con puré'];
}

export function enforceCulturalRules(plan: ArgentineWeeklyPlan, weekStart: string) {
  const updated = { ...plan, days: plan.days.map((d) => ({ ...d })) };

  updated.days.forEach((d, idx) => {
    // Ensure at least mate in breakfast/merienda often
    if (idx % 2 === 0 && d.meals.desayuno && !includesMate(d.meals.desayuno.recipe)) {
      d.meals.desayuno.recipe = breakfastMate;
      d.meals.desayuno.recipeId = breakfastMate.id;
    }
    if (idx % 2 === 1 && d.meals.merienda && !includesMate(d.meals.merienda.recipe)) {
      d.meals.merienda.recipe = breakfastMate;
      d.meals.merienda.recipeId = breakfastMate.id;
    }
  });

  // Sunday asado
  const sunday = updated.days[6];
  if (sunday) {
    if (!isAsado(sunday.meals.almuerzo.recipe) && !isAsado(sunday.meals.cena.recipe)) {
      sunday.meals.almuerzo.recipe = baseRecipes['Asado clásico'];
      sunday.meals.almuerzo.recipeId = baseRecipes['Asado clásico'].id;
    }
  }

  // Ñoquis 29
  updated.days.forEach((d) => {
    if (isTwentyNinth(d.date) && !isNoquis(d.meals.almuerzo.recipe) && !isNoquis(d.meals.cena.recipe)) {
      d.meals.almuerzo.recipe = baseRecipes['Ñoquis caseros'];
      d.meals.almuerzo.recipeId = baseRecipes['Ñoquis caseros'].id;
    }
  });

  return updated;
}

export function dedupeRecipes(plan: ArgentineWeeklyPlan) {
  const seen = new Set<string>();
  const updated = { ...plan, days: plan.days.map((d) => ({ ...d })) };

  updated.days.forEach((d) => {
    (['desayuno', 'almuerzo', 'merienda', 'cena'] as MealType[]).forEach((m) => {
      const r = d.meals[m]?.recipe;
      if (!r) return;
      const key = r.name.toLowerCase();
      if (seen.has(key)) {
        // swap to a different fallback to avoid repetition
        if (m === 'almuerzo' || m === 'cena') {
          d.meals[m].recipe = baseRecipes['Milanesas con puré'];
          d.meals[m].recipeId = baseRecipes['Milanesas con puré'].id;
        } else {
          d.meals[m].recipe = baseRecipes['Mate con tostadas'];
          d.meals[m].recipeId = baseRecipes['Mate con tostadas'].id;
        }
      } else {
        seen.add(key);
      }
    });
  });

  return updated;
}

export function mapRecipeIds(plan: ArgentineWeeklyPlan) {
  const updated = { ...plan, days: plan.days.map((d) => ({ ...d })) };
  updated.days.forEach((d) => {
    (['desayuno', 'almuerzo', 'merienda', 'cena'] as MealType[]).forEach((m) => {
      const slot = d.meals[m];
      if (slot?.recipe && !slot.recipe.id) {
        slot.recipe.id = nanoid();
        slot.recipeId = slot.recipe.id;
      }
      if (slot?.recipe && !slot.recipeId) {
        slot.recipeId = slot.recipe.id;
      }
    });
  });
  return updated;
}

function includesMate(recipe?: Recipe) {
  return recipe?.name?.toLowerCase().includes('mate') ?? false;
}

function isAsado(recipe?: Recipe) {
  return recipe?.name?.toLowerCase().includes('asado') ?? false;
}

function isNoquis(recipe?: Recipe) {
  return recipe?.name?.toLowerCase().includes('ñoqui') || recipe?.name?.toLowerCase().includes('noqui') || false;
}

export function ensureMate(plan: ArgentineWeeklyPlan) {
  return enforceCulturalRules(plan, plan.weekStart);
}
export function ensureAsado(plan: ArgentineWeeklyPlan) {
  return enforceCulturalRules(plan, plan.weekStart);
}
export function ensureNoquis29(plan: ArgentineWeeklyPlan) {
  return enforceCulturalRules(plan, plan.weekStart);
}
```

### 6.6 Shopping List — `/lib/utils/shoppingList.ts`

```ts
import { ArgentineWeeklyPlan, Ingredient, ShoppingCategory, ShoppingList, ShoppingListItem, PantryItem } from '@/types/meal';

const categoryMap: Record<string, ShoppingCategory> = {
  papa: 'Verdulería',
  papas: 'Verdulería',
  tomate: 'Verdulería',
  lechuga: 'Verdulería',
  cebolla: 'Verdulería',
  zanahoria: 'Verdulería',
  vacío: 'Carnicería',
  'nalga para milanesa': 'Carnicería',
  nalga: 'Carnicería',
  'roast beef': 'Carnicería',
  'tapa de asado': 'Carnicería',
  matambre: 'Carnicería',
  chorizo: 'Carnicería',
  chorizos: 'Carnicería',
  harina: 'Almacén',
  yerba: 'Almacén',
  'yerba mate': 'Almacén',
  azúcar: 'Almacén',
  sal: 'Almacén',
  aceite: 'Almacén',
  pan: 'Panadería',
  facturas: 'Panadería',
  queso: 'Fiambrería',
  'queso rallado': 'Fiambrería',
  jamón: 'Fiambrería',
};

function categorize(name: string): ShoppingCategory {
  const key = name.toLowerCase().trim();
  for (const k in categoryMap) {
    if (key.includes(k)) return categoryMap[k];
  }
  return 'Otros';
}

export function aggregateShoppingList(plan: ArgentineWeeklyPlan, pantry: PantryItem[]): ShoppingList {
  const itemsMap = new Map<string, ShoppingListItem>();

  for (const day of plan.days) {
    for (const mealKey of ['desayuno', 'almuerzo', 'merienda', 'cena'] as const) {
      const slot = day.meals[mealKey];
      const recipe = slot?.recipe;
      if (!recipe) continue;
      for (const ing of recipe.ingredients || []) {
        const cat = ing.category || categorize(ing.name);
        const key = `${cat}:${ing.name.toLowerCase()}:${ing.unit || ''}`;
        const existing = itemsMap.get(key);
        const source = { day: day.label, recipe: recipe.name };
        if (existing) {
          existing.totalQuantity = (existing.totalQuantity ?? 0) + (ing.quantity ?? 0);
          existing.sources?.push(source);
        } else {
          itemsMap.set(key, {
            name: ing.name,
            totalQuantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
            category: cat,
            sources: [source],
          });
        }
      }
    }
  }

  // Mark owned based on pantry
  const list = Array.from(itemsMap.values()).map((it) => {
    const found = pantry.find((p) => p.name.toLowerCase().trim() === it.name.toLowerCase().trim());
    return {
      ...it,
      owned: !!found,
    };
  });

  const groups: Record<ShoppingCategory, ShoppingListItem[]> = {
    Verdulería: [],
    Carnicería: [],
    Almacén: [],
    Panadería: [],
    Fiambrería: [],
    Otros: [],
  };
  for (const it of list) {
    groups[it.category].push(it);
  }

  for (const k in groups) {
    groups[k as ShoppingCategory].sort((a, b) => a.name.localeCompare(b.name));
  }

  return { items: list, groups };
}
```

### 6.7 Nutrición — `/lib/utils/nutrition.ts`

```ts
import { ArgentineWeeklyPlan, WeeklyNutritionSummary } from '@/types/meal';

export function deriveNutritionSummary(plan: ArgentineWeeklyPlan): WeeklyNutritionSummary {
  let totalCalories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const day of plan.days) {
    for (const mealKey of ['desayuno', 'almuerzo', 'merienda', 'cena'] as const) {
      const rec = day.meals[mealKey]?.recipe;
      if (!rec?.nutrition) continue;
      totalCalories += rec.nutrition.calories || 0;
      protein += rec.nutrition.protein || 0;
      carbs += rec.nutrition.carbs || 0;
      fat += rec.nutrition.fat || 0;
    }
  }

  return {
    totalCalories,
    avgCaloriesPerDay: totalCalories / 7,
    protein,
    carbs,
    fat,
  };
}
```

---

## 7) Componentes UI

### 7.1 Grid — `/components/meal-planning/MealPlannerGrid.tsx`

```tsx
'use client';

import React from 'react';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';
import { MealSlot } from './MealSlot';
import { ShoppingListGenerator } from './ShoppingListGenerator';
import { NutritionalSummary } from './NutritionalSummary';
import { ModeType } from '@/types/meal';
import { cn } from '@/lib/ui/cn';
import dayjs from 'dayjs';

type Props = {
  className?: string;
};

export const MealPlannerGrid: React.FC<Props> = ({ className }) => {
  const {
    weeklyPlan,
    currentWeekStart,
    currentWeekEnd,
    loading,
    saving,
    error,
    generatePlan,
    savePlan,
    buildShoppingList,
    nutritionSummary,
    switchMode,
    mode,
    realtimeConnected,
  } = useMealPlanning();

  const [openShopping, setOpenShopping] = React.useState(false);

  return (
    <div className={cn('space-y-6', className)}>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">🍽️ Planificador Semanal</h1>
          <p className="text-sm text-white/70">
            Semana del {dayjs(currentWeekStart).format('DD/MM')} al {dayjs(currentWeekEnd).format('DD/MM')}
          </p>
          <p className="text-xs text-emerald-400 mt-1">{realtimeConnected ? 'Sincronizado en tiempo real' : 'Conectando...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Modo"
            className="glass-select"
            value={mode}
            onChange={(e) => switchMode(e.target.value as ModeType)}
          >
            <option value="normal">Modo: Normal</option>
            <option value="economico">Modo: Económico</option>
            <option value="fiesta">Modo: Fiesta</option>
            <option value="dieta">Modo: Dieta</option>
          </select>
          <button
            className="glass-button"
            onClick={() => generatePlan(true)}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Generando...' : 'Generar con IA'}
          </button>
          <button
            className="glass-button"
            onClick={() => {
              const res = buildShoppingList();
              if (res.items.length === 0) return;
              setOpenShopping(true);
            }}
            disabled={!weeklyPlan}
          >
            Lista de Compras
          </button>
          <button
            className="glass-button-primary"
            onClick={() => savePlan({ isPublic: false })}
            disabled={!weeklyPlan || saving}
            aria-busy={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="glass-alert">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-8 gap-2">
            <div />
            {weeklyPlan?.days.map((d, idx) => (
              <div key={idx} className="text-center text-sm font-medium text-white/80">
                {d.label.slice(0, 3)}
              </div>
            ))}

            <div className="text-sm text-white/70">Desayuno</div>
            {weeklyPlan?.days.map((d, idx) => (
              <MealSlot key={`d-${idx}`} dayIndex={idx} mealType="desayuno" slot={d.meals.desayuno} />
            ))}

            <div className="text-sm text-white/70">Almuerzo</div>
            {weeklyPlan?.days.map((d, idx) => (
              <MealSlot key={`a-${idx}`} dayIndex={idx} mealType="almuerzo" slot={d.meals.almuerzo} />
            ))}

            <div className="text-sm text-white/70">Merienda</div>
            {weeklyPlan?.days.map((d, idx) => (
              <MealSlot key={`m-${idx}`} dayIndex={idx} mealType="merienda" slot={d.meals.merienda} />
            ))}

            <div className="text-sm text-white/70">Cena</div>
            {weeklyPlan?.days.map((d, idx) => (
              <MealSlot key={`c-${idx}`} dayIndex={idx} mealType="cena" slot={d.meals.cena} />
            ))}
          </div>
        </div>
      </div>

      <NutritionalSummary summary={nutritionSummary} />

      <ShoppingListGenerator open={openShopping} onClose={() => setOpenShopping(false)} />
    </div>
  );
};
```

### 7.2 MealSlot — `/components/meal-planning/MealSlot.tsx`

```tsx
'use client';

import React from 'react';
import { MealType, MealSlotData, Recipe } from '@/types/meal';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';
import { RecipeSelectionModal } from './RecipeSelectionModal';
import { cn } from '@/lib/ui/cn';

const mealIcon: Record<MealType, string> = {
  desayuno: '☕',
  almuerzo: '🍽️',
  merienda: '🧉',
  cena: '🌙',
};

type Props = {
  dayIndex: number;
  mealType: MealType;
  slot?: MealSlotData;
};

export const MealSlot: React.FC<Props> = ({ dayIndex, mealType, slot }) => {
  const { regenerateMeal, togglePinned, getAlternatives, applyAlternative, markAccepted, markRejected } = useMealPlanning();

  const [open, setOpen] = React.useState(false);
  const [loadingAlt, setLoadingAlt] = React.useState(false);
  const [localAlternatives, setLocalAlternatives] = React.useState<Recipe[]>([]);

  const loadAlternatives = async () => {
    setLoadingAlt(true);
    const result = await getAlternatives(dayIndex, mealType);
    setLocalAlternatives(result);
    setLoadingAlt(false);
  };

  const recipe = slot?.recipe;

  return (
    <div className="glass-card p-3 h-[120px] flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xl">{mealIcon[mealType]}</div>
        <button
          aria-label="Pin"
          className={cn(
            'rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2',
            slot?.pinned ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 text-white/60',
          )}
          onClick={() => togglePinned(dayIndex, mealType)}
          title={slot?.pinned ? 'Desfijar' : 'Fijar'}
        >
          📌
        </button>
      </div>

      <div className="text-sm font-medium line-clamp-2">{recipe?.name || '—'}</div>
      <div className="flex items-center gap-2">
        <button className="text-xs glass-button" onClick={() => regenerateMeal(dayIndex, mealType)}>
          Regenerar con IA
        </button>
        <button
          className="text-xs glass-button"
          onClick={() => {
            setOpen(true);
            loadAlternatives();
          }}
        >
          Alternativas
        </button>
      </div>

      <RecipeSelectionModal
        open={open}
        loading={loadingAlt}
        alternatives={localAlternatives}
        onClose={() => setOpen(false)}
        onChoose={(r) => {
          applyAlternative(dayIndex, mealType, r);
          setOpen(false);
        }}
        onAccept={(r) => markAccepted(r)}
        onReject={(r) => markRejected(r)}
      />
    </div>
  );
};
```

### 7.3 Modal de selección — `/components/meal-planning/RecipeSelectionModal.tsx`

```tsx
'use client';

import React from 'react';
import { Recipe } from '@/types/meal';
import { cn } from '@/lib/ui/cn';

type Props = {
  open: boolean;
  alternatives: Recipe[];
  loading?: boolean;
  onClose: () => void;
  onChoose: (recipe: Recipe) => void;
  onAccept: (recipe: Recipe) => void;
  onReject: (recipe: Recipe) => void;
};

export const RecipeSelectionModal: React.FC<Props> = ({
  open,
  alternatives,
  loading,
  onClose,
  onChoose,
  onAccept,
  onReject,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative glass-panel w-full max-w-2xl max-h-[80vh] overflow-auto p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Alternativas</h3>
          <button className="glass-button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {loading && <div className="mt-4">Cargando alternativas...</div>}

        {!loading && alternatives.length === 0 && (
          <div className="mt-4 text-white/70">No hay alternativas disponibles en este momento.</div>
        )}

        <div className="mt-4 space-y-4">
          {alternatives.map((r) => (
            <div key={r.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-medium">{r.name}</div>
                  {r.culturalNotes && <div className="text-xs text-white/60 mt-1">{r.culturalNotes}</div>}
                </div>
                <button className="glass-button-primary" onClick={() => onChoose(r)}>
                  Elegir
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-white/60 text-xs uppercase mb-1">Ingredientes</div>
                  <ul className="list-disc list-inside space-y-1">
                    {r.ingredients.map((i, idx) => (
                      <li key={idx}>
                        {i.name}
                        {i.quantity ? ` - ${i.quantity}${i.unit || ''}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-white/60 text-xs uppercase mb-1">Pasos</div>
                  <ol className="list-decimal list-inside space-y-1">
                    {r.instructions.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button className="glass-button" onClick={() => onAccept(r)}>
                  Me gusta 👍
                </button>
                <button className="glass-button" onClick={() => onReject(r)}>
                  No me gusta 👎
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 7.4 Shopping List — `/components/meal-planning/ShoppingListGenerator.tsx`

```tsx
'use client';

import React from 'react';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';
import { ShoppingCategory } from '@/types/meal';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const ShoppingListGenerator: React.FC<Props> = ({ open, onClose }) => {
  const { buildShoppingList } = useMealPlanning();
  const list = buildShoppingList();

  const copyToClipboard = async () => {
    const text = Object.entries(list.groups)
      .map(([cat, items]) => {
        const t = items
          .map((i) => `- ${i.name}${i.totalQuantity ? ` (${i.totalQuantity}${i.unit || ''})` : ''}${i.owned ? ' ✅' : ''}`)
          .join('\n');
        return `## ${cat}\n${t}`;
      })
      .join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative glass-panel w-full max-w-3xl max-h-[80vh] overflow-auto p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">🛒 Lista de Compras</h3>
          <div className="flex items-center gap-2">
            <button className="glass-button" onClick={copyToClipboard}>
              Copiar
            </button>
            <button className="glass-button-primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {(Object.keys(list.groups) as ShoppingCategory[]).map((cat) => {
            const items = list.groups[cat];
            return (
              <div key={cat} className="glass-card p-4">
                <div className="text-sm font-semibold mb-3">{cat}</div>
                <ul className="space-y-2">
                  {items.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span>{i.owned ? '✅' : '⬜️'}</span>
                      <div>
                        <div className="font-medium">
                          {i.name}
                          {i.totalQuantity ? ` · ${i.totalQuantity}${i.unit || ''}` : ''}
                        </div>
                        {i.sources && (
                          <div className="text-xs text-white/60">
                            {i.sources.slice(0, 2).map((s, ix) => (
                              <span key={ix}>
                                {s.day}: {s.recipe}
                                {ix < i.sources!.length - 1 ? ' · ' : ''}
                              </span>
                            ))}
                            {i.sources.length > 2 ? ` +${i.sources.length - 2} más` : ''}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                  {items.length === 0 && <li className="text-white/60 text-sm">No hay ítems.</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

### 7.5 Nutrición — `/components/meal-planning/NutritionalSummary.tsx`

```tsx
'use client';

import React from 'react';
import { WeeklyNutritionSummary } from '@/types/meal';

type Props = {
  summary: WeeklyNutritionSummary | null;
};

export const NutritionalSummary: React.FC<Props> = ({ summary }) => {
  if (!summary) return null;

  const items = [
    { label: 'Calorías totales', value: Math.round(summary.totalCalories) },
    { label: 'Calorías promedio/día', value: Math.round(summary.avgCaloriesPerDay) },
    { label: 'Proteínas (g)', value: Math.round(summary.protein) },
    { label: 'Carbohidratos (g)', value: Math.round(summary.carbs) },
    { label: 'Grasas (g)', value: Math.round(summary.fat) },
  ];

  return (
    <div className="glass-panel p-4">
      <h3 className="text-lg font-semibold mb-3">Resumen Nutricional</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map((i) => (
          <div key={i.label} className="glass-card p-3 text-center">
            <div className="text-xs text-white/60">{i.label}</div>
            <div className="text-xl font-semibold mt-1">{i.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 7.6 Utilidad UI — `/lib/ui/cn.ts`

```ts
export function cn(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}
```

---

## 8) Página — `/app/(app)/planificador/page.tsx`

```tsx
'use client';

import React from 'react';
import { MealPlannerGrid } from '@/components/meal-planning/MealPlannerGrid';

export default function Page() {
  return (
    <main className="min-h-screen px-4 py-6 md:py-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <MealPlannerGrid />
      </div>
    </main>
  );
}
```

---

## 9) CSS Glassmorphism

### 9.1 Tailwind config (asegurate que exista) — `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {},
      boxShadow: {
        glass: '0 8px 30px rgba(0,0,0,0.12)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
export default config;
```

### 9.2 Estilos globales — `/src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .glass-panel {
    @apply bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-glass;
  }
  .glass-card {
    @apply bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl;
  }
  .glass-button {
    @apply bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 transition focus:outline-none focus:ring-2 focus:ring-white/40;
  }
  .glass-button-primary {
    @apply bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-300;
  }
  .glass-select {
    @apply bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30;
  }
  .glass-alert {
    @apply glass-panel p-3 text-sm text-red-200 border-red-300/30;
  }
}
```

---

## 10) Tests

### 10.1 Vitest config — `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 10.2 Setup — `vitest.setup.ts`

```ts
import '@testing-library/jest-dom';
```

### 10.3 Unit: Fallbacks — `/tests/unit/fallbacks.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { generateFallbackWeeklyPlan } from '@/lib/utils/fallbacks';
import dayjs from 'dayjs';

describe('fallbacks', () => {
  it('includes asado on sunday', () => {
    const plan = generateFallbackWeeklyPlan({
      weekStart: '2024-01-01',
      preferences: {},
      pantry: [],
      mode: 'normal',
    });
    const sunday = plan.days[6];
    const alm = sunday.meals.almuerzo.recipe?.name?.toLowerCase() || '';
    const cena = sunday.meals.cena.recipe?.name?.toLowerCase() || '';
    expect(alm.includes('asado') || cena.includes('asado')).toBe(true);
  });

  it('includes ñoquis if 29 in week', () => {
    const plan = generateFallbackWeeklyPlan({
      weekStart: '2024-01-29',
      preferences: {},
      pantry: [],
      mode: 'normal',
    });
    const hasNoquis = plan.days.some(
      (d) => dayjs(d.date).date() === 29 && (d.meals.almuerzo.recipe?.name.toLowerCase().includes('ñoqui') || d.meals.cena.recipe?.name.toLowerCase().includes('ñoqui')),
    );
    expect(hasNoquis).toBe(true);
  });
});
```

### 10.4 Unit: Shopping list — `/tests/unit/shoppingList.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { aggregateShoppingList } from '@/lib/utils/shoppingList';
import { ArgentineWeeklyPlan } from '@/types/meal';

describe('shoppingList', () => {
  it('groups items by category', () => {
    const plan: ArgentineWeeklyPlan = {
      weekStart: '2024-01-01',
      weekEnd: '2024-01-07',
      days: [
        {
          date: '2024-01-01',
          label: 'Lunes',
          meals: {
            desayuno: {
              recipe: {
                id: 'r1',
                name: 'Mate',
                ingredients: [{ name: 'Yerba mate', quantity: 100, unit: 'g' }],
                instructions: [],
                prepTime: 1,
                cookTime: 0,
                servings: 2,
                nutrition: { calories: 10, protein: 0, carbs: 0, fat: 0 },
              },
            },
            almuerzo: {
              recipe: {
                id: 'r2',
                name: 'Milanesas',
                ingredients: [{ name: 'Nalga', quantity: 500, unit: 'g' }],
                instructions: [],
                prepTime: 10,
                cookTime: 20,
                servings: 2,
                nutrition: { calories: 500, protein: 40, carbs: 20, fat: 20 },
              },
            },
            merienda: { recipe: undefined },
            cena: { recipe: undefined },
          },
        },
        ...Array.from({ length: 6 }).map((_, i) => ({
          date: `2024-01-0${i + 2}`,
          label: 'X',
          meals: { desayuno: {}, almuerzo: {}, merienda: {}, cena: {} },
        })),
      ],
      metadata: { season: 'verano', region: 'Argentina', mode: 'normal', createdAt: new Date().toISOString() },
    };

    const list = aggregateShoppingList(plan, []);
    expect(list.groups['Almacén'].length).toBeGreaterThan(0);
    expect(list.groups['Carnicería'].length).toBeGreaterThan(0);
  });
});
```

### 10.5 Integration: useMealPlanning (mock IA) — `/tests/integration/useMealPlanning.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import * as gemini from '@/lib/services/geminiClient';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';

vi.mock('@/lib/services/supabaseClient', () => ({
  supabaseClient: () => ({
    from: () => ({
      select: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      upsert: async () => ({ error: null }),
    }),
    channel: () => ({
      on: () => ({ subscribe: (cb: any) => cb('SUBSCRIBED') }),
    }),
    removeChannel: () => {},
  }),
}));

beforeEach(() => {
  vi.spyOn(gemini, 'callGeminiWeeklyPlan').mockResolvedValue({
    weekStart: '2024-01-01',
    weekEnd: '2024-01-07',
    days: Array.from({ length: 7 }).map((_, idx) => ({
      date: `2024-01-0${idx + 1}`,
      label: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][idx],
      meals: {
        desayuno: {
          recipe: {
            id: `b-${idx}`,
            name: 'Mate con tostadas',
            ingredients: [],
            instructions: [],
            prepTime: 1,
            cookTime: 0,
            servings: 2,
            nutrition: { calories: 200, protein: 5, carbs: 30, fat: 4 },
          },
        },
        almuerzo: {
          recipe: {
            id: `l-${idx}`,
            name: idx === 6 ? 'Asado clásico' : 'Milanesas con puré',
            ingredients: [],
            instructions: [],
            prepTime: 10,
            cookTime: 20,
            servings: 2,
            nutrition: { calories: 600, protein: 30, carbs: 40, fat: 20 },
          },
        },
        merienda: {
          recipe: {
            id: `s-${idx}`,
            name: 'Mate',
            ingredients: [],
            instructions: [],
            prepTime: 1,
            cookTime: 0,
            servings: 2,
            nutrition: { calories: 50, protein: 1, carbs: 10, fat: 1 },
          },
        },
        cena: {
          recipe: {
            id: `d-${idx}`,
            name: 'Tarta de verdura',
            ingredients: [],
            instructions: [],
            prepTime: 15,
            cookTime: 30,
            servings: 2,
            nutrition: { calories: 400, protein: 20, carbs: 30, fat: 15 },
          },
        },
      },
    })),
    metadata: { season: 'verano', region: 'Argentina', mode: 'normal', createdAt: new Date().toISOString() },
  });
});

describe('useMealPlanning', () => {
  it('generates a weekly plan', async () => {
    const { result } = renderHook(() => useMealPlanning({ initialWeekStart: '2024-01-01' }));
    await act(async () => {
      await result.current.generatePlan(true);
    });
    expect(result.current.weeklyPlan?.days).toHaveLength(7);
  });

  it('saves a plan', async () => {
    const { result } = renderHook(() => useMealPlanning({ initialWeekStart: '2024-01-01' }));
    await act(async () => {
      await result.current.generatePlan(true);
      const ok = await result.current.savePlan({ isPublic: false });
      expect(ok).toBe(true);
    });
  });
});
```

### 10.6 E2E Playwright — `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### 10.7 E2E spec — `/tests/e2e/planificador.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('planificador genera y muestra grilla', async ({ page }) => {
  await page.goto('/planificador');
  await expect(page.getByText('Planificador Semanal')).toBeVisible();
  await page.getByRole('button', { name: 'Generar con IA' }).click();
  // Fallback o IA, igual debería mostrar la grilla con slots
  await page.waitForTimeout(1500);
  await expect(page.getByText('Desayuno')).toBeVisible();
  await expect(page.getByText('Almuerzo')).toBeVisible();
});
```

---

## 11) SQL — Tablas y Fixes

Ejecutar en Supabase:

```sql
-- meal_plans with is_public and unique constraint
create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  week_start date not null,
  week_end date not null,
  plan_data jsonb not null,
  is_public boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists meal_plans_user_week_idx
  on meal_plans (user_id, week_start);

create unique index if not exists meal_plans_user_week_unique
  on meal_plans (user_id, week_start);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists meal_plans_set_updated_at on meal_plans;
create trigger meal_plans_set_updated_at
before update on meal_plans
for each row
execute procedure set_updated_at();

-- user_preferences
create table if not exists user_preferences (
  user_id uuid primary key,
  dietary_restrictions text[] default array[]::text[],
  favorite_dishes text[] default array[]::text[],
  disliked_ingredients text[] default array[]::text[],
  household_size integer default 2,
  budget_weekly numeric default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

---

## 12) NextAuth (referencia mínima)

Asegurate de tener NextAuth configurado y que `session.user.id` esté presente. En desarrollo, el hook utiliza un userId anónimo si no hay sesión.

---

## 13) Variables de entorno

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
NEXT_PUBLIC_GEMINI_API_KEY=...
```

---

## 14) Accesibilidad y performance

- Controles con `aria-label`, `aria-modal`, `role="dialog"`, foco gestionado mediante click de fondo.  
- Colores con suficiente contraste sobre fondos blur.  
- Mobile-first: grid horizontal scrolleable, botones grandes.  
- Performance: generación con retry y fallback, memoización de funciones, Zustand persist, suscripción realtime solo para la semana activa.

---

## 15) Deploy

- Vercel: agregar variables de entorno.  
- Supabase: crear tablas con SQL provisto.  
- Correr tests:  
  - `pnpm test` (Vitest)  
  - `pnpm exec playwright test` (E2E)  
- Build: `pnpm build`  
- Run: `pnpm start`

---

Si querés, puedo adaptarte aún más los prompts para regiones específicas (Cuyo, NOA, Patagonia) o incorporar disponibilidad estacional de ingredientes por provincia. ¿Te pinta que agreguemos eso en la próxima iteración? 😄🇦🇷🧉🔥