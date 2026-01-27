"use client";

import { useEffect, useState } from 'react';

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check online status
    setIsOnline(navigator.onLine);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAInstallPrompt);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      return true;
    }
    
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isOnline,
    installPWA
  };
}

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner 3 seconds after page load if installable
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  if (!showBanner || isInstalled) return null;

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setShowBanner(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-3xl">📱</div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Installer Pokédex AI Pro</h3>
            <p className="text-sm text-red-100 mb-3">
              Installez l'application pour un accès rapide et un mode hors ligne
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="btn btn-sm bg-white text-red-600 hover:bg-red-50"
              >
                Installer
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="btn btn-sm bg-red-800 hover:bg-red-900 text-white"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="flex-shrink-0 text-red-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export function PWAStatus() {
  const { isInstalled, isOnline } = usePWA();

  return (
    <div className="flex items-center gap-2 text-xs">
      {isInstalled && (
        <span className="flex items-center gap-1 text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          PWA
        </span>
      )}
      <span className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
        {isOnline ? 'En ligne' : 'Hors ligne'}
      </span>
    </div>
  );
}
