'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '@/services/logger';

interface UseVoiceRecordingOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  maxSilenceDuration?: number;
  autoParse?: boolean;
}

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
  isSupported: boolean;
}

export function useVoiceRecording({
  continuous = true,
  interimResults = true,
  language = 'es-AR',
  maxSilenceDuration = 2000,
  autoParse = false,
}: UseVoiceRecordingOptions = {}): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (!SpeechRecognition) return;

    // Create recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {

      setIsRecording(true);
      setError(null);
    };

    recognition.onend = () => {

      setIsRecording(false);
      // Clear any pending silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    recognition.onerror = (event: any) => {
      logger.error('Voice recording error:', 'useVoiceRecording', event.error);
      setError(event.error);
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      finalTranscriptRef.current = final;
      setTranscript(final);
      setInterimTranscript(interim);

      // Reset silence timer on new speech
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Set new silence timer
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current && isRecording) {
          recognitionRef.current.stop();
        }
      }, maxSilenceDuration);
    };

    recognitionRef.current = recognition;
  }, [continuous, interimResults, language, maxSilenceDuration, isRecording]);

  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      
      try {
        recognitionRef.current.start();
      } catch (err: unknown) {
        logger.error('Error starting recording:', 'useVoiceRecording', err);
        setError('Failed to start recording');
      }
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  return {
    isRecording,
    transcript,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported,
  };
}