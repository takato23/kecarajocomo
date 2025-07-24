import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { CookingAssistant } from '../components/CookingAssistant';
import { useCookingAssistantStore } from '../store/cookingAssistantStore';
import { useRecipeStore } from '../../recipes/store/recipeStore';

// Mock the stores
jest.mock('../store/cookingAssistantStore');
jest.mock('../../recipes/store/recipeStore');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock the components
jest.mock('../components/StepCard', () => ({
  StepCard: ({ step, isActive }: any) => (
    <div data-testid="step-card">
      <div>Step {step.step_number}: {step.instruction}</div>
      {isActive && <div>Active</div>}
    </div>
  ),
}));

jest.mock('../components/TimerPanel', () => ({
  TimerPanel: ({ onClose }: any) => (
    <div data-testid="timer-panel">
      <button onClick={onClose}>Close Timer Panel</button>
    </div>
  ),
}));

jest.mock('../components/MeasurementConverter', () => ({
  MeasurementConverter: ({ onClose }: any) => (
    <div data-testid="measurement-converter">
      <button onClick={onClose}>Close Converter</button>
    </div>
  ),
}));

jest.mock('../components/VoiceControls', () => ({
  VoiceControls: ({ onStartListening, onStopListening }: any) => (
    <div data-testid="voice-controls">
      <button onClick={onStartListening}>Start Listening</button>
      <button onClick={onStopListening}>Stop Listening</button>
    </div>
  ),
}));

jest.mock('../components/NavigationControls', () => ({
  NavigationControls: ({ onNext, onPrevious, onEnd }: any) => (
    <div data-testid="navigation-controls">
      <button onClick={onPrevious}>Previous</button>
      <button onClick={onNext}>Next</button>
      <button onClick={onEnd}>End</button>
    </div>
  ),
}));

jest.mock('../components/ProgressBar', () => ({
  ProgressBar: ({ progress }: any) => (
    <div data-testid="progress-bar">Progress: {progress}%</div>
  ),
}));

jest.mock('../components/InsightPanel', () => ({
  InsightPanel: ({ insights }: any) => (
    <div data-testid="insight-panel">
      {insights.map((insight: any) => (
        <div key={insight.id}>{insight.title}</div>
      ))}
    </div>
  ),
}));

const mockUseCookingAssistantStore = useCookingAssistantStore as jest.MockedFunction<typeof useCookingAssistantStore>;
const mockUseRecipeStore = useRecipeStore as jest.MockedFunction<typeof useRecipeStore>;

