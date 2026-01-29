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
    
    // Hide navbar and prevent scroll
    document.body.style.overflow = 'hidden';
    const navbar = document.querySelector('header');
    if (navbar) (navbar as HTMLElement).style.display = 'none';
    
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
      const navbar = document.querySelector('header');
      if (navbar) (navbar as HTMLElement).style.display = '';
    };
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Initializing...</p>
        </div>
      </div>
    );
  }

  return <GameCanvas username={username} />;
}
