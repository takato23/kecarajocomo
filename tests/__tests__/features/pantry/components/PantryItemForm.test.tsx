import React from 'react';
import { render, screen, waitFor, within } from '../../../utils/test-utils';
import { PantryItemForm } from '@/features/pantry/components/PantryItemForm';
import { usePantryStore } from '@/features/pantry/store/pantryStore';
import userEvent from '@testing-library/user-event';

// Mock the store
jest.mock('@/features/pantry/store/pantryStore');

const mockUsePantryStore = usePantryStore as jest.MockedFunction<typeof usePantryStore>;

describe('PantryItemForm', () => {
  const mockAddItem = jest.fn();
  const mockUpdateItem = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const defaultStoreState = {
    addItem: mockAddItem,
    updateItem: mockUpdateItem,
    locations: [
      { id: '1', name: 'Custom Location', user_id: 'test-user', temperature_zone: 'pantry' as const },
    ],
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePantryStore.mockReturnValue(defaultStoreState);
    mockAddItem.mockResolvedValue(createMockPantryItem());
  });

  describe('Add Item Mode', () => {
    it('renders add item form correctly', () => {
      render(<PantryItemForm onClose={mockOnClose} />);

      expect(screen.getByText('Add New Item')).toBeInTheDocument();
      expect(screen.getByLabelText(/ingredient name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/unit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    });

    it('handles form submission for new item', async () => {
      const user = userEvent.setup();

      render(
        <PantryItemForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      );

      // Fill in the form
      await user.type(screen.getByLabelText(/ingredient name/i), 'Apples');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '5');
      await user.selectOptions(screen.getByLabelText(/unit/i), 'pieces');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Produce');
      await user.type(screen.getByLabelText(/expiration date/i), '2024-12-31');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /add item/i }));

      await waitFor(() => {
        expect(mockAddItem).toHaveBeenCalledWith({
          ingredient_name: 'Apples',
          quantity: 5,
          unit: 'pieces',
          category: 'Produce',
          expiration_date: '2024-12-31',
          location: '',
          cost: undefined,
          notes: '',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();

      render(<PantryItemForm onClose={mockOnClose} />);

      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: /add item/i }));

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/ingredient name is required/i)).toBeInTheDocument();
      });

      // The form should not have been submitted
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('shows and hides advanced options', async () => {
      const user = userEvent.setup();

      render(<PantryItemForm onClose={mockOnClose} />);

      // Advanced options should be hidden by default
      expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/cost/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/notes/i)).not.toBeInTheDocument();

      // Click to show advanced options
      await user.click(screen.getByRole('button', { name: /show advanced options/i }));

      // Advanced options should now be visible
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cost/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();

      // Custom location should be in the dropdown
      const locationSelect = screen.getByLabelText(/location/i);
      expect(within(locationSelect).getByText('Custom Location')).toBeInTheDocument();
    });

    it('suggests expiration date based on category', async () => {
      const user = userEvent.setup();

      render(<PantryItemForm onClose={mockOnClose} />);

      // Select a category
      await user.selectOptions(screen.getByLabelText(/category/i), 'Produce');

      // The suggest button should appear
      const suggestButton = screen.getByRole('button', { name: /suggest/i });
      expect(suggestButton).toBeInTheDocument();

      // Click suggest
      await user.click(suggestButton);

      // The expiration date field should be populated
      const expirationInput = screen.getByLabelText(/expiration date/i) as HTMLInputElement;
      expect(expirationInput.value).toBeTruthy();
    });
  });

  describe('Edit Item Mode', () => {
    const mockItem = createMockPantryItem({
      id: 'test-id',
      ingredient_name: 'Bananas',
      quantity: 6,
      unit: 'pieces',
      category: 'Produce',
      expiration_date: new Date('2024-12-25'),
      location: 'Counter',
      cost: 3.99,
      notes: 'Organic bananas',
    });

    it('renders edit item form with existing data', () => {
      render(
        <PantryItemForm 
          item={mockItem} 
          onClose={mockOnClose} 
        />
      );

      expect(screen.getByText('Edit Item')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Bananas')).toBeInTheDocument();
      expect(screen.getByDisplayValue('6')).toBeInTheDocument();
      expect(screen.getByDisplayValue('pieces')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Produce')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-12-25')).toBeInTheDocument();
      
      // Advanced options should be shown if item has those fields
      expect(screen.getByDisplayValue('Counter')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3.99')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Organic bananas')).toBeInTheDocument();
    });

    it('handles form submission for updating item', async () => {
      const user = userEvent.setup();

      render(
        <PantryItemForm 
          item={mockItem} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      );

      // Update some fields
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '10');
      await user.clear(screen.getByLabelText(/notes/i));
      await user.type(screen.getByLabelText(/notes/i), 'Updated notes');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /update item/i }));

      await waitFor(() => {
        expect(mockUpdateItem).toHaveBeenCalledWith({
          id: 'test-id',
          ingredient_name: 'Bananas',
          quantity: 10,
          unit: 'pieces',
          category: 'Produce',
          expiration_date: '2024-12-25',
          location: 'Counter',
          cost: 3.99,
          notes: 'Updated notes',
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error messages from the store', () => {
      mockUsePantryStore.mockReturnValue({
        ...defaultStoreState,
        error: 'Failed to save item',
      });

      render(<PantryItemForm onClose={mockOnClose} />);

      expect(screen.getByText('Failed to save item')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      mockAddItem.mockRejectedValue(new Error('Network error'));

      render(<PantryItemForm onClose={mockOnClose} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/ingredient name/i), 'Test Item');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '1');
      await user.selectOptions(screen.getByLabelText(/unit/i), 'pieces');

      await user.click(screen.getByRole('button', { name: /add item/i }));

      // Form should not close on error
      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('closes form when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<PantryItemForm onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes form when X button is clicked', async () => {
      const user = userEvent.setup();

      render(<PantryItemForm onClose={mockOnClose} />);

      await user.click(screen.getByRole('button', { name: /×/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Make the addItem function never resolve
      mockAddItem.mockImplementation(() => new Promise(() => {}));

      render(<PantryItemForm onClose={mockOnClose} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/ingredient name/i), 'Test');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '1');
      await user.selectOptions(screen.getByLabelText(/unit/i), 'pieces');

      await user.click(screen.getByRole('button', { name: /add item/i }));

      // Should show loading state
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('validates cost is not negative', async () => {
      const user = userEvent.setup();

      render(<PantryItemForm onClose={mockOnClose} />);

      // Show advanced options
      await user.click(screen.getByRole('button', { name: /show advanced options/i }));

      // Enter negative cost
      await user.type(screen.getByLabelText(/cost/i), '-10');

      // Fill other required fields
      await user.type(screen.getByLabelText(/ingredient name/i), 'Test');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '1');
      await user.selectOptions(screen.getByLabelText(/unit/i), 'pieces');

      // Try to submit
      await user.click(screen.getByRole('button', { name: /add item/i }));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/cost cannot be negative/i)).toBeInTheDocument();
      });

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('clears errors when user starts typing', async () => {
      const user = userEvent.setup();

      render(<PantryItemForm onClose={mockOnClose} />);

      // Submit without filling required fields to trigger errors
      await user.click(screen.getByRole('button', { name: /add item/i }));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/ingredient name is required/i)).toBeInTheDocument();
      });

      // Start typing in the field
      await user.type(screen.getByLabelText(/ingredient name/i), 'A');

      // Error should disappear
      expect(screen.queryByText(/ingredient name is required/i)).not.toBeInTheDocument();
    });
  });
});