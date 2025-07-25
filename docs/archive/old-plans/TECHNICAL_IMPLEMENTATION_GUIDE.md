# 📘 KeCarajoComer - Guía Técnica de Implementación

## 🎯 Propósito

Esta guía proporciona instrucciones detalladas para implementar la arquitectura unificada de KeCarajoComer siguiendo el MASTER_PLAN.md y el UNIFIED_ARCHITECTURE_DESIGN.md.

## 📋 Pre-requisitos

### Herramientas Requeridas
- Node.js 20.x o superior
- pnpm 8.x o superior
- Docker Desktop
- VS Code con extensiones recomendadas
- Git

### Configuración del Entorno
```bash
# Variables de entorno requeridas
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
DATABASE_URL=
```

## 🏁 Fase 1: Fundación (Semana 1-2)

### 1.1 Configuración del Design System

#### Paso 1: Crear estructura base
```bash
# Crear directorios del design system
mkdir -p src/design-system/{tokens,components/{primitives,patterns,layouts},utils}
```

#### Paso 2: Implementar Design Tokens
```typescript
// src/design-system/tokens/index.ts
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './animations';
export * from './breakpoints';
```

```typescript
// src/design-system/tokens/colors.ts
export const colors = {
  primary: {
    50: '#FFF0EA',
    100: '#FFE1D5',
    200: '#FFC3AB',
    300: '#FFA481',
    400: '#FF8657',
    500: '#FF6B35',
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
    400: '#4ECDC4',
    500: '#3BA39C',
    600: '#2F827D',
    700: '#24625E',
    800: '#18413F',
    900: '#0C211F',
  },
  semantic: {
    success: '#06D6A0',
    warning: '#FFD166',
    error: '#EF476F',
    info: '#118AB2',
  },
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
} as const;
```

#### Paso 3: Configurar Tailwind CSS
```javascript
// tailwind.config.js
import { colors, spacing, typography } from './src/design-system/tokens';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors,
      spacing,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
    },
  },
  plugins: [],
};
```

### 1.2 Componentes Base

#### Implementar Button Component
```typescript
// src/design-system/components/primitives/Button/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-semantic-error text-white hover:bg-red-600 focus:ring-semantic-error',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
        md: 'px-4 py-2 text-base rounded-lg gap-2',
        lg: 'px-6 py-3 text-lg rounded-xl gap-2.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

#### Crear Storybook para componentes
```typescript
// src/design-system/components/primitives/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Design System/Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading',
    isLoading: true,
  },
};
```

### 1.3 Voice Service Unificado

#### Implementar Voice Service Core
```typescript
// src/services/voice/VoiceService.ts
import { VoiceRecognition } from './VoiceRecognition';
import { VoiceParser } from './VoiceParser';
import { VoiceFeedback } from './VoiceFeedback';
import { VoiceCommand } from './types';

export class VoiceService {
  private static instance: VoiceService;
  private recognition: VoiceRecognition;
  private parser: VoiceParser;
  private feedback: VoiceFeedback;
  
