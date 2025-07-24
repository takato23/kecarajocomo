import { readFileSync } from 'fs';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (in a real app, this would check proper authentication)
    const isAdmin = request.headers.get('x-admin-token') === process.env.ADMIN_TOKEN;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden acceder al archivo completo de recetas' },
        { status: 403 }
      );
    }

    // Read the recipes file
    const filePath = join(process.cwd(), 'docs', 'recipes_full.json');
    const fileContent = readFileSync(filePath, 'utf8');
    const recipes = JSON.parse(fileContent);

    // Validate structure
    if (!Array.isArray(recipes)) {
      throw new Error('Invalid recipes file format');
    }

    return NextResponse.json(recipes, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error: unknown) {
    console.error('Error serving recipes file:', error);
    
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json(
        { error: 'Archivo de recetas no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// For development/testing purposes, allow public access
export async function POST(request: NextRequest) {
  try {
    // This endpoint serves the recipes for testing without admin requirements
    const filePath = join(process.cwd(), 'docs', 'recipes_full.json');
    const fileContent = readFileSync(filePath, 'utf8');
    const recipes = JSON.parse(fileContent);

    return NextResponse.json(recipes);

  } catch (error: unknown) {
    console.error('Error serving recipes file (public):', error);
    return NextResponse.json(
      { error: 'No se pudo cargar el archivo de recetas' },
      { status: 500 }
    );
  }
}