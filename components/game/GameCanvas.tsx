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
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: true, // Prevent blurry Pokémon sprites
        antialias: false,
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
        if (game) {
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
    <div className="relative w-full h-screen bg-black">
      <div ref={containerRef} className="w-full h-full" />
      
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mb-4" />
            <p className="text-white text-xl font-mono">Initializing Game...</p>
          </div>
        </div>
      )}

      {/* Game Controls Help */}
      <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-80 text-white p-4 rounded-lg font-mono text-sm max-w-xs">
        <h3 className="font-bold mb-2 text-yellow-400">Controls</h3>
        <ul className="space-y-1">
          <li>⬆️⬇️⬅️➡️ Move</li>
          <li>SPACE - Interact</li>
          <li>ESC - Menu</li>
          <li>I - Inventory</li>
          <li>T - Team</li>
          <li>R - Run (in battle)</li>
        </ul>
      </div>
    </div>
  );
}
