/**
 * useVoiceFeedback Hook
 * Hook for text-to-speech and audio feedback
 */

import { useCallback, useState } from 'react';

import { getVoiceService } from '../UnifiedVoiceService';
import { TTSOptions, VoiceFeedbackSound } from '../types';

export interface UseVoiceFeedbackOptions {
  language?: string;
  defaultVoice?: string;
  volume?: number;
  rate?: number;
  pitch?: number;
}

export interface UseVoiceFeedbackReturn {
  isSpeaking: boolean;
  
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  playSound: (sound: VoiceFeedbackSound['name'], volume?: number) => Promise<void>;
  beep: (frequency?: number, duration?: number) => Promise<void>;
  cancel: () => void;
}

export function useVoiceFeedback(options: UseVoiceFeedbackOptions = {}): UseVoiceFeedbackReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const service = getVoiceService();

  const speak = useCallback(async (text: string, ttsOptions?: TTSOptions) => {
    try {
      setIsSpeaking(true);
      
      const mergedOptions: TTSOptions = {
        language: options.language,
        voice: options.defaultVoice,
        volume: options.volume,
        rate: options.rate,
        pitch: options.pitch,
        ...ttsOptions,
      };
      
      await service.speak(text, mergedOptions);
    } finally {
      setIsSpeaking(false);
    }
  }, [service, options]);

  const playSound = useCallback(async (
    sound: VoiceFeedbackSound['name'], 
    volume?: number
  ) => {
    await service.playSound(sound, volume ?? options.volume);
  }, [service, options.volume]);

  const beep = useCallback(async (
    frequency: number = 440, 
    duration: number = 200
  ) => {
    // Use feedback manager directly for beep
    const feedbackManager = (service as any).feedbackManager;
    if (feedbackManager?.beep) {
      await feedbackManager.beep(frequency, duration, options.volume);
    }
  }, [service, options.volume]);

  const cancel = useCallback(() => {
    const feedbackManager = (service as any).feedbackManager;
    if (feedbackManager?.cancel) {
      feedbackManager.cancel();
    }
    setIsSpeaking(false);
  }, [service]);

  return {
    isSpeaking,
    speak,
    playSound,
    beep,
    cancel,
  };
}