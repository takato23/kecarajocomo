# Component Documentation

## Overview

KeCaraJoComer uses a modular component architecture with a design system approach. Components are organized by functionality and follow consistent patterns for maintainability and reusability.

## Component Architecture

### Directory Structure

```
components/
├── design-system/          # Base design system components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── Typography.tsx
│   └── index.ts
├── ui/                     # Application-specific UI components
│   ├── DashboardCard.tsx
│   ├── MetricDisplay.tsx
│   └── QuickActionCard.tsx
├── accessibility/          # Accessibility-focused components
│   ├── FocusTrap.tsx
│   ├── LiveRegion.tsx
│   ├── ScreenReaderOnly.tsx
│   └── AccessibleButton.tsx
├── providers/              # Context providers
│   └── ThemeProvider.tsx
└── debug/                  # Development utilities
    └── DebugPanel.tsx
```

### Feature Components

```
features/
├── auth/
│   └── components/
│       ├── OnboardingWizard.tsx
│       ├── SignInForm.tsx
│       ├── SignUpForm.tsx
│       └── onboarding/
├── pantry/
│   └── components/
│       ├── PantryDashboard.tsx
│       ├── PantryItemForm.tsx
│       ├── PantryItemList.tsx
│       └── PantryAnalytics.tsx
├── recipes/
│   └── components/
│       ├── RecipeCard.tsx
│       ├── RecipeForm.tsx
│       ├── RecipeList.tsx
│       └── AiRecipeGenerator.tsx
└── planner/
    └── components/
        ├── MealPlan.tsx
        ├── WeekCalendar.tsx
        └── ShoppingListGenerator.tsx
```

## Design System Components

### Button Component

A flexible button component with multiple variants and states.

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...props
}: ButtonProps);
```

**Usage Examples:**

```tsx
// Primary button
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>

// Button with icon
<Button variant="secondary" leftIcon={<PlusIcon />}>
  Add Item
</Button>

// Loading state
<Button variant="primary" loading={isSubmitting}>
  Saving...
</Button>

// Destructive action
<Button variant="destructive" onClick={handleDelete}>
  Delete Item
</Button>
```

**Styling:**
- Uses Tailwind CSS classes with design tokens
- Supports dark mode through CSS variables
- Accessible focus indicators
- Consistent spacing and typography

### Card Component

A container component for grouping related content.

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  className,
  children,
  ...props
}: CardProps);
```

**Usage Examples:**

```tsx
// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</Card>

// Card with custom padding
<Card padding="lg">
  <div>Large padding content</div>
</Card>

// Interactive card with hover effect
<Card hover onClick={handleClick}>
  <div>Clickable card content</div>
</Card>
```

### Input Component

A form input component with validation and accessibility features.

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className,
  ...props
}: InputProps);
```

**Usage Examples:**

```tsx
// Basic input with label
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Input with validation error
<Input
  label="Password"
  type="password"
  error="Password is required"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// Input with icons
<Input
  label="Search"
  leftIcon={<SearchIcon />}
  rightIcon={<FilterIcon />}
  placeholder="Search recipes..."
/>
```

### Badge Component

A small component for displaying status or categorical information.

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps);
```

**Usage Examples:**

```tsx
// Status badge
<Badge variant="success">Fresh</Badge>
<Badge variant="warning">Expiring Soon</Badge>
<Badge variant="error">Expired</Badge>

// Notification badge with dot
<Badge variant="info" dot>
  3
</Badge>
```

### Typography Components

Semantic typography components for consistent text styling.

```typescript
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}
```

**Usage Examples:**

```tsx
// Headings
<Heading as="h1" size="3xl" weight="bold">
  Welcome to KeCaraJoComer
</Heading>

<Heading as="h2" size="xl" weight="semibold">
  Your Pantry
</Heading>

// Text variants
<Text size="lg" weight="medium">
  Large medium text
</Text>

<Text size="sm" color="secondary">
  Small secondary text
</Text>
```

## UI Components

### DashboardCard Component

A specialized card component for dashboard metrics and quick actions.

```typescript
interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
}

export function DashboardCard({
  title,
  value,
  icon,
  color = 'blue',
  trend,
  onClick,
}: DashboardCardProps);
```

**Usage Example:**

```tsx
<DashboardCard
  title="Total Items"
  value={156}
  icon={<PackageIcon />}
  color="blue"
  trend={{ value: 12, direction: 'up' }}
  onClick={() => navigate('/pantry')}
/>
```

### MetricDisplay Component

A component for displaying key metrics with optional comparisons.

```typescript
interface MetricDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  comparison?: {
    value: number;
    period: string;
    direction: 'up' | 'down' | 'neutral';
  };
  size?: 'sm' | 'md' | 'lg';
}
```

