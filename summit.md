¡Vamos con todo, che! Acá tenés un sistema de planificación semanal argentino, listo para copiar/pegar en tu proyecto KeCarajoComer. Incluye: hook principal useMealPlanning con sincronización Supabase, integración con Gemini (con fallback offline), estado optimista con Zustand, UI con glassmorphism, suscripciones realtime, lista de compras por comercios argentinos, regeneración individual de comidas, prompts inteligentes y tests.

Las rutas y nombres de archivo respetan tu estructura. Si algo no existiera aún en tu repo (por ejemplo /lib/supabase), simplemente creá las carpetas y pegá los archivos.

1) Hook principal

Ruta: /hooks/meal-planning/useMealPlanning.ts

```ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createId } from '@paralleldrive/cuid2';
import { useMealPlanStore } from '@/store/slices/mealPlanSlice';
import { getWeekRange, isoDate, weekdayFromISO, getSeason, clampPlanToRules, summarizeNutrition } from '@/features/meal-planning/utils';
import { buildShoppingList } from '@/features/meal-planning/shopping';
import type { MealPlan, MealSlotType, PlannedMeal, Recipe, UserPreferences } from '@/features/meal-planning/types';
import { supabaseClient } from '@/lib/supabase/client';
import { fetchWithRetry } from '@/lib/utils/retry';
import { offlineGenerateWeeklyPlan, offlineGenerateSingleMeal } from '@/features/meal-planning/offlineGenerators';
import { getUserId } from '@/lib/utils/user';
import { GEMINI_WEEKLY_ENDPOINT, GEMINI_MEAL_ENDPOINT } from '@/lib/services/gemini/client';

type RealtimeStatus = 'idle' | 'subscribed' | 'error';

export const useMealPlanning = () => {
  const {
    plan,
    setPlan,
    loading,
    setLoading,
    error,
    setError,
    preferences,
    setPreferences,
    usedRecipeIds,
    addUsedRecipeId,
    clearUsedRecipeIds,
    mode
  } = useMealPlanStore();

  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('idle');
  const supabaseRef = useRef<ReturnType<typeof supabaseClient> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof supabaseClient>['channel']> | null>(null);
  const userId = useMemo(() => getUserId(), []);
  const client = useMemo(() => {
    if (!supabaseRef.current) supabaseRef.current = supabaseClient();
    return supabaseRef.current;
  }, []);

  const currentWeek = useMemo(() => {
    const base = plan?.weekStart ? new Date(plan.weekStart) : new Date();
    return getWeekRange(base);
  }, [plan?.weekStart]);

  const generateWeekPlan = useCallback(async (weekStartDate?: Date) => {
    setLoading(true);
    setError(null);
    try {
      const week = getWeekRange(weekStartDate ?? new Date());
      const body = {
        userId,
        weekStart: week.start,
        preferences,
        excludeRecipeIds: Array.from(usedRecipeIds),
        mode,
      };

      const res = await fetchWithRetry(GEMINI_WEEKLY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Gemini weekly API ${res.status}`);
      }
      const data = await res.json() as { plan: MealPlan };
      const validated = clampPlanToRules(data.plan);

      setPlan(validated);
      clearUsedRecipeIds();
      validated.days.forEach(d => {
        (['breakfast','lunch','snack','dinner'] as MealSlotType[]).forEach(slot => addUsedRecipeId(d.meals[slot].recipe.id));
      });

      // Persist optimistically locally first
      await savePlan(validated, false);

      return validated;
    } catch (e) {
      // Fallback offline generation
      const offline = offlineGenerateWeeklyPlan({
        userId,
        weekStart: isoDate(getWeekRange(weekStartDate ?? new Date()).start),
        preferences,
        mode
      });
      const validated = clampPlanToRules(offline);
      setPlan(validated);
      clearUsedRecipeIds();
      validated.days.forEach(d => {
        (['breakfast','lunch','snack','dinner'] as MealSlotType[]).forEach(slot => addUsedRecipeId(d.meals[slot].recipe.id));
      });
      await savePlan(validated, false);
      setError(e instanceof Error ? e.message : 'Error al generar el plan, se usó el modo offline.');
      return validated;
    } finally {
      setLoading(false);
    }
  }, [userId, preferences, mode, usedRecipeIds, setPlan, setLoading, setError, clearUsedRecipeIds, addUsedRecipeId]);

  const regenerateMeal = useCallback(async (isoDay: string, slot: MealSlotType) => {
    if (!plan) return;
    setLoading(true);
    setError(null);
    try {
      const day = plan.days.find(d => d.date === isoDay);
      if (!day) throw new Error('Día no encontrado');
      const body = {
        userId,
        date: isoDay,
        slot,
        context: {
          plan,
          preferences,
          season: getSeason(new Date(isoDay)),
          excludeRecipeIds: Array.from(usedRecipeIds),
          mode
        }
      };

      const res = await fetchWithRetry(GEMINI_MEAL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let newMeal: PlannedMeal;
      if (res.ok) {
        const data = await res.json() as { meal: PlannedMeal };
        newMeal = data.meal;
      } else {
        newMeal = offlineGenerateSingleMeal(body);
      }

      const updated: MealPlan = {
        ...plan,
        updatedAt: new Date().toISOString(),
        days: plan.days.map(d => {
          if (d.date !== isoDay) return d;
          return {
            ...d,
            meals: {
              ...d.meals,
              [slot]: { ...newMeal, aiGenerated: res.ok }
            }
          }
        })
      };

      // Prevent repetition
      if (usedRecipeIds.has(newMeal.recipe.id)) {
        const fallback = offlineGenerateSingleMeal(body, Array.from(usedRecipeIds));
        updated.days = updated.days.map(d => {
          if (d.date !== isoDay) return d;
          return {
            ...d,
            meals: { ...d.meals, [slot]: { ...fallback, aiGenerated: false } }
          }
        });
        newMeal = updated.days.find(d => d.date === isoDay)!.meals[slot];
      }

      setPlan(updated);
      addUsedRecipeId(newMeal.recipe.id);
      await savePlan(updated, false);
      return newMeal;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo regenerar la comida');
      return null;
    } finally {
      setLoading(false);
    }
  }, [plan, userId, preferences, usedRecipeIds, setPlan, setLoading, setError, addUsedRecipeId, mode]);

  const savePlan = useCallback(async (p?: MealPlan, silent = true) => {
    const planToSave = p ?? plan;
    if (!planToSave) return;
    try {
      if (!silent) setLoading(true);
      const { data, error: sbError } = await client
        .from('meal_plans')
        .upsert({
          id: planToSave.id ?? createId(),
          user_id: planToSave.userId,
          week_start: planToSave.weekStart,
          week_end: planToSave.weekEnd,
          plan_data: planToSave,
          is_public: false,
          updated_at: new Date().toISOString(),
          created_at: planToSave.createdAt ?? new Date().toISOString()
        })
        .select()
        .single();

      if (sbError) throw sbError;
      if (data) {
        setPlan({ ...planToSave, id: data.id });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el plan');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [client, plan, setPlan, setLoading, setError]);

  const loadPlanForWeek = useCallback(async (weekStartDate?: Date) => {
    const week = getWeekRange(weekStartDate ?? new Date());
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await client
        .from('meal_plans')
        .select('id, user_id, week_start, week_end, plan_data, created_at, updated_at')
        .eq('user_id', userId)
        .eq('week_start', isoDate(week.start))
        .maybeSingle();

      if (sbError) throw sbError;
      if (data?.plan_data) {
        const validated = clampPlanToRules(data.plan_data);
        setPlan({ ...validated, id: data.id });
        clearUsedRecipeIds();
        validated.days.forEach(d => (['breakfast','lunch','snack','dinner'] as MealSlotType[]).forEach(slot => addUsedRecipeId(d.meals[slot].recipe.id)));
        return validated;
      } else {
        // If no plan found, generate one
        return await generateWeekPlan(week.start);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el plan');
      // As last resort, offline
      const offline = offlineGenerateWeeklyPlan({
        userId,
        weekStart: isoDate(week.start),
        preferences,
        mode
      });
      const validated = clampPlanToRules(offline);
      setPlan(validated);
      return validated;
    } finally {
      setLoading(false);
    }
  }, [client, userId, preferences, mode, setPlan, setLoading, setError, clearUsedRecipeIds, addUsedRecipeId, generateWeekPlan]);

  const subscribeRealtime = useCallback(() => {
    try {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      const channel = client.channel(`meal_plans_user_${userId}`).on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_plans', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new && payload.eventType !== 'DELETE') {
            const planData = (payload.new as any).plan_data as MealPlan;
            const validated = clampPlanToRules(planData);
            setPlan({ ...validated, id: (payload.new as any).id });
          }
        }
      ).subscribe(status => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('subscribed');
      });
      channelRef.current = channel;
    } catch {
      setRealtimeStatus('error');
    }
  }, [client, userId, setPlan]);

  useEffect(() => {
    subscribeRealtime();
    return () => {
      if (channelRef.current) channelRef.current.unsubscribe();
    };
  }, [subscribeRealtime]);

  const nutrition = useMemo(() => summarizeNutrition(plan), [plan]);
  const shoppingList = useMemo(() => buildShoppingList(plan), [plan]);

  const setUserPreferences = useCallback(async (prefs: Partial<UserPreferences>) => {
    const merged = { ...preferences, ...prefs };
    setPreferences(merged);
    try {
      await client.from('user_preferences').upsert({
        user_id: userId,
        dietary_restrictions: merged.dietary_restrictions ?? [],
        favorite_dishes: merged.favorite_dishes ?? [],
        disliked_ingredients: merged.disliked_ingredients ?? [],
        household_size: merged.household_size ?? 1,
        budget_weekly: merged.budget_weekly ?? 0,
      });
    } catch {
      // Non fatal
    }
  }, [preferences, setPreferences, client, userId]);

  return {
    plan,
    loading,
    error,
    currentWeek,
    shoppingList,
    nutrition,
    mode,
    actions: {
      generateWeekPlan,
      regenerateMeal,
      savePlan,
      loadPlanForWeek,
      setUserPreferences,
    },
    realtime: {
      status: realtimeStatus
    }
  };
};
```

2) Zustand store

Ruta: /store/slices/mealPlanSlice.ts

```ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MealPlan, UserPreferences } from '@/features/meal-planning/types';