describe('CookingAssistant', () => {
  const mockRecipe = {
    id: 'recipe-1',
    title: 'Test Recipe',
    description: 'A test recipe',
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    difficulty: 'easy' as const,
    ingredients: [
      {
        ingredient_id: 'ing-1',
        name: 'flour',
        quantity: 2,
        unit: 'cups',
        optional: false
      }
    ],
    instructions: [
      {
        step_number: 1,
        text: 'Mix ingredients',
        time_minutes: 5
      }
    ],
    nutritional_info: {
      calories: 200,
      protein: 8,
      carbs: 40,
      fat: 2
    }
  };

  const mockCookingStep = {
    id: 'step-1',
    step_number: 1,
    instruction: 'Mix ingredients',
    time_minutes: 5,
    status: 'active' as const
  };

  const defaultStoreState = {
    currentSession: null,
    isSessionActive: false,
    currentStepIndex: 0,
    steps: [mockCookingStep],
    isVoiceEnabled: false,
    isListening: false,
    isSpeaking: false,
    timers: [],
    activeTimers: [],
    insights: [],
    error: null,
    startSession: jest.fn(),
    endSession: jest.fn(),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    speakCurrentStep: jest.fn(),
    startListening: jest.fn(),
    stopListening: jest.fn(),
    clearErrors: jest.fn(),
    cleanup: jest.fn()
  };

  beforeEach(() => {
    mockUseCookingAssistantStore.mockReturnValue(defaultStoreState);
    mockUseRecipeStore.mockReturnValue({
      getRecipeById: jest.fn().mockReturnValue(mockRecipe)
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should render with recipe data', () => {
      render(<CookingAssistant recipeId="recipe-1" />);
      
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument(); // prep_time + cook_time
      expect(screen.getByText('4')).toBeInTheDocument(); // servings
      expect(screen.getByText('easy')).toBeInTheDocument(); // difficulty
    });

    it('should start session on mount', () => {
      const mockStartSession = jest.fn();
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        startSession: mockStartSession
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      expect(mockStartSession).toHaveBeenCalledWith({
        recipe_id: 'recipe-1',
        mode: 'guided',
        voice_enabled: false,
        voice_lang: 'en-US',
        preferences: {}
      });
    });

    it('should cleanup on unmount', () => {
      const mockCleanup = jest.fn();
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        isSessionActive: true,
        cleanup: mockCleanup
      });

      const { unmount } = render(<CookingAssistant recipeId="recipe-1" />);
      unmount();
      
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  describe('recipe not found', () => {
    it('should show error when recipe not found', () => {
      mockUseRecipeStore.mockReturnValue({
        getRecipeById: jest.fn().mockReturnValue(null)
      } as any);

      render(<CookingAssistant recipeId="nonexistent" />);
      
      expect(screen.getByText('Recipe Not Found')).toBeInTheDocument();
      expect(screen.getByText('The selected recipe could not be loaded.')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked in error state', () => {
      const mockOnClose = jest.fn();
      mockUseRecipeStore.mockReturnValue({
        getRecipeById: jest.fn().mockReturnValue(null)
      } as any);

      render(<CookingAssistant recipeId="nonexistent" onClose={mockOnClose} />);
      
      fireEvent.click(screen.getByText('Close'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('progress display', () => {
    it('should show correct progress', () => {
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        currentStepIndex: 0,
        steps: [mockCookingStep, { ...mockCookingStep, id: 'step-2' }]
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      expect(screen.getByText('Progress: 50%')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error messages', () => {
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        error: {
          type: 'voice',
          message: 'Voice recognition failed',
          details: 'Microphone not available',
          timestamp: new Date().toISOString()
        }
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      expect(screen.getByText('Voice recognition failed')).toBeInTheDocument();
      expect(screen.getByText('Microphone not available')).toBeInTheDocument();
    });

    it('should clear errors when dismiss button clicked', () => {
      const mockClearErrors = jest.fn();
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        error: {
          type: 'voice',
          message: 'Voice recognition failed',
          timestamp: new Date().toISOString()
        },
        clearErrors: mockClearErrors
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      const dismissButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(dismissButton);
      
      expect(mockClearErrors).toHaveBeenCalled();
    });
  });

  describe('timer functionality', () => {
    it('should show timer indicator when timers are active', () => {
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        activeTimers: ['timer-1', 'timer-2']
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      expect(screen.getByText('2')).toBeInTheDocument(); // Timer count badge
    });

    it('should toggle timer panel', () => {
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        activeTimers: ['timer-1']
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      // Click timer button
      fireEvent.click(screen.getByRole('button', { name: /timer/i }));
      
      expect(screen.getByTestId('timer-panel')).toBeInTheDocument();
    });
  });

  describe('voice controls', () => {
    it('should show voice controls when voice is enabled', () => {
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        isVoiceEnabled: true
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      expect(screen.getByTestId('voice-controls')).toBeInTheDocument();
    });

    it('should show voice status indicator', () => {
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        isVoiceEnabled: true,
        isListening: true
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      // Should show listening indicator
      expect(screen.getByText(/listening/i)).toBeInTheDocument();
    });

    it('should handle voice control interactions', () => {
      const mockStartListening = jest.fn();
      const mockStopListening = jest.fn();
      
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        isVoiceEnabled: true,
        startListening: mockStartListening,
        stopListening: mockStopListening
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      fireEvent.click(screen.getByText('Start Listening'));
      expect(mockStartListening).toHaveBeenCalled();
      
      fireEvent.click(screen.getByText('Stop Listening'));
      expect(mockStopListening).toHaveBeenCalled();
    });
  });

  describe('navigation controls', () => {
    it('should handle navigation actions', () => {
      const mockNextStep = jest.fn();
      const mockPreviousStep = jest.fn();
      const mockEndSession = jest.fn();
      
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        nextStep: mockNextStep,
        previousStep: mockPreviousStep,
        endSession: mockEndSession
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      fireEvent.click(screen.getByText('Next'));
      expect(mockNextStep).toHaveBeenCalled();
      
      fireEvent.click(screen.getByText('Previous'));
      expect(mockPreviousStep).toHaveBeenCalled();
      
      fireEvent.click(screen.getByText('End'));
      expect(mockEndSession).toHaveBeenCalled();
    });
  });

  describe('measurement converter', () => {
    it('should toggle measurement converter', () => {
      render(<CookingAssistant recipeId="recipe-1" />);
      
      // Click calculator button
      fireEvent.click(screen.getByRole('button', { name: /calculator/i }));
      
      expect(screen.getByTestId('measurement-converter')).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should handle keyboard navigation', () => {
      const mockNextStep = jest.fn();
      const mockPreviousStep = jest.fn();
      
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        nextStep: mockNextStep,
        previousStep: mockPreviousStep
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      // Test right arrow (next)
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(mockNextStep).toHaveBeenCalled();
      
      // Test left arrow (previous)
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      expect(mockPreviousStep).toHaveBeenCalled();
    });

    it('should handle voice keyboard shortcuts', () => {
      const mockStartListening = jest.fn();
      const mockStopListening = jest.fn();
      const mockSpeakCurrentStep = jest.fn();
      
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        isVoiceEnabled: true,
        isListening: false,
        startListening: mockStartListening,
        stopListening: mockStopListening,
        speakCurrentStep: mockSpeakCurrentStep
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      // Test 'v' key for voice toggle
      fireEvent.keyDown(document, { key: 'v' });
      expect(mockStartListening).toHaveBeenCalled();
      
      // Test 'r' key for repeat
      fireEvent.keyDown(document, { key: 'r' });
      expect(mockSpeakCurrentStep).toHaveBeenCalled();
    });

    it('should handle escape key to close', () => {
      const mockOnClose = jest.fn();
      
      render(<CookingAssistant recipeId="recipe-1" onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should ignore shortcuts when typing in input fields', () => {
      const mockNextStep = jest.fn();
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        nextStep: mockNextStep
      });

      render(
        <div>
          <CookingAssistant recipeId="recipe-1" />
          <input data-testid="test-input" />
        </div>
      );
      
      const input = screen.getByTestId('test-input');
      input.focus();
      
      fireEvent.keyDown(input, { key: 'ArrowRight' });
      expect(mockNextStep).not.toHaveBeenCalled();
    });
  });

  describe('step display', () => {
    it('should render current step card', () => {
      render(<CookingAssistant recipeId="recipe-1" />);
      
      expect(screen.getByTestId('step-card')).toBeInTheDocument();
      expect(screen.getByText('Step 1: Mix ingredients')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render step list preview', () => {
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        steps: [
          mockCookingStep,
          { ...mockCookingStep, id: 'step-2', step_number: 2, instruction: 'Bake in oven' }
        ]
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      expect(screen.getByText('Mix ingredients')).toBeInTheDocument();
      expect(screen.getByText('Bake in oven')).toBeInTheDocument();
    });
  });

  describe('insights display', () => {
    it('should render insights when available', () => {
      mockUseCookingAssistantStore.mockReturnValue({
        ...defaultStoreState,
        insights: [
          {
            id: 'insight-1',
            type: 'tip',
            title: 'Cooking Tip',
            message: 'Mix gently to avoid overmixing',
            priority: 'medium',
            dismissible: true
          }
        ]
      });

      render(<CookingAssistant recipeId="recipe-1" />);
      
      expect(screen.getByTestId('insight-panel')).toBeInTheDocument();
      expect(screen.getByText('Cooking Tip')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CookingAssistant recipeId="recipe-1" />);
      
      // Check for important interactive elements
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<CookingAssistant recipeId="recipe-1" />);
      
      // Test tab navigation
      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });
  });
});

describe('CookingAssistant integration', () => {
  it('should handle full cooking workflow', async () => {
    const mockActions = {
      startSession: jest.fn(),
      nextStep: jest.fn(),
      endSession: jest.fn(),
      cleanup: jest.fn()
    };

    mockUseCookingAssistantStore.mockReturnValue({
      ...defaultStoreState,
      ...mockActions,
      isSessionActive: true
    });

    const { unmount } = render(<CookingAssistant recipeId="recipe-1" />);
    
    // Should start session
    expect(mockActions.startSession).toHaveBeenCalled();
    
    // Navigate to next step
    fireEvent.click(screen.getByText('Next'));
    expect(mockActions.nextStep).toHaveBeenCalled();
    
    // End session
    fireEvent.click(screen.getByText('End'));
    expect(mockActions.endSession).toHaveBeenCalled();
    
    // Cleanup on unmount
    unmount();
    expect(mockActions.cleanup).toHaveBeenCalled();
  });
});