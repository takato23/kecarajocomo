# Development Guidelines - KeCarajoComer

**Version**: 1.0  
**Last Updated**: January 2025

## Table of Contents

1. [Code Style & Standards](#code-style--standards)
2. [Project Structure](#project-structure)
3. [Component Development](#component-development)
4. [State Management](#state-management)
5. [API Development](#api-development)
6. [Database Guidelines](#database-guidelines)
7. [Testing Standards](#testing-standards)
8. [Performance Guidelines](#performance-guidelines)
9. [Security Best Practices](#security-best-practices)
10. [Git Workflow](#git-workflow)

---

## Code Style & Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  }
}
```

### Code Style Rules

#### Naming Conventions
- **Components**: PascalCase (e.g., `RecipeCard`)
- **Functions**: camelCase (e.g., `getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Files**: 
  - Components: PascalCase (e.g., `RecipeCard.tsx`)
  - Utilities: camelCase (e.g., `dateHelpers.ts`)
  - Types: camelCase (e.g., `recipe.types.ts`)

#### Import Order
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party imports
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

// 3. Internal imports - absolute paths
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// 4. Internal imports - relative paths
import { RecipeCard } from './RecipeCard';

// 5. Type imports
import type { Recipe } from '@/types';

// 6. Style imports
import styles from './Recipe.module.css';
```

#### Component Structure
```typescript
// 1. Type definitions
interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (id: string) => void;
  className?: string;
}

// 2. Component definition
export function RecipeCard({ 
  recipe, 
  onSave,
  className 
}: RecipeCardProps) {
  // 3. Hooks
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth();
  
  // 4. Derived state
  const canSave = user && !isSaved;
  
  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 6. Handlers
  const handleSave = () => {
    onSave?.(recipe.id);
    setIsSaved(true);
  };
  
  // 7. Render helpers
  const renderNutrition = () => {
    // ...
  };
  
  // 8. Main render
  return (
    <div className={className}>
      {/* Component JSX */}
    </div>
  );
}
```

### ESLint Configuration

```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

---

## Project Structure

### Directory Organization

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (app)/             # Authenticated routes
│   ├── (auth)/            # Auth routes
│   ├── (marketing)/       # Public routes
│   └── api/               # API routes
├── components/            # Shared components
│   ├── ui/               # Base UI components
│   ├── [feature]/        # Feature components
│   └── layouts/          # Layout components
├── features/              # Feature modules
│   └── [feature]/
│       ├── components/   # Feature components
│       ├── hooks/        # Feature hooks
│       ├── services/     # API services
│       ├── types/        # TypeScript types
│       └── utils/        # Utilities
├── hooks/                 # Global hooks
├── lib/                   # External libraries
│   ├── ai/               # AI integrations
│   ├── supabase/         # Database client
│   └── utils/            # Utilities
├── contexts/              # React contexts
├── styles/                # Global styles
├── types/                 # Global types
└── config/                # Configuration
```

### Feature Module Structure

Each feature should be self-contained:

```
features/recipes/
├── components/
│   ├── RecipeCard.tsx
│   ├── RecipeDetail.tsx
│   └── RecipeFilters.tsx
├── hooks/
│   ├── useRecipes.ts
│   └── useRecipeDetails.ts
├── services/
│   ├── recipeService.ts
│   └── recipeApi.ts
├── types/
│   └── recipe.types.ts
├── utils/
│   └── recipeHelpers.ts
└── index.ts              # Public exports
```

---

## Component Development

### Component Guidelines

#### 1. Use Function Components
```typescript
// ✅ Good
export function RecipeCard({ recipe }: RecipeCardProps) {
  return <div>{recipe.name}</div>;
}

// ❌ Avoid
export class RecipeCard extends React.Component {
  // ...
}
```

#### 2. Props Interface
```typescript
// Define props interface above component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}
```

#### 3. Default Props
```typescript
// Use default parameters
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  ...props
}: ButtonProps) {
  // ...
}
```

#### 4. Composition Pattern
```typescript
// Parent component
export function RecipeCard({ children, ...props }) {
  return (
    <Card {...props}>
      {children}
    </Card>
  );
}

// Sub-components
RecipeCard.Header = RecipeCardHeader;
RecipeCard.Body = RecipeCardBody;
RecipeCard.Footer = RecipeCardFooter;
```

### Styling Guidelines

#### 1. Use Tailwind CSS
```typescript
// ✅ Good - Tailwind classes
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click me
</button>

// ❌ Avoid - Inline styles
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
  Click me
</button>
```

#### 2. Component Variants with CVA
```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        ghost: 'hover:bg-gray-100'
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);
```

---

## State Management

### Context vs Zustand

#### Use Context for:
- Theme/UI state
- User authentication
- Small, localized state

```typescript
// ThemeContext.tsx
export const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

#### Use Zustand for:
- Complex feature state
- Cross-component communication
- Persistent state

```typescript
// recipeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecipeStore {
  recipes: Recipe[];
  favorites: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set) => ({
      recipes: [],
      favorites: [],
      addFavorite: (id) => set((state) => ({
        favorites: [...state.favorites, id]
      })),
      removeFavorite: (id) => set((state) => ({
        favorites: state.favorites.filter(f => f !== id)
      }))
    }),
    {
      name: 'recipe-storage'
    }
  )
);
```

### State Management Best Practices

1. **Keep state close to where it's used**
2. **Lift state only when necessary**
3. **Use server state for API data (React Query)**
4. **Avoid prop drilling - use context or Zustand**
5. **Separate UI state from business logic**

---

## API Development

### API Route Structure

```typescript
// app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// Schema validation
const createRecipeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    unit: z.string()
  })),
  instructions: z.array(z.object({
    step: z.number(),
    text: z.string()
  }))
});

// GET handler
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Database query
    const recipes = await getRecipes({ page, limit });
    
    return NextResponse.json({
      recipes,
      pagination: {
        page,
        limit,
        total: recipes.length
      }
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate body
    const body = await request.json();
    const validatedData = createRecipeSchema.parse(body);
    
    // Create recipe
    const recipe = await createRecipe({
      ...validatedData,
      userId: session.user.id
    });
    
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### API Client Service

```typescript
// services/api/recipeApi.ts
class RecipeApi {
  private baseUrl = '/api/recipes';
  
  async getRecipes(params?: RecipeQueryParams): Promise<RecipeResponse> {
    const searchParams = new URLSearchParams(params as any);
    const response = await fetch(`${this.baseUrl}?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recipes');
    }
    
    return response.json();
  }
  
  async createRecipe(data: CreateRecipeData): Promise<Recipe> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create recipe');
    }
    
    return response.json();
  }
}

export const recipeApi = new RecipeApi();
```

---

## Database Guidelines

### Supabase Best Practices

#### 1. Row Level Security (RLS)
```sql
-- Enable RLS on tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view public recipes"
  ON recipes FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create own recipes"
  ON recipes FOR INSERT
  WITH CHECK (created_by = auth.uid());
```

#### 2. Database Types
```typescript
// Generate types from Supabase
// types/database.types.ts
export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];
```

#### 3. Query Patterns
```typescript
// Use select with specific columns
const { data, error } = await supabase
  .from('recipes')
  .select('id, name, image_url, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20);

// Use joins efficiently
const { data: recipesWithIngredients } = await supabase
  .from('recipes')
  .select(`
    *,
    recipe_ingredients (
      *,
      ingredients (*)
    )
  `)
  .eq('id', recipeId)
  .single();
```

---

## Testing Standards

### Unit Testing

```typescript
// RecipeCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeCard } from './RecipeCard';

describe('RecipeCard', () => {
  const mockRecipe = {
    id: '1',
    name: 'Test Recipe',
    description: 'Test description',
    image_url: '/test.jpg',
    prep_time: 10,
    cook_time: 20,
    servings: 4
  };
  
  it('renders recipe information', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });
  
  it('calls onSave when save button clicked', () => {
    const onSave = jest.fn();
    render(<RecipeCard recipe={mockRecipe} onSave={onSave} />);
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(onSave).toHaveBeenCalledWith('1');
  });
});
```

### Integration Testing

```typescript
// api/recipes.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/recipes/route';

describe('/api/recipes', () => {
  it('returns recipes for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token'
      }
    });
    
    await GET(req);
    
    expect(res._getStatusCode()).toBe(200);
    const json = JSON.parse(res._getData());
    expect(json.recipes).toBeDefined();
  });
});
```

### E2E Testing

```typescript
// e2e/recipes.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Recipe Management', () => {
  test('user can create and view recipe', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');
    
    // Navigate to recipes
    await page.goto('/recipes/new');
    
    // Fill form
    await page.fill('[name="name"]', 'My Test Recipe');
    await page.fill('[name="description"]', 'A delicious test recipe');
    
    // Submit
    await page.click('[type="submit"]');
    
    // Verify redirect and display
    await expect(page).toHaveURL(/\/recipes\/[\w-]+/);
    await expect(page.locator('h1')).toContainText('My Test Recipe');
  });
});
```

---

## Performance Guidelines

### Image Optimization

```typescript
import Image from 'next/image';

// ✅ Good - Optimized image loading
<Image
  src={recipe.image_url}
  alt={recipe.name}
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL={recipe.blur_data_url}
  loading="lazy"
/>

// ❌ Avoid - Unoptimized img tag
<img src={recipe.image_url} alt={recipe.name} />
```

### Code Splitting

```typescript
// Dynamic imports for heavy components
const RecipeGenerator = dynamic(
  () => import('@/components/RecipeGenerator'),
  {
    loading: () => <Skeleton />,
    ssr: false
  }
);
```

### Memoization

```typescript
// Memoize expensive computations
const expensiveCalculation = useMemo(() => {
  return recipes.reduce((acc, recipe) => {
    // Complex calculation
    return acc + recipe.nutrition.calories;
  }, 0);
}, [recipes]);

// Memoize components
const MemoizedRecipeCard = memo(RecipeCard, (prevProps, nextProps) => {
  return prevProps.recipe.id === nextProps.recipe.id;
});
```

### Data Fetching

```typescript
// Use React Query for caching
const { data, isLoading, error } = useQuery({
  queryKey: ['recipes', filters],
  queryFn: () => recipeApi.getRecipes(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
});
```

---

## Security Best Practices

### Input Validation

```typescript
// Always validate user input
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(50)
});

// In API route
const result = schema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: result.error },
    { status: 400 }
  );
}
```

### Authentication

```typescript
// Protect API routes
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Verify user owns resource
  if (resource.userId !== session.user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
}
```

### Environment Variables

```typescript
// Never expose sensitive keys
// ✅ Good - Server-only
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// ✅ Good - Public keys with NEXT_PUBLIC prefix
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ❌ Bad - Exposing private keys
const apiKey = process.env.API_KEY; // Don't use in client code!
```

### XSS Prevention

```typescript
// Sanitize user content
import DOMPurify from 'isomorphic-dompurify';

const sanitizedHtml = DOMPurify.sanitize(userContent);

// Use React's built-in escaping
<div>{recipe.description}</div> // Automatically escaped

// Avoid dangerouslySetInnerHTML unless necessary
// If needed, always sanitize first
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

---

## Git Workflow

### Branch Naming

- `feature/recipe-sharing` - New features
- `fix/navigation-mobile` - Bug fixes
- `refactor/meal-planner` - Code refactoring
- `docs/api-endpoints` - Documentation
- `test/recipe-components` - Tests

### Commit Messages

```bash
# Format: <type>(<scope>): <subject>

feat(recipes): add recipe sharing functionality
fix(auth): resolve login redirect issue
refactor(planner): consolidate meal planner components
docs(api): update recipe endpoints documentation
test(pantry): add unit tests for pantry service
style(ui): update button hover states
perf(images): optimize recipe image loading
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation
- [ ] Tests

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added where necessary
- [ ] Documentation updated
- [ ] No breaking changes
```

---

## Deployment Checklist

### Before Deployment

1. **Code Quality**
   - [ ] All tests passing
   - [ ] No TypeScript errors
   - [ ] ESLint warnings resolved
   - [ ] Build successful

2. **Security**
   - [ ] Environment variables checked
   - [ ] API endpoints secured
   - [ ] Input validation in place
   - [ ] CORS configured properly

3. **Performance**
   - [ ] Images optimized
   - [ ] Bundle size acceptable
   - [ ] Lighthouse score >80
   - [ ] Database queries optimized

4. **Documentation**
   - [ ] README updated
   - [ ] API docs current
   - [ ] Deployment notes added
   - [ ] Breaking changes documented

### Deployment Process

```bash
# 1. Run pre-deployment checks
npm run type-check
npm run lint
npm run test
npm run build

# 2. Deploy to staging
vercel --env=preview

# 3. Test staging environment
# - Run E2E tests
# - Manual smoke tests
# - Performance testing

# 4. Deploy to production
vercel --prod

# 5. Post-deployment
# - Monitor error rates
# - Check performance metrics
# - Verify critical flows
```

---

## Troubleshooting Guide

### Common Issues

#### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf .next
npm run dev
```

#### Module Resolution
```typescript
// Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Supabase Connection
```typescript
// Check environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Test connection
const { data, error } = await supabase.auth.getSession();
if (error) console.error('Supabase error:', error);
```

#### Build Failures
```bash
# Clean cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## Resources

### Internal Documentation
- [API Documentation](./API_DOCUMENTATION.md)
- [Component Inventory](./COMPONENT_INVENTORY.md)
- [Architecture Overview](./SYSTEM_ARCHITECTURE.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)