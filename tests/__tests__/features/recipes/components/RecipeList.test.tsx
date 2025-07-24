/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeList } from '@/features/recipes/components/RecipeList';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock RecipeCard component
jest.mock('@/features/recipes/components/RecipeCard', () => ({
  RecipeCard: ({ recipe }: { recipe: any }) => (
    <div data-testid={`recipe-${recipe.id}`}>
      <h3>{recipe.name}</h3>
      <p>{recipe.description}</p>
    </div>
  ),
}));

const mockRecipes = [
  {
    id: '1',
    name: 'Tomato Pasta',
    description: 'Delicious pasta with tomatoes',
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    difficulty: 'medium' as const,
    category: 'main',
    cuisine: 'Italian',
    ingredients: [],
    instructions: [],
    image_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Chicken Salad',
    description: 'Fresh chicken salad',
    prep_time: 10,
    cook_time: 0,
    servings: 2,
    difficulty: 'easy' as const,
    category: 'salad',
    cuisine: 'American',
    ingredients: [],
    instructions: [],
    image_url: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('RecipeList Component', () => {
  it('renders list of recipes', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    expect(screen.getByTestId('recipe-1')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-2')).toBeInTheDocument();
    expect(screen.getByText('Tomato Pasta')).toBeInTheDocument();
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument();
  });

  it('renders empty state when no recipes', () => {
    render(<RecipeList recipes={[]} />);
    
    expect(screen.getByText('recipes.empty.title')).toBeInTheDocument();
    expect(screen.getByText('recipes.empty.description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'recipes.empty.action' })).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<RecipeList recipes={mockRecipes} loading />);
    
    expect(screen.getByText('recipes.loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles error state', () => {
    render(<RecipeList recipes={[]} error="Failed to load recipes" />);
    
    expect(screen.getByText('recipes.error.title')).toBeInTheDocument();
    expect(screen.getByText('Failed to load recipes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'recipes.error.retry' })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const mockOnRetry = jest.fn();
    
    render(<RecipeList recipes={[]} error="Error" onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: 'recipes.error.retry' });
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('applies grid layout class', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const listContainer = screen.getByRole('list');
    expect(listContainer).toHaveClass('grid');
  });

  it('renders recipes in correct order', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const recipeElements = screen.getAllByTestId(/recipe-/);
    expect(recipeElements).toHaveLength(2);
    expect(recipeElements[0]).toHaveAttribute('data-testid', 'recipe-1');
    expect(recipeElements[1]).toHaveAttribute('data-testid', 'recipe-2');
  });

  it('handles single recipe', () => {
    render(<RecipeList recipes={[mockRecipes[0]]} />);
    
    expect(screen.getByTestId('recipe-1')).toBeInTheDocument();
    expect(screen.queryByTestId('recipe-2')).not.toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<RecipeList recipes={mockRecipes} className="custom-recipe-list" />);
    
    const listContainer = screen.getByRole('list');
    expect(listContainer).toHaveClass('custom-recipe-list');
  });

  it('shows loading skeleton when loading', () => {
    render(<RecipeList recipes={[]} loading />);
    
    expect(screen.getByText('recipes.loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('shows appropriate aria labels', () => {
    render(<RecipeList recipes={mockRecipes} />);
    
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-label', 'recipes.list.aria-label');
  });

  it('handles empty recipes array gracefully', () => {
    render(<RecipeList recipes={[]} />);
    
    expect(screen.getByText('recipes.empty.title')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});