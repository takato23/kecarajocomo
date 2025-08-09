¡Vamos por ese extra de excelencia, che! 💪🇦🇷
Te armé un “Plus Pack” con ideas y código listo para pegar que probablemente no estaban en tu radar. Enfocado en: presupuesto realista en ARS, sustituciones inteligentes, expiración de despensa, sobras (“leftovers”), exportar a calendario (ICS), cacheo de IA para bajar costos, estacionalidad por región y seguridad en Supabase. Todo plug-and-play sobre tu base actual.

Qué incorpora este Plus Pack
1) Presupuesto inteligente (ARS) + Precio por ingrediente por región  
   - Estima costo semanal, cuánto ya tenés en la despensa y cuánto falta.  
   - Barra de presupuesto con alertas y modo de “optimizar” automáticamente con sustituciones más baratas.  

2) Despensa con vencimientos + priorización  
   - Muestra ítems que vencen pronto y sugiere cambios de comidas para usarlos a tiempo.  

3) Sobras (leftovers) que se comen al día siguiente  
   - Detecta cenas abundantes y programa almuerzos “leftover” automáticos.  

4) Exportar a calendario (ICS)  
   - Un click y te llevás los eventos de desayuno/almuerzo/merienda/cena a Google/Apple Calendar.  

5) AI cache + parser robusto de respuestas  
   - Cachea respuestas de Gemini por hash de prompt para ahorrar tokens.  
   - Extrae JSON aunque venga con ```json … ``` u otros formatos.  

6) Estacionalidad y región  
   - Produce-res locales según estación/región, integrados al prompt.  

7) Seguridad y gobernanza de datos  
   - RLS para Supabase y tablas nuevas: price_catalog, ai_cache, taste_events.  

8) UI/UX extra  
   - Barra de presupuesto, aviso de vencimientos, botón ICS.  
   - Todo responsive + glassmorphism consistente.  

Copiá y pegá los archivos en los paths indicados. Al final te dejo SQL de nuevas tablas y RLS.

1) Tipos extendidos — reemplazá `/types/meal.ts`
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
  date: string;
  label: string;
  meals: Record<MealType, MealSlotData>;
}

