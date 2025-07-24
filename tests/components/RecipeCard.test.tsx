import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import Image from 'next/image';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const mockRecipe = {
  id: '1',
  name: 'Test Recipe',
  description: 'A delicious test recipe',
  image_url: 'https://example.com/image.jpg',
  difficulty: 'easy' as const,
  total_time: 30,
  servings: 4,
  cuisine_types: ['italian', 'mediterranean'],
  meal_types: ['dinner'],
  averageRating: 4.5,
  totalRatings: 10,
  isFavorite: false,
  user_id: 'user123',
  instructions: 'Test instructions',
  prep_time: 10,
  cook_time: 20,
  is_public: true,
  tags: [],
  nutrition_info: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('RecipeCard', () => {
  it('should render recipe information', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('A delicious test recipe')).toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('should display cuisine types', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('italian')).toBeInTheDocument();
    expect(screen.getByText('mediterranean')).toBeInTheDocument();
  });

  it('should show placeholder when no image', () => {
    const recipeWithoutImage = { ...mockRecipe, image_url: null };
    render(<RecipeCard recipe={recipeWithoutImage} />);
    
    expect(screen.getByText('🍽️')).toBeInTheDocument();
  });

  it('should handle favorite toggle', () => {
    const onFavoriteToggle = vi.fn();
    render(
      <RecipeCard 
        recipe={mockRecipe} 
        onFavoriteToggle={onFavoriteToggle} 
      />
    );
    
    const favoriteButton = screen.getByRole('button');
    fireEvent.click(favoriteButton);
    
    expect(onFavoriteToggle).toHaveBeenCalledWith('1');
  });

  it('should show filled heart when recipe is favorite', () => {
    const favoriteRecipe = { ...mockRecipe, isFavorite: true };
    render(<RecipeCard recipe={favoriteRecipe} onFavoriteToggle={vi.fn()} />);
    
    const heartIcon = screen.getByRole('button').querySelector('svg');
    expect(heartIcon).toHaveClass('fill-red-500');
  });

  it('should link to recipe detail page', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href', '/app/recipes/1');
    });
  });

  it('should apply correct difficulty color', () => {
    const { rerender } = render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('easy')).toHaveClass('text-green-600');
    
    rerender(<RecipeCard recipe={{ ...mockRecipe, difficulty: 'medium' }} />);
    expect(screen.getByText('medium')).toHaveClass('text-yellow-600');
    
    rerender(<RecipeCard recipe={{ ...mockRecipe, difficulty: 'hard' }} />);
    expect(screen.getByText('hard')).toHaveClass('text-red-600');
  });
});