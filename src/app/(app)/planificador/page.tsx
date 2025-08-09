'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Feature flag to wrap all new UI/logic
const ENABLE_PLANNER_MODAL_MVP = true;

// New feature flag for weekly calendar UI
const ENABLE_WEEKLY_CALENDAR = true;

// Prefer existing DS components; fall back to minimal inline if needed
import { Button, Input } from '@/components/design-system';
import { Text } from '@/components/design-system'; // Typography exports include Text
// Try to import a Modal from DS if exists; if not, we implement a lightweight inline modal
let DSModal: any = null;
try {
  // If your DS has a Modal, set DSModal to a function component signature
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maybe = require('@/components/design-system/Modal');
  DSModal = maybe?.Modal || maybe?.default || null;
} catch { /* no-op fallback below */}

// DS Popover try-catch; fallback implemented inline if not available
let DSPopover: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maybe = require('@/components/design-system/Popover');
  DSPopover = maybe?.Popover || maybe?.default || null;
} catch { /* fallback later */}

// Local types for generated plan preview and weekly slots
type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

type GeneratedPlan = {
  id?: string;
  rangeDays: number;
  days?: Array<{
    date?: string;
    slots?: Partial<Record<MealSlot, any>>;
  }>;
  recipes?: any[];
  // Allow any shape as backend may vary; we keep it permissive
  [key: string]: any;
};

type SlotRecipe = { id: string; title: string };
type SlotsState = Array<Record<MealSlot, SlotRecipe | null>>; // length 7 (Mon-Sun)

