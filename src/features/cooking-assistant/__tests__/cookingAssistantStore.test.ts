import { renderHook, act } from '@testing-library/react';

import { useCookingAssistantStore } from '../store/cookingAssistantStore';
import { VoiceService } from '../services/voiceService';
import { TimerService } from '../services/timerService';
import { MeasurementService } from '../services/measurementService';

// Mock services
jest.mock('../services/voiceService');
jest.mock('../services/timerService');
jest.mock('../services/measurementService');

const mockVoiceService = {
  initialize: jest.fn().mockResolvedValue(true),
  requestMicrophonePermission: jest.fn().mockResolvedValue(true),
  startListening: jest.fn().mockReturnValue(true),
  stopListening: jest.fn(),
  speak: jest.fn().mockResolvedValue(undefined),
  speakInstruction: jest.fn().mockResolvedValue(undefined),
  speakHelp: jest.fn().mockResolvedValue(undefined),
  speakTimerComplete: jest.fn().mockResolvedValue(undefined),
  updateSettings: jest.fn(),
  destroy: jest.fn()
};

const mockTimerService = {
  createTimer: jest.fn().mockReturnValue({
    id: 'timer-1',
    name: 'Test Timer',
    duration_seconds: 300,
    remaining_seconds: 300,
    state: 'idle',
    created_at: '2023-01-01T00:00:00Z'
  }),
  startTimer: jest.fn().mockReturnValue(true),
  pauseTimer: jest.fn().mockReturnValue(true),
  resumeTimer: jest.fn().mockReturnValue(true),
  stopTimer: jest.fn().mockReturnValue(true),
  deleteTimer: jest.fn().mockReturnValue(true),
  getAllTimers: jest.fn().mockReturnValue([]),
  destroy: jest.fn()
};

const mockMeasurementService = {
  convertMeasurement: jest.fn().mockReturnValue({
    from_amount: 1,
    from_unit: 'cup',
    to_unit: 'ml',
    converted_amount: 236.588,
    conversion_factor: 236.588
  }),
  scaleRecipe: jest.fn().mockReturnValue([]),
  clearCache: jest.fn()
};

// Mock the service instances
(VoiceService as jest.Mock).mockImplementation(() => mockVoiceService);
(TimerService as jest.Mock).mockImplementation(() => mockTimerService);
(MeasurementService as jest.Mock).mockImplementation(() => mockMeasurementService);

jest.mock('../services/timerService', () => ({
  TimerService: jest.fn(() => mockTimerService),
  getTimerService: jest.fn(() => mockTimerService)
}));

jest.mock('../services/measurementService', () => ({
  MeasurementService: jest.fn(() => mockMeasurementService),
  getMeasurementService: jest.fn(() => mockMeasurementService)
}));

