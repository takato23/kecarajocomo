# 🔧 KeCarajoComer - Technical Standards

## 🏗️ Architecture Standards

### Component Structure
```typescript
// Every feature follows this structure
/src/features/[feature-name]/
├── components/          # UI components
├── hooks/              # Custom hooks
├── services/           # API calls and business logic
├── stores/             # Zustand stores
├── types/              # TypeScript types
├── utils/              # Helper functions
└── index.ts            # Public exports
```

### Component Pattern
```typescript
// ✅ CORRECT: Consistent component pattern
import { ComponentSkeleton } from '@/design-system/skeletons';
import { useFeatureData } from '../hooks/useFeatureData';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { FeatureLayout } from '@/design-system/layouts';

interface FeatureComponentProps {
  id: string;
  onUpdate?: (data: FeatureData) => void;
}

export const FeatureComponent = ({ id, onUpdate }: FeatureComponentProps) => {
  // 1. Hooks at the top
  const { data, isLoading, error } = useFeatureData(id);
  const { startListening, isListening } = useVoiceRecognition();
  
  // 2. Early returns for edge cases
  if (isLoading) return <ComponentSkeleton />;
  if (error) return <ErrorBoundary error={error} />;
  
  // 3. Event handlers
  const handleVoiceInput = (transcript: string) => {
    // Process voice input
  };
  
  // 4. Main render
  return (
    <FeatureLayout>
      <VoiceButton 
        onStart={startListening}
        isListening={isListening}
      />
      {/* Component content */}
    </FeatureLayout>
  );
};

// ❌ WRONG: Inconsistent patterns
// - No loading states
// - No error handling  
// - No voice integration
// - Inline styles
```

## 🎤 Voice Integration Standards

### Every Input Must Have Voice
```typescript
// ✅ CORRECT: Text input with voice option
<FormField>
  <Label>Añadir ingrediente</Label>
  <div className="flex gap-2">
    <Input 
      value={value}
      onChange={handleChange}
      placeholder="Ej: 2 tomates"
    />
    <VoiceInputButton 
      onResult={handleVoiceResult}
      lang="es-ES"
    />
  </div>
</FormField>

// ❌ WRONG: Text input without voice
<Input value={value} onChange={handleChange} />
```

### Voice Hook Usage
```typescript
// Always use the centralized hook
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

// Never create new voice implementations
// Never copy voice logic
```

## 📊 State Management Standards

### Zustand Store Pattern
```typescript
// ✅ CORRECT: Zustand store pattern
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface FeatureState {
  // State
  items: Item[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  
  // Async actions
  fetchItems: () => Promise<void>;
  syncToCloud: () => Promise<void>;
}

export const useFeatureStore = create<FeatureState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        items: [],
        isLoading: false,
        error: null,
        
        // Synchronous actions
        addItem: (item) => set((state) => {
          state.items.push(item);
        }),
        
        // Async actions
        fetchItems: async () => {
          set({ isLoading: true, error: null });
          try {
            const items = await api.getItems();
            set({ items, isLoading: false });
          } catch (error) {
            set({ error: error.message, isLoading: false });
          }
        },
      })),
      {
        name: 'feature-storage',
        partialize: (state) => ({ items: state.items }),
      }
    )
  )
);
```

### React Query Pattern
```typescript
// ✅ CORRECT: Data fetching with React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useFeatureData = (id: string) => {
  return useQuery({
    queryKey: ['feature', id],
    queryFn: () => api.getFeature(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};

export const useUpdateFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.updateFeature,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['feature', variables.id] 
      });
    },
  });
};
```

## 🎨 UI/UX Standards

### Loading States
```typescript
// ✅ CORRECT: Skeleton loading
import { FeatureSkeleton } from '@/design-system/skeletons';

if (isLoading) return <FeatureSkeleton />;

// ❌ WRONG: Generic spinner
if (isLoading) return <Spinner />;
```

### Error Handling
```typescript
// ✅ CORRECT: User-friendly error
if (error) {
  return (
    <ErrorCard>
      <h3>Algo salió mal</h3>
      <p>{getErrorMessage(error)}</p>
      <Button onClick={retry}>Intentar de nuevo</Button>
    </ErrorCard>
  );
}

// ❌ WRONG: Raw error
if (error) return <div>Error: {error.toString()}</div>;
```

### Mobile Responsiveness
```typescript
// ✅ CORRECT: Mobile-first responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// ❌ WRONG: Desktop-only
<div style={{ display: 'flex', width: '1200px' }}>
  {/* Content */}
</div>
```

## 🔒 Security Standards

