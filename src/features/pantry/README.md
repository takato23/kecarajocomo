# Pantry Management System

A comprehensive pantry management system for the kecarajocomer meal planning application, built with Next.js 15, TypeScript, and Zustand.

## Features

### Core Functionality
- **Item Management**: Add, edit, delete, and track pantry items
- **Expiration Tracking**: Monitor expiration dates with smart notifications
- **Location Management**: Organize items by storage location (refrigerator, freezer, pantry, etc.)
- **Category Organization**: Categorize items for better organization
- **Cost Tracking**: Track costs for budgeting and waste analysis

### Smart Features
- **Expiration Alerts**: Real-time notifications for expiring and expired items
- **Recipe Integration**: Check ingredient availability for recipes
- **Shopping List Generation**: Auto-generate shopping lists from missing ingredients
- **Consumption Tracking**: Track ingredient usage when cooking recipes
- **Analytics & Insights**: Analyze waste patterns and get optimization suggestions

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Instant UI updates with optimistic updates
- **Search & Filtering**: Advanced search and filtering capabilities
- **Batch Operations**: Bulk actions for managing multiple items
- **Notifications**: Browser notifications for expiring items

## Architecture

### File Structure
```
features/pantry/
├── components/           # React components
│   ├── PantryDashboard.tsx      # Main dashboard overview
│   ├── PantryItemForm.tsx       # Add/edit item form
│   ├── PantryItemList.tsx       # Item list with search/filter
│   ├── ExpirationNotifications.tsx  # Expiration alerts
│   ├── NotificationSettings.tsx     # Notification preferences
│   ├── RecipeAvailabilityCheck.tsx  # Recipe integration
│   ├── PantryAnalytics.tsx      # Analytics and insights
│   └── index.ts                 # Component exports
├── hooks/               # Custom React hooks
│   └── usePantryNotifications.ts    # Notification management
├── store/               # Zustand state management
│   └── pantryStore.ts           # Main pantry store
├── types/               # TypeScript definitions
│   └── index.ts                 # All pantry types
├── utils/               # Utility functions
│   └── mealPlanIntegration.ts   # Recipe integration utilities
├── index.ts             # Feature exports
├── page.tsx             # Main pantry page
└── README.md            # This file
```

### API Routes
```
app/api/pantry/
├── items/
│   ├── route.ts                 # GET, POST pantry items
│   ├── [id]/route.ts           # GET, PUT, DELETE specific item
│   └── batch/route.ts          # Batch operations
├── locations/
│   ├── route.ts                # GET, POST locations
│   └── [id]/route.ts           # PUT, DELETE specific location
├── stats/route.ts              # GET pantry statistics
├── analysis/route.ts           # GET pantry analytics
├── expiration-alerts/
│   ├── route.ts                # GET, POST alerts
│   └── [id]/route.ts           # PUT alert (dismiss/snooze)
├── availability/route.ts       # POST check recipe availability
└── consume/route.ts            # POST consume ingredients
```

## Components

### PantryDashboard
Main overview component showing:
- Total items, expiring items, expired items
- Total pantry value
- Expiration alerts
- Category breakdown
- Quick actions

### PantryItemForm
Modal form for adding/editing pantry items with:
- Ingredient name and quantity
- Unit selection with common units
- Category selection
- Expiration date with smart suggestions
- Advanced options (location, cost, notes)

### PantryItemList
Comprehensive item list with:
- Search and filtering capabilities
- Grid and list view modes
- Sorting options
- Batch selection and operations
- Item status indicators

### ExpirationNotifications
Alert system showing:
- Expired items (urgent alerts)
- Items expiring soon (warning alerts)
- Dismissible notifications
- Filter controls

### RecipeAvailabilityCheck
Recipe integration component that:
- Checks ingredient availability for recipes
- Generates shopping lists for missing items
- Allows cooking recipes (consumes ingredients)
- Shows detailed ingredient breakdown

### PantryAnalytics
Analytics dashboard with:
- Waste analysis and cost tracking
- Usage patterns and trends
- Optimization suggestions
- Storage and shopping tips

## State Management

### Zustand Store (pantryStore.ts)
Centralized state management with:
- **Items**: CRUD operations for pantry items
- **Locations**: Manage storage locations
- **Filters**: Search and filter state
- **Selection**: Multi-select functionality
- **Sync**: Optimistic updates and error handling
- **Persistence**: localStorage caching

### Key Store Actions
```typescript
// Item management
addItem(item: AddPantryItemForm): Promise<PantryItem>
updateItem(item: UpdatePantryItemForm): Promise<void>
deleteItem(itemId: string): Promise<void>
deleteItems(itemIds: string[]): Promise<void>

// Batch operations
batchOperation(operation: BatchPantryOperation): Promise<BatchOperationResult>

// Search and filtering
setFilter(filter: Partial<PantryFilter>): void
getFilteredItems(): PantryItem[]
searchItems(query: string): PantryItem[]

// Expiration management
checkExpirations(): void
getExpiringItems(days: number): PantryItem[]
getExpiredItems(): PantryItem[]

// Analytics
fetchStats(): Promise<void>
fetchAnalysis(): Promise<void>
```

## Recipe Integration

### Availability Checking
- Match recipe ingredients with pantry items
- Handle unit conversions automatically
- Calculate sufficient quantities
- Support ingredient substitutions