  private constructor() {
    this.recognition = new VoiceRecognition();
    this.parser = new VoiceParser();
    this.feedback = new VoiceFeedback();
  }
  
  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }
  
  async startListening(options?: {
    language?: string;
    continuous?: boolean;
  }): Promise<VoiceCommand> {
    const transcript = await this.recognition.listen(options);
    const command = await this.parser.parse(transcript);
    
    if (command.confidence > 0.7) {
      await this.feedback.speak(`Entendido: ${command.intent} ${command.entity}`);
    } else {
      await this.feedback.speak('No entendí bien, ¿puedes repetir?');
    }
    
    return command;
  }
  
  async executeCommand(command: VoiceCommand): Promise<void> {
    const handlers = {
      add: this.handleAddCommand,
      search: this.handleSearchCommand,
      navigate: this.handleNavigateCommand,
      action: this.handleActionCommand,
    };
    
    const handler = handlers[command.intent];
    if (handler) {
      await handler.call(this, command);
    }
  }
  
  private async handleAddCommand(command: VoiceCommand): Promise<void> {
    // Implementar lógica de agregar
    console.log('Adding:', command);
  }
  
  private async handleSearchCommand(command: VoiceCommand): Promise<void> {
    // Implementar lógica de búsqueda
    console.log('Searching:', command);
  }
  
  private async handleNavigateCommand(command: VoiceCommand): Promise<void> {
    // Implementar lógica de navegación
    console.log('Navigating:', command);
  }
  
  private async handleActionCommand(command: VoiceCommand): Promise<void> {
    // Implementar lógica de acción
    console.log('Action:', command);
  }
}
```

#### Implementar Voice Recognition Wrapper
```typescript
// src/services/voice/VoiceRecognition.ts
export class VoiceRecognition {
  private recognition: SpeechRecognition | null = null;
  
  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        window.SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'es-ES';
      }
    }
  }
  
  async listen(options?: {
    language?: string;
    continuous?: boolean;
  }): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }
    
    if (options?.language) {
      this.recognition.lang = options.language;
    }
    
    if (options?.continuous !== undefined) {
      this.recognition.continuous = options.continuous;
    }
    
    return new Promise((resolve, reject) => {
      let finalTranscript = '';
      
      this.recognition!.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript = transcript;
          }
        }
      };
      
      this.recognition!.onend = () => {
        resolve(finalTranscript);
      };
      
      this.recognition!.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      this.recognition!.start();
    });
  }
  
  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
```

### 1.4 Configuración de Testing

#### Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

#### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    port: 3000,
  },
});
```

## 🚀 Fase 2: Servicios Core (Semana 3)

### 2.1 Migración de Stores

#### Crear Store Base Pattern
```typescript
// src/stores/base.ts
import { StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type StoreMiddleware<T> = [
  ['zustand/devtools', never],
  ['zustand/persist', T],
  ['zustand/immer', never]
];

export function createStore<T>(
  name: string,
  storeCreator: StateCreator<T, [], StoreMiddleware<T>, T>,
  persistOptions?: Parameters<typeof persist>[1]
) {
  return create<T>()(
    devtools(
      persist(
        immer(storeCreator),
        {
          name: `${name}-storage`,
          ...persistOptions,
        }
      ),
      {
        name,
      }
    )
  );
}
```

#### Implementar Pantry Store Unificado
```typescript
// src/stores/pantry.ts
import { createStore } from './base';
import { PantryItem, PantryState } from './types';
import { pantryService } from '@/services/api/pantry';
import { analyticsService } from '@/services/analytics';

export const usePantryStore = createStore<PantryState>(
  'pantry',
  (set, get) => ({
    items: [],
    isLoading: false,
    error: null,
    filter: {},
    
    async addItem(item) {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const newItem = await pantryService.create(item);
        
        set((state) => {
          state.items.push(newItem);
          state.isLoading = false;
        });
        
        analyticsService.track('pantry_item_added', {
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
    
    async updateItem(id, updates) {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const updatedItem = await pantryService.update(id, updates);
        
        set((state) => {
          const index = state.items.findIndex(item => item.id === id);
          if (index !== -1) {
            state.items[index] = updatedItem;
          }
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error.message;
          state.isLoading = false;
        });
      }
    },
    
    async removeItem(id) {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        await pantryService.delete(id);
        
        set((state) => {
          state.items = state.items.filter(item => item.id !== id);
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error.message;
          state.isLoading = false;
        });
      }
    },
    
    async loadItems() {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const items = await pantryService.getAll();
        
        set((state) => {
          state.items = items;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error.message;
          state.isLoading = false;
        });
      }
    },
    
    setFilter(filter) {
      set((state) => {
        state.filter = { ...state.filter, ...filter };
      });
    },
    
    get filteredItems() {
      const { items, filter } = get();
      return items.filter((item) => {
        if (filter.category && item.category !== filter.category) return false;
        if (filter.location && item.location !== filter.location) return false;
        if (filter.expiringSoon) {
          const daysUntilExpiration = Math.ceil(
            (item.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilExpiration > 3) return false;
        }
        return true;
      });
    },
    
    get expiringItems() {
      const { items } = get();
      return items.filter((item) => {
        if (!item.expirationDate) return false;
        const daysUntilExpiration = Math.ceil(
          (item.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiration <= 3 && daysUntilExpiration >= 0;
      });
    },
    
    get lowStockItems() {
      const { items } = get();
      return items.filter((item) => {
        // Lógica para determinar stock bajo
        return item.quantity <= (item.minQuantity || 1);
      });
    },
  }),
  {
    partialize: (state) => ({
      items: state.items,
      filter: state.filter,
    }),
  }
);
```

