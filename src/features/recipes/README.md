# Recipe Management System

A comprehensive recipe management system with AI generation, nutritional analysis, and advanced search capabilities.

## Features

### 📝 Complete Recipe CRUD
- Create, read, update, and delete recipes with rich metadata
- Support for multiple meal types and dietary tags
- Difficulty levels and time tracking
- Public/private recipe visibility

### 🤖 AI Recipe Generation
- **Claude Integration**: Creative recipe generation with Anthropic's Claude
- **Gemini Integration**: Alternative AI provider with Google's Gemini
- Customizable parameters:
  - Cuisine type and meal preferences
  - Dietary restrictions and allergies
  - Available ingredients
  - Time constraints
  - Difficulty level

### 🔍 Advanced Search & Filtering
- Full-text search across titles and descriptions
- Filter by:
  - Cuisine type
  - Meal type (breakfast, lunch, dinner, etc.)
  - Dietary tags (vegan, gluten-free, keto, etc.)
  - Difficulty level
  - Maximum prep/cook time
  - Ingredients (include/exclude)
  - AI-generated status
- Sort by date, title, rating, cook time, or popularity

### 📊 Nutritional Analysis
- Detailed nutritional information per serving
- Macronutrients (calories, protein, carbs, fat)
- Micronutrients (vitamins, minerals)
- Health score calculation
- Visual nutrition badges with color coding

### 👨‍🍳 Cooking Experience
- Start cooking sessions with step-by-step guidance
- Track completed steps
- Timer integration for each step
- Temperature guidance
- Recipe rating after cooking
- Track times cooked

### 📱 Responsive Design
- Grid and list view options
- Mobile-friendly interface
- Drag-and-drop support (when integrated with meal planner)
- Print-friendly recipe format

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, React
- **State Management**: Zustand with devtools
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Tailwind CSS, Custom components
- **AI Integration**: Claude API (Anthropic), Gemini API (Google)
- **Icons**: Lucide React

## Project Structure

```
features/recipes/
├── components/
│   ├── RecipeList.tsx         # Recipe grid/list with pagination
│   ├── RecipeForm.tsx         # Create/edit recipe form
│   ├── RecipeDetail.tsx       # Full recipe view with cooking mode
│   ├── AiRecipeGenerator.tsx  # AI recipe generation interface
│   ├── NutritionBadge.tsx     # Nutritional info display
│   └── IngredientSearchBar.tsx # Advanced search interface
├── store/
│   └── recipeStore.ts         # Zustand store for state management
├── types/
│   └── index.ts               # TypeScript type definitions
├── utils/
│   ├── aiGeneration.ts        # AI recipe generation logic
│   └── supabase.ts            # Supabase client and queries
├── api/
│   ├── generate/
│   │   ├── claude/
│   │   │   └── route.ts       # Claude API endpoint
│   │   └── gemini/
│   │       └── route.ts       # Gemini API endpoint
│   └── nutrition/
│       └── route.ts           # Nutrition analysis endpoint
├── supabase/
│   └── schema.sql             # Database schema
├── page.tsx                   # Main recipe manager page
└── index.ts                   # Module exports
```

## Database Schema

### Core Tables
- `recipes` - Main recipe data with metadata
- `recipe_instructions` - Step-by-step instructions
- `recipe_ingredients` - Recipe-ingredient relationships
- `ingredients` - Ingredient catalog
- `recipe_ratings` - User ratings and reviews
- `cooking_sessions` - Cooking session tracking
- `recipe_collections` - User recipe collections
- `recipe_collection_items` - Collection-recipe relationships

### Enhanced Features
- Full-text search on recipe titles and descriptions
- GIN indexes for array columns (meal_types, dietary_tags)
- Automatic rating calculation via triggers
- Times cooked tracking
- Row Level Security for user data

## Usage

### Basic Implementation

```tsx
import { RecipeManagerPage } from '@/features/recipes';

// In your app
<RecipeManagerPage />
```

### Custom Integration

```tsx
import { 
  RecipeList, 
  RecipeForm, 
  AiRecipeGenerator,
  useRecipeStore 
} from '@/features/recipes';

function CustomRecipeApp() {
  const { recipes, filters, setFilters } = useRecipeStore();
  
  return (
    <>
      <RecipeList 
        onRecipeClick={handleRecipeClick}
        viewMode="grid"
      />
      <AiRecipeGenerator 
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onSave={handleSave}
      />
    </>
  );
}
```

## Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Providers
ANTHROPIC_API_KEY=your_claude_api_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

## AI Recipe Generation

### Claude Integration
- Uses Claude 3 Sonnet model
- Structured JSON responses
- Creative recipe generation with context awareness
- Nutritional estimation

### Gemini Integration
- Uses Gemini Pro model
- Alternative AI provider
- Similar capabilities to Claude
- Different creative approach

### Generation Parameters
- **Prompt**: Free-form description
- **Cuisine Type**: Mexican, Italian, Chinese, etc.
- **Meal Type**: Breakfast, lunch, dinner, etc.
- **Dietary Tags**: Vegan, gluten-free, keto, etc.
- **Available Ingredients**: Use what's in your pantry
- **Time Constraints**: Maximum cooking time
- **Difficulty**: Easy, medium, or hard
- **Style**: Traditional, fusion, healthy, comfort, gourmet

## Nutritional Analysis

The system includes a basic nutritional analysis engine that:
- Estimates nutrition based on ingredients
- Calculates per-serving values
- Provides health warnings (high sodium, calories, etc.)
- Generates a health score (0-100)

For production use, integrate with a professional nutrition API like:
- USDA Food Data Central
- Edamam Nutrition API
- Spoonacular API

## Search & Filtering

Advanced search capabilities:
- **Text Search**: Searches titles and descriptions
- **Ingredient Search**: Include or exclude specific ingredients
- **Multi-Filter**: Combine multiple filter criteria
- **Smart Sorting**: By relevance, date, rating, or cooking time
- **Pagination**: Efficient loading of large recipe collections

## Future Enhancements

- [ ] Image upload and storage
- [ ] Video recipe tutorials
- [ ] Social features (sharing, following)
- [ ] Meal planning integration
- [ ] Shopping list generation from recipes
- [ ] Barcode scanning for ingredients
- [ ] Voice-guided cooking mode
- [ ] Recipe scaling calculator
- [ ] Nutritional goals tracking
- [ ] Recipe version history
- [ ] Community recipe exchange
- [ ] Professional nutrition API integration
- [ ] Multi-language support
- [ ] Offline mode with sync

## Performance Considerations

- Lazy loading of recipe images
- Pagination for large collections
- Debounced search queries
- Optimistic UI updates
- Cached AI responses
- Indexed database queries
- Real-time updates via Supabase subscriptions

## Security

- Row Level Security on all user data
- API key protection
- Input sanitization
- Rate limiting on AI endpoints
- Secure recipe sharing