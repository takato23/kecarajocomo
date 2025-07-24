export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string
          name: string
          category: string | null
          default_unit: string | null
          nutritional_info: Json | null
          common_names: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          default_unit?: string | null
          nutritional_info?: Json | null
          common_names?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          default_unit?: string | null
          nutritional_info?: Json | null
          common_names?: string[] | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          is_read: boolean | null
          is_dismissed: boolean | null
          scheduled_for: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          is_read?: boolean | null
          is_dismissed?: boolean | null
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean | null
          is_dismissed?: boolean | null
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pantry_items: {
        Row: {
          id: string
          user_id: string
          ingredient_id: string | null
          custom_name: string | null
          quantity: number
          unit: string
          purchase_date: string | null
          expiration_date: string | null
          location: string | null
          notes: string | null
          cost: number | null
          barcode: string | null
          image_url: string | null
          is_running_low: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ingredient_id?: string | null
          custom_name?: string | null
          quantity?: number
          unit?: string
          purchase_date?: string | null
          expiration_date?: string | null
          location?: string | null
          notes?: string | null
          cost?: number | null
          barcode?: string | null
          image_url?: string | null
          is_running_low?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ingredient_id?: string | null
          custom_name?: string | null
          quantity?: number
          unit?: string
          purchase_date?: string | null
          expiration_date?: string | null
          location?: string | null
          notes?: string | null
          cost?: number | null
          barcode?: string | null
          image_url?: string | null
          is_running_low?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pantry_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_meals: {
        Row: {
          id: string
          user_id: string
          recipe_id: string | null
          custom_meal_name: string | null
          plan_date: string
          meal_type: string
          servings: number | null
          notes: string | null
          is_prepared: boolean | null
          preparation_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id?: string | null
          custom_meal_name?: string | null
          plan_date: string
          meal_type: string
          servings?: number | null
          notes?: string | null
          is_prepared?: boolean | null
          preparation_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string | null
          custom_meal_name?: string | null
          plan_date?: string
          meal_type?: string
          servings?: number | null
          notes?: string | null
          is_prepared?: boolean | null
          preparation_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          preparation_time: number | null
          cooking_time: number | null
          servings: number | null
          difficulty_level: string | null
          cuisine_type: string | null
          category_id: string | null
          image_url: string | null
          video_url: string | null
          instructions: string[] | null
          ingredients: Json
          macronutrients: Json | null
          tags: string[] | null
          is_ai_generated: boolean | null
          is_public: boolean | null
          is_favorite: boolean | null
          rating: number | null
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          preparation_time?: number | null
          cooking_time?: number | null
          servings?: number | null
          difficulty_level?: string | null
          cuisine_type?: string | null
          category_id?: string | null
          image_url?: string | null
          video_url?: string | null
          instructions?: string[] | null
          ingredients?: Json
          macronutrients?: Json | null
          tags?: string[] | null
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          is_favorite?: boolean | null
          rating?: number | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          preparation_time?: number | null
          cooking_time?: number | null
          servings?: number | null
          difficulty_level?: string | null
          cuisine_type?: string | null
          category_id?: string | null
          image_url?: string | null
          video_url?: string | null
          instructions?: string[] | null
          ingredients?: Json
          macronutrients?: Json | null
          tags?: string[] | null
          is_ai_generated?: boolean | null
          is_public?: boolean | null
          is_favorite?: boolean | null
          rating?: number | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "recipe_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scanned_receipts: {
        Row: {
          id: string
          user_id: string
          image_url: string
          ocr_text: string | null
          parsed_items: Json | null
          store_name: string | null
          store_address: string | null
          receipt_date: string | null
          total_amount: number | null
          processing_status: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          ocr_text?: string | null
          parsed_items?: Json | null
          store_name?: string | null
          store_address?: string | null
          receipt_date?: string | null
          total_amount?: number | null
          processing_status?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          ocr_text?: string | null
          parsed_items?: Json | null
          store_name?: string | null
          store_address?: string | null
          receipt_date?: string | null
          total_amount?: number | null
          processing_status?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scanned_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          id: string
          shopping_list_id: string
          ingredient_id: string | null
          custom_name: string | null
          quantity: number
          unit: string
          estimated_cost: number | null
          actual_cost: number | null
          category: string | null
          notes: string | null
          is_purchased: boolean | null
          priority: number | null
          source: string | null
          source_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shopping_list_id: string
          ingredient_id?: string | null
          custom_name?: string | null
          quantity?: number
          unit?: string
          estimated_cost?: number | null
          actual_cost?: number | null
          category?: string | null
          notes?: string | null
          is_purchased?: boolean | null
          priority?: number | null
          source?: string | null
          source_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shopping_list_id?: string
          ingredient_id?: string | null
          custom_name?: string | null
          quantity?: number
          unit?: string
          estimated_cost?: number | null
          actual_cost?: number | null
          category?: string | null
          notes?: string | null
          is_purchased?: boolean | null
          priority?: number | null
          source?: string | null
          source_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_active: boolean | null
          total_estimated_cost: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          description?: string | null
          is_active?: boolean | null
          total_estimated_cost?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_active?: boolean | null
          total_estimated_cost?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          dietary_restrictions: string[] | null
          allergies: string[] | null
          favorite_cuisines: string[] | null
          cooking_skill_level: string | null
          budget_preferences: Json | null
          household_size: number | null
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dietary_restrictions?: string[] | null
          allergies?: string[] | null
          favorite_cuisines?: string[] | null
          cooking_skill_level?: string | null
          budget_preferences?: Json | null
          household_size?: number | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dietary_restrictions?: string[] | null
          allergies?: string[] | null
          favorite_cuisines?: string[] | null
          cooking_skill_level?: string | null
          budget_preferences?: Json | null
          household_size?: number | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}