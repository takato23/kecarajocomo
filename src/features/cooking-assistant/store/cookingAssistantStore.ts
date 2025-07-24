import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import {
  CookingAssistantSession,
  CookingStep,
  CookingTimer,
  VoiceCommandResult,
  CookingAssistantError,
  CookingAssistantPreferences,
  VoiceSettings,
  SmartSuggestion,
  CookingInsight,
  Recipe,
  MeasurementConversion,
  TimerFormData,
  CookingSessionFormData
} from '../types';
import { VoiceService, createDefaultVoiceSettings } from '../services/voiceService';
import { TimerService, getTimerService } from '../services/timerService';
import { MeasurementService, getMeasurementService } from '../services/measurementService';

interface CookingAssistantState {
  // Session state
  currentSession: CookingAssistantSession | null;
  isSessionActive: boolean;
  currentRecipe: Recipe | null;
  
  // Step management
  currentStepIndex: number;
  steps: CookingStep[];
  stepHistory: number[];
  
  // Voice state
  voiceService: VoiceService | null;
  isVoiceEnabled: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  lastVoiceCommand: VoiceCommandResult | null;
  voiceErrors: CookingAssistantError[];
  
  // Timer state
  timerService: TimerService;
  timers: CookingTimer[];
  activeTimers: string[];
  
  // Measurement state
  measurementService: MeasurementService;
  measurementSystem: 'metric' | 'imperial';
  temperatureUnit: 'celsius' | 'fahrenheit';
  conversions: MeasurementConversion[];
  
  // UI state
  isLoading: boolean;
  error: CookingAssistantError | null;
  suggestions: SmartSuggestion[];
  insights: CookingInsight[];
  showNutrition: boolean;
  showTips: boolean;
  
  // Preferences
  preferences: CookingAssistantPreferences;
  
  // Session actions
  startSession: (sessionData: CookingSessionFormData) => Promise<void>;
  endSession: () => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  updateSession: (updates: Partial<CookingAssistantSession>) => void;
  
  // Step navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  completeStep: (stepIndex: number, notes?: string) => void;
  skipStep: (stepIndex: number, reason?: string) => void;
  
  // Voice actions
  initializeVoice: () => Promise<boolean>;
  startListening: () => boolean;
  stopListening: () => void;
  handleVoiceCommand: (command: VoiceCommandResult) => Promise<void>;
  speakText: (text: string, options?: { priority?: 'low' | 'normal' | 'high' }) => Promise<void>;
  speakCurrentStep: () => Promise<void>;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  
  // Timer actions
  createTimer: (timerData: TimerFormData) => string;
  startTimer: (timerId: string) => boolean;
  pauseTimer: (timerId: string) => boolean;
  resumeTimer: (timerId: string) => boolean;
  stopTimer: (timerId: string) => boolean;
  deleteTimer: (timerId: string) => boolean;
  updateTimers: () => void;
  
  // Measurement actions
  convertMeasurement: (amount: number, fromUnit: string, toUnit: string, ingredient?: string) => MeasurementConversion;
  scaleRecipe: (originalServings: number, targetServings: number) => void;
  switchMeasurementSystem: (system: 'metric' | 'imperial') => void;
  
  // Utility actions
  addSuggestion: (suggestion: SmartSuggestion) => void;
  dismissSuggestion: (suggestionId: string) => void;
  addInsight: (insight: CookingInsight) => void;
  dismissInsight: (insightId: string) => void;
  setError: (error: CookingAssistantError | null) => void;
  clearErrors: () => void;
  updatePreferences: (preferences: Partial<CookingAssistantPreferences>) => void;
  
  // Analytics
  trackStepCompletion: (stepId: string, duration: number) => void;
  trackVoiceCommand: (command: VoiceCommandResult) => void;
  trackTimerUsage: (timerId: string, duration: number) => void;
  
  // Cleanup
  cleanup: () => void;
}

