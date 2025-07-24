# Liquid Glass Design System

A modern, food-themed design system built with React, TypeScript, and Tailwind CSS, featuring glass morphism effects and specialized components for the kecarajocomer meal planning application.

## 🎨 Design Philosophy

The Liquid Glass Design System is built around these core principles:

- **Glass Morphism**: Translucent surfaces with backdrop blur effects
- **Food-Themed**: Colors and components inspired by fresh ingredients and cooking
- **Accessibility First**: WCAG 2.1 AA compliant with semantic markup
- **Performance**: Optimized animations and responsive design
- **Developer Experience**: TypeScript support with comprehensive prop interfaces

## 🏗️ Architecture

```
components/design-system/
├── Button.tsx              # Interactive button component
├── Input.tsx               # Form input with variants
├── Card.tsx                # Glass card containers
├── Badge.tsx               # Tags and status indicators
├── Typography.tsx          # Text and heading components
├── RecipeCard.tsx          # Specialized recipe display
├── NutritionDisplay.tsx    # Nutrition information component
├── icons.tsx               # Icon library
├── theme.ts                # Design tokens and utilities
├── DesignSystemDemo.tsx    # Component showcase
└── index.ts                # Main exports
```

## 🎯 Core Components

### Button
Interactive buttons with multiple variants and states.

```tsx
import { Button } from '@/components/design-system';

<Button variant="primary" leftIcon={<PlusIcon />} glow>
  Create Recipe
</Button>
```

**Variants**: `primary`, `secondary`, `ghost`, `glass`, `fresh`, `warm`, `rich`, `golden`
**Sizes**: `sm`, `md`, `lg`, `xl`

### Input
Form inputs with glass morphism styling and comprehensive validation.

```tsx
import { Input } from '@/components/design-system';

<Input
  label="Recipe Name"
  placeholder="Enter recipe name"
  leftIcon={<SearchIcon />}
  variant="glass"
  error="This field is required"
/>
```

**Variants**: `default`, `glass`, `fresh`, `warm`
**Features**: Icons, addons, validation states, helper text

### Card
Flexible container component with glass effects.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/design-system';

<Card variant="glass-interactive" hover glow>
  <CardHeader title="Recipe Title" subtitle="Description" />
  <CardBody>Content here</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

**Variants**: `default`, `glass`, `glass-interactive`, `fresh`, `warm`, `rich`, `golden`

### Typography
Semantic text components with consistent styling.

```tsx
import { Heading, Text, Link } from '@/components/design-system';

<Heading size="2xl" gradient>Main Title</Heading>
<Text size="lg" color="muted">Description text</Text>
<Link variant="fresh" external href="https://example.com">
  External Link
</Link>
```

## 🍽️ Food-Specific Components

### RecipeCard
Specialized component for displaying recipe information.

```tsx
import { RecipeCard } from '@/components/design-system';

<RecipeCard
  id="recipe-1"
  name="Mediterranean Quinoa Bowl"
  cookTime={25}
  prepTime={15}
  servings={4}
  difficulty="easy"
  rating={4.8}
  tags={['Healthy', 'Mediterranean']}
  variant="glass"
  onFavoriteToggle={(id) => console.log('Favorited:', id)}
/>
```

**Features**: Favorite toggle, sharing, difficulty indicators, nutrition display

### NutritionDisplay
Comprehensive nutrition information display.

```tsx
import { NutritionDisplay } from '@/components/design-system';

<NutritionDisplay
  nutrition={{
    calories: 420,
    protein: 18,
    carbs: 58,
    fat: 12,
    fiber: 8
  }}
  servings={2}
  showPercentages={true}
  variant="card"
/>
```

**Variants**: `card`, `compact`, `inline`
**Features**: Daily value percentages, serving adjustments, macro breakdowns

## 🎨 Design Tokens

### Color System

The design system uses a food-themed color palette:

