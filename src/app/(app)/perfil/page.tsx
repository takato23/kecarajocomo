import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ProfileView } from '@/components/profile/ProfileView';

// Enhanced loading component with Spanish text
function PerfilLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Loading Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Mi Perfil Culinario
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Cargando tu información personalizada...
          </p>
        </div>

        {/* Loading Component */}
        <div className="max-w-4xl mx-auto">
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-gray-400">Preparando tu experiencia culinaria personalizada...</p>
              <p className="text-sm text-gray-500">Cargando preferencias, restricciones dietéticas y configuraciones</p>
            </div>
          </div>
        </div>

        {/* Loading Tips */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 italic">
            💡 Tip: Mientras esperamos, asegúrate de que tienes una buena conexión a internet
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Spanish Profile Page Component
 * 
 * Localized version of the profile management interface with:
 * - Spanish language and cultural adaptation
 * - Progressive loading with meaningful feedback
 */
export default function PerfilPage() {
  return (
    <Suspense fallback={<PerfilLoadingFallback />}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Mi Perfil Culinario
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Personaliza tus preferencias alimentarias, restricciones dietéticas y objetivos nutricionales 
              para obtener recomendaciones perfectas para ti y tu familia.
            </p>
          </div>

          {/* Profile View Component */}
          <ProfileView />
          
          {/* Quick Navigation */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              ¿Necesitas más opciones? Visita el{' '}
              <a 
                href="/profile" 
                className="text-purple-400 hover:text-purple-300 underline"
              >
                hub completo de perfil
              </a>
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

// Static metadata for SEO (Spanish)
export const metadata: Metadata = {
  title: 'Mi Perfil | KeCarajoComér',
  description: 'Personaliza tus preferencias alimentarias, restricciones dietéticas y objetivos nutricionales para una experiencia culinaria perfecta',
  keywords: ['perfil', 'preferencias alimentarias', 'dieta', 'cocina', 'restricciones dietéticas', 'alergias'],
  openGraph: {
    title: 'Mi Perfil Culinario | KeCarajoComér',
    description: 'Configura tu experiencia culinaria personalizada con preferencias, restricciones y objetivos',
    type: 'website',
  },
  alternates: {
    canonical: '/perfil',
    languages: {
      'es': '/perfil',
      'en': '/profile'
    }
  }
};