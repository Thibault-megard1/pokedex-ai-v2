"use client";

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8 text-center">
        {/* Pokéball Icon */}
        <div className="mb-6">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full border-4 border-white"></div>
            </div>
          </div>
        </div>

        {/* Offline Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Mode Hors Ligne
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Vous êtes actuellement hors ligne. Cette page n'est pas disponible dans le cache.
        </p>

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Pas de connexion Internet</span>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Astuce :</strong> Visitez les pages que vous souhaitez consulter hors ligne pendant que vous êtes connecté, elles seront automatiquement mises en cache.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full btn bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            🔄 Réessayer
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full btn bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            ← Retour
          </button>
        </div>

        {/* PWA Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Cette application utilise un Service Worker pour fonctionner hors ligne.
            Les pages visitées récemment sont disponibles sans connexion.
          </p>
        </div>
      </div>
    </div>
  );
}
