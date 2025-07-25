'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlanificadorRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new meal-planning route
    router.replace('/meal-planning');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}