"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

// Feature flag — toggle to disable the weekly calendar rendering
const ENABLE_WEEKLY_CALENDAR = true;

// Localized labels (ES-AR)
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
const MEALS = [
  { key: "breakfast", label: "Desayuno", short: "Des" },
  { key: "lunch", label: "Almuerzo", short: "Alm" },
  { key: "snack", label: "Merienda", short: "Mer" },
  { key: "dinner", label: "Cena", short: "Cena" },
] as const;

type MealKey = typeof MEALS[number]["key"];

type SlotRecipe = {
  id: string;
  title: string;
};

type SlotsState = {
  [dayIndex: number]: Partial<Record<MealKey, SlotRecipe | undefined>>;
};

// Utility: get start of week (Monday as start)
function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0: Sun, 1: Mon, ...
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Format day for header chip
function formatDayMonth(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }).replace(".", "");
}

// Accessibility label
function ariaLabelForCell(dayIndex: number, mealKey: MealKey, content?: SlotRecipe) {
  const day = DAYS_ES[dayIndex];
  const meal = MEALS.find((m) => m.key === mealKey)?.label ?? mealKey;
  if (content?.title) return `${day} ${meal}, ${content.title}`;
  return `${day} ${meal}, vacío`;
}

// Utility: ISO from date
function toISODate(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd.toISOString();
}