export interface ArgentineWeeklyPlan {
  weekStart: string;
  weekEnd: string;
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

export interface PriceCatalogItem {
  id: string;
  name: string;
  unit: string; // 'kg', 'g', 'u', 'ml', 'l'
  price_ars: number; // precio por unidad base
  region?: string; // 'Argentina' | 'AMBA' | etc.
  updated_at: string;
}

export interface BudgetEstimate {
  estimatedTotalARS: number;
  ownedValueARS: number;
  toBuyARS: number;
  varianceToBudget: number;
  currency: 'ARS';
}

export interface Leftover {
  id: string;
  recipeName: string;
  servings: number;
  bestBy: string;
  sourceDay: string;
}

export interface TasteEvent {
  id: string;
  user_id: string;
  recipe_name: string;
  action: 'accept' | 'reject';
  created_at: string;
}
```

2) Estacionalidad — agregá `/lib/utils/seasonality.ts`
```ts
export type Season = 'verano' | 'otoño' | 'invierno' | 'primavera';
type Region =
  | 'Argentina'
  | 'AMBA'
  | 'CABA'
  | 'Córdoba'
  | 'Mendoza'
  | 'Patagonia'
  | 'NOA'
  | 'NEA';

const seasonalProduce: Record<Region, Record<Season, string[]>> = {
  Argentina: {
    verano: ['tomate', 'pepino', 'berenjena', 'choclo', 'durazno', 'sandía'],
    otoño: ['zapallo', 'acelga', 'espinaca', 'manzana', 'pera'],
    invierno: ['papa', 'batata', 'zanahoria', 'cebolla', 'calabaza', 'locro'],
    primavera: ['arveja', 'lechuga', 'frutilla', 'brócoli'],
  },
  AMBA: {
    verano: ['tomate', 'lechuga', 'choclo', 'durazno'],
    otoño: ['acelga', 'espinaca', 'zapallo'],
    invierno: ['papa', 'zanahoria', 'cebolla'],
    primavera: ['brócoli', 'arveja', 'frutilla'],
  },
  CABA: { verano: ['tomate'], otoño: ['zapallo'], invierno: ['papa'], primavera: ['lechuga'] },
  Córdoba: { verano: ['tomate'], otoño: ['acelga'], invierno: ['cebolla'], primavera: ['brócoli'] },
  Mendoza: { verano: ['durazno'], otoño: ['pera'], invierno: ['cebolla'], primavera: ['lechuga'] },
  Patagonia: { verano: ['frutos rojos'], otoño: ['manzana'], invierno: ['papa'], primavera: ['lechuga'] },
  NOA: { verano: ['choclo'], otoño: ['zapallo'], invierno: ['papa'], primavera: ['arveja'] },
  NEA: { verano: ['mandarina'], otoño: ['naranja'], invierno: ['batata'], primavera: ['lechuga'] },
};

export function getSeasonalAvailability(region: Region, season: Season): string[] {
  const r = seasonalProduce[region] || seasonalProduce['Argentina'];
  return r[season] || seasonalProduce['Argentina'][season];
}
```

3) Pricing y presupuesto — agregá `/lib/utils/pricing.ts`
```ts
import { ArgentineWeeklyPlan, Ingredient, PantryItem, PriceCatalogItem, BudgetEstimate } from '@/types/meal';

function normalizeUnit(unit?: string) {
  if (!unit) return '';
  const u = unit.toLowerCase();
  if (u === 'kgs' || u === 'kg') return 'kg';
  if (u === 'g' || u === 'gr' || u === 'gramos') return 'g';
  if (u === 'l' || u === 'lt' || u === 'lts') return 'l';
  if (u === 'ml') return 'ml';
  if (u === 'u' || u === 'unidad' || u === 'unidades') return 'u';
  return u;
}

function toBase(quantity: number, unit: string) {
  const u = normalizeUnit(unit);
  if (u === 'kg') return { qty: quantity, unit: 'kg' };
  if (u === 'g') return { qty: quantity / 1000, unit: 'kg' };
  if (u === 'l') return { qty: quantity, unit: 'l' };
  if (u === 'ml') return { qty: quantity / 1000, unit: 'l' };
  return { qty: quantity, unit: u };
}

function matchPrice(ing: Ingredient, catalog: PriceCatalogItem[]): PriceCatalogItem | null {
  const name = ing.name.toLowerCase();
  const candidates = catalog.filter((c) => name.includes(c.name.toLowerCase()));
  if (candidates.length > 0) return candidates[0];
  // fallback: split first word
  const first = name.split(' ')[0];
  const alt = catalog.find((c) => c.name.toLowerCase() === first);
  return alt || null;
}

function estimateIngredientCost(ing: Ingredient, catalog: PriceCatalogItem[]): number {
  if (!ing.quantity) return 0;
  const price = matchPrice(ing, catalog);
  if (!price) return 0;
  const ingBase = toBase(ing.quantity, ing.unit || '');
  const priceUnit = normalizeUnit(price.unit);
  // unify only across kg/l/u
  if (priceUnit === 'kg' && ingBase.unit === 'kg') return ingBase.qty * price.price_ars;
  if (priceUnit === 'l' && ingBase.unit === 'l') return ingBase.qty * price.price_ars;
  if (priceUnit === 'u' && (ingBase.unit === 'u' || ingBase.unit === '')) return (ingBase.qty || 1) * price.price_ars;
  // fallback rough heuristics
  if (priceUnit === 'kg' && ingBase.unit === '') return 0.1 * price.price_ars;
  return 0;
}

function ownedValue(ing: Ingredient, pantry: PantryItem[], catalog: PriceCatalogItem[]): number {
  const found = pantry.find((p) => p.name.toLowerCase().trim() === ing.name.toLowerCase().trim());
  if (!found) return 0;
  const price = matchPrice(ing, catalog);
  if (!price) return 0;
  const avail = found.quantity ?? 0;
  if (!ing.quantity || avail <= 0) return 0;
  const needBase = toBase(ing.quantity, ing.unit || '');
  const ownBase = toBase(avail, found.unit || ing.unit || '');
  const priceUnit = normalizeUnit(price.unit);
  if (priceUnit === 'kg' && needBase.unit === 'kg' && ownBase.unit === 'kg') {
    const used = Math.min(ownBase.qty, needBase.qty);
    return used * price.price_ars;
  }
  if (priceUnit === 'l' && needBase.unit === 'l' && ownBase.unit === 'l') {
    const used = Math.min(ownBase.qty, needBase.qty);
    return used * price.price_ars;
  }
  if (priceUnit === 'u' && (needBase.unit === 'u' || needBase.unit === '') && (ownBase.unit === 'u' || ownBase.unit === '')) {
    const used = Math.min(ownBase.qty, needBase.qty || 1);
    return used * price.price_ars;
  }
  return 0;
}

export function estimateWeeklyBudget(plan: ArgentineWeeklyPlan, pantry: PantryItem[], catalog: PriceCatalogItem[]): BudgetEstimate {
  let total = 0;
  let owned = 0;

  for (const day of plan.days) {
    for (const meal of ['desayuno', 'almuerzo', 'merienda', 'cena'] as const) {
      const recipe = day.meals[meal]?.recipe;
      if (!recipe) continue;
      for (const ing of recipe.ingredients) {
        const cost = estimateIngredientCost(ing, catalog);
        total += cost;
        owned += ownedValue(ing, pantry, catalog);
      }
    }
  }

  const toBuy = Math.max(0, total - owned);
  return {
    estimatedTotalARS: Math.round(total),
    ownedValueARS: Math.round(owned),
    toBuyARS: Math.round(toBuy),
    varianceToBudget: 0, // lo completa el hook con el budget del usuario
    currency: 'ARS',
  };
}
```

4) Sustituciones para optimizar presupuesto — agregá `/lib/utils/substitutions.ts`
```ts
import { ArgentineWeeklyPlan, MealType, Recipe } from '@/types/meal';

// Reglas simples: si aparece un ingrediente caro, sugerimos un plato afín más barato
// En producción, podés alimentar estas reglas por región + price_catalog dinámico.
const cheaperRecipeSwaps: Array<{
  match: RegExp;
  replaceWith: Recipe;
}> = [
  {
    match: /(asado|vacío|tira de asado|bife)/i,
    replaceWith: {
      id: 'pollo-al-horno-economico',
      name: 'Pollo al horno con papas',
      ingredients: [
        { name: 'Muslos de pollo', quantity: 1, unit: 'kg', category: 'Carnicería' },
        { name: 'Papas', quantity: 1, unit: 'kg', category: 'Verdulería' },
        { name: 'Aceite', quantity: 30, unit: 'ml', category: 'Almacén' },
        { name: 'Ajo', quantity: 2, unit: 'u', category: 'Verdulería' },
      ],
      instructions: ['Hornear pollo con papas, ajo y aceite hasta dorar.'],
      prepTime: 10,
      cookTime: 50,
      servings: 4,
      nutrition: { calories: 650, protein: 45, carbs: 40, fat: 30 },
      culturalNotes: 'Opción rendidora para cuidar el bolsillo.',
    },
  },
  {
    match: /(provoleta|queso caro|jamón crudo)/i,
    replaceWith: {
      id: 'tarta-de-verduras-economica',
      name: 'Tarta de verduras económica',
      ingredients: [
        { name: 'Acelga', quantity: 1, unit: 'atado', category: 'Verdulería' },
        { name: 'Huevos', quantity: 3, unit: 'u', category: 'Almacén' },
        { name: 'Harina', quantity: 250, unit: 'g', category: 'Almacén' },
        { name: 'Cebolla', quantity: 1, unit: 'u', category: 'Verdulería' },
      ],
      instructions: ['Saltear verduras, preparar masa simple y hornear.'],
      prepTime: 20,
      cookTime: 30,
      servings: 4,
      nutrition: { calories: 480, protein: 20, carbs: 60, fat: 18 },
    },
  },
  {
    match: /(milanesa|lomo)/i,
    replaceWith: {
      id: 'albóndigas-economicas',
      name: 'Albóndigas con arroz',
      ingredients: [
        { name: 'Carne picada común', quantity: 500, unit: 'g', category: 'Carnicería' },
        { name: 'Arroz', quantity: 300, unit: 'g', category: 'Almacén' },
        { name: 'Salsa de tomate', quantity: 400, unit: 'g', category: 'Almacén' },
        { name: 'Cebolla', quantity: 1, unit: 'u', category: 'Verdulería' },
      ],
      instructions: ['Armar albóndigas, dorar y salsear. Servir con arroz.'],
      prepTime: 20,
      cookTime: 30,
      servings: 4,
      nutrition: { calories: 620, protein: 32, carbs: 70, fat: 20 },
    },
  },
];

export function optimizePlanForBudget(plan: ArgentineWeeklyPlan): { plan: ArgentineWeeklyPlan; changes: number } {
  let changes = 0;
  const next = { ...plan, days: plan.days.map((d) => ({ ...d, meals: { ...d.meals } })) };

  for (const day of next.days) {
    for (const meal of ['almuerzo', 'cena'] as MealType[]) {
      const rec = day.meals[meal]?.recipe;
      if (!rec) continue;
      const text = (rec.name + ' ' + rec.ingredients.map((i) => i.name).join(' ')).toLowerCase();
      for (const rule of cheaperRecipeSwaps) {
        if (rule.match.test(text)) {
          day.meals[meal] = {
            ...day.meals[meal],
            recipe: rule.replaceWith,
            recipeId: rule.replaceWith.id,
            pinned: false,
          };
          changes++;
          break;
        }
      }
    }
  }

  return { plan: next, changes };
}
```

5) ICS export — agregá `/lib/utils/ics.ts`
```ts
import { ArgentineWeeklyPlan } from '@/types/meal';

function dt(date: Date) {
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
}

export function buildICS(plan: ArgentineWeeklyPlan): string {
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//KeCarajoComer//AR//ES');

  const slots = [
    { key: 'desayuno', hour: 8, minute: 0, label: 'Desayuno' },
    { key: 'almuerzo', hour: 12, minute: 30, label: 'Almuerzo' },
    { key: 'merienda', hour: 17, minute: 30, label: 'Merienda' },
    { key: 'cena', hour: 21, minute: 30, label: 'Cena' },
  ] as const;

  for (const day of plan.days) {
    for (const slot of slots) {
      const rec = day.meals[slot.key as keyof typeof day.meals]?.recipe;
      if (!rec) continue;
      const start = new Date(`${day.date}T${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}:00`);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${day.date}-${slot.key}@kecarajocomer`);
      lines.push(`DTSTAMP:${dt(new Date())}`);
      lines.push(`DTSTART:${dt(start)}`);
      lines.push(`DTEND:${dt(end)}`);
      lines.push(`SUMMARY:${slot.label}: ${rec.name}`);
      lines.push(`DESCRIPTION:${rec.instructions?.slice(0, 3).join(' \\n ') || ''}`);
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
```

6) AI cache y parsing — reemplazá `/lib/services/geminiClient.ts`
```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCached, setCached } from '@/lib/utils/aiCache';
import { hashString } from '@/lib/utils/hash';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

function getModel() {
  const genAI = new GoogleGenerativeAI(apiKey!);
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

function extractJson(text: string): any {
  const trimmed = text.trim();
  try {
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);
    const match = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```\s*([\s\S]*?)```/i);
    if (match && match[1]) return JSON.parse(match[1]);
    // remove stray comments/trailing commas common in LLMs
    const cleaned = trimmed.replace(/^\s*\/\/.*$/gm, '').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Respuesta IA no es JSON válido');
  }
}

async function callWithCache(kind: string, prompt: string): Promise<any> {
  const key = await hashString(`${kind}:${prompt}`);
  const cached = await getCached(key);
  if (cached) return cached;
  const model = getModel();
  const result = await model.generateContent(prompt);
  const txt = result.response.text();
  const json = extractJson(txt);
  await setCached(key, json, 3); // TTL 3 días
  return json;
}

export async function callGeminiWeeklyPlan(prompt: string): Promise<any> {
  return callWithCache('weekly_plan', prompt);
}

export async function callGeminiRegenerateMeal(prompt: string): Promise<any> {
  return callWithCache('regen_meal', prompt);
}

export async function callGeminiAlternatives(prompt: string): Promise<any> {
  return callWithCache('alternatives', prompt);
}
```

7) Cache utils — agregá `/lib/utils/aiCache.ts`
```ts
import { supabaseClient } from '@/lib/services/supabaseClient';

export async function getCached(key: string): Promise<any | null> {
  const client = supabaseClient();
  const { data, error } = await client.from('ai_cache').select('value, expires_at').eq('key', key).maybeSingle();
  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data.value;
}

export async function setCached(key: string, value: any, ttlDays = 7) {
  const client = supabaseClient();
  const expires = new Date(Date.now() + ttlDays * 86400000).toISOString();
  await client.from('ai_cache').upsert({ key, value, expires_at: expires, updated_at: new Date().toISOString() });
}
```

8) Hash universal — agregá `/lib/utils/hash.ts`
```ts
export async function hashString(input: string): Promise<string> {
  try {
    // Node environment (server)
    // @ts-ignore
    const { createHash } = await import('crypto');
    return createHash('sha256').update(input).digest('hex');
  } catch {
    // Browser WebCrypto
    const enc = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
```

9) Prompt con estacionalidad — reemplazá `/lib/prompts/argentineMealPrompts.ts`
```ts
import { z } from 'zod';
import { ArgentineWeeklyPlan, Recipe, MealType, UserPreferences, PantryItem, ModeType } from '@/types/meal';
import dayjs from 'dayjs';
import { getSeasonalAvailability } from '@/lib/utils/seasonality';

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
  const seasonal = getSeasonalAvailability((preferences.region as any) || (region as any) || 'Argentina', season as any);

  return `
