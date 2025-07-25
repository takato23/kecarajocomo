# Component Inventory - KeCarajoComer

**Last Updated**: January 2025  
**Total Components**: 167+ files  
**Design System**: iOS26-inspired Glass Morphism

## Component Organization

### 🎨 Design System Components (`/src/components/ios26/`)

#### Core iOS26 Components
- **iOS26Card**: Glass morphism card with blur effects
- **iOS26Button**: Glassmorphic buttons with haptic feedback
- **iOS26Input**: Translucent input fields
- **iOS26Modal**: Blurred background modals
- **iOS26EnhancedCard**: Advanced card with animations
- **iOS26Stats**: Statistics display components

#### Glass Effects (`/src/styles/ios26/glass.css`)
- Glass morphism utilities
- Backdrop blur effects
- Translucent overlays
- Neumorphic shadows

### 🧩 UI Components (`/src/components/ui/`)

#### Basic Components
- **Button**: Multiple variants (primary, secondary, ghost, destructive)
- **Input**: Form inputs with validation states
- **Card**: Basic card layouts
- **Badge**: Status and category badges
- **Modal**: Dialog and modal windows
- **Toast**: Notification toasts

#### Advanced Components
- **GlassCard**: Glassmorphic card component
- **EnhancedLoading**: Skeleton and loading states
- **StatusModal**: Status display modals
- **UltraPremiumCalendar**: Advanced calendar component
- **DarkModeToggle**: Theme switcher

#### Form Components
- **Select**: Dropdown selects
- **Checkbox**: Checkbox inputs
- **RadioGroup**: Radio button groups
- **Switch**: Toggle switches
- **Slider**: Range sliders
- **MultiSelect**: Multiple selection component

### 📱 Navigation Components (`/src/components/navigation/`)

- **Navbar**: Top navigation bar
- **MobileNav**: Mobile navigation menu
- **ModernSidebar**: Desktop sidebar navigation
- **CommandPalette**: Quick action command palette
- **Breadcrumbs**: Navigation breadcrumbs
- **TabNav**: Tab navigation component

### 🍳 Recipe Components (`/src/components/recipes/`)

- **RecipeCard**: Recipe display card
- **RecipeDetail**: Detailed recipe view
- **RecipeDeleteConfirmation**: Delete dialog
- **EnhancedRecipeGrid**: Recipe grid layout
- **RecipeGenerator**: AI recipe generation
- **RecipeFilters**: Search and filter controls
- **NutritionalInfo**: Nutrition display

### 🗓️ Meal Planning Components

#### Multiple Implementations Found:
1. **`/src/components/planner/`**
   - MealPlannerGrid
   - EnhancedMealCard
   - WeekNavigator
   - MealSlot

2. **`/src/app/(app)/planificador/components/`**
   - UltraModernMealPlannerGrid
   - EnhancedMealPlannerGrid
   - DragDropMealPlannerGrid
   - SimpleDragDropGrid
   - Various MealSlot implementations

3. **`/src/components/meal-planner/`**
   - Additional meal planning components

### 🥫 Pantry Components (`/src/components/pantry/`)

- **PantryItemCard**: Item display card
- **PhotoRecognition**: Image-based item recognition
- **ReceiptScanner**: OCR receipt scanning
- **ExpirationTracker**: Expiration date monitoring
- **PantryInsights**: Analytics and insights
- **VoiceInput**: Voice-based item entry

### 🛒 Shopping Components (`/src/components/shopping/`)

- **ShoppingListCard**: Shopping list display
- **ShoppingItemRow**: Individual item rows
- **PriceComparison**: Price tracking
- **StoreSelector**: Store selection
- **ShoppingInsights**: Shopping analytics

### 📸 Scanner Components (`/src/components/scanner/`)

- **SmartScanner**: Unified scanner interface
- **ReceiptCamera**: Camera for receipts
- **BarcodeScanner**: Product barcode scanning
- **ImageRecognition**: AI-powered recognition

### 💰 Price Components (`/src/components/price-scraper/`)

- **PriceSearchComponent**: Price search interface
- **EnhancedPriceDisplay**: Price information display
- **PriceHistory**: Historical price charts
- **PriceAlerts**: Price drop notifications

### 👤 Profile Components (`/src/components/profile/`)

- **ProfileHeader**: User profile header
- **ProfileDebug**: Debug information display
- **PreferenceSettings**: User preferences
- **DietaryRestrictions**: Dietary settings

### 🏢 Layout Components (`/src/components/layout/`)