const defaultPreferences: CookingAssistantPreferences = {
  voice_settings: createDefaultVoiceSettings(),
  default_mode: 'guided',
  auto_start_timers: true,
  show_nutrition: true,
  nutrition_display: {
    per_serving: true,
    show_detailed: false,
    highlight_goals: true,
    show_warnings: true
  },
  measurement_system: 'metric',
  temperature_unit: 'celsius',
  confirm_step_completion: true,
  show_tips: true,
  large_text_mode: false,
  hands_free_mode: false
};

export const useCookingAssistantStore = create<CookingAssistantState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSession: null,
        isSessionActive: false,
        currentRecipe: null,
        
        currentStepIndex: 0,
        steps: [],
        stepHistory: [],
        
        voiceService: null,
        isVoiceEnabled: false,
        isListening: false,
        isSpeaking: false,
        lastVoiceCommand: null,
        voiceErrors: [],
        
        timerService: getTimerService(),
        timers: [],
        activeTimers: [],
        
        measurementService: getMeasurementService(),
        measurementSystem: 'metric',
        temperatureUnit: 'celsius',
        conversions: [],
        
        isLoading: false,
        error: null,
        suggestions: [],
        insights: [],
        showNutrition: true,
        showTips: true,
        
        preferences: defaultPreferences,
        
        // Session actions
        startSession: async (sessionData) => {
          set({ isLoading: true, error: null });
          
          try {
            // Create cooking steps from recipe
            const recipe = get().currentRecipe;
            if (!recipe) {
              throw new Error('No recipe selected');
            }
            
            const steps: CookingStep[] = recipe.instructions.map((instruction, index) => ({
              id: `step-${index}`,
              step_number: index + 1,
              instruction: instruction.text,
              time_minutes: instruction.time_minutes,
              temperature: instruction.temperature,
              tips: instruction.tips,
              image_url: instruction.image_url,
              status: 'pending'
            }));
            
            const session: CookingAssistantSession = {
              id: crypto.randomUUID(),
              recipe_id: sessionData.recipe_id,
              user_id: 'current-user', // TODO: Get from auth
              mode: sessionData.mode,
              steps,
              current_step_index: 0,
              timers: [],
              voice_enabled: sessionData.voice_enabled,
              voice_lang: sessionData.voice_lang,
              started_at: new Date().toISOString()
            };
            
            set({
              currentSession: session,
              isSessionActive: true,
              steps,
              currentStepIndex: 0,
              isVoiceEnabled: sessionData.voice_enabled,
              isLoading: false
            });
            
            // Initialize voice if enabled
            if (sessionData.voice_enabled) {
              await get().initializeVoice();
            }
            
            // Speak welcome message
            if (sessionData.voice_enabled) {
              await get().speakText(
                `Starting cooking session for ${recipe.title}. ${steps.length} steps total. Ready to begin?`,
                { priority: 'normal' }
              );
            }
            
          } catch (error: unknown) {
            set({
              error: {
                type: 'general',
                message: 'Failed to start cooking session',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
              },
              isLoading: false
            });
          }
        },
        
        endSession: async () => {
          const session = get().currentSession;
          if (!session) return;
          
          const updatedSession = {
            ...session,
            completed_at: new Date().toISOString()
          };
          
          // Stop all timers
          get().timers.forEach(timer => {
            get().stopTimer(timer.id);
          });
          
          // Stop voice listening
          get().stopListening();
          
          set({
            currentSession: updatedSession,
            isSessionActive: false,
            currentStepIndex: 0,
            steps: [],
            timers: [],
            activeTimers: [],
            isListening: false,
            isSpeaking: false
          });
          
          // Save session to database (TODO: implement)

        },
        
        pauseSession: () => {
          const session = get().currentSession;
          if (!session) return;
          
          set({
            currentSession: {
              ...session,
              paused_at: new Date().toISOString()
            }
          });
          
          // Pause all running timers
          get().timers.forEach(timer => {
            if (timer.state === 'running') {
              get().pauseTimer(timer.id);
            }
          });
          
          get().stopListening();
        },
        
        resumeSession: () => {
          const session = get().currentSession;
          if (!session) return;
          
          set({
            currentSession: {
              ...session,
              paused_at: undefined
            }
          });
          
          // Resume paused timers
          get().timers.forEach(timer => {
            if (timer.state === 'paused') {
              get().resumeTimer(timer.id);
            }
          });
          
          if (get().isVoiceEnabled) {
            get().startListening();
          }
        },
        
        updateSession: (updates) => {
          const session = get().currentSession;
          if (!session) return;
          
          set({
            currentSession: { ...session, ...updates }
          });
        },
        
        // Step navigation
        nextStep: () => {
          const { currentStepIndex, steps, stepHistory } = get();
          
          if (currentStepIndex < steps.length - 1) {
            const newIndex = currentStepIndex + 1;
            
            set({
              currentStepIndex: newIndex,
              stepHistory: [...stepHistory, currentStepIndex]
            });
            
            // Speak new step if voice is enabled
            if (get().isVoiceEnabled) {
              get().speakCurrentStep();
            }
            
            // Auto-create timer if step has duration
            const currentStep = steps[newIndex];
            if (currentStep.time_minutes && get().preferences.auto_start_timers) {
              const timerId = get().createTimer({
                name: `Step ${currentStep.step_number}`,
                duration_minutes: currentStep.time_minutes,
                step_id: currentStep.id,
                auto_start: true
              });
              
              if (timerId) {
                get().startTimer(timerId);
              }
            }
          }
        },
        
        previousStep: () => {
          const { stepHistory } = get();
          
          if (stepHistory.length > 0) {
            const previousIndex = stepHistory[stepHistory.length - 1];
            const newHistory = stepHistory.slice(0, -1);
            
            set({
              currentStepIndex: previousIndex,
              stepHistory: newHistory
            });
            
            // Speak previous step if voice is enabled
            if (get().isVoiceEnabled) {
              get().speakCurrentStep();
            }
          }
        },
        
        goToStep: (stepIndex) => {
          const { currentStepIndex, steps, stepHistory } = get();
          
          if (stepIndex >= 0 && stepIndex < steps.length && stepIndex !== currentStepIndex) {
            set({
              currentStepIndex: stepIndex,
              stepHistory: [...stepHistory, currentStepIndex]
            });
            
            // Speak new step if voice is enabled
            if (get().isVoiceEnabled) {
              get().speakCurrentStep();
            }
          }
        },
        
        completeStep: (stepIndex, notes) => {
          const { steps } = get();
          const updatedSteps = steps.map((step, index) => {
            if (index === stepIndex) {
              return {
                ...step,
                status: 'completed' as const,
                completed_at: new Date().toISOString(),
                notes
              };
            }
            return step;
          });
          
          set({ steps: updatedSteps });
          
          // Track completion
          get().trackStepCompletion(steps[stepIndex].id, Date.now());
        },
        
        skipStep: (stepIndex, reason) => {
          const { steps } = get();
          const updatedSteps = steps.map((step, index) => {
            if (index === stepIndex) {
              return {
                ...step,
                status: 'skipped' as const,
                notes: reason
              };
            }
            return step;
          });
          
          set({ steps: updatedSteps });
        },
        
        // Voice actions
        initializeVoice: async () => {
          const { preferences } = get();
          
          if (!get().voiceService) {
            const voiceService = new VoiceService(preferences.voice_settings);
            set({ voiceService });
          }
          
          const success = await get().voiceService!.initialize();
          if (success) {
            const permissionGranted = await get().voiceService!.requestMicrophonePermission();
            if (permissionGranted) {
              set({ isVoiceEnabled: true });
              return true;
            }
          }
          
          set({
            error: {
              type: 'voice',
              message: 'Failed to initialize voice service',
              timestamp: new Date().toISOString()
            }
          });
          
          return false;
        },
        
        startListening: () => {
          const { voiceService } = get();
          if (!voiceService) return false;
          
          const success = voiceService.startListening(
            (result) => get().handleVoiceCommand(result),
            (error) => {
              get().setError({
                type: 'voice',
                message: 'Voice recognition error',
                details: error.message,
                timestamp: new Date().toISOString()
              });
            }
          );
          
          set({ isListening: success });
          return success;
        },
        
        stopListening: () => {
          const { voiceService } = get();
          if (voiceService) {
            voiceService.stopListening();
          }
          set({ isListening: false });
        },
        
        handleVoiceCommand: async (command) => {
          set({ lastVoiceCommand: command });
          get().trackVoiceCommand(command);
          
          switch (command.command) {
            case 'next':
              get().nextStep();
              break;
            case 'previous':
              get().previousStep();
              break;
            case 'repeat':
              await get().speakCurrentStep();
              break;
            case 'pause':
              get().pauseSession();
              break;
            case 'resume':
              get().resumeSession();
              break;
            case 'timer':
              // Create a quick 5-minute timer
              const timerId = get().createTimer({
                name: 'Quick Timer',
                duration_minutes: 5
              });
              if (timerId) {
                get().startTimer(timerId);
                await get().speakText('5 minute timer started');
              }
              break;
            case 'help':
              await get().voiceService?.speakHelp();
              break;
            case 'ingredients':
              const recipe = get().currentRecipe;
              if (recipe) {
                const ingredientList = recipe.ingredients.map(ing => 
                  `${ing.quantity} ${ing.unit} ${ing.name}`
                ).join(', ');
                await get().speakText(`Ingredients: ${ingredientList}`);
              }
              break;
            case 'nutrition':
              const currentRecipe = get().currentRecipe;
              if (currentRecipe) {
                const nutrition = currentRecipe.nutritional_info;
                await get().speakText(
                  `Nutrition per serving: ${nutrition.calories} calories, ${nutrition.protein} grams protein, ${nutrition.carbs} grams carbs, ${nutrition.fat} grams fat`
                );
              }
              break;
            case 'finish':
              await get().endSession();
              break;
          }
        },
        
        speakText: async (text, options) => {
          const { voiceService } = get();
          if (!voiceService) return;
          
          set({ isSpeaking: true });
          
          try {
            await voiceService.speak(text, options);
          } catch (error: unknown) {
            console.error('Speech error:', error);
          } finally {
            set({ isSpeaking: false });
          }
        },
        
        speakCurrentStep: async () => {
          const { currentStepIndex, steps, voiceService } = get();
          if (!voiceService || !steps[currentStepIndex]) return;
          
          const currentStep = steps[currentStepIndex];
          await voiceService.speakInstruction(currentStep.instruction, currentStep.step_number);
        },
        
        updateVoiceSettings: (settings) => {
          const { preferences, voiceService } = get();
          const newVoiceSettings = { ...preferences.voice_settings, ...settings };
          
          set({
            preferences: {
              ...preferences,
              voice_settings: newVoiceSettings
            }
          });
          
          if (voiceService) {
            voiceService.updateSettings(settings);
          }
        },
        
        // Timer actions
        createTimer: (timerData) => {
          const { timerService } = get();
          const timer = timerService.createTimer(
            timerData.name,
            timerData.duration_minutes * 60,
            timerData.step_id
          );
          
          get().updateTimers();
          
          if (timerData.auto_start) {
            get().startTimer(timer.id);
          }
          
          return timer.id;
        },
        
        startTimer: (timerId) => {
          const { timerService } = get();
          const success = timerService.startTimer(
            timerId,
            (timer) => get().updateTimers(),
            (timer) => {
              get().updateTimers();
              // Speak timer completion
              if (get().isVoiceEnabled) {
                get().voiceService?.speakTimerComplete(timer.name);
              }
            }
          );
          
          if (success) {
            const { activeTimers } = get();
            set({ activeTimers: [...activeTimers, timerId] });
          }
          
          return success;
        },
        
        pauseTimer: (timerId) => {
          const { timerService } = get();
          return timerService.pauseTimer(timerId);
        },
        
        resumeTimer: (timerId) => {
          const { timerService } = get();
          return timerService.resumeTimer(timerId);
        },
        
        stopTimer: (timerId) => {
          const { timerService } = get();
          const success = timerService.stopTimer(timerId);
          
          if (success) {
            const { activeTimers } = get();
            set({ activeTimers: activeTimers.filter(id => id !== timerId) });
          }
          
          return success;
        },
        
        deleteTimer: (timerId) => {
          const { timerService } = get();
          const success = timerService.deleteTimer(timerId);
          
          if (success) {
            const { activeTimers } = get();
            set({ activeTimers: activeTimers.filter(id => id !== timerId) });
            get().updateTimers();
          }
          
          return success;
        },
        
        updateTimers: () => {
          const { timerService } = get();
          const timers = timerService.getAllTimers();
          set({ timers });
        },
        
        // Measurement actions
        convertMeasurement: (amount, fromUnit, toUnit, ingredient) => {
          const { measurementService } = get();
          return measurementService.convertMeasurement(amount, fromUnit, toUnit, ingredient);
        },
        
        scaleRecipe: (originalServings, targetServings) => {
          const { currentRecipe, measurementService } = get();
          if (!currentRecipe) return;
          
          const scaledIngredients = measurementService.scaleRecipe(
            originalServings,
            targetServings,
            currentRecipe.ingredients
          );
          
          set({
            currentRecipe: {
              ...currentRecipe,
              ingredients: scaledIngredients,
              servings: targetServings
            }
          });
        },
        
        switchMeasurementSystem: (system) => {
          set({ measurementSystem: system });
          
          // Update preferences
          const { preferences } = get();
          set({
            preferences: {
              ...preferences,
              measurement_system: system
            }
          });
        },
        
        // Utility actions
        addSuggestion: (suggestion) => {
          const { suggestions } = get();
          set({ suggestions: [...suggestions, suggestion] });
        },
        
        dismissSuggestion: (suggestionId) => {
          const { suggestions } = get();
          set({ suggestions: suggestions.filter(s => s.id !== suggestionId) });
        },
        
        addInsight: (insight) => {
          const { insights } = get();
          set({ insights: [...insights, insight] });
          
          // Auto-dismiss if configured
          if (insight.auto_dismiss_seconds) {
            setTimeout(() => {
              get().dismissInsight(insight.id);
            }, insight.auto_dismiss_seconds * 1000);
          }
        },
        
        dismissInsight: (insightId) => {
          const { insights } = get();
          set({ insights: insights.filter(i => i.id !== insightId) });
        },
        
        setError: (error) => {
          set({ error });
        },
        
        clearErrors: () => {
          set({ error: null, voiceErrors: [] });
        },
        
        updatePreferences: (newPreferences) => {
          const { preferences } = get();
          set({ preferences: { ...preferences, ...newPreferences } });
        },
        
        // Analytics (placeholder implementations)
        trackStepCompletion: (stepId, duration) => {

        },
        
        trackVoiceCommand: (command) => {

        },
        
        trackTimerUsage: (timerId, duration) => {

        },
        
        // Cleanup
        cleanup: () => {
          const { voiceService, timerService } = get();
          
          if (voiceService) {
            voiceService.destroy();
          }
          
          if (timerService) {
            timerService.destroy();
          }
          
          set({
            currentSession: null,
            isSessionActive: false,
            voiceService: null,
            isVoiceEnabled: false,
            isListening: false,
            isSpeaking: false,
            timers: [],
            activeTimers: []
          });
        }
      }),
      {
        name: 'cooking-assistant-store',
        partialize: (state) => ({
          preferences: state.preferences,
          measurementSystem: state.measurementSystem,
          temperatureUnit: state.temperatureUnit
        })
      }
    ),
    {
      name: 'cooking-assistant-store'
    }
  )
);