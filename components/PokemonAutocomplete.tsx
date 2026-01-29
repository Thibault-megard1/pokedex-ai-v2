"use client";

import { useEffect, useState, useRef } from "react";

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

// Fonction pour normaliser les noms (enlever les accents et mettre en minuscule)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function PokemonAutocomplete({ id, value, onChange, placeholder }: Props) {
  const [names, setNames] = useState<string[]>([]);
  const [pokemonMap, setPokemonMap] = useState<Map<string, PokemonName>>(new Map());
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // Chargement du cache côté client (une seule fois)
  useEffect(() => {
    const loadPokemonData = async () => {
      try {
        // Charger la liste des noms de base
        const namesRes = await fetch("/data/pokemon-names.json");
        const pokemonNames: string[] = await namesRes.json();
        
        const englishNames: string[] = [];
        const map = new Map<string, PokemonName>();
        
        // Charger les noms français via l'API pour les 151 premiers Pokémon (Génération 1)
        // Utilise l'API au lieu d'accéder directement aux fichiers cache
        const cachePromises = pokemonNames.slice(0, 151).map(async (name: string, index: number) => {
          const pokemonId = index + 1;
          try {
            // Utiliser l'API /api/pokemon/cache au lieu de /data/pokemon-cache
            const cacheRes = await fetch(`/api/pokemon/cache?id=${pokemonId}`);
            if (cacheRes.ok) {
              const cacheData = await cacheRes.json();
              englishNames.push(name);
              map.set(name, { 
                english: name, 
                french: cacheData.frenchName || name 
              });
            } else {
              // Fallback: juste le nom anglais
              englishNames.push(name);
              map.set(name, { english: name });
            }
          } catch {
            // Silent fallback
            englishNames.push(name);
            map.set(name, { english: name });
          }
        });
        
        await Promise.all(cachePromises);
        
        // Ajouter les Pokémon restants avec uniquement les noms anglais
        pokemonNames.slice(151).forEach((name: string) => {
          englishNames.push(name);
          map.set(name, { english: name });
        });
        
        setNames(englishNames);
        setPokemonMap(map);
      } catch (error) {
        console.error('Failed to load Pokemon data:', error);
        // Fallback
        setNames([]);
        setPokemonMap(new Map());
      }
    };
    
    loadPokemonData();
  }, []);

  const normalized = normalizeText(value.trim());
  const tokens = normalized.split(/[-\s]+/).filter(Boolean);
  const lastToken = tokens[tokens.length - 1] ?? "";
  const lastTokenIsRoman = /^[ivxlcdm]+$/.test(lastToken);

  const items =
    normalized.length < 2
      ? []
      : names
          .filter(n => {
            const lower = normalizeText(n);
            const pokemonData = pokemonMap.get(n);
            const frenchLower = normalizeText(pokemonData?.french ?? "");

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
        ref={inputRef}
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
        <ul 
          ref={dropdownRef}
          className="absolute z-[9999] bg-white border rounded-md shadow-md max-h-64 overflow-auto w-full mt-1"
          style={{ top: '100%' }}
        >
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