type Mode = 'normal' | 'economico' | 'fiesta' | 'dieta';

type State = {
  plan: MealPlan | null;
  loading: boolean;
  error: string | null;
  preferences: UserPreferences;
  mode: Mode;
  usedRecipeIds: Set<string>;
};

type Actions = {
  setPlan: (plan: MealPlan | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setPreferences: (p: UserPreferences) => void;
  setMode: (m: Mode) => void;
  addUsedRecipeId: (id: string) => void;
  clearUsedRecipeIds: () => void;
};

export const useMealPlanStore = create<State & Actions>()(persist((set, get) => ({
  plan: null,
  loading: false,
  error: null,
  preferences: {
    dietary_restrictions: [],
    favorite_dishes: [],
    disliked_ingredients: [],
    household_size: 2,
    budget_weekly: 0
  },
  mode: 'normal',
  usedRecipeIds: new Set<string>(),

  setPlan: (plan) => set({ plan }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
  setPreferences: (p) => set({ preferences: p }),
  setMode: (m) => set({ mode: m }),
  addUsedRecipeId: (id) => {
    const s = new Set(get().usedRecipeIds);
    s.add(id);
    set({ usedRecipeIds: s });
  },
  clearUsedRecipeIds: () => set({ usedRecipeIds: new Set() })
}), {
  name: 'kcc-meal-plan-v1',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    plan: state.plan,
    preferences: state.preferences,
    mode: state.mode
  })
}));
```

3) Tipos y utilidades

Ruta: /features/meal-planning/types.ts

```ts
export type Aisle = 'verduleria' | 'carniceria' | 'almacen' | 'panaderia' | 'fiambreria' | 'pescaderia' | 'otros';
export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'u' | 'cda' | 'cdta' | 'tz';

export interface Ingredient {
  id?: string;
  name: string;
  amount?: number;
  unit?: Unit;
  aisle?: Aisle;
  notes?: string;
  substitution?: string;
  regionAvailability?: ('NOA' | 'NEA' | 'CABA' | 'PBA' | 'Cuyo' | 'Patagonia')[];
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
  tags?: string[];
}

export type MealSlotType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface PlannedMeal {
  slot: MealSlotType;
  time: string; // HH:mm
  recipe: Recipe;
  aiGenerated?: boolean;
}

export interface MealPlanDay {
  date: string; // ISO YYYY-MM-DD
  weekday: number; // 1-7 Mon-Sun
  meals: Record<MealSlotType, PlannedMeal>;
  notes?: string;
}

export interface MealPlan {
  id?: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  days: MealPlanDay[];
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: {
    season: 'verano' | 'otoño' | 'invierno' | 'primavera';
    region?: string;
    mode?: 'normal' | 'economico' | 'fiesta' | 'dieta';
    budgetWeekly?: number;
  };
}

