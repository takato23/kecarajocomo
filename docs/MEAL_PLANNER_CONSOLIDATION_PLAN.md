# Meal Planner Consolidation Architecture Plan

## Executive Summary

The current codebase has multiple meal planner implementations that need to be consolidated into a single, unified architecture. This document outlines the architectural approach to consolidate these implementations while maintaining system stability and enhancing functionality.

## Current State Analysis

### Identified Implementations

1. **Legacy Implementation** (`/meal-planning/page.tsx`)
   - Uses `useMealPlansStore()` (appears to be undefined/missing)
   - Basic CRUD operations for meal plans
   - Simple UI with calendar view
   - Missing component imports (MealPlanCalendar, RecipeSelector)

2. **Planificador Implementation** (`/planificador/`)
   - Modern implementation with drag-and-drop
   - Multiple UI variations (UltraModern, Enhanced, DragDrop, Simple)
   - Uses local state management (useState)
   - Mock data approach
   - Rich UI with week navigation and stats

3. **Store Layer Implementations**
   - `mealPlanSlice.ts`: Zustand slice with comprehensive state management
   - `planningV2Store.ts`: New Zustand store with immer, devtools, and persistence
   - Different data models and approaches

4. **Service Layer**
   - `mealPlanningAI.ts`: AI-powered meal planning with Gemini integration
   - `planningV2Service.ts`: CRUD service layer for planning-v2
   - `aiPlannerLogic.ts`: AI planning logic for v2

5. **Component Libraries**
   - `/components/meal-planner/`: Shared UI components (MealSlotDesigns)
   - `/components/planner/`: Enhanced meal card components
   - Multiple grid implementations with different features

## Architectural Decisions

### 1. Unified Data Model

```typescript
// Consolidated data model combining best of both approaches
interface UnifiedMealPlan {
  // Core identification
  id: string;
  userId: string;
  
  // Time boundaries
  weekStartDate: Date;
  weekEndDate: Date;
  
  // Meal data
  meals: PlannedMeal[];
  
  // Metadata
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Enhanced features from v2
  nutritionSummary?: NutritionSummary;
  budgetSummary?: BudgetSummary;
  prepPlan?: PrepPlan;
  shoppingList?: ShoppingList;
  
  // AI integration
  aiGenerated?: boolean;
  aiConfidence?: number;
  metadata?: PlanMetadata;
}

interface PlannedMeal {
  id: string;
  planDate: string; // ISO date
  mealType: MealType;
  
  // Recipe reference
  recipeId?: string;
  recipe?: Recipe;
  
  // Custom meal support
  customMealName?: string;
  customMealDescription?: string;
  
  // Meal details
  servings: number;
  notes?: string;
  
  // Status tracking
  isCompleted: boolean;
  completedAt?: Date;
  isLocked?: boolean;
  
  // Nutrition override
  nutritionOverride?: Nutrition;
}
```

### 2. State Management Strategy

**Decision**: Use the planning-v2 store as the foundation with enhancements

```typescript
// Enhanced unified store
export const useMealPlannerStore = create<MealPlannerStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State from both implementations
        plans: [],
        currentPlan: null,
        currentWeek: new Date(),
        
        // UI state
        view: 'week', // week | month | list
        draggedMeal: null,
        selectedSlots: [],
        
        // Settings
        preferences: {
          ...defaultPreferences,
          uiMode: 'modern', // classic | modern | ultra
        },
        
        // Unified actions
        ...mealPlanActions,
        ...uiActions,
        ...aiActions,
      }))
    )
  )
);
```

### 3. Component Architecture

