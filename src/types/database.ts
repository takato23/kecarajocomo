export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          date_of_birth: string | null
          phone: string | null
          dietary_restrictions: string[] | null
          cuisine_preferences: string[] | null
          cooking_skill_level: string | null
          household_size: number | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          date_of_birth?: string | null
          phone?: string | null
          dietary_restrictions?: string[] | null
          cuisine_preferences?: string[] | null
          cooking_skill_level?: string | null
          household_size?: number | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          date_of_birth?: string | null
          phone?: string | null
          dietary_restrictions?: string[] | null
          cuisine_preferences?: string[] | null
          cooking_skill_level?: string | null
          household_size?: number | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          dietary_restrictions: string[] | null
          cuisine_preferences: string[] | null
          cooking_skill_level: string | null
          household_size: number | null
          preferred_meal_types: string[] | null
          avoid_ingredients: string[] | null
          calorie_target: number | null
          protein_target: number | null
          carb_target: number | null
          fat_target: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dietary_restrictions?: string[] | null
          cuisine_preferences?: string[] | null
          cooking_skill_level?: string | null
          household_size?: number | null
          preferred_meal_types?: string[] | null
          avoid_ingredients?: string[] | null
          calorie_target?: number | null
          protein_target?: number | null
          carb_target?: number | null
          fat_target?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dietary_restrictions?: string[] | null
          cuisine_preferences?: string[] | null
          cooking_skill_level?: string | null
          household_size?: number | null
          preferred_meal_types?: string[] | null
          avoid_ingredients?: string[] | null
          calorie_target?: number | null
          protein_target?: number | null
          carb_target?: number | null
          fat_target?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          instructions: Json[] | null
          prep_time: number | null
          cook_time: number | null
          total_time: number | null
          servings: number
          difficulty: string | null
          cuisine: string | null
          diet_type: string[] | null
          tags: string[] | null
          image_url: string | null
          source: string | null
          source_url: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          instructions?: Json[] | null
          prep_time?: number | null
          cook_time?: number | null
          total_time?: number | null
          servings?: number
          difficulty?: string | null
          cuisine?: string | null
          diet_type?: string[] | null
          tags?: string[] | null
          image_url?: string | null
          source?: string | null
          source_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          instructions?: Json[] | null
          prep_time?: number | null
          cook_time?: number | null
          total_time?: number | null
          servings?: number
          difficulty?: string | null
          cuisine?: string | null
          diet_type?: string[] | null
          tags?: string[] | null
          image_url?: string | null
          source?: string | null
          source_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_id: string
          quantity: number
          unit: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_id: string
          quantity: number
          unit: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      nutrition_info: {
        Row: {
          id: string
          recipe_id: string
          calories: number | null
          protein: number | null
          carbs: number | null
          fat: number | null
          fiber: number | null
          sugar: number | null
          sodium: number | null
          cholesterol: number | null
          serving_size: string | null
          servings_per_recipe: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          fiber?: number | null
          sugar?: number | null
          sodium?: number | null
          cholesterol?: number | null
          serving_size?: string | null
          servings_per_recipe?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          fiber?: number | null
          sugar?: number | null
          sodium?: number | null
          cholesterol?: number | null
          serving_size?: string | null
          servings_per_recipe?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          recipe_id: string
          servings: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          recipe_id: string
          servings?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          recipe_id?: string
          servings?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ratings: {
        Row: {
          id: string
          recipe_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          created_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          name: string
          location: string | null
          chain_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          chain_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          chain_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          barcode: string | null
          brand: string | null
          category: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          barcode?: string | null
          brand?: string | null
          category?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          barcode?: string | null
          brand?: string | null
          category?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      price_history: {
        Row: {
          id: string
          product_id: string
          store_id: string
          price: number
          currency: string
          is_promotion: boolean
          promotion_details: string | null
          recorded_at: string
        }
        Insert: {
          id?: string
          product_id: string
          store_id: string
          price: number
          currency?: string
          is_promotion?: boolean
          promotion_details?: string | null
          recorded_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          store_id?: string
          price?: number
          currency?: string
          is_promotion?: boolean
          promotion_details?: string | null
          recorded_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          dietary_restrictions: Json
          allergies: string[]
          preferred_cuisines: string[]
          disliked_ingredients: string[]
          household_size: number
          household_members: Json
          monthly_budget: number | null
          nutritional_goals: Json
          taste_profile: Json
          cooking_skill_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dietary_restrictions?: Json
          allergies?: string[]
          preferred_cuisines?: string[]
          disliked_ingredients?: string[]
          household_size?: number
          household_members?: Json
          monthly_budget?: number | null
          nutritional_goals?: Json
          taste_profile?: Json
          cooking_skill_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dietary_restrictions?: Json
          allergies?: string[]
          preferred_cuisines?: string[]
          disliked_ingredients?: string[]
          household_size?: number
          household_members?: Json
          monthly_budget?: number | null
          nutritional_goals?: Json
          taste_profile?: Json
          cooking_skill_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          name: string
          name_normalized: string
          category: string
          subcategory: string | null
          nutrition: Json
          common_units: Json
          average_price: number | null
          seasonality: Json
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_normalized: string
          category: string
          subcategory?: string | null
          nutrition?: Json
          common_units?: Json
          average_price?: number | null
          seasonality?: Json
          embedding?: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_normalized?: string
          category?: string
          subcategory?: string | null
          nutrition?: Json
          common_units?: Json
          average_price?: number | null
          seasonality?: Json
          embedding?: number[] | null
          created_at?: string
        }
      }
      pantry_items: {
        Row: {
          id: string
          user_id: string
          ingredient_id: string
          quantity: number
          unit: string
          purchase_date: string
          expiration_date: string | null
          status: string
          location: string
          usage_history: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ingredient_id: string
          quantity: number
          unit: string
          purchase_date?: string
          expiration_date?: string | null
          status?: string
          location?: string
          usage_history?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string
          purchase_date?: string
          expiration_date?: string | null
          status?: string
          location?: string
          usage_history?: Json
          created_at?: string
          updated_at?: string
        }
      }
      scanned_receipts: {
        Row: {
          id: string
          user_id: string
          image_url: string | null
          ocr_raw_text: string | null
          parsed_data: Json | null
          detected_items: Json
          store_name: string | null
          purchase_date: string | null
          total_amount: number | null
          processing_status: string
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url?: string | null
          ocr_raw_text?: string | null
          parsed_data?: Json | null
          detected_items?: Json
          store_name?: string | null
          purchase_date?: string | null
          total_amount?: number | null
          processing_status?: string
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string | null
          ocr_raw_text?: string | null
          parsed_data?: Json | null
          detected_items?: Json
          store_name?: string | null
          purchase_date?: string | null
          total_amount?: number | null
          processing_status?: string
          confidence_score?: number | null
          created_at?: string
        }
      }
      shopping_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          budget: number | null
          is_active: boolean
          total_estimated: number | null
          optimized_route: Json | null
          related_meal_plan: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          budget?: number | null
          is_active?: boolean
          total_estimated?: number | null
          optimized_route?: Json | null
          related_meal_plan?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          budget?: number | null
          is_active?: boolean
          total_estimated?: number | null
          optimized_route?: Json | null
          related_meal_plan?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      shopping_items: {
        Row: {
          id: string
          list_id: string
          name: string
          quantity: number
          unit: string | null
          category: string | null
          store: string | null
          price: number | null
          estimated_price: number | null
          checked: boolean
          notes: string | null
          position: number
          priority: string | null
          aisle: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          name: string
          quantity?: number
          unit?: string | null
          category?: string | null
          store?: string | null
          price?: number | null
          estimated_price?: number | null
          checked?: boolean
          notes?: string | null
          position?: number
          priority?: string | null
          aisle?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          name?: string
          quantity?: number
          unit?: string | null
          category?: string | null
          store?: string | null
          price?: number | null
          estimated_price?: number | null
          checked?: boolean
          notes?: string | null
          position?: number
          priority?: string | null
          aisle?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      item_usage_history: {
        Row: {
          id: string
          user_id: string
          item_name: string
          quantity: number
          unit: string | null
          used_at: string
          context: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_name: string
          quantity: number
          unit?: string | null
          used_at?: string
          context?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_name?: string
          quantity?: number
          unit?: string | null
          used_at?: string
          context?: string | null
          created_at?: string
        }
      }
      price_history: {
        Row: {
          id: string
          shopping_item_id: string
          store: string
          price: number
          unit: string | null
          found_at: string
        }
        Insert: {
          id?: string
          shopping_item_id: string
          store: string
          price: number
          unit?: string | null
          found_at?: string
        }
        Update: {
          id?: string
          shopping_item_id?: string
          store?: string
          price?: number
          unit?: string | null
          found_at?: string
        }
      }
      shopping_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_stores: string[]
          default_budget: number | null
          currency: string
          auto_save: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_stores?: string[]
          default_budget?: number | null
          currency?: string
          auto_save?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_stores?: string[]
          default_budget?: number | null
          currency?: string
          auto_save?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_savings_summary: {
        Row: {
          user_id: string
          month: string
          lists_count: number
          total_savings: number | null
          avg_savings_per_item: number | null
        }
      }
    }
  }
}