export interface UserPreferences {
  dietary_restrictions: string[];
  favorite_dishes: string[];
  disliked_ingredients: string[];
  household_size: number;
  budget_weekly: number;
}
```

Ruta: /features/meal-planning/utils.ts

```ts
import type { MealPlan, MealPlanDay, MealSlotType, PlannedMeal, Recipe } from './types';
import { recipesLibrary } from './recipesLibrary';

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const getWeekRange = (base: Date) => {
  const b = new Date(base);
  const day = b.getDay() || 7; // 1-7 Mon-Sun
  const diffToMonday = day - 1;
  const start = new Date(b);
  start.setDate(b.getDate() - diffToMonday);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end, weekLabel: `Semana del ${start.getDate()}/${start.getMonth()+1}` };
};

export const weekdayFromISO = (d: Date) => {
  const js = d.getDay() || 7;
  return js;
};

export const getSeason = (d: Date): 'verano' | 'otoño' | 'invierno' | 'primavera' => {
  const m = d.getMonth(); // 0-11
  if (m === 11 || m <= 1) return 'verano'; // dic-ene-feb
  if (m >= 2 && m <= 4) return 'otoño';   // mar-abr-may
  if (m >= 5 && m <= 7) return 'invierno';// jun-jul-ago
  return 'primavera';                      // sep-oct-nov
};

export const defaultTimes: Record<MealSlotType, string> = {
  breakfast: '08:00',
  lunch: '13:00',
  snack: '17:30',
  dinner: '21:30'
};

export const clampPlanToRules = (plan: MealPlan): MealPlan => {
  const updated = { ...plan };

  // Ensure asado Sunday dinner and ñoquis on 29
  updated.days = updated.days.map((day) => {
    const date = new Date(day.date);
    const dayOfMonth = date.getDate();
    const isSunday = (date.getDay() || 7) === 7;

    const meals = { ...day.meals };

    // Ñoquis los 29
    if (dayOfMonth === 29) {
      const gnocchi = recipesLibrary.find(r => r.tags?.includes('ñoquis')) || recipesLibrary.find(r => /ñoqui/i.test(r.name));
      if (gnocchi) {
        meals.lunch = {
          slot: 'lunch',
          time: defaultTimes.lunch,
          recipe: gnocchi
        };
      }
    }

    // Asado los domingos (cena)
    if (isSunday) {
      const asado = recipesLibrary.find(r => r.tags?.includes('asado')) || recipesLibrary.find(r => /asado/i.test(r.name));
      if (asado) {
        meals.dinner = {
          slot: 'dinner',
          time: defaultTimes.dinner,
          recipe: asado
        };
      }
    }

    // Ensure mate in breakfast/snack at least as beverage
    const mate = recipesLibrary.find(r => r.tags?.includes('mate'));
    if (mate) {
      if (!/mate/i.test(meals.breakfast.recipe.name)) {
        meals.breakfast = meals.breakfast ?? {
          slot: 'breakfast',
          time: defaultTimes.breakfast,
          recipe: mate
        };
      }
      if (!/mate/i.test(meals.snack.recipe.name)) {
        meals.snack = meals.snack ?? {
          slot: 'snack',
          time: defaultTimes.snack,
          recipe: mate
        };
      }
    }

    return { ...day, meals };
  });

  updated.updatedAt = new Date().toISOString();
  return updated;
};

