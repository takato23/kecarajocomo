import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/types/database';

import type { HolisticFoodSystem } from '../core/HolisticSystem';

export interface UserProfile {
  id: string;
  userId: string;
  // Información básica
  householdSize: number;
  householdMembers: HouseholdMember[];
  monthlyBudget: number;
  
  // Restricciones y preferencias alimentarias
  dietaryRestrictions: DietaryRestriction[];
  allergies: string[];
  preferredCuisines: string[];
  dislikedIngredients: string[];
  
  // Objetivos nutricionales
  nutritionalGoals: NutritionalGoals;
  
  // Perfil de sabor
  tasteProfile: TasteProfile;
  
  // Nivel de habilidad culinaria
  cookingSkillLevel: 1 | 2 | 3 | 4 | 5;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface HouseholdMember {
  id: string;
  name: string;
  age: number;
  dietaryRestrictions?: DietaryRestriction[];
  allergies?: string[];
  preferences?: string[];
}

export type DietaryRestriction = 
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'lactose_free'
  | 'kosher'
  | 'halal'
  | 'keto'
  | 'paleo'
  | 'low_carb'
  | 'low_fat'
  | 'low_sodium'
  | 'diabetic'
  | 'pescatarian'
  | 'raw_food'
  | 'whole30';

export interface NutritionalGoals {
  caloriesPerDay?: number;
  proteinPerDay?: number;
  carbsPerDay?: number;
  fatPerDay?: number;
  fiberPerDay?: number;
  sodiumLimit?: number;
  sugarLimit?: number;
  specialGoals?: string[];
}

export interface TasteProfile {
  spicyTolerance: 'none' | 'mild' | 'medium' | 'hot' | 'very_hot';
  sweetPreference: 'low' | 'medium' | 'high';
  saltyPreference: 'low' | 'medium' | 'high';
  sourPreference: 'low' | 'medium' | 'high';
  bitterTolerance: 'low' | 'medium' | 'high';
  umamiAppreciation: 'low' | 'medium' | 'high';
  texturePreferences: TexturePreference[];
}

export type TexturePreference = 
  | 'crispy'
  | 'creamy'
  | 'crunchy'
  | 'soft'
  | 'chewy'
  | 'smooth'
  | 'chunky';

/**
 * Gestor de Perfiles de Usuario con Preferencias Dietéticas
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
      
      return this.mapDatabaseToProfile(data);
      
    } catch (error: unknown) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
  }
  
  /**
   * Crear o actualizar perfil
   */
  async upsertProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const profileData = this.mapProfileToDatabase(userId, profile);
      
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
      