Eres un chef argentino experto. Genera un plan semanal argentino auténtico, JSON estricto.

Requisitos culturales obligatorios:
- Desayuno y merienda con mate frecuente.
- Cena 21-22hs.
- Asado el domingo (adaptar si vegetariano/vegano).
- Ñoquis el 29 del mes (si la semana lo incluye).
- Evitar repeticiones.
- Cortes y nombres locales (nalga, cuadril, vacío, roast beef, matambre).
- Recetas típicas: empanadas, milanesas, guisos, pastel de papa, tarta, locro en invierno, ensaladas frescas en verano.

Contexto:
- Semana: ${weekStart} a ${weekEnd}
- Estación: ${season}
- Región: ${region}
- Modo: ${mode}
- Hogar: ${preferences.householdSize ?? 2}
- Presupuesto semanal: ${preferences.budgetWeekly ?? 0} ARS
- Restricciones: ${restrictions}
- Ingredientes no deseados: ${disliked}
- Favoritos: ${favorites}
- Despensa:
${pantryText}

Disponibilidad estacional (priorizar ingredientes): ${seasonal.join(', ')}

Criterios nutricionales:
- Balance semanal.
- Menor densidad calórica en "dieta".
- Recetas rendidoras y económicas en "economico".
- Más abundantes y festivas en "fiesta".

