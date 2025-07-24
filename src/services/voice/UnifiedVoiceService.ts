/**
 * Unified Voice Service for KeCarajoComer
 * Consolidates all voice-related functionality into a single, cohesive service
 */

import { EventEmitter } from 'events';

import {
  VoiceServiceConfig,
  VoiceCommand,
  VoiceIntent,
  VoiceServiceStatus,
  VoiceAnalytics,
  PlatformVoiceCapabilities,
  VoiceServiceError,
  VoiceErrorCode,
  TTSOptions,
  VoiceFeedbackSound,
} from './types';
import { VoiceFeedbackManager } from './VoiceFeedbackManager';
import { SmartCommandParser } from './SmartCommandParser';
import { ConversationContextManager } from './ConversationContextManager';
import { WakeWordDetectionService } from './WakeWordDetectionService';
import { VoiceAnalyticsTracker } from './VoiceAnalyticsTracker';

export class UnifiedVoiceService extends EventEmitter {
  private static instance: UnifiedVoiceService;
  
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private feedbackManager: VoiceFeedbackManager;
  private parser: SmartCommandParser;
  private contextManager: ConversationContextManager;
  private wakeWordService: WakeWordDetectionService;
  private analyticsTracker: VoiceAnalyticsTracker;
  
  private config: Required<VoiceServiceConfig>;
  private isListening = false;
  private isProcessing = false;
  private isSpeaking = false;
  private abortController: AbortController | null = null;

  private constructor(config: VoiceServiceConfig = {}) {
    super();
    
    this.config = {
      language: 'es-MX',
      continuous: false,
      interimResults: true,
      enableWakeWord: false,
      enableFeedback: true,
      enableOffline: false,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      ...config,
    };

    // Initialize sub-services
    this.feedbackManager = new VoiceFeedbackManager(this.config);
    this.parser = new SmartCommandParser(this.config);
    this.contextManager = new ConversationContextManager();
    this.wakeWordService = new WakeWordDetectionService(this.config);
    this.analyticsTracker = new VoiceAnalyticsTracker();

    // Initialize platform capabilities
    this.initializePlatformServices();
  }

  static getInstance(config?: VoiceServiceConfig): UnifiedVoiceService {
    if (!UnifiedVoiceService.instance) {
      UnifiedVoiceService.instance = new UnifiedVoiceService(config);
    }
    return UnifiedVoiceService.instance;
  }

  /**
   * Initialize platform-specific services
   */
  private initializePlatformServices(): void {
    if (typeof window === 'undefined') return;

    // Initialize speech recognition
    const SpeechRecognition = 
      window.SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.configureRecognition();
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }

