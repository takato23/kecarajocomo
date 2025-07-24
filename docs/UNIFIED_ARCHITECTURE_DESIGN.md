# 🏗️ KeCarajoComer - Arquitectura Unificada

## 📋 Executive Summary

Este documento define la arquitectura técnica unificada para KeCarajoComer, consolidando los sistemas fragmentados actuales en una plataforma cohesiva y escalable. La arquitectura sigue los principios del MASTER_PLAN.md y establece las bases para las 4 fases de desarrollo.

## 🎯 Objetivos de la Arquitectura

### Objetivos Primarios
1. **Unificación**: Eliminar duplicación y fragmentación
2. **Consistencia**: Experiencia uniforme en toda la aplicación
3. **Escalabilidad**: Soportar 10K+ usuarios activos
4. **Performance**: <2.5s LCP, <100ms FID
5. **Accesibilidad**: WCAG 2.1 AA completo

### Principios Fundamentales
- Mobile First
- Offline First
- Voice First
- Performance by Design
- Security by Default

## 🏛️ Arquitectura de Alto Nivel

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Design System]
        Components[React Components]
        Pages[Next.js Pages]
        PWA[PWA Shell]
    end
    
    subgraph "State Management"
        Stores[Zustand Stores]
        Cache[React Query Cache]
    end
    
    subgraph "Service Layer"
        Voice[Voice Service]
        AI[AI Service]
        Storage[Storage Service]
        Notifications[Notification Service]
        Analytics[Analytics Service]
    end
    
    subgraph "Backend Layer"
        API[Next.js API Routes]
        Prisma[Prisma ORM]
        Supabase[Supabase Services]
    end
    
    subgraph "External Services"
        Gemini[Gemini API]
        Claude[Claude API]
        CDN[CDN/Storage]
    end
    
    UI --> Components
    Components --> Pages
    Pages --> Stores
    Stores --> API
    Pages --> Service Layer
    Service Layer --> API
    API --> Prisma
    Prisma --> Supabase
    Service Layer --> External Services
```

## 🎨 Sistema de Diseño Unificado

### Estructura del Design System

```
/src/design-system/
├── tokens/
│   ├── colors.ts          # Paleta de colores y semánticos
│   ├── typography.ts      # Sistema tipográfico
│   ├── spacing.ts         # Sistema de espaciado (4px base)
│   ├── shadows.ts         # Sombras y elevaciones
│   ├── animations.ts      # Transiciones y animaciones
│   └── breakpoints.ts     # Responsive breakpoints
├── components/
│   ├── primitives/        # Componentes atómicos
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── ...
│   ├── patterns/          # Componentes compuestos
│   │   ├── VoiceInput/
│   │   ├── SearchBar/
│   │   ├── ItemList/
│   │   └── ...
│   └── layouts/          # Layouts de página
│       ├── AppShell/
│       ├── DashboardLayout/
│       └── ModalLayout/
├── utils/
│   ├── responsive.ts      # Utilidades responsive
│   ├── accessibility.ts   # Helpers de accesibilidad
│   └── theme.ts          # Theme provider
└── index.ts              # Export central
```

### Design Tokens

```typescript
// colors.ts
export const colors = {
  // Brand Colors
  primary: {
    50: '#FFF0EA',
    100: '#FFE1D5',
    200: '#FFC3AB',
    300: '#FFA481',
    400: '#FF8657',
    500: '#FF6B35', // Main brand color
    600: '#E85A2B',
    700: '#C04A24',
    800: '#983A1C',
    900: '#702A15',
  },
  secondary: {
    50: '#E6FAF8',
    100: '#CCF5F1',
    200: '#99EBE3',
    300: '#66E0D5',
    400: '#4ECDC4', // Main secondary
    500: '#3BA39C',
    600: '#2F827D',
    700: '#24625E',
    800: '#18413F',
    900: '#0C211F',
  },
  // Semantic Colors
  success: '#06D6A0',
  warning: '#FFD166',
  error: '#EF476F',
  info: '#118AB2',
  // Neutrals
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

// typography.ts
export const typography = {
  fontFamily: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// spacing.ts
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};

// breakpoints.ts
export const breakpoints = {
  xs: '375px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large screens
};
```

### Componentes Base

```typescript
// Button Component Example
import { cn } from '@/lib/utils';
import { VoiceInput } from '../patterns/VoiceInput';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  withVoice?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  withVoice = false,
  children,
  className,
  onClick,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-error text-white hover:bg-red-600 focus:ring-error',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl',
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {children}
      {withVoice && <VoiceInput onResult={(text) => console.log(text)} />}
    </button>
  );
};
```

## 🔧 Servicios Centralizados

### Arquitectura de Servicios

```
/src/services/
├── voice/
│   ├── VoiceService.ts         # Servicio principal de voz
│   ├── VoiceRecognition.ts     # Web Speech API wrapper
│   ├── VoiceParser.ts          # Parser de comandos
│   ├── VoiceFeedback.ts        # TTS y feedback
│   └── index.ts
├── ai/
│   ├── AIService.ts            # Abstracción de servicios AI
│   ├── GeminiProvider.ts       # Implementación Gemini
│   ├── ClaudeProvider.ts       # Implementación Claude
│   ├── AICache.ts              # Cache de respuestas
│   └── index.ts
├── storage/
│   ├── StorageService.ts       # Abstracción de storage
│   ├── SupabaseStorage.ts      # Implementación Supabase
│   ├── LocalStorage.ts         # Cache local
│   └── index.ts
├── notifications/
│   ├── NotificationService.ts  # Servicio principal
│   ├── PushNotifications.ts    # Push notifications
│   ├── InAppNotifications.ts   # In-app notifications
│   ├── EmailNotifications.ts   # Email notifications
│   └── index.ts
└── analytics/
    ├── AnalyticsService.ts     # Servicio principal
    ├── EventTracker.ts         # Tracking de eventos
    ├── UserMetrics.ts          # Métricas de usuario
    └── index.ts
