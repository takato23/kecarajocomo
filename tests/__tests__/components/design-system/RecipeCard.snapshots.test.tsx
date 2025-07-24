import React from 'react';
import { render } from '@testing-library/react';
import { RecipeCard } from '@/components/design-system/RecipeCard';

// Mock the icons module
jest.mock('@/components/design-system/icons', () => ({
  Icons: {
    ChefHat: ({ size, className }: any) => <div data-testid="chef-hat-icon" className={className}>ChefHat</div>,
    Star: ({ size, className }: any) => <div data-testid="star-icon" className={className}>Star</div>,
    Heart: ({ size, className }: any) => <div data-testid="heart-icon" className={className}>Heart</div>,
    Clock: ({ size, className }: any) => <div data-testid="clock-icon" className={className}>Clock</div>,
    Users: ({ size, className }: any) => <div data-testid="users-icon" className={className}>Users</div>,
    Flame: ({ size, className }: any) => <div data-testid="flame-icon" className={className}>Flame</div>,
    Share: ({ size, className }: any) => <div data-testid="share-icon" className={className}>Share</div>,
  },
}));

describe('RecipeCard Snapshots', () => {
  const baseProps = {
    id: 'recipe-1',
    name: 'Delicious Pasta',
    cookTime: 20,
    prepTime: 10,
    servings: 4,
  };

  describe('Basic RecipeCard Variants', () => {
    it('should render default recipe card', () => {
      const { container } = render(<RecipeCard {...baseProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render glass variant recipe card', () => {
      const { container } = render(<RecipeCard {...baseProps} variant="glass" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render compact variant recipe card', () => {
      const { container } = render(<RecipeCard {...baseProps} variant="compact" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('RecipeCard with Content', () => {
    it('should render recipe card with description', () => {
      const { container } = render(
        <RecipeCard
          {...baseProps}
          description="A delicious pasta dish with fresh ingredients and amazing flavors"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with image', () => {
      const { container } = render(
        <RecipeCard
          {...baseProps}
          image="https://example.com/pasta.jpg"
          description="Delicious pasta with tomatoes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card without image (placeholder)', () => {
      const { container } = render(
        <RecipeCard
          {...baseProps}
          description="Delicious pasta with tomatoes"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('RecipeCard Difficulty Levels', () => {
    it('should render easy difficulty recipe card', () => {
      const { container } = render(
        <RecipeCard {...baseProps} difficulty="easy" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render medium difficulty recipe card', () => {
      const { container } = render(
        <RecipeCard {...baseProps} difficulty="medium" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render hard difficulty recipe card', () => {
      const { container } = render(
        <RecipeCard {...baseProps} difficulty="hard" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('RecipeCard with Rating', () => {
    it('should render recipe card with rating 4.5', () => {
      const { container } = render(
        <RecipeCard {...baseProps} rating={4.5} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with rating 3.0', () => {
      const { container } = render(
        <RecipeCard {...baseProps} rating={3.0} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with rating 5.0', () => {
      const { container } = render(
        <RecipeCard {...baseProps} rating={5.0} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('RecipeCard with Tags', () => {
    it('should render recipe card with few tags', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          tags={['vegetarian', 'quick', 'italian']}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with many tags', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          tags={['vegetarian', 'quick', 'italian', 'healthy', 'dinner', 'easy']}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render compact recipe card with tags (should not show)', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          variant="compact"
          tags={['vegetarian', 'quick', 'italian']}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('RecipeCard with Special States', () => {
    it('should render AI generated recipe card', () => {
      const { container } = render(
        <RecipeCard {...baseProps} isAiGenerated={true} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render favorite recipe card', () => {
      const { container } = render(
        <RecipeCard {...baseProps} isFavorite={true} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with calories', () => {
      const { container } = render(
        <RecipeCard {...baseProps} calories={350} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('RecipeCard with Interactions', () => {
    it('should render clickable recipe card', () => {
      const { container } = render(
        <RecipeCard {...baseProps} onClick={() => {}} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with share button', () => {
      const { container } = render(
        <RecipeCard {...baseProps} onShare={() => {}} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with favorite toggle', () => {
      const { container } = render(
        <RecipeCard {...baseProps} onFavoriteToggle={() => {}} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with all interactions', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          onClick={() => {}}
          onShare={() => {}}
          onFavoriteToggle={() => {}}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('RecipeCard Complex Combinations', () => {
    it('should render complete recipe card with all features', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          description="A complete pasta dish with fresh ingredients, perfect for dinner"
          image="https://example.com/pasta.jpg"
          difficulty="medium"
          rating={4.7}
          tags={['vegetarian', 'quick', 'italian', 'healthy']}
          calories={425}
          isAiGenerated={true}
          isFavorite={true}
          onClick={() => {}}
          onShare={() => {}}
          onFavoriteToggle={() => {}}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render glass variant with all features', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          variant="glass"
          description="Glass variant with all features"
          difficulty="hard"
          rating={4.2}
          tags={['gourmet', 'complex']}
          calories={600}
          isAiGenerated={false}
          isFavorite={false}
          onClick={() => {}}
          onShare={() => {}}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render compact variant with minimal features', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          variant="compact"
          difficulty="easy"
          rating={3.8}
          calories={250}
          isAiGenerated={true}
          isFavorite={true}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('RecipeCard Different Time Combinations', () => {
    it('should render recipe card with long cooking time', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          cookTime={120}
          prepTime={30}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with quick cooking time', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          cookTime={5}
          prepTime={5}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with different servings', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          servings={12}
          calories={800}
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('RecipeCard Custom Styling', () => {
    it('should render recipe card with custom className', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          className="custom-recipe-card"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should render recipe card with custom data attributes', () => {
      const { container } = render(
        <RecipeCard 
          {...baseProps}
          data-testid="custom-recipe"
          data-category="pasta"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});