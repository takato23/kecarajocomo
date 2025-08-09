# Plan de Mejora de Testing - Kecarajocomer

## 📊 Estado Actual del Testing

### Cobertura de Testing por Módulo

**Meal Planning (Crítico):**
- ✅ Tests de integración existentes: `mealPlanningFlow.test.tsx`
- ❌ Cobertura muy baja: <5% en componentes críticos
- ❌ Tests unitarios faltantes para hooks y servicios
- ❌ E2E tests faltantes para meal planning

**Pantry Management (Crítico):**
- ✅ E2E tests básicos existentes: `pantry-management.spec.ts`
- ❌ Tests unitarios faltantes para componentes
- ❌ Tests de integración con AI services faltantes
- ❌ Tests de performance para gestión de inventory

**AI Services (Crítico):**
- ✅ Tests básicos de GeminiService
- ❌ Tests de integración con meal planning faltantes
- ❌ Tests de fallback y error handling insuficientes
- ❌ Tests de performance y rate limiting faltantes

## 🎯 Prioridades de Testing (Orden de Implementación)

### Prioridad 1: Tests Unitarios Críticos (Semana 1-2)

#### 1.1 Meal Planning Core Components
```
src/features/meal-planning/components/__tests__/
├── MealPlannerGrid.test.tsx ⚠️ (0% coverage → 80%+)
├── MealSlot.test.tsx ✅ (existente)
├── MealCard.test.tsx ❌ (crear)
├── RecipeSelectionModal.test.tsx ❌ (crear)
└── ShoppingListModal.test.tsx ❌ (crear)
```

#### 1.2 Meal Planning Hooks
```
src/hooks/meal-planning/__tests__/
├── useMealPlanning.test.ts ❌ (90% coverage target)
├── useGeminiMealPlanner.test.ts ❌ (crear)
└── useMealPlanningStore.test.ts ❌ (crear)
```

#### 1.3 AI Services Core
```
src/services/ai/__tests__/
├── GeminiService.test.ts ✅ (mejorar)
├── UnifiedAIService.test.ts ❌ (crear)
├── AIProviders.test.ts ❌ (crear)
└── AIServiceIntegration.test.ts ❌ (crear)
```

### Prioridad 2: Tests de Integración (Semana 3-4)

#### 2.1 Meal Planning Integration
```
src/features/meal-planning/__tests__/integration/
├── mealPlanningFlow.test.tsx ✅ (mejorar)
├── aiMealGeneration.test.tsx ❌ (crear)
├── pantryIntegration.test.tsx ❌ (crear)
└── shoppingListGeneration.test.tsx ❌ (crear)
```

#### 2.2 Pantry Management Integration
```
src/features/pantry/__tests__/integration/
├── pantryFlow.test.tsx ❌ (crear)
├── aiPantryAnalysis.test.tsx ❌ (crear)
├── expirationNotifications.test.tsx ❌ (crear)
└── recipeAvailability.test.tsx ❌ (crear)
```

### Prioridad 3: Tests E2E Completos (Semana 5-6)

#### 3.1 Meal Planning E2E
```
e2e/meal-planning/
├── meal-planner-complete-flow.spec.ts ❌ (crear)
├── meal-generation-scenarios.spec.ts ❌ (crear)
├── meal-modification-flow.spec.ts ❌ (crear)
└── shopping-list-generation.spec.ts ❌ (crear)
```

#### 3.2 Pantry Management E2E
```
e2e/pantry/
├── pantry-management.spec.ts ✅ (mejorar)
├── pantry-ai-integration.spec.ts ❌ (crear)
├── barcode-scanning.spec.ts ❌ (crear)
└── expiration-alerts.spec.ts ❌ (crear)
```

### Prioridad 4: Tests de Performance y Stress (Semana 7)

#### 4.1 Performance Tests
```
src/__tests__/performance/
├── mealPlanningPerformance.test.ts ❌ (crear)
├── aiServicePerformance.test.ts ❌ (crear)
├── pantryPerformance.test.ts ❌ (crear)
└── databasePerformance.test.ts ❌ (crear)
```

## 🛠 Tests Críticos a Crear

