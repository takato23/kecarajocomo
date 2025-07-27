import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealSlot } from '../MealSlot';
import { 
  mockAsadoMeal, 
  mockMilanesasMeal, 
  mockNoquisMeal,
  mockMateMeal,
  mockUserPreferences,
  mockAlternativeRecipes 
} from '@/__tests__/mocks/fixtures/argentineMealData';

// Mock glassmorphism components
jest.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children, className, onClick, ...props }: any) => (
    <div className={`glass-card ${className}`} onClick={onClick} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/GlassButton', () => ({
  GlassButton: ({ children, onClick, variant, size, disabled, ...props }: any) => (
    <button 
      className={`glass-button glass-button-${variant} glass-button-${size}`} 
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock drag and drop
jest.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: { 'data-testid': 'draggable' },
    listeners: { onMouseDown: jest.fn() },
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}));

// Mock framer motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock icons
jest.mock('lucide-react', () => ({
  MoreVertical: () => <div data-testid="more-vertical-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  DollarSign: () => <div data-testid="dollar-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Shuffle: () => <div data-testid="shuffle-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Info: () => <div data-testid="info-icon" />,
}));

const defaultProps = {
  meal: mockAsadoMeal,
  dayIndex: 0,
  mealType: 'almuerzo' as const,
  date: '2024-01-15',
  isCurrentDay: false,
  isSpecialDay: false,
  onRegenerate: jest.fn(),
  onGetAlternatives: jest.fn(),
  onLock: jest.fn(),
  onViewDetails: jest.fn(),
  onSwap: jest.fn(),
  preferences: mockUserPreferences,
};