// Liquid glass CSS tokens (light/dark)
const glassTokens = `
:root {
  /* iOS Calendar-like tokens */
  --bg-layer-1: rgba(255,255,255,0.86);
  --bg-layer-2: rgba(255,255,255,0.66);
  --hairline: rgba(0,0,0,0.06);
  --hairline-strong: rgba(0,0,0,0.12);
  --tint-blue: #0A84FF; /* iOS accent */
  --tint-green: #34C759;
  --shadow-soft: 0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06);
  --shadow-elev: 0 10px 30px rgba(0,0,0,0.12), 0 3px 10px rgba(0,0,0,0.08);
  --radius-xl: 18px;
  --radius-lg: 14px;
  --radius-md: 12px;
  --hover-scale: 1.012;
  --press-scale: 0.995;

  /* Row accent colors */
  --meal-breakfast: #0A84FF1A;
  --meal-lunch: #34C7591A;
  --meal-snack: #FF9F0A1A;
  --meal-dinner: #FF375F1A;

  /* Column highlight */
  --today-spine: #34C759;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-layer-1: rgba(26,26,28,0.72);
    --bg-layer-2: rgba(26,26,28,0.54);
    --hairline: rgba(255,255,255,0.08);
    --hairline-strong: rgba(255,255,255,0.14);
    --shadow-soft: 0 14px 34px rgba(0,0,0,0.55), 0 4px 10px rgba(0,0,0,0.35);
    --shadow-elev: 0 18px 40px rgba(0,0,0,0.6), 0 6px 16px rgba(0,0,0,0.45);
  }
}

/* App frame */
.ios-surface {
  background:
    radial-gradient(1200px 400px at 0% -10%, rgba(10,132,255,0.06), transparent 60%),
    radial-gradient(900px 400px at 100% 110%, rgba(52,199,89,0.06), transparent 60%);
}

/* Header bar */
.header-tab {
  position: sticky;
  top: 0;
  z-index: 5;
  background: linear-gradient(180deg, var(--bg-layer-1), var(--bg-layer-2));
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  backdrop-filter: blur(22px) saturate(140%);
  border-bottom: 1px solid var(--hairline);
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
}

/* Row headers */
.row-sticky {
  position: sticky;
  left: 0;
  z-index: 6;
  background: linear-gradient(180deg, var(--bg-layer-1), var(--bg-layer-2));
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  border-right: 1px solid var(--hairline);
}

/* Row accents (meal-specific subtle background) */
.row-accent--breakfast { background-image: linear-gradient(0deg, var(--meal-breakfast), transparent); }
.row-accent--lunch { background-image: linear-gradient(0deg, var(--meal-lunch), transparent); }
.row-accent--snack { background-image: linear-gradient(0deg, var(--meal-snack), transparent); }
.row-accent--dinner { background-image: linear-gradient(0deg, var(--meal-dinner), transparent); }

/* Today column highlight spine */
.today-col {
  position: relative;
}
.today-col::before {
  content: "";
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 8px;
  width: 3px;
  border-radius: 3px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--today-spine) 90%, transparent), transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--today-spine) 22%, transparent);
  opacity: 0.9;
  animation: spinePulse 2200ms ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .today-col::before { animation: none; }
}
@keyframes spinePulse {
  0%, 100% { opacity: 0.6; filter: saturate(100%); }
  50% { opacity: 1; filter: saturate(130%); }
}

/* Card base */
.glass-card {
  position: relative;
  background: linear-gradient(180deg, var(--bg-layer-1), var(--bg-layer-2));
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  transition: transform 200ms cubic-bezier(.2,.8,.2,1), filter 200ms, box-shadow 200ms;
}
.glass-card::after {
  /* top highlight */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: calc(var(--radius-xl) - 1px);
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,0.18), transparent 40%);
}

/* Interactions */
.glass-card:hover { transform: scale(var(--hover-scale)); filter: brightness(1.02); }
.glass-card:active { transform: scale(var(--press-scale)); }
.glass-focus { outline: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--tint-blue) 35%, transparent); }

/* Date chip */
.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--hairline);
  background: linear-gradient(180deg, var(--bg-layer-1), var(--bg-layer-2));
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  backdrop-filter: blur(16px) saturate(140%);
  font-weight: 600;
  letter-spacing: 0.15px;
}
.date-chip--today {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--tint-green) 28%, transparent) inset, 0 1px 0 rgba(255,255,255,0.18);
}

/* Slot */
.slot-card {
  min-height: 92px;
  padding: 12px;
  display: flex;
  border-radius: var(--radius-xl);
  cursor: pointer;
}
.slot-title {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.25;
}

/* Empty state */
.add-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px dashed var(--hairline);
  background: linear-gradient(180deg, var(--bg-layer-1), var(--bg-layer-2));
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  backdrop-filter: blur(12px) saturate(140%);
  font-weight: 600;
}

/* Popover */
.popover {
  position: absolute;
  z-index: 50;
  min-width: 260px;
  max-width: 340px;
  padding: 10px;
  transform-origin: top center;
  animation: pop-in 180ms cubic-bezier(.2,.8,.2,1);
  background: linear-gradient(180deg, var(--bg-layer-1), var(--bg-layer-2));
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: var(--shadow-elev);
}
@keyframes pop-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .popover { animation: none; }
}
.popover-arrow {
  position: absolute;
  top: -8px;
  left: 24px;
  width: 16px;
  height: 16px;
  transform: rotate(45deg);
  border-left: 1px solid var(--hairline);
  border-top: 1px solid var(--hairline);
  background: linear-gradient(180deg, var(--bg-layer-1), var(--bg-layer-2));
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
}
.popover-actions button {
  width: 100%;
  text-align: left;
  border-radius: 12px;
  padding: 12px 12px;
  border: 1px solid var(--hairline);
  background: linear-gradient(180deg, var(--bg-layer-1), var(--bg-layer-2));
  transition: transform 160ms ease, filter 160ms ease;
}
.popover-actions button:hover { transform: translateY(-1px); filter: brightness(1.03); }
.popover-actions button:active { transform: translateY(0); filter: brightness(0.98); }

/* Grid scroll + snapping */
.grid-scroll {
  overflow: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
}
.day-col { scroll-snap-align: start; }
`;

