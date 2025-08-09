'use client';

import React from 'react';
import { logger } from '@/services/logger';
import { errorReportingService } from '@/lib/error/ErrorReporting';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  isReporting: boolean;
  reportSuccess: boolean;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      reportSuccess: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
      isReporting: false,
      reportSuccess: false,
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Global error caught:', 'GlobalErrorBoundary', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    this.setState({
      error,
      errorInfo,
      isReporting: true,
    });

    // Report error to monitoring services
    try {
      await errorReportingService.reportError(error, {
        component: 'GlobalErrorBoundary',
        custom: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
          errorId: this.state.errorId,
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
        },
      });
      
      this.setState({
        isReporting: false,
        reportSuccess: true,
      });
    } catch (reportingError) {
      logger.error('Failed to report error:', 'GlobalErrorBoundary', reportingError);
      this.setState({
        isReporting: false,
        reportSuccess: false,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      reportSuccess: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          errorId={this.state.errorId}
          isReporting={this.state.isReporting}
          reportSuccess={this.state.reportSuccess}
          onReset={this.handleReset} 
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorId: string | null;
  isReporting: boolean;
  reportSuccess: boolean;
  onReset: () => void;
}

function ErrorFallback({ error, errorId, isReporting, reportSuccess, onReset }: ErrorFallbackProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  const copyErrorId = async () => {
    if (errorId) {
      try {
        await navigator.clipboard.writeText(errorId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        logger.warn('Failed to copy error ID:', 'ErrorFallback', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Oops! Algo salió mal
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado automáticamente.
          </p>

          {/* Error ID and Status */}
          {errorId && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID del Error:
                </span>
                <div className="flex items-center gap-2">
                  {isReporting ? (
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
                      <span className="text-xs">Reportando...</span>
                    </div>
                  ) : reportSuccess ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Reportado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <Bug className="w-4 h-4" />
                      <span className="text-xs">No reportado</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded border text-gray-800 dark:text-gray-200">
                  {errorId}
                </code>
                <Button
                  onClick={copyErrorId}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error details (development only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                {error.toString()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onReset}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ir al inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}