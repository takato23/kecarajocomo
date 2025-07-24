# 🍽️ Planificador Semanal de Comidas - UI Rework

## WeeklyPlanner · REWORK UI 100% Visual

### 📋 Descripción

Implementación completamente visual del planificador semanal de comidas. Esta versión es **100% presentacional** sin lógica de negocio ni persistencia.

### 🎨 Características Visuales

- **Glass Morphism**: Efectos de cristal con variables CSS personalizables
- **Animaciones Framer Motion**: Transiciones suaves y micro-interacciones
- **Responsive Design**: Grid desktop (7×4) y carousel móvil con snap scroll
- **Dark Mode**: Toggle animado con transición SVG morph (sol ⇄ luna)
- **Estados Visuales**: empty (dashed ring), filled (gradients), locked (overlay)
- **Gradientes por Tipo de Comida**:
  - Desayuno: `#fde68a → #fbcf5d`
  - Almuerzo: `#7dd3fc → #5eead4`
  - Snack: `#6ee7b7 → #a7f3d0`
  - Cena: `#e879f9 → #fda4af`

### 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ver en: http://localhost:3001/planificador

# Ejecutar Storybook
npm run storybook
```

### 📁 Estructura del Proyecto

```
src/features/planificador/ui/
├── GlassCard.tsx             # Contenedor base con motion.div
├── DayHeader.tsx             # Nombre día + fecha, gradient border
├── MealSlotCard.tsx          # Estados: empty|filled|locked
├── WeekGridDesktop.tsx       # Table role, grid 7×4, gap-6
├── WeekCarouselMobile.tsx    # Snap-x scroll, 1 día/página
├── WeeklyPlannerUI.tsx       # Detecta breakpoint y renderiza
└── DarkModeToggle.tsx        # Switch con animación sun⇄moon
```

### 🎯 Design Tokens

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.25);
  --glass-bg-dark: rgba(24, 24, 27, 0.55);
  --glass-blur: 14px;
  --glass-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
}
```

### 📱 Responsive Breakpoints

- **Mobile**: < 1024px (carousel con snap scroll)
- **Desktop**: ≥ 1024px (grid completo)
- Touch targets: ≥ 44px
- Padding mobile: px-4

### 🎬 Animaciones

- **zoomInCard**: 0.35s cubic-bezier(0.22, 1, 0.36, 1)
- **hover**: scale(1.02) + shadow-xl en 80ms
- **tap**: scale(0.97)
- **slideWeek**: transiciones con AnimatePresence
- **glassHoverPulse**: pulso infinito en slots vacíos

### 🌗 Dark Mode

- Persistencia en localStorage
- Variables CSS adaptativas
- Toggle con animación de rotación y escala
- Glass morphism ajustado para contraste AA

### 🧪 Testing con Storybook

```bash
npm run storybook
```

**Stories disponibles**:
- `GlassCard`: Default, Clickable, WithContent, DarkMode
- `MealSlotCard`: Estados empty/filled/locked para cada tipo
- `WeeklyPlannerUI`: light-desktop, dark-desktop, light-mobile, dark-mobile

### ⚡ Performance

- Font: Inter variable con font-display: swap
- Animaciones con will-change y GPU acceleration
- Lazy loading de Framer Motion
- CSS variables para temas sin re-render

### 🚧 Notas Importantes

**⚠️ Esta es una implementación UI-only**:
- NO hay lógica de negocio
- NO hay conexión con stores (Zustand)
- NO hay persistencia de datos
- Los datos son generados con mocks aleatorios
- Es una capa de presentación pura lista para conectar

### ✅ Checklist

- [x] Tailwind config con palette y animaciones
- [x] CSS variables en globals.css
- [x] Componentes de presentación puros
- [x] Animaciones Framer Motion
- [x] Responsive mobile-first
- [x] Dark mode funcional
- [x] Storybook stories
- [x] Contraste AA verificado
- [x] Touch targets ≥ 44px

---

**Listo para integración con lógica de negocio** ✨