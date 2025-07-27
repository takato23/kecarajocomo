/**
 * Recipe Photo Scan Service
 * Handles photo scanning with OCR+AI to extract recipes and ingredients
 * Supports camera capture and file upload
 */

import { UnifiedAIService } from '@/services/ai';
import { NotificationManager } from '@/services/notifications';
import { logger } from '@/services/logger';

import type { Recipe } from '../types';

export interface PhotoScanResult {
  success: boolean;
  extractedText: string;
  recipe?: Recipe;
  confidence: number;
  preview: string; // Base64 image for preview
  suggestions: string[];
  errors?: string[];
}

export interface ScanOptions {
  language?: 'es' | 'en' | 'auto';
  enhanceImage?: boolean;
  extractNutrition?: boolean;
  autoCorrect?: boolean;
  userId: string;
}

export class RecipePhotoScanService {
  private aiService: UnifiedAIService;
  private notificationService: NotificationManager;

  constructor() {
    this.aiService = new UnifiedAIService();
    this.notificationService = new NotificationManager();
  }

  /**
   * Scan recipe from photo file
   */
  async scanRecipeFromPhoto(
    file: File,
    options: ScanOptions
  ): Promise<PhotoScanResult> {
    try {
      await this.notificationService.notify({
        type: 'info',
        title: 'Escaneando Receta',
        message: 'Procesando imagen y extrayendo texto...',
        priority: 'medium'
      });

      // Validate file
      this.validateImageFile(file);

      // Convert to base64 for processing
      const base64Image = await this.fileToBase64(file);

      // Create preview
      const preview = await this.createImagePreview(base64Image);

      // Extract text using OCR + AI
      const extractedText = await this.extractTextFromImage(base64Image, options);

      // Parse recipe from extracted text
      const recipeData = await this.parseRecipeFromText(extractedText, options);

      const result: PhotoScanResult = {
        success: true,
        extractedText,
        recipe: recipeData.recipe,
        confidence: recipeData.confidence,
        preview,
        suggestions: recipeData.suggestions
      };

      await this.notificationService.notify({
        type: 'success',
        title: 'Escaneo Completado',
        message: `Receta "${recipeData.recipe?.title || 'Sin título'}" extraída con ${Math.round(recipeData.confidence * 100)}% de confianza`,
        priority: 'high'
      });

      return result;

    } catch (error: unknown) {
      logger.error('Error scanning recipe from photo:', 'RecipePhotoScanService', error);

      await this.notificationService.notify({
        type: 'error',
        title: 'Error en Escaneo',
        message: 'No se pudo extraer la receta de la imagen',
        priority: 'high'
      });

      return {
        success: false,
        extractedText: '',
        confidence: 0,
        preview: '',
        suggestions: [],
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Scan recipe from camera capture
   */
  async scanRecipeFromCamera(
    options: ScanOptions
  ): Promise<PhotoScanResult> {
    try {
      // Request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });

      // Create video element for capture
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo crear el contexto del canvas');
      }

      ctx.drawImage(video, 0, 0);

      // Stop camera stream
      stream.getTracks().forEach(track => track.stop());

      // Convert to blob and then to file
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });

      // Process the captured image
      return this.scanRecipeFromPhoto(file, options);

    } catch (error: unknown) {
      logger.error('Error scanning from camera:', 'RecipePhotoScanService', error);

      await this.notificationService.notify({
        type: 'error',
        title: 'Error de Cámara',
        message: 'No se pudo acceder a la cámara o capturar la imagen',
        priority: 'high'
      });

      throw error;
    }
  }

  /**
   * Re-process extracted text with corrections
   */
  async reprocessExtractedText(
    extractedText: string,
    corrections: string,
    options: ScanOptions
  ): Promise<PhotoScanResult> {
    try {
      const correctedText = `${extractedText}\n\nCorrecciones del usuario: ${corrections}`;
      
      const recipeData = await this.parseRecipeFromText(correctedText, options);

      return {
        success: true,
        extractedText: correctedText,
        recipe: recipeData.recipe,
        confidence: recipeData.confidence,
        preview: '', // No preview for reprocessing
        suggestions: recipeData.suggestions
      };

    } catch (error: unknown) {
      logger.error('Error reprocessing text:', 'RecipePhotoScanService', error);
      throw error;
    }
  }

