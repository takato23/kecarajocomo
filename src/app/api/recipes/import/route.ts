/**
 * API Route para Importación de Recetas
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { RecipeImportService } from '@/features/recipes/services/RecipeImportService';
import { getCurrentUser } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const skipDuplicates = formData.get('skipDuplicates') === 'true';
    const updateExisting = formData.get('updateExisting') === 'true';
    const validateOnly = formData.get('validateOnly') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      );
    }

    // Validar que sea un archivo JSON
    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'Solo se permiten archivos JSON' },
        { status: 400 }
      );
    }

    // Verificar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    // Crear instancia del servicio de importación
    const importService = new RecipeImportService();

    // Importar recetas desde archivo
    const result = await importService.importFromCustomFile(file, {
      userId: user.id,
      isAdmin: true, // Se validará internamente
      skipDuplicates,
      updateExisting,
      validateOnly
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    logger.error('Error en endpoint de importación:', 'API:route', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Endpoint para importar el archivo recipes_full.json
    const url = new URL(request.url);
    const source = url.searchParams.get('source');

    if (source === 'full') {

      const importService = new RecipeImportService();
      
      const result = await importService.importFromRecipesFile({
        userId: user.id,
        isAdmin: true, // Se validará internamente
        skipDuplicates: url.searchParams.get('skipDuplicates') === 'true',
        updateExisting: url.searchParams.get('updateExisting') === 'true',
        validateOnly: url.searchParams.get('validateOnly') === 'true'
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Parámetro source requerido' },
      { status: 400 }
    );

  } catch (error: unknown) {
    logger.error('Error en endpoint de importación GET:', 'API:route', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}