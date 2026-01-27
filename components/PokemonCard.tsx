import Link from "next/link";
import type { PokemonBasic } from "@/lib/types";
import TypeLogo from "@/components/TypeLogo";
import { getDisplayName, formatPokemonName } from "@/lib/pokemonNames.utils";


export default function PokemonCard({ p }: { p: PokemonBasic }) {
  // Déterminer si c'est une forme spéciale
  const isMega = p.name.includes("mega");
  const isGmax = p.name.includes("gmax");
  const isRegional = p.name.includes("alola") || p.name.includes("galar") || p.name.includes("hisui") || p.name.includes("paldea");
  
  let badge = null;
  if (isMega) badge = { text: "MEGA", color: "bg-purple-600" };
  else if (isGmax) badge = { text: "GMAX", color: "bg-red-600" };
  else if (isRegional) badge = { text: "REGIONAL", color: "bg-blue-600" };
  
  const names = formatPokemonName(p.name, p.frenchName);
  
  return (
    <Link href={`/pokemon/${p.name}`} className="pokedex-card block group">
      {badge && (
        <div className={`absolute top-3 right-3 ${badge.color} text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-lg pokemon-text`}>
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
          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative shadow-inner border-2 border-gray-200">
            {p.sprite ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={p.sprite} 
                alt={names.primary} 
                className="w-full h-full object-contain pixelated group-hover:scale-110 transition-transform"
              />
            ) : (
              <span className="text-xs text-gray-400">no sprite</span>
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
