'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff, Smartphone } from 'lucide-react';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Heading, Text } from '@/components/design-system/Typography';
import { pwaService } from '@/lib/pwa';

export default function PWAInstaller() {
  const [showInstaller, setShowInstaller] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [showMobileGuide, setShowMobileGuide] = useState(true);
  const [appInfo, setAppInfo] = useState({
    isOnline: true,
    isInstallable: false,
    isRunningAsPWA: false,
    supportsNotifications: false,
    supportsBackgroundSync: false
  });

  useEffect(() => {
    // Check if user has already dismissed the mobile guide
    const mobileGuideDismissed = localStorage.getItem('pwa-mobile-guide-dismissed');
    if (mobileGuideDismissed === 'true') {
      setShowMobileGuide(false);
    }

    // Initialize PWA service and get app info
    const updateAppInfo = () => {
      const info = pwaService.getAppInfo();
      setAppInfo(info);
      setIsOnline(info.isOnline);
    };

    updateAppInfo();

    // Listen for PWA events
    const handleInstallAvailable = () => {
      setShowInstaller(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(false);
      updateAppInfo();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
      updateAppInfo();
    };

    // Add event listeners
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-online', handleOnline);
    window.addEventListener('pwa-offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-online', handleOnline);
      window.removeEventListener('pwa-offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    const success = await pwaService.installPWA();
    if (success) {
      setShowInstaller(false);
    }
  };

  const dismissInstaller = () => {
    setShowInstaller(false);
  };

  const dismissOfflineNotice = () => {
    setShowOfflineNotice(false);
  };

  // Don't show installer if already running as PWA
  if (appInfo.isRunningAsPWA) {
    return null;
  }

  return (
    <>
      {/* PWA Install Prompt */}
      {showInstaller && appInfo.isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:w-96">
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <Download className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <Heading as="h4" size="lg" className="font-semibold text-white mb-1">
                    Install KeCarajoComer
                  </Heading>
                  <Text size="sm" className="text-blue-100 mb-3">
                    Get faster access and work offline with our app
                  </Text>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleInstall}
                      className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                      Install App
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissInstaller}
                      className="text-white hover:bg-white/10"
                    >
                      Not now
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissInstaller}
                  className="text-white hover:bg-white/10 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Offline Notice */}
      {showOfflineNotice && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:w-96">
          <Card className="bg-orange-500 text-white shadow-lg">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <WifiOff className="h-5 w-5 mt-0.5" />
                <div className="flex-1">
                  <Heading as="h4" size="lg" className="font-semibold text-white mb-1">
                    You're Offline
                  </Heading>
                  <Text size="sm" className="text-orange-100">
                    Some features may be limited, but you can still browse cached content
                  </Text>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissOfflineNotice}
                  className="text-white hover:bg-white/10 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Online Notice (appears briefly when reconnected) - DISABLED */}
      {/* {isOnline && !showOfflineNotice && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:w-96 animate-in slide-in-from-top duration-300">
          <Card className="bg-green-500 text-white shadow-lg">
            <div className="p-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <Text size="sm" className="text-white">
                  Back online! Content is syncing...
                </Text>
              </div>
            </div>
          </Card>
        </div>
      )} */}

      {/* Mobile-specific install guidance */}
      {!appInfo.isInstallable && !appInfo.isRunningAsPWA && showMobileGuide && (
        <div className="fixed bottom-20 left-4 right-4 z-40 md:hidden">
          <Card className="bg-gray-800 text-white shadow-lg">
            <div className="p-3">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-blue-400" />
                <div className="flex-1">
                  <Text size="xs" className="text-gray-300">
                    Add to home screen for a better experience
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      pwaService.showAddToHomeScreenGuidance();
                      setShowMobileGuide(false);
                      localStorage.setItem('pwa-mobile-guide-dismissed', 'true');
                    }}
                    className="text-blue-400 hover:bg-gray-700 text-xs px-2"
                  >
                    How?
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowMobileGuide(false);
                      localStorage.setItem('pwa-mobile-guide-dismissed', 'true');
                    }}
                    className="text-gray-400 hover:bg-gray-700 p-1"
                    aria-label="Dismiss install guide"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-30">
          <Card className="bg-gray-900 text-white p-2 text-xs">
            <div>Online: {isOnline ? '✅' : '❌'}</div>
            <div>Installable: {appInfo.isInstallable ? '✅' : '❌'}</div>
            <div>PWA: {appInfo.isRunningAsPWA ? '✅' : '❌'}</div>
            <div>Notifications: {appInfo.supportsNotifications ? '✅' : '❌'}</div>
            <div>Sync: {appInfo.supportsBackgroundSync ? '✅' : '❌'}</div>
          </Card>
        </div>
      )}
    </>
  );
}