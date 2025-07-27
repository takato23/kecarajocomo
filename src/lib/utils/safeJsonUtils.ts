/**
 * Safe JSON Utilities
 * 
 * Provides robust JSON parsing and stringification with error handling,
 * validation, and recovery mechanisms for AI-generated content.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

export interface SafeJsonOptions {
  strict?: boolean;
  allowComments?: boolean;
  allowTrailingCommas?: boolean;
  maxSize?: number;
  reviver?: (key: string, value: any) => any;
  replacer?: (key: string, value: any) => any;
}

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  originalText?: string;
  cleanedText?: string;
}

const DEFAULT_OPTIONS: SafeJsonOptions = {
  strict: false,
  allowComments: true,
  allowTrailingCommas: true,
  maxSize: 1024 * 1024, // 1MB
};

/**
 * Clean AI-generated JSON text by removing common issues
 */
export function cleanAIGeneratedJson(text: string): string {
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  // Remove leading/trailing whitespace again
  cleaned = cleaned.trim();
  
  // Fix common AI mistakes in JSON
  // 1. Remove comments (/* ... */ and // ...)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/\/\/.*$/gm, '');
  
  // 2. Fix trailing commas
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // 3. Fix unescaped quotes in strings
  cleaned = cleaned.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
    // Only fix quotes that are clearly problematic
    return match;
  });
  
  // 4. Fix missing quotes around object keys
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // 5. Fix single quotes to double quotes
  cleaned = cleaned.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
  
  // 6. Remove extra commas at the end of objects/arrays
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // 7. Ensure proper spacing
  cleaned = cleaned.replace(/:\s*([^\s])/g, ': $1');
  
  return cleaned;
}

/**
 * Attempt to fix malformed JSON through various strategies
 */
export function attemptJsonFix(text: string): { fixed: string; strategy: string } {
  const strategies = [
    {
      name: 'basic_clean',
      fix: (input: string) => cleanAIGeneratedJson(input),
    },
    {
      name: 'extract_json_object',
      fix: (input: string) => {
        // Try to extract a JSON object from text
        const match = input.match(/\{[\s\S]*\}/);
        return match ? match[0] : input;
      },
    },
    {
      name: 'extract_json_array',
      fix: (input: string) => {
        // Try to extract a JSON array from text
        const match = input.match(/\[[\s\S]*\]/);
        return match ? match[0] : input;
      },
    },
    {
      name: 'remove_text_outside_json',
      fix: (input: string) => {
        // Remove any text before the first { or [
        const startMatch = input.match(/^[^{[]*([{[])/);
        if (startMatch) {
          const startIndex = input.indexOf(startMatch[1]);
          input = input.slice(startIndex);
        }
        
        // Remove any text after the last } or ]
        const lastBrace = Math.max(input.lastIndexOf('}'), input.lastIndexOf(']'));
        if (lastBrace !== -1) {
          input = input.slice(0, lastBrace + 1);
        }
        
        return input;
      },
    },
    {
      name: 'fix_escaped_quotes',
      fix: (input: string) => {
        // Fix escaped quotes that might be causing issues
        return input.replace(/\\"/g, '"').replace(/\\'/g, "'");
      },
    },
  ];
  
  for (const strategy of strategies) {
    try {
      const fixed = strategy.fix(text);
      JSON.parse(fixed); // Test if it's valid JSON
      return { fixed, strategy: strategy.name };
    } catch {
      // Continue to next strategy
    }
  }
  
  return { fixed: text, strategy: 'none' };
}

/**
 * Safely parse JSON with comprehensive error handling
 */
export function safeJsonParse<T = any>(
  text: string,
  options: SafeJsonOptions = {}
): ParseResult<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];
  let originalText = text;
  
  // Check size limit
  if (config.maxSize && text.length > config.maxSize) {
    return {
      success: false,
      error: `Input too large: ${text.length} bytes (max: ${config.maxSize})`,
      originalText,
    };
  }
  
  // Initial cleaning
  let cleanedText = cleanAIGeneratedJson(text);
  
  if (cleanedText !== originalText) {
    warnings.push('Text was cleaned to remove formatting issues');
  }
  
  // First attempt - try parsing cleaned text
  try {
    const parsed = JSON.parse(cleanedText, config.reviver);
    return {
      success: true,
      data: parsed,
      warnings,
      originalText,
      cleanedText,
    };
  } catch (firstError) {
    // Second attempt - try fixing malformed JSON
    const { fixed, strategy } = attemptJsonFix(cleanedText);
    
    if (strategy !== 'none') {
      warnings.push(`Applied fix strategy: ${strategy}`);
      cleanedText = fixed;
      
      try {
        const parsed = JSON.parse(cleanedText, config.reviver);
        return {
          success: true,
          data: parsed,
          warnings,
          originalText,
          cleanedText,
        };
      } catch (secondError) {
        // Continue to more aggressive fixing
      }
    }
    
    // Third attempt - try to extract partial JSON
    if (!config.strict) {
      try {
        // Try to find and parse the largest valid JSON substring
        const partialResult = extractPartialJson(cleanedText);
        if (partialResult.success) {
          warnings.push('Extracted partial JSON from malformed input');
          return {
            success: true,
            data: partialResult.data,
            warnings,
            originalText,
            cleanedText: partialResult.extracted,
          };
        }
      } catch {
        // Continue to final error
      }
    }
    
    // Final failure
    return {
      success: false,
      error: `JSON parsing failed: ${firstError instanceof Error ? firstError.message : String(firstError)}`,
      warnings,
      originalText,
      cleanedText,
    };
  }
}

/**
 * Safely parse JSON with Zod schema validation
 */
export function safeJsonParseWithSchema<T>(
  text: string,
  schema: z.ZodSchema<T>,
  options: SafeJsonOptions = {}
): ParseResult<T> {
  const parseResult = safeJsonParse(text, options);
  
  if (!parseResult.success) {
    return parseResult;
  }
  
  try {
    const validatedData = schema.parse(parseResult.data);
    return {
      ...parseResult,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Schema validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        warnings: parseResult.warnings,
        originalText: parseResult.originalText,
        cleanedText: parseResult.cleanedText,
      };
    }
    
    return {
      success: false,
      error: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
      warnings: parseResult.warnings,
      originalText: parseResult.originalText,
      cleanedText: parseResult.cleanedText,
    };
  }
}

/**
 * Extract partial JSON from malformed text
 */
function extractPartialJson(text: string): { success: boolean; data?: any; extracted?: string } {
  // Try to find balanced braces/brackets
  const openChars = ['{', '['];
  const closeChars = ['}', ']'];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (openChars.includes(char)) {
      const closeChar = closeChars[openChars.indexOf(char)];
      const extracted = extractBalanced(text, i, char, closeChar);
      
      if (extracted) {
        try {
          const parsed = JSON.parse(extracted);
          return { success: true, data: parsed, extracted };
        } catch {
          // Continue searching
        }
      }
    }
  }
  
  return { success: false };
}

