# Meal Planner Consolidation - Quick Reference

## Current State Summary

### 🔴 Issues to Address
1. **Multiple Implementations**: 3 different meal planner versions
2. **Broken Imports**: Legacy `/meal-planning` has missing components
3. **Inconsistent State**: Different stores with different approaches
4. **Route Confusion**: `/meal-planning` vs `/planificador`
5. **Mixed Languages**: English and Spanish mixed in codebase

### ✅ Assets to Preserve
1. **Modern UI**: Planificador has excellent drag-drop UI
2. **AI Integration**: Both Gemini implementations work
3. **Store Architecture**: planning-v2 store is well-structured
4. **Service Layer**: Good separation of concerns

## Consolidation Strategy

### Phase 1: Unify Data Layer ⚡
```bash
# Create new unified structure
/src/features/meal-planner/
├── store/          # Consolidated Zustand store
├── types/          # Unified TypeScript types
├── services/       # API and AI services
└── hooks/          # Custom React hooks
```

### Phase 2: Component Migration 🎨
```bash
# Best components from each implementation
- MealSlot: Use planificador's drag-drop version
- WeekView: Enhance planning-v2's calendar
- Stats: Keep planificador's ModernPlannerStats
- AI Modal: Merge both AI implementations
```

### Phase 3: Route Consolidation 🛣️
```typescript
// Single route with i18n support
const routes = {
  en: '/meal-planner',
  es: '/planificador'
};
```

## Key Files to Review

### Must Analyze (Use Gemini for large analysis)
```bash
# Core implementations
src/app/(app)/meal-planning/page.tsx         # Legacy (broken)
src/app/(app)/planificador/page.tsx          # New UI (working)
src/features/planning-v2/stores/planningV2Store.ts  # Best store
src/store/slices/mealPlanSlice.ts            # Original store

# AI Services
src/lib/services/mealPlanningAI.ts           # Comprehensive AI
src/features/planning-v2/logic/aiPlannerLogic.ts  # V2 AI logic
```

### Components to Merge
```bash
# UI Components
src/app/(app)/planificador/components/UltraModernMealPlannerGrid.tsx
src/components/meal-planner/MealSlotDesigns.tsx
src/components/planner/EnhancedMealCard.tsx
```

## Database Schema

### Current Tables (if exist)
```sql
-- Check existing schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%meal%';
```

### New Unified Schema
```sql
-- Core tables needed
meal_plans        # User's meal plans
planned_meals     # Individual meals in plans
meal_templates    # Reusable templates
shopping_lists    # Generated lists
```

## Quick Commands

### Development Setup
```bash
# Create feature branch
git checkout -b feature/unified-meal-planner

# Install dependencies (if needed)
npm install @tanstack/react-query framer-motion

# Run development
npm run dev
```

### Testing Endpoints
```bash
# Current routes to test
http://localhost:3000/meal-planning    # Legacy
http://localhost:3000/planificador     # New
http://localhost:3000/meal-planner     # Future unified
```

## Priority Actions

### 🚨 Immediate (Day 1)
1. Fix broken imports in `/meal-planning/page.tsx` OR redirect to `/planificador`
2. Document which implementation is currently live
3. Create feature flag for safe development

### ⚡ Short Term (Week 1)
1. Create unified type system
2. Build consolidated store
3. Set up new directory structure

### 🎯 Medium Term (Week 2-3)
1. Migrate best components
2. Integrate AI services
3. Build migration tools

### 🚀 Long Term (Week 4)
1. Full testing suite
2. Performance optimization
3. Progressive rollout

## Common Patterns

### Store Pattern
```typescript
// Unified store structure
const useMealPlannerStore = create<Store>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        plans: [],
        currentPlan: null,
        
        // Actions
        createPlan: async (plan) => {
          const newPlan = await api.createPlan(plan);
          set(state => {
            state.plans.push(newPlan);
          });
        }
      }))
    )
  )
);
```

### Component Pattern
```typescript
// Consistent component structure
export const MealComponent: FC<Props> = memo(({
  meal,
  onEdit,
  onDelete
}) => {
  // Hooks
  const { updateMeal } = useMealPlannerStore();
  
  // Handlers
  const handleEdit = useCallback(() => {
    // Edit logic
  }, [meal, onEdit]);
  
  // Render
  return (
    <motion.div>
      {/* Component UI */}
    </motion.div>
  );
});
```

## Useful Gemini Commands

```bash
# Analyze entire meal planner codebase
gemini -p "@src/app/(app)/meal-planning @src/app/(app)/planificador @src/features/planning-v2 Compare these meal planner implementations and identify the best approach for consolidation"

# Check for existing implementations
gemini -p "@src/ Has a unified meal planner been implemented? List all meal planning related components and their status"

# Find all meal-related database queries
gemini -p "@src/ Find all Supabase queries related to meal planning, recipes, and shopping lists"
```

## Contact & Resources

- **Architecture Plan**: `/docs/MEAL_PLANNER_CONSOLIDATION_PLAN.md`
- **Implementation Guide**: `/docs/MEAL_PLANNER_IMPLEMENTATION_GUIDE.md`
- **Technical Roadmap**: `/docs/MEAL_PLANNER_TECHNICAL_ROADMAP.md`

---

**Quick Start**: Begin with fixing the immediate route issue, then follow the consolidation plan phase by phase.