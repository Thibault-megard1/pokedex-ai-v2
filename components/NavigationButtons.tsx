"use client";

import Link from "next/link";
import { useShiny } from "./ShinyContext";

interface NavigationButtonsProps {
  prevId: number;
  nextId: number;
  prevSprite: string | null;
  nextSprite: string | null;
  prevShinySprite: string | null;
  nextShinySprite: string | null;
}

export default function NavigationButtons({
  prevId,
  nextId,
  prevSprite,
  nextSprite,
  prevShinySprite,
  nextShinySprite
}: NavigationButtonsProps) {
  const { isShiny } = useShiny();
  
  // Choisir les sprites en fonction du mode shiny
  const currentPrevSprite = isShiny && prevShinySprite ? prevShinySprite : prevSprite;
  const currentNextSprite = isShiny && nextShinySprite ? nextShinySprite : nextSprite;
  
  return (
    <div className="pokedex-nav-buttons">
      <Link className="pokedex-nav-button" href={`/pokemon/${prevId}`}>
        {currentPrevSprite && (
          <img 
            src={currentPrevSprite} 
            alt={`Pokémon #${prevId}`}
            className="w-8 h-8 sm:w-10 sm:h-10 pixelated"
            title={`Pokémon #${String(prevId).padStart(3, '0')}${isShiny ? ' ✨' : ''}`}
          />
        )}
        <span>← Précédent</span>
      </Link>
      <Link className="pokedex-nav-button" href={`/pokemon/${nextId}`}>
        <span>Suivant →</span>
        {currentNextSprite && (
          <img 
            src={currentNextSprite} 
            alt={`Pokémon #${nextId}`}
            className="w-8 h-8 sm:w-10 sm:h-10 pixelated"
            title={`Pokémon #${String(nextId).padStart(3, '0')}${isShiny ? ' ✨' : ''}`}
          />
        )}
      </Link>
    </div>
  );
}
