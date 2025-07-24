/**
 * Voice Recognition Hook
 * Advanced speech-to-text functionality with Spanish optimization
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import { SmartParser, type ParsedIngredient } from '@/services/voice';

// Extend Window interface for WebKit Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    webkitAudioContext: typeof AudioContext;
  }
}

interface UseVoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (result: VoiceResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface VoiceResult {
  transcript: string;
  confidence: number;
  ingredients?: ParsedIngredient[];
  isFinal: boolean;
  timestamp: number;
}

export interface UseVoiceRecognitionReturn {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  audioLevel: number;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export const useVoiceRecognition = ({
  language = 'es-ES',
  continuous = false,
  interimResults = true,
  maxAlternatives = 3,
  onResult,
  onError,
  onStart,
  onEnd
}: UseVoiceRecognitionOptions = {}): UseVoiceRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const retryCountRef = useRef(0);
  const parser = useRef(new SmartParser(language.startsWith('es') ? 'es' : 'en'));

  // Check if Speech Recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported) {
      setError('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;
    recognition.lang = language;
    
    recognition.onstart = () => {

      setIsListening(true);
      setError(null);
      retryCountRef.current = 0;
      onStart?.();
    };
    
    recognition.onresult = async (event) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      const transcriptText = result[0].transcript;
      const confidence = result[0].confidence || 0.9;
      
      setTranscript(transcriptText);
      
      if (result.isFinal) {
        setIsProcessing(true);
        
        try {
          // Parse ingredients if applicable
          const ingredients = await parser.current.parseIngredients(transcriptText);
          
          const voiceResult: VoiceResult = {
            transcript: transcriptText,
            confidence,
            ingredients: ingredients.length > 0 ? ingredients : undefined,
            isFinal: true,
            timestamp: Date.now()
          };
          
          onResult?.(voiceResult);
        } catch (err: unknown) {
          console.error('Error parsing ingredients:', err);
        } finally {
          setIsProcessing(false);
        }
      } else {
        onResult?.({
          transcript: transcriptText,
          confidence,
          isFinal: false,
          timestamp: Date.now()
        });
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = '';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No se detectó voz. Intenta de nuevo.';
          break;
        case 'audio-capture':
          errorMessage = 'No se pudo acceder al micrófono.';
          break;
        case 'not-allowed':
          errorMessage = 'Permisos de micrófono denegados.';
          break;
        case 'network':
          errorMessage = 'Error de conexión. Reintentando...';
          handleNetworkError();
          break;
        case 'aborted':
          errorMessage = 'Reconocimiento cancelado.';
          break;
        default:
          errorMessage = `Error en el reconocimiento de voz: ${event.error}`;
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
      
      if (event.error !== 'network') {
        setIsListening(false);
      }
    };
    
    recognition.onend = () => {

      setIsListening(false);
      stopAudioAnalysis();
      onEnd?.();
    };
    
    recognition.onspeechend = () => {

    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopAudioAnalysis();
    };
  }, [language, continuous, interimResults, maxAlternatives, isSupported, onStart, onEnd, onError, onResult]);

  // Handle network errors with exponential backoff
  const handleNetworkError = useCallback(() => {
    if (retryCountRef.current < 3) {
      const delay = Math.pow(2, retryCountRef.current) * 1000;
      retryCountRef.current++;
      
      setTimeout(() => {
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.start();
          } catch (err: unknown) {
            console.error('Error restarting recognition:', err);
          }
        }
      }, delay);
    } else {
      setError('No se pudo conectar al servicio de voz.');
      setIsListening(false);
    }
  }, [isListening]);

  // Audio level analysis for visualizer
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average audio level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Normalize to 0-1 range with smoothing
        const normalizedLevel = Math.min(average / 128, 1);
        setAudioLevel(normalizedLevel);
        
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (err: unknown) {
      console.error('Error accessing microphone:', err);
      setError('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setAudioLevel(0);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('El reconocimiento de voz no está soportado en este navegador');
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        startAudioAnalysis();
      } catch (err: unknown) {
        console.error('Error starting recognition:', err);
        if (err instanceof Error && err.message.includes('already started')) {
          // Recognition is already started, just update state
          setIsListening(true);
          startAudioAnalysis();
        } else {
          setError('No se pudo iniciar el reconocimiento de voz.');
        }
      }
    }
  }, [isListening, isSupported, startAudioAnalysis]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err: unknown) {
        console.error('Error stopping recognition:', err);
      }
      stopAudioAnalysis();
    }
  }, [isListening, stopAudioAnalysis]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    error,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  };
};