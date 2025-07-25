# Voice Recognition System Design - kecarajocomer

## Overview

The Voice Recognition System enables hands-free ingredient input, recipe search, and meal planning through natural language processing optimized for Spanish speakers.

## System Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Voice Input UI    │ ──> │  Audio Processor │ ──> │ Speech-to-Text  │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
                                      │                         │
                                      v                         v
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Audio Visualizer   │     │  Noise Reduction │     │  Smart Parser   │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
                                                               │
                                                               v
                                                      ┌─────────────────┐
                                                      │ Structured Data │
                                                      └─────────────────┘
```

## Core Components

### 1. Voice Input Component

```typescript
// src/components/voice/VoiceInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { AudioVisualizer } from './AudioVisualizer';
import { iOS26LiquidButton } from '@/components/ui/iOS26LiquidButton';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onIngredients?: (ingredients: ParsedIngredient[]) => void;
  placeholder?: string;
  language?: 'es' | 'en';
  mode?: 'single' | 'continuous';
  visualizer?: boolean;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onIngredients,
  placeholder = "Toca para hablar...",
  language = 'es',
  mode = 'single',
  visualizer = true,
  className
}) => {
  const {
    isListening,
    isProcessing,
    transcript,
    error,
    startListening,
    stopListening,
    audioLevel
  } = useVoiceRecognition({
    language,
    continuous: mode === 'continuous',
    onResult: (result) => {
      onTranscript(result.transcript);
      if (result.ingredients && onIngredients) {
        onIngredients(result.ingredients);
      }
    }
  });

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main Input Area */}
      <div className="ios26-glass ios26-glass-medium rounded-2xl p-4">
        <div className="flex items-center gap-4">
          {/* Microphone Button */}
          <iOS26LiquidButton
            variant={isListening ? 'primary' : 'secondary'}
            size="lg"
            onClick={handleToggle}
            disabled={isProcessing}
            className="relative"
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="w-6 h-6 animate-spin" />
                </motion.div>
              ) : isListening ? (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <MicOff className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Mic className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Pulse Animation */}
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-red-500"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </iOS26LiquidButton>

          {/* Transcript Display */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {transcript ? (
                <motion.p
                  key="transcript"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-gray-900 dark:text-white"
                >
                  {transcript}
                </motion.p>
              ) : (
                <motion.p
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-gray-500"
                >
                  {placeholder}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Audio Visualizer */}
        {visualizer && isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <AudioVisualizer level={audioLevel} />
          </motion.div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Tips */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-gray-500 text-center"
        >
          Puedes decir: "2 tomates, 1 cebolla y 500 gramos de carne"
        </motion.div>
      )}
    </div>
  );
};
```

### 2. Voice Recognition Hook

```typescript
// src/hooks/useVoiceRecognition.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { SmartParser } from '@/services/voice/smartParser';

interface UseVoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (result: VoiceResult) => void;
  onError?: (error: string) => void;
}

interface VoiceResult {
  transcript: string;
  confidence: number;
  ingredients?: ParsedIngredient[];
  isFinal: boolean;
}

export const useVoiceRecognition = ({
  language = 'es-ES',
  continuous = false,
  interimResults = true,
  maxAlternatives = 3,
  onResult,
  onError
}: UseVoiceRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const parser = useRef(new SmartParser(language));

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;
    recognition.lang = language;
    
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      retryCountRef.current = 0;
    };
    
    recognition.onresult = async (event) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      const transcriptText = result[0].transcript;
      const confidence = result[0].confidence;
      
      setTranscript(transcriptText);
      
      if (result.isFinal) {
        setIsProcessing(true);
        
        try {
          // Parse ingredients if applicable
          const ingredients = await parser.current.parseIngredients(transcriptText);
          
          onResult?.({
            transcript: transcriptText,
            confidence,
            ingredients,
            isFinal: true
          });
        } catch (err) {
          console.error('Error parsing ingredients:', err);
        } finally {
          setIsProcessing(false);
        }
      } else {
        onResult?.({
          transcript: transcriptText,
          confidence,
          isFinal: false
        });
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          setError('No se detectó voz. Intenta de nuevo.');
          break;
        case 'audio-capture':
          setError('No se pudo acceder al micrófono.');
          break;
        case 'not-allowed':
          setError('Permisos de micrófono denegados.');
          break;
        case 'network':
          handleNetworkError();
          break;
        default:
          setError('Error en el reconocimiento de voz.');
      }
      
      setIsListening(false);
      onError?.(event.error);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      stopAudioAnalysis();
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopAudioAnalysis();
    };
  }, [language, continuous, interimResults, maxAlternatives]);

  // Handle network errors with exponential backoff
  const handleNetworkError = useCallback(() => {
    if (retryCountRef.current < 3) {
      const delay = Math.pow(2, retryCountRef.current) * 1000;
      retryCountRef.current++;
      
      setError(`Error de conexión. Reintentando en ${delay / 1000}s...`);
      
      setTimeout(() => {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.start();
        }
      }, delay);
    } else {
      setError('No se pudo conectar al servicio de voz.');
    }
  }, [isListening]);

  // Audio level analysis for visualizer
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('No se pudo acceder al micrófono.');
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        startAudioAnalysis();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('No se pudo iniciar el reconocimiento de voz.');
      }
    }
  }, [isListening, startAudioAnalysis]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      stopAudioAnalysis();
    }
  }, [isListening, stopAudioAnalysis]);

  return {
    isListening,
    isProcessing,
    transcript,
    error,
    audioLevel,
    startListening,
    stopListening,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
};
```

### 3. Smart Parser Service

```typescript
// src/services/voice/smartParser.ts
interface ParsedIngredient {
  name: string;
  quantity?: number;
  unit?: string;
  preparation?: string;
  confidence: number;
}

