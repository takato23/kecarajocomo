/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignInForm } from '@/features/auth/components/SignInForm';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock auth service
jest.mock('@/features/auth/services/authService', () => ({
  authService: {
    signIn: jest.fn(),
  },
}));

describe('SignInForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign in form', () => {
    render(<SignInForm />);
    
    expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.sign-in' })).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ success: true });
    jest.mocked(require('@/features/auth/services/authService').authService.signIn).mockImplementation(mockSignIn);

    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText('auth.email');
    const passwordInput = screen.getByLabelText('auth.password');
    const submitButton = screen.getByRole('button', { name: 'auth.sign-in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('validates required fields', async () => {
    render(<SignInForm />);
    
    const submitButton = screen.getByRole('button', { name: 'auth.sign-in' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('auth.validation.email-required')).toBeInTheDocument();
      expect(screen.getByText('auth.validation.password-required')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const mockSignIn = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    jest.mocked(require('@/features/auth/services/authService').authService.signIn).mockImplementation(mockSignIn);

    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText('auth.email');
    const passwordInput = screen.getByLabelText('auth.password');
    const submitButton = screen.getByRole('button', { name: 'auth.sign-in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('auth.signing-in')).toBeInTheDocument();
  });

  it('handles sign in errors', async () => {
    const mockSignIn = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    jest.mocked(require('@/features/auth/services/authService').authService.signIn).mockImplementation(mockSignIn);

    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText('auth.email');
    const passwordInput = screen.getByLabelText('auth.password');
    const submitButton = screen.getByRole('button', { name: 'auth.sign-in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('auth.error.invalid-credentials')).toBeInTheDocument();
    });
  });
});