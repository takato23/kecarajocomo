'use client';

import React from 'react';

import { Heading, Text } from '@/components/design-system/Typography';

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <div className="text-center">
        <Heading size="3xl" weight="bold">
          Configuración
        </Heading>
        <Text size="lg" color="muted" className="mt-2">
          Personaliza la aplicación según tus preferencias
        </Text>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm">
        <Text color="muted">
          Página en construcción - Configuración próximamente
        </Text>
      </div>
    </div>
  );
}