import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  const mockItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  const mockOnSelect = jest.fn();
  const mockOnEscape = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with no focused item', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems })
    );

    expect(result.current.focusedIndex).toBe(-1);
  });

  it('handles arrow down navigation', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, orientation: 'vertical' })
    );

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);
    });

    expect(result.current.focusedIndex).toBe(0);
  });

  it('handles arrow up navigation', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, orientation: 'vertical' })
    );

    // First go down to index 0
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);
    });

    expect(result.current.focusedIndex).toBe(0);

    // Then go down again to index 1
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);
    });

    expect(result.current.focusedIndex).toBe(1);

    // Then go up
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(event);
    });

    expect(result.current.focusedIndex).toBe(0);
  });

  it('handles horizontal navigation', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, orientation: 'horizontal' })
    );

    // Arrow right
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(event);
    });

    expect(result.current.focusedIndex).toBe(0);

    // Arrow left when at beginning should loop to end
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      document.dispatchEvent(event);
    });

    expect(result.current.focusedIndex).toBe(2);
  });

  it('handles grid navigation', () => {
    const gridItems = Array(9).fill(null).map((_, i) => ({ id: i, name: `Item ${i}` }));
    
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: gridItems, orientation: 'grid', cols: 3 })
    );

    // First arrow down goes from -1 to 0
    act(() => {
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(downEvent);
    });

    expect(result.current.focusedIndex).toBe(0);

    // Second arrow down goes from 0 to 3 (next row)
    act(() => {
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(downEvent);
    });

    expect(result.current.focusedIndex).toBe(3);

    // Go right should go to index 4
    act(() => {
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(rightEvent);
    });

    expect(result.current.focusedIndex).toBe(4);
  });

  it('handles Home and End keys', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems })
    );

    // Home key
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      document.dispatchEvent(event);
    });

    expect(result.current.focusedIndex).toBe(0);

    // End key
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      document.dispatchEvent(event);
    });

    expect(result.current.focusedIndex).toBe(2);
  });

  it('handles Enter key selection', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, onSelect: mockOnSelect })
    );

    // First focus an item
    act(() => {
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(downEvent);
    });

    // Then press Enter
    act(() => {
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);
    });

    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0], 0);
  });

  it('handles Space key selection', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, onSelect: mockOnSelect })
    );

    // First focus an item
    act(() => {
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(downEvent);
    });

    // Then press Space
    act(() => {
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(spaceEvent);
    });

    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0], 0);
  });

  it('handles Escape key', () => {
    renderHook(() =>
      useKeyboardNavigation({ items: mockItems, onEscape: mockOnEscape })
    );

    act(() => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
    });

    expect(mockOnEscape).toHaveBeenCalled();
  });

  it('handles looping when enabled', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, loop: true })
    );

    // Go to end
    act(() => {
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      document.dispatchEvent(endEvent);
    });

    expect(result.current.focusedIndex).toBe(2);

    // Go down should loop to beginning
    act(() => {
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(downEvent);
    });

    expect(result.current.focusedIndex).toBe(0);
  });

  it('does not loop when disabled', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems, loop: false })
    );

    // Go to end
    act(() => {
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      document.dispatchEvent(endEvent);
    });

    expect(result.current.focusedIndex).toBe(2);

    // Go down should stay at end
    act(() => {
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(downEvent);
    });

    expect(result.current.focusedIndex).toBe(2);
  });

  it('provides setItemRef function', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems })
    );

    const mockElement = document.createElement('button');
    const refCallback = result.current.setItemRef(0);
    
    act(() => {
      refCallback(mockElement);
    });

    expect(result.current.itemRefs.current[0]).toBe(mockElement);
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = renderHook(() =>
      useKeyboardNavigation({ items: mockItems })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});