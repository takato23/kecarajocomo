import { useState, useEffect, useCallback, useRef } from 'react';

import { getVoiceService, VoiceCommand, VoiceServiceOptions } from '@/services/voice';

export interface UseVoiceServiceOptions extends VoiceServiceOptions {
  onCommand?: (command: VoiceCommand) => void;
  onInterim?: (transcript: string) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface UseVoiceServiceReturn {
  isListening: boolean;
  isAvailable: boolean;
  transcript: string;
  interimTranscript: string;
  lastCommand: VoiceCommand | null;
  error: Error | null;
  startListening: (options?: VoiceServiceOptions) => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  clearTranscript: () => void;
}

export function useVoiceService(options: UseVoiceServiceOptions = {}): UseVoiceServiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const voiceService = useRef(getVoiceService());
  const optionsRef = useRef(options);
  
  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize and set up event listeners
  useEffect(() => {
    const service = voiceService.current;
    
    // Check availability
    setIsAvailable(service.isAvailable());
    
    // Set up event listeners
    const handleStart = () => {
      setIsListening(true);
      setError(null);
      optionsRef.current.onStart?.();
    };
    
    const handleEnd = () => {
      setIsListening(false);
      optionsRef.current.onEnd?.();
    };
    
    const handleCommand = (command: VoiceCommand) => {
      setLastCommand(command);
      setTranscript(command.transcript);
      setInterimTranscript('');
      optionsRef.current.onCommand?.(command);
    };
    
    const handleInterim = ({ transcript }: { transcript: string }) => {
      setInterimTranscript(transcript);
      optionsRef.current.onInterim?.(transcript);
    };
    
    const handleError = (error: Error) => {
      setError(error);
      setIsListening(false);
      optionsRef.current.onError?.(error);
    };
    
    service.on('start', handleStart);
    service.on('end', handleEnd);
    service.on('command', handleCommand);
    service.on('interim', handleInterim);
    service.on('error', handleError);
    
    // Cleanup
    return () => {
      service.off('start', handleStart);
      service.off('end', handleEnd);
      service.off('command', handleCommand);
      service.off('interim', handleInterim);
      service.off('error', handleError);
    };
  }, []);

  const startListening = useCallback(async (customOptions?: VoiceServiceOptions) => {
    try {
      setError(null);
      const command = await voiceService.current.startListening({
        ...options,
        ...customOptions,
      });
      
      if (!options.continuous) {
        setLastCommand(command);
        setTranscript(command.transcript);
        setInterimTranscript('');
        options.onCommand?.(command);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
    }
  }, [options]);

  const stopListening = useCallback(() => {
    voiceService.current.stop();
  }, []);

  const speak = useCallback(async (text: string) => {
    try {
      await voiceService.current.speak(text);
    } catch (err: unknown) {
      console.error('Speech synthesis error:', err);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setLastCommand(null);
  }, []);

  return {
    isListening,
    isAvailable,
    transcript,
    interimTranscript,
    lastCommand,
    error,
    startListening,
    stopListening,
    speak,
    clearTranscript,
  };
}