### 2.2 Notification Service

```typescript
// src/services/notifications/NotificationService.ts
import { InAppNotifications } from './InAppNotifications';
import { PushNotifications } from './PushNotifications';
import { EmailNotifications } from './EmailNotifications';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private inApp: InAppNotifications;
  private push: PushNotifications;
  private email: EmailNotifications;
  
  private constructor() {
    this.inApp = new InAppNotifications();
    this.push = new PushNotifications();
    this.email = new EmailNotifications();
  }
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  async notify(notification: Omit<Notification, 'id'>, options?: {
    voice?: boolean;
    vibrate?: boolean;
    channels?: ('inApp' | 'push' | 'email')[];
  }) {
    const id = crypto.randomUUID();
    const fullNotification = { ...notification, id };
    
    const channels = options?.channels || ['inApp'];
    
    const promises = channels.map(channel => {
      switch (channel) {
        case 'inApp':
          return this.inApp.show(fullNotification);
        case 'push':
          return this.push.send(fullNotification);
        case 'email':
          return this.email.send(fullNotification);
      }
    });
    
    await Promise.all(promises);
    
    if (options?.voice) {
      const voiceService = VoiceService.getInstance();
      await voiceService.speak(`${notification.title}. ${notification.message || ''}`);
    }
    
    if (options?.vibrate && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }
  
  success(title: string, message?: string, options?: Parameters<typeof this.notify>[1]) {
    return this.notify({ type: 'success', title, message }, options);
  }
  
  error(title: string, message?: string, options?: Parameters<typeof this.notify>[1]) {
    return this.notify({ type: 'error', title, message }, options);
  }
  
  warning(title: string, message?: string, options?: Parameters<typeof this.notify>[1]) {
    return this.notify({ type: 'warning', title, message }, options);
  }
  
  info(title: string, message?: string, options?: Parameters<typeof this.notify>[1]) {
    return this.notify({ type: 'info', title, message }, options);
  }
}

// Export singleton instance
export const notify = NotificationService.getInstance();
```

## 🔧 Fase 3: Migración de Componentes (Semana 4-5)

### 3.1 Dashboard Unificado

