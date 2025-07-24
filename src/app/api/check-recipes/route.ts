import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Try to fetch existing recipes
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .limit(1);
    
    if (error) {
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
    
    if (data && data.length > 0) {
      return NextResponse.json({ 
        success: true,
        sample: data[0],
        columns: Object.keys(data[0])
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'No recipes found',
      data: []
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ 
      error: error.message || 'An error occurred'
    });
  }
}