/**
 * Voice Feedback Manager
 * Handles TTS, audio feedback, and sound effects
 */

import { TTSOptions, VoiceFeedbackSound, VoiceServiceConfig } from './types';

export class VoiceFeedbackManager {
  private synthesis: SpeechSynthesis | null = null;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private voices: SpeechSynthesisVoice[] = [];
  private config: Required<VoiceServiceConfig>;
  private utteranceQueue: SpeechSynthesisUtterance[] = [];
  private isSpeaking = false;

  constructor(config: Required<VoiceServiceConfig>) {
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      // Handle voice list changes
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    }

    // Initialize audio context for sound effects
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.preloadSounds();
    }
  }

  private loadVoices(): void {
    if (!this.synthesis) return;
    
    this.voices = this.synthesis.getVoices();

  }

  private async preloadSounds(): Promise<void> {
    if (!this.audioContext) return;

    const soundUrls: Record<VoiceFeedbackSound['name'], string> = {
      start: '/sounds/voice-start.mp3',
      end: '/sounds/voice-end.mp3',
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      notification: '/sounds/notification.mp3',
    };

    for (const [name, url] of Object.entries(soundUrls)) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds.set(name, audioBuffer);
      } catch (error: unknown) {
        console.warn(`Failed to load sound: ${name}`, error);
      }
    }
  }

  /**
   * Speak text using TTS
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    if (!this.config.enableFeedback && options.priority !== 'high') {
      return;
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      utterance.lang = options.language || this.config.language;
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Select voice
      if (options.voice) {
        const voice = this.voices.find(v => v.name === options.voice);
        if (voice) utterance.voice = voice;
      } else {
        // Try to find a voice for the language
        const voice = this.voices.find(v => v.lang.startsWith(utterance.lang));
        if (voice) utterance.voice = voice;
      }

      // Handle events
      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.processQueue();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.processQueue();
        reject(new Error(`TTS error: ${event.error}`));
      };

      // Add to queue or speak immediately
      if (options.priority === 'high') {
        // Cancel current and speak immediately
        this.synthesis.cancel();
        this.utteranceQueue = [];
        this.synthesis.speak(utterance);
      } else if (this.isSpeaking) {
        // Add to queue
        this.utteranceQueue.push(utterance);
      } else {
        // Speak immediately
        this.synthesis.speak(utterance);
      }
    });
  }

  /**
   * Process utterance queue
   */
  private processQueue(): void {
    if (!this.synthesis || this.utteranceQueue.length === 0) return;

    const utterance = this.utteranceQueue.shift();
    if (utterance) {
      this.synthesis.speak(utterance);
    }
  }

  /**
   * Play sound effect
   */
  async playSound(name: VoiceFeedbackSound['name'], volume: number = 0.5): Promise<void> {
    if (!this.audioContext || !this.config.enableFeedback) return;

    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.warn(`Sound not loaded: ${name}`);
      return;
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create source and gain nodes
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      // Configure
      source.buffer = buffer;
      gainNode.gain.value = volume;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play
      source.start(0);

      // Clean up when done
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
    } catch (error: unknown) {
      console.error(`Error playing sound: ${name}`, error);
    }
  }

  /**
   * Generate beep sound
   */
  async beep(frequency: number = 440, duration: number = 200, volume: number = 0.3): Promise<void> {
    if (!this.audioContext || !this.config.enableFeedback) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.value = volume;
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error: unknown) {
      console.error('Error generating beep:', error);
    }
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Get voices for a specific language
   */
  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith(language));
  }

  /**
   * Cancel all speech
   */
  cancel(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.utteranceQueue = [];
      this.isSpeaking = false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Required<VoiceServiceConfig>): void {
    this.config = config;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.cancel();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}