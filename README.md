# KeCarajoComer - Planificador Semanal con IA

Planificador semanal de comidas con diseño glassmorphism, dark mode y gestión interactiva de recetas.

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone [tu-repo-url]
cd kecarajocomer

# Instalar dependencias
npm install
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev

# Iniciar Storybook
npm run storybook
```

### Scripts disponibles
- `npm run dev` - Servidor de desarrollo en http://localhost:3001
- `npm run storybook` - Storybook en http://localhost:6006
- `npm run build` - Build de producción
- `npm run lint` - Ejecutar ESLint
- `npm run type-check` - Verificar tipos TypeScript

## 🎯 Características Implementadas

### Iteración 0 - Bootstrap ✅
- ✅ Estructura de carpetas feature-based en `/src/features/planificador/`
- ✅ Design tokens con Tailwind (glassmorphism, colores, animaciones)
- ✅ Componente WeeklyPlannerBase con grid 7x4
- ✅ Dark mode toggle persistente (localStorage)
- ✅ Diseño responsive (desktop grid, mobile stack)
- ✅ Store con Zustand (navegación semanal, UI settings)
- ✅ Storybook stories para componentes

### Iteración 1 - Interactividad ✅
- ✅ Sistema completo de tipos para recetas y comidas
- ✅ Base de datos mock con 40+ recetas categorizadas
- ✅ Búsqueda de recetas con filtros por texto, categoría y tags
- ✅ Modal de búsqueda con focus trap y accesibilidad WCAG AA
- ✅ CRUD completo: agregar, eliminar y bloquear comidas
- ✅ Estados visuales: vacío, lleno, bloqueado, cargando, error
- ✅ Acciones contextuales en hover (desktop) y menú kebab (mobile)
- ✅ Persistencia en localStorage con Zustand persist
- ✅ Hook personalizado `useRecipeSearch` para búsqueda optimizada
- ✅ Integración completa con el planificador semanal

## 🏗️ Estructura del Proyecto

```
src/features/planificador/
├── components/              # Componentes React
│   ├── WeeklyPlannerBase.tsx    # Componente principal
│   ├── MealSlot.tsx             # Slot individual de comida
│   ├── MealSlotActions.tsx      # Acciones de slot (lock/delete)
│   ├── MealSlotModal.tsx        # Modal de búsqueda
│   ├── SearchBar.tsx            # Barra de búsqueda
│   ├── RecipeCard.tsx           # Tarjeta de receta
│   ├── WeekNavigator.tsx        # Navegación semanal
│   └── DarkModeToggle.tsx       # Toggle de tema
├── data/                    # Datos mock
│   └── mockRecipes.ts           # 40+ recetas de ejemplo
├── hooks/                   # Custom hooks
│   └── useRecipeSearch.ts       # Hook de búsqueda
├── providers/               # Context providers
│   └── WeeklyPlannerProvider.tsx
├── stores/                  # Estado global
│   └── weeklyPlannerStore.ts    # Store de Zustand
├── types/                   # TypeScript types
│   └── index.ts                 # Tipos compartidos
├── utils/                   # Utilidades
│   └── dateHelpers.ts           # Funciones de fecha
└── index.ts                # Exports públicos
```

## 🎨 Design System

### Glassmorphism
- Fondos semi-transparentes con backdrop-blur
- Bordes sutiles con opacidad
- Sombras suaves para profundidad
- Efectos hover con transiciones smooth

### Dark Mode
- Toggle en el header
- Persistencia en localStorage
- Transiciones suaves entre temas
- Colores optimizados para ambos modos

## 📖 Cómo Usar el Planificador

### Agregar una Comida
1. Haz click en cualquier slot vacío del calendario
2. Se abrirá el modal de búsqueda de recetas
3. Busca por nombre o usa los filtros disponibles
4. Haz click en la receta deseada para agregarla al slot

### Gestionar Comidas
- **Bloquear**: Evita cambios accidentales en una comida
  - Desktop: Hover sobre el slot y click en el candado
  - Mobile: Click en el menú ⋮ y selecciona "Bloquear"
- **Eliminar**: Remueve una comida del calendario
  - Desktop: Hover sobre el slot y click en la papelera
  - Mobile: Click en el menú ⋮ y selecciona "Eliminar"
  - Nota: Las comidas bloqueadas no se pueden eliminar

### Navegación
- Usa los botones de flecha para navegar entre semanas
- Click en "Hoy" para volver a la semana actual
- En móvil, desliza o usa las flechas para cambiar de día

## 🧪 Testing

### Development Server
1. Ejecutar `npm run dev`
2. Navegar a http://localhost:3001/planificador
3. Probar las siguientes funcionalidades:
   - Agregar recetas a diferentes slots
   - Buscar recetas por nombre
   - Filtrar por tags y categorías
   - Bloquear y desbloquear comidas
   - Eliminar comidas
   - Toggle de dark mode
   - Navegación semanal
   - Vista responsive en diferentes tamaños

### Storybook
1. Ejecutar `npm run storybook`
2. Explorar los componentes en:
   - "Planificador/WeeklyPlannerBase" - Vistas completas
   - "Planificador/MealSlot" - Estados del slot
   - "Planificador/MealSlotModal" - Modal de búsqueda
   - "Planificador/RecipeCard" - Tarjetas de receta
   - "Planificador/SearchBar" - Barra de búsqueda
   - "Planificador/MealSlotActions" - Acciones de slot

## 📱 Responsive Design

- **Desktop (≥1024px)**: Grid completo 7x4 con labels laterales
- **Tablet (768px-1023px)**: Stack vertical con grid 2x2 por día
- **Mobile (<768px)**: Stack vertical con grid 1x4 por día

## 🔄 Estado Global

El store de Zustand maneja:
- `currentWeek`: Semana actual mostrada
- `weeklyPlan`: Mapa de slots de comida con recetas
- `ui`: Estado de UI (darkMode, isNavigating)
- `modal`: Estado del modal de búsqueda
- Acciones CRUD: `addMeal`, `removeMeal`, `lockMeal`, `unlockMeal`
- Navegación: `nextWeek`, `previousWeek`, `goToCurrentWeek`
- Modal: `openModal`, `closeModal`, `setSearchQuery`, `toggleTag`

## 🍽️ Funcionalidades de Recetas

### Búsqueda de Recetas
- Búsqueda por texto en nombre, descripción e ingredientes
- Filtros por tipo de comida (desayuno, almuerzo, cena, snack)
- Filtros por categoría (carnes, pescados, vegetales, etc.)
- Filtros por tags (vegetariano, sin gluten, rápido, etc.)
- Sugerencias de tags basadas en resultados

### Gestión de Comidas
- Click en slot vacío abre modal de búsqueda
- Agregar receta a un slot con un click
- Bloquear/desbloquear comidas para evitar cambios
- Eliminar comidas (excepto las bloqueadas)
- Estados visuales claros para cada estado

### Base de Datos Mock
40+ recetas organizadas por:
- **Carnes**: Pollo, res, cerdo
- **Pescados y Mariscos**: Salmón, atún, camarones
- **Vegetales**: Ensaladas, salteados, sopas
- **Cereales y Legumbres**: Arroz, pasta, lentejas
- **Saludable**: Opciones bajas en calorías
- **Internacional**: Cocina de diversos países
- **Postres**: Opciones dulces saludables

## 🚦 Próximas Iteraciones

- ~~Iteración 1: CRUD de comidas~~ ✅
- Iteración 2: Integración con Gemini Flash 2 para sugerencias
- Iteración 3: Base de datos Supabase
- Iteración 4: Features avanzadas (lista de compras, nutrición)

## 🐛 Solución de Problemas

### El dark mode no persiste
- Verificar que localStorage esté habilitado
- Revisar la consola para errores de hidratación

### Storybook no carga
- Asegurarse de que el puerto 6006 esté libre
- Ejecutar `npm run storybook -- --port 6007` para usar otro puerto

### Errores de TypeScript
- Ejecutar `npm run type-check` para ver todos los errores
- Verificar que las dependencias estén instaladas correctamente

## 🤖 AI Capabilities

Este proyecto incluye un ecosistema AI que puede:
- 🎯 Generar planes de mejora automáticamente
- 🔧 Aplicar fixes de código inteligentes
- 🤖 Funcionar como daemon autónomo
- 📊 Monitorear calidad de código

### Comandos AI:
```bash
npm run ai:plan     # Ver qué mejoras puede hacer el AI
npm run ai:apply    # Aplicar mejoras automáticamente
npm run ai:daemon   # Activar AI autónomo
```

---
