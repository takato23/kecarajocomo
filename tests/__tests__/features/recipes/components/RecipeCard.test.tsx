/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockRecipe = {
  id: '1',
  name: 'Tomato Pasta',
  description: 'Delicious pasta with tomatoes',
  prep_time: 15,
  cook_time: 30,
  servings: 4,
  difficulty: 'medium' as const,
  category: 'main',
  cuisine: 'Italian',
  ingredients: [
    { id: '1', name: 'Pasta', quantity: 200, unit: 'g' },
    { id: '2', name: 'Tomatoes', quantity: 3, unit: 'pcs' },
  ],
  instructions: ['Cook pasta', 'Add tomatoes'],
  image_url: '/test-image.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('RecipeCard Component', () => {
  it('renders recipe information', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('Tomato Pasta')).toBeInTheDocument();
    expect(screen.getByText('Delicious pasta with tomatoes')).toBeInTheDocument();
  });

  it('displays recipe timing information', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('15')).toBeInTheDocument(); // prep time
    expect(screen.getByText('30')).toBeInTheDocument(); // cook time
    expect(screen.getByText('4')).toBeInTheDocument(); // servings
  });

  it('shows difficulty level', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('recipes.difficulty.medium')).toBeInTheDocument();
  });

  it('handles click interaction', () => {
    const mockPush = jest.fn();
    jest.mocked(require('next/navigation').useRouter).mockReturnValue({
      push: mockPush,
    });

    render(<RecipeCard recipe={mockRecipe} />);
    
    const card = screen.getByRole('article');
    fireEvent.click(card);
    
    expect(mockPush).toHaveBeenCalledWith('/recipes/1');
  });

  it('displays recipe image', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    const image = screen.getByAltText('Tomato Pasta');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('handles missing image', () => {
    const recipeWithoutImage = { ...mockRecipe, image_url: null };
    
    render(<RecipeCard recipe={recipeWithoutImage} />);
    
    expect(screen.getByText('recipes.no-image')).toBeInTheDocument();
  });

  it('shows category and cuisine', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('recipes.category.main')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
  });

  it('displays ingredient count', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('recipes.ingredients-count')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});