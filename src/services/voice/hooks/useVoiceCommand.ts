/**
 * useVoiceCommand Hook
 * Simplified hook for handling voice commands
 */

import { useState, useCallback, useEffect } from 'react';

import { VoiceCommand } from '../types';

import { useVoiceService } from './useVoiceService';

export interface UseVoiceCommandOptions {
  onAdd?: (entity: string, parameters: any) => void;
  onSearch?: (query: string, parameters: any) => void;
  onNavigate?: (destination: string, parameters: any) => void;
  onTimer?: (duration: number, unit: string) => void;
  onRecipe?: (parameters: any) => void;
  onUnknown?: (command: VoiceCommand) => void;
  autoExecute?: boolean;
  language?: string;
}

export interface UseVoiceCommandReturn {
  isListening: boolean;
  transcript: string;
  lastCommand: VoiceCommand | null;
  error: Error | null;
  
  startListening: () => Promise<void>;
  stopListening: () => void;
  executeCommand: (command: VoiceCommand) => void;
}

export function useVoiceCommand(options: UseVoiceCommandOptions = {}): UseVoiceCommandReturn {
  const [isReady, setIsReady] = useState(false);

  const handleCommand = useCallback((command: VoiceCommand) => {
    if (!options.autoExecute) return;

    switch (command.intent) {
      case 'add':
        options.onAdd?.(command.entity, command.parameters);
        break;
      
      case 'search':
        options.onSearch?.(command.entity, command.parameters);
        break;
      
      case 'navigate':
        options.onNavigate?.(command.entity, command.parameters);
        break;
      
      case 'timer':
        options.onTimer?.(
          command.parameters.duration,
          command.parameters.unit
        );
        break;
      
      case 'recipe':
        options.onRecipe?.(command.parameters);
        break;
      
      case 'unknown':
      default:
        options.onUnknown?.(command);
        break;
    }
  }, [options]);

  const voiceService = useVoiceService({
    language: options.language || 'es-MX',
    onCommand: handleCommand,
    enableFeedback: true,
  });

  const executeCommand = useCallback((command: VoiceCommand) => {
    handleCommand(command);
  }, [handleCommand]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return {
    isListening: voiceService.isListening,
    transcript: voiceService.transcript,
    lastCommand: voiceService.lastCommand,
    error: voiceService.error,
    
    startListening: voiceService.startListening,
    stopListening: voiceService.stopListening,
    executeCommand,
  };
}