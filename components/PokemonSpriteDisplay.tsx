"use client";

import { useState, useRef } from "react";
import { useShiny } from "./ShinyContext";

interface PokemonSpriteDisplayProps {
  sprite: string | null;
  shinySprite: string | null;
  name: string;
  pokemonId: number;
  cryUrl?: string | null;
}

export default function PokemonSpriteDisplay({ sprite, shinySprite, name, pokemonId, cryUrl }: PokemonSpriteDisplayProps) {
  const { isShiny, setIsShiny } = useShiny();
  const [isAnimating, setIsAnimating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSprite = isShiny && shinySprite ? shinySprite : sprite;
  const hasShiny = !!shinySprite;

  const handleSpriteClick = () => {
    // Play audio if available
    if (cryUrl) {
      // Create audio element on demand to ensure it's properly loaded
      const audio = new Audio(cryUrl);
      audio.volume = 0.5; // Set volume to 50%
      audio.play().catch(err => console.log("Audio playback failed:", err));
    }
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <div className="pokedex-sprite-display">
      {/* Main Sprite Panel - Pokédex-style device frame */}
      <div 
        className="pokedex-sprite-frame"
        onClick={handleSpriteClick}
        style={{ cursor: cryUrl ? 'pointer' : 'default' }}
        title={cryUrl ? `Cliquez pour entendre ${name}` : undefined}
      >
        <div className={`pokedex-sprite-inner ${isAnimating ? 'sprite-bounce' : ''}`}>
          {currentSprite ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={currentSprite} 
              alt={isShiny ? `${name} (shiny)` : name} 
              className="pokedex-sprite-img pokedex-sprite-hd" 
              loading="eager"
              key={currentSprite}
            />
          ) : (
            <div className="pokedex-sprite-placeholder">
              <span className="text-4xl">?</span>
            </div>
          )}
        </div>
        
        {/* Shiny Badge - Animated indicator */}
        {isShiny && (
          <div className="pokedex-shiny-badge" aria-label="Pokémon is shiny">
            <span className="pokedex-shiny-icon" aria-hidden="true">✨</span>
            <span className="pokedex-shiny-text">Shiny</span>
          </div>
        )}
      </div>

      {/* Shiny Toggle - Small interactive switch */}
      {hasShiny && (
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={() => setIsShiny(!isShiny)}
            className="pokedex-shiny-toggle"
            aria-label={isShiny ? "Afficher version normale" : "Afficher version shiny"}
            aria-pressed={isShiny}
          >
            <span className="pokedex-toggle-icon" aria-hidden="true">
              {isShiny ? "🎨" : "✨"}
            </span>
            <span className="pokedex-toggle-text">
              {isShiny ? "Version normale" : "Version Shiny"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
