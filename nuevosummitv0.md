Dale, vamos a llevar KeCarajoComer a “modo Falcon 9”: más inteligente, más rápido, más barato. Te dejo un upgrade integral listo para pegar que agrega presupuesto ARS con catálogo de precios, sustituciones automáticas, despensa con vencimientos, sobras inteligentes, exportar calendario ICS, caching robusto de IA, prompts con estacionalidad/region, RLS sólido y nuevos UI widgets. Todo sin romper tu stack ni tu estructura actual.

Importante: mantengo tus tipos y rutas existentes, y sumo módulos plug-and-play. Primero te doy el hook principal actualizado y después los componentes y APIs nuevas.

1) Hook principal actualizado
Ruta: /hooks/meal-planning/useMealPlanning.ts

```ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createId } from '@paralleldrive/cuid2';
import { useMealPlanStore } from '@/store/slices/mealPlanSlice';
import { getWeekRange, isoDate, getSeason, clampPlanToRules, summarizeNutrition, defaultTimes } from '@/features/meal-planning/utils';
import { buildShoppingList } from '@/features/meal-planning/shopping';
import type { MealPlan, MealSlotType, PlannedMeal, Recipe, UserPreferences, PantryItem, PriceCatalogItem, BudgetEstimate } from '@/features/meal-planning/types';
import { supabaseClient } from '@/lib/supabase/client';
import { fetchWithRetry } from '@/lib/utils/retry';
import { offlineGenerateWeeklyPlan, offlineGenerateSingleMeal } from '@/features/meal-planning/offlineGenerators';
import { getUserId } from '@/lib/utils/user';
import { GEMINI_WEEKLY_ENDPOINT, GEMINI_MEAL_ENDPOINT, GEMINI_ALTERNATIVES_ENDPOINT } from '@/lib/services/gemini/client';
import { estimateWeeklyBudget } from '@/lib/utils/pricing';
import { optimizePlanForBudget } from '@/lib/utils/substitutions';
import { buildICS } from '@/lib/utils/ics';
import { getSeasonalAvailability } from '@/lib/utils/seasonality';

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
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [priceCatalog, setPriceCatalog] = useState<PriceCatalogItem[]>([]);
  const [budgetEstimate, setBudgetEstimate] = useState<BudgetEstimate | null>(null);

  const supabaseRef = useRef<ReturnType<typeof supabaseClient> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof supabaseClient>['channel']> | null>(null);
  const pantryChannelRef = useRef<ReturnType<ReturnType<typeof supabaseClient>['channel']> | null>(null);
  const priceChannelRef = useRef<ReturnType<ReturnType<typeof supabaseClient>['channel']> | null>(null);

  const userId = useMemo(() => getUserId(), []);
  const client = useMemo(() => {
    if (!supabaseRef.current) supabaseRef.current = supabaseClient();
    return supabaseRef.current;
  }, []);

  const currentWeek = useMemo(() => {
    const base = plan?.weekStart ? new Date(plan.weekStart) : new Date();
    return getWeekRange(base);
  }, [plan?.weekStart]);

  const region = preferences?.region ?? 'Argentina';
  const season = useMemo(() => getSeason(currentWeek.start), [currentWeek.start]);
  const seasonalProduce = useMemo(() => getSeasonalAvailability(region as any, season), [region, season]);

  const loadPantry = useCallback(async () => {
    const { data, error: e } = await client.from('pantry_items').select('*').eq('user_id', userId).order('expires_at', { ascending: true });
    if (!e) setPantry(data ?? []);
  }, [client, userId]);

  const addToPantry = useCallback(async (item: Omit<PantryItem, 'id' | 'created_at' | 'user_id'>) => {
    const { data, error: e } = await client.from('pantry_items').insert({ ...item, user_id: userId }).select().single();
    if (!e && data) setPantry(prev => [...prev, data]);
  }, [client, userId]);

  const updatePantryItem = useCallback(async (id: string, patch: Partial<PantryItem>) => {
    const { data, error: e } = await client.from('pantry_items').update(patch).eq('id', id).select().single();
    if (!e && data) setPantry(prev => prev.map(p => p.id === id ? data : p));
  }, [client]);

  const removePantryItem = useCallback(async (id: string) => {
    await client.from('pantry_items').delete().eq('id', id);
    setPantry(prev => prev.filter(p => p.id !== id));
  }, [client]);

  const loadPriceCatalog = useCallback(async () => {
    const { data } = await client.from('price_catalog').select('*').in('region', [region, 'Argentina']).order('updated_at', { ascending: false });
    setPriceCatalog(data ?? []);
  }, [client, region]);

  const estimateBudget = useCallback(() => {
    if (!plan) return null;
    const est = estimateWeeklyBudget(plan, pantry, priceCatalog);
    const variance = (preferences.budget_weekly ?? 0) - est.toBuyARS;
    const out = { ...est, varianceToBudget: Math.round(variance) as any };
    setBudgetEstimate(out);
    return out;
  }, [plan, pantry, priceCatalog, preferences.budget_weekly]);

  const injectLeftovers = useCallback(async () => {
    if (!plan) return 0;
    const hh = preferences.household_size ?? 2;
    let changes = 0;
    const updated: MealPlan = {
      ...plan,
      days: plan.days.map(d => ({ ...d, meals: { ...d.meals } }))
    };
    for (let i = 0; i < updated.days.length - 1; i++) {
      const dinner = updated.days[i].meals.dinner?.recipe;
      if (!dinner) continue;
      if ((dinner.servings ?? 0) > hh && !/sobras/i.test(dinner.name)) {
        const next = updated.days[i + 1];
        if (next) {
          next.meals.lunch = {
            ...next.meals.lunch,
            slot: 'lunch',
            time: defaultTimes.lunch,
            recipe: { ...dinner, id: `${dinner.id}-leftover`, name: `${dinner.name} (sobras)` }
          };
          changes++;
        }
      }
    }
    if (changes > 0) {
      updated.updatedAt = new Date().toISOString();
      setPlan(updated);
      await savePlan(updated, false);
    }
    return changes;
  }, [plan, preferences.household_size, setPlan]);

  const exportICS = useCallback(() => {
    if (!plan) return '';
    return buildICS(plan);
  }, [plan]);

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
        pantry: pantry.map(p => p.name),
        region,
        seasonalProduce
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

      await savePlan(validated, false);
      estimateBudget();
      return validated;
    } catch (e) {
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
      estimateBudget();
      return validated;
    } finally {
      setLoading(false);
    }
  }, [userId, preferences, mode, usedRecipeIds, pantry, region, seasonalProduce, setPlan, setLoading, setError, clearUsedRecipeIds, addUsedRecipeId, estimateBudget]);

  const regenerateMeal = useCallback(async (isoDay: string, slot: MealSlotType) => {
    if (!plan) return null;
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
          mode,
          pantry: pantry.map(p => p.name),
          region,
          seasonalProduce
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
            meals: { ...d.meals, [slot]: { ...newMeal, aiGenerated: res.ok } }
          };
        })
      };

      if (usedRecipeIds.has(newMeal.recipe.id)) {
        const fallback = offlineGenerateSingleMeal(body, Array.from(usedRecipeIds));
        updated.days = updated.days.map(d => {
          if (d.date !== isoDay) return d;
          return { ...d, meals: { ...d.meals, [slot]: { ...fallback, aiGenerated: false } } };
        });
        newMeal = updated.days.find(d => d.date === isoDay)!.meals[slot];
      }

      setPlan(updated);
      addUsedRecipeId(newMeal.recipe.id);
      await savePlan(updated, false);
      estimateBudget();
      return newMeal;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo regenerar la comida');
      return null;
    } finally {
      setLoading(false);
    }
  }, [plan, userId, preferences, usedRecipeIds, pantry, region, setPlan, setLoading, setError, addUsedRecipeId, mode, estimateBudget]);

  const applyRecipeToSlot = useCallback(async (isoDay: string, slot: MealSlotType, recipe: Recipe) => {
    if (!plan) return;
    const updated: MealPlan = {
      ...plan,
      updatedAt: new Date().toISOString(),
      days: plan.days.map(d => {
        if (d.date !== isoDay) return d;
        return { ...d, meals: { ...d.meals, [slot]: { ...d.meals[slot], recipe } } };
      })
    };
    setPlan(updated);
    addUsedRecipeId(recipe.id);
    await savePlan(updated, false);
    estimateBudget();
  }, [plan, setPlan, addUsedRecipeId, savePlan, estimateBudget]);

  const getAlternatives = useCallback(async (isoDay: string, slot: MealSlotType) => {
    if (!plan) return [];
    const dayIdx = plan.days.findIndex(d => d.date === isoDay);
    const body = { plan, dayIndex: dayIdx, slot, preferences, pantry: pantry.map(p => p.name), mode, region, seasonalProduce };
    const res = await fetchWithRetry(GEMINI_ALTERNATIVES_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) return [];
    const data = await res.json() as { alternatives: Recipe[] };
    return data.alternatives ?? [];
  }, [plan, preferences, pantry, mode, region, seasonalProduce]);

  const optimizeForBudget = useCallback(async () => {
    if (!plan) return { applied: 0 };
    const { plan: optimized, changes } = optimizePlanForBudget(plan);
    if (changes > 0) {
      setPlan(optimized);
      await savePlan(optimized, false);
      estimateBudget();
    }
    return { applied: changes };
  }, [plan, setPlan, savePlan, estimateBudget]);

  const prioritizeExpiring = useCallback(async () => {
    if (!plan) return 0;
    const expiring = pantry.filter(p => p.expires_at && new Date(p.expires_at) <= new Date(Date.now() + 3 * 86400000)).map(p => p.name.toLowerCase());
    if (expiring.length === 0) return 0;
    let applied = 0;
    for (const d of plan.days) {
      for (const slot of ['lunch','dinner'] as MealSlotType[]) {
        const rec = d.meals[slot].recipe;
        const has = rec.ingredients.some(i => expiring.some(x => i.name.toLowerCase().includes(x)));
        if (!has) {
          const alts = await getAlternatives(d.date, slot);
          const match = alts.find(r => r.ingredients.some(i => expiring.some(x => i.name.toLowerCase().includes(x))));
          if (match) {
            await applyRecipeToSlot(d.date, slot, match);
            applied++;
          }
        }
      }
      if (applied >= 2) break;
    }
    return applied;
  }, [plan, pantry, getAlternatives, applyRecipeToSlot]);

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
        estimateBudget();
        return validated;
      } else {
        const gen = await generateWeekPlan(week.start);
        estimateBudget();
        return gen;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el plan');
      const offline = offlineGenerateWeeklyPlan({
        userId,
        weekStart: isoDate(week.start),
        preferences,
        mode
      });
      const validated = clampPlanToRules(offline);
      setPlan(validated);
      estimateBudget();
      return validated;
    } finally {
      setLoading(false);
    }
  }, [client, userId, preferences, mode, setPlan, setLoading, setError, clearUsedRecipeIds, addUsedRecipeId, generateWeekPlan, estimateBudget]);

  const subscribeRealtime = useCallback(() => {
    try {
      if (channelRef.current) channelRef.current.unsubscribe();
      if (pantryChannelRef.current) pantryChannelRef.current.unsubscribe();
      if (priceChannelRef.current) priceChannelRef.current.unsubscribe();

      const planChannel = client.channel(`meal_plans_user_${userId}`).on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_plans', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new && payload.eventType !== 'DELETE') {
            const planData = (payload.new as any).plan_data as MealPlan;
            const validated = clampPlanToRules(planData);
            setPlan({ ...validated, id: (payload.new as any).id });
            estimateBudget();
          }
        }
      ).subscribe(status => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('subscribed');
      });

      const pantryChannel = client.channel(`pantry_user_${userId}`).on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pantry_items', filter: `user_id=eq.${userId}` },
        () => loadPantry()
      ).subscribe();

      const priceChannel = client.channel(`price_catalog_${region}`).on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'price_catalog' },
        () => loadPriceCatalog()
      ).subscribe();

      channelRef.current = planChannel;
      pantryChannelRef.current = pantryChannel;
      priceChannelRef.current = priceChannel;
    } catch {
      setRealtimeStatus('error');
    }
  }, [client, userId, region, setPlan, estimateBudget, loadPantry, loadPriceCatalog]);

  useEffect(() => {
    subscribeRealtime();
    loadPantry();
    loadPriceCatalog();
    return () => {
      if (channelRef.current) channelRef.current.unsubscribe();
      if (pantryChannelRef.current) pantryChannelRef.current.unsubscribe();
      if (priceChannelRef.current) priceChannelRef.current.unsubscribe();
    };
  }, [subscribeRealtime, loadPantry, loadPriceCatalog]);

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
        region: (merged as any).region ?? 'Argentina'
      });
    } catch {
      // persist best-effort
    }
  }, [preferences, setPreferences, client, userId]);

  const expiringItems = useMemo(() => {
    const now = Date.now();
    return pantry.filter(p => p.expires_at && new Date(p.expires_at).getTime() <= now + 3 * 86400000);
  }, [pantry]);

  return {
    plan,
    loading,
    error,
    currentWeek,
    shoppingList,
    nutrition,
    mode,
    pantry,
    priceCatalog,
    budgetEstimate,
    seasonalProduce,
    expiringItems,
    actions: {
      generateWeekPlan,
      regenerateMeal,
      savePlan,
      loadPlanForWeek,
      setUserPreferences,
      // Plus
      loadPantry,
      addToPantry,
      updatePantryItem,
      removePantryItem,
      loadPriceCatalog,
      estimateBudget,
      optimizeForBudget,
      getAlternatives,
      applyRecipeToSlot,
      injectLeftovers,
      prioritizeExpiring,
      exportICS,
    },
    realtime: {
      status: realtimeStatus
    }
  };
};
```

