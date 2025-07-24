# Voice Recognition System for Pantry Management

## Overview

The voice recognition system enables users to add pantry items using natural Spanish language voice commands. The system includes:

- **Spanish Voice Parser**: Intelligent parsing of Spanish voice input with quantity, unit, and ingredient extraction
- **Voice Recording Hook**: Browser-based speech recognition with real-time transcription
- **UI Components**: Beautiful, animated voice recording interfaces with visual feedback
- **Integration Examples**: Multiple patterns for integrating voice input into forms

## Features

### 1. Spanish Language Processing

The parser understands natural Spanish patterns:

```javascript
"1 kilo de milanesa" → { quantity: 1, unit: "kg", name: "milanesa" }
"una docena de huevos" → { quantity: 12, unit: "pcs", name: "huevos" }
"medio kilo de queso" → { quantity: 0.5, unit: "kg", name: "queso" }
"2 litros de leche" → { quantity: 2, unit: "L", name: "leche" }
```

### 2. Number Recognition

Supports both numeric and Spanish word numbers:
- Numeric: "1", "2.5", "0.5"
- Words: "uno", "dos", "veinte", "cien"
- Fractions: "medio", "cuarto", "tercio"
- Special: "docena" (12), "media docena" (6)

### 3. Unit Conversion

Automatically recognizes and normalizes units:
- Weight: kilo/kg, gramo/g, libra/lb, onza/oz
- Volume: litro/L, mililitro/ml, taza/cup, vaso
- Count: pieza/pcs, paquete/pack, docena, manojo/bunch
- Containers: lata/can, frasco/jar, botella/bottle, caja/box

### 4. Multi-Item Support

Parse multiple items in one command:
- "Un kilo de papa y dos cebollas"
- "Leche, huevos y pan"
- "2 latas de atún, 1 frasco de mayonesa"

## Components

### VoiceRecorder

Full-featured voice recording component with visual feedback:

```jsx
import { VoiceRecorder } from '@/components/voice';

<VoiceRecorder
  onItemsParsed={(items) => console.log(items)}
  showParsedItems={true}
  autoStart={false}
  className="shadow-lg"
/>
```

Features:
- Animated audio visualizer showing voice levels
- Real-time transcription display
- Smart pause detection for continuous speaking
- Auto-stop after silence detection
- Visual feedback for recording state

### VoiceInputButton

Compact voice input button for inline use:

```jsx
import { VoiceInputButton } from '@/components/voice';

<VoiceInputButton
  onItemsParsed={handleItemsParsed}
  buttonText="Dictar"
  size="md"
  variant="secondary"
/>
```

### PantryItemFormWithVoice

Enhanced pantry form with integrated voice input:

```jsx
import { PantryItemFormWithVoice } from '@/features/pantry/components';

<PantryItemFormWithVoice
  onClose={handleClose}
  onSuccess={handleSuccess}
/>
```

Features:
- Mode selector (Voice/Manual/Selection)
- Batch add for multiple items
- Auto-categorization based on ingredient names
- Smart location suggestions

## Hook Usage

### useVoiceRecording

Custom hook for voice recording functionality:

```javascript
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

const {
  isRecording,
  isSupported,
  transcript,
  interimTranscript,
  parsedItems,
  error,
  permissionStatus,
  startRecording,
  stopRecording,
  toggleRecording,
  clearTranscript,
  parseTranscript,
} = useVoiceRecording({
  continuous: true,
  interimResults: true,
  language: 'es-MX',
  maxSilenceDuration: 2000,
  autoParse: true,
  onTranscriptChange: (transcript) => console.log(transcript),
  onItemsParsed: (items) => console.log(items),
});
```

## Parser API

### parseSpanishVoiceInput

Parse a single voice transcript:

```javascript
import { parseSpanishVoiceInput } from '@/lib/voice/spanishVoiceParser';

const items = parseSpanishVoiceInput("un kilo de papa y dos litros de leche");
// Returns array of ParsedIngredientInput objects
```

### validateParsedInput

Validate parsed items before saving:

```javascript
import { validateParsedInput } from '@/lib/voice/spanishVoiceParser';

const validation = validateParsedInput(parsedItem);
if (validation.isValid) {
  // Save item
} else {
  // Show errors: validation.errors
}
```

## Browser Support

Voice recognition is supported in:
- ✅ Chrome (recommended)
- ✅ Edge
- ✅ Safari (iOS 14.5+)
- ❌ Firefox (not supported)

## Implementation Examples

### 1. Simple Voice Button

Add voice input to any form:

```jsx
<form>
  <input name="ingredient" />
  <VoiceInputButton
    onTranscriptChange={(text) => {
      form.setValue('ingredient', text);
    }}
  />
</form>
```

### 2. Batch Item Addition

Process multiple items at once:

```jsx
const handleItemsParsed = async (items) => {
  for (const item of items) {
    await addPantryItem({
      name: item.extracted_name,
      quantity: item.quantity,
      unit: item.unit,
      category: determineCategory(item.extracted_name),
    });
  }
};

<VoiceRecorder onItemsParsed={handleItemsParsed} />
```

### 3. Custom UI Integration

Build your own voice UI:

```jsx
const { isRecording, startRecording, stopRecording, transcript } = useVoiceRecording();

<button onClick={isRecording ? stopRecording : startRecording}>
  {isRecording ? '🔴 Recording...' : '🎤 Start'}
</button>
{transcript && <p>{transcript}</p>}
```

## Best Practices

1. **User Feedback**: Always show visual feedback when recording
2. **Error Handling**: Handle permission denials gracefully
3. **Validation**: Validate parsed items before saving
4. **Accessibility**: Provide alternative input methods
5. **Language**: Set appropriate language code (es-MX, es-ES, etc.)

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Guide users to browser settings
   - Show clear error messages
   - Provide manual input fallback

2. **No Speech Detected**
   - Check microphone levels
   - Ensure quiet environment
   - Increase maxSilenceDuration

3. **Poor Recognition**
   - Speak clearly and slowly
   - Use common Spanish terms
   - Avoid background noise

### Debug Mode

Enable debug logging:

```javascript
const { transcript, parsedItems } = useVoiceRecording({
  onTranscriptChange: (text) => console.log('Transcript:', text),
  onItemsParsed: (items) => console.log('Parsed:', items),
});
```

## Future Enhancements

- [ ] Support for more Spanish dialects
- [ ] Offline voice recognition
- [ ] Voice commands for other actions
- [ ] Multi-language support
- [ ] Custom vocabulary training
- [ ] Voice feedback/confirmation