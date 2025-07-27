/**
 * Advanced Voice Recognition Hook
 * Continuous listening, wake word detection, multi-language support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/services/logger';

import { SmartParser, ParsedIngredient } from '@/services/voice/smartParser';
import { VoiceFeedback } from '@/services/voice/voiceFeedback';
import { ConversationContext } from '@/services/voice/conversationContext';
import { WakeWordDetector } from '@/services/voice/wakeWordDetector';

// Extend Window interface for WebKit Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
    webkitAudioContext: typeof AudioContext;
  }
}

export interface VoiceCommand {
  type: 'add' | 'remove' | 'search' | 'help' | 'repeat' | 'cancel' | 'confirm' | 'list' | 'clear';
  target?: string;
  items?: ParsedIngredient[];
  confidence: number;
}

export interface ConversationEntry {
  id: string;
  timestamp: number;
  type: 'user' | 'assistant';
  text: string;
  command?: VoiceCommand;
  items?: ParsedIngredient[];
}

export interface VoiceProfile {
  id: string;
  name: string;
  language: string;
  voiceSettings?: {
    pitch?: number;
    rate?: number;
  };
}

export interface AdvancedVoiceOptions {
  language?: string;
  continuous?: boolean;
  enableWakeWord?: boolean;
  wakeWords?: string[];
  enableVoiceFeedback?: boolean;
  voiceProfile?: VoiceProfile;
  contextAware?: boolean;
  autoSuggest?: boolean;
  multiLanguage?: boolean;
  languages?: string[];
  onCommand?: (command: VoiceCommand) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onWakeWord?: () => void;
  onError?: (error: string) => void;
}

export interface UseAdvancedVoiceReturn {
  // State
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isWaitingForWakeWord: boolean;
  currentLanguage: string;
  transcript: string;
  conversation: ConversationEntry[];
  suggestions: string[];
  audioLevel: number;
  error: string | null;
  
  // Methods
  startListening: () => void;
  stopListening: () => void;
  startContinuousListening: () => void;
  stopContinuousListening: () => void;
  speak: (text: string, language?: string) => Promise<void>;
  switchLanguage: (language: string) => void;
  clearConversation: () => void;
  processCommand: (text: string) => Promise<VoiceCommand | null>;
  
  // Features
  isSupported: boolean;
  isContinuousMode: boolean;
  supportedLanguages: string[];
}

const SUPPORTED_LANGUAGES = {
  'es-ES': { name: 'Español', region: 'España' },
  'es-MX': { name: 'Español', region: 'México' },
  'es-AR': { name: 'Español', region: 'Argentina' },
  'en-US': { name: 'English', region: 'US' },
  'en-GB': { name: 'English', region: 'UK' },
  'pt-BR': { name: 'Português', region: 'Brasil' },
  'pt-PT': { name: 'Português', region: 'Portugal' }
};

const DEFAULT_WAKE_WORDS = ['oye chef', 'hey chef', 'chef', 'asistente', 'ayuda'];

export const useAdvancedVoiceRecognition = ({
  language = 'es-MX',
  continuous = false,
  enableWakeWord = true,
  wakeWords = DEFAULT_WAKE_WORDS,
  enableVoiceFeedback = true,
  voiceProfile,
  contextAware = true,
  autoSuggest = true,
  multiLanguage = true,
  languages = ['es-MX', 'en-US', 'pt-BR'],
  onCommand,
  onTranscript,
  onWakeWord,
  onError
}: AdvancedVoiceOptions = {}): UseAdvancedVoiceReturn => {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWaitingForWakeWord, setIsWaitingForWakeWord] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Services
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const parserRef = useRef<SmartParser>(new SmartParser(currentLanguage.startsWith('es') ? 'es' : currentLanguage.startsWith('pt') ? 'pt' : 'en'));
  const voiceFeedbackRef = useRef<VoiceFeedback>(new VoiceFeedback(currentLanguage, enableVoiceFeedback));
  const contextRef = useRef<ConversationContext>(new ConversationContext());
  const wakeWordDetectorRef = useRef<WakeWordDetector>(new WakeWordDetector(wakeWords));
  
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const continuousRestartTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if Speech Recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  // Update services when language changes
  useEffect(() => {
    parserRef.current = new SmartParser(currentLanguage.startsWith('es') ? 'es' : currentLanguage.startsWith('pt') ? 'pt' : 'en');
    voiceFeedbackRef.current.setLanguage(currentLanguage);
  }, [currentLanguage]);

  // Initialize Speech Recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous || isContinuousMode;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.lang = currentLanguage;
    
    recognition.onstart = () => {

      setIsListening(true);
      setError(null);
      
      if (!isContinuousMode && enableVoiceFeedback) {
        voiceFeedbackRef.current.playSound('start');
      }
    };
    
    recognition.onresult = async (event) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      const transcriptText = result[0].transcript;
      const confidence = result[0].confidence || 0.9;
      
      setTranscript(transcriptText);
      onTranscript?.(transcriptText, result.isFinal);
      
      // Multi-language detection
      if (multiLanguage && result.isFinal) {
        const detectedLang = await detectLanguage(transcriptText);
        if (detectedLang && detectedLang !== currentLanguage && languages.includes(detectedLang)) {
          switchLanguage(detectedLang);
        }
      }
      
      // Wake word detection in continuous mode
      if (isWaitingForWakeWord && wakeWordDetectorRef.current.detect(transcriptText)) {
        setIsWaitingForWakeWord(false);
        onWakeWord?.();
        speak('¿En qué puedo ayudarte?');
        return;
      }
      
      if (result.isFinal && !isWaitingForWakeWord) {
        setIsProcessing(true);
        
        try {
          // Process command
          const command = await processCommandInternal(transcriptText);
          
          if (command) {
            // Add to conversation
            const entry: ConversationEntry = {
              id: Date.now().toString(),
              timestamp: Date.now(),
              type: 'user',
              text: transcriptText,
              command,
              items: command.items
            };
            
            setConversation(prev => [...prev, entry]);
            
            // Execute command
            onCommand?.(command);
            
            // Generate voice feedback
            if (enableVoiceFeedback) {
              const response = generateResponse(command, transcriptText);
              await speak(response);
              
              // Add assistant response to conversation
              setConversation(prev => [...prev, {
                id: Date.now().toString(),
                timestamp: Date.now(),
                type: 'assistant',
                text: response
              }]);
            }
          }
          
          // Generate suggestions
          if (autoSuggest && contextAware) {
            const newSuggestions = await generateSuggestions(transcriptText, conversation);
            setSuggestions(newSuggestions);
          }
          
        } catch (err: unknown) {
          logger.error('Error processing voice input:', 'useAdvancedVoiceRecognition', err);
          handleError('Error al procesar el comando');
        } finally {
          setIsProcessing(false);
          
          // Reset for continuous mode
          if (isContinuousMode) {
            setTranscript('');
            setIsWaitingForWakeWord(enableWakeWord);
          }
        }
      }
    };
    
    recognition.onerror = (event) => {
      logger.error('Speech recognition error:', 'useAdvancedVoiceRecognition', event.error);
      
      if (event.error === 'no-speech' && isContinuousMode) {
        // Ignore no-speech errors in continuous mode
        return;
      }
      
      const errorMessage = getErrorMessage(event.error);
      handleError(errorMessage);
      
      if (event.error !== 'aborted' && isContinuousMode) {
        // Restart in continuous mode
        scheduleContinuousRestart();
      }
    };
    
    recognition.onend = () => {

      setIsListening(false);
      stopAudioAnalysis();
      
      if (!isContinuousMode && enableVoiceFeedback) {
        voiceFeedbackRef.current.playSound('end');
      }
      
      if (isContinuousMode && !error) {
        // Restart in continuous mode
        scheduleContinuousRestart();
      }
    };
    
    return recognition;
  }, [currentLanguage, continuous, isContinuousMode, enableWakeWord, enableVoiceFeedback, multiLanguage, languages, conversation, isWaitingForWakeWord, error, onCommand, onTranscript, onWakeWord, autoSuggest, contextAware]);

  // Process command
  const processCommandInternal = async (text: string): Promise<VoiceCommand | null> => {
    // Check for commands
    const normalizedText = text.toLowerCase().trim();
    
    // System commands
    if (normalizedText.includes('ayuda') || normalizedText.includes('help')) {
      return { type: 'help', confidence: 1.0 };
    }
    
    if (normalizedText.includes('repetir') || normalizedText.includes('repeat')) {
      return { type: 'repeat', confidence: 1.0 };
    }
    
    if (normalizedText.includes('cancelar') || normalizedText.includes('cancel')) {
      return { type: 'cancel', confidence: 1.0 };
    }
    
    if (normalizedText.includes('confirmar') || normalizedText.includes('confirm') || normalizedText.includes('sí') || normalizedText.includes('yes')) {
      return { type: 'confirm', confidence: 1.0 };
    }
    
    if (normalizedText.includes('listar') || normalizedText.includes('list') || normalizedText.includes('mostrar lista')) {
      return { type: 'list', confidence: 1.0 };
    }
    
    if (normalizedText.includes('limpiar') || normalizedText.includes('clear') || normalizedText.includes('borrar todo')) {
      return { type: 'clear', confidence: 1.0 };
    }
    
    // Parse for add/remove commands
    const addPatterns = [
      /^(?:agregar?|añadir?|poner?|necesito|quiero|comprar?)\s+(.+)/i,
      /^(?:agrega|añade|pon)\s+(.+)/i,
      /^(.+)$/i // Default to add if no command specified
    ];
    
    const removePatterns = [
      /^(?:quitar?|eliminar?|borrar?|sacar?|remover?)\s+(.+)/i,
      /^(?:no\s+(?:necesito|quiero))\s+(.+)/i
    ];
    
    // Check remove patterns first
    for (const pattern of removePatterns) {
      const match = text.match(pattern);
      if (match) {
        const target = match[1];
        const items = await parserRef.current.parseIngredients(target);
        return {
          type: 'remove',
          target,
          items: items.length > 0 ? items : undefined,
          confidence: 0.9
        };
      }
    }
    
    // Check add patterns
    for (const pattern of addPatterns) {
      const match = text.match(pattern);
      if (match) {
        const target = match[1];
        const items = await parserRef.current.parseIngredients(target);
        
        if (items.length > 0) {
          return {
            type: 'add',
            target,
            items,
            confidence: 0.9
          };
        }
      }
    }
    
    // Check for search intent
    if (normalizedText.includes('buscar') || normalizedText.includes('search') || 
        normalizedText.includes('receta') || normalizedText.includes('recipe')) {
      return {
        type: 'search',
        target: text,
        confidence: 0.8
      };
    }
    
    return null;
  };

  // Public process command method
  const processCommand = useCallback(async (text: string): Promise<VoiceCommand | null> => {
    return processCommandInternal(text);
  }, []);

  // Generate response based on command
  const generateResponse = (command: VoiceCommand, originalText: string): string => {
    const responses: Record<string, string[]> = {
      'es-ES': {
        add: [
          'He agregado {items} a tu lista',
          'Perfecto, {items} añadido',
          'Listo, he agregado {items}',
          'Vale, {items} en la lista'
        ],
        remove: [
          'He quitado {items} de tu lista',
          'Eliminado {items}',
          'He removido {items}',
          'Listo, {items} fuera de la lista'
        ],
        help: [
          'Puedes decirme qué ingredientes necesitas. Por ejemplo: "Añade 2 kilos de tomate" o "Quita las cebollas"',
          'Estoy aquí para ayudarte con tu lista de compras. Dime qué necesitas'
        ],
        list: [
          'Aquí está tu lista actual',
          'Estos son los ingredientes que tienes'
        ],
        clear: [
          'He limpiado toda la lista',
          'Lista vacía, empezamos de nuevo'
        ],
        confirm: [
          'Confirmado',
          'De acuerdo',
          'Perfecto'
        ],
        cancel: [
          'Cancelado',
          'Vale, lo dejamos'
        ],
        search: [
          'Buscando recetas con esos ingredientes',
          'Voy a buscar qué puedes cocinar'
        ]
      },
      'en-US': {
        add: [
          "I've added {items} to your list",
          'Perfect, {items} added',
          "Done, I've added {items}",
          'Okay, {items} in the list'
        ],
        remove: [
          "I've removed {items} from your list",
          'Removed {items}',
          "I've taken out {items}",
          'Done, {items} out of the list'
        ],
        help: [
          'You can tell me what ingredients you need. For example: "Add 2 pounds of tomatoes" or "Remove the onions"',
          "I'm here to help you with your shopping list. Tell me what you need"
        ],
        list: [
          "Here's your current list",
          'These are the ingredients you have'
        ],
        clear: [
          "I've cleared the entire list",
          "Empty list, let's start fresh"
        ],
        confirm: [
          'Confirmed',
          'Alright',
          'Perfect'
        ],
        cancel: [
          'Cancelled',
          "Okay, let's leave it"
        ],
        search: [
          'Searching for recipes with those ingredients',
          "I'll look for what you can cook"
        ]
      },
      'pt-BR': {
        add: [
          'Adicionei {items} à sua lista',
          'Perfeito, {items} adicionado',
          'Pronto, adicionei {items}',
          'Ok, {items} na lista'
        ],
        remove: [
          'Removi {items} da sua lista',
          'Removido {items}',
          'Tirei {items}',
          'Pronto, {items} fora da lista'
        ],
        help: [
          'Você pode me dizer quais ingredientes precisa. Por exemplo: "Adicione 2 quilos de tomate" ou "Remova as cebolas"',
          'Estou aqui para ajudar com sua lista de compras. Diga o que precisa'
        ],
        list: [
          'Aqui está sua lista atual',
          'Estes são os ingredientes que você tem'
        ],
        clear: [
          'Limpei toda a lista',
          'Lista vazia, vamos começar de novo'
        ],
        confirm: [
          'Confirmado',
          'Certo',
          'Perfeito'
        ],
        cancel: [
          'Cancelado',
          'Ok, deixamos assim'
        ],
        search: [
          'Procurando receitas com esses ingredientes',
          'Vou procurar o que você pode cozinhar'
        ]
      }
    };
    
    const langGroup = currentLanguage.split('-')[0];
    const langResponses = responses[currentLanguage] || responses[`${langGroup}-${langGroup.toUpperCase()}`] || responses['es-ES'];
    const typeResponses = langResponses[command.type] || [`Comando ${command.type} ejecutado`];
    
    let response = typeResponses[Math.floor(Math.random() * typeResponses.length)];
    
    // Replace placeholders
    if (command.items && command.items.length > 0) {
      const itemsList = command.items.map(item => {
        let text = '';
        if (item.quantity) text += `${item.quantity} `;
        if (item.unit) text += `${item.unit} de `;
        text += item.name;
        return text;
      }).join(', ');
      
      response = response.replace('{items}', itemsList);
    } else if (command.target) {
      response = response.replace('{items}', command.target);
    }
    
    return response;
  };

  // Detect language
  const detectLanguage = async (text: string): Promise<string | null> => {
    // Simple language detection based on common words
    const patterns = {
      'es': /\b(el|la|de|que|y|a|en|un|una|por|con|para|los|las|del|al)\b/gi,
      'en': /\b(the|of|and|to|a|in|is|it|you|that|for|on|with|as|at)\b/gi,
      'pt': /\b(o|a|de|que|e|do|da|em|um|uma|para|com|os|as|dos|das)\b/gi
    };
    
    const scores: Record<string, number> = {};
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      scores[lang] = matches ? matches.length : 0;
    }
    
    const detected = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    
    if (detected[1] > 2) {
      // Find matching supported language
      for (const supportedLang of languages) {
        if (supportedLang.startsWith(detected[0])) {
          return supportedLang;
        }
      }
    }
    
    return null;
  };

  // Generate contextual suggestions
  const generateSuggestions = async (text: string, history: ConversationEntry[]): Promise<string[]> => {
    const suggestions: string[] = [];
    
    // Time-based suggestions
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      suggestions.push('huevos', 'pan', 'leche', 'café', 'fruta');
    } else if (hour >= 12 && hour < 16) {
      suggestions.push('pollo', 'arroz', 'ensalada', 'pasta', 'carne');
    } else if (hour >= 19 && hour < 22) {
      suggestions.push('pizza', 'sopa', 'sandwich', 'quesadillas', 'tacos');
    }
    
    // Context from recent items
    const recentItems = history
      .filter(entry => entry.items && entry.items.length > 0)
      .flatMap(entry => entry.items!)
      .map(item => item.name.toLowerCase());
    
    // Suggest complementary items
    const complements: Record<string, string[]> = {
      'tomate': ['cebolla', 'ajo', 'albahaca', 'aceite de oliva'],
      'pasta': ['salsa', 'queso parmesano', 'albahaca'],
      'carne': ['sal', 'pimienta', 'papas', 'verduras'],
      'pollo': ['limón', 'ajo', 'romero', 'papas'],
      'huevos': ['tocino', 'pan', 'queso', 'jamón'],
      'arroz': ['frijoles', 'pollo', 'verduras', 'salsa'],
      'pan': ['jamón', 'queso', 'mantequilla', 'mermelada']
    };
    
    for (const item of recentItems) {
      if (complements[item]) {
        suggestions.push(...complements[item]);
      }
    }
    
    // Remove duplicates and limit
    return [...new Set(suggestions)].slice(0, 5);
  };

  // Speech synthesis
  const speak = useCallback(async (text: string, language?: string): Promise<void> => {
    if (!('speechSynthesis' in window) || !enableVoiceFeedback) {
      return;
    }
    
    setIsSpeaking(true);
    
    try {
      await voiceFeedbackRef.current.speak(text, {
        lang: language || currentLanguage,
        pitch: voiceProfile?.voiceSettings?.pitch,
        rate: voiceProfile?.voiceSettings?.rate
      });
    } catch (err: unknown) {
      logger.error('Error speaking:', 'useAdvancedVoiceRecognition', err);
    } finally {
      setIsSpeaking(false);
    }
  }, [currentLanguage, enableVoiceFeedback, voiceProfile]);

  // Audio level analysis
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        setAudioLevel(normalizedLevel);
        
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (err: unknown) {
      logger.error('Error accessing microphone:', 'useAdvancedVoiceRecognition', err);
      handleError('No se pudo acceder al micrófono');
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setAudioLevel(0);
  }, []);

  // Error handling
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    onError?.(errorMessage);
    
    if (enableVoiceFeedback) {
      voiceFeedbackRef.current.playSound('error');
    }
  }, [enableVoiceFeedback, onError]);

  const getErrorMessage = (error: string): string => {
    const messages: Record<string, Record<string, string>> = {
      'es': {
        'no-speech': 'No se detectó voz. Intenta de nuevo.',
        'audio-capture': 'No se pudo acceder al micrófono.',
        'not-allowed': 'Permisos de micrófono denegados.',
        'network': 'Error de conexión.',
        'aborted': 'Reconocimiento cancelado.',
        'default': 'Error en el reconocimiento de voz.'
      },
      'en': {
        'no-speech': 'No speech detected. Try again.',
        'audio-capture': 'Could not access microphone.',
        'not-allowed': 'Microphone permissions denied.',
        'network': 'Connection error.',
        'aborted': 'Recognition cancelled.',
        'default': 'Speech recognition error.'
      },
      'pt': {
        'no-speech': 'Nenhuma voz detectada. Tente novamente.',
        'audio-capture': 'Não foi possível acessar o microfone.',
        'not-allowed': 'Permissões do microfone negadas.',
        'network': 'Erro de conexão.',
        'aborted': 'Reconhecimento cancelado.',
        'default': 'Erro no reconhecimento de voz.'
      }
    };
    
    const langGroup = currentLanguage.split('-')[0];
    const langMessages = messages[langGroup] || messages['es'];
    return langMessages[error] || langMessages['default'];
  };

  // Continuous mode management
  const scheduleContinuousRestart = useCallback(() => {
    if (continuousRestartTimerRef.current) {
      clearTimeout(continuousRestartTimerRef.current);
    }
    
    continuousRestartTimerRef.current = setTimeout(() => {
      if (isContinuousMode && !isListening) {

        startListening();
      }
    }, 1000);
  }, [isContinuousMode, isListening]);

  // Start/stop methods
  const startListening = useCallback(() => {
    if (!isSupported) {
      handleError('El reconocimiento de voz no está soportado');
      return;
    }
    
    if (!recognitionRef.current) {
      recognitionRef.current = initializeRecognition();
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        startAudioAnalysis();
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('already started')) {
          setIsListening(true);
          startAudioAnalysis();
        } else {
          handleError('No se pudo iniciar el reconocimiento');
        }
      }
    }
  }, [isSupported, isListening, initializeRecognition, startAudioAnalysis, handleError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err: unknown) {
        logger.error('Error stopping recognition:', 'useAdvancedVoiceRecognition', err);
      }
    }
    stopAudioAnalysis();
    setIsContinuousMode(false);
    setIsWaitingForWakeWord(false);
  }, [isListening, stopAudioAnalysis]);

  const startContinuousListening = useCallback(() => {
    setIsContinuousMode(true);
    setIsWaitingForWakeWord(enableWakeWord);
    
    if (enableVoiceFeedback) {
      speak('Modo continuo activado. Di "Oye Chef" cuando necesites ayuda.');
    }
    
    startListening();
  }, [enableWakeWord, enableVoiceFeedback, speak, startListening]);

  const stopContinuousListening = useCallback(() => {
    stopListening();
    setIsContinuousMode(false);
    setIsWaitingForWakeWord(false);
    
    if (continuousRestartTimerRef.current) {
      clearTimeout(continuousRestartTimerRef.current);
    }
    
    if (enableVoiceFeedback) {
      speak('Modo continuo desactivado.');
    }
  }, [stopListening, enableVoiceFeedback, speak]);

  // Language switching
  const switchLanguage = useCallback((lang: string) => {
    if (!SUPPORTED_LANGUAGES[lang]) return;
    
    setCurrentLanguage(lang);
    
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
    
    if (enableVoiceFeedback) {
      const messages = {
        'es': 'Cambiado a español',
        'en': 'Switched to English',
        'pt': 'Mudado para português'
      };
      
      const langGroup = lang.split('-')[0];
      speak(messages[langGroup] || messages['es'], lang);
    }
  }, [enableVoiceFeedback, speak]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setConversation([]);
    contextRef.current.clear();
    setSuggestions([]);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopAudioAnalysis();
      
      if (continuousRestartTimerRef.current) {
        clearTimeout(continuousRestartTimerRef.current);
      }
      
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [stopAudioAnalysis]);

  return {
    // State
    isListening,
    isProcessing,
    isSpeaking,
    isWaitingForWakeWord,
    currentLanguage,
    transcript,
    conversation,
    suggestions,
    audioLevel,
    error,
    
    // Methods
    startListening,
    stopListening,
    startContinuousListening,
    stopContinuousListening,
    speak,
    switchLanguage,
    clearConversation,
    processCommand,
    
    // Features
    isSupported,
    isContinuousMode,
    supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
  };
};