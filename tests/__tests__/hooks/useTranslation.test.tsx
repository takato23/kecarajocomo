import React from 'react';
import { renderHook } from '@testing-library/react';
import { useTranslation } from '@/hooks/useTranslation';
import { NextIntlClientProvider } from 'next-intl';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn((namespace) => {
    const translations: Record<string, any> = {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        loading: 'Loading...',
      },
      recipes: {
        title: 'Recipes',
        create: {
          title: 'Create Recipe',
        },
      },
      plurals: {
        items: {
          one: 'One item',
          other: '{count} items',
        },
      },
    };

    return (key: string, values?: any) => {
      const keys = key.split('.');
      let result = namespace ? translations[namespace] : translations;
      
      for (const k of keys) {
        result = result?.[k];
      }
      
      if (typeof result === 'string' && values) {
        return result.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
      }
      
      return result || key;
    };
  }),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('useTranslation', () => {
  it('returns translation function', () => {
    const { result } = renderHook(() => useTranslation('common'));
    
    expect(result.current.t).toBeDefined();
    expect(result.current.formatMessage).toBeDefined();
    expect(result.current.plural).toBeDefined();
  });

  it('translates simple keys', () => {
    const { result } = renderHook(() => useTranslation('common'));
    
    expect(result.current.t('save')).toBe('Save');
    expect(result.current.t('cancel')).toBe('Cancel');
    expect(result.current.t('loading')).toBe('Loading...');
  });

  it('translates nested keys', () => {
    const { result } = renderHook(() => useTranslation('recipes'));
    
    expect(result.current.t('title')).toBe('Recipes');
    expect(result.current.t('create.title')).toBe('Create Recipe');
  });

  it('formats messages with values', () => {
    const { result } = renderHook(() => useTranslation('plurals'));
    
    expect(result.current.formatMessage('items.other', { count: 5 })).toBe('5 items');
  });

  it('handles pluralization', () => {
    const { result } = renderHook(() => useTranslation('plurals'));
    
    expect(result.current.plural('items', 1)).toBe('One item');
    expect(result.current.plural('items', 5, { count: 5 })).toBe('5 items');
  });

  it('returns key when translation is not found', () => {
    const { result } = renderHook(() => useTranslation('common'));
    
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('works without namespace', () => {
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.t).toBeDefined();
  });
});