"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import BattleLogExport from "@/components/game/BattleLogExport";
import GameSettingsPanel from "@/components/game/GameSettingsPanel";

// Import dynamique pour eviter les soucis SSR avec Phaser.
const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white text-lg">Loading Pokémon World...</p>
      </div>
    </div>
  )
});

export default function GamePage() {
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Keyboard shortcut to open settings (Ctrl+S or Cmd+S)
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
    };

    const handleOpenSettings = () => setShowSettings(true);

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('game:open-settings' as any, handleOpenSettings as any);

    // Mode plein ecran: cache la navbar et bloque le scroll.
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.height = '100vh';
    document.body.style.height = '100dvh'; // Use dvh for better mobile support
    document.body.style.touchAction = 'none'; // Prevent default touch behaviors
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';

    const navbar = document.querySelector('header');
    if (navbar) (navbar as HTMLElement).style.display = 'none';

    // Prevent overscroll behavior on mobile
    document.body.style.overscrollBehavior = 'none';

    // Fetch random region background
    fetch('/api/game/random-region-bg')
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setBackgroundUrl(data.url);
        }
      })
      .catch(console.error);

    // Recupere l'utilisateur courant pour le pseudo du jeu.
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUsername(data.user.username);
        } else {
          setUsername("guest");
        }
        setLoading(false);
      })
      .catch(() => {
        setUsername("guest");
        setLoading(false);
      });

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('game:open-settings' as any, handleOpenSettings as any);
      // Nettoie les styles globaux a la sortie.
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      const navbar = document.querySelector('header');
      if (navbar) (navbar as HTMLElement).style.display = '';
    };
  }, []);

  if (!mounted || loading) {
    return (
      <div style={{ minHeight: '100vh' }} className="flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <GameCanvas username={username} />

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 z-[9998] bg-blue-500 hover:bg-blue-600 text-white font-bold p-3 rounded-full shadow-lg transition-colors"
        title="Settings (Ctrl+S)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Overlays */}
      <BattleLogExport enabled={true} />
      <GameSettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
