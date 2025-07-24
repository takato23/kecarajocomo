import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PantryAnalytics from '@/features/pantry/components/PantryAnalytics';

// Mock the pantry store
jest.mock('@/features/pantry/store/pantryStore', () => ({
  usePantryStore: jest.fn(),
}));

// Mock the Gemini service
jest.mock('@/features/pantry/services/geminiPantryService', () => ({
  analyzeConsumptionPatterns: jest.fn(),
  generateWasteReductionSuggestions: jest.fn(),
}));

describe('PantryAnalytics', () => {
  const mockUsePantryStore = require('@/features/pantry/store/pantryStore').usePantryStore;
  const mockAnalyzeConsumptionPatterns = require('@/features/pantry/services/geminiPantryService').analyzeConsumptionPatterns;
  const mockGenerateWasteReductionSuggestions = require('@/features/pantry/services/geminiPantryService').generateWasteReductionSuggestions;

  const mockAnalytics = {
    totalItems: 25,
    totalValue: 150.50,
    wasteReduction: 15,
    consumptionTrends: [
      { date: '2024-01-01', consumed: 3 },
      { date: '2024-01-02', consumed: 5 },
      { date: '2024-01-03', consumed: 2 },
    ],
    topCategories: [
      { category: 'Vegetables', count: 10 },
      { category: 'Fruits', count: 8 },
      { category: 'Dairy', count: 4 },
    ],
    expirationAnalysis: {
      expired: 2,
      expiringSoon: 3,
      fresh: 20,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePantryStore.mockReturnValue({
      analytics: mockAnalytics,
      isLoading: false,
      fetchAnalytics: jest.fn(),
    });
  });

  it('renders analytics overview cards', () => {
    render(<PantryAnalytics />);
    
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('$150.50')).toBeInTheDocument();
    
    expect(screen.getByText('Waste Reduction')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
  });

  it('renders consumption trends chart', () => {
    render(<PantryAnalytics />);
    
    expect(screen.getByText('Consumption Trends')).toBeInTheDocument();
    expect(screen.getByTestId('consumption-chart')).toBeInTheDocument();
  });

  it('renders top categories chart', () => {
    render(<PantryAnalytics />);
    
    expect(screen.getByText('Top Categories')).toBeInTheDocument();
    expect(screen.getByTestId('categories-chart')).toBeInTheDocument();
    expect(screen.getByText('Vegetables')).toBeInTheDocument();
    expect(screen.getByText('Fruits')).toBeInTheDocument();
  });

  it('renders expiration analysis', () => {
    render(<PantryAnalytics />);
    
    expect(screen.getByText('Expiration Analysis')).toBeInTheDocument();
    expect(screen.getByText('2 Expired')).toBeInTheDocument();
    expect(screen.getByText('3 Expiring Soon')).toBeInTheDocument();
    expect(screen.getByText('20 Fresh')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUsePantryStore.mockReturnValue({
      analytics: null,
      isLoading: true,
      fetchAnalytics: jest.fn(),
    });
    
    render(<PantryAnalytics />);
    
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays empty state when no data', () => {
    mockUsePantryStore.mockReturnValue({
      analytics: null,
      isLoading: false,
      fetchAnalytics: jest.fn(),
    });
    
    render(<PantryAnalytics />);
    
    expect(screen.getByText('No analytics data available')).toBeInTheDocument();
    expect(screen.getByText('Add items to your pantry to see analytics')).toBeInTheDocument();
  });

  it('fetches analytics on mount', () => {
    const mockFetchAnalytics = jest.fn();
    mockUsePantryStore.mockReturnValue({
      analytics: mockAnalytics,
      isLoading: false,
      fetchAnalytics: mockFetchAnalytics,
    });
    
    render(<PantryAnalytics />);
    
    expect(mockFetchAnalytics).toHaveBeenCalledTimes(1);
  });

  it('refreshes analytics when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockFetchAnalytics = jest.fn();
    
    mockUsePantryStore.mockReturnValue({
      analytics: mockAnalytics,
      isLoading: false,
      fetchAnalytics: mockFetchAnalytics,
    });
    
    render(<PantryAnalytics />);
    
    const refreshButton = screen.getByTestId('refresh-analytics');
    await user.click(refreshButton);
    
    expect(mockFetchAnalytics).toHaveBeenCalledTimes(2);
  });

  it('displays AI insights when available', async () => {
    const mockInsights = {
      patterns: ['You consume more vegetables on weekends', 'Dairy products are used frequently'],
      suggestions: ['Buy vegetables in smaller quantities', 'Consider bulk buying for dairy'],
    };
    
    mockAnalyzeConsumptionPatterns.mockResolvedValue(mockInsights.patterns);
    mockGenerateWasteReductionSuggestions.mockResolvedValue(mockInsights.suggestions);
    
    render(<PantryAnalytics />);
    
    const aiInsightsButton = screen.getByText('Generate AI Insights');
    await userEvent.click(aiInsightsButton);
    
    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
      expect(screen.getByText('You consume more vegetables on weekends')).toBeInTheDocument();
      expect(screen.getByText('Buy vegetables in smaller quantities')).toBeInTheDocument();
    });
  });

  it('handles AI insights error', async () => {
    mockAnalyzeConsumptionPatterns.mockRejectedValue(new Error('AI service error'));
    
    render(<PantryAnalytics />);
    
    const aiInsightsButton = screen.getByText('Generate AI Insights');
    await userEvent.click(aiInsightsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to generate AI insights')).toBeInTheDocument();
    });
  });

  it('switches between time periods', async () => {
    const user = userEvent.setup();
    const mockFetchAnalytics = jest.fn();
    
    mockUsePantryStore.mockReturnValue({
      analytics: mockAnalytics,
      isLoading: false,
      fetchAnalytics: mockFetchAnalytics,
    });
    
    render(<PantryAnalytics />);
    
    const timePeriodSelect = screen.getByLabelText('Time Period');
    await user.selectOptions(timePeriodSelect, 'monthly');
    
    expect(mockFetchAnalytics).toHaveBeenCalledWith('monthly');
  });

  it('exports analytics data', async () => {
    const user = userEvent.setup();
    
    // Mock URL.createObjectURL and link click
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    global.URL.revokeObjectURL = jest.fn();
    
    const mockLink = {
      click: jest.fn(),
      href: '',
      download: '',
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    
    render(<PantryAnalytics />);
    
    const exportButton = screen.getByText('Export Data');
    await user.click(exportButton);
    
    expect(mockLink.click).toHaveBeenCalledTimes(1);
    expect(mockLink.download).toBe('pantry-analytics.json');
  });

  it('renders waste reduction tips', () => {
    render(<PantryAnalytics />);
    
    expect(screen.getByText('Waste Reduction Tips')).toBeInTheDocument();
    expect(screen.getByText('Store vegetables properly to extend freshness')).toBeInTheDocument();
    expect(screen.getByText('Use FIFO (First In, First Out) method')).toBeInTheDocument();
  });

  it('shows detailed view when card is clicked', async () => {
    const user = userEvent.setup();
    render(<PantryAnalytics />);
    
    const totalItemsCard = screen.getByTestId('total-items-card');
    await user.click(totalItemsCard);
    
    await waitFor(() => {
      expect(screen.getByText('Item Details')).toBeInTheDocument();
      expect(screen.getByText('Breakdown by category')).toBeInTheDocument();
    });
  });

  it('filters analytics by category', async () => {
    const user = userEvent.setup();
    const mockFetchAnalytics = jest.fn();
    
    mockUsePantryStore.mockReturnValue({
      analytics: mockAnalytics,
      isLoading: false,
      fetchAnalytics: mockFetchAnalytics,
    });
    
    render(<PantryAnalytics />);
    
    const categoryFilter = screen.getByLabelText('Filter by Category');
    await user.selectOptions(categoryFilter, 'vegetables');
    
    expect(mockFetchAnalytics).toHaveBeenCalledWith('weekly', 'vegetables');
  });
});