import { useState, useCallback } from 'react';

type ApiError = {
  error: string;
  status?: number;
};

type UseApiOptions = {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
};

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err: unknown) {
        const apiError: ApiError = {
          error: err.error || err.message || 'An error occurred',
          status: err.status,
        };
        setError(apiError);
        options.onError?.(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
}

// Mutation hook for POST/PUT/DELETE operations
export function useApiMutation<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  
  return {
    ...api,
    mutate: api.execute,
  };
}

// Query hook with automatic execution
export function useApiQuery<T = any>(
  apiCall: () => Promise<T>,
  deps: any[] = [],
  options: UseApiOptions = {}
) {
  const [hasFetched, setHasFetched] = useState(false);
  const api = useApi<T>(options);

  // Execute on mount and when deps change
  useCallback(() => {
    if (!hasFetched) {
      api.execute(apiCall);
      setHasFetched(true);
    }
  }, deps)();

  return {
    ...api,
    refetch: () => api.execute(apiCall),
  };
}