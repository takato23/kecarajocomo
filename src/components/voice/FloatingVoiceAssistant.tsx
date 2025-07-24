'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { 
  Mic, MicOff, X, ChevronDown, 
  Globe, Volume2, HelpCircle,
  Sparkles, Zap, Bot
} from 'lucide-react';

import { Button } from '@/components/design-system/Button';
import { Text } from '@/components/design-system/Typography';
import { useAdvancedVoiceRecognition } from '@/hooks/useAdvancedVoiceRecognition';
import type { ParsedIngredientInput } from '@/types/pantry';

interface FloatingVoiceAssistantProps {
  onItemsParsed?: (items: ParsedIngredientInput[]) => void;
  onCommand?: (command: any) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultLanguage?: string;
}

export function FloatingVoiceAssistant({
  onItemsParsed,
  onCommand,
  position = 'bottom-right',
  defaultLanguage = 'es-MX'
}: FloatingVoiceAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);
  
  // Motion values for dragging
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // 3D rotation based on mouse position
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);
  
  const springConfig = { damping: 20, stiffness: 300 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);
  
  const {
    isListening,
    isProcessing,
    isSpeaking,
    isWaitingForWakeWord,
    isContinuousMode,
    currentLanguage,
    transcript,
    conversation,
    suggestions,
    audioLevel,
    error,
    startListening,
    stopListening,
    startContinuousListening,
    stopContinuousListening,
    speak,
    switchLanguage,
    clearConversation,
    supportedLanguages
  } = useAdvancedVoiceRecognition({
    language: defaultLanguage,
    enableVoiceFeedback: voiceFeedbackEnabled,
    enableWakeWord: true,
    contextAware: true,
    autoSuggest: true,
    multiLanguage: true,
    onCommand: (command) => {
      if (command.type === 'add' && command.items) {
        onItemsParsed?.(command.items as ParsedIngredientInput[]);
      }
      onCommand?.(command);
    },
    onWakeWord: () => {
      setIsExpanded(true);
    }
  });
  
  // Position styles
  const positionStyles = {
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 }
  };
  
  // Handle continuous mode toggle
  useEffect(() => {
    if (continuousMode && !isContinuousMode) {
      startContinuousListening();
    } else if (!continuousMode && isContinuousMode) {
      stopContinuousListening();
    }
  }, [continuousMode, isContinuousMode, startContinuousListening, stopContinuousListening]);
  
  const handleMainButtonClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      'es-MX': 'Español (México)',
      'es-ES': 'Español (España)',
      'es-AR': 'Español (Argentina)',
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'pt-BR': 'Português (Brasil)',
      'pt-PT': 'Português (Portugal)'
    };
    return names[code] || code;
  };
  
  const getLanguageEmoji = (code: string) => {
    const emojis: Record<string, string> = {
      'es-MX': '🇲🇽',
      'es-ES': '🇪🇸',
      'es-AR': '🇦🇷',
      'en-US': '🇺🇸',
      'en-GB': '🇬🇧',
      'pt-BR': '🇧🇷',
      'pt-PT': '🇵🇹'
    };
    return emojis[code] || '🌐';
  };
  
  return (
    <>
      {/* Drag constraints */}
      <div 
        ref={dragConstraintsRef}
        className="fixed inset-0 pointer-events-none"
        style={{ margin: 20 }}
      />
      
      {/* Floating Assistant */}
      <motion.div
        ref={containerRef}
        drag
        dragConstraints={dragConstraintsRef}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        style={{
          ...positionStyles[position],
          x,
          y,
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformPerspective: 1000
        }}
        className="fixed z-50"
      >
        <div className="relative">
          {/* Main Container */}
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                style={{ width: 380, maxHeight: 600 }}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      <Text className="font-semibold text-white">
                        Chef Asistente
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-1 hover:bg-white/20 rounded-md transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setIsExpanded(false)}
                        className="p-1 hover:bg-white/20 rounded-md transition-colors"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center gap-2 text-sm">
                    {isContinuousMode && (
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                        <Zap className="h-3 w-3" />
                        <span className="text-xs">Modo Continuo</span>
                      </div>
                    )}
                    {isWaitingForWakeWord && (
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                        <span className="text-xs">Esperando "Oye Chef"...</span>
                      </div>
                    )}
                    {isListening && !isWaitingForWakeWord && (
                      <div className="flex items-center gap-1 bg-green-400/30 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-xs">Escuchando...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Settings Panel */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-gray-50 border-b overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        {/* Language Selector */}
                        <div>
                          <Text size="xs" className="text-gray-600 mb-2">Idioma</Text>
                          <div className="grid grid-cols-2 gap-2">
                            {supportedLanguages.map(lang => (
                              <button
                                key={lang}
                                onClick={() => switchLanguage(lang)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                  currentLanguage === lang
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                                }`}
                              >
                                <span>{getLanguageEmoji(lang)}</span>
                                <span className="text-xs">{getLanguageName(lang).split(' ')[0]}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Settings Toggles */}
                        <div className="space-y-2">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-gray-700">Respuesta por voz</span>
                            <input
                              type="checkbox"
                              checked={voiceFeedbackEnabled}
                              onChange={(e) => setVoiceFeedbackEnabled(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`relative w-10 h-6 rounded-full transition-colors ${
                              voiceFeedbackEnabled ? 'bg-blue-600' : 'bg-gray-300'
                            }`}>
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                voiceFeedbackEnabled ? 'translate-x-4' : ''
                              }`} />
                            </div>
                          </label>
                          
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-gray-700">Modo continuo</span>
                            <input
                              type="checkbox"
                              checked={continuousMode}
                              onChange={(e) => setContinuousMode(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`relative w-10 h-6 rounded-full transition-colors ${
                              continuousMode ? 'bg-blue-600' : 'bg-gray-300'
                            }`}>
                              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                continuousMode ? 'translate-x-4' : ''
                              }`} />
                            </div>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Conversation Area */}
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {/* Current Transcript */}
                  {transcript && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 rounded-lg p-3"
                    >
                      <Text size="sm" className="text-blue-900">
                        {transcript}
                      </Text>
                    </motion.div>
                  )}
                  
                  {/* Conversation History */}
                  {conversation.length > 0 && (
                    <div className="space-y-2">
                      {conversation.slice(-5).map((entry) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: entry.type === 'user' ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`rounded-lg p-3 ${
                            entry.type === 'user'
                              ? 'bg-gray-100 ml-8'
                              : 'bg-purple-50 mr-8'
                          }`}
                        >
                          <Text size="xs" className="text-gray-600 mb-1">
                            {entry.type === 'user' ? 'Tú' : 'Chef'}
                          </Text>
                          <Text size="sm" className="text-gray-900">
                            {entry.text}
                          </Text>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div>
                      <Text size="xs" className="text-gray-600 mb-2">Sugerencias:</Text>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => speak(`Agregar ${suggestion}`)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-50 rounded-lg p-3"
                    >
                      <Text size="sm" className="text-red-700">
                        {error}
                      </Text>
                    </motion.div>
                  )}
                  
                  {/* Help */}
                  {conversation.length === 0 && !transcript && (
                    <div className="text-center py-8">
                      <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <Text size="sm" className="text-gray-600 mb-2">
                        ¡Hola! Soy tu asistente de cocina
                      </Text>
                      <Text size="xs" className="text-gray-500">
                        Di "agregar 2 kilos de tomate" o activa el modo continuo
                      </Text>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant={isListening ? 'primary' : 'secondary'}
                      size="lg"
                      onClick={handleMainButtonClick}
                      className="flex-1"
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-5 w-5 mr-2" />
                          Detener
                        </>
                      ) : (
                        <>
                          <Mic className="h-5 w-5 mr-2" />
                          Hablar
                        </>
                      )}
                    </Button>
                    
                    {conversation.length > 0 && (
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={clearConversation}
                        className="px-3"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="collapsed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(true)}
                className="relative group"
              >
                {/* 3D Button */}
                <div className="relative w-16 h-16">
                  {/* Background glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-lg"
                    animate={{
                      scale: isListening ? [1, 1.2, 1] : 1,
                      opacity: isListening ? [0.5, 0.8, 0.5] : 0.5
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  />
                  
                  {/* Main button */}
                  <div className={`relative w-full h-full rounded-full shadow-lg flex items-center justify-center transition-colors ${
                    isListening
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600'
                  }`}>
                    {isContinuousMode && isWaitingForWakeWord ? (
                      <Sparkles className="h-6 w-6 text-white" />
                    ) : isListening ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Mic className="h-6 w-6 text-white" />
                      </motion.div>
                    ) : (
                      <Bot className="h-6 w-6 text-white" />
                    )}
                  </div>
                  
                  {/* Audio level indicator */}
                  {isListening && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-white/30"
                      animate={{
                        scale: [1, 1 + audioLevel * 0.5, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 0.2,
                        repeat: Infinity
                      }}
                    />
                  )}
                  
                  {/* Status indicators */}
                  {isContinuousMode && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
                      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping" />
                    </div>
                  )}
                  
                  {isSpeaking && (
                    <Volume2 className="absolute -bottom-1 -right-1 h-4 w-4 text-blue-600 bg-white rounded-full p-0.5" />
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {isContinuousMode
                      ? isWaitingForWakeWord
                        ? 'Di "Oye Chef"'
                        : 'Escuchando...'
                      : 'Click para hablar'
                    }
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}