### API Calls
```typescript
// ✅ CORRECT: Validated and typed
import { z } from 'zod';

const ItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  quantity: z.number().positive(),
});

export const createItem = async (data: unknown) => {
  const validated = ItemSchema.parse(data);
  return api.post('/items', validated);
};

// ❌ WRONG: Unvalidated
export const createItem = async (data: any) => {
  return api.post('/items', data);
};
```

### Authentication Checks
```typescript
// ✅ CORRECT: Protected routes
export default function ProtectedPage() {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) return <PageSkeleton />;
  if (!user) {
    redirect('/login');
    return null;
  }
  
  return <AuthenticatedContent />;
}
```

## 📐 Code Quality Standards

### TypeScript Usage
```typescript
// ✅ CORRECT: Fully typed
interface Props {
  id: string;
  name: string;
  onChange: (value: string) => void;
}

// ❌ WRONG: Using 'any'
interface Props {
  data: any;
  onChange: (value: any) => any;
}
```

### Import Organization
```typescript
// ✅ CORRECT: Organized imports
// 1. React/Next
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { z } from 'zod';
import { toast } from 'sonner';

// 3. Internal - absolute paths
import { Button } from '@/design-system/components';
import { useAuthStore } from '@/stores/auth';

// 4. Internal - relative paths
import { FeatureComponent } from './FeatureComponent';
import type { FeatureData } from '../types';

// ❌ WRONG: Mixed imports
import { Button } from '../../../components/ui/button';
import React from 'react';
import { FeatureComponent } from './FeatureComponent';
import axios from 'axios';
```

### Error Messages
```typescript
// ✅ CORRECT: User-friendly Spanish messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'No hay conexión a internet. Verifica tu conexión.',
  NOT_FOUND: 'No encontramos lo que buscas.',
  UNAUTHORIZED: 'Necesitas iniciar sesión para continuar.',
  SERVER_ERROR: 'Algo salió mal. Intenta de nuevo más tarde.',
} as const;

// ❌ WRONG: Technical English messages
throw new Error('Failed to fetch: 500 Internal Server Error');
```

## 🧪 Testing Standards

### Component Testing
```typescript
// ✅ CORRECT: Comprehensive tests
import { render, screen, userEvent } from '@testing-library/react';

describe('FeatureComponent', () => {
  it('renders loading state initially', () => {
    render(<FeatureComponent />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
  
  it('handles voice input correctly', async () => {
    const user = userEvent.setup();
    render(<FeatureComponent />);
    
    const voiceButton = screen.getByLabelText('Activar voz');
    await user.click(voiceButton);
    
    expect(voiceButton).toHaveAttribute('aria-pressed', 'true');
  });
});
```

### Integration Testing
```typescript
// Test critical user flows
describe('Add ingredient flow', () => {
  it('allows adding ingredient via voice', async () => {
    // Setup
    // Action
    // Assertion
  });
});
```

## 📱 Performance Standards

### Image Optimization
```typescript
// ✅ CORRECT: Optimized images
import Image from 'next/image';

<Image
  src="/recipe.jpg"
  alt="Receta de paella"
  width={400}
  height={300}
  loading="lazy"
  placeholder="blur"
/>

// ❌ WRONG: Unoptimized
<img src="/recipe.jpg" />
```

### Bundle Size
```typescript
// ✅ CORRECT: Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

// ❌ WRONG: Import everything
import { HeavyChart } from './HeavyChart';
```

### Data Fetching
```typescript
// ✅ CORRECT: Pagination and lazy loading
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['recipes'],
  queryFn: ({ pageParam = 0 }) => api.getRecipes({ page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

// ❌ WRONG: Fetch everything
const allRecipes = await api.getAllRecipes(); // 10000 items
```

## 🌐 Accessibility Standards

### ARIA Labels
```typescript
// ✅ CORRECT: Descriptive labels
<button
  aria-label="Añadir tomate a la lista"
  aria-pressed={isActive}
>
  <PlusIcon />
</button>

// ❌ WRONG: No accessibility
<button onClick={handleClick}>
  <PlusIcon />
</button>
```

### Keyboard Navigation
```typescript
// ✅ CORRECT: Full keyboard support
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction();
    }
  }}
  onClick={handleAction}
>
```

### Color Contrast
```scss
// ✅ CORRECT: AA compliant
.text-primary {
  color: #1a1a1a; // on white: 21:1 ratio
}

// ❌ WRONG: Poor contrast  
.text-primary {
  color: #cccccc; // on white: 1.6:1 ratio
}
```

---

**These standards are NON-NEGOTIABLE. Every PR must comply.**