- **Fresh** (Green): Vegetables, herbs, healthy options
- **Warm** (Orange): Proteins, spices, comfort foods
- **Rich** (Purple): Fruits, wine, premium ingredients
- **Golden** (Yellow): Grains, oils, baked goods

### Glass Effects

Glass morphism is achieved through:
- Translucent backgrounds with varying opacity
- Backdrop blur filters
- Subtle borders and shadows
- Smooth hover transitions

```css
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### Typography

- **Font Family**: Inter (system fallbacks)
- **Scale**: 2xs, xs, sm, base, lg, xl, 2xl, 3xl, 4xl
- **Weights**: normal, medium, semibold, bold, extrabold

### Spacing & Layout

- **Grid System**: CSS Grid and Flexbox
- **Responsive**: Mobile-first approach
- **Spacing Scale**: 0.25rem increments (1-32)
- **Border Radius**: sm to 5xl with glass-specific variants

## 🎭 Animations

The system includes subtle animations for enhanced user experience:

- **Fade In**: Gentle content entrance
- **Slide Transitions**: Smooth directional movement
- **Float**: Gentle vertical movement
- **Pulse Glow**: Breathing light effects
- **Shimmer**: Loading and highlight effects

```tsx
<div className="animate-float glow-fresh">
  <Icons.ChefHat size="xl" />
</div>
```

## 🎯 Icons

Comprehensive icon library with food and interface icons:

```tsx
import { Icons } from '@/components/design-system';

<Icons.ChefHat size="lg" className="text-food-fresh-500" />
<Icons.Clock size="md" />
<Icons.Heart size="sm" />
```

**Categories**: Food & Recipe, Navigation, Actions, Status, User, Settings

## 🌙 Dark Mode

Full dark mode support with intelligent color adaptations:

```tsx
// Automatic dark mode adaptation
<div className="glass"> // Adapts based on theme
  <Text color="default"> // Adjusts for light/dark
```

## 📱 Responsive Design

Mobile-first responsive design with breakpoint-aware components:

- **Mobile**: 320px+
- **Tablet**: 768px+
- **Desktop**: 1024px+
- **Large**: 1280px+

## 🚀 Usage

### Installation

The design system is already integrated into the project. Import components directly:

```tsx
import { Button, Card, RecipeCard } from '@/components/design-system';
```

### Theme Configuration

Customize the theme through the theme configuration:

```tsx
import { defaultTheme, generateCSSCustomProperties } from '@/components/design-system/theme';

const customTheme = {
  ...defaultTheme,
  primaryColor: 'warm',
  glassEnabled: true,
};
```

### Best Practices

1. **Use semantic components**: Choose components based on content type
2. **Maintain consistency**: Stick to the design system variants
3. **Accessibility**: Always include proper labels and ARIA attributes
4. **Performance**: Use appropriate animation settings
5. **Responsive**: Test components across all breakpoints

### Examples

See `DesignSystemDemo.tsx` for comprehensive examples of all components and their variants.

## 🔧 Customization

The design system is built with customization in mind:

- **CSS Custom Properties**: Easy theme switching
- **Tailwind Configuration**: Extended with design tokens
- **Component Variants**: Flexible styling options
- **TypeScript Support**: Full type safety

## 📚 API Reference

Each component includes comprehensive TypeScript interfaces documenting all available props, variants, and callbacks. Check individual component files for detailed API documentation.

## 🧪 Testing

The design system includes:

- **Visual Testing**: Storybook integration (planned)
- **Accessibility Testing**: WCAG compliance checks
- **Responsive Testing**: Cross-device compatibility
- **Performance Testing**: Animation performance validation

## 🎉 Contributing

When adding new components:

1. Follow the established naming conventions
2. Include TypeScript interfaces
3. Add proper documentation
4. Test across all variants and states
5. Ensure accessibility compliance
6. Update this README with new features

---

Built with ❤️ for the kecarajocomer meal planning experience.