import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingWizard from '@/features/auth/components/OnboardingWizard';

// Mock the onboarding store
jest.mock('@/features/auth/store/onboardingStore', () => ({
  useOnboardingStore: jest.fn(),
}));

// Mock the auth service
jest.mock('@/features/auth/services/authService', () => ({
  completeOnboarding: jest.fn(),
}));

describe('OnboardingWizard', () => {
  const mockUseOnboardingStore = require('@/features/auth/store/onboardingStore').useOnboardingStore;
  const mockCompleteOnboarding = require('@/features/auth/services/authService').completeOnboarding;

  const mockStoreState = {
    currentStep: 0,
    totalSteps: 7,
    isLoading: false,
    userData: {},
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    setUserData: jest.fn(),
    resetOnboarding: jest.fn(),
    completeOnboarding: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue(mockStoreState);
  });

  it('renders welcome step initially', () => {
    render(<OnboardingWizard />);
    
    expect(screen.getByText(/welcome to kecarajocomer/i)).toBeInTheDocument();
    expect(screen.getByText(/let's get your kitchen set up/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('shows step progress indicator', () => {
    render(<OnboardingWizard />);
    
    expect(screen.getByText(/step 1 of 7/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders profile setup step', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 1,
    });
    
    render(<OnboardingWizard />);
    
    expect(screen.getByText(/tell us about yourself/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it('renders dietary preferences step', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 2,
    });
    
    render(<OnboardingWizard />);
    
    expect(screen.getByText(/dietary preferences/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vegetarian/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vegan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gluten-free/i)).toBeInTheDocument();
  });

  it('renders cooking preferences step', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 3,
    });
    
    render(<OnboardingWizard />);
    
    expect(screen.getByText(/cooking preferences/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cooking skill level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred cuisines/i)).toBeInTheDocument();
  });

  it('renders nutrition goals step', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 4,
    });
    
    render(<OnboardingWizard />);
    
    expect(screen.getByText(/nutrition goals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily calories/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/protein goal/i)).toBeInTheDocument();
  });

  it('renders pantry setup step', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 5,
    });
    
    render(<OnboardingWizard />);
    
    expect(screen.getByText(/set up your pantry/i)).toBeInTheDocument();
    expect(screen.getByText(/add your current pantry items/i)).toBeInTheDocument();
  });

  it('renders meal plan preview step', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 6,
    });
    
    render(<OnboardingWizard />);
    
    expect(screen.getByText(/meal plan preview/i)).toBeInTheDocument();
    expect(screen.getByText(/here's your personalized meal plan/i)).toBeInTheDocument();
  });

  it('renders completion step', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 7,
    });
    
    render(<OnboardingWizard />);
    
    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('navigates to next step when next button is clicked', async () => {
    const user = userEvent.setup();
    const mockNextStep = jest.fn();
    
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      nextStep: mockNextStep,
    });
    
    render(<OnboardingWizard />);
    
    const nextButton = screen.getByRole('button', { name: /get started/i });
    await user.click(nextButton);
    
    expect(mockNextStep).toHaveBeenCalledTimes(1);
  });

  it('navigates to previous step when back button is clicked', async () => {
    const user = userEvent.setup();
    const mockPreviousStep = jest.fn();
    
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 2,
      previousStep: mockPreviousStep,
    });
    
    render(<OnboardingWizard />);
    
    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);
    
    expect(mockPreviousStep).toHaveBeenCalledTimes(1);
  });

  it('does not show back button on first step', () => {
    render(<OnboardingWizard />);
    
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  it('shows skip button on optional steps', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 5, // Pantry setup step (optional)
    });
    
    render(<OnboardingWizard />);
    
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  });

  it('saves user data when form is filled', async () => {
    const user = userEvent.setup();
    const mockSetUserData = jest.fn();
    
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 1,
      setUserData: mockSetUserData,
    });
    
    render(<OnboardingWizard />);
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.type(firstNameInput, 'John');
    
    expect(mockSetUserData).toHaveBeenCalledWith({ firstName: 'John' });
  });

  it('shows loading state during completion', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 7,
      isLoading: true,
    });
    
    render(<OnboardingWizard />);
    
    const completeButton = screen.getByRole('button', { name: /completing/i });
    expect(completeButton).toBeDisabled();
  });

  it('completes onboarding when finish button is clicked', async () => {
    const user = userEvent.setup();
    const mockCompleteOnboardingStore = jest.fn();
    
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 7,
      completeOnboarding: mockCompleteOnboardingStore,
    });
    
    mockCompleteOnboarding.mockResolvedValue({ success: true });
    
    render(<OnboardingWizard />);
    
    const completeButton = screen.getByRole('button', { name: /go to dashboard/i });
    await user.click(completeButton);
    
    expect(mockCompleteOnboardingStore).toHaveBeenCalledTimes(1);
  });

  it('handles onboarding completion error', async () => {
    const user = userEvent.setup();
    const mockCompleteOnboardingStore = jest.fn();
    
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 7,
      completeOnboarding: mockCompleteOnboardingStore,
    });
    
    mockCompleteOnboarding.mockRejectedValue(new Error('Completion failed'));
    
    render(<OnboardingWizard />);
    
    const completeButton = screen.getByRole('button', { name: /go to dashboard/i });
    await user.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to complete onboarding/i)).toBeInTheDocument();
    });
  });

  it('shows validation errors when trying to proceed without required fields', async () => {
    const user = userEvent.setup();
    
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 1,
    });
    
    render(<OnboardingWizard />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it('updates progress bar based on current step', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 3,
    });
    
    render(<OnboardingWizard />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '3');
    expect(progressBar).toHaveAttribute('aria-valuemax', '7');
    expect(screen.getByText(/step 3 of 7/i)).toBeInTheDocument();
  });

  it('allows users to go back and modify previous steps', async () => {
    const user = userEvent.setup();
    const mockPreviousStep = jest.fn();
    const mockSetUserData = jest.fn();
    
    mockUseOnboardingStore.mockReturnValue({
      ...mockStoreState,
      currentStep: 2,
      previousStep: mockPreviousStep,
      setUserData: mockSetUserData,
      userData: { firstName: 'John', lastName: 'Doe' },
    });
    
    render(<OnboardingWizard />);
    
    const backButton = screen.getByRole('button', { name: /back/i });
    await user.click(backButton);
    
    expect(mockPreviousStep).toHaveBeenCalledTimes(1);
  });
});