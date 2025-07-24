'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScannerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the Spanish scanner route
    router.replace('/despensa/escanear');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirigiendo al escáner...</p>
      </div>
    </div>
  );
}