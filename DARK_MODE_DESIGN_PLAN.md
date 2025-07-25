# Dark Mode Implementation Plan - KeCarajoComér

## 🎨 Design Philosophy

### Core Principles
1. **Unified Theme System**: Single source of truth for theme management
2. **Glassmorphism Adaptation**: Maintain glass effects in both light and dark modes
3. **Accessibility**: Ensure proper contrast ratios (WCAG AA minimum)
4. **Performance**: Minimal re-renders, CSS-based transitions
5. **Consistency**: Coherent color system across all components

## 🌗 Color System Design

### Light Mode Palette
```css
/* Backgrounds */
--bg-primary: #ffffff;
--bg-secondary: #f9fafb;
--bg-tertiary: #f3f4f6;

/* Glass Effects */
--glass-bg: rgba(255, 255, 255, 0.65);
--glass-border: rgba(255, 255, 255, 0.25);
--glass-blur: 14px;
--glass-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);

/* Text */
--text-primary: #111827;
--text-secondary: #4b5563;
--text-tertiary: #6b7280;

/* Accents */
--accent-primary: #f97316; /* Orange */
--accent-secondary: #ec4899; /* Pink */
--accent-tertiary: #8b5cf6; /* Purple */
```

### Dark Mode Palette
```css
/* Backgrounds */
--bg-primary: #0a0a0a;
--bg-secondary: #171717;
--bg-tertiary: #262626;

/* Glass Effects - Dark Adapted */
--glass-bg: rgba(24, 24, 27, 0.55);
--glass-border: rgba(255, 255, 255, 0.15);
--glass-blur: 20px; /* Slightly more blur for dark mode */
--glass-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);

/* Text */
--text-primary: #f9fafb;
--text-secondary: #d1d5db;
--text-tertiary: #9ca3af;

/* Accents - Slightly adjusted for dark mode */
--accent-primary: #fb923c; /* Lighter orange */
--accent-secondary: #f472b6; /* Lighter pink */
--accent-tertiary: #a78bfa; /* Lighter purple */
```

## 🏗️ Implementation Architecture

### 1. Theme Context Enhancement
```typescript
// contexts/EnhancedThemeContext.tsx
interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  effectiveTheme: 'light' | 'dark'; // Resolved theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  glassStyle: GlassStyle; // Dynamic glass styles
}

interface GlassStyle {
  base: string;
  hover: string;
  active: string;
  disabled: string;
}
```

### 2. Glass Component Variants
```typescript
// Dark Mode Glass Variants
const glassVariants = {
  light: {
    subtle: 'bg-white/10 backdrop-blur-md border-white/20',
    medium: 'bg-white/20 backdrop-blur-lg border-white/30',
    strong: 'bg-white/30 backdrop-blur-xl border-white/40'
  },
  dark: {
    subtle: 'bg-black/20 backdrop-blur-md border-white/10',
    medium: 'bg-black/30 backdrop-blur-lg border-white/15',
    strong: 'bg-black/40 backdrop-blur-xl border-white/20'
  }
};
```

## 📋 Implementation Steps

### Phase 1: Foundation (Priority: Critical)
1. **Fix Provider Import**
   - Add iOS26Provider import to providers.tsx
   - Decide between ThemeContext or iOS26Provider (recommend ThemeContext for simplicity)

2. **Create Unified Theme System**
   - Enhance ThemeContext with all necessary features
   - Add theme persistence to localStorage
   - Implement system theme detection

3. **Update Global Styles**
   - Extend CSS variables for comprehensive dark mode
   - Add transition classes for smooth theme switching

### Phase 2: Core Components (Priority: High)
1. **Navigation Components**
   - Remove local isDarkMode from Navbar
   - Use context theme throughout
   - Adapt glass effects for dark mode

2. **GlassCard Components**
   - Create theme-aware glass variants
   - Ensure proper contrast in dark mode
   - Maintain blur and transparency balance

3. **Form Components**
   - Update input styles for dark mode
   - Ensure placeholder text is visible
   - Adapt focus states

