"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the game canvas to avoid SSR issues with Phaser
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

  useEffect(() => {
    setMounted(true);
    
    // Hide navbar and prevent scroll - full viewport game
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
    
    // Fetch current user
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
      bottom: 0
    }}>
      <GameCanvas username={username} />
    </div>
  );
}