2) Actualizar tipos
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
  time: string;
  recipe: Recipe;
  aiGenerated?: boolean;
}

export interface MealPlanDay {
  date: string;
  weekday: number;
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
  region?: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  amount?: number | null;
  unit?: Unit | null;
  aisle?: Aisle | null;
  expires_at?: string | null;
  created_at?: string;
}

export interface PriceCatalogItem {
  id: string;
  name: string;
  unit: 'kg' | 'l' | 'u';
  price_ars: number;
  region?: string | null;
  updated_at: string;
}

export interface BudgetEstimate {
  estimatedTotalARS: number;
  ownedValueARS: number;
  toBuyARS: number;
  varianceToBudget: number;
  currency: 'ARS';
}
```

3) Pricing y presupuesto
Ruta: /lib/utils/pricing.ts

```ts
import type { MealPlan, Ingredient, PantryItem, PriceCatalogItem, BudgetEstimate, MealSlotType } from '@/features/meal-planning/types';

const norm = (u?: string) => {
  if (!u) return '';
  const x = u.toLowerCase();
  if (x === 'kgs' || x === 'kg') return 'kg';
  if (x === 'g' || x === 'gr') return 'g';
  if (x === 'l' || x === 'lt' || x === 'lts') return 'l';
  if (x === 'ml') return 'ml';
  if (x === 'u' || x === 'unidad' || x === 'unidades') return 'u';
  return x as any;
};

