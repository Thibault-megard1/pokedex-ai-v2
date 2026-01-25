"use client";

import { useState } from "react";
import PokemonAutocomplete from "@/components/PokemonAutocomplete";
import { REGION_OPTIONS, TYPE_OPTIONS } from "@/lib/regions";

type Props = {
  initialQ: string;
  initialSize: string;
  initialType: string;
  initialRegion: string;
  initialSort: string;
  initialOrder: string;
};

export default function PokedexSearchBar({
  initialQ,
  initialSize,
  initialType,
  initialRegion,
  initialSort,
  initialOrder
}: Props) {
  const [q, setQ] = useState(initialQ);

  return (
    <form className="mt-3 grid grid-cols-1 lg:grid-cols-6 gap-2" action="/pokemon" method="GET">
      <input type="hidden" name="page" value="1" />

      <div className="lg:col-span-2">
        <PokemonAutocomplete
          id="pokedex-q"
          value={q}
          onChange={setQ}
          placeholder="Rechercher un Pokémon"
        />
        {/* champ réel envoyé au serveur */}
        <input type="hidden" name="q" value={q} />
      </div>

      <select className="input" name="size" defaultValue={initialSize}>
        <option value="20">20 / page</option>
        <option value="50">50 / page</option>
        <option value="100">100 / page</option>
      </select>

      <select className="input" name="type" defaultValue={initialType}>
        <option value="">Tous types</option>
        {TYPE_OPTIONS.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select className="input" name="region" defaultValue={initialRegion}>
        <option value="">Toutes régions</option>
        {REGION_OPTIONS.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <select className="input" name="sort" defaultValue={initialSort}>
        <option value="id">Numéro</option>
        <option value="name">Nom</option>
        <option value="height">Taille</option>
        <option value="weight">Poids</option>
        <option value="total">Total stats</option>
        <option value="hp">HP</option>
        <option value="attack">Attack</option>
        <option value="defense">Defense</option>
        <option value="speed">Speed</option>
      </select>

      <select className="input" name="order" defaultValue={initialOrder}>
        <option value="asc">Croissant</option>
        <option value="desc">Décroissant</option>
      </select>

      <button className="btn btn-primary lg:col-span-6" type="submit">Appliquer</button>
    </form>
  );
}
