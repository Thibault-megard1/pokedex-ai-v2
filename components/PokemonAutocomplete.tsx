"use client";

import { useEffect, useState } from "react";

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export default function PokemonAutocomplete({ id, value, onChange, placeholder }: Props) {
  const [names, setNames] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  // Chargement du cache côté client (une seule fois)
  useEffect(() => {
    fetch("/data/pokemon-names.json")
      .then(r => r.json())
      .then(setNames)
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

            if (lastTokenIsRoman) {
              // Quand l'utilisateur tape un suffixe en chiffre romain (generation-i, etc.),
              // on filtre uniquement sur cette valeur exacte pour éviter de suggérer ii/iii/iv.
              const parts = lower.split(/[-\s]+/).filter(Boolean);
              const candidateLast = parts[parts.length - 1] ?? "";
              if (candidateLast !== lastToken) return false;
            }

            return lower.startsWith(normalized);
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
                <span className="capitalize">{name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
