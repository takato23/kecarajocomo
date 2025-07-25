# Issues Documentados - Sistema de Planificación de Comidas

## 🔴 CRÍTICO - Corregir Inmediatamente

### 1. Errores de TypeScript (65 errores)

**Ubicación**: Múltiples archivos
**Descripción**: El sistema tiene 65 errores de TypeScript que impiden la compilación correcta.

**Errores Principales**:
```typescript
// lib/data/sample-data.ts
// ❌ Error: 'ingredient_name' does not exist in type 'RecipeIngredient'
{
  ingredient_name: "Tomate" // Debería ser 'ingredient'
}

// ✅ Corrección:
{
  ingredient: "Tomate"
}
```

**Archivos Afectados**:
- `lib/data/sample-data.ts` - Interfaces de datos de muestra incorrectas
- `src/store/slices/*.ts` - Mutaciones de Zustand incorrectas  
- `src/types/profile/*.ts` - Propiedades faltantes en schemas
- Rutas API Next.js - Tipos de parámetros incorrectos

**Estimación**: 4-6 horas

### 2. Memory Leaks Potenciales en Cache

**Ubicación**: `src/features/meal-planning/store/useMealPlanningStore.ts`
**Descripción**: El cache de localStorage no tiene límites de tamaño ni limpieza automática.

```typescript
// ❌ Problema: Cache ilimitado
const setCachedWeekPlan = (startDate: string, data: WeekPlan) => {
  localStorage.setItem(`${CACHE_KEY_PREFIX}${startDate}`, JSON.stringify(cacheData));
};

// ✅ Solución:
const MAX_CACHE_ENTRIES = 10;
const setCachedWeekPlan = (startDate: string, data: WeekPlan) => {
  // Limpiar entradas antiguas si excede el límite
  clearOldCacheEntries();
  localStorage.setItem(`${CACHE_KEY_PREFIX}${startDate}`, JSON.stringify(cacheData));
};
```

**Estimación**: 2 horas

### 3. Falta de Validación en Componentes

**Ubicación**: `src/features/meal-planning/components/MealPlannerPage.tsx`
**Descripción**: Componentes no validan props requeridas.

```typescript
// ❌ Problema: No valida si lastGeneratedPlan existe
if (result.success && result.data) {
  await applyGeneratedPlan(result.data); // Puede fallar si data es null
}

// ✅ Solución:
if (result.success && result.data && result.data.meals?.length > 0) {
  await applyGeneratedPlan(result.data);
} else {
  toast.error('Plan generado vacío o inválido');
}
```

**Estimación**: 3 horas

## 🟡 IMPORTANTE - Completar en 1 Semana

### 4. Accesibilidad Incompleta

**Ubicación**: Todos los componentes de UI
**Descripción**: Faltan labels ARIA y manejo de foco.

**Mejoras Requeridas**:
```tsx
// ❌ Problema: Botón sin label accesible
<button onClick={generatePlan}>
  <Sparkles />
  Generar Plan
</button>

// ✅ Solución:
<button 
  onClick={generatePlan}
  aria-label="Generar plan de comidas con IA"
  aria-describedby="ai-help-text"
>
  <Sparkles aria-hidden="true" />
  Generar Plan
</button>
```

**Estimación**: 8 horas

### 5. Error Handling Inconsistente

**Ubicación**: `src/features/meal-planning/hooks/useGeminiMealPlanner.ts`
**Descripción**: Algunos errores no se manejan correctamente.

```typescript
// ❌ Problema: Error genérico sin contexto
catch (error) {
  setError('Error desconocido');
}

// ✅ Solución:
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  const errorCode = getErrorCode(error);
  setError({ message: errorMessage, code: errorCode, timestamp: Date.now() });
  
  // Logging para debugging
  console.error('Meal planning error:', { error, context: { userId, operation } });
}
```

**Estimación**: 4 horas

### 6. Performance - Falta de Memoización

**Ubicación**: Componentes de grilla y modales
**Descripción**: Componentes pesados se re-renderizan innecesariamente.

```tsx
// ❌ Problema: Re-render en cada actualización
export default function MealPlannerGrid({ onRecipeSelect, onShoppingList }) {
  // Componente pesado sin memo
}

// ✅ Solución:
export default React.memo(function MealPlannerGrid({ 
  onRecipeSelect, 
  onShoppingList 
}) {
  // Componente optimizado
});

// Con hooks memoizados
const memoizedGridData = useMemo(() => 
  generateGridData(currentWeekPlan, recipes), 
  [currentWeekPlan, recipes]
);
```

**Estimación**: 6 horas

## 🟢 DESEABLE - Completar en 2-4 Semanas

### 7. Tests de Integración Faltantes

**Ubicación**: Tests creados pero necesitan integración
**Descripción**: Se crearon tests básicos pero faltan tests de integración E2E.