```

### Voice Service Unificado

```typescript
// VoiceService.ts
export interface VoiceCommand {
  intent: 'add' | 'search' | 'navigate' | 'action';
  entity: string;
  parameters: Record<string, any>;
  confidence: number;
}

export class VoiceService {
  private recognition: VoiceRecognition;
  private parser: VoiceParser;
  private feedback: VoiceFeedback;
  
  constructor() {
    this.recognition = new VoiceRecognition();
    this.parser = new VoiceParser();
    this.feedback = new VoiceFeedback();
  }
  
  async startListening(): Promise<VoiceCommand> {
    const transcript = await this.recognition.listen();
    const command = await this.parser.parse(transcript);
    
    if (command.confidence > 0.7) {
      await this.feedback.speak(`Entendido: ${command.intent} ${command.entity}`);
    } else {
      await this.feedback.speak('No entendí bien, ¿puedes repetir?');
    }
    
    return command;
  }
  
  async executeCommand(command: VoiceCommand): Promise<void> {
    // Delegar a los handlers específicos
    switch (command.intent) {
      case 'add':
        await this.handleAddCommand(command);
        break;
      case 'search':
        await this.handleSearchCommand(command);
        break;
      // ... más casos
    }
  }
}
```

### AI Service Abstraction

```typescript
// AIService.ts
export interface AIProvider {
  generateRecipe(params: RecipeParams): Promise<Recipe>;
  generateMealPlan(params: MealPlanParams): Promise<MealPlan>;
  parseIngredients(text: string): Promise<Ingredient[]>;
  suggestSubstitutions(ingredient: string): Promise<string[]>;
}

export class AIService {
  private providers: Map<string, AIProvider>;
  private cache: AICache;
  
  constructor() {
    this.providers = new Map([
      ['gemini', new GeminiProvider()],
      ['claude', new ClaudeProvider()],
    ]);
    this.cache = new AICache();
  }
  
  async generateRecipe(params: RecipeParams): Promise<Recipe> {
    const cacheKey = this.cache.generateKey('recipe', params);
    const cached = await this.cache.get(cacheKey);
    
    if (cached) return cached;
    
    // Try primary provider, fallback to secondary
    try {
      const recipe = await this.providers.get('gemini')!.generateRecipe(params);
      await this.cache.set(cacheKey, recipe);
      return recipe;
    } catch (error) {
      console.error('Gemini failed, trying Claude:', error);
      return await this.providers.get('claude')!.generateRecipe(params);
    }
  }
}
```

## 📦 State Management

### Store Architecture

```
/src/stores/
├── auth.ts           # Authentication state
├── user.ts           # User profile & preferences
├── pantry.ts         # Pantry items & management
├── planner.ts        # Meal planning state
├── shopping.ts       # Shopping lists
├── recipes.ts        # Recipe management
├── ui.ts             # Global UI state
├── notifications.ts  # Notification queue
└── types.ts          # Shared types
```

### Store Implementation Pattern

```typescript
// pantry.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate?: Date;
  location: 'fridge' | 'freezer' | 'pantry';
}

