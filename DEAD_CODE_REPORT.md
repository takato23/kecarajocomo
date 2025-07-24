# Dead Code Analysis Report

Generated on: 2025-07-23

## Summary

This report identifies dead code patterns found in the src/ directory of the codebase.

## 1. Console.log Statements (215+ occurrences)

These should be removed or replaced with proper logging service:

### High Priority (Error Handling)
- **src/contexts/ProfileContext.tsx**
  - Line 89: `console.error('Error initializing profile:', error);`
  - Line 111: `console.error('Error loading household members:', err);`

- **src/hooks/usePantry.ts**
  - Line 47: `console.error('Error fetching pantry items:', error);`
  - Line 92: `console.error('Error adding item to pantry:', error);`
  - Line 129: `console.error('Error adding multiple items to pantry:', error);`
  - Line 144: `console.error('Error updating pantry item:', error);`
  - Line 161: `console.error('Error deleting pantry item:', error);`
  - Line 187: `console.log('Realtime update:', payload);` // Debug log

### Debug Logs (Should be removed)
- **src/components/meal-planner/RevolutionaryMealPlanner.tsx**
  - Line 1050: `console.log('Quick action:', action, meal);`

- **src/hooks/useVoiceRecording.ts**
  - Line 56: `console.log('Voice recording started');`
  - Line 62: `console.log('Voice recording ended');`

- **src/services/recipes/RecipeScraper.ts**
  - Line 50: `console.log('🔍 Buscando recetas con:', ingredients.join(', '));`
  - Line 68: `console.log('🌐 Scrapeando receta desde:', url);`
  - Line 96: `console.log('🔄 Adaptando receta:', recipe.name);`

- **src/middleware.ts**
  - Line 7: `console.log('[Middleware] Request to: ${pathname}');` // Should use proper logging

- **src/app/(app)/layout-appshell.tsx**
  - Line 47: `console.log('AppLayout Debug:', {` // Debug code in production

## 2. TODO/FIXME Comments (60+ occurrences)

### High Priority TODOs
- **src/services/pantry/PantryManager.ts**
  - Line 248: `// TODO: Obtener precio promedio del ingrediente`
  - Line 451: `// TODO: Agregar predicciones basadas en patrones de uso`

- **src/hooks/usePantry.ts**
  - Line 79: `// TODO: Handle photo upload`

- **src/stores/meal-planner.ts**
  - Line 329: `nutritional_summary: {}, // TODO: Calculate from recipes`
  - Line 330: `ingredient_usage: {}, // TODO: Calculate from recipe ingredients`
  - Line 374: `missing_ingredients: [], // TODO: Calcular`

### Files Marked for Removal
- **src/hooks/useUnifiedVoice.ts**
  - Line 3: `// TODO: Remove this file once all imports are updated`
  - Line 22: `console.warn('Deprecated: Use useVoiceService() from @/services/voice instead');`

- **src/lib/ai.ts**
  - Line 3: `// TODO: Remove this file once all imports are updated`
  - Line 17: `console.warn('Deprecated: Use UnifiedAIService.generateRecipe() instead');`

- **src/services/receiptScannerService.ts**
  - Line 3: `// TODO: Remove this file once all imports are updated`

### Incomplete Implementations
- **src/services/recipes/RecipeScraper.ts**
  - Line 70: `// TODO: Implementar scraping real con fetch y parsing`

- **src/services/planner/MealPlanner.ts**
  - Line 453: `// TODO: Implementar guardado en Supabase`
  - Line 492: `// TODO: Implementar estimación real basada en precios promedio`

- **src/services/core/HolisticSystem.ts**
  - Line 139: `// TODO: Implementar con Gemini API`
  - Line 153: `// TODO: Implementar cuando tengamos la API key`

## 3. Empty or Nearly Empty Files

### Empty Files (0 lines)
- **src/app/(app)/shopping/page.tsx**

### Files with ≤1 line
- **src/app/dashboard/page.tsx** (1 line)
- **src/components/profile/tabs/index.ts** (1 line)
- **src/components/profile/mobile/index.ts** (1 line)
- **src/lib/supabase.ts** (1 line - just a re-export)
- **src/design-system/components/primitives/Input/index.ts** (1 line)
- **src/design-system/components/primitives/Button/index.ts** (1 line)

### Files with minimal content (≤6 lines)
- **src/app/(app)/app/page.tsx** (6 lines)
- **src/app/(app)/page.tsx** (6 lines)
- **src/app/(app)/profile/page.tsx** (4 lines)
- **src/app/meal-planner/page.tsx** (5 lines)
- **src/features/pantry/components/index.ts** (6 lines)
- **src/features/pantry/index.ts** (6 lines)
- **src/features/dashboard/components/index.ts** (4 lines)
- **src/features/app-shell/components/pages/DashboardPage.tsx** (5 lines)
- **src/stores/index.ts** (5 lines)

## 4. Deprecated Code

### Deprecated Functions/Warnings
- **src/hooks/useUnifiedVoice.ts**
  - Entire file marked as deprecated with console.warn

- **src/lib/ai.ts**
  - Legacy wrapper functions with deprecation warnings

- **src/features/app-shell/__tests__/setup.ts**
  - Lines 18-19: `addListener: vi.fn(), // deprecated`
  - Lines 19: `removeListener: vi.fn(), // deprecated`

## 5. Commented Out Code

### Unused Imports
- **src/components/price-scraper/PriceSearchComponent.tsx**
  - Line 12: `// import { Switch } from '@/components/ui/switch';`

## 6. Duplicate or Similar Code Patterns

### Re-export Files (Potential for consolidation)
- **src/store/recipeStore.ts** - Just re-exports from main store
- **src/store/nutritionStore.ts** - Basic nutrition store for backward compatibility
- **src/store/pantryStore.ts** - Re-exports pantry functionality

## 7. Test Files

No disabled tests (describe.skip, it.skip, etc.) were found, which is good.

## Recommendations

1. **Remove all console.log statements** and replace with proper logging service
2. **Address high-priority TODOs** or remove if no longer relevant
3. **Delete empty files** or add proper implementations
4. **Remove deprecated files** after ensuring all imports are updated
5. **Consolidate re-export files** to reduce file count
6. **Clean up commented code** - either implement or remove
7. **Implement proper error handling** instead of console.error

## Quick Wins

1. Delete these empty/minimal files:
   - src/app/(app)/shopping/page.tsx
   - src/app/dashboard/page.tsx
   - src/components/profile/tabs/index.ts
   - src/components/profile/mobile/index.ts

2. Remove deprecated files after updating imports:
   - src/hooks/useUnifiedVoice.ts
   - src/lib/ai.ts
   - src/services/receiptScannerService.ts

3. Remove debug console.logs in:
   - src/middleware.ts
   - src/app/(app)/layout-appshell.tsx
   - src/components/meal-planner/RevolutionaryMealPlanner.tsx

## Statistics

- **Console statements**: 215+ occurrences
- **TODO/FIXME comments**: 60+ occurrences
- **Empty/minimal files**: 27 files with ≤10 lines
- **Deprecated files**: 3 files marked for removal
- **Files to potentially delete**: 10+ files