```typescript
// src/features/dashboard/components/UnifiedDashboard.tsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePantryStore } from '@/stores/pantry';
import { useMealPlannerStore } from '@/stores/planner';
import { useShoppingStore } from '@/stores/shopping';
import { DashboardLayout } from '@/design-system/components/layouts/DashboardLayout';
import { Card } from '@/design-system/components/primitives/Card';
import { VoiceAssistant } from '@/design-system/components/patterns/VoiceAssistant';
import { QuickActions } from './QuickActions';
import { PantryWidget } from './widgets/PantryWidget';
import { MealPlanWidget } from './widgets/MealPlanWidget';
import { ShoppingWidget } from './widgets/ShoppingWidget';
import { ExpirationAlerts } from './widgets/ExpirationAlerts';

export function UnifiedDashboard() {
  const pantry = usePantryStore();
  const planner = useMealPlannerStore();
  const shopping = useShoppingStore();
  
  useEffect(() => {
    // Load initial data
    Promise.all([
      pantry.loadItems(),
      planner.loadCurrentPlan(),
      shopping.loadLists(),
    ]);
  }, []);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Voice Assistant */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ¡Hola! ¿Qué vamos a cocinar hoy?
            </h1>
            <p className="text-gray-600 mt-1">
              Tu asistente de cocina está listo para ayudarte
            </p>
          </div>
          <VoiceAssistant />
        </header>
        
        {/* Quick Actions */}
        <QuickActions />
        
        {/* Alerts */}
        <ExpirationAlerts items={pantry.expiringItems} />
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PantryWidget
              itemCount={pantry.items.length}
              expiringCount={pantry.expiringItems.length}
              lowStockCount={pantry.lowStockItems.length}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MealPlanWidget
              currentPlan={planner.currentPlan}
              todaysMeals={planner.todaysMeals}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ShoppingWidget
              activeList={shopping.activeList}
              totalItems={shopping.totalItems}
            />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 3.2 Voice Input Pattern Component

```typescript
// src/design-system/components/patterns/VoiceInput/VoiceInput.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceService } from '@/hooks/useVoiceService';
import { Button } from '@/design-system/components/primitives/Button';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onResult: (text: string, command?: VoiceCommand) => void;
  placeholder?: string;
  autoExecute?: boolean;
  className?: string;
  showTranscript?: boolean;
}

export function VoiceInput({
  onResult,
  placeholder = 'Habla o escribe...',
  autoExecute = true,
  className,
  showTranscript = true,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceService = useVoiceService();
  
  const handleVoiceInput = useCallback(async () => {
    if (isListening) {
      voiceService.stop();
      setIsListening(false);
      return;
    }
    
    setIsListening(true);
    setTranscript('');
    
    try {
      const command = await voiceService.startListening({
        continuous: false,
        language: 'es-ES',
      });
      
      setTranscript(command.transcript);
      setIsProcessing(true);
      
      if (autoExecute && command.confidence > 0.7) {
        await voiceService.executeCommand(command);
      }
      
      onResult(command.transcript, command);
    } catch (error) {
      console.error('Voice input error:', error);
      notify.error('Error al procesar voz', error.message);
    } finally {
      setIsListening(false);
      setIsProcessing(false);
    }
  }, [voiceService, onResult, autoExecute, isListening]);
  
  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (transcript.trim()) {
      onResult(transcript);
      setTranscript('');
    }
  }, [transcript, onResult]);
  
  return (
    <div className={cn('relative', className)}>
      {showTranscript && (
        <form onSubmit={handleTextSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isListening || isProcessing}
          />
        </form>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleVoiceInput}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2',
          !showTranscript && 'relative translate-y-0'
        )}
        aria-label={isListening ? 'Detener grabación' : 'Activar entrada de voz'}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="listening"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-primary-500 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ opacity: 0.3 }}
              />
              <StopIcon className="w-5 h-5 text-primary-500 relative z-10" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <MicrophoneIcon className="w-5 h-5 text-gray-400 hover:text-primary-500 transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
      
      {/* Visual feedback for processing */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-x-0 bottom-0 h-1 bg-primary-500"
        >
          <motion.div
            className="h-full bg-primary-600"
            animate={{ x: ['0%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ width: '30%' }}
          />
        </motion.div>
      )}
    </div>
  );
}
```

## 📱 Fase 4: PWA y Performance (Semana 6-9)

### 4.1 PWA Configuration

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-audio-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
    {
      urlPattern: /\.(?:mp4|webm)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-video-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:json|xml|csv)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-data-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin;
        if (!isSameOrigin) return false;
        const pathname = url.pathname;
        // Exclude /api/
        if (pathname.startsWith('/api/')) return false;
        return true;
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

module.exports = withPWA({
  // Your Next.js config
});
```

### 4.2 Performance Monitoring

