/**
 * Enhanced Loading Components
 * Provides sophisticated loading states with progress tracking and user feedback
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  ChefHat, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Search,
  Utensils,
  ShoppingCart,
  BookOpen
} from 'lucide-react';

export interface LoadingStage {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: React.ElementType;
  readonly estimatedDuration: number; // in milliseconds
  readonly progress: number; // 0-100
  readonly status: 'pending' | 'active' | 'completed' | 'error';
  readonly details?: string;
}

export interface LoadingState {
  readonly isLoading: boolean;
  readonly stages: ReadonlyArray<LoadingStage>;
  readonly currentStage: number;
  readonly overallProgress: number;
  readonly timeElapsed: number;
  readonly estimatedTimeRemaining: number;
  readonly message: string;
  readonly canCancel: boolean;
  readonly error?: string;
}

interface EnhancedLoadingProps {
  loadingState: LoadingState;
  onCancel?: () => void;
  className?: string;
  variant?: 'modal' | 'inline' | 'fullscreen';
  theme?: 'light' | 'dark';
}

/**
 * Enhanced Loading Component with multi-stage progress tracking
 */
export function EnhancedLoading({
  loadingState,
  onCancel,
  className = '',
  variant = 'modal',
  theme = 'light'
}: EnhancedLoadingProps) {
  const [mounted, setMounted] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loadingState.currentStage !== undefined) {
      setAnimationKey(prev => prev + 1);
    }
  }, [loadingState.currentStage]);

  if (!mounted || !loadingState.isLoading) return null;

  const currentStage = loadingState.stages[loadingState.currentStage];
  const completedStages = loadingState.stages.filter(stage => stage.status === 'completed').length;
  const totalStages = loadingState.stages.length;

  const baseClasses = {
    modal: 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50',
    inline: 'w-full p-6 bg-white rounded-lg shadow-lg border',
    fullscreen: 'fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center z-50'
  };

  const contentClasses = {
    modal: 'bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-8',
    inline: 'w-full',
    fullscreen: 'max-w-2xl w-full mx-4'
  };

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-white'
  };

  return (
    <div className={`${baseClasses[variant]} ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`${contentClasses[variant]} ${themeClasses[theme]}`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            key={animationKey}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            {currentStage ? (
              <currentStage.icon className="w-10 h-10 text-white" />
            ) : (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            )}
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-2">
            {currentStage ? currentStage.name : 'Procesando...'}
          </h2>
          
          <p className="text-gray-600 text-sm">
            {currentStage ? currentStage.description : loadingState.message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progreso General
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(loadingState.overallProgress)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${loadingState.overallProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>
              Etapa {loadingState.currentStage + 1} de {totalStages}
            </span>
            <span>
              {loadingState.estimatedTimeRemaining > 0 && (
                <>
                  {Math.round(loadingState.estimatedTimeRemaining / 1000)}s restantes
                </>
              )}
            </span>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="mb-8">
          <div className="space-y-3">
            {loadingState.stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                  stage.status === 'completed' 
                    ? 'border-green-200 bg-green-50' 
                    : stage.status === 'active'
                    ? 'border-blue-200 bg-blue-50'
                    : stage.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0 mr-3">
                  {stage.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : stage.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : stage.status === 'active' ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      stage.status === 'completed' ? 'text-green-800' :
                      stage.status === 'active' ? 'text-blue-800' :
                      stage.status === 'error' ? 'text-red-800' :
                      'text-gray-600'
                    }`}>
                      {stage.name}
                    </h4>
                    
                    {stage.status === 'active' && (
                      <span className="text-xs text-blue-600 font-medium">
                        {stage.progress}%
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-xs mt-1 ${
                    stage.status === 'completed' ? 'text-green-600' :
                    stage.status === 'active' ? 'text-blue-600' :
                    stage.status === 'error' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {stage.details || stage.description}
                  </p>
                  
                  {stage.status === 'active' && stage.progress > 0 && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <motion.div
                        className="h-1 bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Error State */}
        {loadingState.error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{loadingState.error}</p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          {loadingState.canCancel && onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          
          {loadingState.error && (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Intentar Nuevamente
            </button>
          )}
        </div>

        {/* Fun Facts or Tips */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <Sparkles className="w-4 h-4 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">¿Sabías que?</span>
          </div>
          <p className="text-xs text-gray-600">
            {getFunFact(currentStage?.id || 'default')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Loading Hook for managing loading states
 */
export function useEnhancedLoading(initialStages: LoadingStage[]) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    stages: initialStages,
    currentStage: 0,
    overallProgress: 0,
    timeElapsed: 0,
    estimatedTimeRemaining: 0,
    message: '',
    canCancel: false
  });

  const [startTime, setStartTime] = useState<number>(0);
  const [stageStartTime, setStageStartTime] = useState<number>(0);

  const startLoading = useCallback((message: string = 'Procesando...', canCancel: boolean = false) => {
    const now = Date.now();
    setStartTime(now);
    setStageStartTime(now);
    
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      currentStage: 0,
      overallProgress: 0,
      timeElapsed: 0,
      estimatedTimeRemaining: prev.stages.reduce((total, stage) => total + stage.estimatedDuration, 0),
      message,
      canCancel,
      error: undefined,
      stages: prev.stages.map((stage, index) => ({
        ...stage,
        status: index === 0 ? 'active' : 'pending',
        progress: 0
      }))
    }));
  }, []);

  const updateStageProgress = useCallback((stageId: string, progress: number, details?: string) => {
    setLoadingState(prev => ({
      ...prev,
      stages: prev.stages.map(stage => 
        stage.id === stageId 
          ? { ...stage, progress: Math.min(100, Math.max(0, progress)), details }
          : stage
      )
    }));
  }, []);

  const completeStage = useCallback((stageId: string) => {
    setLoadingState(prev => {
      const stageIndex = prev.stages.findIndex(stage => stage.id === stageId);
      const nextStageIndex = stageIndex + 1;
      
      const updatedStages = prev.stages.map((stage, index) => ({
        ...stage,
        status: index === stageIndex ? 'completed' as const :
                index === nextStageIndex ? 'active' as const :
                stage.status
      }));

      const completedStages = updatedStages.filter(stage => stage.status === 'completed').length;
      const totalStages = updatedStages.length;
      const overallProgress = (completedStages / totalStages) * 100;

      return {
        ...prev,
        stages: updatedStages,
        currentStage: nextStageIndex < totalStages ? nextStageIndex : prev.currentStage,
        overallProgress
      };
    });
  }, []);

  const setError = useCallback((error: string, stageId?: string) => {
    setLoadingState(prev => ({
      ...prev,
      error,
      stages: stageId ? prev.stages.map(stage => 
        stage.id === stageId 
          ? { ...stage, status: 'error' as const }
          : stage
      ) : prev.stages
    }));
  }, []);

  const finishLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      overallProgress: 100,
      stages: prev.stages.map(stage => ({ ...stage, status: 'completed' as const }))
    }));
  }, []);

  const cancelLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      error: 'Operación cancelada por el usuario'
    }));
  }, []);

  // Update time tracking
  useEffect(() => {
    if (!loadingState.isLoading) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const totalEstimated = loadingState.stages.reduce((total, stage) => total + stage.estimatedDuration, 0);
      const remaining = Math.max(0, totalEstimated - elapsed);

      setLoadingState(prev => ({
        ...prev,
        timeElapsed: elapsed,
        estimatedTimeRemaining: remaining
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [loadingState.isLoading, startTime]);

  return {
    loadingState,
    startLoading,
    updateStageProgress,
    completeStage,
    setError,
    finishLoading,
    cancelLoading
  };
}

/**
 * Predefined loading stages for common operations
 */
export const LOADING_STAGES = {
  MEAL_PLANNING: [
    {
      id: 'validation',
      name: 'Validando Preferencias',
      description: 'Verificando restricciones dietarias y alergias',
      icon: CheckCircle,
      estimatedDuration: 2000,
      progress: 0,
      status: 'pending' as const
    },
    {
      id: 'analysis',
      name: 'Analizando Despensa',
      description: 'Revisando ingredientes disponibles',
      icon: Search,
      estimatedDuration: 3000,
      progress: 0,
      status: 'pending' as const
    },
    {
      id: 'generation',
      name: 'Generando Plan',
      description: 'Creando plan personalizado con IA',
      icon: Brain,
      estimatedDuration: 15000,
      progress: 0,
      status: 'pending' as const
    },
    {
      id: 'optimization',
      name: 'Optimizando Presupuesto',
      description: 'Ajustando costos y sugerencias',
      icon: ShoppingCart,
      estimatedDuration: 4000,
      progress: 0,
      status: 'pending' as const
    },
    {
      id: 'finalization',
      name: 'Finalizando',
      description: 'Preparando plan final',
      icon: Utensils,
      estimatedDuration: 2000,
      progress: 0,
      status: 'pending' as const
    }
  ],

  RECIPE_GENERATION: [
    {
      id: 'ingredients',
      name: 'Analizando Ingredientes',
      description: 'Identificando combinaciones óptimas',
      icon: Search,
      estimatedDuration: 3000,
      progress: 0,
      status: 'pending' as const
    },
    {
      id: 'creation',
      name: 'Creando Receta',
      description: 'Generando instrucciones detalladas',
      icon: ChefHat,
      estimatedDuration: 8000,
      progress: 0,
      status: 'pending' as const
    },
    {
      id: 'nutrition',
      name: 'Calculando Nutrición',
      description: 'Analizando valores nutricionales',
      icon: BookOpen,
      estimatedDuration: 2000,
      progress: 0,
      status: 'pending' as const
    },
    {
      id: 'validation',
      name: 'Validando Receta',
      description: 'Verificando calidad y coherencia',
      icon: CheckCircle,
      estimatedDuration: 2000,
      progress: 0,
      status: 'pending' as const
    }
  ],

  OCR_PROCESSING: [
    {
      id: 'scanning',
      name: 'Procesando Imagen',
      description: 'Analizando ticket de compra',
      icon: Search,
      estimatedDuration: 5000,
      progress: 0,
      status: 'pending' as const
    },
    {
      id: 'extraction',
      name: 'Extrayendo Datos',
      description: 'Identificando productos alimentarios',
      icon: Brain,
      estimatedDuration: 8000,
      progress: 0,
      status: 'pending' as const
    },
    {
      id: 'validation',
      name: 'Validando Items',
      description: 'Verificando precios y categorías',
      icon: CheckCircle,
      estimatedDuration: 3000,
      progress: 0,
      status: 'pending' as const
    }
  ]
};

/**
 * Get fun facts based on current stage
 */
function getFunFact(stageId: string): string {
  const facts = {
    validation: 'La validación nutricional puede prevenir deficiencias alimentarias en un 85% de los casos.',
    analysis: 'Un análisis inteligente de despensa puede reducir el desperdicio de alimentos hasta un 40%.',
    generation: 'Nuestro sistema de IA considera más de 50 factores para crear tu plan personalizado.',
    optimization: 'La optimización de presupuesto puede ahorrarte hasta $500 pesos por semana.',
    finalization: 'Los planes personalizados aumentan la adherencia a dietas saludables en un 70%.',
    ingredients: 'Existen más de 2,000 combinaciones posibles de ingredientes argentinos comunes.',
    creation: 'Una receta bien estructurada puede mejorar el resultado final en un 60%.',
    nutrition: 'El análisis nutricional preciso ayuda a alcanzar objetivos de salud más rápidamente.',
    scanning: 'El OCR puede identificar productos con una precisión del 95% en tickets argentinos.',
    extraction: 'Procesamos más de 100 categorías de productos alimentarios diferentes.',
    default: 'Los planes de comida personalizados pueden ahorrarte hasta 5 horas por semana.'
  };

  return facts[stageId as keyof typeof facts] || facts.default;
}

/**
 * Skeleton Loading Component
 */
export function SkeletonLoader({ 
  className = '', 
  variant = 'default',
  lines = 3,
  animated = true
}: {
  className?: string;
  variant?: 'default' | 'card' | 'recipe' | 'calendar';
  lines?: number;
  animated?: boolean;
}) {
  const animationClass = animated ? 'animate-pulse' : '';
  
  if (variant === 'card') {
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border`}>
        <div className={`h-48 bg-gray-200 rounded-t-lg ${animationClass}`} />
        <div className="p-4 space-y-3">
          <div className={`h-4 bg-gray-200 rounded ${animationClass}`} />
          <div className={`h-4 bg-gray-200 rounded w-3/4 ${animationClass}`} />
          <div className={`h-4 bg-gray-200 rounded w-1/2 ${animationClass}`} />
        </div>
      </div>
    );
  }

  if (variant === 'recipe') {
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border overflow-hidden`}>
        <div className={`h-32 bg-gray-200 ${animationClass}`} />
        <div className="p-4">
          <div className={`h-6 bg-gray-200 rounded mb-3 ${animationClass}`} />
          <div className={`h-4 bg-gray-200 rounded mb-2 ${animationClass}`} />
          <div className={`h-4 bg-gray-200 rounded w-2/3 ${animationClass}`} />
        </div>
      </div>
    );
  }

  if (variant === 'calendar') {
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border p-4`}>
        <div className={`h-6 bg-gray-200 rounded mb-4 ${animationClass}`} />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-12 bg-gray-200 rounded ${animationClass}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-3`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded ${animationClass}`}
          style={{ width: `${100 - (i * 10)}%` }}
        />
      ))}
    </div>
  );
}