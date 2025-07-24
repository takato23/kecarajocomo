import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isLoading: true,
      isInitialized: false,
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isInitialized).toBe(false);
  });

  it('should set user', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle sign in', async () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: mockUser, session: {} as any },
      error: null,
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle sign in error', async () => {
    const { result } = renderHook(() => useAuthStore());

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' } as any,
    });

    await expect(
      act(async () => {
        await result.current.signIn('test@example.com', 'wrong-password');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBeNull();
  });

  it('should handle sign out', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Set initial user
    act(() => {
      result.current.setUser({
        id: '123',
        email: 'test@example.com',
      } as any);
    });

    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
      error: null,
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});