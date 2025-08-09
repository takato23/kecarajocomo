import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logger } from '@/services/logger';

import type { Database } from '@/types/database';
import type { HolisticFoodSystem } from '../core/HolisticSystem';

// Import consolidated types
import type {
  UserProfile,
  DietaryRestriction,
  HouseholdMember,
  NutritionalGoals,
  TasteProfile,
  TexturePreference
} from '@/types/profile';

// Import utilities
import { 
  isIngredientCompatible as checkIngredientCompatibility,
  getIngredientRestrictions,
  getCuisineSuggestions
} from '@/types/profile/utils';

// Import migration utilities
import { 
  prepareProfileForDatabase,
  parseProfileFromDatabase 
} from '@/types/profile/migration';

/**
 * Gestor de Perfiles de Usuario con Preferencias Dietéticas
 * Now using consolidated profile types
 */
export class ProfileManager {
  private supabase;
  
  constructor(private system: HolisticFoodSystem) {
    this.supabase = createClientComponentClient<Database>();
  }
  
  /**
   * Obtener perfil del usuario
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error || !data) {
        return null;
      }
      
      return parseProfileFromDatabase(data);
      
    } catch (error: unknown) {
      logger.error('Error obteniendo perfil:', 'ProfileManager', error);
      return null;
    }
  }
  
  /**
   * Crear o actualizar perfil
   */
  async upsertProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const profileData = prepareProfileForDatabase({
        ...profile,
        userId
      });
      
      const { data, error } = await this.supabase
        .from('profiles')
        .upsert({
          ...profileData,
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return parseProfileFromDatabase(data);
      
    } catch (error: unknown) {
      logger.error('Error actualizando perfil:', 'ProfileManager', error);
      throw new Error('Error al actualizar perfil');
    }
  }
  
  /**
   * Actualizar restricciones dietéticas
   */
  async updateDietaryRestrictions(
    userId: string,
    restrictions: DietaryRestriction[]
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({
          dietary_restrictions: restrictions,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (error) throw error;
      
    } catch (error: unknown) {
      logger.error('Error actualizando restricciones:', 'ProfileManager', error);
      throw error;
    }
  }
  
  /**
   * Actualizar alergias
   */
  async updateAllergies(userId: string, allergies: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({
          allergies,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (error) throw error;
      
    } catch (error: unknown) {
      logger.error('Error actualizando alergias:', 'ProfileManager', error);
      throw error;
    }
  }
  
  /**
   * Verificar si un ingrediente es compatible con el perfil
   * Now using the consolidated utility function
   */
  async isIngredientCompatible(
    userId: string,
    ingredient: string
  ): Promise<{ compatible: boolean; reason?: string }> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return { compatible: true };
      }
      
      // Check allergies
      const allergyMatch = profile.allergies.find(
        allergy => ingredient.toLowerCase().includes(allergy.toLowerCase())
      );
      
      if (allergyMatch) {
        return {
          compatible: false,
          reason: `Alergia a ${allergyMatch}`
        };
      }
      
      // Check disliked ingredients
      const dislikedMatch = profile.dislikedIngredients.find(
        disliked => ingredient.toLowerCase().includes(disliked.toLowerCase())
      );
      
      if (dislikedMatch) {
        return {
          compatible: false,
          reason: `No le gusta ${dislikedMatch}`
        };
      }
      
      // Use the utility function for dietary restrictions
      return checkIngredientCompatibility(ingredient, profile.dietaryRestrictions);
      
    } catch (error: unknown) {
      logger.error('Error verificando compatibilidad:', 'ProfileManager', error);
      return { compatible: true };
    }
  }
  
  /**
   * Obtener recomendaciones basadas en perfil
   * Now using consolidated utility functions
   */
  async getProfileBasedRecommendations(userId: string): Promise<{
    suggestedIngredients: string[];
    avoidIngredients: string[];
    nutritionalFocus: string[];
  }> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        return {
          suggestedIngredients: [],
          avoidIngredients: [],
          nutritionalFocus: []
        };
      }
      
      // Use utility functions
      const suggestedIngredients = this.getSuggestedIngredients(
        profile.preferredCuisines
      );
      
      const avoidIngredients = getIngredientRestrictions(profile);
      
      const nutritionalFocus = this.getNutritionalFocus(profile.nutritionalGoals);
      
      return {
        suggestedIngredients,
        avoidIngredients,
        nutritionalFocus
      };
      
    } catch (error: unknown) {
      logger.error('Error obteniendo recomendaciones:', 'ProfileManager', error);
      return {
        suggestedIngredients: [],
        avoidIngredients: [],
        nutritionalFocus: []
      };
    }
  }
  
  /**
   * Obtener ingredientes sugeridos por cocina
   */
  private getSuggestedIngredients(cuisines: string[]): string[] {
    const suggestions: string[] = [];
    
    const cuisineIngredients: Record<string, string[]> = {
      'italiana': ['tomate', 'albahaca', 'ajo', 'aceite de oliva', 'parmesano'],
      'mexicana': ['cilantro', 'lima', 'jalapeño', 'aguacate', 'tortillas'],
      'japonesa': ['soja', 'mirin', 'algas', 'arroz', 'wasabi'],
      'argentina': ['chimichurri', 'dulce de leche', 'yerba mate', 'empanadas'],
      'mediterránea': ['aceitunas', 'feta', 'limón', 'orégano', 'berenjena']
    };
    
    for (const cuisine of cuisines) {
      const ingredients = cuisineIngredients[cuisine.toLowerCase()];
      if (ingredients) {
        suggestions.push(...ingredients);
      }
    }
    
    return [...new Set(suggestions)]; // Eliminar duplicados
  }
  
  /**
   * Obtener enfoque nutricional
   */
  private getNutritionalFocus(goals: NutritionalGoals): string[] {
    const focus: string[] = [];
    
    if (goals.caloriesPerDay && goals.caloriesPerDay < 2000) {
      focus.push('Bajo en calorías');
    }
    
    if (goals.proteinPerDay && goals.proteinPerDay > 50) {
      focus.push('Alto en proteínas');
    }
    
    if (goals.carbsPerDay && goals.carbsPerDay < 100) {
      focus.push('Bajo en carbohidratos');
    }
    
    if (goals.sodiumLimit) {
      focus.push('Bajo en sodio');
    }
    
    if (goals.sugarLimit) {
      focus.push('Bajo en azúcar');
    }
    
    return focus;
  }
}

// Singleton
let profileManager: ProfileManager | null = null;

export function getProfileManager(system: HolisticFoodSystem): ProfileManager {
  if (!profileManager) {
    profileManager = new ProfileManager(system);
  }
  return profileManager;
}

// Re-export the consolidated UserProfile type for backward compatibility
export type { UserProfile, DietaryRestriction, HouseholdMember, NutritionalGoals, TasteProfile, TexturePreference };