"use client";

import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { BootScene } from '@/lib/game/scenes/BootScene';
import { MenuScene } from '@/lib/game/scenes/MenuScene';
import { GameScene } from '@/lib/game/scenes/GameScene';
import { BattleScene } from '@/lib/game/scenes/BattleScene';

interface GameCanvasProps {
  username: string;
}

export default function GameCanvas({ username }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    console.log('[GameCanvas] Initializing Phaser for user:', username);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#000000',
      scene: [BootScene, MenuScene, GameScene, BattleScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: containerRef.current,
      },
      render: {
        pixelArt: true, // Prevent blurry Pokémon sprites
        antialias: false,
      },
      input: {
        windowEvents: false, // Let Phaser manage input events directly from canvas
      },
    };

    try {
      const game = new Phaser.Game(config);
      gameRef.current = game;

      // Set username in canvas data attribute for scenes to access
      game.events.once('ready', () => {
        if (game.canvas) {
          game.canvas.setAttribute('data-username', username);
        }
        setIsReady(true);
        console.log('[GameCanvas] Phaser initialized successfully');
      });

      // Handle window resize
      const handleResize = () => {
        if (game && game.scale) {
          game.scale.resize(window.innerWidth, window.innerHeight);
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (gameRef.current) {
          console.log('[GameCanvas] Destroying Phaser instance');
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    } catch (error) {
      console.error('[GameCanvas] Error initializing Phaser:', error);
    }
  }, [username]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      height: '100dvh',
      overflow: 'hidden',
      backgroundColor: '#000000',
      touchAction: 'none', // Prevent default touch behaviors
    }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      {!isReady && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000'
        }}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mb-4" />
            <p className="text-white text-xl font-mono">Initializing Game...</p>
          </div>
        </div>
      )}

      {/* Game Controls Help - hidden on small screens to avoid blocking */}
      <div className="hidden md:block absolute top-4 right-4 bg-gray-900 bg-opacity-70 text-white px-3 py-2 rounded-lg font-mono text-xs max-w-[160px] pointer-events-none">
        <h3 className="font-bold mb-1 text-yellow-400 text-sm">Controls</h3>
        <ul className="space-y-0.5 text-[10px]">
          <li>⬆️⬇️⬅️➡️ Move</li>
          <li>SPACE - Interact</li>
          <li>ESC - Menu</li>
          <li>I - Inventory</li>
          <li>T - Team</li>
          <li>R - Run</li>
        </ul>
      </div>
    </div>
  );
}
