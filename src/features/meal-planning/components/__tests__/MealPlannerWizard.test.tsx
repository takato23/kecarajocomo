import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MealPlannerWizard, WizardData } from '../MealPlannerWizard';
import { act } from 'react-dom/test-utils';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MealPlannerWizard', () => {
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the welcome step correctly', () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    expect(screen.getByText('¡Bienvenido al Planificador AI! 🚀')).toBeInTheDocument();
    expect(screen.getByText('Personalizado')).toBeInTheDocument();
    expect(screen.getByText('Inteligente')).toBeInTheDocument();
    expect(screen.getByText('Delicioso')).toBeInTheDocument();
  });

  it('should handle skip button', () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    const skipButton = screen.getByText('Omitir');
    fireEvent.click(skipButton);
    
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('should navigate through steps', async () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Step 0 - Welcome
    expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    
    // Navigate to Step 1
    const nextButton = screen.getByText('Siguiente');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('¿Cuáles son tus preferencias alimentarias? 🥗')).toBeInTheDocument();
    });
    
    // Navigate to Step 2
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('¿Cuánto tiempo tienes para cocinar? ⏰')).toBeInTheDocument();
    });
    
    // Navigate to Step 3
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('¡Perfecto! Todo listo 🎉')).toBeInTheDocument();
    });
  });

  it('should allow navigating back', async () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Navigate to step 1
    const nextButton = screen.getByText('Siguiente');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('¿Cuáles son tus preferencias alimentarias? 🥗')).toBeInTheDocument();
    });
    
    // Navigate back
    const prevButton = screen.getByText('Anterior');
    fireEvent.click(prevButton);
    
    await waitFor(() => {
      expect(screen.getByText('¡Bienvenido al Planificador AI! 🚀')).toBeInTheDocument();
    });
  });

  it('should disable previous button on first step', () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    const prevButton = screen.getByText('Anterior');
    expect(prevButton).toBeDisabled();
  });

  it('should update dietary preferences', async () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Navigate to dietary preferences
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByText('Tipo de dieta')).toBeInTheDocument();
    });
    
    // Select vegetarian diet
    const vegetarianButton = screen.getByText('Vegetariana').closest('button');
    fireEvent.click(vegetarianButton!);
    
    // Should have the selected style
    expect(vegetarianButton).toHaveClass('border-purple-400');
  });

  it('should update allergies selection', async () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Navigate to dietary preferences
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByText('Alergias e intolerancias')).toBeInTheDocument();
    });
    
    // Select gluten allergy
    const glutenButton = screen.getByText('Gluten').closest('button');
    fireEvent.click(glutenButton!);
    
    // Should have the selected style
    expect(glutenButton).toHaveClass('border-red-400/50');
  });

  it('should update cooking skill level', async () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Navigate to cooking preferences (step 2)
    fireEvent.click(screen.getByText('Siguiente'));
    await waitFor(() => screen.getByText('Tipo de dieta'));
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByText('Nivel de habilidad')).toBeInTheDocument();
    });
    
    // Select advanced skill
    const advancedButton = screen.getByText('Avanzado').closest('button');
    fireEvent.click(advancedButton!);
    
    // Should have the selected style
    expect(advancedButton).toHaveClass('border-purple-400');
  });

  it('should update cooking time slider', async () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Navigate to cooking preferences
    fireEvent.click(screen.getByText('Siguiente'));
    await waitFor(() => screen.getByText('Tipo de dieta'));
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByText('Tiempo máximo para cocinar')).toBeInTheDocument();
    });
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '45' } });
    
    expect(screen.getByText('45 min')).toBeInTheDocument();
  });

  it('should complete wizard with collected data', async () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Navigate through all steps
    const nextButton = screen.getByText('Siguiente');
    
    // Step 1 - Select preferences
    fireEvent.click(nextButton);
    await waitFor(() => screen.getByText('Tipo de dieta'));
    
    // Select vegetarian
    fireEvent.click(screen.getByText('Vegetariana').closest('button')!);
    
    // Select gluten allergy
    fireEvent.click(screen.getByText('Gluten').closest('button')!);
    
    // Step 2 - Cooking preferences
    fireEvent.click(nextButton);
    await waitFor(() => screen.getByText('Nivel de habilidad'));
    
    // Step 3 - Summary
    fireEvent.click(nextButton);
    await waitFor(() => screen.getByText('¡Perfecto! Todo listo 🎉'));
    
    // Complete wizard
    const generateButton = screen.getByText('Generar Plan');
    fireEvent.click(generateButton);
    
    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        dietaryPreferences: ['vegetariana'],
        allergies: ['gluten'],
        cookingSkill: 'intermediate',
        budgetLevel: 'medium',
        maxCookingTime: 60
      })
    );
  });

  it('should show summary with selected options', async () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Navigate and make selections
    const nextButton = screen.getByText('Siguiente');
    
    // Step 1
    fireEvent.click(nextButton);
    await waitFor(() => screen.getByText('Tipo de dieta'));
    fireEvent.click(screen.getByText('Vegana').closest('button')!);
    fireEvent.click(screen.getByText('Lactosa').closest('button')!);
    
    // Step 2
    fireEvent.click(nextButton);
    await waitFor(() => screen.getByText('Nivel de habilidad'));
    fireEvent.click(screen.getByText('Principiante').closest('button')!);
    
    // Step 3 - Summary
    fireEvent.click(nextButton);
    await waitFor(() => screen.getByText('Tu configuración:'));
    
    // Check summary displays selections
    expect(screen.getByText('vegana')).toBeInTheDocument();
    expect(screen.getByText('lactosa')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  it('should show progress indicators', () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Check progress bar exists
    const progressBars = screen.getAllByRole('progressbar', { hidden: true });
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should handle cuisine preferences selection', async () => {
    render(<MealPlannerWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    
    // Navigate to dietary preferences
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByText('Cocinas favoritas')).toBeInTheDocument();
    });
    
    // Select multiple cuisines
    fireEvent.click(screen.getByText('Italiana').closest('button')!);
    fireEvent.click(screen.getByText('Japonesa').closest('button')!);
    
    // Navigate to summary
    fireEvent.click(screen.getByText('Siguiente'));
    fireEvent.click(screen.getByText('Siguiente'));
    
    // Complete wizard
    fireEvent.click(screen.getByText('Generar Plan'));
    
    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        cuisinePreferences: expect.arrayContaining(['italiana', 'japonesa'])
      })
    );
  });
});