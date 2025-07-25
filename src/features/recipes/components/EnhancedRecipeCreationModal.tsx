'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  PenTool,
  Upload,
  Camera,
  FileText,
  Loader2,
  Eye,
  EyeOff,
  Brain,
  Zap,
  CheckCircle,
  Info,
  ChefHat,
  Clock,
  Users,
  Utensils,
  ArrowLeft,
  Plus,
  Trash2,
  Flame
} from 'lucide-react';

import { Button } from '@/components/design-system/Button';
import { Input } from '@/components/design-system/Input';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { useNotifications } from '@/services/notifications';
import { useAnalytics } from '@/services/analytics';
import { logger } from '@/services/logger';

import { enhancedAIRecipeService } from '../services/EnhancedAIRecipeService';
import { recipePhotoScanService } from '../services/RecipePhotoScanService';
import type { Recipe } from '../types';

interface EnhancedRecipeCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeCreated: (recipe: Recipe) => void;
  userId: string;
  isAdmin?: boolean;
}

type CreationMode = 'selection' | 'manual' | 'ai' | 'import' | 'scan' | 'ai-generating' | 'scan-processing' | 'import-processing';

interface AIGenerationState {
  showPrompt: boolean;
  provider: 'openai' | 'anthropic' | 'gemini';
  prompt: string;
  ingredients: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  maxTime: number;
  dietary: string[];
  generatedPrompt?: string;
  generatedRecipe?: Recipe;
  confidence?: number;
}

interface ScanState {
  selectedFile?: File;
  preview?: string;
  extractedText?: string;
  scannedRecipe?: Recipe;
  confidence?: number;
  useCamera: boolean;
}