const toBase = (qty: number, unit: string) => {
  const u = norm(unit);
  if (u === 'g') return { qty: qty / 1000, unit: 'kg' as const };
  if (u === 'kg') return { qty, unit: 'kg' as const };
  if (u === 'ml') return { qty: qty / 1000, unit: 'l' as const };
  if (u === 'l') return { qty, unit: 'l' as const };
  if (u === 'u' || u === '') return { qty, unit: 'u' as const };
  return { qty, unit: u as any };
};

const matchPrice = (ing: Ingredient, catalog: PriceCatalogItem[]) => {
  const name = ing.name.toLowerCase();
  const exact = catalog.find(c => name.includes(c.name.toLowerCase()));
  if (exact) return exact;
  const first = name.split(' ')[0];
  return catalog.find(c => c.name.toLowerCase() === first) ?? null;
};

const estCost = (ing: Ingredient, catalog: PriceCatalogItem[]): number => {
  if (!ing.amount) return 0;
  const price = matchPrice(ing, catalog);
  if (!price) return 0;
  const need = toBase(ing.amount, ing.unit ?? '');
  if (price.unit === 'kg' && need.unit === 'kg') return need.qty * price.price_ars;
  if (price.unit === 'l' && need.unit === 'l') return need.qty * price.price_ars;
  if (price.unit === 'u' && need.unit === 'u') return need.qty * price.price_ars;
  if (price.unit === 'kg' && need.unit === 'u') return 0.15 * price.price_ars;
  return 0;
};

const ownedValue = (ing: Ingredient, pantry: PantryItem[], catalog: PriceCatalogItem[]) => {
  const p = pantry.find(x => x.name.toLowerCase().trim() === ing.name.toLowerCase().trim());
  if (!p || !ing.amount) return 0;
  const price = matchPrice(ing, catalog);
  if (!price) return 0;
  const need = toBase(ing.amount, ing.unit ?? '');
  const own = toBase(p.amount ?? 0, p.unit ?? (ing.unit ?? ''));
  if (price.unit === 'kg' && need.unit === 'kg' && own.unit === 'kg') return Math.min(need.qty, own.qty) * price.price_ars;
  if (price.unit === 'l' && need.unit === 'l' && own.unit === 'l') return Math.min(need.qty, own.qty) * price.price_ars;
  if (price.unit === 'u' && need.unit === 'u' && own.unit === 'u') return Math.min(need.qty, own.qty) * price.price_ars;
  return 0;
};

