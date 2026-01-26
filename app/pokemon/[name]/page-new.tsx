import Link from "next/link";
import { getPokemonDetail, getAdjacentPokemonId, getPokemonEvolutionTree } from "@/lib/pokeapi";
import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";
import { backgroundForPokemonDetail } from "@/lib/backgrounds";
import { getTypeRelations } from "@/lib/typeRelations";
import { formatPokemonName } from "@/lib/pokemonNames.utils";
import EvolutionTree from "@/components/EvolutionTree";
import MovesList from "@/components/MovesList";
import NaturesList from "@/components/NaturesList";
import TypeRelations from "@/components/TypeRelations";
import PokemonForms from "@/components/PokemonForms";
import FavoriteButton from "@/components/FavoriteButton";
import HistoryTracker from "@/components/HistoryTracker";
import PokemonNotes from "@/components/PokemonNotes";


export default async function PokemonDetailPage({ params }: { params: { name: string } }) {
  const p = await getPokemonDetail(params.name);
  const bg = backgroundForPokemonDetail({ id: p.id, region: p.region ?? null, types: p.types });
  const prevId = await getAdjacentPokemonId(p.id, "prev");
  const nextId = await getAdjacentPokemonId(p.id, "next");
  const evolutionTree = await getPokemonEvolutionTree(p.id);
  const typeRelations = getTypeRelations(p.types);
  const heightM = (p.heightDecimeters / 10).toFixed(1);
  const weightKg = (p.weightHectograms / 10).toFixed(1);
  const cryUrl = p.cry?.latest ?? p.cry?.legacy ?? null;

  return (
    <div className="page-bg min-h-screen" style={{ ["--bg-url" as any]: `url(${bg})` }}>
      <HistoryTracker id={p.id} name={p.name} sprite={p.sprite} />
      <div className="page-content py-24 px-4">
        
        {/* Hero Section */}
        <div className="pokedex-panel max-w-6xl mx-auto mb-6 pokedex-open-animation">
          <div className="pokedex-panel-content">
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left: Sprites */}
              <div className="flex flex-col items-center">
                <div className="pokedex-screen p-6 w-full max-w-sm">
                  <div className="relative">
                    {p.sprite ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={p.sprite} 
                        alt={p.name} 
                        className="w-64 h-64 mx-auto pixelated hover:scale-110 transition-transform" 
                      />
                    ) : null}
                    
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full pokemon-text">
                      #{String(p.id).padStart(3, "0")}
                    </div>
                  </div>
                </div>
                
                {/* Shiny Sprite */}
                {p.shinySprite && (
                  <div className="mt-4 pokedex-screen p-4 w-full max-w-sm bg-gradient-to-br from-yellow-50 to-orange-50">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={p.shinySprite} 
                        alt={`${p.name} shiny`} 
                        className="w-40 h-40 mx-auto pixelated hover:scale-110 transition-transform" 
                      />
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                        ✨ SHINY
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right: Info */}
              <div className="flex flex-col justify-center">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-pokemon mb-2">
                      {formatPokemonName(p.name, p.frenchName).primary.toUpperCase()}
                    </h1>
                    {formatPokemonName(p.name, p.frenchName).secondary && (
                      <p className="text-lg text-gray-600 italic capitalize">
                        {formatPokemonName(p.name, p.frenchName).secondary}
                      </p>
                    )}
                  </div>
                  <FavoriteButton pokemonId={p.id} pokemonName={p.name} size="lg" />
                </div>
                
                {/* Types */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.types.map(t => (
                    <TypeBadge key={t} kind={t as BadgeKey} width={120} />
                  ))}
                </div>
                
                {/* Physical Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                    <div className="text-xs text-blue-600 font-bold pokemon-text">TAILLE</div>
                    <div className="text-2xl font-bold text-blue-900">{heightM} m</div>
                  </div>
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-bold pokemon-text">POIDS</div>
                    <div className="text-2xl font-bold text-green-900">{weightKg} kg</div>
                  </div>
                </div>
                
                {p.generation && (
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 mb-4">
                    <div className="text-xs text-purple-600 font-bold pokemon-text">GÉNÉRATION</div>
                    <div className="text-xl font-bold text-purple-900 capitalize">{p.generation}</div>
                  </div>
                )}
                
                {/* Cry Audio */}
                {cryUrl ? (
                  <div className="pokedex-screen p-3">
                    <div className="text-xs font-bold pokemon-text mb-2">🔊 CRI</div>
                    <audio controls src={cryUrl} className="w-full" />
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">Cri non disponible</div>
                )}
                
                {/* Navigation */}
                <div className="flex gap-3 mt-4">
                  <Link className="pokedex-button flex-1" href={`/pokemon/${prevId}`}>
                    ← Précédent
                  </Link>
                  <Link className="pokedex-button flex-1" href={`/pokemon/${nextId}`}>
                    Suivant →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="pokedex-panel max-w-6xl mx-auto mb-6">
          <div className="pokedex-panel-content p-6">
            <h2 className="text-pokemon text-2xl mb-4">📊 STATISTIQUES</h2>
            <div className="space-y-3">
              {p.stats.map(s => {
                const percentage = Math.min(100, (s.value / 255) * 100);
                const color = s.value >= 120 ? "green" : s.value >= 80 ? "blue" : s.value >= 50 ? "yellow" : "red";
                
                return (
                  <div key={s.name} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-semibold text-gray-700 capitalize pokemon-text">
                      {s.name}
                    </div>
                    <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                      <div 
                        className={`h-full hp-bar-${color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-lg font-bold text-gray-800">
                      {s.value}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <form action="/team" method="GET">
                <input type="hidden" name="add" value={p.name} />
                <button className="pokedex-button-yellow" type="submit">
                  ➕ Ajouter à mon équipe
                </button>
              </form>
              <Link className="pokedex-button" href="/pokemon">
                ← Retour au Pokédex
              </Link>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="pokedex-screen max-w-6xl mx-auto mb-6 p-6">
          <h2 className="text-pokemon text-xl mb-4">📝 MES NOTES</h2>
          <PokemonNotes pokemonId={p.id} pokemonName={p.name} />
        </div>

        {/* Type Relations */}
        <div className="pokedex-panel max-w-6xl mx-auto mb-6">
          <div className="pokedex-panel-content p-6">
            <h2 className="text-pokemon text-2xl mb-4">⚔️ EFFICACITÉ DES TYPES</h2>
            <TypeRelations
              weakTo={typeRelations.weakTo}
              resistantTo={typeRelations.resistantTo}
              immuneTo={typeRelations.immuneTo}
              strongAgainst={typeRelations.strongAgainst}
              weakAgainst={typeRelations.weakAgainst}
            />
          </div>
        </div>

        {/* Evolution Tree */}
        {evolutionTree && (
          <div className="pokedex-panel max-w-6xl mx-auto mb-6">
            <div className="pokedex-panel-content p-6">
              <EvolutionTree
                evolutionTree={evolutionTree}
                currentPokemonId={p.id}
              />
            </div>
          </div>
        )}

        {/* Forms */}
        {p.forms && p.forms.filter(f => !f.isMega && !f.isGmax).length > 0 && (
          <div className="pokedex-panel max-w-6xl mx-auto mb-6">
            <div className="pokedex-panel-content p-6">
              <PokemonForms forms={p.forms} pokemonName={p.name} />
            </div>
          </div>
        )}

        {/* Moves */}
        {p.moves && p.moves.length > 0 && (
          <div className="pokedex-screen max-w-6xl mx-auto mb-6 p-6">
            <h2 className="text-pokemon text-xl mb-4">⚡ ATTAQUES</h2>
            <MovesList moves={p.moves} />
          </div>
        )}

        {/* Natures */}
        {p.natures && p.natures.length > 0 && (
          <div className="pokedex-panel max-w-6xl mx-auto mb-6">
            <div className="pokedex-panel-content p-6">
              <h2 className="text-pokemon text-xl mb-4">🍀 NATURES POSSIBLES</h2>
              <NaturesList natures={p.natures} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
