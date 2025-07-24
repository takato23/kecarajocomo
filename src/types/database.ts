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
    }
  }
}