'use client';

import { Wifi, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.refresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
          
          {/* Icon */}
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wifi className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sin conexión
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            No te preocupes, podés seguir usando KeCarajoComer en modo offline. 
            Tus datos se sincronizarán cuando vuelvas a tener conexión.
          </p>

          {/* Offline Features */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Disponible sin conexión:
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Ver tu plan semanal</li>
              <li>• Usar lista de compras</li>
              <li>• Consultar tu despensa</li>
              <li>• Marcar items comprados</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ir al inicio
            </Button>
          </div>

          {/* Connection Status */}
          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            Estado: {typeof navigator !== 'undefined' && navigator.onLine ? 'Conectado' : 'Sin conexión'}
          </div>
        </div>
      </div>
    </div>
  );
}