export const estimateWeeklyBudget = (plan: MealPlan, pantry: PantryItem[], catalog: PriceCatalogItem[]): BudgetEstimate => {
  let total = 0;
  let owned = 0;
  plan.days.forEach(d => {
    (['breakfast','lunch','snack','dinner'] as MealSlotType[]).forEach(slot => {
      d.meals[slot].recipe.ingredients.forEach(ing => {
        total += estCost(ing, catalog);
        owned += ownedValue(ing, pantry, catalog);
      });
    });
  });
  const toBuy = Math.max(0, total - owned);
  return {
    estimatedTotalARS: Math.round(total),
    ownedValueARS: Math.round(owned),
    toBuyARS: Math.round(toBuy),
    varianceToBudget: 0,
    currency: 'ARS'
  };
};
```

4) Sustituciones automáticas para modo económico
Ruta: /lib/utils/substitutions.ts

```ts
import { MealPlan, MealSlotType, Recipe } from '@/features/meal-planning/types';
import { recipesLibrary } from '@/features/meal-planning/recipesLibrary';

const ensureRecipe = (id: string, fallback: Recipe): Recipe => recipesLibrary.find(r => r.id === id) ?? fallback;

const cheaperRules: Array<{ match: RegExp; replaceRecipe: Recipe }> = [
  {
    match: /(asado|vacío|bife|matambre|tira de asado)/i,
    replaceRecipe: ensureRecipe('pollo-al-horno-economico', {
      id: 'pollo-al-horno-economico',
      name: 'Pollo al horno con papas',
      ingredients: [
        { name: 'Muslos de pollo', amount: 1000, unit: 'g', aisle: 'carniceria' },
        { name: 'Papa', amount: 1000, unit: 'g', aisle: 'verduleria' },
        { name: 'Ajo', amount: 2, unit: 'u', aisle: 'verduleria' },
        { name: 'Aceite', amount: 30, unit: 'ml', aisle: 'almacen' },
      ],
      instructions: ['Hornear pollo con papas y ajo hasta dorar'],
      prepTime: 10, cookTime: 50, servings: 4,
      nutrition: { calories: 650, protein: 45, carbs: 40, fat: 30 },
      tags: ['economico','cena']
    })
  },
  {
    match: /(provoleta|jamón crudo|queso caro)/i,
    replaceRecipe: ensureRecipe('tarta-verduras', recipesLibrary.find(r => r.id === 'tarta-verduras')!)
  },
  {
    match: /(milanesa|lomo)/i,
    replaceRecipe: ensureRecipe('albondigas-economicas', {
      id: 'albondigas-economicas',
      name: 'Albóndigas con arroz',
      ingredients: [
        { name: 'Carne picada común', amount: 500, unit: 'g', aisle: 'carniceria' },
        { name: 'Arroz', amount: 300, unit: 'g', aisle: 'almacen' },
        { name: 'Salsa de tomate', amount: 400, unit: 'g', aisle: 'almacen' },
        { name: 'Cebolla', amount: 1, unit: 'u', aisle: 'verduleria' }
      ],
      instructions: ['Armar albóndigas, dorar, salsear y servir con arroz'],
      prepTime: 20, cookTime: 30, servings: 4,
      nutrition: { calories: 620, protein: 32, carbs: 70, fat: 20 },
      tags: ['economico','almuerzo']
    })
  }
];

export const optimizePlanForBudget = (plan: MealPlan): { plan: MealPlan; changes: number } => {
  let changes = 0;
  const updated: MealPlan = {
    ...plan,
    days: plan.days.map(d => {
      const meals = { ...d.meals };
      (['lunch','dinner'] as MealSlotType[]).forEach(slot => {
        const r = meals[slot].recipe;
        const text = `${r.name} ${r.ingredients.map(i => i.name).join(' ')}`;
        for (const rule of cheaperRules) {
          if (rule.match.test(text)) {
            meals[slot] = { ...meals[slot], recipe: rule.replaceRecipe };
            changes++;
            break;
          }
        }
      });
      return { ...d, meals };
    })
  };
  return { plan: updated, changes };
};
```

5) ICS export
Ruta: /lib/utils/ics.ts

```ts
import { MealPlan, MealSlotType } from '@/features/meal-planning/types';
import { defaultTimes } from '@/features/meal-planning/utils';

const dt = (date: Date) => {
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
};