```typescript
// src/services/performance/PerformanceMonitor.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  private constructor() {
    this.initializeObservers();
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  private initializeObservers() {
    // Performance Observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('fid', entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      
      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('cls', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Send to analytics
    analyticsService.track('performance_metric', {
      metric: name,
      value,
      timestamp: Date.now(),
    });
  }
  
  getMetrics() {
    const result: Record<string, { avg: number; min: number; max: number }> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });
    
    return result;
  }
}
```

## 🧪 Testing Implementation

### Unit Test Example
```typescript
// src/design-system/components/primitives/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });
  
  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-500');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary-500');
  });
});
```

### E2E Test Example
```typescript
// e2e/pantry-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Pantry Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login if necessary
  });
  
  test('should add item to pantry using voice', async ({ page }) => {
    await page.goto('/pantry');
    
    // Click voice button
    await page.click('[aria-label="Activar entrada de voz"]');
    
    // Simulate voice input
    await page.fill('[placeholder="Habla o escribe..."]', 'agregar 2 kilos de tomates');
    await page.keyboard.press('Enter');
    
    // Wait for item to be added
    await expect(page.locator('text=tomates')).toBeVisible();
    await expect(page.locator('text=2 kg')).toBeVisible();
  });
  
  test('should show expiration alerts', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for expiration alerts
    const alerts = page.locator('[data-testid="expiration-alert"]');
    const count = await alerts.count();
    
    if (count > 0) {
      await expect(alerts.first()).toContainText('caduca pronto');
    }
  });
  
  test('should filter pantry items', async ({ page }) => {
    await page.goto('/pantry');
    
    // Apply filter
    await page.selectOption('[data-testid="location-filter"]', 'fridge');
    
    // Verify filtered results
    const items = page.locator('[data-testid="pantry-item"]');
    const count = await items.count();
    
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toContainText('Refrigerador');
    }
  });
});
```

## 📊 Métricas de Éxito

### Dashboard de Métricas
```typescript
// src/pages/admin/metrics.tsx
import { useEffect, useState } from 'react';
import { Card } from '@/design-system/components/primitives/Card';
import { performanceMonitor } from '@/services/performance';
import { analyticsService } from '@/services/analytics';

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState({
    performance: {},
    usage: {},
    errors: [],
  });
  
  useEffect(() => {
    // Load metrics
    Promise.all([
      performanceMonitor.getMetrics(),
      analyticsService.getUsageMetrics(),
      analyticsService.getErrorMetrics(),
    ]).then(([performance, usage, errors]) => {
      setMetrics({ performance, usage, errors });
    });
  }, []);
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Métricas del Sistema</h1>
      
      {/* Performance Metrics */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Performance</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">LCP</p>
            <p className="text-2xl font-bold">
              {metrics.performance.lcp?.avg.toFixed(0)}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">FID</p>
            <p className="text-2xl font-bold">
              {metrics.performance.fid?.avg.toFixed(0)}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">CLS</p>
            <p className="text-2xl font-bold">
              {metrics.performance.cls?.avg.toFixed(3)}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Usage Metrics */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Uso</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Usuarios Activos</span>
            <span className="font-bold">{metrics.usage.activeUsers}</span>
          </div>
          <div className="flex justify-between">
            <span>Items en Despensa</span>
            <span className="font-bold">{metrics.usage.pantryItems}</span>
          </div>
          <div className="flex justify-between">
            <span>Planes Generados</span>
            <span className="font-bold">{metrics.usage.mealPlans}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

## 🚀 Scripts de Deployment

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "analyze": "ANALYZE=true next build",
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    "validate": "npm run lint && npm run type-check && npm run test",
    "clean": "rm -rf .next out dist coverage .turbo",
    "fresh": "npm run clean && rm -rf node_modules && pnpm install"
  }
}
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm build
      - run: pnpm e2e

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true
```

---

**Document Status**: Implementation Guide v1.0
**Last Updated**: January 2025
**Next Review**: After Phase 1 completion