```
/src/features/meal-planner/
├── components/
│   ├── core/
│   │   ├── MealSlot.tsx         # Unified meal slot component
│   │   ├── WeekView.tsx         # Week calendar view
│   │   ├── DayColumn.tsx        # Day column component
│   │   └── MealCard.tsx         # Meal display card
│   ├── navigation/
│   │   ├── WeekNavigator.tsx    # Week navigation
│   │   └── ViewToggle.tsx       # View mode toggle
│   ├── modals/
│   │   ├── RecipeSelector.tsx   # Recipe selection modal
│   │   ├── MealEditor.tsx       # Meal editing modal
│   │   └── AIPlanner.tsx        # AI planning modal
│   └── stats/
│       ├── WeekStats.tsx        # Weekly statistics
│       └── NutritionSummary.tsx # Nutrition overview
├── hooks/
│   ├── useMealPlanner.ts        # Main hook
│   ├── useDragDrop.ts           # Drag-drop logic
│   └── useAIPlanning.ts         # AI integration
├── services/
│   ├── mealPlannerService.ts    # Unified service layer
│   └── aiPlanningService.ts     # AI service
├── store/
│   └── mealPlannerStore.ts      # Unified store
├── types/
│   └── index.ts                 # Consolidated types
└── utils/
    ├── dateHelpers.ts           # Date utilities
    └── nutritionCalculator.ts   # Nutrition calculations
```

### 4. Migration Strategy

#### Phase 1: Foundation (Week 1)
1. Create new `/features/meal-planner/` directory structure
2. Consolidate types and interfaces
3. Build unified store combining best features
4. Create service layer abstraction

#### Phase 2: Component Consolidation (Week 2)
1. Build core components using best UI from each implementation
2. Implement drag-and-drop using existing logic
3. Create responsive design system
4. Build modal components

#### Phase 3: Feature Integration (Week 3)
1. Integrate AI planning from both implementations
2. Implement nutrition tracking
3. Add shopping list generation
4. Build meal prep planning

#### Phase 4: Migration & Testing (Week 4)
1. Create migration utilities for existing data
2. Build comprehensive test suite
3. Implement feature flags for gradual rollout
4. Update all route references

### 5. Route Consolidation

**Current Routes:**
- `/meal-planning` (legacy)
- `/planificador` (new Spanish route)

**Proposed Solution:**
```typescript
// Route configuration with i18n support
const mealPlannerRoutes = {
  en: '/meal-planner',
  es: '/planificador',
  // Legacy redirects
  '/meal-planning': '/meal-planner',
};
```

### 6. Key Features to Preserve

1. **From Legacy Implementation:**
   - Simple calendar view
   - Shopping list generation
   - Basic meal management

2. **From Planificador:**
   - Modern UI with animations
   - Drag-and-drop functionality
   - Week navigation
   - Comprehensive stats
   - Multiple view modes

3. **From Planning-v2:**
   - AI integration
   - Nutrition tracking
   - Batch operations
   - Intelligent shopping parser

### 7. New Unified Features

1. **Adaptive UI**: Support multiple UI modes (classic, modern, ultra)
2. **Progressive Enhancement**: Basic functionality works without JS
3. **Offline Support**: PWA capabilities with service workers
4. **Multi-language**: Full i18n support
5. **Smart Suggestions**: AI-powered meal suggestions based on history
6. **Meal Templates**: Save and reuse weekly templates
7. **Family Planning**: Support for different family member preferences

## Implementation Checklist

- [ ] Create unified type definitions
- [ ] Build consolidated store
- [ ] Develop core components
- [ ] Implement service layer
- [ ] Add AI integration
- [ ] Build migration utilities
- [ ] Create comprehensive tests
- [ ] Update routing
- [ ] Add feature flags
- [ ] Implement monitoring
- [ ] Create documentation
- [ ] Plan rollout strategy

## Success Metrics

1. **Code Reduction**: 40-50% less duplicated code
2. **Performance**: <100ms interaction response time
3. **Bundle Size**: <200KB for meal planner chunk
4. **Test Coverage**: >90% for critical paths
5. **User Adoption**: Smooth migration with <1% error rate

## Risk Mitigation

1. **Data Loss**: Implement comprehensive backup before migration
2. **Feature Parity**: Ensure all existing features are preserved
3. **Performance**: Profile and optimize before deployment
4. **User Experience**: A/B test with small user group first

## Next Steps

1. Review and approve architectural plan
2. Set up new directory structure
3. Begin Phase 1 implementation
4. Create detailed technical specifications
5. Assign development resources

---

**Document Version**: 1.0  
**Last Updated**: July 2025  
**Author**: Architecture Team  
**Status**: Pending Review