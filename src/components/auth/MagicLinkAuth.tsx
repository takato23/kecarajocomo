'use client';

import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/services/logger';

interface MagicLinkAuthProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function MagicLinkAuth({ onSuccess, redirectTo = '/' }: MagicLinkAuthProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor, ingresá tu email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, ingresá un email válido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            app_name: 'KeCarajoComer',
            source: 'magic_link_auth'
          }
        }
      });

      if (error) {
        throw error;
      }

      setIsEmailSent(true);
      logger.info('Magic link sent successfully', 'MagicLinkAuth', { email });
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      logger.error('Magic link auth error', 'MagicLinkAuth', error);
      
      if (error.message?.includes('rate_limit')) {
        setError('Demasiados intentos. Esperá un momento antes de intentar de nuevo.');
      } else if (error.message?.includes('invalid_email')) {
        setError('Email inválido. Verificá que esté bien escrito.');
      } else {
        setError('Error al enviar el link. Intentá de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsEmailSent(false);
    setError(null);
    setEmail('');
  };

  if (isEmailSent) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Link enviado!
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Te enviamos un link mágico a <span className="font-semibold text-green-600 dark:text-green-400">{email}</span>. 
            Hacé clic en el link para acceder instantáneamente.
          </p>

          {/* Instructions */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700 dark:text-green-300">
              💡 <strong>Tip:</strong> Revisá tu bandeja de spam si no ves el email en unos minutos.
            </p>
          </div>

          {/* Retry */}
          <Button
            onClick={handleRetry}
            variant="outline"
            className="w-full"
          >
            Usar otro email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso rápido
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300">
            Ingresá tu email y te enviamos un link mágico para acceder sin contraseña
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar link mágico
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sin contraseñas, sin complicaciones. Solo tu email y listo.
          </p>
        </div>
      </div>
    </div>
  );
}