export const summarizeNutrition = (plan: MealPlan | null) => {
  if (!plan) return { daily: [], weekly: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
  const daily = plan.days.map(d => {
    const total = (['breakfast','lunch','snack','dinner'] as MealSlotType[]).reduce((acc, slot) => {
      const n = d.meals[slot].recipe.nutrition;
      return {
        calories: acc.calories + (n.calories || 0),
        protein: acc.protein + (n.protein || 0),
        carbs: acc.carbs + (n.carbs || 0),
        fat: acc.fat + (n.fat || 0)
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return { date: d.date, ...total };
  });
  const weekly = daily.reduce((acc, n) => ({
    calories: acc.calories + n.calories,
    protein: acc.protein + n.protein,
    carbs: acc.carbs + n.carbs,
    fat: acc.fat + n.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return { daily, weekly };
};
```

4) Librería de recetas y generadores offline

Ruta: /features/meal-planning/recipesLibrary.ts

```ts
import type { Recipe } from './types';

export const recipesLibrary: Recipe[] = [
  {
    id: 'mate-clasico',
    name: 'Mate con bizcochitos',
    ingredients: [
      { name: 'Yerba mate', amount: 50, unit: 'g', aisle: 'almacen' },
      { name: 'Agua', amount: 500, unit: 'ml', aisle: 'almacen' },
      { name: 'Bizcochitos', amount: 200, unit: 'g', aisle: 'panaderia' }
    ],
    instructions: ['Cebar mate a 75°C', 'Acompañar con bizcochitos'],
    prepTime: 5,
    cookTime: 0,
    servings: 2,
    nutrition: { calories: 300, protein: 6, carbs: 50, fat: 8 },
    culturalNotes: 'Infaltable en desayunos y meriendas',
    tags: ['mate', 'desayuno', 'merienda']
  },
  {
    id: 'cafe-leche-tostadas',
    name: 'Café con leche y tostadas',
    ingredients: [
      { name: 'Café', amount: 10, unit: 'g', aisle: 'almacen' },
      { name: 'Leche', amount: 250, unit: 'ml', aisle: 'almacen' },
      { name: 'Pan lactal', amount: 4, unit: 'u', aisle: 'panaderia' },
      { name: 'Manteca', amount: 20, unit: 'g', aisle: 'fiambreria' },
      { name: 'Dulce de leche', amount: 30, unit: 'g', aisle: 'almacen' }
    ],
    instructions: ['Preparar el café', 'Calentar leche', 'Tostar pan y untar'],
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    nutrition: { calories: 520, protein: 14, carbs: 70, fat: 18 },
    tags: ['desayuno']
  },
  {
    id: 'milanesa-pure',
    name: 'Milanesa con puré',
    ingredients: [
      { name: 'Carne (nalga)', amount: 500, unit: 'g', aisle: 'carniceria' },
      { name: 'Pan rallado', amount: 150, unit: 'g', aisle: 'almacen' },
      { name: 'Huevo', amount: 2, unit: 'u', aisle: 'almacen' },
      { name: 'Papa', amount: 800, unit: 'g', aisle: 'verduleria' },
      { name: 'Leche', amount: 50, unit: 'ml', aisle: 'almacen' }
    ],
    instructions: ['Empanar la carne', 'Freír/hornear', 'Hacer puré de papas'],
    prepTime: 20,
    cookTime: 25,
    servings: 4,
    nutrition: { calories: 780, protein: 45, carbs: 60, fat: 35 },
    culturalNotes: 'Clásico argentino',
    tags: ['almuerzo', 'cena', 'milanesa']
  },
  {
    id: 'empanadas-saltenas',
    name: 'Empanadas salteñas',
    ingredients: [
      { name: 'Carne (roast beef)', amount: 500, unit: 'g', aisle: 'carniceria' },
      { name: 'Cebolla', amount: 2, unit: 'u', aisle: 'verduleria' },
      { name: 'Pimiento', amount: 1, unit: 'u', aisle: 'verduleria' },
      { name: 'Papa', amount: 300, unit: 'g', aisle: 'verduleria' },
      { name: 'Tapas de empanadas', amount: 12, unit: 'u', aisle: 'almacen' }
    ],
    instructions: ['Saltear el relleno', 'Armar y hornear/freír'],
    prepTime: 25,
    cookTime: 20,
    servings: 4,
    nutrition: { calories: 650, protein: 30, carbs: 65, fat: 28 },
    tags: ['empanadas', 'almuerzo', 'cena']
  },
  {
    id: 'gnocchi-fileto',
    name: 'Ñoquis con salsa fileto',
    ingredients: [
      { name: 'Papa', amount: 800, unit: 'g', aisle: 'verduleria' },
      { name: 'Harina', amount: 300, unit: 'g', aisle: 'almacen' },
      { name: 'Huevo', amount: 1, unit: 'u', aisle: 'almacen' },
      { name: 'Tomate triturado', amount: 400, unit: 'g', aisle: 'almacen' }
    ],
    instructions: ['Hacer ñoquis', 'Cocinar salsa', 'Servir'],
    prepTime: 30,
    cookTime: 20,
    servings: 4,
    nutrition: { calories: 700, protein: 18, carbs: 120, fat: 10 },
    culturalNotes: 'Ñoquis del 29',
    tags: ['ñoquis', 'almuerzo', 'cena', 'pasta']
  },
  {
    id: 'asado-mixto',
    name: 'Asado mixto',
    ingredients: [
      { name: 'Tira de asado', amount: 800, unit: 'g', aisle: 'carniceria' },
      { name: 'Chorizo', amount: 4, unit: 'u', aisle: 'carniceria' },
      { name: 'Provoleta', amount: 300, unit: 'g', aisle: 'fiambreria' },
      { name: 'Pan', amount: 6, unit: 'u', aisle: 'panaderia' }
    ],
    instructions: ['Prender fuego', 'Asar cortes', 'Servir con pan y ensalada criolla'],
    prepTime: 20,
    cookTime: 60,
    servings: 4,
    nutrition: { calories: 1200, protein: 80, carbs: 40, fat: 80 },
    culturalNotes: 'Domingo de asado',
    tags: ['asado', 'domingo', 'cena', 'fiesta']
  },
  {
    id: 'guiso-lentejas',
    name: 'Guiso de lentejas',
    ingredients: [
      { name: 'Lentejas', amount: 400, unit: 'g', aisle: 'almacen' },
      { name: 'Chorizo', amount: 2, unit: 'u', aisle: 'carniceria' },
      { name: 'Zanahoria', amount: 2, unit: 'u', aisle: 'verduleria' },
      { name: 'Cebolla', amount: 1, unit: 'u', aisle: 'verduleria' }
    ],
    instructions: ['Saltear vegetales', 'Agregar lentejas y chorizo', 'Cocinar'],
    prepTime: 20,
    cookTime: 40,
    servings: 4,
    nutrition: { calories: 680, protein: 35, carbs: 80, fat: 20 },
    tags: ['guiso', 'invierno', 'olla']
  },
  {
    id: 'tarta-verduras',
    name: 'Tarta de verduras',
    ingredients: [
      { name: 'Tapas de tarta', amount: 2, unit: 'u', aisle: 'almacen' },
      { name: 'Acelga', amount: 300, unit: 'g', aisle: 'verduleria' },
      { name: 'Queso', amount: 200, unit: 'g', aisle: 'fiambreria' },
      { name: 'Huevo', amount: 3, unit: 'u', aisle: 'almacen' }
    ],
    instructions: ['Saltear verduras', 'Mezclar con huevo', 'Hornear con tapas'],
    prepTime: 20,
    cookTime: 25,
    servings: 4,
    nutrition: { calories: 550, protein: 25, carbs: 45, fat: 28 },
    tags: ['tarta', 'liviano', 'vegetariano']
  },
  {
    id: 'pizza-piedra',
    name: 'Pizza a la piedra',
    ingredients: [
      { name: 'Harina', amount: 400, unit: 'g', aisle: 'almacen' },
      { name: 'Levadura', amount: 10, unit: 'g', aisle: 'almacen' },
      { name: 'Mozzarella', amount: 300, unit: 'g', aisle: 'fiambreria' },
      { name: 'Salsa de tomate', amount: 200, unit: 'g', aisle: 'almacen' }
    ],
    instructions: ['Hacer masa', 'Agregar salsa y queso', 'Hornear'],
    prepTime: 30,
    cookTime: 15,
    servings: 4,
    nutrition: { calories: 800, protein: 35, carbs: 110, fat: 25 },
    tags: ['pizza', 'viernes']
  },
  {
    id: 'tortilla-papas',
    name: 'Tortilla de papas',
    ingredients: [
      { name: 'Papa', amount: 600, unit: 'g', aisle: 'verduleria' },
      { name: 'Huevo', amount: 5, unit: 'u', aisle: 'almacen' },
      { name: 'Cebolla', amount: 1, unit: 'u', aisle: 'verduleria' }
    ],
    instructions: ['Freír papas', 'Mezclar con huevo', 'Cocinar'],
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    nutrition: { calories: 650, protein: 22, carbs: 60, fat: 30 },
    tags: ['tortilla', 'rapido']
  },
  {
    id: 'ensalada-criolla',
    name: 'Ensalada criolla',
    ingredients: [
      { name: 'Tomate', amount: 3, unit: 'u', aisle: 'verduleria' },
      { name: 'Cebolla', amount: 1, unit: 'u', aisle: 'verduleria' },
      { name: 'Pimiento', amount: 1, unit: 'u', aisle: 'verduleria' }
    ],
    instructions: ['Picar y aliñar'],
    prepTime: 10,
    cookTime: 0,
    servings: 4,
    nutrition: { calories: 120, protein: 4, carbs: 20, fat: 2 },
    tags: ['ensalada', 'verano']
  }
];
```

Ruta: /features/meal-planning/offlineGenerators.ts

```ts
import { createId } from '@paralleldrive/cuid2';
import type { MealPlan, MealPlanDay, MealSlotType, PlannedMeal, UserPreferences } from './types';
import { recipesLibrary } from './recipesLibrary';
import { defaultTimes, getSeason, getWeekRange, isoDate, weekdayFromISO } from './utils';

const pick = <T>(arr: T[], excludeIds: string[] = []): T => {
  const filtered = arr.filter((r: any) => !excludeIds.includes(r.id));
  return filtered[Math.floor(Math.random() * Math.max(1, filtered.length))] ?? arr[0];
};

const slotFilter = (slot: MealSlotType, season: string, mode: string) => (r: any) => {
  if (slot === 'breakfast') return r.tags?.includes('desayuno') || r.tags?.includes('mate');
  if (slot === 'snack') return r.tags?.includes('merienda') || r.tags?.includes('mate');
  if (slot === 'lunch' || slot === 'dinner') return true;
  return true;
};

export const offlineGenerateWeeklyPlan = (params: {
  userId: string;
  weekStart: string;
  preferences: UserPreferences;
  mode: 'normal' | 'economico' | 'fiesta' | 'dieta';
}): MealPlan => {
  const start = new Date(params.weekStart);
  const end = getWeekRange(start).end;
  const season = getSeason(start);
  const days: MealPlanDay[] = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateISO = isoDate(d);
    const weekday = weekdayFromISO(d);
    const daySeason = season;
    const slots: MealSlotType[] = ['breakfast','lunch','snack','dinner'];
    const meals = slots.reduce((acc, slot) => {
      const pool = recipesLibrary.filter(slotFilter(slot, daySeason, params.mode));
      const recipe = pick(pool);
      acc[slot] = {
        slot,
        time: defaultTimes[slot],
        recipe
      } as PlannedMeal;
      return acc;
    }, {} as Record<MealSlotType, PlannedMeal>);

    return {
      date: dateISO,
      weekday,
      meals
    };
  });

  const plan: MealPlan = {
    id: createId(),
    userId: params.userId,
    weekStart: isoDate(start),
    weekEnd: isoDate(end),
    days,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      season,
      mode: params.mode,
      budgetWeekly: params.preferences.budget_weekly ?? 0
    }
  };

  return plan;
};

export const offlineGenerateSingleMeal = (
  params: {
    userId?: string;
    date: string;
    slot: MealSlotType;
    context: {
      plan: MealPlan;
      preferences: UserPreferences;
      season: string;
      excludeRecipeIds?: string[];
      mode?: 'normal'|'economico'|'fiesta'|'dieta';
    };
  },
  extraExclude: string[] = []
): PlannedMeal => {
  const pool = recipesLibrary.filter(slotFilter(params.slot, params.context.season, params.context.mode ?? 'normal'));
  const recipe = pick(pool, [...(params.context.excludeRecipeIds ?? []), ...extraExclude]);
  return {
    slot: params.slot,
    time: defaultTimes[params.slot],
    recipe,
    aiGenerated: false
  };
};
```

5) Lista de compras

Ruta: /features/meal-planning/shopping.ts

```ts
import type { Aisle, Ingredient, MealPlan, MealSlotType } from './types';

export interface ShoppingListItem {
  aisle: Aisle;
  name: string;
  amount?: number;
  unit?: Ingredient['unit'];
  aggregatedFrom: string[];
}

export type ShoppingList = Record<Aisle, ShoppingListItem[]>;

export const buildShoppingList = (plan: MealPlan | null): ShoppingList => {
  const result: ShoppingList = {
    verduleria: [],
    carniceria: [],
    almacen: [],
    panaderia: [],
    fiambreria: [],
    pescaderia: [],
    otros: []
  };
  if (!plan) return result;

  const map = new Map<string, ShoppingListItem>();

  plan.days.forEach(d => {
    (['breakfast','lunch','snack','dinner'] as MealSlotType[]).forEach(slot => {
      d.meals[slot].recipe.ingredients.forEach(ing => {
        const key = `${ing.aisle ?? 'otros'}|${ing.name}|${ing.unit ?? ''}`;
        const listItem = map.get(key) ?? {
          aisle: (ing.aisle ?? 'otros') as Aisle,
          name: ing.name,
          unit: ing.unit,
          amount: 0,
          aggregatedFrom: []
        };
        listItem.amount = (listItem.amount ?? 0) + (ing.amount ?? 0);
        listItem.aggregatedFrom.push(d.meals[slot].recipe.id);
        map.set(key, listItem);
      });
    });
  });

  Array.from(map.values()).forEach(item => {
    result[item.aisle].push(item);
  });

  Object.keys(result).forEach((k) => {
    // sort for nicer UI
    result[k as Aisle] = result[k as Aisle].sort((a, b) => a.name.localeCompare(b.name));
  });

  return result;
};
```

6) Supabase client

Ruta: /lib/supabase/client.ts

```ts
'use client';

import { createClient } from '@supabase/supabase-js';

export const supabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    realtime: { params: { eventsPerSecond: 5 } }
  });
};
```

7) Gemini service + API routes

Ruta: /lib/services/gemini/client.ts

```ts
export const GEMINI_WEEKLY_ENDPOINT = '/api/gemini/weekly';
export const GEMINI_MEAL_ENDPOINT = '/api/gemini/meal';
```

Ruta: /app/api/gemini/weekly/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWeeklyPlanPrompt, weeklyPlanZod, coerceWeeklyPlan } from '@/lib/prompts/argentineMealPrompts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, weekStart, preferences, excludeRecipeIds, mode } = body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  try {
    const prompt = getWeeklyPlanPrompt({
      userId,
      weekStart,
      preferences,
      excludeRecipeIds,
      mode
    });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    });

    const text = result.response.text();
    const json = JSON.parse(text);
    const parsed = weeklyPlanZod.safeParse(json);
    const plan = parsed.success ? parsed.data.plan : coerceWeeklyPlan(json.plan);
    return NextResponse.json({ plan });
  } catch (e) {
    return NextResponse.json({ error: 'Gemini error' }, { status: 502 });
  }
}
```

Ruta: /app/api/gemini/meal/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSingleMealPrompt, singleMealZod, coercePlannedMeal } from '@/lib/prompts/argentineMealPrompts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, date, slot, context } = body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  try {
    const prompt = getSingleMealPrompt({ userId, date, slot, context });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    });

    const text = result.response.text();
    const json = JSON.parse(text);
    const parsed = singleMealZod.safeParse(json);
    const meal = parsed.success ? parsed.data.meal : coercePlannedMeal(json.meal);
    return NextResponse.json({ meal });
  } catch (e) {
    return NextResponse.json({ error: 'Gemini error' }, { status: 502 });
  }
}
```

8) Prompts y validación

Ruta: /lib/prompts/argentineMealPrompts.ts

```ts
import { z } from 'zod';

