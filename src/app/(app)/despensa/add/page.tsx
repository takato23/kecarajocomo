'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DespensaAddRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the Spanish add route
    router.replace('/despensa/agregar');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirigiendo a agregar items...</p>
      </div>
    </div>
  );
}