/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeForm } from '@/features/recipes/components/RecipeForm';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock recipe service
jest.mock('@/features/recipes/services/recipeService', () => ({
  recipeService: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

describe('RecipeForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty form for new recipe', () => {
    render(<RecipeForm />);
    
    expect(screen.getByLabelText('recipes.form.name')).toBeInTheDocument();
    expect(screen.getByLabelText('recipes.form.description')).toBeInTheDocument();
    expect(screen.getByLabelText('recipes.form.prep-time')).toBeInTheDocument();
    expect(screen.getByLabelText('recipes.form.cook-time')).toBeInTheDocument();
    expect(screen.getByLabelText('recipes.form.servings')).toBeInTheDocument();
    expect(screen.getByLabelText('recipes.form.difficulty')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<RecipeForm />);
    
    const submitButton = screen.getByRole('button', { name: 'recipes.form.submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('recipes.form.validation.name-required')).toBeInTheDocument();
      expect(screen.getByText('recipes.form.validation.description-required')).toBeInTheDocument();
    });
  });

  it('handles form submission', async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: '1' });
    jest.mocked(require('@/features/recipes/services/recipeService').recipeService.create).mockImplementation(mockCreate);

    render(<RecipeForm />);
    
    const nameInput = screen.getByLabelText('recipes.form.name');
    const descriptionInput = screen.getByLabelText('recipes.form.description');
    const prepTimeInput = screen.getByLabelText('recipes.form.prep-time');
    const cookTimeInput = screen.getByLabelText('recipes.form.cook-time');
    const servingsInput = screen.getByLabelText('recipes.form.servings');
    const submitButton = screen.getByRole('button', { name: 'recipes.form.submit' });

    fireEvent.change(nameInput, { target: { value: 'Test Recipe' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.change(prepTimeInput, { target: { value: '15' } });
    fireEvent.change(cookTimeInput, { target: { value: '30' } });
    fireEvent.change(servingsInput, { target: { value: '4' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Test Recipe',
        description: 'Test Description',
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        difficulty: 'medium',
        category: 'main',
        ingredients: [],
        instructions: [],
      });
    });
  });

  it('handles ingredient addition', () => {
    render(<RecipeForm />);
    
    const addIngredientButton = screen.getByRole('button', { name: 'recipes.form.add-ingredient' });
    fireEvent.click(addIngredientButton);

    expect(screen.getByLabelText('recipes.form.ingredient-name')).toBeInTheDocument();
    expect(screen.getByLabelText('recipes.form.ingredient-quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('recipes.form.ingredient-unit')).toBeInTheDocument();
  });

  it('handles instruction addition', () => {
    render(<RecipeForm />);
    
    const addInstructionButton = screen.getByRole('button', { name: 'recipes.form.add-instruction' });
    fireEvent.click(addInstructionButton);

    expect(screen.getByLabelText('recipes.form.instruction-1')).toBeInTheDocument();
  });

  it('populates form with existing recipe data', () => {
    const existingRecipe = {
      id: '1',
      name: 'Existing Recipe',
      description: 'Existing Description',
      prep_time: 10,
      cook_time: 20,
      servings: 2,
      difficulty: 'easy' as const,
      category: 'appetizer',
      cuisine: 'Mexican',
      ingredients: [
        { id: '1', name: 'Ingredient 1', quantity: 100, unit: 'g' },
      ],
      instructions: ['Step 1', 'Step 2'],
      image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    render(<RecipeForm recipe={existingRecipe} />);
    
    expect(screen.getByDisplayValue('Existing Recipe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('handles form submission errors', async () => {
    const mockCreate = jest.fn().mockRejectedValue(new Error('Server error'));
    jest.mocked(require('@/features/recipes/services/recipeService').recipeService.create).mockImplementation(mockCreate);

    render(<RecipeForm />);
    
    const nameInput = screen.getByLabelText('recipes.form.name');
    const descriptionInput = screen.getByLabelText('recipes.form.description');
    const submitButton = screen.getByRole('button', { name: 'recipes.form.submit' });

    fireEvent.change(nameInput, { target: { value: 'Test Recipe' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('recipes.form.error.save-failed')).toBeInTheDocument();
    });
  });
});