      return this.mapDatabaseToProfile(data);
      
    } catch (error: unknown) {
      console.error('Error actualizando perfil:', error);
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
      console.error('Error actualizando restricciones:', error);
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
      console.error('Error actualizando alergias:', error);
      throw error;
    }
  }
  
  /**
   * Verificar si un ingrediente es compatible con el perfil
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
      
      // Verificar alergias
      const allergyMatch = profile.allergies.find(
        allergy => ingredient.toLowerCase().includes(allergy.toLowerCase())
      );
      
      if (allergyMatch) {
        return {
          compatible: false,
          reason: `Alergia a ${allergyMatch}`
        };
      }
      
      // Verificar ingredientes no deseados
      const dislikedMatch = profile.dislikedIngredients.find(
        disliked => ingredient.toLowerCase().includes(disliked.toLowerCase())
      );
      
      if (dislikedMatch) {
        return {
          compatible: false,
          reason: `No le gusta ${dislikedMatch}`
        };
      }
      
      // Verificar restricciones dietéticas
      const restriction = this.checkDietaryRestrictions(
        ingredient,
        profile.dietaryRestrictions
      );
      
      if (!restriction.compatible) {
        return restriction;
      }
      
      return { compatible: true };
      
    } catch (error: unknown) {
      console.error('Error verificando compatibilidad:', error);
      return { compatible: true };
    }
  }
  
  /**
   * Obtener recomendaciones basadas en perfil
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
      
      // Sugerir ingredientes basados en cocinas preferidas
      const suggestedIngredients = this.getSuggestedIngredients(
        profile.preferredCuisines
      );
      
      // Compilar lista de ingredientes a evitar
      const avoidIngredients = [
        ...profile.allergies,
        ...profile.dislikedIngredients,
        ...this.getRestrictedIngredients(profile.dietaryRestrictions)
      ];
      
      // Determinar enfoque nutricional
      const nutritionalFocus = this.getNutritionalFocus(profile.nutritionalGoals);
      
      return {
        suggestedIngredients,
        avoidIngredients,
        nutritionalFocus
      };
      
    } catch (error: unknown) {
      console.error('Error obteniendo recomendaciones:', error);
      return {
        suggestedIngredients: [],
        avoidIngredients: [],
        nutritionalFocus: []
      };
    }
  }
  
  /**
   * Mapear base de datos a modelo
   */
  private mapDatabaseToProfile(data: any): UserProfile {
    return {
      id: data.id,
      userId: data.user_id,
      householdSize: data.household_size || 1,
      householdMembers: data.household_members || [],
      monthlyBudget: data.monthly_budget || 0,
      dietaryRestrictions: data.dietary_restrictions || [],
      allergies: data.allergies || [],
      preferredCuisines: data.preferred_cuisines || [],
      dislikedIngredients: data.disliked_ingredients || [],
      nutritionalGoals: data.nutritional_goals || {},
      tasteProfile: data.taste_profile || this.getDefaultTasteProfile(),
      cookingSkillLevel: data.cooking_skill_level || 3,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
  
  /**
   * Mapear modelo a base de datos
   */
  private mapProfileToDatabase(userId: string, profile: Partial<UserProfile>): any {
    return {
      user_id: userId,
      household_size: profile.householdSize,
      household_members: profile.householdMembers ? JSON.stringify(profile.householdMembers) : undefined,
      monthly_budget: profile.monthlyBudget,
      dietary_restrictions: profile.dietaryRestrictions ? JSON.stringify(profile.dietaryRestrictions) : undefined,
      allergies: profile.allergies,
      preferred_cuisines: profile.preferredCuisines,
      disliked_ingredients: profile.dislikedIngredients,
      nutritional_goals: profile.nutritionalGoals ? JSON.stringify(profile.nutritionalGoals) : undefined,
      taste_profile: profile.tasteProfile ? JSON.stringify(profile.tasteProfile) : undefined,
      cooking_skill_level: profile.cookingSkillLevel
    };
  }
  
  /**
   * Verificar restricciones dietéticas
   */
  private checkDietaryRestrictions(
    ingredient: string,
    restrictions: DietaryRestriction[]
  ): { compatible: boolean; reason?: string } {
    const lower = ingredient.toLowerCase();
    
    for (const restriction of restrictions) {
      switch (restriction) {
        case 'vegetarian':
          if (this.isMeat(lower) || this.isFish(lower)) {
            return { compatible: false, reason: 'No apto para vegetarianos' };
          }
          break;
          
        case 'vegan':
          if (this.isMeat(lower) || this.isFish(lower) || this.isDairy(lower) || this.isEgg(lower)) {
            return { compatible: false, reason: 'No apto para veganos' };
          }
          break;
          
        case 'gluten_free':
          if (this.hasGluten(lower)) {
            return { compatible: false, reason: 'Contiene gluten' };
          }
          break;
          
        case 'lactose_free':
          if (this.hasLactose(lower)) {
            return { compatible: false, reason: 'Contiene lactosa' };
          }
          break;
          
        // Agregar más casos según sea necesario
      }
    }
    
    return { compatible: true };
  }
  
  /**
   * Helpers para verificar tipos de ingredientes
   */
  private isMeat(ingredient: string): boolean {
    const meats = ['carne', 'pollo', 'cerdo', 'cordero', 'pavo', 'jamón', 'salchicha', 'chorizo'];
    return meats.some(meat => ingredient.includes(meat));
  }
  
  private isFish(ingredient: string): boolean {
    const fish = ['pescado', 'atún', 'salmón', 'merluza', 'trucha', 'mariscos', 'camarones'];
    return fish.some(f => ingredient.includes(f));
  }
  
  private isDairy(ingredient: string): boolean {
    const dairy = ['leche', 'queso', 'yogur', 'manteca', 'crema', 'nata'];
    return dairy.some(d => ingredient.includes(d));
  }
  
  private isEgg(ingredient: string): boolean {
    return ingredient.includes('huevo');
  }
  
  private hasGluten(ingredient: string): boolean {
    const glutenItems = ['harina', 'pan', 'pasta', 'fideos', 'galletas', 'trigo', 'cebada', 'centeno'];
    return glutenItems.some(item => ingredient.includes(item));
  }
  
  private hasLactose(ingredient: string): boolean {
    return this.isDairy(ingredient);
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
   * Obtener ingredientes restringidos
   */
  private getRestrictedIngredients(restrictions: DietaryRestriction[]): string[] {
    const restricted: string[] = [];
    
    for (const restriction of restrictions) {
      switch (restriction) {
        case 'vegetarian':
        case 'vegan':
          restricted.push('carne', 'pollo', 'pescado', 'mariscos');
          if (restriction === 'vegan') {
            restricted.push('leche', 'queso', 'huevos', 'miel');
          }
          break;
          
        case 'gluten_free':
          restricted.push('trigo', 'harina', 'pan', 'pasta');
          break;
          
        case 'lactose_free':
          restricted.push('leche', 'queso', 'yogur', 'crema');
          break;
      }
    }
    
    return [...new Set(restricted)];
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
  
  /**
   * Obtener perfil de sabor por defecto
   */
  private getDefaultTasteProfile(): TasteProfile {
    return {
      spicyTolerance: 'medium',
      sweetPreference: 'medium',
      saltyPreference: 'medium',
      sourPreference: 'medium',
      bitterTolerance: 'medium',
      umamiAppreciation: 'medium',
      texturePreferences: ['crispy', 'creamy', 'soft']
    };
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