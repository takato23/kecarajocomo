/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/test',
  }),
  usePathname: () => '/test',
}));

describe('LanguageSwitcher Component', () => {
  it('renders language switcher', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows current language', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('opens language menu on click', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('language-switcher.languages.english')).toBeInTheDocument();
  });

  it('displays available languages', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('language-switcher.languages.spanish')).toBeInTheDocument();
    expect(screen.getByText('language-switcher.languages.french')).toBeInTheDocument();
  });

  it('handles language selection', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const spanishOption = screen.getByText('language-switcher.languages.spanish');
    fireEvent.click(spanishOption);
    
    // Should close the menu
    expect(screen.queryByText('language-switcher.languages.spanish')).not.toBeInTheDocument();
  });
});