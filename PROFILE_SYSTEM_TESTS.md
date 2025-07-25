# Profile System Test Suite

This document provides an overview of the comprehensive test suite for the profile system components and services.

## 📁 Test Structure

```
src/
├── __tests__/
│   └── utils/
│       └── profileTestUtils.ts          # Test utilities and mocks
├── contexts/__tests__/
│   └── ProfileContext.test.tsx          # Context providers and hooks
├── services/
│   ├── profile/__tests__/
│   │   ├── ProfileRecommendationEngine.test.ts
│   │   └── ProfileCompletionService.test.ts
│   └── error/__tests__/
│       └── ProfileErrorHandler.test.ts
├── hooks/__tests__/
│   └── useAutoSave.test.ts              # Auto-save functionality
└── components/profile/__tests__/
    └── ProfileHub.test.tsx              # Main UI component
```

## 🧪 Test Coverage Overview

### 1. ProfileContext.test.tsx
**Coverage: Context providers, hooks, and data management**

- ✅ **ProfileProvider**: Component rendering and initialization
- ✅ **useProfileData**: Profile and preferences data access
- ✅ **useHouseholdContext**: Household member management
- ✅ **useProfileActions**: Profile update operations
- ✅ **useProfileComputed**: Derived data calculations
- ✅ **Memoization**: Performance optimization verification
- ✅ **Error Handling**: Graceful error recovery
- ✅ **Backward Compatibility**: Legacy hook support

**Key Test Scenarios:**
- Profile initialization with and without user data
- CRUD operations for household members
- File upload for avatar changes
- Cache management and clearing
- Computed value calculations (dietary restrictions, allergies, etc.)
- Error scenarios (network failures, validation errors)

### 2. ProfileRecommendationEngine.test.ts
**Coverage: AI-powered recommendation system**

- ✅ **Recommendation Generation**: Comprehensive profile analysis
- ✅ **Priority Scoring**: Confidence and relevance calculations
- ✅ **Adaptive Questionnaire**: Dynamic question generation
- ✅ **Nutritional Goals**: Health-based recommendations
- ✅ **Recipe Suggestions**: Personalized recipe matching
- ✅ **Ingredient Learning**: Preference pattern recognition
- ✅ **Behavior Analysis**: Activity pattern insights
- ✅ **Edge Cases**: Null/incomplete data handling

**Key Test Scenarios:**
- Complete vs incomplete profile recommendations
- Dietary restriction-based suggestions
- Budget optimization recommendations
- Cooking skill progression paths
- Behavioral pattern analysis
- Error handling and fallback strategies

### 3. ProfileCompletionService.test.ts
**Coverage: Gamification and completion tracking**

- ✅ **Completion Metrics**: Section-wise completion calculation
- ✅ **Achievement System**: 20+ achievement types
- ✅ **Level Progression**: Point-based leveling system
- ✅ **Streak Tracking**: Daily usage streaks
- ✅ **Suggestion Engine**: Improvement recommendations
- ✅ **Weighted Scoring**: Section importance weighting
- ✅ **Progress Tracking**: Achievement progress monitoring

**Key Test Scenarios:**
- Complete vs partial profile scoring
- Individual achievement unlock conditions
- Level calculation and thresholds
- Suggestion prioritization
- Progress tracking and validation
- Section completion algorithms

### 4. ProfileErrorHandler.test.ts
**Coverage: Comprehensive error management**

- ✅ **Error Classification**: 16+ error code types
- ✅ **Severity Levels**: Low, medium, high, critical
- ✅ **Recovery Strategies**: 6 recovery patterns
- ✅ **User Messages**: Spanish localized messages
- ✅ **Error History**: Error tracking and analysis
- ✅ **Toast Notifications**: User feedback system
- ✅ **Logging**: Development and production logging

**Key Test Scenarios:**
- Error categorization from generic errors
- User-friendly message generation
- Recovery action generation
- Error history management
- Notification system integration
- Context preservation and logging

### 5. useAutoSave.test.ts
**Coverage: Auto-save functionality with offline support**

- ✅ **Auto-Save Logic**: Debounced saving with validation
- ✅ **Offline Support**: Queue-based offline operations
- ✅ **Conflict Resolution**: Data synchronization conflicts
- ✅ **State Management**: Save state tracking
- ✅ **Validation**: Data validation before saving
- ✅ **Recovery**: Data recovery mechanisms
- ✅ **Performance**: Optimization and caching

**Key Test Scenarios:**
- Basic auto-save triggering and debouncing
- Offline queue management
- Online/offline state transitions
- Data validation and error handling
- Conflict resolution workflows
- Page visibility and beforeunload handling

### 6. ProfileHub.test.tsx
**Coverage: Main UI component integration**

- ✅ **Component Rendering**: Layout and structure
- ✅ **Tab Navigation**: Multi-tab interface
- ✅ **Data Integration**: Props passing and state management
- ✅ **Gamification UI**: Progress and achievement display
- ✅ **Lazy Loading**: Performance optimization
- ✅ **Action Handlers**: User interaction handling
- ✅ **Accessibility**: Screen reader and keyboard support

