'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '@/services/logger';

interface UseSimpleVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  toggleListening: () => void;
  lastSpeechTime: number | null;
}

export function useSimpleVoiceRecognition(): UseSimpleVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [lastSpeechTime, setLastSpeechTime] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const isListeningRef = useRef(false);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (!SpeechRecognition) return;

    // Create recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true;  // Keep listening
    recognition.interimResults = true;
    recognition.lang = 'es-AR';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {

      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onend = () => {

      setIsListening(false);
      isListeningRef.current = false;
      // Clear any pending silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      // Set final transcript if available
      if (finalTranscriptRef.current) {
        setTranscript(finalTranscriptRef.current);
      }
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
      
      // Update last speech time
      setLastSpeechTime(Date.now());

      // Store final transcript
      if (finalTranscript) {
        finalTranscriptRef.current = finalTranscript.trim();
      }
      
      // Reset silence timer - stop after 3 seconds of silence
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current && isListeningRef.current) {
          recognitionRef.current.stop();
        }
      }, 3000);
    };

    recognition.onerror = (event: any) => {
      logger.error('Voice recognition error:', 'useSimpleVoiceRecognition', event.error);
      setIsListening(false);
      isListeningRef.current = false;
      
      // Clear timers on error
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      if (event.error === 'not-allowed') {
        alert('⚠️ Acceso al micrófono denegado\n\nPara usar el reconocimiento de voz:\n\n1. Haz clic en el ícono del candado/micrófono en la barra de direcciones\n2. Permite el acceso al micrófono\n3. Recarga la página\n\nO verifica la configuración de permisos de tu navegador.');
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors, they're normal

      } else if (event.error === 'audio-capture') {
        alert('❌ No se pudo acceder al micrófono\n\nAsegúrate de que:\n- Tu dispositivo tenga micrófono\n- Ninguna otra aplicación esté usando el micrófono\n- El micrófono esté conectado correctamente');
      } else if (event.error === 'network') {
        alert('🌐 Error de red\n\nVerifica tu conexión a internet e inténtalo de nuevo.');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      // Stop recognition if active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e: unknown) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: unknown) {
      logger.error('Microphone permission denied:', 'useSimpleVoiceRecognition', error);
      return false;
    }
  };

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || isListening) return;
    
    // Check microphone permission first
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) {
      alert('Por favor, permite el acceso al micrófono para usar el reconocimiento de voz. Verifica la configuración de permisos de tu navegador.');
      return;
    }
    
    // Clear transcript when starting new recording
    setTranscript('');
    finalTranscriptRef.current = '';
    setLastSpeechTime(null);
    
    // Clear any pending silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    try {
      recognitionRef.current.start();
    } catch (e: unknown) {
      logger.error('Error starting recognition:', 'useSimpleVoiceRecognition', e);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    try {
      recognitionRef.current.stop();
    } catch (e: unknown) {
      logger.error('Error stopping recognition:', 'useSimpleVoiceRecognition', e);
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    isSupported,
    lastSpeechTime,
  };
}