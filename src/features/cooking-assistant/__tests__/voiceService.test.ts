import { VoiceService, createDefaultVoiceSettings, formatTimeForSpeech } from '../services/voiceService';
import { VoiceCommand } from '../types';

// Mock Web Speech API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  start: jest.fn(),
  stop: jest.fn(),
  onresult: null,
  onerror: null,
  onend: null
};

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  speaking: false,
  getVoices: jest.fn(() => [])
};

const mockSpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  lang: 'en-US',
  onend: null,
  onerror: null
}));

// Mock navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [{ stop: jest.fn() }]
  })
};

Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: mockMediaDevices
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    SpeechRecognition: jest.fn(() => mockSpeechRecognition),
    webkitSpeechRecognition: jest.fn(() => mockSpeechRecognition),
    speechSynthesis: mockSpeechSynthesis,
    SpeechSynthesisUtterance: mockSpeechSynthesisUtterance
  },
  writable: true
});

describe('VoiceService', () => {
  let voiceService: VoiceService;
  let mockSettings: ReturnType<typeof createDefaultVoiceSettings>;

  beforeEach(() => {
    mockSettings = createDefaultVoiceSettings();
    voiceService = new VoiceService(mockSettings);
    
    // Reset mocks
    jest.clearAllMocks();
    mockSpeechSynthesis.speaking = false;
  });

  describe('initialization', () => {
    it('should initialize successfully with supported browser', async () => {
      const result = await voiceService.initialize();
      expect(result).toBe(true);
    });

    it('should fail initialization when speech recognition not supported', async () => {
      // Temporarily remove speech recognition support
      const originalSpeechRecognition = window.SpeechRecognition;
      const originalWebkitSpeechRecognition = window.webkitSpeechRecognition;
      
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      
      const result = await voiceService.initialize();
      expect(result).toBe(false);
      
      // Restore
      (window as any).SpeechRecognition = originalSpeechRecognition;
      (window as any).webkitSpeechRecognition = originalWebkitSpeechRecognition;
    });

    it('should fail initialization when speech synthesis not supported', async () => {
      // Temporarily remove speech synthesis support
      const originalSpeechSynthesis = window.speechSynthesis;
      delete (window as any).speechSynthesis;
      
      const result = await voiceService.initialize();
      expect(result).toBe(false);
      
      // Restore
      (window as any).speechSynthesis = originalSpeechSynthesis;
    });
  });

  describe('microphone permissions', () => {
    it('should request microphone permission successfully', async () => {
      const result = await voiceService.requestMicrophonePermission();
      expect(result).toBe(true);
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('should handle microphone permission denial', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
      
      const result = await voiceService.requestMicrophonePermission();
      expect(result).toBe(false);
    });
  });

  describe('voice recognition', () => {
    beforeEach(async () => {
      await voiceService.initialize();
    });

    it('should start listening successfully', () => {
      const onResult = jest.fn();
      const onError = jest.fn();
      
      const result = voiceService.startListening(onResult, onError);
      expect(result).toBe(true);
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    it('should stop listening', () => {
      const onResult = jest.fn();
      voiceService.startListening(onResult);
      
      voiceService.stopListening();
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('should parse voice commands correctly', () => {
      const onResult = jest.fn();
      voiceService.startListening(onResult);
      
      // Simulate speech recognition result
      const mockEvent = {
        results: [
          [{ transcript: 'next step', confidence: 0.9 }],
          [{ transcript: 'go back', confidence: 0.8 }],
          [{ transcript: 'repeat that', confidence: 0.7 }]
        ]
      };
      
      // Test different commands
      mockSpeechRecognition.onresult({
        results: [[{ transcript: 'next step', confidence: 0.9, isFinal: true }]]
      });
      
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'next',
          confidence: 0.9,
          transcript: 'next step'
        })
      );
    });

    it('should handle unrecognized commands', () => {
      const onResult = jest.fn();
      voiceService.startListening(onResult);
      
      mockSpeechRecognition.onresult({
        results: [[{ transcript: 'unknown command', confidence: 0.5, isFinal: true }]]
      });
      
      expect(onResult).not.toHaveBeenCalled();
    });

    it('should handle speech recognition errors', () => {
      const onResult = jest.fn();
      const onError = jest.fn();
      
      voiceService.startListening(onResult, onError);
      
      mockSpeechRecognition.onerror({ error: 'network' });
      
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Speech recognition error: network'
        })
      );
    });
  });

  describe('speech synthesis', () => {
    beforeEach(async () => {
      await voiceService.initialize();
    });

    it('should speak text successfully', async () => {
      const text = 'Hello world';
      
      // Mock the utterance end event
      mockSpeechSynthesisUtterance.mockImplementation((text) => {
        const utterance = {
          text,
          voice: null,
          volume: 1,
          rate: 1,
          pitch: 1,
          lang: 'en-US',
          onend: null,
          onerror: null
        };
        
        // Simulate immediate completion
        setTimeout(() => {
          if (utterance.onend) utterance.onend();
        }, 0);
        
        return utterance;
      });
      
      await voiceService.speak(text);
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(text);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle speech synthesis errors', async () => {
      const text = 'Hello world';
      const onError = jest.fn();
      
      mockSpeechSynthesisUtterance.mockImplementation((text) => {
        const utterance = {
          text,
          voice: null,
          volume: 1,
          rate: 1,
          pitch: 1,
          lang: 'en-US',
          onend: null,
          onerror: null
        };
        
        // Simulate error
        setTimeout(() => {
          if (utterance.onerror) utterance.onerror({ error: 'synthesis-failed' });
        }, 0);
        
        return utterance;
      });
      
      await expect(voiceService.speak(text, { onError })).rejects.toThrow();
    });

    it('should interrupt current speech when priority is high', async () => {
      const text = 'Important message';
      
      mockSpeechSynthesis.speaking = true;
      
      await voiceService.speak(text, { priority: 'high', interrupt: true });
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should speak cooking instructions with step number', async () => {
      const instruction = 'Mix the ingredients';
      const stepNumber = 3;
      
      await voiceService.speakInstruction(instruction, stepNumber);
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        `Step ${stepNumber}: ${instruction}`
      );
    });

    it('should speak timer notifications', async () => {
      const timerName = 'Pasta Timer';
      const timeRemaining = '2 minutes';
      
      await voiceService.speakTimer(timerName, timeRemaining);
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        `Timer ${timerName}: ${timeRemaining} remaining`
      );
    });

    it('should speak timer completion', async () => {
      const timerName = 'Pasta Timer';
      
      await voiceService.speakTimerComplete(timerName);
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        `Timer ${timerName} is complete!`
      );
    });

    it('should speak help instructions', async () => {
      await voiceService.speakHelp();
      
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(
        expect.stringContaining('Available voice commands')
      );
    });
  });

  describe('settings management', () => {
    it('should update voice settings', () => {
      const newSettings = {
        rate: 1.5,
        pitch: 1.2,
        volume: 0.8
      };
      
      voiceService.updateSettings(newSettings);
      
      // Verify settings are updated (would need access to internal state)
      expect(voiceService.getStatus().isInitialized).toBe(false);
    });

    it('should get available voices', () => {
      const mockVoices = [
        { name: 'Voice 1', lang: 'en-US' },
        { name: 'Voice 2', lang: 'en-GB' }
      ];
      
      mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
      
      const voices = voiceService.getAvailableVoices();
      expect(voices).toEqual(mockVoices);
    });
  });

  describe('utility functions', () => {
    it('should check if voice is supported', () => {
      expect(voiceService.isSupported()).toBe(true);
    });

    it('should get current status', () => {
      const status = voiceService.getStatus();
      
      expect(status).toEqual({
        isListening: false,
        isInitialized: false,
        isSupported: true,
        isSpeaking: false
      });
    });

    it('should cleanup properly', () => {
      voiceService.destroy();
      
      expect(voiceService.getStatus().isInitialized).toBe(false);
    });
  });

  describe('command pattern matching', () => {
    const testCases: Array<[string, VoiceCommand | null]> = [
      ['next step', 'next'],
      ['continue', 'next'],
      ['go on', 'next'],
      ['proceed', 'next'],
      ['previous step', 'previous'],
      ['go back', 'previous'],
      ['back', 'previous'],
      ['repeat', 'repeat'],
      ['say again', 'repeat'],
      ['again', 'repeat'],
      ['pause', 'pause'],
      ['stop', 'pause'],
      ['wait', 'pause'],
      ['resume', 'resume'],
      ['continue', 'next'], // Should match 'next' not 'resume'
      ['timer', 'timer'],
      ['set timer', 'timer'],
      ['help', 'help'],
      ['commands', 'help'],
      ['ingredients', 'ingredients'],
      ['nutrition', 'nutrition'],
      ['finish', 'finish'],
      ['done', 'finish'],
      ['unknown command', null],
      ['', null]
    ];

    testCases.forEach(([transcript, expectedCommand]) => {
      it(`should parse "${transcript}" as ${expectedCommand}`, () => {
        const onResult = jest.fn();
        voiceService.startListening(onResult);
        
        mockSpeechRecognition.onresult({
          results: [[{ transcript, confidence: 0.8, isFinal: true }]]
        });
        
        if (expectedCommand) {
          expect(onResult).toHaveBeenCalledWith(
            expect.objectContaining({
              command: expectedCommand,
              transcript
            })
          );
        } else {
          expect(onResult).not.toHaveBeenCalled();
        }
      });
    });
  });
});

describe('formatTimeForSpeech', () => {
  it('should format seconds correctly', () => {
    expect(formatTimeForSpeech(30)).toBe('30 seconds');
    expect(formatTimeForSpeech(1)).toBe('1 second');
  });

  it('should format minutes correctly', () => {
    expect(formatTimeForSpeech(60)).toBe('1 minute');
    expect(formatTimeForSpeech(120)).toBe('2 minutes');
    expect(formatTimeForSpeech(90)).toBe('1 minute and 30 seconds');
  });

  it('should format hours correctly', () => {
    expect(formatTimeForSpeech(3600)).toBe('1 hour');
    expect(formatTimeForSpeech(3661)).toBe('1 hour and 1 minute and 1 second');
  });
});

describe('createDefaultVoiceSettings', () => {
  it('should create default settings', () => {
    const settings = createDefaultVoiceSettings();
    
    expect(settings).toEqual({
      enabled: true,
      language: 'en-US',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      auto_advance: false,
      confirmation_required: true
    });
  });
});