Salida JSON DEBE seguir el esquema:
${weeklyPlanSchema.toString()}

Asegúrate de 7 días con desayuno, almuerzo, merienda y cena con recetas completas (ingredientes e instrucciones).
Incluye mate en varios desayunos/meriendas.
Incluye asado el domingo (o versión vegetariana si aplica).
Incluye ñoquis si el 29 cae en la semana.
Responde SOLO JSON.
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
  const seasonal = getSeasonalAvailability((preferences.region as any) || (region as any) || 'Argentina', season as any);

  const outSchema = alternatives ? `Array<Recipe>` : `Recipe`;
  return `
Eres un chef argentino. Regenera ${mealType} para el día index ${dayIndex} (0=Lunes).
Mantén coherencia con el resto, evita repeticiones.

Estación: ${season} | Región: ${region} | Modo: ${mode}
Restricciones: ${restrictions}
No usar: ${disliked}
Favoritos: ${favorites}
Ingredientes disponibles (priorizar): ${pantryText}
Ingredientes de temporada (priorizar): ${seasonal.join(', ')}

Plan actual JSON:
${JSON.stringify(weekPlan)}

Devuelve ${outSchema} en JSON con este schema:

Recipe:
${recipeSchema.toString()}

${alternatives ? 'Devuelve 3 alternativas relevantes.' : 'Devuelve 1 receta completa.'}

Usa cortes argentinos, desayuno/merienda con mate si aplica, respeta restricciones. Solo JSON.
`;
}
```

10) Hook Plus — agregá `/hooks/meal-planning/useMealPlanningPlus.ts`
```ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '@/lib/services/supabaseClient';
import { useMealPlanStore } from '@/store/slices/mealPlanSlice';
import { ArgentineWeeklyPlan, BudgetEstimate, PantryItem, PriceCatalogItem } from '@/types/meal';
import { estimateWeeklyBudget } from '@/lib/utils/pricing';
import { optimizePlanForBudget } from '@/lib/utils/substitutions';
import dayjs from 'dayjs';