### Shopping List Generation
- Generate lists for missing ingredients
- Merge with existing shopping lists
- Add buffer quantities for cooking
- Categorize items for shopping efficiency

### Consumption Tracking
- Consume ingredients when cooking recipes
- Update pantry quantities automatically
- Remove items when fully consumed
- Track cooking events for analytics

### Unit Conversions
Supports common cooking unit conversions:
- Weight: kg ↔ g, lbs ↔ oz
- Volume: l ↔ ml, cups ↔ tbsp ↔ tsp, gal ↔ qt ↔ pt
- Cooking: cups ↔ tbsp ↔ tsp conversions

## Notification System

### Browser Notifications
- Request permission on first use
- Configurable notification types
- Automatic scheduling and checking
- Click-to-focus functionality

### Notification Types
- **Expired Items**: Immediate alerts for expired items
- **Urgent Items**: Items expiring in 1-2 days
- **Weekly Reminders**: Items expiring in 3-7 days

### Settings
- Enable/disable notifications
- Configure alert types
- Set check frequency
- Snooze and dismiss options

## Analytics & Insights

### Waste Analysis
- Track expired items by category
- Calculate waste value
- Identify patterns in food waste
- Monthly and yearly trends

### Usage Patterns
- Most frequently used ingredients
- Seasonal usage trends
- Shopping frequency analysis
- Recipe cooking patterns

### Optimization Suggestions
- **Bulk Buying**: Recommendations for bulk purchases
- **Storage**: Tips for better food storage
- **Recipes**: Suggestions for using expiring items

## Database Schema

### Pantry Items Table
```sql
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ingredient_id UUID REFERENCES ingredients(id),
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  expiration_date DATE,
  location TEXT,
  category TEXT,
  purchase_date DATE,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pantry Locations Table
```sql
CREATE TABLE pantry_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  temperature_zone TEXT CHECK (temperature_zone IN ('freezer', 'refrigerator', 'pantry', 'counter')),
  UNIQUE(user_id, name)
);
```

## Usage Examples

### Basic Item Management
```typescript
import { usePantryStore } from '@/features/pantry';

function MyComponent() {
  const { addItem, items, isLoading } = usePantryStore();
  
  const handleAddItem = async () => {
    await addItem({
      ingredient_name: 'Bananas',
      quantity: 6,
      unit: 'pieces',
      category: 'Produce',
      expiration_date: '2024-02-01',
    });
  };
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.ingredient_name}</div>
      ))}
    </div>
  );
}
```

### Recipe Availability Check
```typescript
import { RecipeAvailabilityCheck } from '@/features/pantry';

function RecipeDetail({ recipe }) {
  return (
    <div>
      <h1>{recipe.name}</h1>
      <RecipeAvailabilityCheck
        recipeName={recipe.name}
        ingredients={recipe.ingredients}
        servings={4}
        onShoppingListGenerated={(items) => {
          console.log('Generated shopping list:', items);
        }}
        onCookRecipe={() => {
          console.log('Recipe cooked successfully!');
        }}
      />
    </div>
  );
}
```

### Analytics Dashboard
```typescript
import { PantryAnalytics } from '@/features/pantry';

function AnalyticsPage() {
  return (
    <PantryAnalytics
      onRecipeSuggestionClick={(suggestion) => {
        // Navigate to recipe search with suggestion
        router.push(`/recipes?search=${encodeURIComponent(suggestion)}`);
      }}
    />
  );
}
```

## Performance Optimizations

### State Management
- Optimistic updates for instant feedback
- Intelligent caching with localStorage
- Batch operations for bulk actions
- Debounced search and filtering

### API Efficiency
- RESTful endpoints with proper HTTP methods
- Pagination for large datasets
- Selective field querying
- Error handling and retry logic

### UI Performance
- Lazy loading for heavy components
- Virtual scrolling for large lists
- Optimized re-renders with React.memo
- Progressive loading states

## Security Considerations

### Data Protection
- Row Level Security (RLS) enforced
- User isolation for all operations
- Input validation and sanitization
- Cost tracking without exposing sensitive data

### API Security
- Authentication required for all endpoints
- User ownership verification
- Rate limiting for expensive operations
- Secure error handling

## Future Enhancements

### Planned Features
- Barcode scanning for easy item addition
- Photo recognition for ingredient identification
- AI-powered recipe suggestions
- Integration with grocery store APIs
- Meal planning automation
- Family sharing and collaboration
- Advanced analytics and reporting

### Technical Improvements
- Offline-first functionality with sync
- Real-time collaboration features
- Advanced caching strategies
- Performance monitoring and optimization
- A/B testing for UX improvements

## Contributing

When contributing to the pantry system:

1. Follow the established TypeScript patterns
2. Add proper type definitions for new features
3. Include error handling and loading states
4. Write tests for utility functions
5. Update this documentation for new features
6. Follow the component composition patterns
7. Ensure accessibility compliance
8. Test on multiple screen sizes

## Dependencies

### Core Dependencies
- React 18+ (UI framework)
- Next.js 15+ (Full-stack framework)
- TypeScript (Type safety)
- Zustand (State management)
- Tailwind CSS (Styling)
- Lucide React (Icons)

### API Dependencies
- Supabase (Database and auth)
- @supabase/auth-helpers-nextjs (Auth integration)

### Development Dependencies
- ESLint (Code linting)
- Prettier (Code formatting)
- TypeScript (Type checking)