export class SmartParser {
  private language: string;
  private unitMappings: Map<string, string>;
  private quantityPatterns: RegExp[];
  
  constructor(language: string = 'es') {
    this.language = language;
    this.initializeUnits();
    this.initializePatterns();
  }
  
  private initializeUnits() {
    this.unitMappings = new Map([
      // Spanish units
      ['gramos', 'g'],
      ['gramo', 'g'],
      ['gr', 'g'],
      ['kilogramos', 'kg'],
      ['kilogramo', 'kg'],
      ['kilo', 'kg'],
      ['kilos', 'kg'],
      ['litros', 'L'],
      ['litro', 'L'],
      ['mililitros', 'ml'],
      ['mililitro', 'ml'],
      ['tazas', 'taza'],
      ['taza', 'taza'],
      ['cucharadas', 'cda'],
      ['cucharada', 'cda'],
      ['cucharaditas', 'cdta'],
      ['cucharadita', 'cdta'],
      ['unidades', 'unidad'],
      ['unidad', 'unidad'],
      ['piezas', 'pieza'],
      ['pieza', 'pieza'],
      // Common abbreviations
      ['cdas', 'cda'],
      ['cda', 'cda'],
      ['cdtas', 'cdta'],
      ['cdta', 'cdta'],
      ['tz', 'taza'],
      ['u', 'unidad']
    ]);
  }
  
  private initializePatterns() {
    this.quantityPatterns = [
      // Numbers with units: "2 kilos", "500 gramos"
      /(\d+(?:\.\d+)?)\s*(?:de\s+)?(\w+)/gi,
      // Fractions: "1/2 taza", "3/4 kilo"
      /(\d+\/\d+)\s*(?:de\s+)?(\w+)/gi,
      // Written numbers: "dos kilos", "media taza"
      /(uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|media|medio)\s*(?:de\s+)?(\w+)/gi,
      // Just numbers at start: "2 tomates"
      /^(\d+(?:\.\d+)?)\s+(.+)$/i
    ];
  }
  
  async parseIngredients(text: string): Promise<ParsedIngredient[]> {
    const ingredients: ParsedIngredient[] = [];
    
    // Split by common separators
    const parts = text.split(/[,;]|\s+y\s+|\s+e\s+/i);
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      const ingredient = this.parseIngredientPart(trimmed);
      if (ingredient) {
        ingredients.push(ingredient);
      }
    }
    