  /**
   * Validate image file
   */
  private validateImageFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no soportado. Usa JPG, PNG o WebP.');
    }

    if (file.size > maxSize) {
      throw new Error('Archivo muy grande. Máximo 10MB.');
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create image preview with size optimization
   */
  private async createImagePreview(base64Image: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto del canvas'));
          return;
        }

        // Calculate preview dimensions (max 400px width)
        const maxWidth = 400;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw resized image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.onerror = () => reject(new Error('Error cargando la imagen'));
      img.src = `data:image/jpeg;base64,${base64Image}`;
    });
  }

  /**
   * Extract text from image using AI vision
   */
  private async extractTextFromImage(
    base64Image: string,
    options: ScanOptions
  ): Promise<string> {
    try {
      // Use the unified AI service for image analysis
      const extractedText = await this.aiService.analyzeImage(base64Image, {
        task: 'ocr',
        language: options.language || 'es',
        context: 'recipe_extraction'
      });

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No se pudo extraer texto de la imagen');
      }

      return extractedText;

    } catch (error: unknown) {
      logger.error('Error extracting text from image:', 'RecipePhotoScanService', error);
      throw new Error('Error en el reconocimiento de texto');
    }
  }

  /**
   * Parse recipe from extracted text using AI
   */
  private async parseRecipeFromText(
    text: string,
    options: ScanOptions
  ): Promise<{
    recipe: Recipe;
    confidence: number;
    suggestions: string[];
  }> {
    try {
      const parsePrompt = `
Analiza el siguiente texto extraído de una receta y conviértelo en un formato estructurado.
El texto puede contener errores de OCR, así que usa tu conocimiento culinario para corregir errores obvios.

Texto extraído:
${text}

Instrucciones:
1. Extrae el título de la receta
2. Identifica los ingredientes con sus cantidades
3. Extrae las instrucciones paso a paso
4. Determina tiempo de preparación y cocción si están disponibles
5. Calcula número de porciones si es posible
6. Corrige errores obvios de OCR (ej: "harlna" → "harina")
7. Proporciona sugerencias para mejorar la receta

Responde en formato JSON con esta estructura:
{
  "title": "Título de la receta",
  "description": "Descripción breve",
  "ingredients": [
    {
      "name": "nombre del ingrediente",
      "quantity": "cantidad",
      "unit": "unidad",
      "notes": "notas opcionales"
    }
  ],
  "instructions": ["paso 1", "paso 2", ...],
  "prep_time": minutos_preparacion,
  "cook_time": minutos_coccion,
  "servings": numero_porciones,
  "difficulty": "easy|medium|hard",
  "confidence": 0.0-1.0,
  "suggestions": ["sugerencia 1", "sugerencia 2", ...],
  "possible_errors": ["posible error 1", ...]
}

Si el texto no parece ser una receta, indica confidence: 0.0
`;

      const aiResponse = await this.aiService.generateCompletion(parsePrompt, {
        provider: 'openai', // Use OpenAI for better text analysis
        temperature: 0.3, // Low temperature for more consistent parsing
        maxTokens: 2000
      });

      let parsedData;
      try {
        parsedData = JSON.parse(aiResponse);
      } catch (parseError: unknown) {
        // Try to extract JSON from response if it's wrapped in text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se pudo parsear la respuesta de IA');
        }
      }

      // Validate minimum confidence
      if (parsedData.confidence < 0.3) {
        throw new Error('La imagen no parece contener una receta válida');
      }

      // Create recipe object
      const recipe: Recipe = {
        id: crypto.randomUUID(),
        user_id: options.userId,
        title: parsedData.title || 'Receta Escaneada',
        description: parsedData.description || 'Receta extraída desde imagen',
        instructions: Array.isArray(parsedData.instructions) 
          ? parsedData.instructions 
          : [parsedData.instructions || 'Instrucciones no detectadas'],
        ingredients: parsedData.ingredients || [],
        prep_time: parsedData.prep_time || 15,
        cook_time: parsedData.cook_time || 20,
        total_time: (parsedData.prep_time || 15) + (parsedData.cook_time || 20),
        servings: parsedData.servings || 4,
        difficulty: parsedData.difficulty || 'medium',
        cuisine: 'scanned',
        tags: ['escaneada', 'ocr'],
        nutritional_info: parsedData.nutritional_info,
        ai_generated: false,
        is_public: false,
        times_cooked: 0,
        source: 'photo_scan',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return {
        recipe,
        confidence: parsedData.confidence || 0.5,
        suggestions: [
          ...(parsedData.suggestions || []),
          'Revisa los ingredientes y cantidades extraídas',
          'Verifica que las instrucciones estén completas',
          ...(parsedData.possible_errors ? ['Posibles errores detectados en el texto original'] : [])
        ]
      };

    } catch (error: unknown) {
      logger.error('Error parsing recipe from text:', 'RecipePhotoScanService', error);
      throw new Error('No se pudo procesar el texto de la receta');
    }
  }

  /**
   * Enhance image quality before processing (optional)
   */
  private async enhanceImage(base64Image: string): Promise<string> {
    // This could implement image enhancement algorithms
    // For now, return the original image
    return base64Image;
  }

  /**
   * Check if camera is available
   */
  async isCameraAvailable(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch {
      return false;
    }
  }
}

export const recipePhotoScanService = new RecipePhotoScanService();