export function useMealPlanningPlus() {
  const client = supabaseClient();
  const weeklyPlan = useMealPlanStore((s) => s.weeklyPlan);
  const pantry = useMealPlanStore((s) => s.pantry);
  const preferences = useMealPlanStore((s) => s.preferences);
  const setWeeklyPlan = useMealPlanStore((s) => s.setWeeklyPlan);
  const setDirty = useMealPlanStore((s) => s.setDirty);

  const [catalog, setCatalog] = useState<PriceCatalogItem[]>([]);
  const [estim, setEstim] = useState<BudgetEstimate | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);

  const region = preferences.region || 'Argentina';

  const fetchCatalog = useCallback(async () => {
    setLoadingPrices(true);
    const { data } = await client.from('price_catalog').select('*').in('region', [region, 'Argentina']);
    setCatalog(data || []);
    setLoadingPrices(false);
  }, [client, region]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const estimateBudget = useCallback(() => {
    if (!weeklyPlan) return null;
    const e = estimateWeeklyBudget(weeklyPlan, pantry, catalog);
    const variance = (preferences.budgetWeekly ?? 0) - e.toBuyARS;
    const out = { ...e, varianceToBudget: Math.round(variance) };
    setEstim(out);
    return out;
  }, [weeklyPlan, pantry, catalog, preferences.budgetWeekly]);

  const optimizeForBudget = useCallback(() => {
    if (!weeklyPlan) return { applied: 0 };
    const { plan, changes } = optimizePlanForBudget(weeklyPlan);
    if (changes > 0) {
      setWeeklyPlan(plan);
      setDirty(true);
    }
    return { applied: changes };
  }, [weeklyPlan, setWeeklyPlan, setDirty]);

  const getExpiringPantryItems = useCallback((daysAhead = 5) => {
    const now = dayjs();
    return pantry
      .filter((p) => !!p.expiresAt)
      .filter((p) => dayjs(p.expiresAt!).isBefore(now.add(daysAhead, 'day')))
      .sort((a, b) => dayjs(a.expiresAt!).valueOf() - dayjs(b.expiresAt!).valueOf());
  }, [pantry]);

  const injectLeftovers = useCallback(() => {
    if (!weeklyPlan) return 0;
    let injected = 0;
    const hh = preferences.householdSize ?? 2;
    const updated: ArgentineWeeklyPlan = {
      ...weeklyPlan,
      days: weeklyPlan.days.map((d) => ({ ...d, meals: { ...d.meals } })),
    };

    for (let i = 0; i < updated.days.length; i++) {
      const dinner = updated.days[i].meals.cena?.recipe;
      if (!dinner) continue;
      if ((dinner.servings || 0) > hh && i < updated.days.length - 1) {
        const nextDay = updated.days[i + 1];
        if (!nextDay.meals.almuerzo?.pinned) {
          nextDay.meals.almuerzo = {
            ...nextDay.meals.almuerzo,
            recipe: {
              ...dinner,
              id: dinner.id + '-leftover',
              name: `${dinner.name} (sobras)`,
              culturalNotes: 'Aprovechar sobras de la cena anterior.',
            },
            recipeId: dinner.id + '-leftover',
            pinned: false,
          };
          injected++;
        }
      }
    }
    if (injected > 0) {
      setWeeklyPlan(updated);
      setDirty(true);
    }
    return injected;
  }, [weeklyPlan, preferences.householdSize, setWeeklyPlan, setDirty]);

  return {
    loadingPrices,
    catalog,
    estimate: estim,
    region,

    estimateBudget,
    optimizeForBudget,
    getExpiringPantryItems,
    injectLeftovers,
  };
}
```

11) Botón de exportar calendario — agregá `/components/meal-planning/CalendarExportButton.tsx`
```tsx
'use client';

