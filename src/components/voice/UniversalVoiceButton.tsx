'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Square, 
  Volume2, 
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { parseMultipleIngredients } from '@/lib/pantry/parser';
import { ParsedIngredientInput } from '@/types/pantry';

export interface VoiceButtonProps {
  onResult?: (transcript: string, ingredients?: ParsedIngredientInput[]) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  autoParseIngredients?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'floating';
  className?: string;
  disabled?: boolean;
  showTranscript?: boolean;
  language?: string;
}

export function UniversalVoiceButton({
  onResult,
  onError,
  placeholder = "Habla ahora...",
  autoParseIngredients = false,
  size = 'md',
  variant = 'primary',
  className = '',
  disabled = false,
  showTranscript = false,
  language = 'es-MX'
}: VoiceButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const {
    isListening,
    isProcessing,
    transcript,
    error,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useVoiceRecognition({
    language,
    continuous: false,
    interimResults: true,
    onResult: (result) => {
      if (result.isFinal) {
        let ingredients: ParsedIngredientInput[] | undefined;
        
        if (autoParseIngredients) {
          try {
            ingredients = parseMultipleIngredients(result.transcript);
          } catch (parseError) {
            console.warn('Failed to parse ingredients:', parseError);
          }
        }
        
        onResult?.(result.transcript, ingredients);
        
        // Auto-close modal after successful result
        setTimeout(() => {
          setShowModal(false);
          resetTranscript();
        }, 1000);
      }
    },
    onError: (errorMsg) => {
      onError?.(errorMsg);
    }
  });

  const handleButtonClick = useCallback(() => {
    if (!isSupported) {
      onError?.('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    if (disabled) return;

    if (showTranscript) {
      setShowModal(true);
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isSupported, disabled, showTranscript, isListening, startListening, stopListening, onError]);

  const handleModalClose = useCallback(() => {
    if (isListening) {
      stopListening();
    }
    setShowModal(false);
    resetTranscript();
  }, [isListening, stopListening, resetTranscript]);

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'w-8 h-8',
      icon: 16,
      text: 'text-xs'
    },
    md: {
      button: 'w-10 h-10',
      icon: 20,
      text: 'text-sm'
    },
    lg: {
      button: 'w-12 h-12',
      icon: 24,
      text: 'text-base'
    }
  };

  // Variant configurations
  const variantConfig = {
    primary: {
      button: isListening 
        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
        : 'bg-blue-500 hover:bg-blue-600 text-white',
      disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed'
    },
    secondary: {
      button: isListening
        ? 'bg-red-100 hover:bg-red-200 text-red-600 animate-pulse border border-red-300'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300',
      disabled: 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
    },
    floating: {
      button: isListening
        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg'
        : 'bg-white hover:bg-gray-50 text-gray-700 shadow-lg border border-gray-200',
      disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-sm'
    }
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  return (
    <>
      <motion.button
        onClick={handleButtonClick}
        disabled={disabled || !isSupported}
        className={`
          ${currentSize.button} 
          ${disabled || !isSupported ? currentVariant.disabled : currentVariant.button}
          rounded-full flex items-center justify-center transition-all duration-200
          ${className}
        `}
        whileHover={!disabled && isSupported ? { scale: 1.05 } : {}}
        whileTap={!disabled && isSupported ? { scale: 0.95 } : {}}
        title={
          !isSupported 
            ? "Tu navegador no soporta reconocimiento de voz"
            : disabled 
            ? "Función deshabilitada"
            : isListening 
            ? "Detener grabación" 
            : "Iniciar reconocimiento de voz"
        }
      >
        {isProcessing ? (
          <Loader2 size={currentSize.icon} className="animate-spin" />
        ) : isListening ? (
          <Square size={currentSize.icon} />
        ) : (
          <Mic size={currentSize.icon} />
        )}
      </motion.button>

      {/* Transcript Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleModalClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center mb-3">
                  <div className={`p-3 rounded-full ${
                    isListening 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {isProcessing ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : isListening ? (
                      <Mic size={24} className="animate-pulse" />
                    ) : (
                      <MicOff size={24} />
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Reconocimiento de voz
                </h3>
                <p className="text-sm text-gray-600">
                  {isListening ? 'Escuchando...' : placeholder}
                </p>
              </div>

              {/* Audio Level Visualizer */}
              {isListening && (
                <div className="mb-4 flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-blue-500 rounded-full"
                      animate={{
                        height: [8, 24 * (audioLevel + 0.2), 8],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Transcript Display */}
              <div className="mb-4 min-h-[80px] p-4 bg-gray-50 rounded-lg border">
                {transcript ? (
                  <div className="space-y-2">
                    <p className="text-gray-900">{transcript}</p>
                    {isProcessing && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Procesando...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span className="text-sm">
                      {isListening ? 'Habla ahora...' : 'Haz clic en el micrófono para empezar'}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>

                <div className="flex space-x-2">
                  {transcript && (
                    <button
                      onClick={resetTranscript}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                  
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isListening ? 'Detener' : 'Iniciar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Preset configurations for common use cases
export function PantryVoiceButton(props: Omit<VoiceButtonProps, 'autoParseIngredients'>) {
  return (
    <UniversalVoiceButton
      {...props}
      autoParseIngredients={true}
      placeholder="Di ingredientes como: '2 kilos de pollo, 500 gramos de tomates'"
    />
  );
}

export function RecipeVoiceButton(props: VoiceButtonProps) {
  return (
    <UniversalVoiceButton
      {...props}
      autoParseIngredients={false}
      placeholder="Dicta los pasos de la receta..."
    />
  );
}

export function ShoppingListVoiceButton(props: Omit<VoiceButtonProps, 'autoParseIngredients'>) {
  return (
    <UniversalVoiceButton
      {...props}
      autoParseIngredients={true}
      placeholder="Di los productos que necesitas comprar..."
    />
  );
}