### Phase 3: Feature Components (Priority: Medium)
1. **Recipe Cards**
   - Dark mode image overlays
   - Text contrast on images
   - Badge adaptations

2. **Dashboard Components**
   - Chart color adaptations
   - Stats card styling
   - Progress indicators

3. **Meal Planner**
   - Calendar dark mode
   - Meal card adaptations
   - Drag-and-drop visual feedback

### Phase 4: Special Effects (Priority: Low)
1. **Animations**
   - Glow effects adaptation
   - Gradient adjustments
   - Shadow intensities

2. **Micro-interactions**
   - Hover states
   - Active states
   - Loading states

## 🔧 Technical Implementation Details

### 1. Theme Provider Setup
```tsx
// app/providers.tsx
import { ThemeProvider } from '@/contexts/EnhancedThemeContext';

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
```

### 2. Component Pattern
```tsx
// Example: GlassButton with dark mode
const GlassButton = ({ variant = 'medium', ...props }) => {
  const { effectiveTheme } = useTheme();
  
  const styles = cn(
    'transition-all duration-300',
    effectiveTheme === 'dark' 
      ? glassVariants.dark[variant]
      : glassVariants.light[variant],
    props.className
  );
  
  return <button className={styles} {...props} />;
};
```

### 3. CSS Variable Usage
```css
/* Component-specific dark mode */
.recipe-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
}

/* Dark mode specific adjustments */
.dark .recipe-card {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}
```

## 📊 Testing Strategy

### 1. Visual Testing
- Light/Dark mode toggle functionality
- Contrast ratio validation
- Glass effect visibility
- Animation smoothness

### 2. Accessibility Testing
- WCAG AA compliance
- Screen reader compatibility
- Keyboard navigation
- Focus indicators

### 3. Performance Testing
- Theme switch render time
- CSS transition performance
- Memory usage

## 🚀 Migration Path

### Week 1
- Implement unified theme system
- Update navigation components
- Fix provider issues

### Week 2
- Update all glass components
- Adapt form elements
- Update dashboard

### Week 3
- Feature components
- Special effects
- Testing and refinement

## 📝 Component Checklist

- [ ] Navbar
- [ ] Sidebar
- [ ] GlassCard
- [ ] GlassButton
- [ ] GlassInput
- [ ] GlassModal
- [ ] RecipeCard
- [ ] MealCard
- [ ] Dashboard widgets
- [ ] Shopping list
- [ ] Pantry items
- [ ] Profile components
- [ ] Settings page
- [ ] Onboarding flow

## 🎯 Success Metrics

1. **Consistency**: All components follow the same theme system
2. **Performance**: Theme switch < 100ms
3. **Accessibility**: WCAG AA compliance
4. **User Experience**: Smooth transitions, no flash of unstyled content
5. **Maintainability**: Single source of truth, easy to extend

## 🔍 Special Considerations

### Glassmorphism in Dark Mode
1. **Reduced transparency**: Dark backgrounds need less transparency
2. **Increased blur**: Compensate for lower contrast with more blur
3. **Subtle borders**: White borders at low opacity for definition
4. **Glow effects**: Use sparingly, with muted colors

### Image Handling
1. **Overlays**: Darker overlays in dark mode
2. **Borders**: Subtle light borders around images
3. **Loading states**: Darker skeletons

### Gradients
1. **Muted colors**: Less vibrant in dark mode
2. **Direction**: Consider reversing gradient direction
3. **Opacity**: Lower opacity for background gradients

## 🎨 Visual Examples

### Glass Card - Light Mode
```
Background: rgba(255, 255, 255, 0.65)
Border: rgba(255, 255, 255, 0.25)
Shadow: Soft, light
```

### Glass Card - Dark Mode
```
Background: rgba(24, 24, 27, 0.55)
Border: rgba(255, 255, 255, 0.15)
Shadow: Deeper, darker
Glow: Subtle purple/blue on hover
```

This design plan ensures a cohesive, beautiful dark mode implementation that maintains the glassmorphism aesthetic while providing excellent user experience across all lighting conditions.