export const buildICS = (plan: MealPlan): string => {
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//KeCarajoComer//AR//ES');

  const slots: MealSlotType[] = ['breakfast','lunch','snack','dinner'];
  const slotLabel: Record<MealSlotType, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    snack: 'Merienda',
    dinner: 'Cena'
  };

  plan.days.forEach(day => {
    slots.forEach(slot => {
      const rec = day.meals[slot]?.recipe;
      if (!rec) return;
      const [hh, mm] = (day.meals[slot].time || defaultTimes[slot]).split(':').map(Number);
      const start = new Date(`${day.date}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${day.date}-${slot}@kecarajocomer`);
      lines.push(`DTSTAMP:${dt(new Date())}`);
      lines.push(`DTSTART:${dt(start)}`);
      lines.push(`DTEND:${dt(end)}`);
      lines.push(`SUMMARY:${slotLabel[slot]}: ${rec.name}`);
      lines.push(`DESCRIPTION:${(rec.instructions || []).slice(0,3).join(' \\n ')}`);
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};
```

6) Estacionalidad
Ruta: /lib/utils/seasonality.ts

```ts
export type Season = 'verano' | 'otoño' | 'invierno' | 'primavera';
export type Region = 'Argentina' | 'AMBA' | 'CABA' | 'Córdoba' | 'Mendoza' | 'Patagonia' | 'NOA' | 'NEA';

const seasonalProduce: Record<Region, Record<Season, string[]>> = {
  Argentina: {
    verano: ['tomate','pepino','berenjena','choclo','durazno','sandía'],
    otoño: ['zapallo','acelga','espinaca','manzana','pera'],
    invierno: ['papa','batata','zanahoria','cebolla','calabaza','lentejas'],
    primavera: ['arveja','lechuga','frutilla','brócoli']
  },
  AMBA: {
    verano: ['tomate','lechuga','choclo','durazno'],
    otoño: ['acelga','espinaca','zapallo'],
    invierno: ['papa','zanahoria','cebolla'],
    primavera: ['brócoli','arveja','frutilla']
  },
  CABA: { verano: ['tomate'], otoño: ['zapallo'], invierno: ['papa'], primavera: ['lechuga'] },
  Córdoba: { verano: ['tomate'], otoño: ['acelga'], invierno: ['cebolla'], primavera: ['brócoli'] },
  Mendoza: { verano: ['durazno'], otoño: ['pera'], invierno: ['cebolla'], primavera: ['lechuga'] },
  Patagonia: { verano: ['frutos rojos'], otoño: ['manzana'], invierno: ['papa'], primavera: ['lechuga'] },
  NOA: { verano: ['choclo'], otoño: ['zapallo'], invierno: ['papa'], primavera: ['arveja'] },
  NEA: { verano: ['mandarina'], otoño: ['naranja'], invierno: ['batata'], primavera: ['lechuga'] }
};

export const getSeasonalAvailability = (region: Region, season: Season): string[] => {
  const r = seasonalProduce[region] || seasonalProduce.Argentina;
  return r[season] || seasonalProduce.Argentina[season];
};
```

7) AI cache y hash
Ruta: /lib/utils/aiCache.ts

```ts
import { supabaseClient } from '@/lib/supabase/client';

export const getCached = async (key: string) => {
  const sb = supabaseClient();
  const { data } = await sb.from('ai_cache').select('value, expires_at').eq('key', key).maybeSingle();
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data.value;
};

export const setCached = async (key: string, value: any, ttlDays = 3) => {
  const sb = supabaseClient();
  const expires_at = new Date(Date.now() + ttlDays * 86400000).toISOString();
  await sb.from('ai_cache').upsert({ key, value, expires_at, updated_at: new Date().toISOString() });
};
```

Ruta: /lib/utils/hash.ts

```ts
export const hashString = async (input: string) => {
  try {
    // @ts-ignore
    const { createHash } = await import('crypto');
    return createHash('sha256').update(input).digest('hex');
  } catch {
    const enc = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
};
```

8) Prompts mejorados con estacionalidad y despensa
Ruta: /lib/prompts/argentineMealPrompts.ts

```ts
import { z } from 'zod';
import { getSeasonalAvailability } from '@/lib/utils/seasonality';

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
export const alternativesZod = z.object({ alternatives: z.array(recipeZod) });

export const getWeeklyPlanPrompt = (p: any) => {
  const seasonal = getSeasonalAvailability((p.region ?? 'Argentina') as any, p.season ?? 'invierno');
  return `
Sos un chef argentino y nutricionista. Generá un plan semanal auténtico para ${p.userId}.

Requisitos:
- 7 días con breakfast, lunch, snack, dinner.
- Desayuno y merienda con mate frecuente.
- Cena 21-22hs.
- Asado el domingo (adaptar si vegetariano).
- Ñoquis el 29 si aplica.
- Evitar repeticiones. Excluir IDs: ${JSON.stringify(p.excludeRecipeIds ?? [])}.
- Modo: ${p.mode ?? 'normal'} y presupuesto si existe.
- Estación y región: priorizá ingredientes de temporada en ${p.region ?? 'Argentina'}: ${seasonal.join(', ')}.
- Disponibles en despensa: ${JSON.stringify(p.pantry ?? [])} (priorizar su uso).
- Respetar preferencias: ${JSON.stringify(p.preferences)}.

Salida JSON válida:
{"plan": { ... sigue weeklyPlanZod ... }}
`;
};

export const getSingleMealPrompt = (p: { userId: string; date: string; slot: 'breakfast'|'lunch'|'snack'|'dinner'; context: any; }) => `
Sos un chef argentino. Regenerá ${p.slot} para ${p.date} sin romper coherencia.
Evitar IDs: ${(p.context?.excludeRecipeIds ?? []).join(', ')}.
Priorizar ingredientes de temporada (${(p.context?.seasonalProduce ?? []).join(', ')}) y disponibles en despensa (${(p.context?.pantry ?? []).join(', ')}).
Preferencias: ${JSON.stringify(p.context?.preferences ?? {})}.

Salida:
{"meal": ${plannedMealZod.toString()}}
`;

export const getAlternativesPrompt = (p: any) => `
Sos un chef argentino. Proponé 3 alternativas de recetas completas para el día index ${p.dayIndex} y slot ${p.slot}.
Usar ingredientes de temporada (${(p.seasonalProduce ?? []).join(', ')}) y de despensa (${(p.pantry ?? []).join(', ')}).
Evitar repeticiones del plan actual.

Salida:
{"alternatives": ${z.array(recipeZod).toString()}}
`;

export const coerceWeeklyPlan = (plan: any) => plan;
export const coercePlannedMeal = (meal: any) => meal;
```

9) API Gemini con cache y parser robusto
Ruta: /lib/services/gemini/client.ts

```ts
export const GEMINI_WEEKLY_ENDPOINT = '/api/gemini/weekly';
export const GEMINI_MEAL_ENDPOINT = '/api/gemini/meal';
export const GEMINI_ALTERNATIVES_ENDPOINT = '/api/gemini/alternatives';
```

Ruta: /app/api/gemini/weekly/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWeeklyPlanPrompt, weeklyPlanZod, coerceWeeklyPlan } from '@/lib/prompts/argentineMealPrompts';
import { getCached, setCached } from '@/lib/utils/aiCache';
import { hashString } from '@/lib/utils/hash';

export const dynamic = 'force-dynamic';

const extractJson = (txt: string) => {
  const t = txt.trim();
  try {
    if (t.startsWith('{') || t.startsWith('[')) return JSON.parse(t);
    const m = t.match(/```json\s*([\s\S]*?)```/i) || t.match(/```\s*([\s\S]*?)```/i);
    if (m?.[1]) return JSON.parse(m[1]);
    const cleaned = t.replace(/^\s*\/\/.*$/gm, '').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Formato no JSON');
  }
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = getWeeklyPlanPrompt(body);
  const key = await hashString(`weekly:${prompt}`);
  const cached = await getCached(key);
  if (cached?.plan) return NextResponse.json({ plan: cached.plan });

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.65, maxOutputTokens: 4096, responseMimeType: 'application/json' }
    });
    const json = extractJson(result.response.text());
    const parsed = weeklyPlanZod.safeParse(json);
    const plan = parsed.success ? parsed.data.plan : coerceWeeklyPlan(json.plan);
    await setCached(key, { plan }, 3);
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: 'Gemini error' }, { status: 502 });
  }
}
```

Ruta: /app/api/gemini/meal/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSingleMealPrompt, singleMealZod, coercePlannedMeal } from '@/lib/prompts/argentineMealPrompts';
import { getCached, setCached } from '@/lib/utils/aiCache';
import { hashString } from '@/lib/utils/hash';

export const dynamic = 'force-dynamic';

const extractJson = (t: string) => {
  const s = t.trim();
  try {
    if (s.startsWith('{')) return JSON.parse(s);
    const m = s.match(/```json\s*([\s\S]*?)```/i) || s.match(/```\s*([\s\S]*?)```/i);
    if (m?.[1]) return JSON.parse(m[1]);
    return JSON.parse(s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
  } catch { throw new Error('Formato no JSON'); }
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = getSingleMealPrompt(body);
  const key = await hashString(`meal:${prompt}`);
  const cached = await getCached(key);
  if (cached?.meal) return NextResponse.json({ meal: cached.meal });

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }]}], generationConfig: { temperature: 0.75, maxOutputTokens: 2048, responseMimeType: 'application/json' } });
    const json = extractJson(result.response.text());
    const parsed = singleMealZod.safeParse(json);
    const meal = parsed.success ? parsed.data.meal : coercePlannedMeal(json.meal);
    await setCached(key, { meal }, 3);
    return NextResponse.json({ meal });
  } catch {
    return NextResponse.json({ error: 'Gemini error' }, { status: 502 });
  }
}
```

Ruta: /app/api/gemini/alternatives/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAlternativesPrompt, alternativesZod } from '@/lib/prompts/argentineMealPrompts';
import { getCached, setCached } from '@/lib/utils/aiCache';
import { hashString } from '@/lib/utils/hash';

export const dynamic = 'force-dynamic';

const extractJson = (t: string) => {
  const s = t.trim();
  try {
    if (s.startsWith('{') || s.startsWith('[')) return JSON.parse(s);
    const m = s.match(/```json\s*([\s\S]*?)```/i) || s.match(/```\s*([\s\S]*?)```/i);
    if (m?.[1]) return JSON.parse(m[1]);
    return JSON.parse(s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
  } catch { throw new Error('Formato no JSON'); }
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = getAlternativesPrompt(body);
  const key = await hashString(`alts:${prompt}`);
  const cached = await getCached(key);
  if (cached?.alternatives) return NextResponse.json({ alternatives: cached.alternatives });

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }]}], generationConfig: { temperature: 0.7, maxOutputTokens: 2048, responseMimeType: 'application/json' } });
    const json = extractJson(result.response.text());
    const parsed = alternativesZod.safeParse(json);
    const alternatives = parsed.success ? parsed.data.alternatives : (json.alternatives ?? []);
    await setCached(key, { alternatives }, 3);
    return NextResponse.json({ alternatives });
  } catch {
    return NextResponse.json({ error: 'Gemini error' }, { status: 502 });
  }
}
```

