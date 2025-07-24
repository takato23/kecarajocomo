# Design System Tokens

Este directorio contiene todos los design tokens del sistema de diseño de KeCarajoComer, basados en el MASTER_PLAN.md.

## Estructura

```
tokens/
├── colors.ts      # Paleta de colores y temas
├── typography.ts  # Tipografía y estilos de texto
├── spacing.ts     # Espaciados y medidas
├── effects.ts     # Efectos visuales (sombras, bordes, animaciones)
└── index.ts       # Export central y utilidades
```

## Uso

### Importar tokens individuales

```typescript
import { colors, spacing, typography } from '@/design-system/tokens';

// Usar en styled components o CSS-in-JS
const styles = {
  color: colors.brand.primary,
  padding: spacing[4],
  fontSize: typography.fontSize.lg,
};
```

### Usar en componentes de Tailwind

Los tokens están configurados en `tailwind.config.js`:

```jsx
<div className="text-brand-primary p-4 text-lg">
  Contenido
</div>
```

### Crear variables CSS

```typescript
import { utils } from '@/design-system/tokens';

// Generar variables CSS
const cssVars = utils.createCSSVariables();
// Resultado: { '--ds-color-brand-primary': '#FF6B35', ... }
```

## Tokens disponibles

### Colors

- **Brand**: primary, secondary, accent
- **Neutral**: Escala de grises (0-900)
- **Semantic**: success, warning, error, info
- **Food themes**: fresh, warm, rich, golden
- **Glass effects**: Transparencias para efectos glassmorphism

### Typography

- **Font families**: heading, body, mono
- **Font sizes**: xs hasta 6xl
- **Font weights**: thin hasta black
- **Line heights**: tight, normal, relaxed
- **Pre-composed styles**: display, heading, body, caption, label

### Spacing

- **Base scale**: 0 hasta 96 (basado en grid de 4px)
- **Layout spacing**: page, section, component, grid, stack
- **Container widths**: xs hasta 7xl
- **Z-index**: Escala para capas

### Effects

- **Border radius**: sm hasta full
- **Shadows**: Elevación y efectos glass
- **Blur**: Para efectos glassmorphism
- **Transitions**: Duraciones y timing functions
- **Animations**: Keyframes predefinidas

## Principios de diseño

1. **Consistencia**: Usar siempre tokens, nunca valores hardcoded
2. **Semántica**: Preferir tokens semánticos sobre valores directos
3. **Accesibilidad**: Mantener contraste WCAG AA mínimo
4. **Performance**: Usar transiciones y animaciones con moderación
5. **Mobile first**: Diseñar primero para móvil

## Extender tokens

Para agregar nuevos tokens:

1. Agregar al archivo correspondiente (colors.ts, spacing.ts, etc.)
2. Actualizar types si es necesario
3. Documentar el uso en este README
4. Actualizar Storybook con ejemplos

## Migración desde theme.ts

El sistema anterior en `components/design-system/theme.ts` sigue siendo compatible. Los nuevos tokens extienden y mejoran el sistema existente sin romper la compatibilidad.