**Key Test Scenarios:**
- Complete vs loading state rendering
- Tab navigation and content switching
- Data flow from contexts to components
- User action handling (updates, navigation)
- Performance optimization verification
- Error state handling

## 🛠️ Test Utilities

### profileTestUtils.ts
**Comprehensive testing utilities and mocks:**

- 📊 **Mock Data**: Complete profile, preferences, household data
- 🏭 **Factory Functions**: Builders for test data creation
- 🎭 **Mock Functions**: Context providers and action mocks
- 🔧 **Helper Functions**: LocalStorage, Navigator mocks
- 🎯 **Test Builders**: Fluent API for data creation
- 🎪 **Mock Components**: Lazy-loaded component mocks

## 🚀 Running Tests

### Individual Test Files
```bash
# Context tests
npm test src/contexts/__tests__/ProfileContext.test.tsx

# Service tests
npm test src/services/profile/__tests__/ProfileRecommendationEngine.test.ts
npm test src/services/profile/__tests__/ProfileCompletionService.test.ts
npm test src/services/error/__tests__/ProfileErrorHandler.test.ts

# Hook tests
npm test src/hooks/__tests__/useAutoSave.test.ts

# Component tests
npm test src/components/profile/__tests__/ProfileHub.test.tsx
```

### Full Profile System Test Suite
```bash
# Using the custom test runner
node test-profile-system.js

# Or using Jest pattern matching
npm test -- --testPathPattern="profile|ProfileContext|useAutoSave"
```

### Coverage Report
```bash
# Generate coverage report for profile system
npm test -- --coverage --testPathPattern="profile|ProfileContext|useAutoSave" --collectCoverageFrom="src/{contexts,services,hooks,components}/**/*Profile*"
```

## 📈 Coverage Goals

| Component | Line Coverage | Branch Coverage | Function Coverage |
|-----------|---------------|-----------------|-------------------|
| ProfileContext | 95%+ | 90%+ | 100% |
| ProfileRecommendationEngine | 90%+ | 85%+ | 95%+ |
| ProfileCompletionService | 95%+ | 90%+ | 100% |
| ProfileErrorHandler | 95%+ | 90%+ | 100% |
| useAutoSave | 90%+ | 85%+ | 95%+ |
| ProfileHub | 85%+ | 80%+ | 90%+ |

## 🔍 Test Categories

### Unit Tests
- Individual function testing
- Isolated component testing
- Mock-based dependency testing
- Edge case and error scenario testing

### Integration Tests
- Context provider integration
- Hook integration with contexts
- Component integration with hooks
- Service integration testing

### Performance Tests
- Memoization verification
- Lazy loading validation
- Auto-save debouncing
- Memory leak prevention

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- ARIA label verification
- Color contrast validation

## 🐛 Common Test Patterns

### Mocking External Dependencies
```typescript
// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseChain),
    storage: jest.fn(() => mockStorageChain)
  }
}));

// Mock notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));
```

### Testing Context Providers
```typescript
const wrapper = ({ children }) => (
  <ProfileProvider>{children}</ProfileProvider>
);

const { result } = renderHook(() => useProfileData(), { wrapper });
```

### Testing Async Operations
```typescript
await act(async () => {
  await result.current.updateProfile(updates);
});

await waitFor(() => {
  expect(mockUpdateFunction).toHaveBeenCalled();
});
```

### Testing Error Scenarios
```typescript
mockFunction.mockRejectedValueOnce(new Error('Test error'));

await expect(async () => {
  await act(async () => {
    await result.current.someAction();
  });
}).rejects.toThrow('Test error');
```

## 📋 Test Checklist

### Before Writing Tests
- [ ] Identify all public methods/functions
- [ ] List all possible input combinations
- [ ] Identify error scenarios
- [ ] Plan mock strategies
- [ ] Consider edge cases

### Test Implementation
- [ ] Happy path scenarios
- [ ] Error handling
- [ ] Edge cases (null, undefined, empty)
- [ ] Async operation testing
- [ ] State management verification
- [ ] Performance characteristics

### Test Quality
- [ ] Descriptive test names
- [ ] Proper setup and teardown
- [ ] Mock isolation
- [ ] Assertion clarity
- [ ] Coverage verification

### Documentation
- [ ] Test purpose documentation
- [ ] Complex scenario explanations
- [ ] Mock strategy documentation
- [ ] Performance test rationale

## 🎯 Future Test Enhancements

### Planned Additions
- [ ] E2E tests with Playwright
- [ ] Visual regression tests
- [ ] Performance benchmark tests
- [ ] Accessibility audit tests
- [ ] Cross-browser compatibility tests

### Advanced Testing Strategies
- [ ] Property-based testing
- [ ] Mutation testing
- [ ] Contract testing
- [ ] Load testing for auto-save
- [ ] Memory leak testing

## 📚 Testing Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Hooks](https://react-hooks-testing-library.com/)

### Best Practices
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Effective Testing Strategies](https://kentcdodds.com/blog/write-tests)
- [Mock vs Stub vs Spy](https://martinfowler.com/articles/mocksArentStubs.html)

---

This comprehensive test suite ensures the profile system is robust, reliable, and maintainable with high code coverage and thorough edge case handling.