10) Librería de recetas extendida
Ruta: /features/meal-planning/recipesLibrary.ts (agregar al final los nuevos IDs usados por sustituciones)

```ts
// ... recetas existentes
export const recipesLibrary: Recipe[] = [
  // ... existentes...
  {
    id: 'pollo-al-horno-economico',
    name: 'Pollo al horno con papas',
    ingredients: [
      { name: 'Muslos de pollo', amount: 1000, unit: 'g', aisle: 'carniceria' },
      { name: 'Papa', amount: 1000, unit: 'g', aisle: 'verduleria' },
      { name: 'Ajo', amount: 2, unit: 'u', aisle: 'verduleria' },
      { name: 'Aceite', amount: 30, unit: 'ml', aisle: 'almacen' }
    ],
    instructions: ['Hornear pollo con papas, ajo y aceite hasta dorar'],
    prepTime: 10, cookTime: 50, servings: 4,
    nutrition: { calories: 650, protein: 45, carbs: 40, fat: 30 },
    tags: ['economico','cena']
  },
  {
    id: 'albondigas-economicas',
    name: 'Albóndigas con arroz',
    ingredients: [
      { name: 'Carne picada común', amount: 500, unit: 'g', aisle: 'carniceria' },
      { name: 'Arroz', amount: 300, unit: 'g', aisle: 'almacen' },
      { name: 'Salsa de tomate', amount: 400, unit: 'g', aisle: 'almacen' },
      { name: 'Cebolla', amount: 1, unit: 'u', aisle: 'verduleria' }
    ],
    instructions: ['Armar albóndigas, dorar y salsear. Servir con arroz.'],
    prepTime: 20, cookTime: 30, servings: 4,
    nutrition: { calories: 620, protein: 32, carbs: 70, fat: 20 },
    tags: ['economico','almuerzo']
  }
];
```