export const ingredientZod = z.object({
  name: z.string(),
  amount: z.number().optional(),
  unit: z.enum(['g','kg','ml','l','u','cda','cdta','tz']).optional(),
  aisle: z.enum(['verduleria','carniceria','almacen','panaderia','fiambreria','pescaderia','otros']).optional(),
  notes: z.string().optional()
});

export const recipeZod = z.object({
  id: z.string(),
  name: z.string(),
  ingredients: z.array(ingredientZod),
  instructions: z.array(z.string()),
  prepTime: z.number(),
  cookTime: z.number(),
  servings: z.number(),
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number()
  }),
  culturalNotes: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const plannedMealZod = z.object({
  slot: z.enum(['breakfast','lunch','snack','dinner']),
  time: z.string(),
  recipe: recipeZod
});

export const planDayZod = z.object({
  date: z.string(),
  weekday: z.number(),
  meals: z.object({
    breakfast: plannedMealZod,
    lunch: plannedMealZod,
    snack: plannedMealZod,
    dinner: plannedMealZod
  }),
  notes: z.string().optional()
});

export const weeklyPlanZod = z.object({
  plan: z.object({
    id: z.string().optional(),
    userId: z.string(),
    weekStart: z.string(),
    weekEnd: z.string(),
    days: z.array(planDayZod),
    isPublic: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    metadata: z.object({
      season: z.enum(['verano','otoño','invierno','primavera']).optional(),
      region: z.string().optional(),
      mode: z.enum(['normal','economico','fiesta','dieta']).optional(),
      budgetWeekly: z.number().optional()
    }).optional()
  })
});

