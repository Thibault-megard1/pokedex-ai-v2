'use client';

import { useEffect, useState } from 'react';
import { PokedexStats } from '@/app/api/pokedex-completion/route';
import PokemonCard from '@/components/PokemonCard';
import type { PokemonBasic } from '@/lib/types';

interface PokemonGridWithStatusProps {
  pokemon: PokemonBasic[];
}

export default function PokemonGridWithStatus({ pokemon }: PokemonGridWithStatusProps) {
  const [completionData, setCompletionData] = useState<PokedexStats | null>(null);

  useEffect(() => {
    async function fetchCompletionData() {
      try {
        const res = await fetch('/api/pokedex-completion');
        if (res.ok) {
          const data = await res.json();
          setCompletionData(data);
        }
      } catch (err) {
        // Ignore errors - will just show cards without status
      }
    }

    fetchCompletionData();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {pokemon.map(p => {
        // Determine status for this Pokémon
        let statusBadge = null;
        let cardOpacity = '';

        if (completionData) {
          const entry = completionData.entries[p.id];

          if (!entry || (!entry.seen && !entry.caught)) {
            // Unseen
            statusBadge = (
              <div className="absolute top-3 left-3 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
                ?
              </div>
            );
            cardOpacity = 'opacity-60';
          } else if (entry.caught) {
            // Caught
            statusBadge = (
              <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
                ✓
              </div>
            );
          } else if (entry.seen) {
            // Seen but not caught
            statusBadge = (
              <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
                👁
              </div>
            );
          }
        }

        return (
          <div key={p.id} className={`relative ${cardOpacity}`}>
            {statusBadge}
            <PokemonCard p={p} />
          </div>
        );
      })}
    </div>
  );
}
