/**
 * API Route para Importación de Recetas
 * Solo accesible para administradores
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Import disabled' }, { status: 501 });
}

export async function GET() {
  return NextResponse.json({ status: 'disabled' }, { status: 501 });
}