export const singleMealZod = z.object({ meal: plannedMealZod });

type WeeklyPromptParams = {
  userId: string;
  weekStart: string;
  preferences: any;
  excludeRecipeIds?: string[];
  mode?: 'normal' | 'economico' | 'fiesta' | 'dieta';
}

export const getWeeklyPlanPrompt = (p: WeeklyPromptParams) => {
  return `
Sos un chef argentino y nutricionista. Generá un plan semanal auténtico y culturalmente argentino para el usuario ${p.userId}.

Condiciones:
- 7 días, con breakfast, lunch, snack, dinner.
- Desayuno y merienda con mate frecuentemente.
- Cena alrededor de 21-22hs.
- Asado los domingos (cena).
- Ñoquis los 29 de cada mes (almuerzo).
- Evitar repeticiones de platos dentro de la semana. Excluir IDs: ${JSON.stringify(p.excludeRecipeIds ?? [])}.
- Ajustar al modo: ${p.mode ?? 'normal'} y al presupuesto en ARS si está presente.
- Respetar restricciones dietarias y preferencias: ${JSON.stringify(p.preferences)}.
- Adaptá a la estación en Argentina (sur): verano, otoño, invierno, primavera.
- Usar ingredientes típicos presentes en mercados argentinos (verdulería, carnicería, almacén, panadería, fiambrería).

Formato de salida obligatorio: JSON válido sin markdown, cumpliendo este esquema:
{
  "plan": {
    "userId": "${p.userId}",
    "weekStart": "${p.weekStart}",
    "weekEnd": "YYYY-MM-DD",
    "days": [
      {
        "date": "YYYY-MM-DD",
        "weekday": 1-7,
        "meals": {
          "breakfast": { "slot": "breakfast", "time": "HH:mm", "recipe": { "id": "string", "name": "string", "ingredients": [{ "name": "string", "amount": number, "unit": "g|kg|ml|l|u|cda|cdta|tz", "aisle": "verduleria|carniceria|almacen|panaderia|fiambreria|pescaderia|otros" }], "instructions": ["..."], "prepTime": number, "cookTime": number, "servings": number, "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number }, "culturalNotes": "string", "tags": ["..."] } },
          "lunch": { ... }, "snack": { ... }, "dinner": { ... }
        }
      }
    ],
    "metadata": { "season": "verano|otoño|invierno|primavera", "mode": "${p.mode ?? 'normal'}" }
  }
}
No incluyas nada fuera del JSON.
`;
};

export const getSingleMealPrompt = (p: { userId: string; date: string; slot: 'breakfast'|'lunch'|'snack'|'dinner'; context: any; }) => `
Sos un chef argentino. Regenerá una comida coherente para la fecha ${p.date} y slot ${p.slot}.
Evitar IDs: ${(p.context?.excludeRecipeIds ?? []).join(', ')}.
Mantener coherencia con el resto del plan y preferencias: ${JSON.stringify(p.context)}.
Respetar horarios argentinos, mate en desayuno/merienda, y evitar repeticiones.

Salida: JSON puro:
{
  "meal": {
    "slot": "${p.slot}",
    "time": "HH:mm",
    "recipe": { "id": "string", "name": "string", "ingredients": [{ "name": "string", "amount": number, "unit": "g|kg|ml|l|u|cda|cdta|tz", "aisle": "verduleria|carniceria|almacen|panaderia|fiambreria|pescaderia|otros" }], "instructions": ["..."], "prepTime": number, "cookTime": number, "servings": number, "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number }, "tags": ["..."] }
  }
}
No incluyas nada fuera del JSON.
`;

export const coerceWeeklyPlan = (plan: any) => plan;
export const coercePlannedMeal = (meal: any) => meal;
```

9) Retry util y user util

Ruta: /lib/utils/retry.ts

```ts
export const fetchWithRetry = async (input: RequestInfo | URL, init: RequestInit = {}, retries = 2, backoff = 700) => {
  let attempt = 0;
  let lastErr: any;
  while (attempt <= retries) {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(input, { ...init, signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(id);
      if (!res.ok && res.status >= 500 && attempt < retries) {
        await new Promise(r => setTimeout(r, backoff * (attempt + 1)));
        attempt++;
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt >= retries) throw lastErr;
      await new Promise(r => setTimeout(r, backoff * (attempt + 1)));
      attempt++;
    }
  }
  throw lastErr;
};
```

Ruta: /lib/utils/user.ts

```ts
export const getUserId = () => {
  if (typeof window === 'undefined') return 'server-user';
  const k = 'kcc-user-id';
  let id = localStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(k, id);
  }
  return id;
};
```

10) Componentes UI

Ruta: /components/meal-planning/MealSlot.tsx

```tsx
'use client';

