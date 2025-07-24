# Implementation Guide: Step-by-Step Merge Process

## Pre-Implementation Checklist

- [ ] Backup current code
- [ ] Create feature branch: `feature/unified-weekly-planner`
- [ ] Review both implementations thoroughly
- [ ] Set up development environment
- [ ] Have both components running side-by-side for reference

## Step 1: Type System Preparation (30 mins)

### 1.1 Create Type Adapter
```typescript
// src/features/planner/utils/typeAdapters.ts

export function adaptGeminiSlotToPolished(geminiSlot: any): MealSlot {
  // Map from Gemini structure to Polished structure
  return {
    id: geminiSlot.id,
    date: new Date(geminiSlot.day), // Convert day name to date
    mealType: mapMealType(geminiSlot.slotType),
    meal: geminiSlot.recipe ? {
      id: geminiSlot.recipe.id,
      recipe: geminiSlot.recipe,
      servings: geminiSlot.schedule?.servings || 4,
      scheduledTime: geminiSlot.schedule?.time,
      notes: geminiSlot.notes,
      isLocked: geminiSlot.locked
    } : undefined
  };
}
```

## Step 2: Store Enhancement (1 hour)

### 2.1 Add AI State to Store
```typescript
// Update src/features/planner/store/weeklyPlannerStore.ts

interface WeeklyPlannerState {
  // ... existing state
  
  // AI Integration
  aiState: {
    isGenerating: boolean;
    progress: number;
    error: GeminiError | null;
    generationMethod: 'full' | 'batch' | null;
    lastGeneratedPlan: MealPlan | null;
  };
}

// Add new actions
generateWithAI: async (params) => {
  // Implementation
},
applyAIPlan: () => {
  // Implementation  
},
cancelGeneration: () => {
  // Implementation
}
```

## Step 3: Hook Creation (45 mins)

### 3.1 Create Bridge Hook
```typescript
// src/features/planner/hooks/useGeminiIntegration.ts

export function useGeminiIntegration() {
  const geminiHook = useGeminiMealPlan();
  const store = useWeeklyPlannerStore();
  
  // Bridge the two systems
  // Handle data transformation
  // Sync states
}
```

## Step 4: Component Preparation (1 hour)

### 4.1 Extract Shared Components
1. Copy GlassCard from WeeklyPlannerPolished
2. Make it a standalone component
3. Add TypeScript props interface
4. Test in isolation

### 4.2 Update Gemini Components
1. Add glass morphism to GeminiPlanConfirmDialog
2. Update button styles to match Polished
3. Add dark mode support

## Step 5: Main Component Creation (2-3 hours)

### 5.1 Create New WeeklyPlanner
```bash
# Copy base file
cp src/features/planner/components/WeeklyPlannerPolished.tsx \
   src/features/planner/components/WeeklyPlanner.new.tsx
```

### 5.2 Integration Points
Replace these sections in order:

1. **Import AI Hook**
   ```typescript
   import { useGeminiIntegration } from '../hooks/useGeminiIntegration';
   ```

2. **Replace Mock Generation**
   Find: `handlePlanWeek` function
   Replace with: AI generation logic

3. **Add Progress UI**
   Find: Below header, before grid
   Add: Progress component with glass morphism

4. **Update Meal Slots**
   Find: Meal slot rendering
   Add: AI state indicators

## Step 6: Testing Integration (1 hour)

### 6.1 Test Each Feature
- [ ] Generate full week
- [ ] View progress
- [ ] Handle errors
- [ ] Cancel generation
- [ ] Apply plan
- [ ] Lock/unlock meals
- [ ] Regenerate single slot
- [ ] Dark mode
- [ ] Mobile view

### 6.2 Edge Cases
- [ ] No user profile
- [ ] Empty pantry
- [ ] Network errors
- [ ] Timeout scenarios
- [ ] Rate limiting

## Step 7: UI Polish (1 hour)

### 7.1 Animation Timing
- Sync all animations
- Test performance
- Reduce motion option

### 7.2 Visual Consistency
- Color matching
- Shadow consistency
- Border radius alignment
- Spacing uniformity

## Step 8: Code Cleanup (30 mins)

### 8.1 Remove Old Components
```bash
# After testing, remove:
rm src/components/meal-planner/WeeklyPlannerWithGemini.tsx
rm src/features/planner/components/WeeklyPlannerPolished.tsx
```

### 8.2 Update Imports
```bash
# Find and replace all imports
grep -r "WeeklyPlannerPolished" src/
grep -r "WeeklyPlannerWithGemini" src/
```

## Step 9: Final Testing (1 hour)

### 9.1 Full User Journey
1. Fresh user → Generate plan → Apply → Modify → Save
2. Existing user → View plan → Regenerate slot → Lock → Generate shopping list
3. Error scenarios → Retry → Success

### 9.2 Performance Check
- Measure initial load
- Check animation FPS
- Test with slow network
- Memory usage monitoring

## Step 10: Documentation (30 mins)

### 10.1 Update README
- New features
- AI integration
- Configuration options

### 10.2 Component Documentation
- Props documentation
- Usage examples
- Architecture diagram

## Common Pitfalls to Avoid

1. **Type Mismatches**
   - Solution: Use type adapters consistently
   
2. **State Sync Issues**
   - Solution: Single source of truth in store
   
3. **Animation Conflicts**
   - Solution: Use layout groups properly
   
4. **Memory Leaks**
   - Solution: Clean up subscriptions
   
5. **API Rate Limits**
   - Solution: Implement proper throttling

## Rollback Plan

If issues arise:
1. Keep old components until fully tested
2. Use feature flags for gradual rollout
3. Maintain backwards compatibility
4. Have database migrations ready

## Success Validation

The merge is successful when:
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance metrics met
- [ ] Users can generate AI plans
- [ ] UI maintains polish
- [ ] Dark mode works perfectly
- [ ] Mobile experience smooth
- [ ] Loading states clear
- [ ] Error handling graceful

## Post-Merge Tasks

1. Monitor error rates
2. Gather user feedback
3. Track AI usage metrics
4. Optimize based on data
5. Plan next features

## Deployment Strategy

1. **Staging First**
   - Deploy to staging
   - Run E2E tests
   - Check monitoring
   
2. **Canary Release**
   - 10% of users first
   - Monitor for 24 hours
   - Gradual increase
   
3. **Full Release**
   - 100% deployment
   - Monitor closely
   - Quick rollback ready

## Time Estimate

- Preparation: 30 minutes
- Implementation: 6-8 hours
- Testing: 2 hours
- Polish: 1 hour
- Documentation: 30 minutes

**Total: 10-12 hours of focused work**