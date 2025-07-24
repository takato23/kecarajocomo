import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import '@/styles/ios26/glass.css';
import '@/styles/navigation/navigation.css';
// import '@/styles/meal-planner.css';
import PWAInstaller from '@/components/PWAInstaller';

import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: 'KeCarajoComer - Planificación de Comidas con IA',
  description: 'Transformá la planificación de comidas con sugerencias de recetas potenciadas por IA, gestión inteligente de despensa y listas de compras optimizadas',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KeCarajoComer'
  },
  formatDetection: {
    telephone: false
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#84cc16',
    'msapplication-config': '/browserconfig.xml'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#84cc16'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png" />
        <meta name="apple-mobile-web-app-title" content="KeCarajoComer" />
        <meta name="application-name" content="KeCarajoComer" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <PWAInstaller />
        </Providers>
      </body>
    </html>
  );
}