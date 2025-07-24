'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ShoppingCart, Check, X, Plus } from 'lucide-react';

import { useShoppingVoice } from '@/hooks/useShoppingVoice';

interface ShoppingVoiceButtonProps {
  onAddItem: (item: { name: string; quantity: number; unit: string }) => void;
  onCompleteItem?: (itemName: string) => void;
  onRemoveItem?: (itemName: string) => void;
  onUpdateQuantity?: (itemName: string, quantity: number) => void;
  disabled?: boolean;
}

export function ShoppingVoiceButton({
  onAddItem,
  onCompleteItem,
  onRemoveItem,
  onUpdateQuantity,
  disabled = false
}: ShoppingVoiceButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const {
    isListening,
    isProcessing,
    transcript,
    lastCommand,
    toggleListening,
    isSupported,
    clearProcessedCommands
  } = useShoppingVoice({
    onAddItem,
    onCompleteItem,
    onRemoveItem,
    onUpdateQuantity
  });

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-500 rounded-lg">
        <MicOff className="w-4 h-4" />
        <span className="text-sm">Voz no disponible</span>
      </div>
    );
  }

  const handleToggle = () => {
    if (isListening) {
      clearProcessedCommands();
    }
    toggleListening();
  };

  const getButtonColor = () => {
    if (isProcessing) return 'from-yellow-500 to-orange-500';
    if (isListening) return 'from-red-500 to-pink-500';
    return 'from-blue-500 to-purple-500';
  };

  const getStatusIcon = () => {
    if (isProcessing) return <ShoppingCart className="w-4 h-4" />;
    if (isListening) return <MicOff className="w-4 h-4" />;
    return <Mic className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isProcessing) return 'Procesando...';
    if (isListening) return 'Escuchando...';
    return 'Hablar';
  };

  return (
    <div className="relative">
      {/* Main Voice Button */}
      <motion.button
        onClick={handleToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={disabled || isProcessing}
        className={`
          relative px-4 py-2 rounded-lg font-medium text-white
          bg-gradient-to-r ${getButtonColor()}
          hover:shadow-lg active:scale-95 transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2
        `}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: isListening ? [1, 1.05, 1] : 1,
        }}
        transition={{
          repeat: isListening ? Infinity : 0,
          duration: 1.5
        }}
      >
        {getStatusIcon()}
        <span className="hidden sm:inline">{getStatusText()}</span>
        
        {/* Listening pulse effect */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-red-400"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.2 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
              <div className="font-semibold mb-1">Comandos de voz:</div>
              <div className="space-y-1 text-left">
                <div>• "Agregar 2 kg de pollo"</div>
                <div>• "Compré leche"</div>
                <div>• "Quitar pan"</div>
                <div>• "Necesito huevos"</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Popup */}
      <AnimatePresence>
        {(isListening || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white rounded-lg shadow-xl p-4 min-w-[300px] max-w-[400px] border">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500' : 'bg-red-500'} ${isListening ? 'animate-pulse' : ''}`} />
                <span className="font-medium text-gray-900">
                  {isProcessing ? 'Procesando comando' : 'Escuchando...'}
                </span>
              </div>
              
              {transcript && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Escuchado:</div>
                  <div className="p-2 bg-gray-50 rounded text-sm italic">
                    "{transcript}"
                  </div>
                </div>
              )}

              {lastCommand && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">Último comando:</div>
                  <div className="p-2 bg-green-50 rounded text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    {lastCommand}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                {isListening ? 
                  'Habla claramente. Se detendrá automáticamente después de 3 segundos de silencio.' :
                  'Procesando tu comando...'
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript Toggle Button */}
      {transcript && !isListening && !isProcessing && (
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
        >
          {showTranscript ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
      )}

      {/* Recent Transcript */}
      <AnimatePresence>
        {showTranscript && transcript && !isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-40"
          >
            <div className="bg-gray-50 rounded-lg p-3 min-w-[250px] border">
              <div className="text-xs text-gray-600 mb-1">Última transcripción:</div>
              <div className="text-sm">"{transcript}"</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}