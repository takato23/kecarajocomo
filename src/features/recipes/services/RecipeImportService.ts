/**
 * Servicio de Importación de Recetas
 * Backend service para importar recetas desde archivos JSON a Supabase
 * Solo accesible para administradores con validación completa
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import { NotificationManager } from '@/services/notifications';
import { getVoiceService } from '@/services/voice/UnifiedVoiceService';
import { logger } from '@/services/logger';

import type { Recipe } from '../types';

type RecipeRow = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
  report: ImportReport;
}

export interface ImportError {
  index: number;
  title: string;
  error: string;
  details?: any;
}

export interface ImportReport {
  startTime: string;
  endTime: string;
  duration: number;
  successRate: number;
  errorsByType: Record<string, number>;
  duplicatesFound: number;
  validationErrors: number;
}

export interface ImportProgress {
  total: number;
  processed: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  currentRecipe?: string;
  progress: number;
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  validateOnly?: boolean;
  userId: string;
  isAdmin: boolean;
}

export interface ImportRecipeData {
  id?: string;
  title: string;
  description: string;
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  tags: string[];
  imageUrl?: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  isPublic?: boolean;
  source?: string;
}

export class RecipeImportService {
  private supabase = createServerSupabaseClient();
  private notificationService = new NotificationManager();
  private progressCallback?: (progress: ImportProgress) => void;

  constructor(progressCallback?: (progress: ImportProgress) => void) {
    this.progressCallback = progressCallback;
  }

  /**
   * Importar recetas desde el archivo recipes_full.json (Solo admins)
   */
  async importFromRecipesFile(options: ImportOptions): Promise<ImportResult> {
    // Verificar que el usuario es admin
    if (!(await this.isAdmin(options.userId))) {
      throw new Error('Solo los administradores pueden importar recetas');
    }

    const startTime = Date.now();
    const result: ImportResult = {
      success: false,
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      report: {
        startTime: new Date(startTime).toISOString(),
        endTime: '',
        duration: 0,
        successRate: 0,
        errorsByType: {},
        duplicatesFound: 0,
        validationErrors: 0
      }
    };

    try {

      // Notificar inicio
      await this.notificationService.notify({
        type: 'info',
        title: 'Importación Iniciada',
        message: 'Comenzando importación de recetas desde recipes_full.json',
        userId: options.userId,
        priority: 'medium'
      });

      // Cargar archivo de recetas
      const rawRecipes = await this.loadRecipesFromFile();
      
      if (!rawRecipes || rawRecipes.length === 0) {
        throw new Error('No se encontraron recetas para importar');
      }

      // Mapear al formato esperado
      const recipes: ImportRecipeData[] = rawRecipes.map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        description: item.description,
        instructions: item.instructions || [],
        prepTimeMinutes: item.prepTimeMinutes || item.preparation_time || 0,
        cookTimeMinutes: item.cookTimeMinutes || item.cooking_time || 0,
        servings: item.servings || 4,
        difficulty: item.difficulty || 'medium',
        cuisine: item.cuisine || item.cuisine_type || 'internacional',
        tags: item.tags || [],
        imageUrl: item.imageUrl || item.image_url,
        ingredients: item.ingredients || [],
        nutritionInfo: item.nutritionInfo || item.macronutrients,
        isPublic: item.isPublic ?? item.is_public ?? true,
        source: item.source
      }));

      result.total = recipes.length;

      // Llamar al método principal de importación
      return await this.importRecipes(recipes, options.userId, {
        skipDuplicates: options.skipDuplicates,
        updateExisting: options.updateExisting,
        validateOnly: options.validateOnly
      });

    } catch (error: unknown) {
      logger.error('Error in recipe import:', 'RecipeImportService', error);
      
      await this.notificationService.notify({
        type: 'error',
        title: 'Error en Importación',
        message: 'No se pudo completar la importación de recetas',
        priority: 'high'
      });

      throw error;
    }
  }

  /**
   * Método principal para importar recetas con validación completa
   */
  async importRecipes(
    recipes: ImportRecipeData[],
    userId: string,
    options: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
      validateOnly?: boolean;
    } = {}
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const result: ImportResult = {
      success: false,
      total: recipes.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      report: {
        startTime: new Date(startTime).toISOString(),
        endTime: '',
        duration: 0,
        successRate: 0,
        errorsByType: {},
        duplicatesFound: 0,
        validationErrors: 0
      }
    };

    try {

      // Validar todas las recetas primero
      const validationResults = await this.validateRecipes(recipes);
      result.errors = validationResults.errors;
      result.report.validationErrors = validationResults.errors.length;

      if (options.validateOnly) {
        result.success = validationResults.valid > 0;
        result.report.endTime = new Date().toISOString();
        result.report.duration = Date.now() - startTime;
        return result;
      }

      // Procesar recetas válidas
      const validRecipes = recipes.filter((_, index) => 
        !validationResults.errors.some(error => error.index === index)
      );

      for (let i = 0; i < validRecipes.length; i++) {
        const recipe = validRecipes[i];
        
        try {
          // Actualizar progreso
          this.updateProgress({
            total: recipes.length,
            processed: i + 1,
            imported: result.imported,
            updated: result.updated,
            skipped: result.skipped,
            errors: result.errors.length,
            currentRecipe: recipe.title,
            progress: ((i + 1) / recipes.length) * 100
          });

          // Verificar si la receta ya existe
          const existingRecipe = await this.findExistingRecipe(recipe);
          
          if (existingRecipe) {
            result.report.duplicatesFound++;
            
            if (options.skipDuplicates) {
              result.skipped++;

              continue;
            }
            
            if (options.updateExisting) {
              await this.updateRecipe(existingRecipe.id, recipe, userId);
              result.updated++;

            } else {
              result.skipped++;

            }
          } else {
            await this.insertRecipe(recipe, userId);
            result.imported++;

          }

        } catch (error: unknown) {
          logger.error(`❌ Error procesando receta "${recipe.title}":`, 'RecipeImportService', error);
          result.errors.push({
            index: i,
            title: recipe.title,
            error: error instanceof Error ? error.message : 'Error desconocido',
            details: error
          });

          // Categorizar error por tipo
          const errorType = this.categorizeError(error);
          result.report.errorsByType[errorType] = (result.report.errorsByType[errorType] || 0) + 1;
        }
      }

      // Finalizar reporte
      const endTime = Date.now();
      result.report.endTime = new Date(endTime).toISOString();
      result.report.duration = endTime - startTime;
      result.report.successRate = ((result.imported + result.updated) / result.total) * 100;
      result.success = result.imported > 0 || result.updated > 0;

      // Enviar notificación de finalización con voz
      await this.sendCompletionNotification(userId, result);

      return result;

    } catch (error: unknown) {
      logger.error('💥 Error crítico en importación:', 'RecipeImportService', error);
      result.errors.push({
        index: -1,
        title: 'Error del sistema',
        error: error instanceof Error ? error.message : 'Error crítico desconocido',
        details: error
      });
      
      result.report.endTime = new Date().toISOString();
      result.report.duration = Date.now() - startTime;
      
      throw error;
    }
  }

  /**
   * Import recipes from custom JSON file
   */
  async importFromCustomFile(
    file: File,
    options: ImportOptions
  ): Promise<ImportResult> {
    // Verificar que el usuario es admin
    if (!(await this.isAdmin(options.userId))) {
      throw new Error('Solo los administradores pueden importar archivos de recetas');
    }

    try {

      // Procesar archivo JSON
      const recipes = await this.processRecipeFile(file);
      
      if (!recipes || recipes.length === 0) {
        throw new Error('El archivo no contiene recetas válidas');
      }

      // Usar el método principal de importación
      return await this.importRecipes(recipes, options.userId, {
        skipDuplicates: options.skipDuplicates,
        updateExisting: options.updateExisting,
        validateOnly: options.validateOnly
      });

    } catch (error: unknown) {
      logger.error('Error importando archivo personalizado:', 'RecipeImportService', error);
      throw error;
    }
  }

  /**
   * Procesar archivo JSON de recetas
   */
  static async processRecipeFile(file: File): Promise<ImportRecipeData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          
          if (!Array.isArray(jsonData)) {
            reject(new Error('El archivo debe contener un array de recetas'));
            return;
          }

          // Mapear datos del archivo al formato esperado
          const recipes: ImportRecipeData[] = jsonData.map((item: any) => ({
            id: item.id,
            title: item.title || item.name,
            description: item.description,
            instructions: item.instructions || [],
            prepTimeMinutes: item.prepTimeMinutes || item.preparation_time || 0,
            cookTimeMinutes: item.cookTimeMinutes || item.cooking_time || 0,
            servings: item.servings || 4,
            difficulty: item.difficulty || 'medium',
            cuisine: item.cuisine || item.cuisine_type || 'internacional',
            tags: item.tags || [],
            imageUrl: item.imageUrl || item.image_url,
            ingredients: item.ingredients || [],
            nutritionInfo: item.nutritionInfo || item.macronutrients,
            isPublic: item.isPublic ?? item.is_public ?? true,
            source: item.source
          }));

          resolve(recipes);
        } catch (error: unknown) {
          reject(new Error('Error parseando archivo JSON: ' + (error as Error).message));
        }
      };

      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  }

  /**
   * Método de conveniencia para usar desde UI
   */
  async processRecipeFile(file: File): Promise<ImportRecipeData[]> {
    return RecipeImportService.processRecipeFile(file);
  }

  /**
   * Load recipes from the recipes_full.json file
   */
  private async loadRecipesFromFile(): Promise<any[]> {
    try {
      // In a real app, this would fetch from the server
      // For now, we'll simulate loading from the file
      const response = await fetch('/api/recipes/full');
      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo de recetas');
      }
      return await response.json();
    } catch (error: unknown) {
      // Fallback: load from static file
      logger.warn('Could not load from API, attempting static file', 'RecipeImportService');
      
      try {
        const response = await fetch('/docs/recipes_full.json');
        if (!response.ok) {
          throw new Error('No se pudo cargar el archivo de recetas estático');
        }
        return await response.json();
      } catch (staticError: unknown) {
        logger.error('Could not load static file either:', 'RecipeImportService', staticError);
        throw new Error('No se pudo acceder al archivo de recetas');
      }
    }
  }

  /**
   * Validar formato y campos requeridos de las recetas
   */
  private async validateRecipes(recipes: ImportRecipeData[]): Promise<{
    valid: number;
    errors: ImportError[];
  }> {
    const errors: ImportError[] = [];
    let valid = 0;

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const validationErrors: string[] = [];

      // Validaciones requeridas
      if (!recipe.title || recipe.title.trim().length === 0) {
        validationErrors.push('Título requerido');
      }
      
      if (!recipe.description || recipe.description.trim().length === 0) {
        validationErrors.push('Descripción requerida');
      }

      if (!recipe.instructions || !Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
        validationErrors.push('Instrucciones requeridas');
      }

      if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
        validationErrors.push('Ingredientes requeridos');
      } else {
        // Validar cada ingrediente
        recipe.ingredients.forEach((ing, idx) => {
          if (!ing.name || !ing.quantity || !ing.unit) {
            validationErrors.push(`Ingrediente ${idx + 1}: nombre, cantidad y unidad requeridos`);
          }
        });
      }

      // Validaciones de tipos
      if (recipe.prepTimeMinutes && (typeof recipe.prepTimeMinutes !== 'number' || recipe.prepTimeMinutes < 0)) {
        validationErrors.push('Tiempo de preparación debe ser un número positivo');
      }

      if (recipe.cookTimeMinutes && (typeof recipe.cookTimeMinutes !== 'number' || recipe.cookTimeMinutes < 0)) {
        validationErrors.push('Tiempo de cocción debe ser un número positivo');
      }

      if (recipe.servings && (typeof recipe.servings !== 'number' || recipe.servings <= 0)) {
        validationErrors.push('Porciones debe ser un número positivo');
      }

      if (recipe.difficulty && !['easy', 'medium', 'hard'].includes(recipe.difficulty)) {
        validationErrors.push('Dificultad debe ser: easy, medium o hard');
      }

      // Validar información nutricional si existe
      if (recipe.nutritionInfo) {
        const nutrition = recipe.nutritionInfo;
        if (typeof nutrition.calories !== 'number' || nutrition.calories < 0) {
          validationErrors.push('Calorías deben ser un número positivo');
        }
      }

      if (validationErrors.length > 0) {
        errors.push({
          index: i,
          title: recipe.title || `Receta ${i + 1}`,
          error: validationErrors.join('; '),
          details: { validationErrors }
        });
      } else {
        valid++;
      }
    }

    return { valid, errors };
  }

  /**
   * Buscar receta existente por nombre y similitud de ingredientes
   */
  private async findExistingRecipe(recipe: ImportRecipeData): Promise<RecipeRow | null> {
    try {
      // Buscar por nombre exacto primero
      const { data: exactMatch } = await this.supabase
        .from('recipes')
        .select('*')
        .eq('name', recipe.title)
        .single();

      if (exactMatch) {
        return exactMatch;
      }

      // Buscar por similaridad de nombre (usando ILIKE)
      const { data: similarRecipes } = await this.supabase
        .from('recipes')
        .select('*')
        .ilike('name', `%${recipe.title.substring(0, 20)}%`);

      if (similarRecipes && similarRecipes.length > 0) {
        // Verificar similaridad de ingredientes
        for (const existingRecipe of similarRecipes) {
          if (this.areIngredientsSimilar(recipe.ingredients, existingRecipe.ingredients as any)) {
            return existingRecipe;
          }
        }
      }

      return null;
    } catch (error: unknown) {
      logger.error('Error buscando receta existente:', 'RecipeImportService', error);
      return null;
    }
  }

  /**
   * Comparar similaridad de ingredientes
   */
  private areIngredientsSimilar(
    newIngredients: ImportRecipeData['ingredients'],
    existingIngredients: any
  ): boolean {
    if (!existingIngredients || !Array.isArray(existingIngredients)) {
      return false;
    }

    const newNames = newIngredients.map(ing => ing.name.toLowerCase().trim()).sort();
    const existingNames = existingIngredients.map((ing: any) => 
      ing.name?.toLowerCase().trim() || ''
    ).sort();

    // Calcular similaridad (al menos 70% de ingredientes en común)
    const commonIngredients = newNames.filter(name => existingNames.includes(name));
    const similarity = commonIngredients.length / Math.max(newNames.length, existingNames.length);
    
    return similarity >= 0.7;
  }

  /**
   * Insertar nueva receta
   */
  private async insertRecipe(recipe: ImportRecipeData, userId: string): Promise<void> {
    const recipeData: RecipeInsert = {
      user_id: userId,
      name: recipe.title,
      description: recipe.description,
      preparation_time: recipe.prepTimeMinutes || null,
      cooking_time: recipe.cookTimeMinutes || null,
      servings: recipe.servings || null,
      difficulty_level: recipe.difficulty || null,
      cuisine_type: recipe.cuisine || null,
      image_url: recipe.imageUrl || null,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients as any,
      macronutrients: recipe.nutritionInfo as any || null,
      tags: recipe.tags || null,
      is_ai_generated: recipe.source === 'ai-generated',
      is_public: recipe.isPublic ?? true,
      source_url: null
    };

    const { error } = await this.supabase
      .from('recipes')
      .insert(recipeData);

    if (error) {
      throw new Error(`Error insertando receta: ${error.message}`);
    }
  }

  /**
   * Actualizar receta existente
   */
  private async updateRecipe(recipeId: string, recipe: ImportRecipeData, userId: string): Promise<void> {
    const updateData: Partial<RecipeInsert> = {
      description: recipe.description,
      preparation_time: recipe.prepTimeMinutes || null,
      cooking_time: recipe.cookTimeMinutes || null,
      servings: recipe.servings || null,
      difficulty_level: recipe.difficulty || null,
      cuisine_type: recipe.cuisine || null,
      image_url: recipe.imageUrl || null,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients as any,
      macronutrients: recipe.nutritionInfo as any || null,
      tags: recipe.tags || null,
      is_public: recipe.isPublic ?? true,
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('recipes')
      .update(updateData)
      .eq('id', recipeId);

    if (error) {
      throw new Error(`Error actualizando receta: ${error.message}`);
    }
  }

  /**
   * Verificar si el usuario es administrador
   */
  private async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data: user } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      return user?.role === 'admin';
    } catch (error: unknown) {
      logger.error('Error verificando rol de admin:', 'RecipeImportService', error);
      return false;
    }
  }

  /**
   * Categorizar tipo de error para reportes
   */
  private categorizeError(error: any): string {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('duplicate') || message.includes('unique')) {
      return 'duplicado';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validacion';
    }
    if (message.includes('foreign key') || message.includes('relation')) {
      return 'referencia';
    }
    if (message.includes('permission') || message.includes('access')) {
      return 'permisos';
    }
    if (message.includes('network') || message.includes('timeout')) {
      return 'conexion';
    }
    
    return 'desconocido';
  }

  /**
   * Actualizar progreso de importación
   */
  private updateProgress(progress: ImportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Enviar notificación de completación con voz
   */
  private async sendCompletionNotification(userId: string, result: ImportResult): Promise<void> {
    try {
      const message = result.success 
        ? `Importación completada: ${result.imported} recetas importadas, ${result.updated} actualizadas, ${result.skipped} omitidas`
        : `Importación fallida: ${result.errors.length} errores encontrados`;

      await this.notificationService.notify({
        type: result.success ? 'success' : 'error',
        title: 'Importación de Recetas',
        message,
        userId,
        priority: 'high',
        data: {
          result,
          timestamp: new Date().toISOString()
        }
      });

      // Feedback de voz en español
      try {
        const voiceService = getVoiceService();
        const voiceMessage = result.success 
          ? `Importación completada exitosamente. ${result.imported} recetas importadas.`
          : `Importación fallida. Se encontraron ${result.errors.length} errores.`;
        
        await voiceService.speak(voiceMessage, { lang: 'es-MX' });
      } catch (voiceError: unknown) {
        logger.warn('Error en feedback de voz:', 'RecipeImportService', voiceError);
      }
    } catch (error: unknown) {
      logger.error('Error enviando notificación:', 'RecipeImportService', error);
    }
  }

  /**
   * Process individual recipe for import (Legacy method - deprecated)
   */
  private async processRecipe(
    recipeData: any,
    existingTitles: Set<string>,
    options: ImportOptions
  ): Promise<{ recipe: string; status: 'imported' | 'skipped' | 'error'; reason?: string }> {
    const title = recipeData.title || 'Sin título';

    // Check for duplicates
    const titleLower = title.toLowerCase();
    if (existingTitles.has(titleLower)) {
      if (options.skipDuplicates && !options.updateExisting) {
        return {
          recipe: title,
          status: 'skipped',
          reason: 'Receta duplicada'
        };
      }
    }

    try {
      // Validate recipe data
      this.validateRecipe(recipeData);

      // Process image if available
      let imageUrl = recipeData.imageUrl;
      if (imageUrl && options.validateImages) {
        imageUrl = await this.validateAndProcessImage(imageUrl);
      }

      // Create recipe object
      const recipe: Recipe = {
        id: recipeData.id || crypto.randomUUID(),
        user_id: options.userId,
        title: recipeData.title,
        description: recipeData.description || '',
        instructions: Array.isArray(recipeData.instructions) 
          ? recipeData.instructions 
          : recipeData.instructions.split('\n').filter(Boolean),
        ingredients: this.normalizeIngredients(recipeData.ingredients),
        prep_time: recipeData.prepTimeMinutes || 15,
        cook_time: recipeData.cookTimeMinutes || 20,
        total_time: (recipeData.prepTimeMinutes || 15) + (recipeData.cookTimeMinutes || 20),
        servings: recipeData.servings || 4,
        difficulty: recipeData.difficulty || 'medium',
        cuisine: recipeData.cuisine || 'international',
        tags: recipeData.tags || [],
        image_url: imageUrl,
        nutritional_info: recipeData.nutritionalInfo,
        ai_generated: false,
        is_public: true, // Imported recipes are public by default
        times_cooked: 0,
        source: 'imported',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save recipe
      await this.saveRecipe(recipe, options.userId);
      
      // Add to existing titles set
      existingTitles.add(titleLower);

      return {
        recipe: title,
        status: 'imported'
      };

    } catch (error: unknown) {
      logger.error(`Error processing recipe ${title}:`, 'RecipeImportService', error);
      return {
        recipe: title,
        status: 'error',
        reason: error instanceof Error ? error.message : 'Error de procesamiento'
      };
    }
  }

  /**
   * Validate recipe structure
   */
  private validateRecipeStructure(recipes: any[]): void {
    if (recipes.length === 0) {
      throw new Error('El archivo no contiene recetas');
    }

    const sampleRecipe = recipes[0];
    const requiredFields = ['title', 'instructions', 'ingredients'];
    
    for (const field of requiredFields) {
      if (!sampleRecipe.hasOwnProperty(field)) {
        throw new Error(`Estructura de archivo inválida: falta el campo '${field}'`);
      }
    }
  }

  /**
   * Validate individual recipe
   */
  private validateRecipe(recipe: any): void {
    if (!recipe.title || typeof recipe.title !== 'string') {
      throw new Error('Título de receta inválido');
    }

    if (!recipe.instructions || (Array.isArray(recipe.instructions) && recipe.instructions.length === 0)) {
      throw new Error('Instrucciones de receta inválidas');
    }

    if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      throw new Error('Lista de ingredientes inválida');
    }
  }

  /**
   * Normalize ingredients format
   */
  private normalizeIngredients(ingredients: any[]): any[] {
    return ingredients.map(ing => ({
      name: ing.name || ing.ingredient || '',
      quantity: ing.quantity || ing.amount || 1,
      unit: ing.unit || 'u',
      notes: ing.notes || ing.note || undefined
    }));
  }

  /**
   * Validate and process image URL
   */
  private async validateAndProcessImage(imageUrl: string): Promise<string> {
    try {
      // Check if image is accessible
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (!response.ok) {
        logger.warn(`Image not accessible: ${imageUrl}`, 'RecipeImportService');
        return ''; // Return empty string if image not accessible
      }

      // TODO: Implement image processing/optimization if needed
      return imageUrl;

    } catch (error: unknown) {
      logger.warn(`Error validating image ${imageUrl}:`, 'RecipeImportService', error);
      return ''; // Return empty string on error
    }
  }

  /**
   * Save recipe to storage
   */
  private async saveRecipe(recipe: Recipe, userId: string): Promise<void> {
    try {
      // Get existing recipes
      const existingRecipes = await this.storageService.get(`user_recipes_${userId}`) || [];
      
      // Add new recipe
      const updatedRecipes = [...existingRecipes, recipe];
      
      // Save back to storage
      await this.storageService.set(`user_recipes_${userId}`, updatedRecipes);

      // Also save individual recipe for quick access
      await this.storageService.set(`recipe_${recipe.id}`, recipe);

    } catch (error: unknown) {
      logger.error('Error saving recipe:', 'RecipeImportService', error);
      throw new Error('No se pudo guardar la receta');
    }
  }

  /**
   * Read file content as text
   */
  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsText(file);
    });
  }
}

export const recipeImportService = new RecipeImportService();