- **AppShell**: Main application shell
- **DashboardLayout**: Dashboard container
- **AuthLayout**: Authentication pages layout
- **ModernSidebar**: Modern sidebar design

### 🎯 Feature-Specific Components

#### Authentication (`/src/features/auth/components/`)
- **LoginForm**: User login
- **RegisterForm**: User registration
- **ProfileSetupStep**: Onboarding profile setup
- **OnboardingFlow**: New user onboarding

#### Dashboard (`/src/features/dashboard/`)
- **UltraModernDashboard**: Main dashboard view
- **DashboardStats**: Statistics widgets
- **QuickActions**: Quick action buttons
- **RecentActivity**: Activity feed

#### Gamification (`/src/features/gamification/`)
- **LeaderboardTable**: User rankings
- **AchievementBadges**: Achievement display
- **ProgressTrackers**: Goal progress

#### Cooking Assistant (`/src/features/cooking-assistant/`)
- **StepCard**: Cooking step display
- **TimerWidget**: Cooking timers
- **IngredientChecklist**: Ingredient tracking

### 🔧 Utility Components

#### Drag & Drop (`/src/components/drag-drop/`)
- **DragDropContext**: DnD context provider
- **Draggable**: Draggable wrapper
- **Droppable**: Drop zone component

#### Loading States
- **Skeleton**: Content placeholders
- **Spinner**: Loading spinners
- **ProgressBar**: Progress indicators

#### Error Handling
- **ErrorBoundary**: Error boundary wrapper
- **ErrorMessage**: Error display
- **RetryButton**: Retry action button

### 📊 Component Statistics

#### By Category
- UI Components: ~40 components
- Feature Components: ~80 components
- Layout Components: ~10 components
- Utility Components: ~20 components
- iOS26 Design System: ~15 components

#### By Complexity
- Simple (atoms): ~50 components
- Medium (molecules): ~70 components
- Complex (organisms): ~30 components
- Templates: ~10 components

#### By Status
- ✅ Production Ready: ~60%
- 🚧 In Development: ~25%
- 📋 Planned: ~15%

### 🎯 Component Best Practices

#### Naming Conventions
- PascalCase for components
- Descriptive names (RecipeCard vs Card)
- Feature prefixes (ProfileHeader, ShoppingList)

#### File Structure
```
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.test.tsx # Tests
├── ComponentName.stories.tsx # Storybook
├── ComponentName.module.css # Styles (if needed)
└── index.ts              # Exports
```

#### Component Patterns
- Composition over inheritance
- Props interface definitions
- ForwardRef for DOM access
- Memoization for performance

### 🚨 Issues & Improvements Needed

#### High Priority
1. **Meal Planner Consolidation**: Multiple implementations need merging
2. **Component Duplication**: Similar components in different locations
3. **Incomplete TypeScript**: Some components use 'any'
4. **Missing Tests**: Many components lack tests

#### Medium Priority
1. **Storybook Updates**: Stories are outdated
2. **Accessibility**: Some components need ARIA improvements
3. **Performance**: Large components need optimization
4. **Documentation**: Component API documentation missing

#### Low Priority
1. **Style Consistency**: Some components use different styling approaches
2. **Naming Consistency**: Some components have unclear names
3. **Unused Components**: Dead code needs removal
4. **Component Size**: Some components are too large

### 📋 Recommended Actions

1. **Immediate**
   - Consolidate meal planner components
   - Remove duplicate components
   - Add TypeScript to remaining JS files

2. **Short Term**
   - Complete component testing
   - Update Storybook stories
   - Improve accessibility

3. **Long Term**
   - Create component library package
   - Implement design tokens
   - Build component playground

### 🎨 Design System Tokens

#### Colors
- Primary: Blue-based glass effects
- Secondary: Purple accents
- Background: Translucent layers
- Text: High contrast for readability

#### Spacing
- Base unit: 4px
- Common sizes: 8, 16, 24, 32, 48px

#### Typography
- Font: System fonts for performance
- Sizes: 12, 14, 16, 18, 24, 32px
- Weights: 400, 500, 600, 700

#### Shadows
- Neumorphic shadows for depth
- Glass reflections
- Blur effects for hierarchy

### 📚 Component Documentation Status

- ✅ Documented: ~30%
- 🚧 Partial: ~40%
- ❌ Undocumented: ~30%

Priority components needing documentation:
1. Meal planning components
2. AI integration components
3. Complex feature components
4. Shared UI components