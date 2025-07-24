import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

// Importar subsistemas
import { ReceiptScanner } from '../scanner/ReceiptScanner';
import { getPantryManager, PantryManager } from '../pantry/PantryManager';
import { getMealPlanner, MealPlanner } from '../planner/MealPlanner';
import { getShoppingOptimizer, ShoppingOptimizer } from '../shopping/ShoppingOptimizer';
import { getProfileManager, ProfileManager } from '../profile/ProfileManager';

/**
 * Sistema Holístico Central de KeCarajoComér
 * Conecta todos los subsistemas de manera inteligente
 */
export class HolisticFoodSystem {
  private supabase;
  
  // Subsistemas
  private scanner: ReceiptScanner;
  private pantryManager: PantryManager;
  private mealPlanner: MealPlanner;
  private shoppingOptimizer: ShoppingOptimizer;
  private profileManager: ProfileManager;
  
  constructor() {
    // Inicializar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan variables de entorno de Supabase');
    }
    
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // Inicializar subsistemas
    this.scanner = new ReceiptScanner(this);
    this.pantryManager = getPantryManager(this);
    this.mealPlanner = getMealPlanner(this);
    this.shoppingOptimizer = getShoppingOptimizer(this);
    this.profileManager = getProfileManager(this);
  }
  
  /**
   * Obtener cliente de Supabase para uso en subsistemas
   */
  getSupabaseClient() {
    return this.supabase;
  }
  
  /**
   * Flujo completo: Ticket → Despensa → Plan → Lista
   */
  async processReceiptToMealPlan(receiptImage: File, userId: string) {
    try {

      // 1. Escanear ticket

      const parsedReceipt = await this.scanner.scanReceipt(receiptImage);
      
      // 2. Actualizar despensa

      const pantryItems = await this.pantryManager.addItemsFromReceipt(
        parsedReceipt.items, 
        userId,
        parsedReceipt.date || new Date()
      );
      
      // 3. Obtener estadísticas actualizadas

      const pantryStats = await this.pantryManager.getPantryStats(userId);
      
      // 4. Generar sugerencias de compra

      const suggestions = await this.pantryManager.getShoppingSuggestions(userId);
      
      // 5. Generar plan de comidas optimizado

      const currentPantryItems = await this.pantryManager.getPantryItems(userId);
      const mealPlan = await this.mealPlanner.generateOptimalPlan({
        userId,
        duration: 7, // Plan semanal por defecto
        pantryItems: currentPantryItems,
        optimizeFor: 'pantry_usage' // Usar lo que hay en despensa
      });
      
      return {
        success: true,
        scannedReceipt: parsedReceipt,
        pantryUpdate: {
          itemsAdded: pantryItems.length,
          items: pantryItems
        },
        pantryStats,
        shoppingSuggestions: suggestions,
        mealPlan,
        shoppingList: mealPlan.shoppingList,
        insights: await this.generateInsights(userId, { parsedReceipt, pantryStats, mealPlan })
      };
      
    } catch (error: unknown) {
      console.error('Error en procesamiento holístico:', error);
      throw error;
    }
  }
  
  /**
   * Obtener preferencias del usuario
   */
  async getUserPreferences(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error obteniendo preferencias:', error);
      return null;
    }
    
    return data;
  }
  
  /**
   * Obtener presupuesto del usuario
   */
  async getUserBudget(userId: string) {
    const profile = await this.getUserPreferences(userId);
    return profile?.monthly_budget || 0;
  }
  
  /**
   * Generar insights usando IA (Gemini para ahorrar costos)
   */
  async generateInsights(userId: string, data: any) {
    // TODO: Implementar con Gemini API

    return [
      'Tu despensa tiene suficientes ingredientes para 5 comidas',
      'Podrías ahorrar $50 comprando en bulk estos items',
      'Te faltan vegetales verdes para una dieta balanceada'
    ];
  }
  
  /**
   * Método para usar Gemini en lugar de GPT-4 (ahorro de costos)
   */
  async callGeminiAPI(prompt: string) {
    // TODO: Implementar cuando tengamos la API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('Gemini API key no configurada, usando mock');
      return { success: false, message: 'Gemini no configurado' };
    }
    
    // Implementar llamada a Gemini
    return { success: true, data: 'Mock response' };
  }
}

// Singleton para uso global
let holisticSystem: HolisticFoodSystem | null = null;

export function getHolisticSystem() {
  if (!holisticSystem) {
    holisticSystem = new HolisticFoodSystem();
  }
  return holisticSystem;
}