    // Apply ML-based corrections if available
    return this.applySmartCorrections(ingredients);
  }
  
  private parseIngredientPart(text: string): ParsedIngredient | null {
    let quantity: number | undefined;
    let unit: string | undefined;
    let name: string = text;
    let confidence = 1.0;
    
    // Try each pattern
    for (const pattern of this.quantityPatterns) {
      const match = text.match(pattern);
      if (match) {
        const [fullMatch, quantityStr, remainder] = match;
        
        // Parse quantity
        quantity = this.parseQuantity(quantityStr);
        
        // Check if remainder is a unit
        const normalizedRemainder = remainder.toLowerCase();
        if (this.unitMappings.has(normalizedRemainder)) {
          unit = this.unitMappings.get(normalizedRemainder);
          // Extract ingredient name after unit
          name = text.substring(match.index! + fullMatch.length).trim();
        } else {
          // Remainder is the ingredient name
          name = remainder;
        }
        
        if (name) {
          break;
        }
      }
    }
    
    // Clean up name
    name = name
      .replace(/^de\s+/i, '') // Remove leading "de"
      .replace(/\s+/g, ' ')   // Normalize spaces
      .trim();
    
    if (!name) {
      return null;
    }
    
    // Check for preparation notes
    const prepMatch = name.match(/(.+?)\s*\((.+?)\)/);
    let preparation: string | undefined;
    if (prepMatch) {
      name = prepMatch[1].trim();
      preparation = prepMatch[2].trim();
    }
    
    return {
      name,
      quantity,
      unit,
      preparation,
      confidence
    };
  }
  
  private parseQuantity(str: string): number {
    // Handle fractions
    if (str.includes('/')) {
      const [num, den] = str.split('/').map(Number);
      return num / den;
    }
    
    // Handle written numbers in Spanish
    const writtenNumbers: Record<string, number> = {
      'uno': 1, 'una': 1,
      'dos': 2,
      'tres': 3,
      'cuatro': 4,
      'cinco': 5,
      'seis': 6,
      'siete': 7,
      'ocho': 8,
      'nueve': 9,
      'diez': 10,
      'media': 0.5,
      'medio': 0.5
    };
    
    const lower = str.toLowerCase();
    if (writtenNumbers[lower]) {
      return writtenNumbers[lower];
    }
    
    // Parse regular number
    return parseFloat(str);
  }
  
  private async applySmartCorrections(
    ingredients: ParsedIngredient[]
  ): Promise<ParsedIngredient[]> {
    // Apply common corrections
    return ingredients.map(ing => {
      // Normalize common misspellings
      const corrections: Record<string, string> = {
        'sebolla': 'cebolla',
        'tomate': 'tomate',
        'ajo': 'ajo',
        'ajos': 'ajo'
      };
      
      const normalized = ing.name.toLowerCase();
      if (corrections[normalized]) {
        ing.name = corrections[normalized];
        ing.confidence *= 0.9; // Slightly lower confidence for corrections
      }
      
      return ing;
    });
  }
}
```

### 4. Audio Visualizer Component

```typescript
// src/components/voice/AudioVisualizer.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  level: number; // 0-1
  bars?: number;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  level,
  bars = 5,
  className
}) => {
  const getBarHeight = (index: number) => {
    // Create a wave effect
    const wave = Math.sin((index / bars) * Math.PI) * 0.5 + 0.5;
    return Math.max(0.1, level * wave);
  };
  
  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
          animate={{
            height: `${getBarHeight(i) * 40}px`,
            opacity: 0.5 + level * 0.5
          }}
          transition={{
            duration: 0.1,
            ease: "easeOut"
          }}
          style={{ minHeight: '4px' }}
        />
      ))}
    </div>
  );
};
```

## Integration Examples

### 1. Pantry Quick Add
```tsx
<VoiceInput
  onIngredients={(ingredients) => {
    ingredients.forEach(ing => {
      addToPantry({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit
      });
    });
  }}
  placeholder="Di los ingredientes que compraste..."
  visualizer
/>
```

### 2. Recipe Search
```tsx
<VoiceInput
  onTranscript={(text) => {
    searchRecipes(text);
  }}
  placeholder="¿Qué quieres cocinar hoy?"
  mode="single"
/>
```

### 3. Meal Planning
```tsx
<VoiceInput
  onTranscript={async (text) => {
    const mealPlan = await generateMealPlan(text);
    applyMealPlan(mealPlan);
  }}
  placeholder="Describe tu plan de comidas..."
  mode="continuous"
/>
```

## Performance Considerations

1. **Debouncing**: Implement debouncing for continuous mode
2. **Caching**: Cache parsed results for common phrases
3. **Offline Queue**: Queue voice inputs when offline
4. **Compression**: Compress audio for cloud fallback
5. **Lazy Loading**: Load voice components on demand

## Accessibility

1. **Visual Feedback**: Always provide visual feedback for audio states
2. **Text Alternative**: Show transcripts for all voice inputs
3. **Keyboard Control**: Allow keyboard control of voice features
4. **Error Messages**: Clear, actionable error messages
5. **Screen Reader**: Announce state changes

## Testing Strategy

1. **Unit Tests**: Parser logic and utility functions
2. **Integration Tests**: Voice recognition flow
3. **E2E Tests**: Full user journey with mock audio
4. **Performance Tests**: Response time and accuracy
5. **Accessibility Tests**: Screen reader compatibility

## Future Enhancements

1. **Multi-language Support**: Add English, Portuguese
2. **Voice Commands**: "Add to shopping list", "Show recipes"
3. **Speaker Recognition**: Personalized responses
4. **Offline Mode**: On-device recognition
5. **Voice Synthesis**: Read recipes aloud

## Conclusion

The Voice Recognition System provides a natural, efficient way for users to interact with kecarajocomer. By focusing on Spanish language optimization and smart parsing, it delivers a superior experience for the target audience while maintaining high performance and accessibility standards.