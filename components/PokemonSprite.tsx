"use client";

import { useState } from "react";
import Image from "next/image";

interface PokemonSpriteProps {
  src: string | null;
  alt: string;
  pokemonId: number;
  pokemonName: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Composant pour afficher un sprite Pokémon avec fallback automatique
 */
export default function PokemonSprite({
  src,
  alt,
  pokemonId,
  pokemonName,
  width = 96,
  height = 96,
  className = "",
  priority = false
}: PokemonSpriteProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Sources de fallback dans l'ordre de priorité
  const fallbackSources = [
    src,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemonId}.gif`,
    // Placeholder SVG en dernier recours
    generatePlaceholderSVG(pokemonName, pokemonId)
  ];

  const handleError = () => {
    // Essayer la prochaine source de fallback
    const nextIndex = fallbackIndex + 1;
    if (nextIndex < fallbackSources.length) {
      setFallbackIndex(nextIndex);
      setCurrentSrc(fallbackSources[nextIndex]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {currentSrc ? (
        <Image
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          onError={handleError}
          priority={priority}
          className="object-contain"
          unoptimized={currentSrc.startsWith('data:') || currentSrc.endsWith('.gif')}
        />
      ) : (
        <div 
          className="flex items-center justify-center bg-gray-100 rounded-lg"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="text-4xl text-gray-400">?</div>
            <div className="text-xs text-gray-500">#{pokemonId}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function generatePlaceholderSVG(pokemonName: string, pokemonId: number): string {
  const svg = `
    <svg width="96" height="96" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" fill="#f3f4f6" rx="8"/>
      <text x="48" y="35" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="#9ca3af">
        ?
      </text>
      <text x="48" y="65" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#6b7280">
        #${pokemonId}
      </text>
      <text x="48" y="80" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="#9ca3af">
        ${pokemonName.substring(0, 10)}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
