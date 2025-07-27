'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorReportingService } from '@/lib/error/ErrorReporting';
import { logger } from '@/services/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showBack?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * Error boundary específico para features/módulos individuales
 * Más liviano que GlobalErrorBoundary y con opciones de recuperación específicas
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `feat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.reportError(error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      await errorReportingService.reportError(error, {
        component: `Feature:${this.props.featureName}`,
        custom: {
          featureName: this.props.featureName,
          componentStack: errorInfo.componentStack,
          retryCount: this.state.retryCount,
          maxRetries: this.maxRetries,
          errorBoundary: 'feature',
          errorId: this.state.errorId,
        },
      });
      
      logger.error(`Error in feature ${this.props.featureName}:`, 'FeatureErrorBoundary', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      });
    } catch (reportingError) {
      logger.error('Failed to report feature error:', 'FeatureErrorBoundary', reportingError);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, úsalo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6 m-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                Error en {this.props.featureName}
              </h3>
              
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Esta funcionalidad no está disponible temporalmente debido a un error técnico.
                {this.state.retryCount > 0 && ` (Intento ${this.state.retryCount}/${this.maxRetries})`}
              </p>

              {/* Error ID para desarrollo */}
              {process.env.NODE_ENV === 'development' && this.state.errorId && (
                <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-3 bg-white dark:bg-gray-900 px-2 py-1 rounded border">
                  ID: {this.state.errorId}
                </p>
              )}

              {/* Error message para desarrollo */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4">
                  <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-200">
                    Ver detalles del error
                  </summary>
                  <pre className="text-xs text-red-700 dark:text-red-300 mt-2 p-2 bg-white dark:bg-gray-900 rounded border overflow-auto max-h-32">
                    {this.state.error.stack || this.state.error.message}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                {this.props.showRetry !== false && this.state.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reintentar
                  </Button>
                )}
                
                {this.props.showBack !== false && (
                  <Button
                    onClick={this.handleBack}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Volver
                  </Button>
                )}
              </div>
              
              {this.state.retryCount >= this.maxRetries && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-3 italic">
                  Se alcanzó el máximo de reintentos. Por favor, recarga la página o contacta a soporte.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC para wrap componentes con FeatureErrorBoundary fácilmente
 */
export function withFeatureErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  featureName: string,
  options: Partial<Props> = {}
) {
  const WrappedComponent = (props: P) => (
    <FeatureErrorBoundary featureName={featureName} {...options}>
      <Component {...props} />
    </FeatureErrorBoundary>
  );

  WrappedComponent.displayName = `withFeatureErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook para reportar errores manualmente desde componentes
 */
export function useErrorReporting(featureName: string) {
  const reportError = React.useCallback(async (error: Error, context?: Record<string, any>) => {
    try {
      await errorReportingService.reportError(error, {
        component: `Feature:${featureName}`,
        custom: {
          featureName,
          manualReport: true,
          ...context,
        },
      });
    } catch (reportingError) {
      logger.error('Failed to report manual error:', 'useErrorReporting', reportingError);
    }
  }, [featureName]);

  return { reportError };
}