**Usage Example:**

```tsx
<MetricDisplay
  label="Daily Calories"
  value={1850}
  unit="kcal"
  comparison={{
    value: 150,
    period: 'vs yesterday',
    direction: 'up'
  }}
  size="lg"
/>
```

## Accessibility Components

### FocusTrap Component

Manages focus within a modal or dialog for accessibility.

```typescript
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  onEscape?: () => void;
}

export function FocusTrap({
  children,
  active = true,
  onEscape,
}: FocusTrapProps);
```

**Usage Example:**

```tsx
<FocusTrap active={isModalOpen} onEscape={closeModal}>
  <div role="dialog" aria-modal="true">
    <h2>Modal Title</h2>
    <p>Modal content...</p>
    <button onClick={closeModal}>Close</button>
  </div>
</FocusTrap>
```

### LiveRegion Component

Provides screen reader announcements for dynamic content changes.

```typescript
interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearOnUnmount?: boolean;
}

export function LiveRegion({
  message,
  politeness = 'polite',
  clearOnUnmount = true,
}: LiveRegionProps);
```

**Usage Example:**

```tsx
// Announce success message
<LiveRegion 
  message="Item added to pantry successfully"
  politeness="polite"
/>

// Announce error message
<LiveRegion 
  message="Failed to save item. Please try again."
  politeness="assertive"
/>
```

### ScreenReaderOnly Component

Hides content visually while keeping it accessible to screen readers.

```typescript
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function ScreenReaderOnly({
  children,
  as: Component = 'span',
}: ScreenReaderOnlyProps);
```

**Usage Example:**

```tsx
<button>
  <TrashIcon />
  <ScreenReaderOnly>Delete item</ScreenReaderOnly>
</button>
```

## Feature Components

### PantryDashboard Component

Main dashboard component for pantry management with AI insights.

```typescript
interface PantryDashboardProps {
  onAddItem?: () => void;
  onManageItems?: () => void;
}

export function PantryDashboard({
  onAddItem,
  onManageItems,
}: PantryDashboardProps);
```

**Features:**
- Real-time pantry statistics
- AI-powered insights from Gemini
- Expiration alerts and management
- Quick action buttons
- Responsive grid layout

**Usage Example:**

```tsx
<PantryDashboard
  onAddItem={() => setShowAddModal(true)}
  onManageItems={() => navigate('/pantry/manage')}
/>
```

### OnboardingWizard Component

Multi-step onboarding flow for new users.

```typescript
export function OnboardingWizard();
```

**Features:**
- Step-by-step user setup
- Progress tracking
- Form validation
- Data persistence
- Responsive design

**Steps:**
1. Welcome and introduction
2. Profile setup
3. Dietary preferences
4. Cooking preferences
5. Nutrition goals
6. Initial pantry setup
7. Meal plan preview
8. Completion and dashboard redirect

### RecipeCard Component

Display component for recipe information with actions.

```typescript
interface RecipeCardProps {
  recipe: Recipe;
  onView?: (recipe: Recipe) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
  onAddToPlan?: (recipe: Recipe) => void;
  variant?: 'default' | 'compact' | 'featured';
}

export function RecipeCard({
  recipe,
  onView,
  onEdit,
  onDelete,
  onAddToPlan,
  variant = 'default',
}: RecipeCardProps);
```

**Features:**
- Recipe image and title
- Difficulty and time indicators
- Dietary tags and badges
- Nutritional information
- Action buttons
- Responsive layout

### AiRecipeGenerator Component

AI-powered recipe generation interface.

```typescript
interface AiRecipeGeneratorProps {
  onRecipeGenerated?: (recipe: Recipe) => void;
  availableIngredients?: string[];
  defaultPreferences?: Partial<AIRecipeRequest>;
}

export function AiRecipeGenerator({
  onRecipeGenerated,
  availableIngredients,
  defaultPreferences,
}: AiRecipeGeneratorProps);
```

**Features:**
- Form for recipe parameters
- AI provider selection (Claude/Gemini)
- Real-time generation progress
- Recipe preview and editing
- Save to recipe collection

## Component Patterns

### Compound Components

Components that work together as a cohesive unit:

```tsx
// Example: Form compound component
<Form onSubmit={handleSubmit}>
  <Form.Field>
    <Form.Label>Email</Form.Label>
    <Form.Input type="email" />
    <Form.Error />
  </Form.Field>
  <Form.Actions>
    <Form.Submit>Submit</Form.Submit>
    <Form.Cancel>Cancel</Form.Cancel>
  </Form.Actions>
</Form>
```

### Render Props Pattern

Components that use render props for flexible composition:

```tsx
<DataLoader
  url="/api/pantry/items"
  render={({ data, loading, error }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;
    return <PantryItemList items={data} />;
  }}
/>
```