### 1. Meal Planning Hook Test (Crítico)
```typescript
// src/hooks/meal-planning/__tests__/useMealPlanning.test.ts
describe('useMealPlanning Hook', () => {
  describe('Plan Generation', () => {
    it('should generate weekly plan with user preferences')
    it('should handle generation errors gracefully')
    it('should respect pantry availability')
    it('should apply cultural preferences correctly')
  })
  
  describe('Plan Modification', () => {
    it('should regenerate individual meals')
    it('should swap meals between slots')
    it('should lock/unlock meals')
    it('should update nutrition summary')
  })
  
  describe('Persistence', () => {
    it('should auto-save changes')
    it('should load plans for different weeks')
    it('should handle offline mode')
  })
})
```

### 2. AI Service Integration Test (Crítico)
```typescript
// src/services/ai/__tests__/AIServiceIntegration.test.ts
describe('AI Service Integration', () => {
  describe('Meal Generation', () => {
    it('should generate culturally appropriate meals')
    it('should fallback between AI providers')
    it('should handle rate limiting')
    it('should cache successful responses')
  })
  
  describe('Error Handling', () => {
    it('should handle API failures gracefully')
    it('should provide meaningful error messages')
    it('should retry with exponential backoff')
  })
})
```

### 3. Pantry AI Integration Test (Crítico)
```typescript
// src/features/pantry/__tests__/integration/aiPantryAnalysis.test.ts
describe('Pantry AI Analysis', () => {
  describe('Recipe Availability', () => {
    it('should check recipe ingredient availability')
    it('should suggest recipe modifications')
    it('should calculate missing ingredients cost')
  })
  
  describe('Smart Suggestions', () => {
    it('should suggest recipes based on expiring items')
    it('should optimize shopping lists')
    it('should predict consumption patterns')
  })
})
```

### 4. Complete E2E Meal Planning Flow (Crítico)
```typescript
// e2e/meal-planning/meal-planner-complete-flow.spec.ts
test.describe('Complete Meal Planning Flow', () => {
  test('should complete full weekly meal planning workflow', async ({ page }) => {
    // 1. Navigate to meal planner
    // 2. Set user preferences
    // 3. Generate weekly plan
    // 4. Modify meals
    // 5. Generate shopping list
    // 6. Save and verify persistence
  })
  
  test('should handle cultural meal requirements', async ({ page }) => {
    // Test specific to Argentine meal traditions
  })
  
  test('should integrate with pantry effectively', async ({ page }) => {
    // Test pantry integration and recipe availability
  })
})
```

## 📋 Archivos de Testing a Crear

### Tests Unitarios Faltantes (15 archivos)
1. `src/features/meal-planning/components/__tests__/MealCard.test.tsx`
2. `src/features/meal-planning/components/__tests__/RecipeSelectionModal.test.tsx`
3. `src/features/meal-planning/components/__tests__/ShoppingListModal.test.tsx`
4. `src/features/meal-planning/components/__tests__/MealPlannerSkeleton.test.tsx`
5. `src/hooks/meal-planning/__tests__/useMealPlanning.test.ts`
6. `src/hooks/meal-planning/__tests__/useGeminiMealPlanner.test.ts`
7. `src/services/ai/__tests__/UnifiedAIService.test.ts`
8. `src/services/ai/__tests__/AIProviders.test.ts`
9. `src/features/pantry/components/__tests__/PantryDashboard.test.tsx`
10. `src/features/pantry/components/__tests__/PantryItemCard.test.tsx`
11. `src/features/pantry/components/__tests__/RecipeAvailabilityCheck.test.tsx`
12. `src/features/pantry/hooks/__tests__/usePantryNotifications.test.ts`
13. `src/lib/services/__tests__/geminiMealPlannerAPI.test.ts`
14. `src/lib/services/__tests__/mealPlanningAI.test.ts`
15. `src/store/slices/__tests__/pantrySlice.test.ts`

