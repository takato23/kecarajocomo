import { VoiceCommand, VoiceCommandResult, VoiceSettings } from '../types';
import { logger } from '@/services/logger';

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isInitialized = false;
  private settings: VoiceSettings;
  private commandPatterns: Map<VoiceCommand, RegExp[]>;

  constructor(settings: VoiceSettings) {
    this.settings = settings;
    this.commandPatterns = new Map([
      ['next', [/next\s*step/i, /continue/i, /go\s*on/i, /proceed/i]],
      ['previous', [/previous\s*step/i, /go\s*back/i, /back/i, /last\s*step/i]],
      ['repeat', [/repeat/i, /say\s*again/i, /again/i, /what\s*did\s*you\s*say/i]],
      ['pause', [/pause/i, /stop/i, /wait/i, /hold\s*on/i]],
      ['resume', [/resume/i, /continue/i, /start/i, /go/i]],
      ['timer', [/timer/i, /set\s*timer/i, /start\s*timer/i, /time/i]],
      ['help', [/help/i, /what\s*can\s*I\s*say/i, /commands/i, /options/i]],
      ['ingredients', [/ingredients/i, /what\s*do\s*I\s*need/i, /shopping\s*list/i]],
      ['nutrition', [/nutrition/i, /calories/i, /healthy/i, /nutritional\s*info/i]],
      ['finish', [/finish/i, /done/i, /complete/i, /end/i]]
    ]);
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check for Web Speech API support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech recognition not supported in this browser');
      }

      if (!('speechSynthesis' in window)) {
        throw new Error('Speech synthesis not supported in this browser');
      }

      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.settings.language;
      this.recognition.maxAlternatives = 3;

      // Initialize Speech Synthesis
      this.synthesis = window.speechSynthesis;

      this.isInitialized = true;
      return true;
    } catch (error: unknown) {
      logger.error('Failed to initialize voice service:', 'voiceService', error);
      return false;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: unknown) {
      logger.error('Microphone permission denied:', 'voiceService', error);
      return false;
    }
  }

  startListening(onResult: (result: VoiceCommandResult) => void, onError?: (error: Error) => void): boolean {
    if (!this.recognition || !this.settings.enabled) {
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim();
        const confidence = lastResult[0].confidence;
        
        const command = this.parseCommand(transcript);
        if (command) {
          onResult({
            command,
            confidence,
            transcript,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const error = new Error(`Speech recognition error: ${event.error}`);
      onError?.(error);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart recognition if it was stopped unexpectedly
        setTimeout(() => this.recognition?.start(), 100);
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error: unknown) {
      logger.error('Failed to start listening:', 'voiceService', error);
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  private parseCommand(transcript: string): VoiceCommand | null {
    const normalizedTranscript = transcript.toLowerCase().trim();
    
    for (const [command, patterns] of this.commandPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedTranscript)) {
          return command;
        }
      }
    }
    
    return null;
  }

  async speak(text: string, options?: { 
    priority?: 'low' | 'normal' | 'high';
    interrupt?: boolean;
    onEnd?: () => void;
    onError?: (error: Error) => void;
  }): Promise<void> {
    if (!this.synthesis || !this.settings.enabled) {
      return;
    }

    return new Promise((resolve, reject) => {
      // Cancel current speech if interrupt is requested
      if (options?.interrupt && this.synthesis!.speaking) {
        this.synthesis!.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice settings
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;
      utterance.lang = this.settings.language;

      // Set voice if specified
      if (this.settings.voice_name) {
        const voices = this.synthesis!.getVoices();
        const selectedVoice = voices.find(voice => voice.name === this.settings.voice_name);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => {
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        const error = new Error(`Speech synthesis error: ${event.error}`);
        options?.onError?.(error);
        reject(error);
      };

      // Handle priority queuing
      if (options?.priority === 'high') {
        this.synthesis!.cancel();
      }

      this.synthesis!.speak(utterance);
    });
  }

  async speakInstruction(instruction: string, stepNumber: number): Promise<void> {
    const text = `Step ${stepNumber}: ${instruction}`;
    await this.speak(text, { priority: 'normal' });
  }

  async speakTimer(timerName: string, timeRemaining: string): Promise<void> {
    const text = `Timer ${timerName}: ${timeRemaining} remaining`;
    await this.speak(text, { priority: 'high', interrupt: true });
  }

  async speakTimerComplete(timerName: string): Promise<void> {
    const text = `Timer ${timerName} is complete!`;
    await this.speak(text, { priority: 'high', interrupt: true });
  }

  async speakHelp(): Promise<void> {
    const helpText = `
      Available voice commands:
      Say "next step" to continue,
      "previous step" to go back,
      "repeat" to hear again,
      "pause" to stop,
      "timer" to set a timer,
      "ingredients" for ingredients list,
      "nutrition" for nutritional info,
      or "finish" when done.
    `;
    await this.speak(helpText, { priority: 'normal' });
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.recognition) {
      this.recognition.lang = this.settings.language;
    }
  }

  isSupported(): boolean {
    return !!(
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
      'speechSynthesis' in window
    );
  }

  getStatus(): {
    isListening: boolean;
    isInitialized: boolean;
    isSupported: boolean;
    isSpeaking: boolean;
  } {
    return {
      isListening: this.isListening,
      isInitialized: this.isInitialized,
      isSupported: this.isSupported(),
      isSpeaking: this.synthesis?.speaking || false
    };
  }

  destroy(): void {
    this.stopListening();
    if (this.synthesis?.speaking) {
      this.synthesis.cancel();
    }
    this.isInitialized = false;
  }
}

// Utility functions
export const formatTimeForSpeech = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0 && remainingSeconds > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
  }
};

export const createDefaultVoiceSettings = (): VoiceSettings => ({
  enabled: true,
  language: 'en-US',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  auto_advance: false,
  confirmation_required: true
});

// Global voice service instance
let voiceServiceInstance: VoiceService | null = null;

export const getVoiceService = (settings?: VoiceSettings): VoiceService => {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(settings || createDefaultVoiceSettings());
  }
  return voiceServiceInstance;
};

export const destroyVoiceService = (): void => {
  if (voiceServiceInstance) {
    voiceServiceInstance.destroy();
    voiceServiceInstance = null;
  }
};