export const EnhancedRecipeCreationModal: React.FC<EnhancedRecipeCreationModalProps> = ({
  isOpen,
  onClose,
  onRecipeCreated,
  userId,
  isAdmin = false
}) => {
  const [mode, setMode] = useState<CreationMode>('selection');
  const [aiState, setAIState] = useState<AIGenerationState>({
    showPrompt: false,
    provider: 'openai',
    prompt: '',
    ingredients: '',
    cuisine: '',
    difficulty: 'medium',
    servings: 4,
    maxTime: 60,
    dietary: []
  });
  const [scanState, setScanState] = useState<ScanState>({
    useCamera: false
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<{
    total: number;
    processed: number;
    imported: number;
    errors: number;
    currentRecipe?: string;
  } | null>(null);
  
  // Manual mode state
  const [manualFormData, setManualFormData] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    ingredients: [],
    instructions: [],
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    difficulty: 'medium'
  });
  const [currentIngredient, setCurrentIngredient] = useState({ name: '', quantity: '', unit: '' });
  const [currentInstruction, setCurrentInstruction] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotifications();
  const { track } = useAnalytics();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMode('selection');
      setImportProgress(null);
      setAIState({
        showPrompt: false,
        provider: 'openai',
        prompt: '',
        ingredients: '',
        cuisine: '',
        difficulty: 'medium',
        servings: 4,
        maxTime: 60,
        dietary: []
      });
      setScanState({ useCamera: false });
      setImportFile(null);
      setManualFormData({
        title: '',
        description: '',
        ingredients: [],
        instructions: [],
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        difficulty: 'medium'
      });
      setCurrentIngredient({ name: '', quantity: '', unit: '' });
      setCurrentInstruction('');
    }
  }, [isOpen]);

  const handleAIGeneration = async () => {
    setMode('ai-generating');
    
    try {
      // Track AI generation start
      track('ai_recipe_generation_start', {
        provider: aiState.provider,
        has_prompt: !!aiState.prompt,
        has_ingredients: !!aiState.ingredients,
        cuisine: aiState.cuisine,
        difficulty: aiState.difficulty,
        servings: aiState.servings,
      });
      
      const result = await enhancedAIRecipeService.generateRecipe({
        prompt: aiState.prompt,
        ingredients: aiState.ingredients.split(',').map(i => i.trim()).filter(Boolean),
        cuisine: aiState.cuisine,
        difficulty: aiState.difficulty,
        servings: aiState.servings,
        maxCookTime: aiState.maxTime,
        dietary: aiState.dietary,
        provider: aiState.provider,
        showPrompt: aiState.showPrompt
      });

      setAIState(prev => ({
        ...prev,
        generatedPrompt: result.generatedPrompt,
        generatedRecipe: result.recipe,
        confidence: result.confidence
      }));

      // Track successful generation
      track('ai_recipe_generation_success', {
        provider: aiState.provider,
        confidence_score: result.confidence,
        recipe_title: result.recipe.title,
        ingredients_count: result.recipe.ingredients.length,
      });

      notify({
        type: 'success',
        title: 'Receta Generada',
        message: `Receta "${result.recipe.title}" creada con ${Math.round(result.confidence * 100)}% de confianza`
      });

    } catch (error: unknown) {
      console.error('Error generating recipe:', error);
      setMode('ai');
      
      // Track error
      track('ai_recipe_generation_error', {
        provider: aiState.provider,
        error: error.message,
      });
      
      notify({
        type: 'error',
        title: 'Error de Generación',
        message: 'No se pudo generar la receta. Intenta de nuevo.'
      });
    }
  };

  const handlePhotoScan = async (file?: File) => {
    setMode('scan-processing');
    
    try {
      // Track scan start
      track('photo_scan_start', {
        file_size: file?.size,
        file_type: file?.type,
        use_camera: scanState.useCamera,
        user_id: userId,
      });
      
      const result = scanState.useCamera 
        ? await recipePhotoScanService.scanRecipeFromCamera({ userId })
        : await recipePhotoScanService.scanRecipeFromPhoto(file!, { userId });

      if (result.success && result.recipe) {
        setScanState(prev => ({
          ...prev,
          preview: result.preview,
          extractedText: result.extractedText,
          scannedRecipe: result.recipe,
          confidence: result.confidence
        }));
        
        // Track successful scan
        track('photo_scan_success', {
          confidence_score: result.confidence,
          recipe_title: result.recipe.title,
          ingredients_found: result.recipe.ingredients.length,
          instructions_found: result.recipe.instructions.length,
        });
        
        setMode('scan');
      } else {
        setMode('scan');
        
        // Track scan failure
        track('photo_scan_failed', {
          error: result.errors?.[0] || 'No recipe extracted',
          confidence_score: result.confidence,
        });
        
        notify({
          type: 'error',
          title: 'Error de Escaneo',
          message: result.errors?.[0] || 'No se pudo extraer la receta de la imagen'
        });
      }

    } catch (error: unknown) {
      console.error('Error scanning photo:', error);
      setMode('scan');
      
      // Track error
      track('photo_scan_error', {
        error: error.message,
        use_camera: scanState.useCamera,
      });
      
      notify({
        type: 'error',
        title: 'Error de Escaneo',
        message: 'No se pudo procesar la imagen'
      });
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    setMode('import-processing');
    
    try {
      // Track import start
      track('recipe_import_start', {
        file_name: importFile.name,
        file_size: importFile.size,
        file_type: importFile.type,
        user_id: userId,
        is_admin: isAdmin,
      });
      
      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('skipDuplicates', 'true');
      formData.append('updateExisting', 'false');
      formData.append('validateOnly', 'false');

      // Llamar al endpoint de importación
      const response = await fetch('/api/recipes/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la importación');
      }

      const result = await response.json();
      
      // Track import results
      track('recipe_import_success', {
        imported_count: result.imported,
        updated_count: result.updated,
        skipped_count: result.skipped,
        error_count: result.errors.length,
        total_recipes: result.total,
        success_rate: result.report.successRate,
        duration: result.report.duration
      });

      notify({
        type: result.success ? 'success' : 'warning',
        title: 'Importación Completada',
        message: `${result.imported} recetas importadas, ${result.updated} actualizadas, ${result.skipped} omitidas, ${result.errors.length} errores`
      });

      onClose();

    } catch (error: unknown) {
      console.error('Error importing recipes:', error);
      setMode('import');
      
      // Track error
      track('recipe_import_error', {
        file_name: importFile.name,
        error: error.message,
      });
      
      notify({
        type: 'error',
        title: 'Error de Importación',
        message: 'No se pudo importar el archivo de recetas'
      });
    }
  };

  const handleBulkImport = async () => {
    if (!isAdmin) {
      track('bulk_import_access_denied', {
        user_id: userId,
        is_admin: isAdmin,
      });
      
      notify({
        type: 'error',
        title: 'Acceso Denegado',
        message: 'Solo los administradores pueden importar el archivo completo de recetas'
      });
      return;
    }

    setMode('import-processing');
    
    try {
      // Track bulk import start
      track('bulk_import_start', {
        user_id: userId,
        is_admin: isAdmin,
      });
      
      // Llamar al endpoint para importar archivo completo
      const response = await fetch('/api/recipes/import?source=full&skipDuplicates=true&updateExisting=false', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la importación masiva');
      }

      const result = await response.json();

      // Track bulk import results
      track('bulk_import_success', {
        imported_count: result.imported,
        updated_count: result.updated,
        skipped_count: result.skipped,
        error_count: result.errors.length,
        total_recipes: result.total,
        success_rate: result.report.successRate,
        duration: result.report.duration
      });

      notify({
        type: result.success ? 'success' : 'warning',
        title: 'Importación Masiva Completada',
        message: `${result.imported} recetas importadas, ${result.updated} actualizadas, ${result.skipped} omitidas del archivo oficial`
      });

      onClose();

    } catch (error: unknown) {
      console.error('Error in bulk import:', error);
      setMode('import');
      
      // Track error
      track('bulk_import_error', {
        error: error.message,
      });
      
      notify({
        type: 'error',
        title: 'Error de Importación',
        message: 'No se pudo importar el archivo de recetas completo'
      });
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      // Check if user is authenticated
      if (!userId) {
        notify({
          type: 'error',
          title: 'No Autenticado',
          message: 'Debes iniciar sesión para guardar recetas'
        });
        return;
      }

      // Show saving state
      notify({
        type: 'info',
        title: 'Guardando...',
        message: 'Guardando tu receta en la base de datos'
      });

      // Save to Supabase - map fields to match DB schema
      const { supabase } = await import('@/lib/supabase');
      
      // Start with absolute minimum - only required fields
      const dbRecipe: any = {
        name: recipe.title,
        ingredients: recipe.ingredients.map(ing => ({
          ingredient: ing.ingredient,
          amount: ing.amount,
          unit: ing.unit
        }))
      };

      // Add user_id only if provided
      if (userId) {
        dbRecipe.user_id = userId;
      }

      // Log what we're trying to save
      logger.info('Saving recipe with minimal fields due to schema cache issues', 'EnhancedRecipeCreationModal');
      logger.debug('Minimal recipe data:', 'EnhancedRecipeCreationModal', {
        fields: Object.keys(dbRecipe),
        recipe: dbRecipe,
        userId: userId,
        hasUserId: !!userId
      });

      logger.debug('Attempting to save recipe:', 'EnhancedRecipeCreationModal', dbRecipe);
      
      // Try direct insert first
      let { data, error } = await supabase
        .from('recipes')
        .insert(dbRecipe)
        .select()
        .single();

      // If it fails with schema cache error, try RPC function (if available)
      if (error && error.code === 'PGRST204') {
        logger.warn('Schema cache error, trying RPC function', 'EnhancedRecipeCreationModal');
        
        const rpcResult = await supabase.rpc('create_recipe', {
          p_name: recipe.title,
          p_ingredients: dbRecipe.ingredients,
          p_user_id: userId || null,
          p_description: recipe.description || null,
          p_preparation_time: recipe.prep_time || null,
          p_cooking_time: recipe.cook_time || null,
          p_servings: recipe.servings || null,
          p_difficulty_level: recipe.difficulty || null,
          p_instructions: recipe.instructions || null,
          p_tags: recipe.tags || null
        });

        if (rpcResult.error) {
          // If RPC also fails, stick with original error
          logger.error('RPC function also failed', 'EnhancedRecipeCreationModal', rpcResult.error);
        } else if (rpcResult.data && rpcResult.data.length > 0) {
          // RPC succeeded, use its data
          data = rpcResult.data[0];
          error = null;
          logger.info('Recipe saved successfully via RPC', 'EnhancedRecipeCreationModal');
        }
      }

      if (error) throw error;

      // Convert back to our Recipe format for the callback
      const parsedIngredients = data.ingredients || [];
      const parsedMacros = data.macronutrients || null;

      const savedRecipe: Recipe = {
        id: data.id,
        user_id: data.user_id || userId,
        title: data.name,
        description: data.description || recipe.description || '',
        ingredients: parsedIngredients || recipe.ingredients,
        instructions: data.instructions || recipe.instructions || [],
        prep_time: data.preparation_time || recipe.prep_time || 0,
        cook_time: data.cooking_time || recipe.cook_time || 0,
        total_time: (recipe.prep_time || 0) + (recipe.cook_time || 0),
        servings: data.servings || recipe.servings || 4,
        difficulty: data.difficulty_level || recipe.difficulty || 'medium',
        cuisine_type: data.cuisine_type || recipe.cuisine_type || 'other',
        meal_type: 'main',
        dietary_tags: data.tags || recipe.tags || [],
        rating: data.rating || 0,
        times_cooked: 0,
        ai_generated: data.is_ai_generated || false,
        nutritional_info: parsedMacros || recipe.nutritional_info || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        },
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };
      
      // Track recipe creation
      track('recipe_created', {
        recipe_id: data.id,
        recipe_title: data.name,
        creation_method: mode.includes('ai') ? 'ai_generation' : mode.includes('scan') ? 'photo_scan' : 'manual',
        ingredients_count: Array.isArray(data.ingredients) ? data.ingredients.length : 0,
        instructions_count: data.instructions?.length || 0,
        user_id: userId,
      });
      
      onRecipeCreated(savedRecipe);
      onClose();
      
      notify({
        type: 'success',
        title: '¡Receta Guardada!',
        message: `"${data.name}" ha sido guardada exitosamente`,
        channels: ['toast'], // Solo mostrar toast, sin voz
        voice: false // Explícitamente desactivar voz
      });
    } catch (error: unknown) {
      logger.error('Error saving recipe', 'EnhancedRecipeCreationModal', error);
      
      // Log specific error details
      if (error.message) {
        logger.error(`Supabase error: ${error.message}`, 'EnhancedRecipeCreationModal', {
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }
      
      // Check if it's a schema cache error
      if (error.code === 'PGRST204') {
        notify({
          type: 'error',
          title: 'Error de Cache de Esquema',
          message: 'Hay un problema con el cache de la base de datos. La receta se guardó con campos mínimos. Contacta al administrador para actualizar el cache de PostgREST.'
        });
        
        logger.info('Schema cache issue detected. Admin should:', 'EnhancedRecipeCreationModal');
        logger.info('1. Go to Supabase Dashboard > Settings > API', 'EnhancedRecipeCreationModal');
        logger.info('2. Click "Reload Schema Cache"', 'EnhancedRecipeCreationModal');
        logger.info('3. Or run the SQL function in src/lib/supabase/create-recipe-function.sql', 'EnhancedRecipeCreationModal');
      } else {
        notify({
          type: 'error',
          title: 'Error al Guardar',
          message: error.message || 'No se pudo guardar la receta. Por favor intenta de nuevo.'
        });
      }
    }
  };

  const renderSelectionMode = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-600">
          <ChefHat className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Crear Nueva Receta</h2>
        <p className="mt-2 text-gray-600">Elige cómo quieres crear tu receta</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Manual Creation */}
        <Card 
          className="group cursor-pointer border-2 border-transparent p-4 sm:p-6 transition-all hover:border-blue-500 hover:shadow-lg"
          onClick={() => setMode('manual')}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-500">
              <PenTool className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Crear Manualmente</h3>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Escribe tu receta paso a paso desde cero
            </p>
          </div>
        </Card>

        {/* AI Generation */}
        <Card 
          className="group cursor-pointer border-2 border-transparent p-4 sm:p-6 transition-all hover:border-purple-500 hover:shadow-lg"
          onClick={() => setMode('ai')}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-500">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 group-hover:text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Generar con IA</h3>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Deja que la IA cree una receta basada en tus preferencias
            </p>
          </div>
        </Card>

        {/* Photo Scan */}
        <Card 
          className="group cursor-pointer border-2 border-transparent p-4 sm:p-6 transition-all hover:border-green-500 hover:shadow-lg"
          onClick={() => setMode('scan')}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-500">
              <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 group-hover:text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Escanear Receta</h3>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Extrae una receta desde una foto con OCR + IA
            </p>
          </div>
        </Card>

        {/* Import File */}
        <Card 
          className="group cursor-pointer border-2 border-transparent p-4 sm:p-6 transition-all hover:border-orange-500 hover:shadow-lg"
          onClick={() => setMode('import')}
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-500">
              <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 group-hover:text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Importar Archivo</h3>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Sube un archivo JSON con múltiples recetas
            </p>
          </div>
        </Card>
      </div>

      {/* Admin-only bulk import */}
      {isAdmin && (
        <div className="border-t pt-4 sm:pt-6">
          <Button
            onClick={handleBulkImport}
            variant="secondary"
            className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 text-xs sm:text-sm"
          >
            <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Importar Archivo Completo de Recetas (Admin)</span>
            <span className="sm:hidden">Importar Completo (Admin)</span>
          </Button>
        </div>
      )}
    </motion.div>
  );

  const renderAIMode = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Generación con IA</h3>
            <p className="text-sm text-gray-600">Configura los parámetros para tu receta</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMode('selection')}>
          Volver
        </Button>
      </div>

      {/* AI Provider Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Proveedor de IA</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'openai' as const, name: 'OpenAI', icon: Zap, color: 'green' },
            { id: 'anthropic' as const, name: 'Claude', icon: Brain, color: 'purple' },
            { id: 'gemini' as const, name: 'Gemini', icon: Sparkles, color: 'blue' }
          ].map((provider) => (
            <button
              key={provider.id}
              onClick={() => setAIState(prev => ({ ...prev, provider: provider.id }))}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                aiState.provider === provider.id
                  ? `border-${provider.color}-500 bg-${provider.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <provider.icon className={`h-5 w-5 ${
                aiState.provider === provider.id ? `text-${provider.color}-600` : 'text-gray-500'
              }`} />
              <span className="text-sm font-medium">{provider.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Descripción de Receta</label>
          <button
            onClick={() => setAIState(prev => ({ ...prev, showPrompt: !prev.showPrompt }))}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {aiState.showPrompt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {aiState.showPrompt ? 'Ocultar' : 'Ver'} Prompt
          </button>
        </div>
        <textarea
          value={aiState.prompt}
          onChange={(e) => setAIState(prev => ({ ...prev, prompt: e.target.value }))}
          placeholder="Ej: Una pasta cremosa con salmón y espinacas, estilo italiano, fácil de hacer..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>

      {/* Configuration Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes Disponibles</label>
          <Input
            value={aiState.ingredients}
            onChange={(e) => setAIState(prev => ({ ...prev, ingredients: e.target.value }))}
            placeholder="pollo, arroz, tomates..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cocina</label>
          <select
            value={aiState.cuisine}
            onChange={(e) => setAIState(prev => ({ ...prev, cuisine: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
          >
            <option value="">Cualquier cocina</option>
            <option value="italiana">Italiana</option>
            <option value="mexicana">Mexicana</option>
            <option value="argentina">Argentina</option>
            <option value="asiática">Asiática</option>
            <option value="mediterránea">Mediterránea</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dificultad</label>
          <select
            value={aiState.difficulty}
            onChange={(e) => setAIState(prev => ({ ...prev, difficulty: e.target.value as any }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Intermedio</option>
            <option value="hard">Avanzado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Porciones</label>
          <Input
            type="number"
            value={aiState.servings}
            onChange={(e) => setAIState(prev => ({ ...prev, servings: parseInt(e.target.value) || 4 }))}
            min="1"
            max="12"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setMode('selection')} className="flex-1">
          Cancelar
        </Button>
        <Button 
          onClick={handleAIGeneration}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Generar Receta
        </Button>
      </div>
    </motion.div>
  );

  const renderAIGeneratingMode = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-600">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">Generando Receta</h3>
      <p className="text-gray-600">La IA está creando tu receta personalizada...</p>
      
      {aiState.showPrompt && aiState.generatedPrompt && (
        <div className="mt-6 max-w-md rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-gray-700">Prompt Enviado:</h4>
          <p className="text-sm text-gray-600">{aiState.generatedPrompt}</p>
        </div>
      )}
    </motion.div>
  );

  const renderGeneratedRecipe = () => {
    if (!aiState.generatedRecipe) return null;

    const recipe = aiState.generatedRecipe;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{recipe.title}</h3>
            <p className="mt-1 text-gray-600">{recipe.description}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {recipe.total_time} min
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {recipe.servings} porciones
              </div>
              <div className="flex items-center gap-1">
                <Utensils className="h-4 w-4" />
                {recipe.difficulty}
              </div>
            </div>
          </div>
          <Badge variant={aiState.confidence! > 0.8 ? 'success' : 'warning'}>
            {Math.round(aiState.confidence! * 100)}% confianza
          </Badge>
        </div>

        {/* Recipe Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ingredients */}
          <div>
            <h4 className="mb-3 font-semibold text-gray-900">Ingredientes</h4>
            <div className="space-y-2">
              {recipe.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">{ing.quantity} {ing.unit}</span>
                  <span>{ing.name}</span>
                  {ing.notes && <span className="text-gray-500">({ing.notes})</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="mb-3 font-semibold text-gray-900">Instrucciones</h4>
            <div className="space-y-2">
              {recipe.instructions.map((instruction, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-medium">
                    {idx + 1}
                  </span>
                  <p className="flex-1">{instruction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setMode('ai')}>
            Regenerar
          </Button>
          <Button onClick={async () => await handleSaveRecipe(recipe)} className="flex-1">
            <CheckCircle className="mr-2 h-5 w-5" />
            Guardar Receta
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderScanMode = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Camera className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Escanear Receta</h3>
            <p className="text-sm text-gray-600">Extrae una receta desde una imagen</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMode('selection')}>
          Volver
        </Button>
      </div>

      {/* Scan Options */}
      <div className="grid gap-3 sm:grid-4 grid-cols-1 sm:grid-cols-2">
        {/* Camera Capture */}
        <Card 
          className={`cursor-pointer border-2 p-4 transition-all hover:shadow-md ${
            scanState.useCamera ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}
          onClick={() => setScanState(prev => ({ ...prev, useCamera: true }))}
        >
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Usar Cámara</h4>
              <p className="text-sm text-gray-600">Toma una foto directamente</p>
            </div>
          </div>
        </Card>

        {/* File Upload */}
        <Card 
          className={`cursor-pointer border-2 p-4 transition-all hover:shadow-md ${
            !scanState.useCamera ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}
          onClick={() => setScanState(prev => ({ ...prev, useCamera: false }))}
        >
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Subir Archivo</h4>
              <p className="text-sm text-gray-600">Selecciona desde tu dispositivo</p>
            </div>
          </div>
        </Card>
      </div>

      {/* File Input */}
      {!scanState.useCamera && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Imagen
          </label>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setScanState(prev => ({ ...prev, selectedFile: file }));
                const reader = new FileReader();
                reader.onload = (e) => {
                  setScanState(prev => ({ ...prev, preview: e.target?.result as string }));
                };
                reader.readAsDataURL(file);
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          />
        </div>
      )}

      {/* Preview */}
      {scanState.preview && (
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-2 font-medium text-gray-900">Vista Previa</h4>
          <img 
            src={scanState.preview} 
            alt="Preview" 
            className="max-h-48 w-full rounded-lg object-cover"
          />
        </div>
      )}

      {/* Scanned Recipe */}
      {scanState.scannedRecipe && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-900">Receta Extraída</h4>
            <Badge variant="success">
              {Math.round((scanState.confidence || 0) * 100)}% confianza
            </Badge>
          </div>
          <div className="space-y-2">
            <h5 className="font-medium text-gray-900">{scanState.scannedRecipe.title}</h5>
            <p className="text-sm text-gray-600">{scanState.scannedRecipe.description}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>{scanState.scannedRecipe.ingredients.length} ingredientes</span>
              <span>{scanState.scannedRecipe.instructions.length} pasos</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setMode('selection')} className="flex-1">
          Cancelar
        </Button>
        {scanState.scannedRecipe ? (
          <Button 
            onClick={async () => await handleSaveRecipe(scanState.scannedRecipe!)} 
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Guardar Receta
          </Button>
        ) : (
          <Button 
            onClick={() => handlePhotoScan(scanState.selectedFile)}
            disabled={!scanState.selectedFile && !scanState.useCamera}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Camera className="mr-2 h-5 w-5" />
            Escanear
          </Button>
        )}
      </div>
    </motion.div>
  );

  const renderImportMode = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Upload className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Importar Recetas</h3>
            <p className="text-sm text-gray-600">Sube un archivo JSON con múltiples recetas</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMode('selection')}>
          Volver
        </Button>
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo de Recetas (JSON)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {importFile && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">{importFile.name}</p>
                <p className="text-sm text-orange-700">
                  {(importFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Format Info */}
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Formato Esperado</h4>
              <p className="text-sm text-blue-800 mt-1">
                El archivo debe ser un JSON con un array de recetas. Cada receta debe tener:
                title, description, ingredients, instructions, prep_time, cook_time, servings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setMode('selection')} className="flex-1">
          Cancelar
        </Button>
        <Button 
          onClick={handleImport}
          disabled={!importFile}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          <Upload className="mr-2 h-5 w-5" />
          Importar Recetas
        </Button>
      </div>
    </motion.div>
  );

  const renderManualMode = () => {
    const addIngredient = () => {
      if (currentIngredient.name && currentIngredient.quantity) {
        setManualFormData(prev => ({
          ...prev,
          ingredients: [...(prev.ingredients || []), {
            ...currentIngredient,
            notes: ''
          }]
        }));
        setCurrentIngredient({ name: '', quantity: '', unit: '' });
      }
    };

    const addInstruction = () => {
      if (currentInstruction.trim()) {
        setManualFormData(prev => ({
          ...prev,
          instructions: [...(prev.instructions || []), currentInstruction.trim()]
        }));
        setCurrentInstruction('');
      }
    };

    const removeIngredient = (index: number) => {
      setFormData(prev => ({
        ...prev,
        ingredients: (prev.ingredients || []).filter((_, i) => i !== index)
      }));
    };

    const removeInstruction = (index: number) => {
      setFormData(prev => ({
        ...prev,
        instructions: (prev.instructions || []).filter((_, i) => i !== index)
      }));
    };

    const handleSaveManualRecipe = async () => {
      if (!manualFormData.title || !manualFormData.ingredients?.length || !manualFormData.instructions?.length) {
        notify({
          type: 'error',
          title: 'Campos Requeridos',
          message: 'Por favor completa título, ingredientes e instrucciones'
        });
        return;
      }

      const recipe: Recipe = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: manualFormData.title!,
        description: manualFormData.description || '',
        ingredients: manualFormData.ingredients!,
        instructions: manualFormData.instructions!,
        prep_time: manualFormData.prep_time || 15,
        cook_time: manualFormData.cook_time || 30,
        total_time: (manualFormData.prep_time || 15) + (manualFormData.cook_time || 30),
        servings: manualFormData.servings || 4,
        difficulty: manualFormData.difficulty || 'medium',
        cuisine_type: 'other',
        meal_type: 'main',
        dietary_tags: [],
        rating: 0,
        times_cooked: 0,
        ai_generated: false,
        nutritional_info: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await handleSaveRecipe(recipe);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl px-6 py-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
              >
                <PenTool className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Crear Receta Manual</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Comparte tu creación culinaria
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMode('selection')}
              className="hover:bg-white/80"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="max-h-[calc(70vh-100px)] overflow-y-auto px-6 space-y-6">

        {/* Basic Info */}
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-200"
        >
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Información Básica
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la Receta <span className="text-red-500">*</span>
              </label>
              <Input
                value={manualFormData.title || ''}
                onChange={(e) => setManualFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Pasta Carbonara Casera"
                className="w-full px-4 py-3 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={manualFormData.description || ''}
                onChange={(e) => setManualFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe tu receta: sabores, origen, ocasión especial..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Preparación
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={manualFormData.prep_time || 15}
                    onChange={(e) => setManualFormData(prev => ({ ...prev, prep_time: parseInt(e.target.value) || 15 }))}
                    min="0"
                    className="text-center pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">min</span>
                </div>
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Flame className="h-4 w-4 inline mr-1" />
                  Cocción
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={manualFormData.cook_time || 30}
                    onChange={(e) => setManualFormData(prev => ({ ...prev, cook_time: parseInt(e.target.value) || 30 }))}
                    min="0"
                    className="text-center pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">min</span>
                </div>
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Porciones
                </label>
                <Input
                  type="number"
                  value={manualFormData.servings || 4}
                  onChange={(e) => setManualFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 4 }))}
                  min="1"
                  max="12"
                  className="text-center"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ingredients */}
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-200"
        >
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-green-500" />
            Ingredientes <span className="text-red-500">*</span>
          </h4>
          
          {/* Add Ingredient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-12 gap-2">
              <Input
                placeholder="Cantidad"
                value={currentIngredient.quantity}
                onChange={(e) => setCurrentIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                className="col-span-3 bg-white"
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              />
              <Input
                placeholder="Unidad"
                value={currentIngredient.unit}
                onChange={(e) => setCurrentIngredient(prev => ({ ...prev, unit: e.target.value }))}
                className="col-span-2 bg-white"
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              />
              <Input
                placeholder="Ingrediente"
                value={currentIngredient.name}
                onChange={(e) => setCurrentIngredient(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-6 bg-white"
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              />
              <Button 
                onClick={addIngredient} 
                size="sm" 
                className="col-span-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Ingredients List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {manualFormData.ingredients?.length ? (
              manualFormData.ingredients.map((ing, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 group"
                >
                  <span className="text-sm flex items-center gap-2">
                    <span className="text-2xl">🥘</span>
                    <span>
                      <span className="font-semibold text-green-700">{ing.quantity} {ing.unit}</span>
                      <span className="text-gray-700 ml-1">{ing.name}</span>
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIngredient(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-4">Agrega ingredientes para tu receta</p>
            )}
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-200"
        >
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-500" />
            Instrucciones <span className="text-red-500">*</span>
          </h4>
          
          {/* Add Instruction */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex gap-2">
              <textarea
                placeholder="Describe el siguiente paso de la receta..."
                value={currentInstruction}
                onChange={(e) => setCurrentInstruction(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addInstruction();
                  }
                }}
                rows={2}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
              />
              <Button 
                onClick={addInstruction} 
                className="bg-orange-500 hover:bg-orange-600 text-white px-6"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">💡 Tip: Presiona Enter para agregar rápidamente</p>
          </div>

          {/* Instructions List */}
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {manualFormData.instructions?.length ? (
              manualFormData.instructions.map((instruction, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex gap-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 group"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold text-sm shadow-sm">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-gray-700 leading-relaxed">{instruction}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstruction(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-4">Agrega los pasos para preparar tu receta</p>
            )}
          </div>
        </motion.div>

        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 px-6">
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setMode('selection')} 
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancelar
            </Button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveManualRecipe}
              disabled={!manualFormData.title || !manualFormData.ingredients?.length || !manualFormData.instructions?.length}
              className="flex-1 relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-white font-medium shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Crear Receta
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderProcessingMode = () => {
    const isAIGenerating = mode === 'ai-generating';
    const isScanning = mode === 'scan-processing';
    const isImporting = mode === 'import-processing';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${
          isAIGenerating ? 'from-purple-400 to-pink-600' :
          isScanning ? 'from-green-400 to-blue-600' :
          'from-orange-400 to-red-600'
        }`}>
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          {isAIGenerating && 'Generando Receta'}
          {isScanning && 'Escaneando Imagen'}
          {isImporting && 'Importando Recetas'}
        </h3>
        <p className="text-gray-600 mb-4">
          {isAIGenerating && 'La IA está creando tu receta personalizada...'}
          {isScanning && 'Extrayendo receta de la imagen con OCR + IA...'}
          {isImporting && 'Procesando archivo y validando recetas...'}
        </p>
        
        {/* Progress bar for import */}
        {isImporting && importProgress && (
          <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso: {importProgress.processed} / {importProgress.total}</span>
              <span>{Math.round((importProgress.processed / importProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-orange-400 to-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
              />
            </div>
            {importProgress.currentRecipe && (
              <p className="text-sm text-gray-500 truncate">
                Procesando: {importProgress.currentRecipe}
              </p>
            )}
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <span className="text-green-600">✓ {importProgress.imported} importadas</span>
              {importProgress.errors > 0 && (
                <span className="text-red-600">✗ {importProgress.errors} errores</span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-2 py-4 sm:px-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative mx-auto max-w-4xl"
        >
          {/* Glass morphism container */}
          <div className="rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200/50 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-pink-600">
                  <ChefHat className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">Crear Receta</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                    {mode === 'selection' && 'Elige tu método preferido'}
                    {mode === 'manual' && 'Creación manual'}
                    {mode === 'ai' && 'Configuración de IA'}
                    {mode === 'ai-generating' && 'Generando con IA...'}
                    {mode === 'scan' && 'Escanear receta'}
                    {mode === 'import' && 'Importar archivo'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {mode === 'selection' && renderSelectionMode()}
                {mode === 'manual' && renderManualMode()}
                {mode === 'ai' && renderAIMode()}
                {mode === 'scan' && renderScanMode()}
                {mode === 'import' && renderImportMode()}
                {(mode === 'ai-generating' || mode === 'scan-processing' || mode === 'import-processing') && renderProcessingMode()}
                {aiState.generatedRecipe && mode === 'ai-generating' && renderGeneratedRecipe()}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};