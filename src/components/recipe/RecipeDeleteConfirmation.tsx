/**
 * Recipe Delete Confirmation Component
 * Enhanced confirmation dialog with warnings and loading states
 */

'use client';

import { useState } from 'react';
import { logger } from '@/services/logger';
import { 
  AlertTriangle, 
  Trash2, 
  Check, 
  AlertCircle 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedLoading, useEnhancedLoading } from '@/components/ui/enhanced-loading';
import { 
  MealPlanningError, 
  MealPlanningErrorCodes 
} from '@/lib/errors/MealPlanningError';

interface RecipeDeleteConfirmationProps {
  recipe: {
    id: string;
    title: string;
    imageUrl?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DELETE_STAGES = [
  {
    id: 'validation',
    name: 'Validando eliminación',
    description: 'Verificando permisos de eliminación',
    icon: AlertCircle,
    estimatedDuration: 1000,
    progress: 0,
    status: 'pending' as const
  },
  {
    id: 'deleting',
    name: 'Eliminando receta',
    description: 'Eliminando receta y datos relacionados',
    icon: Trash2,
    estimatedDuration: 3000,
    progress: 0,
    status: 'pending' as const
  },
  {
    id: 'completion',
    name: 'Completando',
    description: 'Finalizando eliminación',
    icon: Check,
    estimatedDuration: 500,
    progress: 0,
    status: 'pending' as const
  }
];

export function RecipeDeleteConfirmation({ 
  recipe, 
  isOpen, 
  onClose, 
  onConfirm 
}: RecipeDeleteConfirmationProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Enhanced loading state
  const {
    loadingState,
    startLoading,
    updateStageProgress,
    completeStage,
    setError: setLoadingError,
    finishLoading,
    cancelLoading
  } = useEnhancedLoading(DELETE_STAGES);

  const isConfirmationValid = confirmationText.toLowerCase() === 'eliminar';

  const handleDelete = async () => {
    if (!isConfirmationValid) return;

    setIsDeleting(true);
    setError(null);

    // Start enhanced loading
    startLoading('Eliminando receta...', false);

    try {
      // Stage 1: Validation
      updateStageProgress('validation', 50, 'Verificando permisos...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStageProgress('validation', 100, 'Permisos verificados');
      completeStage('validation');

      // Stage 2: Deleting
      updateStageProgress('deleting', 30, 'Eliminando receta...');
      
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      updateStageProgress('deleting', 80, 'Eliminando datos relacionados...');

      if (!response.ok) {
        const errorData = await response.json();
        throw new MealPlanningError(
          'Failed to delete recipe',
          MealPlanningErrorCodes.DATABASE_ERROR,
          { response: errorData },
          errorData.message || 'Error al eliminar la receta'
        );
      }

      updateStageProgress('deleting', 100, 'Receta eliminada exitosamente');
      completeStage('deleting');

      // Stage 3: Completion
      updateStageProgress('completion', 50, 'Finalizando eliminación...');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStageProgress('completion', 100, 'Eliminación completada');
      completeStage('completion');

      // Complete loading
      finishLoading();

      // Close modal and notify parent
      onConfirm();
      onClose();

    } catch (error: unknown) {
      logger.error('Error deleting recipe:', 'RecipeDeleteConfirmation', error);
      
      let errorMessage = 'Error al eliminar la receta';
      if (error instanceof MealPlanningError) {
        errorMessage = error.userMessage || error.message;
      }
      
      setLoadingError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (isDeleting) {
      cancelLoading();
      setIsDeleting(false);
    }
    onClose();
    setStep(1);
    setConfirmationText('');
    setError(null);
  };

  const handleNextStep = () => {
    setStep(2);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Receta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              {/* Recipe Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {recipe.imageUrl ? (
                  <img 
                    src={recipe.imageUrl} 
                    alt={recipe.title}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{recipe.title}</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              {/* Warning */}
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>¡Advertencia!</strong> Esta acción eliminará permanentemente:
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• La receta y toda su información</li>
                    <li>• Todos los ingredientes asociados</li>
                    <li>• Las instrucciones de preparación</li>
                    <li>• Las calificaciones y comentarios</li>
                    <li>• Su inclusión en planes de comida</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Continue Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleNextStep}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Continuar
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Final Confirmation */}
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Confirmación final:</strong> Para eliminar esta receta, 
                    escriba <code className="bg-red-100 px-1 rounded">eliminar</code> en el campo de abajo.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="confirmation">Escriba "eliminar" para confirmar:</Label>
                  <Input
                    id="confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="eliminar"
                    className={`mt-1 ${confirmationText && !isConfirmationValid ? 'border-red-500' : ''}`}
                    disabled={isDeleting}
                    autoFocus
                  />
                  {confirmationText && !isConfirmationValid && (
                    <p className="text-sm text-red-600 mt-1">
                      Debe escribir exactamente "eliminar"
                    </p>
                  )}
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isDeleting}
                  >
                    Atrás
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={!isConfirmationValid || isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? 'Eliminando...' : 'Eliminar Receta'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Loading State */}
      <EnhancedLoading
        loadingState={loadingState}
        onCancel={handleCancel}
        variant="modal"
      />
    </div>
  );
}