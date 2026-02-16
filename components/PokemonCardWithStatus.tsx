'use client';

import { useEffect, useState } from 'react';
import { PokedexStats } from '@/app/api/pokedex-completion/route';
import Link from 'next/link';
import type { PokemonBasic } from '@/lib/types';
import TypeLogo from '@/components/TypeLogo';
import { formatPokemonName } from '@/lib/pokemonNames.utils';

export default function PokemonCardWithStatus({ p }: { p: PokemonBasic }) {
  const [status, setStatus] = useState<'unseen' | 'seen' | 'caught' | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/pokedex-completion');
        if (res.ok) {
          const data: PokedexStats = await res.json();
          const entry = data.entries[p.id];

          if (!entry || (!entry.seen && !entry.caught)) {
            setStatus('unseen');
          } else if (entry.caught) {
            setStatus('caught');
          } else if (entry.seen) {
            setStatus('seen');
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }

    checkStatus();
  }, [p.id]);

  // Déterminer si c'est une forme spéciale
  const isMega = p.name.includes('mega');
  const isGmax = p.name.includes('gmax');
  const isRegional =
    p.name.includes('alola') ||
    p.name.includes('galar') ||
    p.name.includes('hisui') ||
    p.name.includes('paldea');

  let badge = null;
  if (isMega) badge = { text: 'MEGA', color: 'bg-purple-600' };
  else if (isGmax) badge = { text: 'GMAX', color: 'bg-red-600' };
  else if (isRegional) badge = { text: 'REGIONAL', color: 'bg-blue-600' };

  const names = formatPokemonName(p.name, p.frenchName);

  // Status indicator
  let statusIndicator = null;
  if (status === 'caught') {
    statusIndicator = (
      <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg flex items-center gap-1">
        <span>✓</span>
        <span>CAPTURÉ</span>
      </div>
    );
  } else if (status === 'seen') {
    statusIndicator = (
      <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg flex items-center gap-1">
        <span>👁</span>
        <span>VU</span>
      </div>
    );
  }

  return (
    <Link href={`/pokemon/${p.name}`} className="pokedex-card block group">
      {statusIndicator}
      {badge && (
        <div
          className={`absolute top-3 right-3 ${badge.color} text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-lg pokemon-text`}
        >
          {badge.text}
        </div>
      )}

      <div className="pokedex-card-header">
        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 pokemon-text">
          #{p.id?.toString().padStart(3, '0')}
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col items-center gap-3">
          {/* Pokemon Sprite */}
          <div
            className={`w-24 h-24 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden relative shadow-inner border-2 border-gray-200 dark:border-gray-600 ${
              status === 'unseen' ? 'opacity-40 grayscale' : ''
            }`}
          >
            {p.sprite ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.sprite}
                alt={names.primary}
                className="w-full h-full object-contain pixelated group-hover:scale-110 transition-transform"
              />
            ) : (
              <div className="pokeball-placeholder" style={{ width: '64px', height: '64px' }}>
                <div className="pokeball-inner">
                  <div className="pokeball-top"></div>
                  <div className="pokeball-button"></div>
                  <div className="pokeball-bottom"></div>
                </div>
              </div>
            )}
          </div>

          {/* Pokemon Info */}
          <div className="w-full text-center">
            <h3 className="font-bold text-lg truncate capitalize group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors text-gray-900 dark:text-gray-100">
              {names.primary}
            </h3>
            {names.secondary && (
              <div className="text-xs text-gray-600 dark:text-gray-400 italic truncate capitalize mt-1">
                {names.secondary}
              </div>
            )}

            {/* Type Logos */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {p.types.map(t => (
                <TypeLogo key={t} type={t} size={24} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
