"use client";

import { useState } from "react";

interface PokemonSpriteDisplayProps {
  sprite: string | null;
  shinySprite: string | null;
  name: string;
  pokemonId: number;
}

export default function PokemonSpriteDisplay({ sprite, shinySprite, name, pokemonId }: PokemonSpriteDisplayProps) {
  const [isShiny, setIsShiny] = useState(false);

  const currentSprite = isShiny && shinySprite ? shinySprite : sprite;
  const hasShiny = !!shinySprite;

  return (
    <div className="pokedex-sprite-display">
      {/* Main Sprite Panel - Pokédex-style device frame */}
      <div className="pokedex-sprite-frame">
        <div className="pokedex-sprite-inner">
          {currentSprite ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={currentSprite} 
              alt={isShiny ? `${name} (shiny)` : name} 
              className="pokedex-sprite-img pixelated" 
              loading="eager"
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
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isShiny ? "Shiny" : "Normal"}
          </span>
        </div>
      )}
    </div>
  );
}
