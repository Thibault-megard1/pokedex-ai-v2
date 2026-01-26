"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Chargement du cache côté client (une seule fois)
  useEffect(() => {
    fetch("/data/pokemon-names.json")
      .then(r => r.json())
      .then(async (englishNames: string[]) => {
        setNames(englishNames);
        const map = new Map<string, PokemonName>();
        
        // Charger les noms français depuis le cache pour les 200 premiers Pokémon
        // (pour éviter de charger 1000+ fichiers)
        const promises = englishNames.slice(0, 200).map(async (name) => {
          try {
            const response = await fetch(`/data/pokemon-cache/${name}.json`);
            if (response.ok) {
              const data = await response.json();
              map.set(name, { english: name, french: data.frenchName || name });
            } else {
              map.set(name, { english: name });
            }
          } catch {
            map.set(name, { english: name });
          }
        });
        
        // Pour les Pokémon restants, initialiser sans nom français
        englishNames.slice(200).forEach(name => {
          map.set(name, { english: name });
        });
        
        await Promise.all(promises);
        setPokemonMap(map);
      })
      .catch(() => {});
  }, []);

  const normalized = normalizeText(value.trim());
  const tokens = normalized.split(/[-\s]+/).filter(Boolean);
  const lastToken = tokens[tokens.length - 1] ?? "";
  const lastTokenIsRoman = /^[ivxlcdm]+$/.test(lastToken);

  // Mettre à jour la position du dropdown quand l'input change ou quand on l'ouvre
  useEffect(() => {
    if (open && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [open, value]);

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

      {mounted && open && items.length > 0 && createPortal(
        <ul 
          className="fixed z-[9999] bg-white border rounded-md shadow-md max-h-64 overflow-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
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
        </ul>,
        document.body
      )}
    </div>
  );
}