11) Nuevos componentes UI

11.1 CalendarExportButton
Ruta: /components/meal-planning/CalendarExportButton.tsx

```tsx
'use client';
import React from 'react';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';

export const CalendarExportButton: React.FC = () => {
  const { plan, actions } = useMealPlanning();
  const onExport = () => {
    if (!plan) return;
    const ics = actions.exportICS();
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KeCarajoComer-${plan.weekStart}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={onExport} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg hover:bg-white/15">
      Exportar Calendario (.ics)
    </button>
  );
};
```

11.2 BudgetBar
Ruta: /components/meal-planning/BudgetBar.tsx

```tsx
'use client';
import React, { useEffect } from 'react';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';

export const BudgetBar: React.FC = () => {
  const { budgetEstimate, actions, plan, priceCatalog, mode, shoppingList, currentWeek, } = useMealPlanning();

  useEffect(() => {
    actions.estimateBudget();
  }, [plan, priceCatalog, actions]);

  const budget = budgetEstimate;
  const weeklyBudget = budget?.varianceToBudget !== undefined ? (budget.estimatedTotalARS - budget.toBuyARS + budget.varianceToBudget) : 0;
  const target = weeklyBudget + (budget?.toBuyARS ?? 0);
  const toBuy = budget?.toBuyARS ?? 0;
  const desired = target || 1;
  const pct = Math.max(0, Math.min(100, Math.round((toBuy / desired) * 100)));
  const over = budget ? budget.varianceToBudget < 0 : false;

  return (
    <div className="rounded-3xl p-4 bg-white/10 border border-white/20 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/70">Semana {currentWeek.weekLabel} — Modo {mode}</div>
          <div className="text-xl font-semibold">A comprar: {toBuy.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</div>
        </div>
        <div className={`text-right ${over ? 'text-red-300' : 'text-emerald-300'}`}>
          {over ? 'Sobre presupuesto' : 'Dentro de presupuesto'}
        </div>
      </div>
      <div className="mt-3 w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
        <div className={`h-3 rounded-full ${over ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={actions.estimateBudget} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm">Recalcular</button>
        <button onClick={async () => { const { applied } = await actions.optimizeForBudget(); if (applied > 0) actions.estimateBudget(); }} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm">
          Optimizar (sustituciones)
        </button>
        <button onClick={async () => { const injected = await actions.injectLeftovers(); if (injected > 0) actions.estimateBudget(); }} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm">
          Usar sobras
        </button>
      </div>
    </div>
  );
};
```

11.3 PantryExpiry
Ruta: /components/meal-planning/PantryExpiry.tsx

```tsx
'use client';
import React from 'react';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';

