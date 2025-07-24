'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Check, AlertCircle, Volume2 } from 'lucide-react';

import { Button } from '@/components/design-system/Button';
import { Text } from '@/components/design-system/Typography';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { useVoiceService } from '@/services/voice/hooks/useVoiceService';
import type { ParsedIngredient } from '@/services/voice/types';

interface VoiceRecorderProps {
  onItemsParsed?: (items: ParsedIngredient[]) => void;
  onClose?: () => void;
  className?: string;
  autoStart?: boolean;
  showParsedItems?: boolean;
}

export function VoiceRecorder({
  onItemsParsed,
  onClose,
  className = '',
  autoStart = false,
  showParsedItems = true,
}: VoiceRecorderProps) {
  const [parsedItems, setParsedItems] = useState<ParsedIngredient[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceService({
    language: 'es-MX',
    mode: 'ingredient_detection',
    enableSmartParsing: true,
    onResult: (result) => {
      if (result.isComplete) {
        setCurrentTranscript(result.text);
        if (result.parsedItems && result.parsedItems.length > 0) {
          setParsedItems(result.parsedItems);
          onItemsParsed?.(result.parsedItems);
        }
      } else {
        setInterimTranscript(result.text);
      }
    },
  });

  const [showTranscript, setShowTranscript] = useState(true);
  const audioVisualizerRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Auto-start recording if requested
  useEffect(() => {
    if (autoStart && isSupported) {
      startListening();
    }
  }, [autoStart, isSupported]);

  // Setup audio visualizer when recording starts
  useEffect(() => {
    if (isListening) {
      setupAudioVisualizer();
    } else {
      cleanupAudioVisualizer();
    }

    return () => {
      cleanupAudioVisualizer();
    };
  }, [isListening]);

  const setupAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      drawVisualizer();
    } catch (error: unknown) {
      console.error('Error setting up audio visualizer:', error);
    }
  };

  const cleanupAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !audioVisualizerRef.current) return;

    const canvas = audioVisualizerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgb(249, 250, 251)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgb(59, 130, 246)');
        gradient.addColorStop(1, 'rgb(37, 99, 235)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };

  if (!isSupported) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <Text>Tu navegador no soporta reconocimiento de voz</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`relative ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-gray-600" />
            <Text className="font-semibold text-gray-900">
              Dictado por Voz
            </Text>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Recording Status */}
        <div className="mb-6 text-center">
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                {/* Audio Visualizer */}
                <div className="relative h-24 bg-gray-50 rounded-lg overflow-hidden">
                  <canvas
                    ref={audioVisualizerRef}
                    width={400}
                    height={96}
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="bg-red-500 bg-opacity-20 rounded-full p-3"
                    >
                      <Mic className="h-8 w-8 text-red-600" />
                    </motion.div>
                  </div>
                </div>
                <Text className="text-sm text-gray-600">
                  Habla claramente... Di "1 kilo de pollo" o "media docena de huevos"
                </Text>
              </motion.div>
            ) : (
              <motion.div
                key="not-recording"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div className="bg-gray-100 rounded-full p-6 inline-block">
                  <MicOff className="h-8 w-8 text-gray-400" />
                </div>
                <Text className="text-sm text-gray-600">
                  Presiona el botón para empezar a grabar
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recording Button */}
        <div className="flex justify-center mb-6">
          <Button
            variant={isListening ? 'secondary' : 'primary'}
            size="lg"
            onClick={isListening ? stopListening : startListening}
            className={`
              relative overflow-hidden transition-all duration-300
              ${isListening ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            `}
          >
            {isListening ? (
              <>
                <motion.div
                  className="absolute inset-0 bg-red-700"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <span className="relative flex items-center gap-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  Detener Grabación
                </span>
              </>
            ) : (
              <span className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Iniciar Grabación
              </span>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
          >
            <Text size="sm" className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </Text>
          </motion.div>
        )}

        {/* Transcript */}
        {(currentTranscript || interimTranscript) && (
          <div className="mb-6">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <Text className="font-medium">Transcripción</Text>
              <motion.div
                animate={{ rotate: showTranscript ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.div>
            </button>
            
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Text className="text-gray-900">
                      {currentTranscript}
                      {interimTranscript && (
                        <span className="text-gray-400 italic"> {interimTranscript}</span>
                      )}
                    </Text>
                  </div>
                  {currentTranscript && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        resetTranscript();
                        setCurrentTranscript('');
                        setInterimTranscript('');
                        setParsedItems([]);
                      }}
                      className="mt-2"
                    >
                      Limpiar
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Parsed Items */}
        {showParsedItems && parsedItems.length > 0 && (
          <div className="space-y-3">
            <Text className="font-medium text-gray-700 text-sm">
              Ingredientes Detectados:
            </Text>
            <div className="space-y-2">
              {parsedItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600" />
                    <div>
                      <Text className="font-medium text-gray-900">
                        {item.name}
                      </Text>
                      <Text size="sm" className="text-gray-600">
                        {item.amount.value} {item.amount.unit}
                      </Text>
                    </div>
                  </div>
                  <Badge
                    variant={item.confidence > 0.8 ? 'success' : 'warning'}
                    size="sm"
                  >
                    {Math.round(item.confidence * 100)}%
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {!isListening && !currentTranscript && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <Text size="sm" className="text-blue-800">
              <strong>Ejemplos:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>"Un kilo de milanesa"</li>
                <li>"Dos litros de leche"</li>
                <li>"Media docena de huevos"</li>
                <li>"Tres paquetes de pasta y un frasco de salsa"</li>
              </ul>
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
}