import React from 'react';
import type { PlannedMeal, MealSlotType } from '@/features/meal-planning/types';
import { cn } from '@/components/ui/cn';

const slotIcon: Record<MealSlotType, string> = {
  breakfast: '☕',
  lunch: '🍽️',
  snack: '🧉',
  dinner: '🌙'
};

type Props = {
  meal: PlannedMeal;
  onRegenerate?: () => void;
  onOpenSelect?: () => void;
};

export const MealSlot: React.FC<Props> = ({ meal, onRegenerate, onOpenSelect }) => {
  return (
    <div className="rounded-2xl p-3 bg-white/10 border border-white/20 backdrop-blur-xl shadow-lg transition hover:bg-white/12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{slotIcon[meal.slot]}</span>
          <div>
            <p className="text-sm text-white/90">{meal.time} · {meal.slot === 'snack' ? 'Merienda' : meal.slot === 'breakfast' ? 'Desayuno' : meal.slot === 'lunch' ? 'Almuerzo' : 'Cena'}</p>
            <h4 className="font-semibold">{meal.recipe.name}</h4>
          </div>
        </div>
        <div className="flex gap-2">
          <button aria-label="Regenerar con IA" className="px-3 py-1.5 rounded-lg text-sm bg-white/15 hover:bg-white/25" onClick={onRegenerate}>Regenerar</button>
          <button aria-label="Elegir receta" className="px-3 py-1.5 rounded-lg text-sm bg-white/15 hover:bg-white/25" onClick={onOpenSelect}>Elegir</button>
        </div>
      </div>
    </div>
  );
};
```

Ruta: /components/meal-planning/MealPlannerGrid.tsx

```tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';
import { MealSlot } from './MealSlot';
import dynamic from 'next/dynamic';
import type { MealSlotType } from '@/features/meal-planning/types';

const RecipeSelectionModal = dynamic(() => import('./RecipeSelectionModal').then(m => m.RecipeSelectionModal), { ssr: false });
const ShoppingListGenerator = dynamic(() => import('./ShoppingListGenerator').then(m => m.ShoppingListGenerator), { ssr: false });
const NutritionalSummary = dynamic(() => import('./NutritionalSummary').then(m => m.NutritionalSummary), { ssr: false });