interface PantryState {
  items: PantryItem[];
  isLoading: boolean;
  error: string | null;
  filter: {
    category?: string;
    location?: string;
    expiringSoon?: boolean;
  };
  
  // Actions
  addItem: (item: Omit<PantryItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  loadItems: () => Promise<void>;
  setFilter: (filter: Partial<PantryState['filter']>) => void;
  
  // Computed
  get filteredItems(): PantryItem[];
  get expiringItems(): PantryItem[];
  get lowStockItems(): PantryItem[];
}

export const usePantryStore = create<PantryState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],
        isLoading: false,
        error: null,
        filter: {},
        
        addItem: async (item) => {
          set((state) => {
            state.isLoading = true;
          });
          
          try {
            const response = await fetch('/api/pantry', {
              method: 'POST',
              body: JSON.stringify(item),
            });
            
            const newItem = await response.json();
            
            set((state) => {
              state.items.push(newItem);
              state.isLoading = false;
            });
            
            // Analytics
            analytics.track('pantry_item_added', {
              category: item.category,
              location: item.location,
            });
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
          }
        },
        
        get filteredItems() {
          const { items, filter } = get();
          return items.filter((item) => {
            if (filter.category && item.category !== filter.category) return false;
            if (filter.location && item.location !== filter.location) return false;
            if (filter.expiringSoon) {
              const daysUntilExpiration = differenceInDays(item.expirationDate, new Date());
              if (daysUntilExpiration > 3) return false;
            }
            return true;
          });
        },
        
        get expiringItems() {
          const { items } = get();
          return items.filter((item) => {
            if (!item.expirationDate) return false;
            const daysUntilExpiration = differenceInDays(item.expirationDate, new Date());
            return daysUntilExpiration <= 3 && daysUntilExpiration >= 0;
          });
        },
      })),
      {
        name: 'pantry-storage',
        partialize: (state) => ({ items: state.items }),
      }
    )
  )
);
```

## 🏗️ Component Architecture

### Component Categories

1. **Primitives**: Atomic design system components
2. **Patterns**: Reusable UI patterns
3. **Features**: Feature-specific components
4. **Pages**: Next.js page components

### Component Structure

```typescript
// Example: VoiceInput Pattern Component
import { useState, useCallback } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import { useVoiceService } from '@/services/voice';
import { Button } from '@/design-system/components/primitives/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputProps {
  onResult: (text: string, command?: VoiceCommand) => void;
  placeholder?: string;
  autoExecute?: boolean;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onResult,
  placeholder = 'Habla o escribe...',
  autoExecute = true,
  className,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const voiceService = useVoiceService();
  
  const handleVoiceInput = useCallback(async () => {
    setIsListening(true);
    
    try {
      const command = await voiceService.startListening();
      setTranscript(command.entity);
      
      if (autoExecute && command.confidence > 0.7) {
        await voiceService.executeCommand(command);
      }
      
      onResult(command.entity, command);
    } catch (error) {
      console.error('Voice input error:', error);
    } finally {
      setIsListening(false);
    }
  }, [voiceService, onResult, autoExecute]);
  
  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleVoiceInput}
        className="absolute right-2 top-1/2 -translate-y-1/2"
        aria-label="Activar entrada de voz"
      >
        <AnimatePresence>
          {isListening ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <MicrophoneIcon className="w-5 h-5 text-primary-500" />
            </motion.div>
          ) : (
            <MicrophoneIcon className="w-5 h-5 text-gray-400" />
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
};
```

## 🧪 Testing Strategy

### Testing Layers

1. **Unit Tests**: Components, hooks, utilities
2. **Integration Tests**: API routes, services
3. **E2E Tests**: User flows with Playwright
4. **Visual Regression**: Storybook + Chromatic
5. **Performance Tests**: Lighthouse CI

### Testing Structure

```
/src/__tests__/
├── unit/
│   ├── components/
│   ├── hooks/
│   └── services/
├── integration/
│   ├── api/
│   └── stores/
└── e2e/
    ├── flows/
    └── fixtures/
