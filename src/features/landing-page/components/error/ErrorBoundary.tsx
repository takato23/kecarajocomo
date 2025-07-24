import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to external service
    this.logErrorToService(error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to your error tracking service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Example: Send to error tracking service
    // errorTrackingService.logError({
    //   message: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack,
    //   level: this.props.level,
    //   retryCount: this.state.retryCount
    // });
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleAutoRetry = () => {
    if (this.state.retryCount < 3) {
      this.retryTimeoutId = window.setTimeout(() => {
        this.handleRetry();
      }, 2000 * Math.pow(2, this.state.retryCount)); // Exponential backoff
    }
  };

  public componentDidUpdate(prevProps: Props, prevState: State) {
    // Auto-retry for component-level errors
    if (this.state.hasError && !prevState.hasError && this.props.level === 'component') {
      this.handleAutoRetry();
    }
  }

  public componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private renderErrorUI() {
    const { level = 'component', showDetails = false } = this.props;
    const { error, errorInfo, retryCount } = this.state;

    const levelStyles = {
      page: 'min-h-screen flex items-center justify-center bg-gray-50',
      section: 'py-20 px-4 text-center',
      component: 'p-4 rounded-lg border border-red-200 bg-red-50'
    };

    const iconSize = {
      page: 'w-16 h-16',
      section: 'w-12 h-12',
      component: 'w-8 h-8'
    };

    const textSize = {
      page: 'text-2xl',
      section: 'text-xl',
      component: 'text-base'
    };

    return (
      <div className={cn(levelStyles[level])}>
        <div className="max-w-md mx-auto text-center">
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center mb-4"
          >
            <svg 
              className={cn(iconSize[level], 'text-red-500')} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </motion.div>

          {/* Error Title */}
          <h2 className={cn('font-bold text-gray-900 mb-2', textSize[level])}>
            {level === 'page' ? 'Something went wrong' : 'Error loading content'}
          </h2>

          {/* Error Description */}
          <p className="text-gray-600 mb-6">
            {level === 'page' 
              ? 'We apologize for the inconvenience. Please try refreshing the page.'
              : 'This section couldn\'t load properly. You can try again.'
            }
          </p>

          {/* Retry Button */}
          {retryCount < 3 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={this.handleRetry}
              className="bg-gradient-to-r from-lime-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-lime-600 hover:to-purple-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
            >
              Try Again {retryCount > 0 && `(${retryCount}/3)`}
            </motion.button>
          )}

          {/* Contact Support (for page-level errors) */}
          {level === 'page' && (
            <div className="mt-4">
              <a
                href="/support"
                className="text-lime-600 hover:text-lime-700 underline text-sm"
              >
                Contact Support
              </a>
            </div>
          )}

          {/* Error Details (for development) */}
          {showDetails && error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
                <div className="text-red-600 font-semibold">{error.message}</div>
                {errorInfo && (
                  <div className="mt-2 text-gray-600">
                    {errorInfo.componentStack}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundaries for different contexts
export const PageErrorBoundary = ({ children, ...props }: Omit<Props, 'level'>) => (
  <ErrorBoundary level="page" {...props}>
    {children}
  </ErrorBoundary>
);

export const SectionErrorBoundary = ({ children, ...props }: Omit<Props, 'level'>) => (
  <ErrorBoundary level="section" {...props}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary = ({ children, ...props }: Omit<Props, 'level'>) => (
  <ErrorBoundary level="component" {...props}>
    {children}
  </ErrorBoundary>
);

// Error fallback components
export const SimpleErrorFallback = ({ retry }: { retry?: () => void }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="text-gray-600 mb-4">Something went wrong loading this content.</p>
    {retry && (
      <button
        onClick={retry}
        className="text-lime-600 hover:text-lime-700 underline"
      >
        Try again
      </button>
    )}
  </div>
);

export const MinimalErrorFallback = () => (
  <div className="text-center py-4 text-gray-500 text-sm">
    Unable to load content
  </div>
);

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      console.error('Component error:', error);
      // Log to error tracking service
    }
  }, [error]);

  return { error, handleError, clearError };
};