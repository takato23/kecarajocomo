import { useState, useCallback, useRef, useEffect } from 'react';

import { parseSpanishVoiceInput } from '@/lib/voice/spanishVoiceParser';
import { parseWithGemini, convertToShoppingCommands } from '@/lib/voice/geminiVoiceParser';

import { useSimpleVoiceRecognition } from './useSimpleVoiceRecognition';

interface ShoppingVoiceCommand {
  type: 'add' | 'complete' | 'remove' | 'quantity';
  item?: string;
  quantity?: number;
  unit?: string;
  action?: string;
}

interface UseShoppingVoiceProps {
  onAddItem?: (item: { name: string; quantity: number; unit: string }) => void;
  onCompleteItem?: (itemName: string) => void;
  onRemoveItem?: (itemName: string) => void;
  onUpdateQuantity?: (itemName: string, quantity: number) => void;
}

export function useShoppingVoice({
  onAddItem,
  onCompleteItem,
  onRemoveItem,
  onUpdateQuantity
}: UseShoppingVoiceProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const processedCommandsRef = useRef<Set<string>>(new Set());

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    toggleListening
  } = useSimpleVoiceRecognition();

  // Parse shopping commands from transcript
  const parseShoppingCommand = useCallback((text: string): ShoppingVoiceCommand | null => {
    const normalizedText = text.toLowerCase().trim();
    
    // Commands for completing items
    const completePatterns = [
      /(?:compré|comprado|listo|tengo|conseguí|ya tengo)\s+(.+)/,
      /(.+)\s+(?:comprado|listo|hecho|conseguido)/,
      /marcar?\s+(.+)\s+(?:como\s+)?(?:comprado|listo|completado)/
    ];

    // Commands for removing items
    const removePatterns = [
      /(?:quitar|eliminar|borrar|sacar)\s+(.+)/,
      /no\s+(?:necesito|quiero|comprar)\s+(.+)/,
      /(.+)\s+(?:no\s+)?(?:hace falta|necesario)/
    ];

    // Commands for adding items
    const addPatterns = [
      /(?:agregar|añadir|poner|necesito|quiero|comprar)\s+(.+)/,
      /(.+)\s+(?:a la lista|para comprar)/,
      /me falta\s+(.+)/
    ];

    // Commands for updating quantities
    const quantityPatterns = [
      /(?:cambiar|actualizar)\s+(.+)\s+(?:a|por)\s+(\d+(?:[.,]\d+)?)\s*(\w+)?/,
      /(\d+(?:[.,]\d+)?)\s*(\w+)?\s+(?:de\s+)?(.+)/
    ];

    // Check complete patterns
    for (const pattern of completePatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        return {
          type: 'complete',
          item: match[1].trim()
        };
      }
    }

    // Check remove patterns
    for (const pattern of removePatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        return {
          type: 'remove',
          item: match[1].trim()
        };
      }
    }

    // Check quantity patterns
    for (const pattern of quantityPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const quantity = parseFloat(match[1].replace(',', '.'));
        const unit = match[2] || 'unidades';
        const item = match[3]?.trim();
        
        if (item && quantity) {
          return {
            type: 'quantity',
            item,
            quantity,
            unit
          };
        }
      }
    }

    // Check add patterns - use existing parser for complex parsing
    for (const pattern of addPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const itemText = match[1].trim();
        const parsedItems = parseSpanishVoiceInput(itemText);
        
        if (parsedItems.length > 0) {
          const firstItem = parsedItems[0];
          return {
            type: 'add',
            item: firstItem.name,
            quantity: firstItem.quantity,
            unit: firstItem.unit
          };
        } else {
          // Fallback for simple items
          return {
            type: 'add',
            item: itemText,
            quantity: 1,
            unit: 'unidades'
          };
        }
      }
    }

    // If no specific pattern matches, try to parse as add command
    const parsedItems = parseSpanishVoiceInput(normalizedText);
    if (parsedItems.length > 0) {
      const firstItem = parsedItems[0];
      return {
        type: 'add',
        item: firstItem.name,
        quantity: firstItem.quantity,
        unit: firstItem.unit
      };
    }

    return null;
  }, []);

  // Process voice command
  const processCommand = useCallback(async (command: ShoppingVoiceCommand) => {
    setIsProcessing(true);
    setLastCommand(`${command.type}: ${command.item}`);

    try {
      switch (command.type) {
        case 'add':
          if (command.item && onAddItem) {
            await onAddItem({
              name: command.item,
              quantity: command.quantity || 1,
              unit: command.unit || 'unidades'
            });
          }
          break;

        case 'complete':
          if (command.item && onCompleteItem) {
            await onCompleteItem(command.item);
          }
          break;

        case 'remove':
          if (command.item && onRemoveItem) {
            await onRemoveItem(command.item);
          }
          break;

        case 'quantity':
          if (command.item && command.quantity && onUpdateQuantity) {
            await onUpdateQuantity(command.item, command.quantity);
          }
          break;
      }
    } catch (error: unknown) {
      console.error('Error processing voice command:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [onAddItem, onCompleteItem, onRemoveItem, onUpdateQuantity]);

  // Process transcript with Gemini AI
  const handleTranscript = useCallback(async (newTranscript: string) => {
    if (!newTranscript.trim() || isProcessing) return;

    const commandKey = newTranscript.toLowerCase().trim();
    
    // Avoid processing the same command multiple times
    if (processedCommandsRef.current.has(commandKey)) return;
    
    setIsProcessing(true);
    
    try {
      // Try Gemini AI parsing first
      const geminiResult = await parseWithGemini(newTranscript);
      
      if (geminiResult.success && geminiResult.commands.length > 0) {
        // Process multiple commands from Gemini
        const shoppingCommands = convertToShoppingCommands(geminiResult.commands);
        
        processedCommandsRef.current.add(commandKey);
        
        for (const command of shoppingCommands) {
          await processCommand(command);
        }
        
        setLastCommand(`Gemini: ${geminiResult.commands.length} comandos procesados`);
      } else {
        // Fallback to local parsing
        const command = parseShoppingCommand(newTranscript);
        if (command) {
          processedCommandsRef.current.add(commandKey);
          await processCommand(command);
        }
      }
      
      // Clean up old commands to prevent memory leak
      if (processedCommandsRef.current.size > 50) {
        const commands = Array.from(processedCommandsRef.current);
        processedCommandsRef.current = new Set(commands.slice(-25));
      }
    } catch (error: unknown) {
      console.error('Error processing transcript:', error);
      setLastCommand('Error procesando comando');
    } finally {
      setIsProcessing(false);
    }
  }, [parseShoppingCommand, processCommand, isProcessing]);

  // Auto-process transcript
  useEffect(() => {
    if (transcript) {
      handleTranscript(transcript);
    }
  }, [transcript, handleTranscript]);

  const clearProcessedCommands = useCallback(() => {
    processedCommandsRef.current.clear();
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
    isSupported,
    clearProcessedCommands,
    parseShoppingCommand
  };
}