// Minimal icons (inline)
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function ReplaceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h11l-3-3m3 13H4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M8 6V4h8v2m-1 14H9a2 2 0 0 1-2-2V6h10v12a2 2 0 0 1-2 2Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function PantryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 3h16v4H4zM6 7v14h12V7" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function AiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function RecipesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h9a3 3 0 013 3v13l-5-3-5 3V7a3 3 0 013-3z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export default function PlannerZenithPage() {
  if (!ENABLE_WEEKLY_CALENDAR) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Planificador</h1>
        <p className="text-sm opacity-80">Calendario semanal desactivado</p>
      </main>
    );
  }

  // State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek());
  const [slots, setSlots] = useState<SlotsState>(() => ({}));
  const [openPopover, setOpenPopover] = useState<{ dayIndex: number; mealKey: MealKey } | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + idx);
      return d;
    });
  }, [currentWeekStart]);

  useEffect(() => {
    console.log("calendar_week_rendered", { weekStartISO: toISODate(currentWeekStart) });
  }, [currentWeekStart]);

  useEffect(() => {
    function onDocKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenPopover(null);
    }
    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (openPopover && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [openPopover]);

  function isToday(d: Date) {
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  function onCellOpen(dayIndex: number, mealKey: MealKey) {
    setOpenPopover({ dayIndex, mealKey });
    console.log("slot_opened", { dayIndex, mealKey });
  }

  // Stubs for actions
  function onAddFromRecipes(dayIndex: number, mealKey: MealKey) {
    console.log("slot_add_clicked", { dayIndex, mealKey, source: "recipes" });
    // TODO: open recipe selector
  }
  function onGenerateAI(dayIndex: number, mealKey: MealKey) {
    console.log("slot_add_clicked", { dayIndex, mealKey, source: "ai" });
    // TODO: call AI suggestion endpoint scoped to slot
  }
  function onChooseFromPantry(dayIndex: number, mealKey: MealKey) {
    console.log("slot_add_clicked", { dayIndex, mealKey, source: "pantry" });
    // TODO: open pantry suggestion selector
  }
  function onView(dayIndex: number, mealKey: MealKey, recipe?: SlotRecipe) {
    console.log("slot_view_clicked", { dayIndex, mealKey, recipeId: recipe?.id });
    // TODO: navigate to recipe detail
  }
  function onReplace(dayIndex: number, mealKey: MealKey) {
    console.log("slot_replace_clicked", { dayIndex, mealKey });
    // TODO: flow to replace item in this slot
  }
  function onRemove(dayIndex: number, mealKey: MealKey) {
    console.log("slot_remove_clicked", { dayIndex, mealKey });
    setSlots((prev) => ({
      ...prev,
      [dayIndex]: { ...(prev[dayIndex] ?? {}), [mealKey]: undefined },
    }));
  }

  // Sample mapping hook-in: if an external generated plan exists, map to slots here.
  // Example placeholder: keep empty; future: hydrate from generatedPlan in local state/context.

  // Navigation (optional)
  function goPrevWeek() {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  }
  function goNextWeek() {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <style suppressHydrationWarning>{glassTokens}</style>

      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-semibold">Planificador semanal</h1>
          <span className="date-chip">
            {formatDayMonth(days[0])} – {formatDayMonth(days[6])}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goPrevWeek} className="glass-card px-3 py-1.5 text-sm">Semana anterior</button>
          <button onClick={() => setCurrentWeekStart(startOfWeek())} className="glass-card px-3 py-1.5 text-sm">Hoy</button>
          <button onClick={goNextWeek} className="glass-card px-3 py-1.5 text-sm">Próxima semana</button>
        </div>
      </header>

      <section
        role="grid"
        aria-rowcount={MEALS.length + 1}
        aria-colcount={DAYS_ES.length + 1}
        className="glass-card p-0 overflow-hidden"
      >
        {/* Column headers */}
        <div className="header-tab grid" style={{ gridTemplateColumns: `200px repeat(7, minmax(180px, 1fr))` }} role="row">
          <div className="px-3 py-3 text-sm font-semibold opacity-70">Comidas</div>
          {days.map((d, idx) => (
            <div key={idx} className={clsx("px-3 py-2 border-l", "day-col")} role="columnheader" aria-colindex={idx + 2}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{DAYS_ES[idx]}</span>
                <span className={clsx("date-chip", isToday(d) && "date-chip--today")}>{formatDayMonth(d)}{isToday(d) ? " • Hoy" : ""}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Grid body with horizontal scroll on small screens */}
        <div className="grid-scroll">
          <div className="grid" style={{ gridTemplateColumns: `200px repeat(7, minmax(180px, 1fr))` }}>
            {MEALS.map((meal, rIdx) => (
              <React.Fragment key={meal.key}>
                {/* Row header sticky */}
                <div className="row-sticky px-3 py-4" role="rowheader" aria-rowindex={rIdx + 2}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{meal.label}</span>
                  </div>
                </div>

                {/* Day cells */}
                {days.map((d, cIdx) => {
                  const dayIndex = cIdx;
                  const content = slots[dayIndex]?.[meal.key as MealKey];

                  const isOpen = openPopover?.dayIndex === dayIndex && openPopover?.mealKey === (meal.key as MealKey);

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      role="gridcell"
                      aria-colindex={cIdx + 2}
                      aria-rowindex={rIdx + 2}
                      aria-selected={isOpen}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onCellOpen(dayIndex, meal.key as MealKey);
                        }
                      }}
                      aria-label={ariaLabelForCell(dayIndex, meal.key as MealKey, content)}
                      className="relative px-2 py-2"
                    >
                      <div
                        className={clsx(
                          "slot-card glass-card glass-focus group",
                          "items-start justify-between gap-2"
                        )}
                        onClick={() => onCellOpen(dayIndex, meal.key as MealKey)}
                      >
                        <div className="flex-1">
                          {content ? (
                            <>
                              <div className="text-[13px] font-semibold leading-snug line-clamp-2">{content.title}</div>
                              <div className="mt-1 text-[12px] opacity-70">Tap para ver opciones</div>
                            </>
                          ) : (
                            <div className="add-pill text-[13px] opacity-90">
                              <PlusIcon />
                              + Agregar
                            </div>
                          )}
                        </div>
                      </div>

                      {isOpen && (
                        <div
                          ref={popoverRef}
                          className={clsx("popover glass-card")}
                          style={{ top: "calc(100% + 10px)", left: 10, right: 10 }}
                          role="dialog"
                          aria-modal="false"
                          aria-label={`Opciones ${DAYS_ES[dayIndex]} ${MEALS[rIdx].label}`}
                        >
                          <div className="popover-arrow" />
                          <div className="px-2 py-1">
                            {content ? (
                              <>
                                <div className="text-[12px] mb-2 opacity-70">{content.title}</div>
                                <div className="popover-actions grid gap-2">
                                  <button onClick={() => onView(dayIndex, meal.key as MealKey, content)}>
                                    <span className="inline-flex items-center gap-2"><EyeIcon /> Ver</span>
                                  </button>
                                  <button onClick={() => onReplace(dayIndex, meal.key as MealKey)}>
                                    <span className="inline-flex items-center gap-2"><ReplaceIcon /> Sustituir</span>
                                  </button>
                                  <button onClick={() => onRemove(dayIndex, meal.key as MealKey)}>
                                    <span className="inline-flex items-center gap-2"><TrashIcon /> Quitar</span>
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-[12px] mb-2 opacity-70">Agregar receta a este espacio</div>
                                <div className="popover-actions grid gap-2">
                                  <button onClick={() => onAddFromRecipes(dayIndex, meal.key as MealKey)}>
                                    <span className="inline-flex items-center gap-2"><RecipesIcon /> Agregar desde mis recetas</span>
                                  </button>
                                  <button onClick={() => onGenerateAI(dayIndex, meal.key as MealKey)}>
                                    <span className="inline-flex items-center gap-2"><AiIcon /> Generar sugerencia IA</span>
                                  </button>
                                  <button onClick={() => onChooseFromPantry(dayIndex, meal.key as MealKey)}>
                                    <span className="inline-flex items-center gap-2"><PantryIcon /> Elegir desde despensa</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <footer className="mt-6 text-[12px] opacity-70">
        Sugerencias: conecta este calendario a tu plan generado y acciones reales en próximos pasos.
      </footer>
    </main>
  );
}