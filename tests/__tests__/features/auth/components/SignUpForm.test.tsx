import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUpForm } from '@/features/auth/components/SignUpForm';

// Mock the auth store
jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('SignUpForm', () => {
  const mockUseAuthStore = require('@/features/auth/store/authStore').useAuthStore;
  const mockSignUp = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      signUp: mockSignUp,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  it('renders sign up form fields', () => {
    render(<SignUpForm />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'weak');
    
    expect(screen.getByText(/strength:/i)).toBeInTheDocument();
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  it('shows password strength as medium for better passwords', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'Password123');
    
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
  });

  it('shows password strength as strong for complex passwords', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'Password123!@#');
    
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('shows password mismatch error', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows checkmark for matching passwords', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    
    // Check for the checkmark icon (green check)
    const checkIcons = document.querySelectorAll('.text-green-500');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('shows terms and conditions checkbox', () => {
    render(<SignUpForm />);
    
    const termsCheckbox = screen.getByRole('checkbox');
    expect(termsCheckbox).toBeInTheDocument();
    expect(screen.getByText(/i agree to the/i)).toBeInTheDocument();
    expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
  });

  it('disables submit button when terms are not accepted', () => {
    render(<SignUpForm />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when password is weak', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const termsCheckbox = screen.getByRole('checkbox');
    
    await user.type(passwordInput, 'weak');
    await user.click(termsCheckbox);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when all conditions are met', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByRole('checkbox');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(termsCheckbox);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeEnabled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ user: { id: 1, email: 'john@example.com' } });
    
    render(<SignUpForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByRole('checkbox');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(termsCheckbox);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        acceptTerms: true
      });
    });
  });

  it('shows loading state during submission', async () => {
    mockUseAuthStore.mockReturnValue({
      signUp: mockSignUp,
      isLoading: true,
      error: null,
      clearError: mockClearError,
    });
    
    render(<SignUpForm />);
    
    const submitButton = screen.getByRole('button', { name: /creating account/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
  });

  it('displays error message', () => {
    mockUseAuthStore.mockReturnValue({
      signUp: mockSignUp,
      isLoading: false,
      error: 'Email already exists',
      clearError: mockClearError,
    });
    
    render(<SignUpForm />);
    
    expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
  });

  it('clears error when form is submitted', async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue({
      signUp: mockSignUp,
      isLoading: false,
      error: 'Previous error',
      clearError: mockClearError,
    });
    
    render(<SignUpForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByRole('checkbox');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(termsCheckbox);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    expect(mockClearError).toHaveBeenCalled();
  });

  it('has link to sign in page', () => {
    render(<SignUpForm />);
    
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/auth/signin');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleButtons = screen.getAllByRole('button', { name: '' });
    
    // Find the password toggle button (should be the first one)
    const passwordToggle = toggleButtons[0];
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('toggles confirm password visibility', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const toggleButtons = screen.getAllByRole('button', { name: '' });
    
    // Find the confirm password toggle button (should be the second one)
    const confirmPasswordToggle = toggleButtons[1];
    
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    
    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    
    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('prevents submission when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByRole('checkbox');
    
    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword!');
    await user.click(termsCheckbox);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });
});