### Tests de Integración Faltantes (8 archivos)
1. `src/features/meal-planning/__tests__/integration/aiMealGeneration.test.tsx`
2. `src/features/meal-planning/__tests__/integration/pantryIntegration.test.tsx`
3. `src/features/meal-planning/__tests__/integration/shoppingListGeneration.test.tsx`
4. `src/features/pantry/__tests__/integration/pantryFlow.test.tsx`
5. `src/features/pantry/__tests__/integration/aiPantryAnalysis.test.tsx`
6. `src/features/pantry/__tests__/integration/expirationNotifications.test.tsx`
7. `src/features/pantry/__tests__/integration/recipeAvailability.test.tsx`
8. `src/services/ai/__tests__/AIServiceIntegration.test.ts`

### Tests E2E Faltantes (8 archivos)
1. `e2e/meal-planning/meal-planner-complete-flow.spec.ts`
2. `e2e/meal-planning/meal-generation-scenarios.spec.ts`
3. `e2e/meal-planning/meal-modification-flow.spec.ts`
4. `e2e/meal-planning/shopping-list-generation.spec.ts`
5. `e2e/pantry/pantry-ai-integration.spec.ts`
6. `e2e/pantry/barcode-scanning.spec.ts`
7. `e2e/pantry/expiration-alerts.spec.ts`
8. `e2e/integration/meal-planning-pantry-integration.spec.ts`

### Tests de Performance (4 archivos)
1. `src/__tests__/performance/mealPlanningPerformance.test.ts`
2. `src/__tests__/performance/aiServicePerformance.test.ts`
3. `src/__tests__/performance/pantryPerformance.test.ts`
4. `src/__tests__/performance/databasePerformance.test.ts`

## 🎯 Métricas de Cobertura Objetivo

### Targets por Módulo:
- **Meal Planning**: 85%+ cobertura (actualmente <5%)
- **Pantry Management**: 80%+ cobertura (actualmente ~30%)
- **AI Services**: 85%+ cobertura (actualmente ~40%)
- **Core Hooks**: 90%+ cobertura (actualmente 0%)
- **API Routes**: 75%+ cobertura (actualmente ~20%)

### Targets por Tipo de Test:
- **Tests Unitarios**: 35+ archivos nuevos
- **Tests de Integración**: 8+ archivos nuevos  
- **Tests E2E**: 8+ archivos nuevos
- **Tests de Performance**: 4+ archivos nuevos

## 🔧 Configuración de Testing Requerida

### Mejoras a Jest Configuration:
1. **Separar configuraciones por tipo de test**
2. **Aumentar timeouts para tests de integración**
3. **Mejorar coverage reporting**
4. **Agregar test utilities para AI mocking**

### Mejoras a Playwright Configuration:
1. **Configurar tests paralelos**
2. **Agregar device testing (mobile/desktop)**
3. **Configurar visual regression testing**
4. **Implementar test retry strategies**

## 📈 Timeline de Implementación

### Semana 1-2: Tests Unitarios Críticos
- **Objetivo**: Crear 15 archivos de tests unitarios
- **Prioridad**: Meal planning hooks y componentes principales
- **Resultado esperado**: 60%+ cobertura en meal planning core

### Semana 3-4: Tests de Integración
- **Objetivo**: Crear 8 archivos de tests de integración
- **Prioridad**: AI services integration y pantry integration
- **Resultado esperado**: 75%+ cobertura en integraciones críticas

### Semana 5-6: Tests E2E Completos
- **Objetivo**: Crear 8 archivos de tests E2E
- **Prioridad**: Complete user workflows
- **Resultado esperado**: Workflows críticos 100% tested

### Semana 7: Performance y Optimization
- **Objetivo**: Crear 4 archivos de performance tests
- **Prioridad**: Identify bottlenecks y optimize
- **Resultado esperado**: Performance baselines established

## 🚀 Beneficios Esperados

### Calidad del Código:
- **Reducción de bugs en producción**: 70%+
- **Faster debugging y troubleshooting**
- **Mejor maintainability del código**

### Desarrollo:
- **Confidence en deployments**: 90%+
- **Faster development cycles**
- **Better code review process**

### Performance:
- **Identify bottlenecks temprano**
- **Optimize critical paths**
- **Monitor performance regressions**

---

**Total de archivos de test a crear: 35+**  
**Tiempo estimado: 7 semanas**  
**Cobertura objetivo: 85%+ en módulos críticos**