/**
 * Extract balanced brackets/braces from text
 */
function extractBalanced(text: string, start: number, openChar: string, closeChar: string): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"' && !escaped) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }
  }
  
  return null;
}

/**
 * Safely stringify object to JSON
 */
export function safeJsonStringify(
  obj: any,
  options: SafeJsonOptions = {}
): { success: boolean; json?: string; error?: string } {
  try {
    const json = JSON.stringify(obj, options.replacer, 2);
    return { success: true, json };
  } catch (error) {
    logger.error('JSON stringify error:', 'safeJsonUtils', {
      error: error instanceof Error ? error.message : String(error),
      objectType: typeof obj,
      objectConstructor: obj?.constructor?.name,
    });
    
    return {
      success: false,
      error: `JSON stringify failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Validate JSON structure without parsing
 */
export function validateJsonStructure(text: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for basic structure
  const trimmed = text.trim();
  
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    issues.push('JSON must start with { or [');
    suggestions.push('Ensure the response starts with a JSON object or array');
  }
  
  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
    issues.push('JSON must end with } or ]');
    suggestions.push('Ensure the response ends with proper closing bracket');
  }
  
  // Check for common issues
  if (trimmed.includes('```')) {
    issues.push('Contains markdown code blocks');
    suggestions.push('Remove markdown formatting from JSON response');
  }
  
  if (/,\s*[}\]]/.test(trimmed)) {
    issues.push('Contains trailing commas');
    suggestions.push('Remove trailing commas before closing brackets');
  }
  
  if (/\/\/|\/\*/.test(trimmed)) {
    issues.push('Contains comments');
    suggestions.push('Remove JavaScript comments from JSON');
  }
  
  // Check bracket balance
  const brackets = { '{': 0, '[': 0, '"': 0 };
  let inString = false;
  let escaped = false;
  
  for (const char of trimmed) {
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"' && !escaped) {
      inString = !inString;
      brackets['"']++;
    }
    
    if (!inString) {
      if (char === '{') brackets['{']++;
      else if (char === '}') brackets['{']--;
      else if (char === '[') brackets['[']++;
      else if (char === ']') brackets['[']--;
    }
  }
  
  if (brackets['{'] !== 0) {
    issues.push('Unbalanced curly braces');
    suggestions.push('Check that all { have matching }');
  }
  
  if (brackets['['] !== 0) {
    issues.push('Unbalanced square brackets');
    suggestions.push('Check that all [ have matching ]');
  }
  
  if (brackets['"'] % 2 !== 0) {
    issues.push('Unbalanced quotes');
    suggestions.push('Check that all quotes are properly paired');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Utility for handling AI responses that might contain JSON
 */
export function extractAndParseJsonFromAIResponse<T>(
  response: string,
  schema?: z.ZodSchema<T>,
  options: SafeJsonOptions = {}
): ParseResult<T> {
  // First, try to extract JSON from the response
  const jsonExtractionResult = extractJsonFromText(response);
  
  if (!jsonExtractionResult.success) {
    return {
      success: false,
      error: 'No valid JSON found in AI response',
      originalText: response,
    };
  }
  
  // Then parse the extracted JSON
  if (schema) {
    return safeJsonParseWithSchema(jsonExtractionResult.json!, schema, options);
  } else {
    return safeJsonParse<T>(jsonExtractionResult.json!, options);
  }
}

/**
 * Extract JSON from mixed text content
 */
function extractJsonFromText(text: string): { success: boolean; json?: string; method?: string } {
  // Method 1: Look for JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
  if (codeBlockMatch) {
    return { success: true, json: codeBlockMatch[1], method: 'code_block' };
  }
  
  // Method 2: Look for JSON object in text
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      JSON.parse(objectMatch[0]);
      return { success: true, json: objectMatch[0], method: 'object_extraction' };
    } catch {
      // Continue to next method
    }
  }
  
  // Method 3: Look for JSON array in text
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      JSON.parse(arrayMatch[0]);
      return { success: true, json: arrayMatch[0], method: 'array_extraction' };
    } catch {
      // Continue to next method
    }
  }
  
  return { success: false };
}

// Export types
export type { SafeJsonOptions, ParseResult };