import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './database.types';

let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function getSupabaseInstance() {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient<Database>();
  }
  return supabaseInstance;
}