    // Check offline capabilities
    if (this.config.enableOffline && this.recognition) {
      // Some browsers support offline recognition
      (this.recognition as any).continuous = true;
    }
  }

  /**
   * Configure speech recognition settings
   */
  private configureRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    // Set up event handlers
    this.recognition.onstart = () => this.handleRecognitionStart();
    this.recognition.onresult = (event) => this.handleRecognitionResult(event);
    this.recognition.onerror = (event) => this.handleRecognitionError(event);
    this.recognition.onend = () => this.handleRecognitionEnd();
    this.recognition.onspeechstart = () => this.emit('speechstart');
    this.recognition.onspeechend = () => this.emit('speechend');
  }

  /**
   * Start listening for voice input
   */
  async startListening(options: Partial<VoiceServiceConfig> = {}): Promise<VoiceCommand> {
    if (!this.isAvailable()) {
      throw new VoiceServiceError(
        'Voice recognition not supported',
        'NOT_SUPPORTED'
      );
    }

    if (this.isListening) {
      throw new VoiceServiceError(
        'Already listening',
        'AUDIO_ERROR'
      );
    }

    // Merge options with current config
    const prevConfig = { ...this.config };
    this.config = { ...this.config, ...options };

    // Reconfigure if needed
    if (options.language && options.language !== prevConfig.language) {
      this.configureRecognition();
    }

    this.isListening = true;
    this.abortController = new AbortController();

    // Play start sound
    if (this.config.enableFeedback) {
      await this.feedbackManager.playSound('start');
    }

    return new Promise((resolve, reject) => {
      let finalCommand: VoiceCommand | null = null;

      const cleanup = () => {
        this.removeListener('result', handleResult);
        this.removeListener('error', handleError);
        this.abortController = null;
      };

      const handleResult = (command: VoiceCommand) => {
        if (!this.config.continuous) {
          finalCommand = command;
          this.stop();
          cleanup();
          resolve(command);
        } else {
          this.emit('command', command);
        }
      };

      const handleError = (error: Error) => {
        cleanup();
        reject(error);
      };

      this.once('result', handleResult);
      this.once('error', handleError);

      // Handle abort
      this.abortController.signal.addEventListener('abort', () => {
        cleanup();
        reject(new VoiceServiceError('Aborted', 'ABORTED'));
      });

      try {
        this.recognition!.start();
      } catch (error: unknown) {
        this.isListening = false;
        cleanup();
        reject(new VoiceServiceError(
          'Failed to start recognition',
          'AUDIO_ERROR',
          error
        ));
      }
    });
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Abort current operation
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.stop();
  }

  /**
   * Speak text using TTS
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    if (this.isSpeaking) {
      // Cancel current speech
      this.synthesis.cancel();
    }

    return this.feedbackManager.speak(text, options);
  }

  /**
   * Play feedback sound
   */
  async playSound(sound: VoiceFeedbackSound['name'], volume?: number): Promise<void> {
    if (this.config.enableFeedback) {
      return this.feedbackManager.playSound(sound, volume);
    }
  }

  /**
   * Execute a voice command
   */
  async executeCommand(command: VoiceCommand): Promise<void> {
    this.isProcessing = true;
    
    try {
      // Track analytics
      this.analyticsTracker.trackCommand(command);

      // Add to conversation context
      this.contextManager.addUserCommand(command);

      // Emit for external handlers
      this.emit('executed', command);

      // Handle built-in commands
      await this.handleBuiltInCommand(command);

    } catch (error: unknown) {
      console.error('Error executing command:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Handle built-in commands
   */
  private async handleBuiltInCommand(command: VoiceCommand): Promise<void> {
    switch (command.intent) {
      case 'timer':
        // Timer commands handled by cooking assistant
        break;
      case 'navigate':
        // Navigation handled by router
        break;
      case 'action':
        // General actions
        break;
      default:
        // Custom handling
        break;
    }
  }

  /**
   * Handle recognition start
   */
  private handleRecognitionStart(): void {
    this.emit('start');
    this.analyticsTracker.startSession();
  }

  /**
   * Handle recognition result
   */
  private async handleRecognitionResult(event: SpeechRecognitionEvent): Promise<void> {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        finalTranscript += transcript + ' ';

        // Check for wake word
        if (this.config.enableWakeWord && 
            this.wakeWordService.detect(transcript)) {
          this.emit('wakeword', { transcript });
          continue;
        }

        // Parse command
        try {
          const command = await this.parseTranscript(transcript, result);
          
          if (command.confidence >= this.config.confidenceThreshold) {
            this.emit('result', command);
          } else {
            console.warn('Low confidence command:', command);
          }
        } catch (error: unknown) {
          console.error('Error parsing command:', error);
          this.emit('error', new VoiceServiceError(
            'Failed to parse command',
            'PARSING_ERROR',
            error
          ));
        }
      } else {
        interimTranscript += transcript;
        this.emit('interim', { transcript: interimTranscript });
      }
    }
  }

  /**
   * Parse transcript into command
   */
  private async parseTranscript(
    transcript: string, 
    result: SpeechRecognitionResult
  ): Promise<VoiceCommand> {
    // Get alternatives
    const alternatives = [];
    for (let i = 1; i < Math.min(result.length, this.config.maxAlternatives); i++) {
      alternatives.push({
        transcript: result[i].transcript,
        confidence: result[i].confidence || 0,
      });
    }

    // Parse with context
    const context = this.contextManager.getContext();
    const parsed = await this.parser.parse(transcript, { context });

    // Build command
    const command: VoiceCommand = {
      intent: this.mapToIntent(parsed.action),
      entity: parsed.target || '',
      parameters: {
        ...parsed.parameters,
        entities: parsed.entities,
      },
      confidence: result[0].confidence || parsed.confidence,
      transcript,
      context,
      alternatives,
    };

    return command;
  }

  /**
   * Map parsed action to intent
   */
  private mapToIntent(action: string): VoiceIntent {
    const intentMap: Record<string, VoiceIntent> = {
      'add': 'add',
      'agregar': 'add',
      'añadir': 'add',
      'search': 'search',
      'buscar': 'search',
      'encontrar': 'search',
      'navigate': 'navigate',
      'ir': 'navigate',
      'abrir': 'navigate',
      'timer': 'timer',
      'temporizador': 'timer',
      'recipe': 'recipe',
      'receta': 'recipe',
      'command': 'command',
      'comando': 'command',
    };

    return intentMap[action.toLowerCase()] || 'unknown';
  }

  /**
   * Handle recognition error
   */
  private handleRecognitionError(event: SpeechRecognitionError): void {
    const errorMap: Record<string, VoiceErrorCode> = {
      'not-allowed': 'PERMISSION_DENIED',
      'network': 'NETWORK_ERROR',
      'no-speech': 'TIMEOUT',
      'aborted': 'ABORTED',
      'audio-capture': 'AUDIO_ERROR',
    };

    const code = errorMap[event.error] || 'UNKNOWN';
    const error = new VoiceServiceError(
      `Speech recognition error: ${event.error}`,
      code
    );

    this.emit('error', error);
    this.isListening = false;

    if (this.config.enableFeedback) {
      this.feedbackManager.playSound('error');
    }
  }

  /**
   * Handle recognition end
   */
  private handleRecognitionEnd(): void {
    this.isListening = false;
    this.emit('end');

    if (this.config.enableFeedback) {
      this.feedbackManager.playSound('end');
    }

    this.analyticsTracker.endSession();
  }

  /**
   * Get platform capabilities
   */
  getCapabilities(): PlatformVoiceCapabilities {
    return {
      speechRecognition: !!this.recognition,
      speechSynthesis: !!this.synthesis,
      continuousRecognition: !!(this.recognition as any)?.continuous,
      offlineRecognition: false, // Most browsers don't support this yet
      wakeWordDetection: true,
      customVoices: !!this.synthesis,
      audioFeedback: true,
    };
  }

  /**
   * Get current status
   */
  getStatus(): VoiceServiceStatus {
    return {
      isAvailable: this.isAvailable(),
      isListening: this.isListening,
      isProcessing: this.isProcessing,
      isSpeaking: this.isSpeaking,
      currentLanguage: this.config.language,
      feedbackEnabled: this.config.enableFeedback,
      wakeWordEnabled: this.config.enableWakeWord,
      offlineModeEnabled: this.config.enableOffline,
    };
  }

  /**
   * Get analytics
   */
  getAnalytics(): VoiceAnalytics {
    return this.analyticsTracker.getAnalytics();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoiceServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update sub-services
    this.feedbackManager.updateConfig(this.config);
    this.parser.updateConfig(this.config);
    this.wakeWordService.updateConfig(this.config);
    
    // Reconfigure recognition if needed
    if (this.recognition) {
      this.configureRecognition();
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!this.recognition;
  }

  /**
   * Reset service
   */
  reset(): void {
    this.stop();
    this.contextManager.clear();
    this.analyticsTracker.reset();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
    this.feedbackManager.destroy();
    this.contextManager.clear();
    this.analyticsTracker.reset();
  }
}

// Export singleton getter
export const getVoiceService = (config?: VoiceServiceConfig) => 
  UnifiedVoiceService.getInstance(config);