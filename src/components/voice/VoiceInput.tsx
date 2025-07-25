'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Loader2, 
  AlertCircle, 
  Check,
  Volume2,
  Square,
} from 'lucide-react';
import { useVoiceService } from '@/services/voice/hooks/useVoiceService';
import { parseMultipleIngredients } from '@/lib/pantry/parser';
// Define ParsedIngredient type locally to avoid import issues
interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
  originalText: string;
}

interface VoiceInputProps {
  onResult: (ingredients: ParsedIngredient[]) => void;
  onClose: () => void;
  placeholder?: string;
  language?: string;
}

export function VoiceInput({ 
  onResult, 
  onClose, 
  placeholder = "Di algo como: 'Tengo 2 kilos de pollo y 500 gramos de tomates'",
  language = 'es-MX'
}: VoiceInputProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [parsedIngredients, setParsedIngredients] = useState<ParsedIngredient[]>([]);

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    reset,
  } = useVoiceService({
    language,
    continuous: true,
    interimResults: true,
    onCommand: (command) => {
      console.log('Voice command received:', command);
    },
    onEnd: () => {
      if (transcript) {
        handleTranscriptComplete(transcript);
      }
    },
  });

  // Handle transcript completion
  const handleTranscriptComplete = (finalTranscript: string) => {
    if (!finalTranscript.trim()) return;

    try {
      // Parse the transcript for ingredients
      const ingredients = parseMultipleIngredients(finalTranscript);
      
      // Convert to ParsedIngredient format
      const parsedIngredients: ParsedIngredient[] = ingredients.map(ingredient => ({
        name: ingredient.extracted_name,
        quantity: ingredient.quantity || 1,
        unit: ingredient.unit || 'pcs',
        confidence: ingredient.confidence,
        originalText: finalTranscript,
      }));

      setParsedIngredients(parsedIngredients);
      
      if (parsedIngredients.length > 0) {
        onResult(parsedIngredients);
      }
    } catch (error) {
      console.error('Error parsing voice input:', error);
    }
  };

  // Auto-start listening when component mounts
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, startListening]);

  const handleClose = () => {
    stopListening();
    reset();
    setIsOpen(false);
    onClose();
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      reset();
      startListening();
    }
  };

  const displayText = interimTranscript || transcript || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className={`p-4 rounded-full ${
                  isListening 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {isListening ? <Mic size={32} /> : <MicOff size={32} />}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Entrada por voz
              </h3>
              <p className="text-sm text-gray-600">
                {placeholder}
              </p>
            </div>

            {/* Status */}
            <div className="mb-6">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">
                    {error.message}
                  </span>
                </div>
              )}

              {isListening && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-700">
                    Escuchando...
                  </span>
                </div>
              )}

              {/* Transcript Display */}
              <div className="min-h-[100px] p-4 bg-gray-50 rounded-lg border">
                {displayText ? (
                  <div className="space-y-2">
                    <p className="text-gray-900">
                      {displayText}
                    </p>
                    {interimTranscript && (
                      <p className="text-gray-500 text-sm italic">
                        (transcribiendo...)
                      </p>
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

              {/* Parsed Ingredients Preview */}
              {parsedIngredients.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Ingredientes detectados:
                    </span>
                  </div>
                  <div className="space-y-1">
                    {parsedIngredients.map((ingredient, index) => (
                      <div key={index} className="text-sm text-blue-800">
                        • {ingredient.quantity} {ingredient.unit} de {ingredient.name}
                        <span className="text-blue-600 ml-2">
                          ({Math.round(ingredient.confidence * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full font-medium transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleToggleListening}
                className={`p-3 rounded-full font-medium transition-colors ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isListening ? <Square size={20} /> : <Mic size={20} />}
              </button>

              {parsedIngredients.length > 0 && (
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-colors"
                >
                  Usar ingredientes
                </button>
              )}
            </div>

            {/* Audio Visualization */}
            {isListening && (
              <div className="mt-4 flex justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full"
                    animate={{
                      height: [8, 24, 8],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}