export const PantryExpiry: React.FC = () => {
  const { expiringItems, actions } = useMealPlanning();

  if (expiringItems.length === 0) return null;
  return (
    <div className="rounded-3xl p-4 bg-white/10 border border-white/20 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">🧾 Por vencer en 3 días</h3>
        <button onClick={actions.prioritizeExpiring} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm">
          Priorizar en el plan
        </button>
      </div>
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {expiringItems.map(p => (
          <li key={p.id} className="rounded-2xl p-3 bg-white/8 border border-white/15">
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-white/70">{p.amount ? `${p.amount} ${p.unit ?? ''}` : ''} {p.expires_at ? `· Vence ${new Date(p.expires_at).toLocaleDateString('es-AR')}` : ''}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

12) Integración en la página
Ruta: /app/(app)/planificador/page.tsx

```tsx
'use client';

import React from 'react';
import { MealPlannerGrid } from '@/components/meal-planning/MealPlannerGrid';
import { BudgetBar } from '@/components/meal-planning/BudgetBar';
import { PantryExpiry } from '@/components/meal-planning/PantryExpiry';
import { CalendarExportButton } from '@/components/meal-planning/CalendarExportButton';

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">KeCarajoComer</h1>
          <CalendarExportButton />
        </div>
        <BudgetBar />
        <PantryExpiry />
        <MealPlannerGrid />
      </div>
    </main>
  );
}
```

13) SQL: nuevas tablas y RLS
Ejecutá en Supabase:

```sql
-- AI cache
create table if not exists ai_cache (
  key text primary key,
  value jsonb not null,
  expires_at timestamptz,
  updated_at timestamptz default now()
);

-- Catálogo de precios
create table if not exists price_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null check (unit in ('kg','l','u')),
  price_ars numeric not null,
  region text not null default 'Argentina',
  updated_at timestamptz default now()
);
create index if not exists price_catalog_name_region_idx on price_catalog (name, region);

-- Taste events (opcional futuro)
create table if not exists taste_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  recipe_name text not null,
  action text not null check (action in ('accept','reject')),
  created_at timestamptz default now()
);

-- RLS
alter table meal_plans enable row level security;
alter table user_preferences enable row level security;
alter table pantry_items enable row level security;
alter table price_catalog enable row level security;
alter table ai_cache enable row level security;

create policy "meal_plans_owner" on meal_plans
  for select using (auth.uid() = user_id or is_public = true)
  with check (auth.uid() = user_id);

create policy "user_prefs_owner" on user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pantry_owner" on pantry_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "price_catalog_public_read" on price_catalog for select using (true);

create policy "ai_cache_public_read" on ai_cache for select using (true);
create policy "ai_cache_upsert_service" on ai_cache for insert with check (true);

-- Seeds opcionales
insert into price_catalog (name, unit, price_ars, region) values
  ('yerba mate','kg', 4200, 'Argentina'),
  ('pan','kg', 1500, 'Argentina'),
  ('nalga','kg', 6800, 'Argentina'),
  ('vacío','kg', 7800, 'Argentina'),
  ('pollo','kg', 3600, 'Argentina'),
  ('papa','kg', 800, 'Argentina')
on conflict do nothing;
```

14) Tests nuevos

14.1 Ruta: /tests/unit/pricing.test.ts

```ts
import { describe, it, expect } from 'vitest';
import { estimateWeeklyBudget } from '@/lib/utils/pricing';
import type { MealPlan, PriceCatalogItem } from '@/features/meal-planning/types';

describe('pricing', () => {
  it('estimates budget and toBuy', () => {
    const plan: MealPlan = {
      userId: 'u',
      weekStart: '2024-06-03',
      weekEnd: '2024-06-09',
      days: [
        {
          date: '2024-06-03',
          weekday: 1,
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: { id: 'mate', name: 'Mate', ingredients: [{ name: 'Yerba mate', amount: 100, unit: 'g', aisle: 'almacen' }], instructions: [], prepTime: 1, cookTime: 0, servings: 2, nutrition: { calories: 10, protein: 0, carbs: 0, fat: 0 } } },
            lunch: { slot: 'lunch', time: '13:00', recipe: { id: 'mila', name: 'Milanesas', ingredients: [{ name: 'Nalga', amount: 500, unit: 'g', aisle: 'carniceria' }], instructions: [], prepTime: 1, cookTime: 1, servings: 2, nutrition: { calories: 500, protein: 30, carbs: 20, fat: 20 } } },
            snack: { slot: 'snack', time: '17:30', recipe: { id: 'mer', name: 'Mate', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'pizza', name: 'Pizza', ingredients: [], instructions: [], prepTime: 1, cookTime: 1, servings: 2, nutrition: { calories: 400, protein: 10, carbs: 50, fat: 10 } } }
          }
        },
        ...Array.from({ length: 6 }).map((_, i) => ({
          date: `2024-06-0${4 + i}`,
          weekday: 2 + i,
          meals: { breakfast: { slot: 'breakfast', time: '08:00', recipe: { id: 'b', name: 'Café', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }, lunch: { slot: 'lunch', time: '13:00', recipe: { id: 'x', name: 'X', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }, snack: { slot: 'snack', time: '17:30', recipe: { id: 'y', name: 'Y', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }, dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'z', name: 'Z', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } } }
        }))
      ]
    };

    const catalog: PriceCatalogItem[] = [
      { id: 'yerba', name: 'yerba mate', unit: 'kg', price_ars: 4200, updated_at: new Date().toISOString(), region: 'Argentina' },
      { id: 'nalga', name: 'nalga', unit: 'kg', price_ars: 6800, updated_at: new Date().toISOString(), region: 'Argentina' }
    ];

    const out = estimateWeeklyBudget(plan, [], catalog);
    expect(out.estimatedTotalARS).toBeGreaterThan(0);
    expect(out.toBuyARS).toBeGreaterThan(0);
  });
});
```

14.2 Ruta: /tests/unit/ics.test.ts

```ts
import { describe, it, expect } from 'vitest';
import { buildICS } from '@/lib/utils/ics';
import type { MealPlan } from '@/features/meal-planning/types';

describe('ics', () => {
  it('builds a VCALENDAR', () => {
    const plan: MealPlan = {
      userId: 'u',
      weekStart: '2024-06-03',
      weekEnd: '2024-06-09',
      days: [
        {
          date: '2024-06-03',
          weekday: 1,
          meals: {
            breakfast: { slot: 'breakfast', time: '08:00', recipe: { id: '1', name: 'Mate', ingredients: [], instructions: ['Paso'], prepTime: 1, cookTime: 0, servings: 1, nutrition: { calories: 10, protein: 0, carbs: 0, fat: 0 } } },
            lunch: { slot: 'lunch', time: '13:00', recipe: { id: '2', name: 'Mila', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            snack: { slot: 'snack', time: '17:30', recipe: { id: '3', name: 'Mate', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } },
            dinner: { slot: 'dinner', time: '21:30', recipe: { id: '4', name: 'Pizza', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }
          }
        },
        ...Array.from({ length: 6 }).map((_, i) => ({
          date: `2024-06-0${4 + i}`,
          weekday: 2 + i,
          meals: { breakfast: { slot: 'breakfast', time: '08:00', recipe: { id: 'b', name: 'Café', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }, lunch: { slot: 'lunch', time: '13:00', recipe: { id: 'x', name: 'X', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }, snack: { slot: 'snack', time: '17:30', recipe: { id: 'y', name: 'Y', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } }, dinner: { slot: 'dinner', time: '21:30', recipe: { id: 'z', name: 'Z', ingredients: [], instructions: [], prepTime: 0, cookTime: 0, servings: 1, nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 } } } }
        }))
      ]
    };
    const ics = buildICS(plan);
    expect(ics.includes('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.includes('BEGIN:VEVENT')).toBe(true);
  });
});
```

15) Pequeñas mejoras a la UI existente
- En tu MealPlannerGrid ya hay botones de Cargar/Generar/Guardar.
- Con los nuevos componentes, el usuario ve presupuesto, vencimientos y puede exportar calendario.
- Drag-and-drop lo podés mantener como antes si lo agregaste; estas mejoras no lo rompen.

16) Performance y resiliencia
- Caching IA por 3 días en Supabase para bajar costos.
- Parser robusto del JSON de Gemini.
- Realtime para plan, despensa y catálogo de precios.
- Estimación de presupuesto con memoización en hook y recalculado sólo cuando cambia plan/pantry/catalog.

Con esto, subimos la vara: la app entiende estación, región, bolsillo argentino, usa lo que ya tenés en casa, programa sobras, exporta a tu calendario y cuida tus tokens de IA. Si querés, el próximo sprint le metemos OCR de tickets y notificaciones push para “productos por vencer”. ¿Vamos por eso? 🇦🇷🚀🔥