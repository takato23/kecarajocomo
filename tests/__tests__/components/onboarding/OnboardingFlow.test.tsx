import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('OnboardingFlow', () => {
  it('renders first step by default', () => {
    render(<OnboardingFlow />);
    
    expect(screen.getByText('Welcome to Kecarajocomer')).toBeInTheDocument();
    expect(screen.getByText('Your personal AI-powered food assistant')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('shows skip button', () => {
    render(<OnboardingFlow />);
    
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  it('calls onComplete when skip is clicked', () => {
    const handleComplete = jest.fn();
    render(<OnboardingFlow onComplete={handleComplete} />);
    
    fireEvent.click(screen.getByText('Skip'));
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  it('advances to next step when action button is clicked', () => {
    render(<OnboardingFlow />);
    
    // Click "Get Started"
    fireEvent.click(screen.getByText('Get Started'));
    
    // Should show second step
    expect(screen.getByText('Scan your pantry')).toBeInTheDocument();
    expect(screen.getByText('Take photos of your ingredients and let AI identify them')).toBeInTheDocument();
    expect(screen.getByText('Scan Items')).toBeInTheDocument();
  });

  it('shows all four onboarding steps in sequence', () => {
    render(<OnboardingFlow />);
    
    // Step 1
    expect(screen.getByText('Welcome to Kecarajocomer')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Get Started'));
    
    // Step 2
    expect(screen.getByText('Scan your pantry')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Scan Items'));
    
    // Step 3
    expect(screen.getByText('Voice Assistant Cooking Mode')).toBeInTheDocument();
    expect(screen.getByText('Cook hands-free with our AI voice assistant')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Enable Voice'));
    
    // Step 4
    expect(screen.getByText('Gamification Progress')).toBeInTheDocument();
    expect(screen.getByText('Level up your cooking skills and earn rewards')).toBeInTheDocument();
  });

  it('shows gamification features on last step', () => {
    render(<OnboardingFlow />);
    
    // Navigate to last step
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByText('Scan Items'));
    fireEvent.click(screen.getByText('Enable Voice'));
    
    // Check gamification features
    expect(screen.getByText('Level up as you cook')).toBeInTheDocument();
    expect(screen.getByText('Earn XP and rewards')).toBeInTheDocument();
    expect(screen.getByText('Unlock new recipes')).toBeInTheDocument();
    expect(screen.getByText('Track your progress')).toBeInTheDocument();
  });

  it('calls onComplete when finishing last step', () => {
    const handleComplete = jest.fn();
    render(<OnboardingFlow onComplete={handleComplete} />);
    
    // Navigate through all steps
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByText('Scan Items'));
    fireEvent.click(screen.getByText('Enable Voice'));
    fireEvent.click(screen.getByText('Start Journey'));
    
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  it('renders progress dots', () => {
    render(<OnboardingFlow />);
    
    // Should have 4 progress dots (one for each step)
    const progressContainer = document.querySelector('.absolute.top-6.left-1\\/2');
    expect(progressContainer).toBeInTheDocument();
    expect(progressContainer!.children).toHaveLength(4);
  });

  it('updates progress dots as user advances', () => {
    render(<OnboardingFlow />);
    
    const progressContainer = document.querySelector('.absolute.top-6.left-1\\/2');
    const firstDot = progressContainer!.children[0];
    
    // First dot should be active (wider)
    expect(firstDot).toHaveClass('w-8');
    
    // Click to next step
    fireEvent.click(screen.getByText('Get Started'));
    
    // Second dot should now be active
    const secondDot = progressContainer!.children[1];
    expect(secondDot).toHaveClass('w-8');
  });

  it('has correct icons for each step', () => {
    render(<OnboardingFlow />);
    
    // The icon is rendered inside a gradient circle
    let iconContainer = document.querySelector('.bg-gradient-to-br');
    expect(iconContainer).toBeInTheDocument();
    
    // Navigate through steps and verify icons change
    fireEvent.click(screen.getByText('Get Started'));
    iconContainer = document.querySelector('.bg-gradient-to-br');
    expect(iconContainer).toHaveClass('from-purple-500', 'to-pink-500'); // Pantry step color
    
    fireEvent.click(screen.getByText('Scan Items'));
    iconContainer = document.querySelector('.bg-gradient-to-br');
    expect(iconContainer).toHaveClass('from-blue-500', 'to-cyan-500'); // Voice step color
    
    fireEvent.click(screen.getByText('Enable Voice'));
    iconContainer = document.querySelector('.bg-gradient-to-br');
    expect(iconContainer).toHaveClass('from-yellow-500', 'to-orange-500'); // Gamification step color
  });

  it('maintains completed steps state', () => {
    render(<OnboardingFlow />);
    
    // Complete first two steps
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByText('Scan Items'));
    
    // Progress dots should reflect completed state
    const progressContainer = document.querySelector('.absolute.top-6.left-1\\/2');
    const firstDot = progressContainer!.children[0];
    const secondDot = progressContainer!.children[1];
    const thirdDot = progressContainer!.children[2];
    
    expect(firstDot).toHaveClass('bg-white/60'); // Completed
    expect(secondDot).toHaveClass('bg-white/60'); // Completed
    expect(thirdDot).toHaveClass('w-8'); // Current active
  });

  it('has hover effect on action button', () => {
    render(<OnboardingFlow />);
    
    const actionButton = screen.getByText('Get Started').parentElement!;
    expect(actionButton).toHaveClass('hover:shadow-lg');
  });
});