describe('useCookingAssistantStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      expect(result.current.currentSession).toBeNull();
      expect(result.current.isSessionActive).toBe(false);
      expect(result.current.currentRecipe).toBeNull();
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.steps).toEqual([]);
      expect(result.current.isVoiceEnabled).toBe(false);
      expect(result.current.isListening).toBe(false);
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.timers).toEqual([]);
      expect(result.current.activeTimers).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.insights).toEqual([]);
      expect(result.current.measurementSystem).toBe('metric');
    });
  });

  describe('session management', () => {
    const mockRecipe = {
      id: 'recipe-1',
      title: 'Test Recipe',
      instructions: [
        {
          step_number: 1,
          text: 'Mix ingredients',
          time_minutes: 5
        },
        {
          step_number: 2,
          text: 'Bake in oven',
          time_minutes: 25
        }
      ]
    };

    it('should start session successfully', async () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      // Set current recipe
      act(() => {
        result.current.currentRecipe = mockRecipe as any;
      });
      
      await act(async () => {
        await result.current.startSession({
          recipe_id: 'recipe-1',
          mode: 'guided',
          voice_enabled: false,
          voice_lang: 'en-US',
          preferences: {}
        });
      });
      
      expect(result.current.isSessionActive).toBe(true);
      expect(result.current.currentSession).not.toBeNull();
      expect(result.current.steps).toHaveLength(2);
      expect(result.current.currentStepIndex).toBe(0);
    });

    it('should handle session start with voice enabled', async () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.currentRecipe = mockRecipe as any;
      });
      
      await act(async () => {
        await result.current.startSession({
          recipe_id: 'recipe-1',
          mode: 'guided',
          voice_enabled: true,
          voice_lang: 'en-US',
          preferences: {}
        });
      });
      
      expect(result.current.isVoiceEnabled).toBe(true);
      expect(mockVoiceService.initialize).toHaveBeenCalled();
    });

    it('should end session', async () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      // Start session first
      act(() => {
        result.current.currentRecipe = mockRecipe as any;
      });
      
      await act(async () => {
        await result.current.startSession({
          recipe_id: 'recipe-1',
          mode: 'guided',
          voice_enabled: false,
          voice_lang: 'en-US',
          preferences: {}
        });
      });
      
      // End session
      await act(async () => {
        await result.current.endSession();
      });
      
      expect(result.current.isSessionActive).toBe(false);
      expect(result.current.currentSession?.completed_at).toBeDefined();
    });

    it('should pause and resume session', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.currentSession = {
          id: 'session-1',
          recipe_id: 'recipe-1',
          user_id: 'user-1',
          mode: 'guided',
          steps: [],
          current_step_index: 0,
          timers: [],
          voice_enabled: false,
          voice_lang: 'en-US',
          started_at: '2023-01-01T00:00:00Z'
        };
      });
      
      // Pause
      act(() => {
        result.current.pauseSession();
      });
      
      expect(result.current.currentSession?.paused_at).toBeDefined();
      
      // Resume
      act(() => {
        result.current.resumeSession();
      });
      
      expect(result.current.currentSession?.paused_at).toBeUndefined();
    });
  });

  describe('step navigation', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.steps = [
          {
            id: 'step-1',
            step_number: 1,
            instruction: 'Mix ingredients',
            status: 'active'
          },
          {
            id: 'step-2',
            step_number: 2,
            instruction: 'Bake in oven',
            status: 'pending'
          }
        ] as any;
      });
    });

    it('should navigate to next step', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.nextStep();
      });
      
      expect(result.current.currentStepIndex).toBe(1);
      expect(result.current.stepHistory).toContain(0);
    });

    it('should navigate to previous step', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      // Go to step 2 first
      act(() => {
        result.current.nextStep();
      });
      
      // Go back to step 1
      act(() => {
        result.current.previousStep();
      });
      
      expect(result.current.currentStepIndex).toBe(0);
    });

    it('should not navigate past boundaries', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      // Try to go to previous step when at first step
      act(() => {
        result.current.previousStep();
      });
      
      expect(result.current.currentStepIndex).toBe(0);
      
      // Go to last step
      act(() => {
        result.current.nextStep();
      });
      
      // Try to go to next step when at last step
      act(() => {
        result.current.nextStep();
      });
      
      expect(result.current.currentStepIndex).toBe(1);
    });

    it('should complete step', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.completeStep(0, 'Completed successfully');
      });
      
      expect(result.current.steps[0].status).toBe('completed');
      expect(result.current.steps[0].notes).toBe('Completed successfully');
      expect(result.current.steps[0].completed_at).toBeDefined();
    });

    it('should skip step', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.skipStep(0, 'Skipped due to missing ingredient');
      });
      
      expect(result.current.steps[0].status).toBe('skipped');
      expect(result.current.steps[0].notes).toBe('Skipped due to missing ingredient');
    });
  });

  describe('voice functionality', () => {
    it('should initialize voice service', async () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      await act(async () => {
        const success = await result.current.initializeVoice();
        expect(success).toBe(true);
      });
      
      expect(mockVoiceService.initialize).toHaveBeenCalled();
      expect(mockVoiceService.requestMicrophonePermission).toHaveBeenCalled();
      expect(result.current.isVoiceEnabled).toBe(true);
    });

    it('should start and stop listening', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.voiceService = mockVoiceService as any;
      });
      
      // Start listening
      act(() => {
        const success = result.current.startListening();
        expect(success).toBe(true);
      });
      
      expect(mockVoiceService.startListening).toHaveBeenCalled();
      expect(result.current.isListening).toBe(true);
      
      // Stop listening
      act(() => {
        result.current.stopListening();
      });
      
      expect(mockVoiceService.stopListening).toHaveBeenCalled();
      expect(result.current.isListening).toBe(false);
    });

    it('should speak text', async () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.voiceService = mockVoiceService as any;
      });
      
      await act(async () => {
        await result.current.speakText('Hello world');
      });
      
      expect(mockVoiceService.speak).toHaveBeenCalledWith('Hello world', undefined);
    });

    it('should handle voice commands', async () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.steps = [
          { id: 'step-1', step_number: 1, instruction: 'Mix ingredients', status: 'active' }
        ] as any;
      });
      
      await act(async () => {
        await result.current.handleVoiceCommand({
          command: 'next',
          confidence: 0.9,
          transcript: 'next step',
          timestamp: '2023-01-01T00:00:00Z'
        });
      });
      
      expect(result.current.lastVoiceCommand?.command).toBe('next');
    });

    it('should update voice settings', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.voiceService = mockVoiceService as any;
      });
      
      act(() => {
        result.current.updateVoiceSettings({
          rate: 1.5,
          pitch: 1.2
        });
      });
      
      expect(result.current.preferences.voice_settings.rate).toBe(1.5);
      expect(result.current.preferences.voice_settings.pitch).toBe(1.2);
      expect(mockVoiceService.updateSettings).toHaveBeenCalledWith({
        rate: 1.5,
        pitch: 1.2
      });
    });
  });

  describe('timer functionality', () => {
    it('should create timer', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        const timerId = result.current.createTimer({
          name: 'Test Timer',
          duration_minutes: 5
        });
        
        expect(timerId).toBe('timer-1');
        expect(mockTimerService.createTimer).toHaveBeenCalledWith('Test Timer', 300, undefined);
      });
    });

    it('should start timer', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        const success = result.current.startTimer('timer-1');
        expect(success).toBe(true);
      });
      
      expect(mockTimerService.startTimer).toHaveBeenCalledWith(
        'timer-1',
        expect.any(Function),
        expect.any(Function)
      );
      expect(result.current.activeTimers).toContain('timer-1');
    });

    it('should pause, resume, and stop timer', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.pauseTimer('timer-1');
      });
      expect(mockTimerService.pauseTimer).toHaveBeenCalledWith('timer-1');
      
      act(() => {
        result.current.resumeTimer('timer-1');
      });
      expect(mockTimerService.resumeTimer).toHaveBeenCalledWith('timer-1');
      
      act(() => {
        result.current.stopTimer('timer-1');
      });
      expect(mockTimerService.stopTimer).toHaveBeenCalledWith('timer-1');
    });

    it('should delete timer', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.activeTimers = ['timer-1'];
      });
      
      act(() => {
        const success = result.current.deleteTimer('timer-1');
        expect(success).toBe(true);
      });
      
      expect(mockTimerService.deleteTimer).toHaveBeenCalledWith('timer-1');
      expect(result.current.activeTimers).not.toContain('timer-1');
    });
  });

  describe('measurement functionality', () => {
    it('should convert measurements', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        const conversion = result.current.convertMeasurement(1, 'cup', 'ml', 'flour');
        
        expect(conversion).toEqual({
          from_amount: 1,
          from_unit: 'cup',
          to_unit: 'ml',
          converted_amount: 236.588,
          conversion_factor: 236.588
        });
      });
      
      expect(mockMeasurementService.convertMeasurement).toHaveBeenCalledWith(
        1, 'cup', 'ml', 'flour'
      );
    });

    it('should scale recipe', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.currentRecipe = {
          ingredients: [
            { name: 'flour', quantity: 2, unit: 'cups' }
          ],
          servings: 4
        } as any;
      });
      
      act(() => {
        result.current.scaleRecipe(4, 8);
      });
      
      expect(mockMeasurementService.scaleRecipe).toHaveBeenCalledWith(
        4, 8, [{ name: 'flour', quantity: 2, unit: 'cups' }]
      );
    });

    it('should switch measurement system', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.switchMeasurementSystem('imperial');
      });
      
      expect(result.current.measurementSystem).toBe('imperial');
      expect(result.current.preferences.measurement_system).toBe('imperial');
    });
  });

  describe('insights and suggestions', () => {
    it('should add and dismiss suggestions', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      const suggestion = {
        id: 'suggestion-1',
        type: 'ingredient_substitute',
        title: 'Substitute butter',
        description: 'Use oil instead',
        confidence_score: 0.8
      } as any;
      
      act(() => {
        result.current.addSuggestion(suggestion);
      });
      
      expect(result.current.suggestions).toContain(suggestion);
      
      act(() => {
        result.current.dismissSuggestion('suggestion-1');
      });
      
      expect(result.current.suggestions).not.toContain(suggestion);
    });

    it('should add and dismiss insights', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      const insight = {
        id: 'insight-1',
        type: 'tip',
        title: 'Cooking tip',
        message: 'Mix gently',
        priority: 'medium',
        dismissible: true
      } as any;
      
      act(() => {
        result.current.addInsight(insight);
      });
      
      expect(result.current.insights).toContain(insight);
      
      act(() => {
        result.current.dismissInsight('insight-1');
      });
      
      expect(result.current.insights).not.toContain(insight);
    });

    it('should auto-dismiss insights', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      jest.useFakeTimers();
      
      const insight = {
        id: 'insight-1',
        type: 'tip',
        title: 'Cooking tip',
        message: 'Mix gently',
        priority: 'medium',
        dismissible: true,
        auto_dismiss_seconds: 5
      } as any;
      
      act(() => {
        result.current.addInsight(insight);
      });
      
      expect(result.current.insights).toContain(insight);
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(result.current.insights).not.toContain(insight);
      
      jest.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      const error = {
        type: 'voice',
        message: 'Voice recognition failed',
        timestamp: '2023-01-01T00:00:00Z'
      } as any;
      
      act(() => {
        result.current.setError(error);
      });
      
      expect(result.current.error).toBe(error);
      
      act(() => {
        result.current.clearErrors();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('preferences', () => {
    it('should update preferences', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.updatePreferences({
          show_tips: false,
          auto_start_timers: false
        });
      });
      
      expect(result.current.preferences.show_tips).toBe(false);
      expect(result.current.preferences.auto_start_timers).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup properly', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      act(() => {
        result.current.voiceService = mockVoiceService as any;
        result.current.isSessionActive = true;
        result.current.activeTimers = ['timer-1'];
      });
      
      act(() => {
        result.current.cleanup();
      });
      
      expect(result.current.currentSession).toBeNull();
      expect(result.current.isSessionActive).toBe(false);
      expect(result.current.voiceService).toBeNull();
      expect(result.current.activeTimers).toEqual([]);
      expect(mockVoiceService.destroy).toHaveBeenCalled();
      expect(mockTimerService.destroy).toHaveBeenCalled();
    });
  });

  describe('analytics tracking', () => {
    it('should track step completion', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      act(() => {
        result.current.trackStepCompletion('step-1', 30000);
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Step completed:', 'step-1', 30000);
      
      consoleSpy.mockRestore();
    });

    it('should track voice commands', () => {
      const { result } = renderHook(() => useCookingAssistantStore());
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const command = {
        command: 'next',
        confidence: 0.9,
        transcript: 'next step',
        timestamp: '2023-01-01T00:00:00Z'
      } as any;
      
      act(() => {
        result.current.trackVoiceCommand(command);
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Voice command:', command);
      
      consoleSpy.mockRestore();
    });
  });
});

describe('store persistence', () => {
  it('should persist preferences', () => {
    const { result } = renderHook(() => useCookingAssistantStore());
    
    act(() => {
      result.current.updatePreferences({
        measurement_system: 'imperial',
        temperature_unit: 'fahrenheit'
      });
    });
    
    // Create new instance to test persistence
    const { result: newResult } = renderHook(() => useCookingAssistantStore());
    
    expect(newResult.current.preferences.measurement_system).toBe('imperial');
    expect(newResult.current.preferences.temperature_unit).toBe('fahrenheit');
  });
});