### Custom Hooks Integration

Components integrate with custom hooks for state management:

```tsx
export function PantryItemList() {
  const {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
  } = usePantryStore();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {items.map(item => (
        <PantryItem
          key={item.id}
          item={item}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      ))}
    </div>
  );
}
```

## Testing Components

### Unit Testing

Components are tested with Jest and React Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading...</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Accessibility Testing

Components are tested for accessibility compliance:

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Visual Testing

Components are tested for visual regressions:

```typescript
import { render } from '@testing-library/react';
import { Button } from './Button';

describe('Button Visual Tests', () => {
  it('matches snapshot', () => {
    const { container } = render(<Button variant="primary">Test</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Performance Considerations

### Lazy Loading

Components are lazy-loaded to improve initial bundle size:

```tsx
const PantryDashboard = lazy(() => import('./PantryDashboard'));
const RecipeGenerator = lazy(() => import('./AiRecipeGenerator'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/pantry" element={<PantryDashboard />} />
        <Route path="/recipes/generate" element={<RecipeGenerator />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

Components use React.memo and useMemo for performance optimization:

```tsx
const PantryItem = React.memo(({ item, onUpdate, onDelete }) => {
  const handleUpdate = useCallback((updates) => {
    onUpdate(item.id, updates);
  }, [item.id, onUpdate]);

  const expirationStatus = useMemo(() => {
    return calculateExpirationStatus(item.expiration_date);
  }, [item.expiration_date]);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
});
```

### Virtual Scrolling

Large lists use virtual scrolling for performance:

```tsx
import { FixedSizeList as List } from 'react-window';

function PantryItemList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <PantryItem item={items[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

## Styling Guidelines

### Tailwind CSS Integration

Components use Tailwind CSS with design tokens:

```tsx
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  ghost: 'hover:bg-gray-100 text-gray-700',
};

export function Button({ variant = 'primary', className, ...props }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors',
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  );
}
```

### Dark Mode Support

Components support dark mode through CSS variables:

```css
:root {
  --color-primary: #3b82f6;
  --color-background: #ffffff;
  --color-foreground: #1f2937;
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-background: #1f2937;
  --color-foreground: #f9fafb;
}
```

### Responsive Design

Components use responsive Tailwind classes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="p-4 md:p-6">
    <h3 className="text-lg md:text-xl font-semibold">
      Responsive Card
    </h3>
  </Card>
</div>
```

## Component Documentation

### Storybook Integration

Components are documented with Storybook:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};
```

### TypeScript Documentation

Components have comprehensive TypeScript documentation:

```typescript
/**
 * Button component with multiple variants and states
 * 
 * @param variant - The visual style variant
 * @param size - The size of the button
 * @param loading - Shows loading state with spinner
 * @param leftIcon - Icon to display on the left side
 * @param rightIcon - Icon to display on the right side
 * @param disabled - Disables the button
 * @param onClick - Click event handler
 * @param children - Button content
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleSubmit}>
 *   Submit Form
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  onClick,
  children,
  ...props
}: ButtonProps) {
  // Implementation
}
```

## Contributing to Components

### Component Development Guidelines

1. **Follow the design system**: Use established tokens and patterns
2. **Ensure accessibility**: Include proper ARIA labels and keyboard navigation
3. **Write comprehensive tests**: Unit, integration, and accessibility tests
4. **Document thoroughly**: Include TypeScript docs and Storybook stories
5. **Consider performance**: Use memoization and lazy loading where appropriate
6. **Support responsive design**: Use mobile-first approach
7. **Follow naming conventions**: Use clear, descriptive names
8. **Version changes**: Follow semantic versioning for breaking changes

### Code Review Checklist

- [ ] Component follows design system patterns
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] TypeScript interfaces are properly defined
- [ ] Component is properly tested
- [ ] Documentation is complete and accurate
- [ ] Performance considerations addressed
- [ ] Responsive design implemented
- [ ] Dark mode support included
- [ ] Storybook story created
- [ ] No console errors or warnings

## Future Roadmap

### Planned Components

- **DataTable**: Advanced table with sorting, filtering, and pagination
- **DatePicker**: Accessible date selection component
- **FileUpload**: Drag-and-drop file upload component
- **Chart**: Data visualization components
- **CommandPalette**: Quick action search interface
- **Timeline**: Event timeline component
- **Kanban**: Drag-and-drop board component

### Enhancements

- **Animation system**: Consistent animations and transitions
- **Theming improvements**: Better customization options
- **Internationalization**: RTL support and localization
- **Performance optimizations**: Bundle splitting and tree shaking
- **Advanced accessibility**: Voice navigation and screen reader improvements