describe('MealSlot Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render meal information correctly', () => {
      render(<MealSlot {...defaultProps} />);

      expect(screen.getByText('Asado Tradicional Argentino')).toBeInTheDocument();
      expect(screen.getByText(/650/)).toBeInTheDocument(); // Calories
      expect(screen.getByText(/\$8,500/)).toBeInTheDocument(); // Cost
      expect(screen.getByText(/6 personas/)).toBeInTheDocument(); // Servings
    });

    it('should render empty slot when no meal provided', () => {
      render(<MealSlot {...defaultProps} meal={null} />);

      expect(screen.getByTestId('empty-meal-slot')).toBeInTheDocument();
      expect(screen.getByText(/agregar comida/i)).toBeInTheDocument();
      expect(screen.getByTestId('add-meal-button')).toBeInTheDocument();
    });

    it('should show locked indicator when meal is locked', () => {
      const lockedMeal = {
        ...mockAsadoMeal,
        locked: true
      };

      render(<MealSlot {...defaultProps} meal={lockedMeal} />);

      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      expect(screen.getByTestId('meal-slot')).toHaveClass('locked');
    });

    it('should apply glassmorphism styling', () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      expect(mealSlot).toHaveClass('glass-card');
    });

    it('should show current day highlight', () => {
      render(<MealSlot {...defaultProps} isCurrentDay={true} />);

      const mealSlot = screen.getByTestId('meal-slot');
      expect(mealSlot).toHaveClass('current-day');
    });

    it('should show special day styling', () => {
      render(<MealSlot {...defaultProps} isSpecialDay={true} />);

      const mealSlot = screen.getByTestId('meal-slot');
      expect(mealSlot).toHaveClass('special-day');
    });
  });

  describe('Cultural Features', () => {
    it('should highlight traditional Argentine meals', () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      expect(mealSlot).toHaveClass('traditional-meal');
      expect(screen.getByTestId('cultural-badge')).toBeInTheDocument();
    });

    it('should show regional indicators', () => {
      render(<MealSlot {...defaultProps} />);

      expect(screen.getByText(/pampa/i)).toBeInTheDocument();
      expect(screen.getByTestId('region-badge')).toHaveClass('region-pampa');
    });

    it('should display mate correctly', () => {
      render(
        <MealSlot 
          {...defaultProps} 
          meal={mockMateMeal} 
          mealType="desayuno" 
        />
      );

      expect(screen.getByText('Mate Tradicional')).toBeInTheDocument();
      expect(screen.getByTestId('mate-badge')).toBeInTheDocument();
      expect(screen.getByTestId('meal-slot')).toHaveClass('mate-meal');
    });

    it('should show Sunday asado styling', () => {
      render(
        <MealSlot 
          {...defaultProps} 
          date="2024-01-21" // Sunday
          isSpecialDay={true}
        />
      );

      const mealSlot = screen.getByTestId('meal-slot');
      expect(mealSlot).toHaveClass('sunday-asado');
      expect(screen.getByTestId('sunday-badge')).toBeInTheDocument();
    });

    it('should highlight ñoquis del 29', () => {
      render(
        <MealSlot 
          {...defaultProps} 
          meal={mockNoquisMeal}
          date="2024-01-29" // 29th
          isSpecialDay={true}
        />
      );

      const mealSlot = screen.getByTestId('meal-slot');
      expect(mealSlot).toHaveClass('noquis-29');
      expect(screen.getByTestId('noquis-badge')).toBeInTheDocument();
      expect(screen.getByText(/tradición del 29/i)).toBeInTheDocument();
    });

    it('should show seasonal indicators', () => {
      render(<MealSlot {...defaultProps} />);

      expect(screen.getByTestId('season-indicator')).toBeInTheDocument();
      expect(screen.getByText(/otono/i)).toBeInTheDocument();
    });
  });

  describe('Context Menu', () => {
    it('should show context menu on right click', async () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.contextMenu(mealSlot);

      await waitFor(() => {
        expect(screen.getByTestId('meal-context-menu')).toBeInTheDocument();
        expect(screen.getByText(/regenerar/i)).toBeInTheDocument();
        expect(screen.getByText(/alternativas/i)).toBeInTheDocument();
        expect(screen.getByText(/bloquear/i)).toBeInTheDocument();
        expect(screen.getByText(/detalles/i)).toBeInTheDocument();
      });
    });

    it('should show context menu on more button click', async () => {
      render(<MealSlot {...defaultProps} />);

      const moreButton = screen.getByTestId('more-options-button');
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByTestId('meal-context-menu')).toBeInTheDocument();
      });
    });

    it('should close context menu on escape', async () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.contextMenu(mealSlot);

      await waitFor(() => {
        expect(screen.getByTestId('meal-context-menu')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('meal-context-menu')).not.toBeInTheDocument();
      });
    });

    it('should handle regenerate action', async () => {
      const mockRegenerate = jest.fn();
      render(<MealSlot {...defaultProps} onRegenerate={mockRegenerate} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.contextMenu(mealSlot);

      const regenerateButton = await screen.findByText(/regenerar/i);
      await user.click(regenerateButton);

      expect(mockRegenerate).toHaveBeenCalledWith('2024-01-15', 'almuerzo');
    });

    it('should handle get alternatives action', async () => {
      const mockGetAlternatives = jest.fn();
      render(<MealSlot {...defaultProps} onGetAlternatives={mockGetAlternatives} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.contextMenu(mealSlot);

      const alternativesButton = await screen.findByText(/alternativas/i);
      await user.click(alternativesButton);

      expect(mockGetAlternatives).toHaveBeenCalledWith(mockAsadoMeal.recipe.id);
    });

    it('should handle lock/unlock action', async () => {
      const mockLock = jest.fn();
      render(<MealSlot {...defaultProps} onLock={mockLock} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.contextMenu(mealSlot);

      const lockButton = await screen.findByText(/bloquear/i);
      await user.click(lockButton);

      expect(mockLock).toHaveBeenCalledWith('2024-01-15', 'almuerzo', true);
    });

    it('should handle view details action', async () => {
      const mockViewDetails = jest.fn();
      render(<MealSlot {...defaultProps} onViewDetails={mockViewDetails} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.contextMenu(mealSlot);

      const detailsButton = await screen.findByText(/detalles/i);
      await user.click(detailsButton);

      expect(mockViewDetails).toHaveBeenCalledWith(mockAsadoMeal);
    });

    it('should show different options for locked meals', async () => {
      const lockedMeal = { ...mockAsadoMeal, locked: true };
      render(<MealSlot {...defaultProps} meal={lockedMeal} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.contextMenu(mealSlot);

      await waitFor(() => {
        expect(screen.getByText(/desbloquear/i)).toBeInTheDocument();
        expect(screen.queryByText(/regenerar/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should be draggable when not locked', () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      expect(mealSlot).toHaveAttribute('data-testid', 'draggable');
      expect(mealSlot).not.toHaveClass('not-draggable');
    });

    it('should not be draggable when locked', () => {
      const lockedMeal = { ...mockAsadoMeal, locked: true };
      render(<MealSlot {...defaultProps} meal={lockedMeal} />);

      const mealSlot = screen.getByTestId('meal-slot');
      expect(mealSlot).toHaveClass('not-draggable');
    });

    it('should show drag preview', () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.dragStart(mealSlot);

      expect(screen.getByTestId('drag-preview')).toBeInTheDocument();
      expect(screen.getByText('Arrastrando: Asado Tradicional Argentino')).toBeInTheDocument();
    });

    it('should handle drop events', async () => {
      const mockSwap = jest.fn();
      render(<MealSlot {...defaultProps} onSwap={mockSwap} />);

      const mealSlot = screen.getByTestId('meal-slot');
      
      // Simulate drag and drop from another slot
      const dragData = {
        meal: mockMilanesasMeal,
        sourceDate: '2024-01-16',
        sourceMealType: 'cena'
      };

      fireEvent.drop(mealSlot, {
        dataTransfer: {
          getData: () => JSON.stringify(dragData)
        }
      });

      expect(mockSwap).toHaveBeenCalledWith(
        '2024-01-15', 'almuerzo',
        '2024-01-16', 'cena'
      );
    });

    it('should show drop indicator when hovering', () => {
      render(<MealSlot {...defaultProps} meal={null} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.dragOver(mealSlot);

      expect(mealSlot).toHaveClass('drop-target');
      expect(screen.getByTestId('drop-indicator')).toBeInTheDocument();
    });

    it('should prevent dropping incompatible meals', () => {
      // Mate should only be in breakfast or merienda
      render(
        <MealSlot 
          {...defaultProps} 
          mealType="almuerzo" 
          meal={null}
        />
      );

      const mealSlot = screen.getByTestId('meal-slot');
      
      const dragData = {
        meal: mockMateMeal,
        sourceDate: '2024-01-16',
        sourceMealType: 'desayuno'
      };

      fireEvent.dragOver(mealSlot, {
        dataTransfer: {
          getData: () => JSON.stringify(dragData)
        }
      });

      expect(mealSlot).toHaveClass('drop-invalid');
      expect(screen.getByText(/no compatible/i)).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('should show detailed nutrition on hover', async () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      await user.hover(mealSlot);

      await waitFor(() => {
        expect(screen.getByTestId('nutrition-tooltip')).toBeInTheDocument();
        expect(screen.getByText(/650 kcal/)).toBeInTheDocument();
        expect(screen.getByText(/45g proteínas/)).toBeInTheDocument();
        expect(screen.getByText(/2g carbohidratos/)).toBeInTheDocument();
        expect(screen.getByText(/50g grasas/)).toBeInTheDocument();
      });
    });

    it('should show cost breakdown on hover', async () => {
      render(<MealSlot {...defaultProps} />);

      const costElement = screen.getByTestId('meal-cost');
      await user.hover(costElement);

      await waitFor(() => {
        expect(screen.getByTestId('cost-tooltip')).toBeInTheDocument();
        expect(screen.getByText(/Total: \$8,500/)).toBeInTheDocument();
        expect(screen.getByText(/Por porción: \$1,417/)).toBeInTheDocument();
      });
    });

    it('should show ingredient list on hover', async () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      await user.hover(mealSlot);

      await waitFor(() => {
        expect(screen.getByTestId('ingredients-tooltip')).toBeInTheDocument();
        expect(screen.getByText(/Vacío/)).toBeInTheDocument();
        expect(screen.getByText(/Chorizo criollo/)).toBeInTheDocument();
        expect(screen.getByText(/Morcilla/)).toBeInTheDocument();
      });
    });

    it('should show cooking time on hover', async () => {
      render(<MealSlot {...defaultProps} />);

      const timeElement = screen.getByTestId('cooking-time');
      await user.hover(timeElement);

      await waitFor(() => {
        expect(screen.getByTestId('time-tooltip')).toBeInTheDocument();
        expect(screen.getByText(/Preparación: 30 min/)).toBeInTheDocument();
        expect(screen.getByText(/Cocción: 120 min/)).toBeInTheDocument();
        expect(screen.getByText(/Total: 150 min/)).toBeInTheDocument();
      });
    });
  });

  describe('Animations', () => {
    it('should animate on meal change', async () => {
      const { rerender } = render(<MealSlot {...defaultProps} />);

      expect(screen.getByText('Asado Tradicional Argentino')).toBeInTheDocument();

      // Change meal
      rerender(<MealSlot {...defaultProps} meal={mockMilanesasMeal} />);

      await waitFor(() => {
        expect(screen.getByTestId('meal-slot')).toHaveClass('animate-fade-in');
        expect(screen.getByText('Milanesas a la Napolitana')).toBeInTheDocument();
      });
    });

    it('should animate loading state', () => {
      render(<MealSlot {...defaultProps} meal={null} isLoading={true} />);

      const loadingElement = screen.getByTestId('meal-slot-loading');
      expect(loadingElement).toHaveClass('animate-pulse');
      expect(loadingElement).toHaveClass('glass-loading');
    });

    it('should animate context menu appearance', async () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.contextMenu(mealSlot);

      await waitFor(() => {
        const contextMenu = screen.getByTestId('meal-context-menu');
        expect(contextMenu).toHaveClass('animate-scale-in');
      });
    });

    it('should animate drag state', () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.dragStart(mealSlot);

      expect(mealSlot).toHaveClass('dragging');
      expect(mealSlot).toHaveClass('animate-scale-down');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      expect(mealSlot).toHaveAttribute('aria-label', 
        'Almuerzo: Asado Tradicional Argentino, 650 calorías, $8,500'
      );
      expect(mealSlot).toHaveAttribute('role', 'gridcell');
    });

    it('should support keyboard navigation', async () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      mealSlot.focus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('meal-context-menu')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('meal-context-menu')).not.toBeInTheDocument();
    });

    it('should announce changes to screen readers', async () => {
      const { rerender } = render(<MealSlot {...defaultProps} />);

      // Change meal
      rerender(<MealSlot {...defaultProps} meal={mockMilanesasMeal} />);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(
          'Comida actualizada: Milanesas a la Napolitana'
        );
      });
    });

    it('should have proper focus indicators', () => {
      render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      mealSlot.focus();

      expect(mealSlot).toHaveClass('focus:ring-2');
      expect(mealSlot).toHaveClass('focus:ring-blue-500');
    });

    it('should provide alternative text for images', () => {
      render(<MealSlot {...defaultProps} />);

      const mealImage = screen.getByTestId('meal-image');
      expect(mealImage).toHaveAttribute('alt', 'Asado Tradicional Argentino');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing meal data gracefully', () => {
      const incompleteMeal = {
        recipe: { ...mockAsadoMeal.recipe, nutrition: undefined },
        servings: mockAsadoMeal.servings,
        cost: mockAsadoMeal.cost,
        nutrition: undefined
      };

      render(<MealSlot {...defaultProps} meal={incompleteMeal as any} />);

      expect(screen.getByText('Asado Tradicional Argentino')).toBeInTheDocument();
      expect(screen.getByText(/información nutricional no disponible/i)).toBeInTheDocument();
    });

    it('should handle image loading errors', () => {
      render(<MealSlot {...defaultProps} />);

      const mealImage = screen.getByTestId('meal-image');
      fireEvent.error(mealImage);

      expect(screen.getByTestId('default-meal-image')).toBeInTheDocument();
    });

    it('should show error state for failed actions', async () => {
      const mockRegenerate = jest.fn().mockRejectedValue(new Error('API Error'));
      render(<MealSlot {...defaultProps} onRegenerate={mockRegenerate} />);

      const mealSlot = screen.getByTestId('meal-slot');
      fireEvent.contextMenu(mealSlot);

      const regenerateButton = await screen.findByText(/regenerar/i);
      await user.click(regenerateButton);

      await waitFor(() => {
        expect(screen.getByText(/error al regenerar/i)).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should memoize expensive calculations', () => {
      const { rerender } = render(<MealSlot {...defaultProps} />);

      const initialNutritionElement = screen.getByTestId('nutrition-summary');
      
      // Re-render with same props
      rerender(<MealSlot {...defaultProps} />);
      
      const newNutritionElement = screen.getByTestId('nutrition-summary');
      
      // Should be the same reference (memoized)
      expect(initialNutritionElement).toBe(newNutritionElement);
    });

    it('should lazy load non-critical data', async () => {
      render(<MealSlot {...defaultProps} />);

      // Ingredients should load lazily on hover
      expect(screen.queryByTestId('ingredients-tooltip')).not.toBeInTheDocument();

      const mealSlot = screen.getByTestId('meal-slot');
      await user.hover(mealSlot);

      await waitFor(() => {
        expect(screen.getByTestId('ingredients-tooltip')).toBeInTheDocument();
      });
    });

    it('should debounce hover events', async () => {
      jest.useFakeTimers();
      
      const { rerender } = render(<MealSlot {...defaultProps} />);

      const mealSlot = screen.getByTestId('meal-slot');
      
      // Rapid hover events
      fireEvent.mouseEnter(mealSlot);
      fireEvent.mouseLeave(mealSlot);
      fireEvent.mouseEnter(mealSlot);

      jest.advanceTimersByTime(300);

      // Should only show tooltip once
      expect(screen.getByTestId('nutrition-tooltip')).toBeInTheDocument();

      jest.useRealTimers();
    });
  });
});