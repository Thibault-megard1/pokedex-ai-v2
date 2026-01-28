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
  ];

  const handleError = () => {
    // Essayer la prochaine source de fallback
    const nextIndex = fallbackIndex + 1;
    if (nextIndex < fallbackSources.length) {
      setFallbackIndex(nextIndex);
      setCurrentSrc(fallbackSources[nextIndex]);
    } else {
      // Toutes les sources ont échoué, afficher la pokéball
      setCurrentSrc(null);
    }
  };

  // Si aucune source n'est disponible, afficher la pokéball animée
  if (!currentSrc && fallbackIndex >= fallbackSources.length) {
    return (
      <div className={`pokeball-placeholder ${className}`} style={{ width, height }}>
        <div className="pokeball-inner">
          <div className="pokeball-top"></div>
          <div className="pokeball-button"></div>
          <div className="pokeball-bottom"></div>
        </div>
      </div>
    );
  }

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
        <div className="pokeball-placeholder" style={{ width, height }}>
          <div className="pokeball-inner">
            <div className="pokeball-top"></div>
            <div className="pokeball-button"></div>
            <div className="pokeball-bottom"></div>
          </div>
        </div>
      )}
    </div>
  );
}