**Tests Creados**:
- ✅ `geminiPlannerService.test.ts` - Tests unitarios del servicio
- ✅ `useGeminiMealPlanner.test.ts` - Tests del hook principal  
- ✅ `useMealPlanningStore.test.ts` - Tests del store
- ✅ `generate.test.ts` - Tests de la API route

**Tests Faltantes**:
- Tests de integración completa del flujo
- Tests de rendimiento para operaciones largas
- Tests de accesibilidad automatizados

**Comandos para ejecutar**:
```bash
npm run test:meal-planning         # Ejecutar todos los tests
npm run test:meal-planning:watch   # Modo watch
npm run test:meal-planning:coverage # Con coverage
```

**Estimación**: 12 horas

### 8. Lazy Loading de Componentes

**Ubicación**: Modales y componentes pesados
**Descripción**: Componentes grandes se cargan innecesariamente.

```typescript
// ❌ Problema: Importación inmediata
import { RecipeSelectionModal } from './RecipeSelectionModal';

// ✅ Solución:
const RecipeSelectionModal = lazy(() => import('./RecipeSelectionModal'));

// Con loading fallback
<Suspense fallback={<ModalSkeleton />}>
  <RecipeSelectionModal />
</Suspense>
```

**Estimación**: 4 horas

### 9. Optimización de Bundle Size

**Ubicación**: Dependencias y imports
**Descripción**: Bundle más grande de lo necesario.

**Optimizaciones**:
```typescript
// ❌ Problema: Import completo
import * as lucideIcons from 'lucide-react';

// ✅ Solución: Import específico
import { Calendar, Settings, ShoppingCart } from 'lucide-react';

// Tree shaking mejorado
import { format } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
```

**Estimación**: 3 horas

## Priorización de Trabajo

### Sprint 1 (Esta semana)
1. **Corregir errores de TypeScript** - 6h
2. **Implementar limpieza de cache** - 2h  
3. **Agregar validación básica** - 3h
4. **Tests críticos** - 4h

**Total**: 15 horas

### Sprint 2 (Próxima semana)  
1. **Mejorar accesibilidad** - 8h
2. **Error handling robusto** - 4h
3. **Memoización básica** - 6h

**Total**: 18 horas

### Sprint 3 (Semanas 3-4)
1. **Tests de integración completos** - 12h
2. **Lazy loading** - 4h
3. **Optimización de bundle** - 3h
4. **Documentación final** - 3h

**Total**: 22 horas

## Scripts de Testing Creados

```bash
# Ejecutar tests del meal planning
npm run test:meal-planning

# Modo watch para desarrollo
npm run test:meal-planning:watch  

# Con reporte de coverage
npm run test:meal-planning:coverage

# Verificar tipos
npm run type-check
```

## Archivos de Test Creados

1. **`tests/__tests__/features/meal-planning/services/geminiPlannerService.test.ts`**
   - Tests unitarios completos del servicio Gemini
   - Cobertura: Constructor, generación holística, optimización diaria, feedback

2. **`tests/__tests__/features/meal-planning/hooks/useGeminiMealPlanner.test.ts`**
   - Tests del hook principal
   - Cobertura: Generación, optimización, aplicación, manejo de errores

3. **`tests/__tests__/features/meal-planning/store/useMealPlanningStore.test.ts`**
   - Tests del store Zustand
   - Cobertura: CRUD operations, cache, selectors, UI actions

4. **`tests/__tests__/api/meal-planning/generate.test.ts`**
   - Tests de la API route
   - Cobertura: Autenticación, validación, generación, errores

5. **`jest.config.meal-planning.js`**
   - Configuración específica para tests del meal planning
   - Cobertura mínima del 70% en todas las métricas

6. **`tests/setup/meal-planning-setup.js`**
   - Setup y mocks para tests
   - Mocks de localStorage, fetch, Next.js, Framer Motion, etc.

## Métricas de Calidad Objetivo

- **Cobertura de Tests**: ≥70% (configurado en Jest)
- **TypeScript**: 0 errores
- **Performance**: Core Web Vitals Green
- **Accesibilidad**: WCAG 2.1 AA compliant
- **Bundle Size**: <500KB inicial, <2MB total

## Estado Final

**Sistema funcional** con arquitectura sólida, pero requiere refinamiento en:
- ✅ **Funcionalidad Core**: Planificación con IA funciona
- ✅ **API Routes**: Bien implementadas con manejo de errores
- ✅ **Integración Gemini**: Excelente implementación
- ⚠️ **Tipos**: Necesita corrección de errores TS
- ⚠️ **Performance**: Necesita optimización
- ⚠️ **Accesibilidad**: Parcialmente implementada

**Calificación General: 7.5/10** - Sistema sólido que necesita pulido técnico.