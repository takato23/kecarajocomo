import { cn, formatCurrency, formatDate, slugify, truncate, debounce, isValidEmail } from '@/lib/utils';

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('combines class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
      expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
    });

    it('merges tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles arrays', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
    });

    it('handles objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('handles undefined and null values', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      expect(formatCurrency(10)).toBe('$10.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('formats other currencies', () => {
      expect(formatCurrency(10, 'EUR')).toBe('€10.00');
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
    });

    it('handles negative values', () => {
      expect(formatCurrency(-10)).toBe('-$10.00');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });
  });

  describe('formatDate', () => {
    it('formats date with default format', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('formats date with custom format', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-01-15');
      expect(formatDate(date, 'dd/MM/yyyy')).toBe('15/01/2024');
    });

    it('handles string dates', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
    });

    it('handles invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });
  });

  describe('slugify', () => {
    it('converts text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test & Example')).toBe('test-example');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    });

    it('handles special characters', () => {
      expect(slugify('Café Résumé')).toBe('cafe-resume');
      expect(slugify('100% Natural!')).toBe('100-natural');
      expect(slugify('user@example.com')).toBe('userexamplecom');
    });

    it('handles empty strings', () => {
      expect(slugify('')).toBe('');
      expect(slugify('   ')).toBe('');
    });
  });

  describe('truncate', () => {
    it('truncates long text', () => {
      const text = 'This is a very long text that should be truncated';
      expect(truncate(text, 20)).toBe('This is a very long...');
    });

    it('does not truncate short text', () => {
      const text = 'Short text';
      expect(truncate(text, 20)).toBe('Short text');
    });

    it('handles exact length', () => {
      const text = 'Exactly twenty chars';
      expect(truncate(text, 20)).toBe('Exactly twenty chars');
    });

    it('handles custom suffix', () => {
      const text = 'This is a very long text';
      expect(truncate(text, 10, '---')).toBe('This is a---');
    });

    it('handles empty strings', () => {
      expect(truncate('', 10)).toBe('');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('debounces function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('cancels previous timeouts', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test1');
      jest.advanceTimersByTime(50);
      
      debouncedFn('test2');
      jest.advanceTimersByTime(50);
      
      debouncedFn('test3');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('preserves this context', () => {
      const obj = {
        value: 'test',
        method: jest.fn(function() {
          return this.value;
        })
      };

      const debouncedMethod = debounce(obj.method, 100);
      debouncedMethod.call(obj);

      jest.advanceTimersByTime(100);

      expect(obj.method).toHaveBeenCalledTimes(1);
      expect(obj.method.mock.instances[0]).toBe(obj);
    });
  });

  describe('isValidEmail', () => {
    it('validates correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('123@example.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('handles edge cases', () => {
      expect(isValidEmail('a@b.c')).toBe(true);
      expect(isValidEmail('test@localhost')).toBe(false);
      expect(isValidEmail('test@192.168.1.1')).toBe(true);
    });
  });
});