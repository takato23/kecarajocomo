'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, AlertCircle, X } from 'lucide-react';

import { useVoiceService as useUnifiedVoice, VoiceOptions, VoiceResult } from '@/services/voice';
import { cn } from '@/lib/utils';

import { AudioVisualizer } from './AudioVisualizer';

interface UnifiedVoiceButtonProps {
  // Visual options
  variant?: 'floating' | 'discrete' | 'inline' | 'minimal';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  showVisualizer?: boolean;
  showTranscript?: boolean;
  
  // Voice options
  mode?: VoiceOptions['mode'];
  context?: VoiceOptions['context'];
  language?: string;
  
  // Callbacks
  onResult?: (result: VoiceResult) => void;
  onItemsDetected?: (items: any[]) => void;
  onCommandDetected?: (command: any) => void;
  
  // Custom styling
  className?: string;
  buttonClassName?: string;
}

export function UnifiedVoiceButton({
  variant = 'discrete',
  position = 'bottom-right',
  size = 'md',
  showVisualizer = true,
  showTranscript = false,
  mode = 'simple',
  context = 'general',
  language = 'es-AR',
  onResult,
  onItemsDetected,
  onCommandDetected,
  className,
  buttonClassName,
}: UnifiedVoiceButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const {
    state,
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    clear,
    isSupported,
  } = useUnifiedVoice({
    mode,
    context,
    language,
    continuous: true,
    interimResults: true,
    autoParse: true,
    enableSmartParsing: mode === 'advanced',
    onResult: (result) => {
      onResult?.(result);
      
      if (result.parsedItems && result.parsedItems.length > 0) {
        onItemsDetected?.(result.parsedItems);
      }
      
      if (result.command) {
        onCommandDetected?.(result.command);
      }
    },
  });

  // Show tooltip on first render for new users
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('voice-tooltip-seen');
    if (!hasSeenTooltip && variant === 'floating') {
      setShowTooltip(true);
      setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem('voice-tooltip-seen', 'true');
      }, 5000);
    }
  }, [variant]);

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (variant === 'discrete' || variant === 'floating') {
      if (isListening) {
        stop();
      } else {
        start();
      }
      
      if (showTranscript) {
        setShowModal(true);
      }
    } else {
      if (isListening) {
        stop();
      } else {
        start();
      }
    }
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const variantClasses = {
    floating: 'fixed z-50 shadow-lg',
    discrete: 'relative',
    inline: 'relative',
    minimal: 'relative',
  };

  const buttonContent = (
    <>
      <motion.button
        onClick={handleClick}
        className={cn(
          'rounded-full flex items-center justify-center transition-all',
          sizeClasses[size],
          isListening
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600',
          'text-white shadow-md hover:shadow-lg',
          buttonClassName
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <AlertCircle className="w-5 h-5" />
            </motion.div>
          ) : isListening ? (
            <motion.div
              key="listening"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <MicOff className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Mic className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Audio Visualizer */}
      {showVisualizer && isListening && (
        <div className="absolute -inset-2 pointer-events-none">
          <AudioVisualizer
            isRecording={isListening}
            size={size === 'sm' ? 64 : size === 'md' ? 80 : 96}
          />
        </div>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && variant === 'floating' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap"
          >
            <div className="font-medium">🎤 Asistente de voz</div>
            <div className="text-xs opacity-80">Tocá para hablar</div>
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Tooltip */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 right-0 bg-red-600 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap"
          >
            <div className="font-medium">Error</div>
            <div className="text-xs">{error}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // Render based on variant
  if (variant === 'floating') {
    return (
      <div
        className={cn(
          variantClasses[variant],
          positionClasses[position],
          className
        )}
      >
        {buttonContent}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isListening
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          buttonClassName
        )}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
    );
  }

  // Discrete and inline variants
  return (
    <div className={cn(variantClasses[variant], className)}>
      {buttonContent}
      
      {/* Transcript Modal for discrete/inline variants */}
      <AnimatePresence>
        {showModal && showTranscript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Asistente de voz</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                  )} />
                  <span className="text-sm text-gray-600">
                    {isListening ? 'Escuchando...' : 'Presioná el botón para hablar'}
                  </span>
                </div>

                {/* Transcript */}
                {(transcript || interimTranscript) && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{transcript}</p>
                    {interimTranscript && (
                      <p className="text-sm text-gray-500 italic">{interimTranscript}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleClick}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
                      isListening
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    )}
                  >
                    {isListening ? 'Detener' : 'Hablar'}
                  </button>
                  
                  {transcript && (
                    <button
                      onClick={clear}
                      className="py-2 px-4 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}