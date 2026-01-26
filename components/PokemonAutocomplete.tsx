"use client";

import { useEffect, useState } from "react";

type PokemonName = {
  english: string;
  french?: string;
};

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export default function PokemonAutocomplete({ id, value, onChange, placeholder }: Props) {
  const [names, setNames] = useState<string[]>([]);
  const [pokemonMap, setPokemonMap] = useState<Map<string, PokemonName>>(new Map());
  const [open, setOpen] = useState(false);

  // Chargement du cache côté client (une seule fois)
  useEffect(() => {
    fetch("/data/pokemon-names.json")
      .then(r => r.json())
      .then((englishNames: string[]) => {
        setNames(englishNames);
        // Pour l'instant, on utilise juste les noms anglais
        // Les noms français seront chargés progressivement depuis le cache
        const map = new Map<string, PokemonName>();
        englishNames.forEach(name => {
          map.set(name, { english: name });
        });
        setPokemonMap(map);
      })
      .catch(() => {});
  }, []);

  const normalized = value.trim().toLowerCase();
  const tokens = normalized.split(/[-\s]+/).filter(Boolean);
  const lastToken = tokens[tokens.length - 1] ?? "";
  const lastTokenIsRoman = /^[ivxlcdm]+$/.test(lastToken);

  const items =
    normalized.length < 2
      ? []
      : names
          .filter(n => {
            const lower = n.toLowerCase();
            const pokemonData = pokemonMap.get(n);
            const frenchLower = pokemonData?.french?.toLowerCase() ?? "";

            if (lastTokenIsRoman) {
              // Quand l'utilisateur tape un suffixe en chiffre romain (generation-i, etc.),
              // on filtre uniquement sur cette valeur exacte pour éviter de suggérer ii/iii/iv.
              const parts = lower.split(/[-\s]+/).filter(Boolean);
              const candidateLast = parts[parts.length - 1] ?? "";
              if (candidateLast !== lastToken) return false;
            }

            // Recherche dans le nom anglais ou français
            return lower.startsWith(normalized) || frenchLower.startsWith(normalized);
          })
          .slice(0, 20);

  return (
    <div className="relative">
      <input
        id={`pokemon-input-${id}`}
        className="input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && items.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-md max-h-64 overflow-auto">
          {items.map(name => {
            const pokeId = names.indexOf(name) + 1; // pokédex id
            const pokemonData = pokemonMap.get(name);
            return (
              <li
                key={name}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`}
                  alt={name}
                  className="w-8 h-8 pixelated"
                />
                <div className="flex flex-col">
                  <span className="font-medium">{pokemonData?.french || name}</span>
                  {pokemonData?.french && (
                    <span className="text-xs text-gray-500 italic capitalize">{name}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
