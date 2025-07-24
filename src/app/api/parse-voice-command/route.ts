import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface VoiceCommand {
  action: 'add' | 'remove' | 'complete' | 'update_quantity' | 'clear_list' | 'unknown';
  item?: string;
  quantity?: number;
  unit?: string;
}

function createPrompt(transcript: string): string {
  return `
Eres un asistente de IA experto en procesar listas de compras para una app argentina.
Tu tarea es analizar un comando de voz en español, con modismos de Argentina, y convertirlo en un array de objetos JSON con acciones.

El JSON de salida debe ser un array de objetos. Cada objeto debe tener:
1. "action": El tipo de acción. Valores posibles: "add", "remove", "complete", "update_quantity", "clear_list", "unknown".
2. "item": El nombre del producto (string). Normalízalo (ej: "papas" en lugar de "papas fritas").
3. "quantity": La cantidad (number). Si no se especifica, usa 1.
4. "unit": La unidad (string). Usa "unidades" si no se especifica. Unidades comunes: kg, g, L, ml, paquete, caja, botella, lata, atado, docena.

Reglas Importantes:
- Maneja múltiples acciones en una sola frase.
- Reconoce productos y marcas comunes de Argentina (ej: yerba mate, dulce de leche, fernet, milanesas de nalga, criollitos, Cindor, Manaos, facturas, palta, churrasco, matambre).
- Entiende sinónimos argentinos: palta=aguacate, papa=patata, ananá=piña, etc.
- Si un comando no está relacionado con la lista de compras, devuelve un array vacío [].
- No inventes productos. Si no entiendes algo, puedes omitirlo o usar la acción "unknown".
- El output DEBE ser únicamente el array JSON, sin texto adicional.
- Para fracciones usa decimales: "medio kilo" = 0.5, "un cuarto" = 0.25, "kilo y medio" = 1.5.

Ejemplos:
- "necesito dos kilos de papas y un paquete de yerba mate"
  [{"action": "add", "item": "papas", "quantity": 2, "unit": "kg"}, {"action": "add", "item": "yerba mate", "quantity": 1, "unit": "paquete"}]

- "ya compré la leche y el pan"
  [{"action": "complete", "item": "leche"}, {"action": "complete", "item": "pan"}]

- "agregá un fernet y una coca, y sacá las galletitas de la lista"
  [{"action": "add", "item": "fernet", "quantity": 1, "unit": "unidades"}, {"action": "add", "item": "coca cola", "quantity": 1, "unit": "unidades"}, {"action": "remove", "item": "galletitas"}]

- "cambiá las bananas a media docena"
  [{"action": "update_quantity", "item": "bananas", "quantity": 6, "unit": "unidades"}]

- "qué hora es?"
  []

- "compré medio kilo de carne picada"
  [{"action": "complete", "item": "carne picada"}]

- "agregar una docena de huevos"
  [{"action": "add", "item": "huevos", "quantity": 12, "unit": "unidades"}]

Transcript: "${transcript}"
Output:`;
}

// Función de fallback para desarrollo/emergencia
function fallbackParsing(transcript: string): VoiceCommand[] {
  const lower = transcript.toLowerCase();
  const commands: VoiceCommand[] = [];

  // Patrones simples de fallback
  if (lower.includes('agregar') || lower.includes('necesito') || lower.includes('comprar')) {
    // Extraer producto básico
    const match = lower.match(/(?:agregar|necesito|comprar)\s+(.+)/);
    if (match) {
      const item = match[1].trim();
      commands.push({ action: 'add', item, quantity: 1, unit: 'unidades' });
    }
  }

  if (lower.includes('compré') || lower.includes('tengo') || lower.includes('conseguí')) {
    const match = lower.match(/(?:compré|tengo|conseguí)\s+(.+)/);
    if (match) {
      const item = match[1].trim();
      commands.push({ action: 'complete', item });
    }
  }

  if (lower.includes('quitar') || lower.includes('sacar') || lower.includes('eliminar')) {
    const match = lower.match(/(?:quitar|sacar|eliminar)\s+(.+)/);
    if (match) {
      const item = match[1].trim();
      commands.push({ action: 'remove', item });
    }
  }

  return commands;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a string' },
        { status: 400 }
      );
    }

    // Si no hay API key de Gemini, usar fallback
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found, using fallback parsing');
      const commands = fallbackParsing(transcript);
      return NextResponse.json({ commands });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = createPrompt(transcript);
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Limpiar el texto y parsear JSON
      const cleanedText = text.trim().replace(/```json\n?|\n?```/g, '');
      let commands: VoiceCommand[];
      
      try {
        commands = JSON.parse(cleanedText);
        
        // Validar que sea un array
        if (!Array.isArray(commands)) {
          throw new Error('Response is not an array');
        }

        // Validar estructura de cada comando
        commands = commands.filter((cmd): cmd is VoiceCommand => {
          return (
            typeof cmd === 'object' &&
            cmd !== null &&
            typeof cmd.action === 'string' &&
            ['add', 'remove', 'complete', 'update_quantity', 'clear_list', 'unknown'].includes(cmd.action)
          );
        });

      } catch (parseError: unknown) {
        console.error('Failed to parse Gemini response as JSON:', parseError);
        console.error('Raw response:', text);
        
        // Usar fallback si el parsing falla
        commands = fallbackParsing(transcript);
      }

      return NextResponse.json({ commands });

    } catch (geminiError: unknown) {
      console.error('Gemini API error:', geminiError);
      
      // Usar fallback si Gemini falla
      const commands = fallbackParsing(transcript);
      return NextResponse.json({ commands });
    }

  } catch (error: unknown) {
    console.error('Error in parse-voice-command API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}