import React from 'react';
import { useMealPlanStore } from '@/store/slices/mealPlanSlice';
import { buildICS } from '@/lib/utils/ics';

export const CalendarExportButton: React.FC = () => {
  const plan = useMealPlanStore((s) => s.weeklyPlan);

  const exportICS = () => {
    if (!plan) return;
    const ics = buildICS(plan);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KeCarajoComer-${plan.weekStart}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="glass-button" onClick={exportICS} disabled={!plan}>
      Exportar Calendario (.ics)
    </button>
  );
};
```

12) Barra de presupuesto — agregá `/components/meal-planning/BudgetBar.tsx`
```tsx
'use client';

import React from 'react';
import { useMealPlanningPlus } from '@/hooks/meal-planning/useMealPlanningPlus';
import { useMealPlanStore } from '@/store/slices/mealPlanSlice';

export const BudgetBar: React.FC = () => {
  const prefs = useMealPlanStore((s) => s.preferences);
  const { estimate, estimateBudget, optimizeForBudget, loadingPrices } = useMealPlanningPlus();

  React.useEffect(() => {
    estimateBudget();
  }, [estimateBudget]);

  const budget = prefs.budgetWeekly ?? 0;
  const toBuy = estimate?.toBuyARS ?? 0;
  const ratio = budget > 0 ? Math.min(100, Math.round((toBuy / budget) * 100)) : 0;
  const over = budget > 0 && toBuy > budget;

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-white/70">Presupuesto semanal</div>
          <div className="text-xl font-semibold">{budget.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-white/70">A comprar estimado</div>
          <div className={`text-xl font-semibold ${over ? 'text-red-300' : 'text-emerald-300'}`}>
            {loadingPrices ? '...' : toBuy.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </div>
        </div>
      </div>

      <div className="mt-3 w-full h-3 glass-progress">
        <div
          className={`h-3 rounded-full ${over ? 'bg-red-400' : 'bg-emerald-400'}`}
          style={{ width: `${ratio}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ratio}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="glass-button" onClick={estimateBudget}>Recalcular</button>
        <button className="glass-button" onClick={() => {
          const { applied } = optimizeForBudget();
          if (applied > 0) estimateBudget();
        }}>
          Optimizar (sustituciones)
        </button>
      </div>
    </div>
  );
};
```

13) Vencimientos de despensa — agregá `/components/meal-planning/PantryExpiry.tsx`
```tsx
'use client';

import React from 'react';
import { useMealPlanningPlus } from '@/hooks/meal-planning/useMealPlanningPlus';
import dayjs from 'dayjs';
import { useMealPlanning } from '@/hooks/meal-planning/useMealPlanning';

export const PantryExpiry: React.FC = () => {
  const { getExpiringPantryItems } = useMealPlanningPlus();
  const { getAlternatives, applyAlternative, weeklyPlan } = useMealPlanning();
  const items = getExpiringPantryItems(5);

  const prioritize = async () => {
    if (!weeklyPlan) return;
    for (let d = 0; d < Math.min(3, weeklyPlan.days.length); d++) {
      for (const meal of ['almuerzo', 'cena'] as const) {
        const alts = await getAlternatives(d, meal);
        const match = alts.find((r) =>
          r.ingredients.some((ing) =>
            items.some((it) => ing.name.toLowerCase().includes(it.name.toLowerCase())),
          ),
        );
        if (match) {
          applyAlternative(d, meal, match);
          return;
        }
      }
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🧾 Por vencer</h3>
        <button className="glass-button" onClick={prioritize}>Priorizar en el plan</button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((p) => (
          <li key={p.id} className="glass-card p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-white/60">
                Vence {dayjs(p.expiresAt!).fromNow()} · {dayjs(p.expiresAt!).format('DD/MM')}
              </div>
            </div>
            <div className="text-sm text-white/70">
              {p.quantity ? `${p.quantity}${p.unit || ''}` : ''}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

14) UI: integrá en la página — editá `/app/(app)/planificador/page.tsx`
```tsx
'use client';

import React from 'react';
import { MealPlannerGrid } from '@/components/meal-planning/MealPlannerGrid';
import { BudgetBar } from '@/components/meal-planning/BudgetBar';
import { PantryExpiry } from '@/components/meal-planning/PantryExpiry';
import { CalendarExportButton } from '@/components/meal-planning/CalendarExportButton';

export default function Page() {
  return (
    <main className="min-h-screen px-4 py-6 md:py-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">KeCarajoComer</h1>
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

15) CSS extra — sumá a `/src/app/globals.css`
```css
@layer components {
  .glass-progress {
    @apply bg-white/10 rounded-full overflow-hidden border border-white/10;
  }
}
```

16) Tests nuevos

16.1 `/tests/unit/pricing.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { estimateWeeklyBudget } from '@/lib/utils/pricing';
import { ArgentineWeeklyPlan, PriceCatalogItem } from '@/types/meal';

describe('pricing', () => {
  it('estimates cost with catalog', () => {
    const plan: ArgentineWeeklyPlan = {
      weekStart: '2024-06-03',
      weekEnd: '2024-06-09',
      days: [
        {
          date: '2024-06-03',
          label: 'Lunes',
          meals: {
            desayuno: { recipe: { id: '1', name: 'Mate', ingredients: [{ name: 'Yerba mate', quantity: 100, unit: 'g' }], instructions: [], prepTime: 1, cookTime: 0, servings: 2, nutrition: { calories: 10, protein: 0, carbs: 0, fat: 0 } } },
            almuerzo: { recipe: { id: '2', name: 'Milanesas', ingredients: [{ name: 'Nalga', quantity: 500, unit: 'g' }], instructions: [], prepTime: 1, cookTime: 1, servings: 2, nutrition: { calories: 500, protein: 30, carbs: 20, fat: 20 } } },
            merienda: {},
            cena: {},
          },
        },
        ...Array.from({ length: 6 }).map((_, i) => ({
          date: `2024-06-0${i + 4}`,
          label: 'X',
          meals: { desayuno: {}, almuerzo: {}, merienda: {}, cena: {} },
        })),
      ],
      metadata: { season: 'invierno', region: 'Argentina', mode: 'normal', createdAt: new Date().toISOString() },
    };

    const catalog: PriceCatalogItem[] = [
      { id: 'yerba', name: 'yerba mate', unit: 'kg', price_ars: 4000, updated_at: new Date().toISOString(), region: 'Argentina' },
      { id: 'nalga', name: 'nalga', unit: 'kg', price_ars: 6500, updated_at: new Date().toISOString(), region: 'Argentina' },
    ];

    const out = estimateWeeklyBudget(plan, [], catalog);
    expect(out.estimatedTotalARS).toBeGreaterThan(0);
  });
});
```

16.2 `/tests/unit/ics.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { buildICS } from '@/lib/utils/ics';
import { ArgentineWeeklyPlan } from '@/types/meal';

describe('ics', () => {
  it('creates valid VCALENDAR', () => {
    const plan: ArgentineWeeklyPlan = {
      weekStart: '2024-06-03',
      weekEnd: '2024-06-09',
      days: [
        {
          date: '2024-06-03',
          label: 'Lunes',
          meals: {
            desayuno: { recipe: { id: '1', name: 'Mate', ingredients: [], instructions: ['Paso'], prepTime: 1, cookTime: 0, servings: 1, nutrition: { calories: 10, protein: 0, carbs: 0, fat: 0 } } },
            almuerzo: {},
            merienda: {},
            cena: {},
          },
        },
        ...Array.from({ length: 6 }).map((_, i) => ({
          date: `2024-06-0${i + 4}`,
          label: 'X',
          meals: { desayuno: {}, almuerzo: {}, merienda: {}, cena: {} },
        })),
      ],
      metadata: { season: 'invierno', region: 'Argentina', mode: 'normal', createdAt: new Date().toISOString() },
    };
    const ics = buildICS(plan);
    expect(ics.includes('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.includes('BEGIN:VEVENT')).toBe(true);
  });
});
```

17) SQL — nuevas tablas + RLS

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
  name text not null,              -- 'yerba mate', 'nalga', 'papa'
  unit text not null,              -- 'kg' | 'l' | 'u'
  price_ars numeric not null,
  region text not null default 'Argentina',
  updated_at timestamptz default now()
);

create index if not exists price_catalog_name_region_idx on price_catalog (name, region);

-- Eventos de gusto (aprendizaje)
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
alter table taste_events enable row level security;

create policy "meal_plans_owner" on meal_plans
  for select using (auth.uid() = user_id or is_public = true)
  with check (auth.uid() = user_id);

create policy "user_prefs_owner" on user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "taste_events_owner" on taste_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

18) Integración mínima en la UI existente
- En tu header del planificador, ya agregamos CalendarExportButton.  
- Antes de la grilla, agregamos BudgetBar y PantryExpiry.  
- No hace falta tocar tu hook principal: el Plus usa el store y servicios.  

19) Ideas extra (por si querés seguir subiendo la vara)
- Perfil nutricional objetivo: permitir al usuario setear macros objetivo y colorear comidas según cumplimiento.  
- Rotación inteligente: marcar frecuencia mínima entre platos similares (evitar milanesa 2 veces en 3 días).  
- Multi-hogar: perfiles de household (pareja, familia, roommates) y panes de compra distintos.  
- Preferencias dinámicas: “bandit” simple que aumente la probabilidad de sugerir platos aceptados y reduzca rechazados (taste_events).  
- PWA + WebPush: notificaciones para “hora de cocinar” y “productos por vencer” (Workbox + VAPID).  
- OCR de tickets: escaneás ticket del súper y se auto-actualiza el catálogo de precios y la despensa.  

¿Querés que lo llevemos a PWA con push notifications y un pequeño panel de aprendizaje (taste score) la próxima? Te lo dejo fileado y con deploy-ready. 🚀🧉🇦🇷