export const MealPlannerGrid: React.FC = () => {
  const { plan, loading, error, currentWeek, shoppingList, nutrition, actions } = useMealPlanning();
  const [modal, setModal] = useState<{ open: boolean; date?: string; slot?: MealSlotType }>({ open: false });

  const days = useMemo(() => plan?.days ?? [], [plan]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">🍽️ Planificador Semanal — {currentWeek.weekLabel}</h1>
          <div className="flex gap-2">
            <button onClick={() => actions.loadPlanForWeek()} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg hover:bg-white/15">Cargar</button>
            <button onClick={() => actions.generateWeekPlan()} className="px-3 py-2 rounded-xl bg-green-500/80 text-black hover:bg-green-500">Generar con IA</button>
            <button onClick={() => actions.savePlan()} className="px-3 py-2 rounded-xl bg-blue-500/80 text-black hover:bg-blue-500">Guardar</button>
          </div>
        </div>

        {error && <div className="mb-3 rounded-lg p-3 bg-red-500/20 border border-red-500/40">{error}</div>}
        {loading && <div className="mb-3 rounded-lg p-3 bg-white/10 border border-white/20">Generando...</div>}

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((d) => (
            <div key={d.date} className="rounded-3xl p-3 bg-white/8 border border-white/15 backdrop-blur-2xl shadow-xl">
              <div className="mb-2">
                <div className="text-sm text-white/80">{new Date(d.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}</div>
              </div>
              <div className="space-y-3">
                {(['breakfast','lunch','snack','dinner'] as MealSlotType[]).map(slot => (
                  <MealSlot
                    key={slot}
                    meal={d.meals[slot]}
                    onRegenerate={() => actions.regenerateMeal(d.date, slot)}
                    onOpenSelect={() => setModal({ open: true, date: d.date, slot })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShoppingListGenerator list={shoppingList} />
          <NutritionalSummary nutrition={nutrition} />
        </div>

        <RecipeSelectionModal
          open={modal.open}
          onClose={() => setModal({ open: false })}
          date={modal.date}
          slot={modal.slot}
        />
      </div>
    </div>
  );
};
```

Ruta: /components/meal-planning/RecipeSelectionModal.tsx

```tsx
'use client';

import React, { useMemo } from 'react';
import { recipesLibrary } from '@/features/meal-planning/recipesLibrary';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';
import type { MealSlotType } from '@/features/meal-planning/types';

type Props = {
  open: boolean;
  onClose: () => void;
  date?: string;
  slot?: MealSlotType;
};

export const RecipeSelectionModal: React.FC<Props> = ({ open, onClose, date, slot }) => {
  const { plan, actions } = useMealPlanning();
  const [q, setQ] = React.useState('');
  const results = useMemo(() => {
    const search = q.trim().toLowerCase();
    const base = recipesLibrary.filter(r => !search || r.name.toLowerCase().includes(search) || r.tags?.some(t => t.toLowerCase().includes(search)));
    if (!slot) return base.slice(0, 50);
    if (slot === 'breakfast') return base.filter(r => r.tags?.includes('desayuno') || r.tags?.includes('mate')).slice(0, 50);
    if (slot === 'snack') return base.filter(r => r.tags?.includes('merienda') || r.tags?.includes('mate')).slice(0, 50);
    return base.slice(0, 50);
  }, [q, slot]);

  const onPick = async (id: string) => {
    if (!plan || !date || !slot) return;
    const r = recipesLibrary.find(r => r.id === id);
    if (!r) return;
    const updated = {
      ...plan,
      days: plan.days.map(d => {
        if (d.date !== date) return d;
        return {
          ...d,
          meals: {
            ...d.meals,
            [slot]: { ...d.meals[slot], recipe: r }
          }
        };
      }),
      updatedAt: new Date().toISOString()
    };
    await actions.savePlan(updated, false);
    onClose();
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[95vw] max-w-2xl rounded-3xl p-4 bg-white/10 border border-white/20 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Elegir receta {slot ? `para ${slot}` : ''}</h3>
          <button className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25" onClick={onClose}>Cerrar</button>
        </div>
        <input
          placeholder="Buscar (milanesa, asado, empanadas...)"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-xl bg-white/15 outline-none border border-white/20"
        />
        <div className="max-h-[50vh] overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => onPick(r.id)}
              className="text-left rounded-2xl p-3 bg-white/8 border border-white/15 hover:bg-white/12"
            >
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-white/70">{r.tags?.join(' · ')}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

Ruta: /components/meal-planning/ShoppingListGenerator.tsx

```tsx
'use client';

import React from 'react';
import type { ShoppingList } from '@/features/meal-planning/shopping';

type Props = {
  list: ShoppingList;
};

export const ShoppingListGenerator: React.FC<Props> = ({ list }) => {
  const [copied, setCopied] = React.useState(false);

  const text = Object.entries(list).map(([aisle, items]) => {
    if (items.length === 0) return '';
    return `- ${aisle.toUpperCase()}:\n` + items.map(i => `  • ${i.name}${i.amount ? ` — ${Math.round(i.amount)} ${i.unit ?? ''}` : ''}`).join('\n');
  }).filter(Boolean).join('\n');

  const onCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-3xl p-4 bg-white/10 border border-white/20 backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">🧺 Lista de Compras</h3>
        <button onClick={onCopy} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm">{copied ? 'Copiado' : 'Copiar'}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(list).map(([aisle, items]) => (
          <div key={aisle} className="rounded-2xl p-3 bg-white/8 border border-white/15">
            <div className="font-medium mb-2">{aisle.toUpperCase()}</div>
            <ul className="space-y-1">
              {items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 accent-emerald-400" aria-label={`Check ${i.name}`} />
                  <span>{i.name}</span>
                  <span className="text-white/70 text-sm ml-auto">{i.amount ? `${Math.round(i.amount)} ${i.unit ?? ''}` : ''}</span>
                </li>
              ))}
              {items.length === 0 && <li className="text-white/60 text-sm">Sin items</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
```

Ruta: /components/meal-planning/NutritionalSummary.tsx

```tsx
'use client';

import React from 'react';

type Props = {
  nutrition: {
    daily: { date: string; calories: number; protein: number; carbs: number; fat: number }[];
    weekly: { calories: number; protein: number; carbs: number; fat: number };
  };
};

export const NutritionalSummary: React.FC<Props> = ({ nutrition }) => {
  return (
    <div className="rounded-3xl p-4 bg-white/10 border border-white/20 backdrop-blur-2xl">
      <h3 className="font-semibold mb-2">📊 Nutrición</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <Stat label="Calorías" value={`${Math.round(nutrition.weekly.calories)} kcal`} />
        <Stat label="Proteínas" value={`${Math.round(nutrition.weekly.protein)} g`} />
        <Stat label="Carbohidratos" value={`${Math.round(nutrition.weekly.carbs)} g`} />
        <Stat label="Grasas" value={`${Math.round(nutrition.weekly.fat)} g`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {nutrition.daily.map(d => (
          <div key={d.date} className="rounded-2xl p-3 bg-white/8 border border-white/15">
            <div className="text-sm text-white/70">{new Date(d.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}</div>
            <div className="text-sm">Kcal: {Math.round(d.calories)}</div>
            <div className="text-xs text-white/70">P: {Math.round(d.protein)}g · C: {Math.round(d.carbs)}g · G: {Math.round(d.fat)}g</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl p-3 bg-white/8 border border-white/15 text-center">
    <div className="text-xs text-white/70">{label}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);
```

11) SQL Supabase (agregar is_public + índices útiles)

Ejecutá esto en Supabase SQL editor.

```sql
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_week ON meal_plans (user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_meal_plans_updated_at ON meal_plans (updated_at);

-- Opcional: tabla de despensa para futuras features
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC,
  unit TEXT,
  aisle TEXT,
  expires_at DATE,
  created_at TIMESTAMP DEFAULT now()
);
```

12) Tests

Instalá vitest y testing-library si no los tenés.

Ruta: /tests/useMealPlanning.test.ts

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';

global.fetch = vi.fn(async (input: any) => {
  if (String(input).includes('/api/gemini/weekly')) {
    return new Response(JSON.stringify({ error: 'no key' }), { status: 500 });
  }
  return new Response('{}', { status: 200 });
}) as any;

describe('useMealPlanning', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('generates offline plan when API fails', async () => {
    const { result } = renderHook(() => useMealPlanning());
    await act(async () => {
      await result.current.actions.generateWeekPlan();
    });
    expect(result.current.plan).toBeTruthy();
    expect(result.current.plan?.days.length).toBe(7);
  });
});
```

Ruta: /tests/api/gemini.weekly.test.ts

```ts
import { describe, it, expect } from 'vitest';
import { GET, POST } from '@/app/api/gemini/weekly/route';

describe('Gemini Weekly API', () => {
  it('fails without API key', async () => {
    const res = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) }) as any);
    // NextResponse object
    // @ts-ignore
    expect(res.status).toBe(500);
  });
});
```

Ruta: /tests/e2e/planificador.spec.ts (Playwright)

```ts
import { test, expect } from '@playwright/test';

test('Planificador carga y genera', async ({ page }) => {
  await page.goto('/app/(app)/planificador');
  await page.getByRole('button', { name: /Generar con IA/i }).click();
  await expect(page.getByText(/Planificador Semanal/i)).toBeVisible();
});
```

13) Estilos glassmorphism (Tailwind)

Usamos clases: backdrop-blur-2xl, bg-white/10, border-white/20, sombras suaves. Ya aplicadas en los componentes. Si querés pulir, agregá un theme con opacidades personalizadas.

14) Accesibilidad

- Uso de aria-labels, roles en modal, contraste adecuado en botones, foco claro en inputs.

15) Variables de entorno

Añadí al .env:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

16) Deploy

- Vercel: variables de entorno en dashboard.
- Supabase: ejecutar SQL anterior y configurar Realtime habilitado.
- NextAuth: si lo usás, nuestro getUserId hace fallback local en dev.

17) Página de planificador (ejemplo mínimo)

Ruta: /app/(app)/planificador/page.tsx

```tsx
'use client';

import React from 'react';
import { MealPlannerGrid } from '@/components/meal-planning/MealPlannerGrid';

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="pt-6">
        <MealPlannerGrid />
      </div>
    </main>
  );
}
```

Notas finales

- Coherencia cultural: mate en desayuno/merienda, asado domingo, ñoquis 29, horarios argentinos.
- Realtime Supabase activo para meal_plans del usuario.
- Fallback offline robusto si falla Gemini o falta API key.
- Lista de compras por comercios argentinos y totales nutricionales.
- Estado optimista con persistencia local (Zustand).
- Código mobile-first, performante y accesible.

¿Querés que agregue un modo “Crisis” más agresivo con precios estimados y sustitutos por inflación, o un “Fiesta” con selección automática de picada y postres? Lo armamos en dos patadas. 🇦🇷🔥