function InlineModal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleId = useMemo(() => `modal-title-${Math.random().toString(36).slice(2)}`, []);
  const descId = useMemo(() => `modal-desc-${Math.random().toString(36).slice(2)}`, []);
  useEffect(() => {
    if (open && containerRef.current) {
      const focusable = containerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [open]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-hidden={!open}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Cerrar" />
      <div
        ref={containerRef}
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-neutral-200 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className="px-5 py-4 border-b border-neutral-200">
          <h3 id={titleId} className="text-lg font-semibold">{title}</h3>
        </div>
        <div id={descId} className="p-5">{children}</div>
        <div className="px-5 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
          {footer}
        </div>
      </div>
    </div>
  );
}

function PlannerModal({
  open,
  onClose,
  onGenerate,
  onConfirm,
  generating,
  confirming,
  generatedPlan,
  error,
  setError,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (payload: {
    rangeDays: number;
    focusSavings: boolean;
    usePantryFirst: boolean;
    maxPrepMinutes?: number;
    allowRepeats: boolean;
  }) => Promise<void>;
  onConfirm: () => Promise<void>;
  generating: boolean;
  confirming: boolean;
  generatedPlan: GeneratedPlan | null;
  error: string | null;
  setError: (v: string | null) => void;
}) {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 28>(7);
  const [focusSavings, setFocusSavings] = useState(false);
  const [usePantryFirst, setUsePantryFirst] = useState(false);
  const [maxPrepMinutes, setMaxPrepMinutes] = useState<number | ''>('');
  const [allowRepeats, setAllowRepeats] = useState(false);

  const Footer = (
    <div className="flex items-center justify-between gap-3">
      <div className="min-h-[1.25rem]">
        {error ? (
          <p className="text-sm text-error-600">{error}</p>
        ) : generatedPlan ? (
          <p className="text-sm text-neutral-600">
            Plan generado: {generatedPlan?.rangeDays || 0} días
            {typeof (generatedPlan as any)?.totalRecipes === 'number' || Array.isArray((generatedPlan as any)?.recipes)
              ? `, ${(generatedPlan as any)?.totalRecipes ?? ((generatedPlan as any)?.recipes?.length || 0)} recetas`
              : ''}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onClose} aria-label="Cancelar generación de plan">
          Cancelar
        </Button>
        <Button
          variant="fresh"
          loading={generating}
          aria-label="Generar plan con IA"
          onClick={async () => {
            setError(null);
            console.log('planner_modal_mvp: generate_clicked');
            await onGenerate({
              rangeDays,
              focusSavings,
              usePantryFirst,
              maxPrepMinutes: maxPrepMinutes === '' ? undefined : Number(maxPrepMinutes),
              allowRepeats,
            });
          }}
        >
          Generar plan
        </Button>
        <Button
          variant="primary"
          loading={confirming}
          disabled={!generatedPlan}
          aria-label="Confirmar plan y crear lista de compras"
          onClick={async () => {
            setError(null);
            console.log('planner_modal_mvp: confirm_clicked');
            await onConfirm();
          }}
        >
          Confirmar y crear lista
        </Button>
      </div>
    </div>
  );

  const Content = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Rango de días
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 28].map((v) => (
            <Button
              key={v}
              variant={rangeDays === v ? 'fresh' : 'secondary'}
              onClick={() => setRangeDays(v as 7 | 14 | 28)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700">
          Foco ahorro
        </label>
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={focusSavings}
          onChange={(e) => setFocusSavings(e.target.checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700">
          Usar despensa primero
        </label>
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={usePantryFirst}
          onChange={(e) => setUsePantryFirst(e.target.checked)}
        />
      </div>

      <div>
        <Input
          type="number"
          label="Tiempo máx por receta (min)"
          placeholder="Opcional"
          value={maxPrepMinutes}
          onChange={(e) => {
            const val = e.target.value;
            setMaxPrepMinutes(val === '' ? '' : Number(val));
          }}
          min={0}
          inputSize="md"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700">
          Permitir repetir platos
        </label>
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={allowRepeats}
          onChange={(e) => setAllowRepeats(e.target.checked)}
        />
      </div>

      {generatedPlan ? (
        <div className="rounded-lg border border-neutral-200 p-3 bg-neutral-50">
          <p className="text-sm text-neutral-700">
            Plan generado: {generatedPlan?.rangeDays || 0} días
            {typeof (generatedPlan as any)?.totalRecipes === 'number' || Array.isArray((generatedPlan as any)?.recipes)
              ? `, ${(generatedPlan as any)?.totalRecipes ?? ((generatedPlan as any)?.recipes?.length || 0)} recetas`
              : ''}
          </p>
        </div>
      ) : null}
    </div>
  );

  if (DSModal) {
    // If a DS Modal exists, render it
    const ModalComp = DSModal;
    return (
      <ModalComp open={open} onOpenChange={(v: boolean) => (!v ? onClose() : undefined)} title="Generar plan" footer={Footer}>
        {Content}
      </ModalComp>
    );
  }

  // Fallback inline modal
  return (
    <InlineModal open={open} onClose={onClose} title="Generar plan" footer={Footer}>
      {Content}
    </InlineModal>
  );
}

// Glassmorphism reusable class via CSS variables and Tailwind utilities
const glassBase =
  'bg-white/60 dark:bg-white/10 backdrop-blur-[14px] border border-white/30 dark:border-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_8px_24px_-8px_rgba(0,0,0,0.35)]';

// Meal labels ES
const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  snack: 'Merienda',
  dinner: 'Cena',
};

// Day labels ES (Mon-Sun)
const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Helpers for week dates
function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun,1=Mon,...6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // move to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isoDate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
}
function formatDayMonth(d: Date) {
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
}

function useWeeklySlots(generatedPlan: GeneratedPlan | null, currentWeekStart: Date) {
  const emptyWeek: SlotsState = useMemo(
    () =>
      Array.from({ length: 7 }, () => ({
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null,
      })),
    []
  );

  const slots = useMemo(() => {
    if (!generatedPlan?.days || !Array.isArray(generatedPlan.days)) {
      return emptyWeek;
    }
    const map: SlotsState = JSON.parse(JSON.stringify(emptyWeek));
    const weekISO = Array.from({ length: 7 }, (_, i) => isoDate(addDays(currentWeekStart, i)));

    // Attempt mapping plan days to week slots by matching date strings if present
    for (const day of generatedPlan.days) {
      const d = day?.date ? new Date(day.date) : null;
      const dIso = d ? isoDate(d) : null;
      const dayIndex = dIso ? weekISO.indexOf(dIso) : -1;
      if (dayIndex >= 0) {
        const s = day.slots || {};
        (['breakfast', 'lunch', 'snack', 'dinner'] as MealSlot[]).forEach((m) => {
          const v: any = (s as any)[m];
          if (v && typeof v === 'object') {
            const title = (v.title as string) || (v.name as string) || (v.recipe_title as string) || 'Receta';
            const id = (v.id as string) || (v.recipe_id as string) || `${dayIndex}-${m}`;
            (map[dayIndex] as any)[m] = { id, title };
          }
        });
      }
    }
    return map;
  }, [generatedPlan, currentWeekStart, emptyWeek]);

  return slots;
}

function InlinePopover({
  open,
  anchorRect,
  onClose,
  children,
}: {
  open: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open || !anchorRect) return null;
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(window.innerHeight - 16, anchorRect.bottom + 8),
    left: Math.min(window.innerWidth - 16, anchorRect.left),
    zIndex: 50,
  };
  return (
    <div className="fixed inset-0 z-50" onClick={onClose} aria-hidden="true">
      <div
        className={`${glassBase} relative rounded-xl p-3 w-[260px]`}
        style={style}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}

export default function PlanificadorPage() {
  // Keep previous behavior when feature disabled
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Weekly calendar local state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const slots = useWeeklySlots(generatedPlan, currentWeekStart);
  const [compact, setCompact] = useState<boolean>(false);

  // Popover state
  const [openCell, setOpenCell] = useState<{ dayIndex: number; meal: MealSlot } | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Telemetry on calendar render
    if (ENABLE_WEEKLY_CALENDAR) {
      console.log('calendar_week_rendered', { weekStart: currentWeekStart.toISOString() });
    }
  }, [currentWeekStart]);

  const openModal = useCallback(() => {
    console.log('planner_modal_mvp: planner_modal_opened');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const tryFetch = useCallback(async (url: string) => {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`planner_modal_mvp: best-effort fetch failed for ${url}`, e);
      return null;
    }
  }, []);

  const onGenerate = useCallback(async (payload: {
    rangeDays: number;
    focusSavings: boolean;
    usePantryFirst: boolean;
    maxPrepMinutes?: number;
    allowRepeats: boolean;
  }) => {
    setGenerating(true);
    setError(null);

    // Telemetry
    console.log('planner_modal_mvp: generate_clicked');

    // Best-effort fetches
    const [preferencesJson, pantryJson] = await Promise.all([
      tryFetch('/api/user/preferences'),
      tryFetch('/api/pantry/items'),
    ]);

    const preferences = preferencesJson || {};
    // Pantry API in repo returns shape { success, data }, normalize to array
    const pantry =
      pantryJson?.data && Array.isArray(pantryJson.data)
        ? pantryJson.data
        : Array.isArray(pantryJson)
        ? pantryJson
        : [];

    // Compose request body
    const body = {
      rangeDays: payload.rangeDays as 7 | 14 | 28,
      focusSavings: payload.focusSavings,
      usePantryFirst: payload.usePantryFirst,
      maxPrepMinutes: payload.maxPrepMinutes,
      allowRepeats: payload.allowRepeats,
      preferences,
      pantry,
      scope: 'range' as const,
      slotsPerDay: ['breakfast', 'lunch', 'snack', 'dinner'] as MealSlot[],
    };

    try {
      // Prefer dedicated generate endpoint if available; fallback to generate-simple
      const endpointCandidates = [
        '/api/meal-planning/generate',
        '/api/meal-planning/generate-simple',
      ];

      let res: Response | null = null;
      for (const ep of endpointCandidates) {
        try {
          const test = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (test.ok) {
            res = test;
            break;
          }
        } catch {
          // try next
        }
      }

      if (!res || !res.ok) {
        throw new Error('No se pudo generar el plan');
      }

      const json = await res.json();
      // Normalize the generated plan
      const normalized: GeneratedPlan =
        json?.plan
          ? {
              id: json.plan.id,
              rangeDays: body.rangeDays,
              ...json.plan,
            }
          : {
              id: json?.id,
              rangeDays: body.rangeDays,
              ...json,
            };

      setGeneratedPlan(normalized);
      console.log('planner_modal_mvp: generate_success', {
        rangeDays: body.rangeDays,
        recipes: (normalized as any)?.recipes?.length,
      });
    } catch (e: any) {
      console.error('planner_modal_mvp: generate_error', e);
      setError(e?.message || 'Error al generar el plan');
    } finally {
      setGenerating(false);
    }
  }, [tryFetch]);

  const onConfirm = useCallback(async () => {
    if (!generatedPlan) return;
    setConfirming(true);
    setError(null);

    try {
      const start =
        (generatedPlan as any)?.start_date ||
        (generatedPlan as any)?.startDate ||
        (generatedPlan as any)?.dates?.start || currentWeekStart.toISOString();
      const end =
        (generatedPlan as any)?.end_date ||
        (generatedPlan as any)?.endDate ||
        (generatedPlan as any)?.dates?.end || addDays(currentWeekStart, 6).toISOString();

      const startISO = new Date(start).toISOString();
      const endISO = new Date(end).toISOString();

      const buildItems = () => {
        const items: any[] = [];
        const daysArr: any[] = Array.isArray((generatedPlan as any)?.days) ? (generatedPlan as any).days : [];
        for (const d of daysArr) {
          const dateISO = d?.date ? new Date(d.date).toISOString() : startISO;
          const slots = d?.slots || {};
          for (const meal of ['breakfast', 'lunch', 'snack', 'dinner'] as MealSlot[]) {
            const rec: any = (slots as any)[meal];
            if (rec) {
              items.push({
                recipeId: rec.id || null,
                date: dateISO,
                mealType: meal,
                servings: 1,
                isCompleted: false,
                customRecipe: rec.title ? { title: rec.title } : null,
                nutritionalInfo: {}
              });
            }
          }
        }
        return items;
      };

      let savedPlanId: string | undefined;
      try {
        const saveRes = await fetch('/api/meal-planning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Plan semanal IA',
            startDate: startISO,
            endDate: endISO,
            preferences: {},
            nutritionalGoals: {},
            items: buildItems(),
            setActive: true
          })
        });
        if (saveRes.ok) {
          const saved = await saveRes.json();
          savedPlanId = saved?.data?.id;
        }
      } catch (e) {
        console.warn('[Planner] no se pudo persistir el plan, continuando', e);
      }

      let payload: any = { plan: generatedPlan, start_date: startISO, end_date: endISO };
      if (savedPlanId) payload.meal_plan_ids = [savedPlanId];

      const res = await fetch('/api/meal-planning/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('No se pudo crear la lista de compras');
      }

      console.log('planner_modal_mvp: confirm_success');
      // Navigate to shopping list UI
      router.push('/shopping-list');
    } catch (e: any) {
      console.error('planner_modal_mvp: confirm_error', e);
      setError(e?.message || 'Error al crear la lista');
    } finally {
      setConfirming(false);
    }
  }, [generatedPlan, router, currentWeekStart]);

  const triggerArea = useMemo(() => {
    if (!ENABLE_PLANNER_MODAL_MVP) {
      // Old behavior: render previous page if flag is off
      return (
        <div className="p-6">
          <p className="text-neutral-600 text-sm">
            Modo clásico del planificador activo (flag deshabilitado).
          </p>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Planificador</h1>
          <Button variant="primary" onClick={openModal}>
            Generar plan
          </Button>
        </div>
        <p className="text-neutral-600 mt-2">
          Abre el modal para generar un plan y crear tu lista de compras.
        </p>
      </div>
    );
  }, [openModal]);

  // Handlers for slot actions (telemetry only; integration TODO)
  const onOpenCell = useCallback((dayIndex: number, meal: MealSlot, target: HTMLElement | null) => {
    console.log('slot_opened', { dayIndex, mealKey: meal });
    setOpenCell({ dayIndex, meal });
    if (target) setAnchorRect(target.getBoundingClientRect());
  }, []);
  const onAddFromMyRecipes = useCallback(() => {
    console.log('slot_add_clicked', { source: 'mis_recetas', ...openCell });
    // TODO integrate selection flow
    setOpenCell(null);
  }, [openCell]);
  const onSuggestAI = useCallback(() => {
    console.log('slot_add_clicked', { source: 'ia', ...openCell });
    (async () => {
      try {
        if (!openCell) return;
        const res = await fetch('/api/meal-planning/generate-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        if (!res.ok) throw new Error('No se pudo obtener sugerencia');
        const json = await res.json();
        const plan = json?.plan;
        if (!plan?.days || !Array.isArray(plan.days)) throw new Error('Plan inválido');
        const targetISO = isoDate(addDays(currentWeekStart, openCell.dayIndex));
        const day = plan.days.find((d: any) => d?.date && isoDate(new Date(d.date)) === targetISO);
        const slot = day?.slots?.[openCell.meal];
        if (!slot) throw new Error('Sin sugerencia para este espacio');
        setGeneratedPlan((prev) => {
          const next: any = prev ? { ...prev } : { days: [] };
          const idx = (next.days || []).findIndex((d: any) => d?.date && isoDate(new Date(d.date)) === targetISO);
          if (idx >= 0) {
            next.days[idx] = { ...next.days[idx], slots: { ...(next.days[idx].slots || {}), [openCell.meal]: slot } };
          } else {
            next.days = [...(next.days || []), { date: targetISO, slots: { [openCell.meal]: slot } }];
          }
          return next;
        });
      } catch (e) {
        console.error('[Planner] sugerencia_ia_error', e);
      } finally {
        setOpenCell(null);
      }
    })();
  }, [openCell, currentWeekStart]);
  const onChoosePantry = useCallback(() => {
    console.log('slot_add_clicked', { source: 'despensa', ...openCell });
    // TODO integrate pantry picker
    setOpenCell(null);
  }, [openCell]);
  const onView = useCallback(() => {
    console.log('slot_view_clicked', { ...openCell });
    // TODO navigate to recipe
    setOpenCell(null);
  }, [openCell]);
  const onReplace = useCallback(() => {
    console.log('slot_replace_clicked', { ...openCell });
    // TODO open replace flow
    setOpenCell(null);
  }, [openCell]);
  const onRemove = useCallback(() => {
    console.log('slot_remove_clicked', { ...openCell });
    // TODO remove from plan state
    setOpenCell(null);
  }, [openCell]);

  const meals: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  // Render calendar grid
  const calendar = useMemo(() => {
    if (!ENABLE_WEEKLY_CALENDAR) {
      return (
        <div className="p-6">
          <p className="text-neutral-500">Calendario semanal desactivado</p>
        </div>
      );
    }

    const filledCount = slots.reduce((acc, day) => {
      return acc + (day.breakfast ? 1 : 0) + (day.lunch ? 1 : 0) + (day.snack ? 1 : 0) + (day.dinner ? 1 : 0);
    }, 0);
    const totalSlots = 28;

    return (
      <div className="px-4 sm:px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              aria-label="Semana anterior"
              onClick={() => setCurrentWeekStart((d) => addDays(d, -7))}
            >
              ← Semana anterior
            </Button>
            <Button
              variant="secondary"
              aria-label="Ir a esta semana"
              onClick={() => setCurrentWeekStart(startOfWeekMonday(new Date()))}
            >
              Esta semana
            </Button>
            <Button
              variant="secondary"
              aria-label="Semana siguiente"
              onClick={() => setCurrentWeekStart((d) => addDays(d, 7))}
            >
              Semana siguiente →
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-neutral-500">
              {formatDayMonth(days[0])} - {formatDayMonth(days[6])}
            </div>
            <div className="text-sm font-medium text-neutral-700" aria-label="Progreso semana">
              {filledCount}/{totalSlots}
            </div>
            <Button variant="secondary" aria-label="Alternar vista compacta" onClick={() => setCompact((v) => !v)}>
              {compact ? 'Vista cómoda' : 'Vista compacta'}
            </Button>
          </div>
        </div>

        <div
          ref={gridScrollRef}
          className="relative overflow-x-auto pb-2"
          role="grid"
          aria-label="Calendario semanal de comidas"
        >
          <div
            className="min-w-[880px] grid"
            style={{
              gridTemplateColumns: '160px repeat(7, minmax(120px, 1fr))',
            }}
          >
            {/* Corner empty header */}
            <div className="sticky left-0 z-10" />

            {/* Day headers */}
            {days.map((d, idx) => (
              <div key={idx} className="px-2 py-3 text-center text-sm font-medium text-neutral-700">
                <div>{DAY_LABELS[idx]}</div>
                <div className="text-xs text-neutral-500">{formatDayMonth(d)}</div>
              </div>
            ))}

            {/* Rows for meals */}
            {meals.map((meal) => (
              <React.Fragment key={meal}>
                {/* Row header */}
                <div className="sticky left-0 z-10 px-3 py-4 text-sm font-semibold text-neutral-700">
                  {MEAL_LABELS[meal]}
                </div>

                {/* Cells */}
                {days.map((_, dayIndex) => {
                  const recipe = slots[dayIndex]?.[meal] as SlotRecipe | null;
                  const isEmpty = !recipe;
                  const labelDay = DAY_LABELS[dayIndex];
                  const aria = `${labelDay} ${MEAL_LABELS[meal]}, ${isEmpty ? 'vacío' : recipe?.title}`;
                  return (
                    <button
                      key={`${dayIndex}-${meal}`}
                      className={`${glassBase} group m-2 ${compact ? 'h-[64px]' : 'h-[84px]'} rounded-xl px-3 py-2 text-left outline-none transition
                        hover:brightness-105 hover:scale-[1.01] focus:brightness-105 focus:scale-[1.01]
                        active:scale-[0.99]
                        `}
                      aria-label={aria}
                      role="gridcell"
                      onClick={(e) => onOpenCell(dayIndex, meal, e.currentTarget)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenCell(dayIndex, meal, e.currentTarget as HTMLButtonElement);
                        }
                        // Navegación con flechas entre celdas
                        const moveFocus = (rowDelta: number, colDelta: number) => {
                          const newDay = dayIndex + colDelta;
                          const mealsOrder: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
                          const currentRow = mealsOrder.indexOf(meal);
                          const newRow = currentRow + rowDelta;
                          if (newDay < 0 || newDay > 6 || newRow < 0 || newRow > 3) return;
                          const selector = `button[key='${newDay}-${mealsOrder[newRow]}']`;
                          const target = document.querySelector<HTMLButtonElement>(selector);
                          (target || e.currentTarget)?.focus();
                        };
                        if (e.key === 'ArrowRight') moveFocus(0, 1);
                        if (e.key === 'ArrowLeft') moveFocus(0, -1);
                        if (e.key === 'ArrowDown') moveFocus(1, 0);
                        if (e.key === 'ArrowUp') moveFocus(-1, 0);
                      }}
                    >
                      {isEmpty ? (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-sm text-neutral-600 dark:text-neutral-300">+ Agregar</span>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col">
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {MEAL_LABELS[meal]}
                          </span>
                          <span className="mt-1 line-clamp-3 text-sm font-medium text-neutral-800 dark:text-neutral-100">
                            {recipe.title}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }, [days, meals, slots, onOpenCell]);

  const popoverContent = openCell && (
    <>
      {(() => {
        const r = slots[openCell.dayIndex]?.[openCell.meal] as SlotRecipe | null;
        if (!r) {
          return (
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={onAddFromMyRecipes}>
                Agregar desde mis recetas
              </Button>
              <Button variant="secondary" onClick={onSuggestAI}>
                Generar sugerencia IA
              </Button>
              <Button variant="secondary" onClick={onChoosePantry}>
                Elegir desde despensa
              </Button>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium mb-1 line-clamp-2">{r.title}</div>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={onView}>
                Ver
              </Button>
              <Button variant="secondary" onClick={onReplace}>
                Sustituir
              </Button>
              <Button variant="destructive" onClick={onRemove}>
                Quitar
              </Button>
            </div>
          </div>
        );
      })()}
    </>
  );

  return (
    <div className="w-full">
      {triggerArea}

      {/* Weekly Calendar */}
      {ENABLE_WEEKLY_CALENDAR ? calendar : (
        <div className="px-6">
          <p className="text-neutral-500">Calendario semanal desactivado</p>
        </div>
      )}

      {/* Existing modal flow */}
      {ENABLE_PLANNER_MODAL_MVP && (
        <PlannerModal
          open={modalOpen}
          onClose={closeModal}
          onGenerate={onGenerate}
          onConfirm={onConfirm}
          generating={generating}
          confirming={confirming}
          generatedPlan={generatedPlan}
          error={error}
          setError={setError}
        />
      )}

      {/* Popover (DS or fallback) */}
      {openCell &&
        (DSPopover ? (
          <DSPopover open={!!openCell} onOpenChange={(v: boolean) => !v && setOpenCell(null)}>
            {popoverContent}
          </DSPopover>
        ) : (
          <InlinePopover
            open={!!openCell}
            anchorRect={anchorRect}
            onClose={() => setOpenCell(null)}
          >
            {popoverContent}
          </InlinePopover>
        ))}
    </div>
  );
}