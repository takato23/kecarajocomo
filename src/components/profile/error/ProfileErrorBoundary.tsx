'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, User, Settings, Database, WifiOff, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/services/logger';

import { iOS26LiquidCard } from '@/components/ios26/iOS26LiquidCard';
import { iOS26LiquidButton } from '@/components/ios26/iOS26LiquidButton';
import { cn } from '@/lib/utils';

export interface ProfileErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'profile' | 'section' | 'component';
  showDetails?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  context?: string;
}

interface ProfileErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  showDetails: boolean;
  autoRetryTimeoutId: number | null;
}

/**
 * Specialized error boundary for profile-related components
 * Provides intelligent error categorization and Spanish user messages
 */
export class ProfileErrorBoundary extends Component<ProfileErrorBoundaryProps, ProfileErrorState> {
  private autoRetryTimeoutId: number | null = null;

  public state: ProfileErrorState = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    isRetrying: false,
    showDetails: false,
    autoRetryTimeoutId: null
  };

  public static getDerivedStateFromError(error: Error): Partial<ProfileErrorState> {
    return {
      hasError: true,
      error,
      isRetrying: false
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Report error
    this.reportError(error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for network and temporary errors
    if (this.props.autoRetry && this.shouldAutoRetry(error)) {
      this.scheduleAutoRetry();
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      context: {
        level: this.props.level,
        context: this.props.context,
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString()
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('[ProfileErrorBoundary]', 'ProfileErrorBoundary', errorData);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error monitoring service
      // errorTrackingService.captureException(error, errorData);
    }
  };

  private shouldAutoRetry = (error: Error): boolean => {
    const { retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    if (retryCount >= maxRetries) return false;

    // Network errors are retryable
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return true;
    }

    // Service unavailable errors
    if (error.message.includes('503') || error.message.includes('502')) {
      return true;
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return true;
    }

    return false;
  };

  private scheduleAutoRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Max 10s
    
    this.autoRetryTimeoutId = window.setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    if (this.autoRetryTimeoutId) {
      clearTimeout(this.autoRetryTimeoutId);
      this.autoRetryTimeoutId = null;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: true
    }));

    // Show retry notification
    toast.info('Reintentando cargar perfil...', {
      duration: 2000
    });

    // Reset retrying state after a brief delay
    setTimeout(() => {
      this.setState({ isRetrying: false });
    }, 1000);
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  private categorizeError = (error: Error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        category: 'network',
        icon: WifiOff,
        title: 'Error de Conexión',
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        canRetry: true,
        severity: 'medium'
      };
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return {
        category: 'validation',
        icon: AlertCircle,
        title: 'Error de Validación',
        description: 'Los datos del perfil contienen información inválida. Revisa tu información.',
        canRetry: false,
        severity: 'low'
      };
    }

    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        category: 'auth',
        icon: User,
        title: 'Error de Autenticación',
        description: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        canRetry: false,
        severity: 'high'
      };
    }

    if (message.includes('database') || message.includes('storage') || message.includes('save')) {
      return {
        category: 'storage',
        icon: Database,
        title: 'Error de Almacenamiento',
        description: 'No se pudieron guardar los cambios. Intenta nuevamente en unos minutos.',
        canRetry: true,
        severity: 'medium'
      };
    }

    if (message.includes('quota') || message.includes('limit') || message.includes('rate')) {
      return {
        category: 'quota',
        icon: AlertCircle,
        title: 'Límite Alcanzado',
        description: 'Se ha alcanzado el límite de uso. Intenta nuevamente más tarde.',
        canRetry: true,
        severity: 'medium'
      };
    }

    // Default error
    return {
      category: 'unknown',
      icon: AlertCircle,
      title: 'Error Inesperado',
      description: 'Ocurrió un error inesperado. Nuestro equipo ha sido notificado.',
      canRetry: true,
      severity: 'high'
    };
  };

  private renderErrorUI() {
    const { level = 'component', context } = this.props;
    const { error, errorInfo, retryCount, showDetails, isRetrying } = this.state;
    
    if (!error) return null;

    const errorDetails = this.categorizeError(error);
    const Icon = errorDetails.icon;
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = errorDetails.canRetry && retryCount < maxRetries;

    const levelStyles = {
      profile: 'min-h-[400px] flex items-center justify-center',
      section: 'py-8 px-4',
      component: 'p-4'
    };

    const iconSizes = {
      profile: 'w-16 h-16',
      section: 'w-12 h-12',
      component: 'w-8 h-8'
    };

    const titleSizes = {
      profile: 'text-2xl',
      section: 'text-xl',
      component: 'text-lg'
    };

    const severityColors = {
      low: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
      medium: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
      high: 'from-red-500/20 to-pink-500/20 border-red-500/30',
      critical: 'from-pink-500/20 to-purple-500/20 border-pink-500/30'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(levelStyles[level])}
      >
        <iOS26LiquidCard 
          variant="medium" 
          className={cn(
            'max-w-md mx-auto bg-gradient-to-r',
            severityColors[errorDetails.severity as keyof typeof severityColors] || severityColors.medium
          )}
        >
          <div className="p-6 text-center space-y-6">
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex justify-center"
            >
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                <Icon className={cn(iconSizes[level], 'text-white')} />
              </div>
            </motion.div>

            {/* Error Title */}
            <div className="space-y-2">
              <h3 className={cn('font-bold text-white', titleSizes[level])}>
                {errorDetails.title}
              </h3>
              <p className="text-white/80 text-sm">
                {errorDetails.description}
              </p>
              {context && (
                <p className="text-white/60 text-xs">
                  Contexto: {context}
                </p>
              )}
            </div>

            {/* Retry Information */}
            {retryCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/70 text-xs bg-white/10 rounded-lg p-2"
              >
                Intento {retryCount} de {maxRetries}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {canRetry && (
                <iOS26LiquidButton
                  variant="primary"
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <AnimatePresence mode="wait">
                    {isRetrying ? (
                      <motion.div
                        key="retrying"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Reintentando...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="retry"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                        {retryCount > 0 && ` (${retryCount}/${maxRetries})`}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </iOS26LiquidButton>
              )}

              {/* Toggle Error Details */}
              {(this.props.showDetails || process.env.NODE_ENV === 'development') && (
                <iOS26LiquidButton
                  variant="ghost"
                  size="sm"
                  onClick={this.toggleDetails}
                  className="w-full text-white/70 hover:text-white"
                >
                  {showDetails ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Ocultar Detalles
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </>
                  )}
                </iOS26LiquidButton>
              )}
            </div>

            {/* Error Details */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/10 rounded-lg p-3 text-left overflow-hidden"
                >
                  <div className="text-xs font-mono text-white/90 space-y-2">
                    <div>
                      <strong>Error:</strong> {error.message}
                    </div>
                    <div>
                      <strong>Tipo:</strong> {error.name}
                    </div>
                    <div>
                      <strong>Categoría:</strong> {errorDetails.category}
                    </div>
                    {errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-white/70 hover:text-white">
                          Stack del Componente
                        </summary>
                        <pre className="mt-2 text-xs text-white/60 overflow-auto max-h-32 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recovery Actions */}
            {level === 'profile' && (
              <div className="pt-4 border-t border-white/20">
                <p className="text-white/60 text-xs mb-2">
                  Opciones de recuperación:
                </p>
                <div className="flex gap-2 text-xs">
                  <iOS26LiquidButton
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="flex-1 text-white/70 hover:text-white"
                  >
                    Recargar Página
                  </iOS26LiquidButton>
                  <iOS26LiquidButton
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/'}
                    className="flex-1 text-white/70 hover:text-white"
                  >
                    Ir al Inicio
                  </iOS26LiquidButton>
                </div>
              </div>
            )}
          </div>
        </iOS26LiquidCard>
      </motion.div>
    );
  }

  public componentWillUnmount() {
    if (this.autoRetryTimeoutId) {
      clearTimeout(this.autoRetryTimeoutId);
    }
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
export function withProfileErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ProfileErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ProfileErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ProfileErrorBoundary>
  );

  WrappedComponent.displayName = `withProfileErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundaries for different profile contexts
export const ProfilePageErrorBoundary = ({ children, ...props }: Omit<ProfileErrorBoundaryProps, 'level'>) => (
  <ProfileErrorBoundary level="profile" autoRetry={true} maxRetries={3} {...props}>
    {children}
  </ProfileErrorBoundary>
);

export const ProfileSectionErrorBoundary = ({ children, ...props }: Omit<ProfileErrorBoundaryProps, 'level'>) => (
  <ProfileErrorBoundary level="section" autoRetry={true} maxRetries={2} {...props}>
    {children}
  </ProfileErrorBoundary>
);

export const ProfileComponentErrorBoundary = ({ children, ...props }: Omit<ProfileErrorBoundaryProps, 'level'>) => (
  <ProfileErrorBoundary level="component" autoRetry={false} {...props}>
    {children}
  </ProfileErrorBoundary>
);

// Error fallback components for profile-specific contexts
export const ProfileErrorFallback = ({ retry, context }: { retry?: () => void; context?: string }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Settings className="w-12 h-12 text-gray-400 mb-4" />
    <p className="text-gray-600 mb-4">
      Error cargando {context || 'esta sección del perfil'}
    </p>
    {retry && (
      <iOS26LiquidButton
        variant="secondary"
        onClick={retry}
        className="text-orange-600 hover:text-orange-700"
      >
        Reintentar
      </iOS26LiquidButton>
    )}
  </div>
);

export const MinimalProfileErrorFallback = ({ context }: { context?: string }) => (
  <div className="text-center py-4 text-gray-500 text-sm">
    No se pudo cargar {context || 'el contenido'}
  </div>
);