```

### Testing Examples

```typescript
// Unit Test Example
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceInput } from '@/design-system/components/patterns/VoiceInput';

describe('VoiceInput', () => {
  it('should handle voice input correctly', async () => {
    const onResult = jest.fn();
    
    render(<VoiceInput onResult={onResult} />);
    
    const voiceButton = screen.getByLabelText('Activar entrada de voz');
    fireEvent.click(voiceButton);
    
    // Mock voice input
    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(
        'agregar tomates',
        expect.objectContaining({
          intent: 'add',
          entity: 'tomates',
        })
      );
    });
  });
});

// E2E Test Example
import { test, expect } from '@playwright/test';

test.describe('Meal Planning Flow', () => {
  test('should create a weekly meal plan', async ({ page }) => {
    await page.goto('/planner');
    
    // Voice input simulation
    await page.click('[aria-label="Activar entrada de voz"]');
    await page.fill('[placeholder="Habla o escribe..."]', 'crear plan semanal vegetariano');
    
    // Wait for AI generation
    await expect(page.locator('.meal-plan-calendar')).toBeVisible();
    
    // Verify plan was created
    const meals = await page.locator('.meal-slot').count();
    expect(meals).toBeGreaterThan(14); // At least 2 meals per day
  });
});
```

## 🚀 Performance Optimization

### Optimization Strategies

1. **Code Splitting**: Dynamic imports for features
2. **Image Optimization**: Next.js Image with blur placeholders
3. **Bundle Optimization**: Tree shaking, minification
4. **Caching Strategy**: SWR for data fetching
5. **Service Worker**: Offline functionality

### Performance Budget

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'framer-motion'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['storage.googleapis.com'],
  },
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer in development
    if (!dev && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }
    return config;
  },
};
```

## 📱 PWA Configuration

### PWA Features

1. **Offline Support**: Cache-first strategy
2. **Push Notifications**: Expiration alerts
3. **Install Prompt**: Add to home screen
4. **Background Sync**: Sync when online

### Service Worker Strategy

```javascript
// service-worker.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);
```

## 🔒 Security Architecture

### Security Measures

1. **Authentication**: Supabase Auth with MFA
2. **Authorization**: Row Level Security (RLS)
3. **Data Encryption**: TLS + encrypted fields
4. **Input Validation**: Zod schemas
5. **Rate Limiting**: API route protection

### Security Implementation

```typescript
// API Route Protection
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const addItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().positive(),
  unit: z.string(),
  category: z.string(),
  expirationDate: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  // Rate limiting
  const identifier = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await rateLimit.check(identifier);
  
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }
  
  // Authentication
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Validation
  const body = await request.json();
  const result = addItemSchema.safeParse(body);
  
  if (!result.success) {
    return new Response(JSON.stringify(result.error), { status: 400 });
  }
  
  // Process request...
}
```

## 🚦 Migration Plan

### Phase 1: Foundation (Week 1-2)
1. Set up new design system structure
2. Create design tokens and base components
3. Implement unified voice service
4. Set up testing infrastructure

### Phase 2: Core Services (Week 3)
1. Migrate to unified stores
2. Implement service abstractions
3. Create notification system
4. Set up analytics

### Phase 3: Component Migration (Week 4-5)
1. Migrate to new component system
2. Unify all dashboards
3. Consolidate voice inputs
4. Remove deprecated code

### Phase 4: Feature Enhancement (Week 6-9)
1. Implement advanced features
2. Optimize performance
3. Add PWA capabilities
4. Complete testing

## 📊 Success Metrics

### Technical Metrics
- Bundle size < 200KB initial
- 90%+ Lighthouse score
- <2.5s LCP on 3G
- 90%+ test coverage

### User Metrics
- <3s to add pantry item
- <10s to generate meal plan
- 95%+ voice recognition accuracy
- 40%+ D7 retention

### Development Metrics
- 0 TypeScript errors
- 0 ESLint warnings
- <5% code duplication
- 100% design system adoption

## 🔄 Next Steps

1. **Immediate Actions**:
   - Review and approve architecture
   - Set up design system foundation
   - Begin voice service unification

2. **Week 1 Goals**:
   - Complete design token system
   - Create first 5 base components
   - Unify voice recognition hooks

3. **Critical Path**:
   - Design System → Services → Components → Features

---

**Document Status**: DRAFT - Awaiting approval
**Last Updated**: January 2025
**Next Review**: After Phase 1 completion