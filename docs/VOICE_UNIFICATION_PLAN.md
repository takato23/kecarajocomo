# 🎤 Voice System Unification Plan

## Current State Analysis

### 🔴 Problem: 3 Parallel Voice Implementations

1. **The Hook (NOT USED)**: `/src/hooks/useVoiceRecognition.ts`
   - Most advanced implementation
   - Has SmartParser for ingredients
   - Network retry logic
   - Audio visualization
   - **Status**: Created but never integrated

2. **Pantry Component**: `/src/components/pantry/VoiceInput.tsx`
   - Reimplements everything from scratch
   - Used in PantryDashboard
   - Basic functionality only

3. **Generic Component**: `/src/components/voice/VoiceInput.tsx`
   - Another duplicate implementation
   - Used in multiple places:
     - ShoppingListManager
     - PantryAddFormEnhanced
     - UltraDashboardPage

## 🎯 Unification Strategy

### Phase 1: Refactor Components to Use Hook (Week 1)

#### Step 1: Update Generic VoiceInput Component
```typescript
// /src/components/voice/VoiceInput.tsx
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

interface VoiceInputProps {
  onResult: (transcript: string, parsed?: ParsedIngredient) => void;
  placeholder?: string;
  className?: string;
  mode?: 'ingredient' | 'command' | 'search';
}

export const VoiceInput = ({ 
  onResult, 
  placeholder,
  className,
  mode = 'ingredient' 
}: VoiceInputProps) => {
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    audioLevel,
    error,
    parsedIngredient
  } = useVoiceRecognition({
    continuous: false,
    lang: 'es-ES'
  });

  // Component now only handles UI
  // All logic is in the hook
};
```

#### Step 2: Create Voice Button Component
```typescript
// /src/components/voice/VoiceButton.tsx
export const VoiceButton = ({ 
  onResult,
  size = 'default',
  variant = 'ghost' 
}) => {
  const { startListening, isListening } = useVoiceRecognition();
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={startListening}
      aria-label={isListening ? 'Detener grabación' : 'Activar voz'}
      className={cn(
        isListening && 'animate-pulse bg-red-500'
      )}
    >
      <Mic className={cn(
        'transition-all',
        isListening && 'text-white'
      )} />
    </Button>
  );
};
```

#### Step 3: Delete Duplicate Implementations
- Remove `/src/components/pantry/VoiceInput.tsx`
- Update all imports to use the unified component

### Phase 2: Extend Voice to All Areas (Week 2)

#### Areas Requiring Voice Integration:

1. **Recipe Search** (`/features/recipes/components/RecipeSearch.tsx`)
```typescript
<div className="flex gap-2">
  <Input 
    placeholder="Buscar recetas..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
  <VoiceButton 
    onResult={(transcript) => {
      setSearch(transcript);
      handleSearch(transcript);
    }}
  />
</div>
```

2. **Cooking Assistant** (`/features/cooking-assistant/`)
```typescript
// Voice commands for hands-free cooking
const COOKING_COMMANDS = {
  'siguiente paso': () => nextStep(),
  'paso anterior': () => previousStep(),
  'repetir': () => repeatStep(),
  'ingredientes': () => showIngredients(),
  'timer * minutos': (minutes) => setTimer(minutes),
  'pausa': () => pauseCooking(),
  'continuar': () => resumeCooking()
};
```

3. **Meal Planner** (`/features/meal-planner/`)
```typescript
// Voice input for meal planning
<VoiceInput
  mode="command"
  onResult={(transcript) => {
    // "Añadir pasta con tomate al almuerzo del martes"
    const parsed = parseMealCommand(transcript);
    addMealToPlan(parsed);
  }}
/>
```

4. **Shopping List** (Already has it! ✅)

### Phase 3: Advanced Voice Features (Week 3)

#### 1. Context-Aware Voice
```typescript
// Hook knows which component is using it
const { startListening } = useVoiceRecognition({
  context: 'pantry', // or 'recipes', 'planner', etc.
  onResult: (transcript, context) => {
    // Different parsing based on context
  }
});
```

#### 2. Voice Shortcuts
```typescript
// Global voice commands
const GLOBAL_COMMANDS = {
  'ir a despensa': () => router.push('/pantry'),
  'ir a recetas': () => router.push('/recipes'),
  'qué puedo cocinar': () => suggestFromPantry(),
  'plan de la semana': () => router.push('/planner')
};
```

#### 3. Voice Feedback
```typescript
// System speaks back
const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  speechSynthesis.speak(utterance);
};

// Usage
speak('Añadido 2 tomates a la despensa');
```

## 📋 Implementation Checklist

### Week 1: Unification
- [ ] Refactor `/components/voice/VoiceInput.tsx` to use hook
- [ ] Create `/components/voice/VoiceButton.tsx`
- [ ] Update all existing voice integrations
- [ ] Delete `/components/pantry/VoiceInput.tsx`
- [ ] Test across all browsers (Chrome, Safari, Firefox)

### Week 2: Extension
- [ ] Add voice to Recipe Search
- [ ] Add voice to Cooking Assistant (priority!)
- [ ] Add voice to Meal Planner
- [ ] Add voice to all forms with text input

### Week 3: Enhancement
- [ ] Implement context-aware parsing
- [ ] Add global voice commands
- [ ] Implement voice feedback (TTS)
- [ ] Add voice onboarding tutorial

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('useVoiceRecognition', () => {
  it('parses ingredients correctly', () => {
    const result = parseIngredient('2 kilos de tomates maduros');
    expect(result).toEqual({
      quantity: 2,
      unit: 'kilos',
      ingredient: 'tomates maduros'
    });
  });
});
```

### Integration Tests
```typescript
describe('Voice Input Flow', () => {
  it('adds item to pantry via voice', async () => {
    renderPantry();
    
    const voiceButton = screen.getByLabelText('Activar voz');
    fireEvent.click(voiceButton);
    
    // Simulate voice input
    mockSpeechRecognition.emit('result', '3 manzanas verdes');
    
    await waitFor(() => {
      expect(screen.getByText('manzanas verdes')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
```

### Browser Compatibility
- Chrome: Full support ✅
- Safari: Requires webkit prefix ✅
- Firefox: Limited support ⚠️
- Mobile: Test on real devices 📱

## 🎯 Success Metrics

1. **Code Reduction**: -70% voice-related code
2. **Consistency**: Same voice UX everywhere
3. **Features**: Voice available in 100% of text inputs
4. **Performance**: <100ms response time
5. **Accessibility**: Full keyboard alternative

## 🚨 Risks & Mitigation

### Risk 1: Browser Compatibility
**Mitigation**: Fallback UI for unsupported browsers

### Risk 2: Network Dependency
**Mitigation**: Offline fallback, retry logic

### Risk 3: Privacy Concerns
**Mitigation**: Clear permission prompts, data handling transparency

### Risk 4: Accent/Dialect Variations
**Mitigation**: Adjustable language settings, fuzzy matching

---

**This unification is MANDATORY before adding any new features.**