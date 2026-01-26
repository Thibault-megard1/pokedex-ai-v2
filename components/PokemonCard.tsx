import Link from "next/link";
import type { PokemonBasic } from "@/lib/types";
import { typeStyle } from "@/lib/typeStyle";
import { getDisplayName, formatPokemonName } from "@/lib/pokemonNames.utils";


export default function PokemonCard({ p }: { p: PokemonBasic }) {
  // Déterminer si c'est une forme spéciale
  const isMega = p.name.includes("mega");
  const isGmax = p.name.includes("gmax");
  const isRegional = p.name.includes("alola") || p.name.includes("galar") || p.name.includes("hisui") || p.name.includes("paldea");
  
  let badge = null;
  if (isMega) badge = { text: "MEGA", color: "bg-purple-500" };
  else if (isGmax) badge = { text: "GMAX", color: "bg-red-500" };
  else if (isRegional) badge = { text: "REGIONAL", color: "bg-blue-500" };
  
  const names = formatPokemonName(p.name, p.frenchName);
  
  return (
    <Link href={`/pokemon/${p.name}`} className="card p-4 hover:shadow-md transition block relative">
      {badge && (
        <div className={`absolute top-2 right-2 ${badge.color} text-white text-xs font-bold px-2 py-0.5 rounded-full z-10`}>
          {badge.text}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {p.sprite ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.sprite} alt={names.primary} className="w-16 h-16" />
          ) : (
            <span className="text-xs text-gray-500">no sprite</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{names.primary}</div>
          {names.secondary && (
            <div className="text-xs text-gray-500 italic truncate capitalize">{names.secondary}</div>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {p.types.map(t => {
              const s = typeStyle(t);
              return (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${s.badgeClass}`}
                  title={s.label}
                >
                  <span aria-hidden>{s.icon}</span>
                  <span className="capitalize">{t}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}
