import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Debug - check if service key is loaded
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasServiceKey) {
      return NextResponse.json({ 
        error: 'Service role key not found',
        message: 'SUPABASE_SERVICE_ROLE_KEY environment variable is not set'
      });
    }
    
    // First, try to get the table schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('recipes')
      .select('*')
      .limit(0);
    
    if (schemaError) {
      return NextResponse.json({ 
        error: 'Schema query error',
        message: schemaError.message,
        hint: schemaError.hint,
        details: schemaError.details,
        code: schemaError.code,
        hasServiceKey
      });
    }

    // Try to insert a minimal recipe to see what columns exist
    const testRecipe = {
      name: 'Test Recipe ' + Date.now(),
      ingredients: JSON.stringify([]),
      user_id: '00000000-0000-0000-0000-000000000000'
    };
    
    const { data, error } = await supabase
      .from('recipes')
      .insert(testRecipe)
      .select()
      .single();
    
    // Clean up test
    if (data) {
      await supabase.from('recipes').delete().eq('id', data.id);
    }
    
    if (error) {
      return NextResponse.json({ 
        error: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code,
        attempted_insert: testRecipe
      });
    }
    
    return NextResponse.json({ 
      success: true,
      columns: Object.keys(data || {}),
      sample_data: data
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ 
      error: error.message || 'An error occurred',
      stack: error.stack
    });
  }
}