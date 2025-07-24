# Component Architecture - kecarajocomer

## Overview

A modular, type-safe component architecture built with Next.js 15, TypeScript, and Tailwind CSS. Emphasizes reusability, performance, and exceptional user experience.

## Design Principles

1. **Composition over Inheritance**: Build complex UIs from simple, composable parts
2. **Single Responsibility**: Each component has one clear purpose
3. **Type Safety**: Full TypeScript coverage with strict mode
4. **Performance First**: Optimize for Core Web Vitals
5. **Accessibility**: WCAG 2.1 AA compliance minimum
6. **Mobile First**: Responsive design starting from mobile

## Directory Structure

```
src/
├── components/
│   ├── ui/                    # Base UI components (atoms)
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── ...
│   ├── features/              # Feature-specific components
│   │   ├── recipes/
│   │   ├── meal-planner/
│   │   ├── pantry/
│   │   └── shopping/
│   ├── layouts/               # Layout components
│   │   ├── AppShell/
│   │   ├── DashboardLayout/
│   │   └── AuthLayout/
│   └── providers/             # Context providers
│       ├── ThemeProvider/
│       ├── AuthProvider/
│       └── NotificationProvider/
├── hooks/                     # Custom React hooks
├── lib/                       # Utilities and helpers
└── types/                     # TypeScript type definitions
```

## Core UI Components

### Button Component

```typescript
// components/ui/Button/Button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
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

### Input Component with Validation

```typescript
// components/ui/Input/Input.tsx
import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined
            }
            {...props}
          />
        </div>
        {error && (
          <p id={`${props.id}-error`} className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${props.id}-hint`} className="mt-1 text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

## Feature Components

### Recipe Card

```typescript
// components/features/recipes/RecipeCard/RecipeCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users, Flame } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (recipeId: string) => void;
  isSaved?: boolean;
}

export function RecipeCard({ recipe, onSave, isSaved = false }: RecipeCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/recipes/${recipe.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={recipe.image_url || '/images/recipe-placeholder.jpg'}
            alt={recipe.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform hover:scale-105"
          />
          {recipe.ai_generated && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              AI Generated
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link href={`/recipes/${recipe.slug}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 hover:text-primary">
            {recipe.name}
          </h3>
        </Link>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {recipe.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{recipe.total_time}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-3">
          {recipe.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {recipe.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{recipe.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button
          variant={isSaved ? 'secondary' : 'outline'}
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.preventDefault();
            onSave?.(recipe.id);
          }}
        >
          {isSaved ? 'Saved' : 'Save Recipe'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Weekly Meal Planner

```typescript
// components/features/meal-planner/WeeklyPlanner/WeeklyPlanner.tsx
import { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { Plus, Calendar } from 'lucide-react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { MealSlot } from './MealSlot';
import { Button } from '@/components/ui/Button';
import type { MealPlan, PlannedMeal } from '@/types';

interface WeeklyPlannerProps {
  mealPlan: MealPlan;
  onAddMeal: (date: Date, mealType: string) => void;
  onUpdateMeal: (mealId: string, updates: Partial<PlannedMeal>) => void;
  onDeleteMeal: (mealId: string) => void;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export function WeeklyPlanner({
  mealPlan,
  onAddMeal,
  onUpdateMeal,
  onDeleteMeal,
}: WeeklyPlannerProps) {
  const [selectedWeek, setSelectedWeek] = useState(new Date(mealPlan.week_start));
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Handle meal reordering logic
    const [fromDate, fromType] = active.id.toString().split('-');
    const [toDate, toType] = over.id.toString().split('-');
    
    // Update meal position
    onUpdateMeal(active.data.current?.mealId, {
      date: new Date(toDate),
      meal_type: toType,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Weekly Meal Plan</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const currentDate = addDays(weekStart, dayIndex);
            const dateStr = format(currentDate, 'yyyy-MM-dd');

            return (
              <div
                key={dateStr}
                className="border rounded-lg p-4 bg-card"
              >
                <h3 className="font-semibold text-center mb-3">
                  {format(currentDate, 'EEE')}
                  <span className="block text-sm text-muted-foreground">
                    {format(currentDate, 'MMM d')}
                  </span>
                </h3>

                <div className="space-y-2">
                  {MEAL_TYPES.map((mealType) => {
                    const meal = mealPlan.meals.find(
                      (m) => 
                        format(new Date(m.date), 'yyyy-MM-dd') === dateStr &&
                        m.meal_type === mealType
                    );

                    return (
                      <MealSlot
                        key={`${dateStr}-${mealType}`}
                        id={`${dateStr}-${mealType}`}
                        date={currentDate}
                        mealType={mealType}
                        meal={meal}
                        onAdd={() => onAddMeal(currentDate, mealType)}
                        onDelete={() => meal && onDeleteMeal(meal.id)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
```

### Smart Pantry Item

```typescript
// components/features/pantry/PantryItem/PantryItem.tsx
import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import type { PantryItem as PantryItemType } from '@/types';

interface PantryItemProps {
  item: PantryItemType;
  onUpdate: (updates: Partial<PantryItemType>) => void;
  onDelete: () => void;
}

export function PantryItem({ item, onUpdate, onDelete }: PantryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const daysUntilExpiry = item.expiration_date
    ? differenceInDays(new Date(item.expiration_date), new Date())
    : null;
    
  const expiryStatus = daysUntilExpiry !== null
    ? daysUntilExpiry <= 0
      ? 'expired'
      : daysUntilExpiry <= 3
      ? 'expiring-soon'
      : 'fresh'
    : 'no-expiry';

  const usagePercentage = 100 - (item.quantity / item.initial_quantity) * 100;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-base">{item.ingredient.name}</h4>
          <p className="text-sm text-muted-foreground">
            {item.quantity} {item.unit}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {item.is_running_low && (
        <Badge variant="secondary" className="mb-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Running Low
        </Badge>
      )}

      {daysUntilExpiry !== null && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              {expiryStatus === 'expired'
                ? 'Expired'
                : expiryStatus === 'expiring-soon'
                ? `Expires in ${daysUntilExpiry} days`
                : `Expires ${format(new Date(item.expiration_date!), 'MMM d')}`}
            </span>
            <span
              className={cn(
                'font-medium',
                expiryStatus === 'expired' && 'text-destructive',
                expiryStatus === 'expiring-soon' && 'text-warning',
                expiryStatus === 'fresh' && 'text-success'
              )}
            >
              {expiryStatus === 'expired' ? 'Expired' : 'Fresh'}
            </span>
          </div>
          <Progress
            value={expiryStatus === 'expired' ? 100 : (7 - daysUntilExpiry) / 7 * 100}
            className={cn(
              'h-2',
              expiryStatus === 'expired' && '[&>div]:bg-destructive',
              expiryStatus === 'expiring-soon' && '[&>div]:bg-warning'
            )}
          />
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <span>Location: {item.location?.name || 'Not specified'}</span>
      </div>

      {isEditing && (
        <PantryItemEditor
          item={item}
          onSave={(updates) => {
            onUpdate(updates);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </Card>
  );
}
```

### AI Recipe Generator Modal

```typescript
// components/features/recipes/AIRecipeGenerator/AIRecipeGenerator.tsx
import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { useAIRecipeGeneration } from '@/hooks/useAIRecipeGeneration';

interface AIRecipeGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecipeGenerated: (recipe: Recipe) => void;
  pantryItems?: string[];
}

export function AIRecipeGenerator({
  open,
  onOpenChange,
  onRecipeGenerated,
  pantryItems = [],
}: AIRecipeGeneratorProps) {
  const [preferences, setPreferences] = useState({
    dietaryRestrictions: [],
    cuisineType: '',
    maxCookingTime: 30,
    servings: 4,
    includeIngredients: [],
    excludeIngredients: [],
    aiProvider: 'claude' as 'claude' | 'gemini',
  });

  const { generateRecipe, isGenerating, error } = useAIRecipeGeneration();

  const handleGenerate = async () => {
    try {
      const recipe = await generateRecipe(preferences);
      onRecipeGenerated(recipe);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to generate recipe:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Recipe Generator
          </DialogTitle>
          <DialogDescription>
            Create a personalized recipe based on your preferences and available ingredients
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-4">
            <div>
              <Label htmlFor="cuisine">Cuisine Type</Label>
              <Input
                id="cuisine"
                placeholder="e.g., Italian, Mexican, Asian..."
                value={preferences.cuisineType}
                onChange={(e) =>
                  setPreferences({ ...preferences, cuisineType: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="dietary">Dietary Restrictions</Label>
              <MultiSelect
                id="dietary"
                options={[
                  'Vegetarian',
                  'Vegan',
                  'Gluten-Free',
                  'Dairy-Free',
                  'Keto',
                  'Low-Carb',
                  'Paleo',
                ]}
                selected={preferences.dietaryRestrictions}
                onChange={(selected) =>
                  setPreferences({ ...preferences, dietaryRestrictions: selected })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time">Max Cooking Time (minutes)</Label>
                <Input
                  id="time"
                  type="number"
                  min="10"
                  max="180"
                  value={preferences.maxCookingTime}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      maxCookingTime: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  max="12"
                  value={preferences.servings}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      servings: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-4">
            <div>
              <Label htmlFor="include">Use These Ingredients</Label>
              <MultiSelect
                id="include"
                options={pantryItems}
                selected={preferences.includeIngredients}
                onChange={(selected) =>
                  setPreferences({ ...preferences, includeIngredients: selected })
                }
                placeholder="Select from your pantry..."
              />
            </div>

            <div>
              <Label htmlFor="exclude">Avoid These Ingredients</Label>
              <MultiSelect
                id="exclude"
                options={[
                  'Nuts',
                  'Shellfish',
                  'Eggs',
                  'Soy',
                  'Mushrooms',
                  'Onions',
                  'Garlic',
                ]}
                selected={preferences.excludeIngredients}
                onChange={(selected) =>
                  setPreferences({ ...preferences, excludeIngredients: selected })
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="constraints" className="space-y-4">
            <div>
              <Label>AI Provider</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="ai-provider"
                    value="claude"
                    checked={preferences.aiProvider === 'claude'}
                    onChange={(e) =>
                      setPreferences({ ...preferences, aiProvider: 'claude' })
                    }
                  />
                  <span>Claude (Better at creative recipes)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="ai-provider"
                    value="gemini"
                    checked={preferences.aiProvider === 'gemini'}
                    onChange={(e) =>
                      setPreferences({ ...preferences, aiProvider: 'gemini' })
                    }
                  />
                  <span>Gemini (Better at traditional recipes)</span>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Recipe
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Layout Components

### App Shell

```typescript
// components/layouts/AppShell/AppShell.tsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  Calendar,
  ShoppingCart,
  Package,
  ChefHat,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { UserMenu } from '@/components/features/auth/UserMenu';

interface AppShellProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Meal Planner', href: '/planner', icon: Calendar },
  { name: 'Recipes', href: '/recipes', icon: ChefHat },
  { name: 'Pantry', href: '/pantry', icon: Package },
  { name: 'Shopping', href: '/shopping', icon: ShoppingCart },
  { name: 'Nutrition', href: '/nutrition', icon: BarChart3 },
];

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex w-64 flex-col bg-card border-r',
          'transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">kecarajocomer</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <UserMenu />
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

## Hooks

### useRecipes Hook

```typescript
// hooks/useRecipes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Recipe } from '@/types';

export function useRecipes(filters?: {
  mealType?: string;
  tags?: string[];
  search?: string;
}) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (filters?.mealType) {
        query = query.contains('meal_types', [filters.mealType]);
      }

      if (filters?.tags?.length) {
        query = query.contains('tags', filters.tags);
      }

      if (filters?.search) {
        query = query.textSearch('name', filters.search);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Recipe[];
    },
  });
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase
        .from('saved_recipes')
        .insert({ recipe_id: recipeId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-recipes'] });
    },
  });
}
```

## Performance Optimizations

### Image Optimization

```typescript
// components/ui/OptimizedImage/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'
        )}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </div>
  );
}
```

### Virtual List for Large Collections

```typescript
// components/ui/VirtualList/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  className,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className={cn('h-full overflow-auto', className)}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Accessibility

### Skip Navigation

```typescript
// components/a11y/SkipNavigation/SkipNavigation.tsx
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      Skip to main content
    </a>
  );
}
```

### Announce Component

```typescript
// components/a11y/Announce/Announce.tsx
import { useEffect } from 'react';

interface AnnounceProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export function Announce({ message, priority = 'polite' }: AnnounceProps) {
  useEffect(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    return () => {
      document.body.removeChild(announcement);
    };
  }, [message, priority]);

  return null;
}
```

## Testing Strategy

### Component Testing

```typescript
// components/ui/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toContainElement(
      screen.getByTestId('loading-spinner')
    );
  });
});
```

## Storybook Documentation

```typescript
// components/ui/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};
```