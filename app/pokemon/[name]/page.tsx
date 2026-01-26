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

  // Récupérer l'arbre d'évolution complet
  const evolutionTree = await getPokemonEvolutionTree(p.id);

  // Calculer les relations de types (faiblesses, résistances, immunités)
  const typeRelations = getTypeRelations(p.types);

  const heightM = (p.heightDecimeters / 10).toFixed(1);
  const weightKg = (p.weightHectograms / 10).toFixed(1);

  const cryUrl = p.cry?.latest ?? p.cry?.legacy ?? null;

  return (
    <div className="page-bg" style={{ ["--bg-url" as any]: `url(${bg})` }}>
      <HistoryTracker id={p.id} name={p.name} sprite={p.sprite} />
      <div className="page-content space-y-4">
      <div className="card p-5 mt-24">
        <div className="flex items-start gap-4">
          {/* Sprites normaux et shiny */}
          <div className="flex flex-col gap-3">
            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.sprite ? <img src={p.sprite} alt={p.name} className="w-28 h-28 pixelated hover:scale-110 transition-transform" /> : null}
            </div>
            
            {p.shinySprite && (
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 flex items-center justify-center overflow-hidden shadow-inner relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.shinySprite} alt={`${p.name} shiny`} className="w-28 h-28 pixelated hover:scale-110 transition-transform" />
                <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  ✨ Shiny
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold truncate">
                {formatPokemonName(p.name, p.frenchName).primary} <span className="text-gray-400 text-base">#{p.id}</span>
              </h1>
              <FavoriteButton pokemonId={p.id} pokemonName={p.name} size="lg" />
            </div>
            {formatPokemonName(p.name, p.frenchName).secondary && (
              <p className="text-lg text-gray-600 dark:text-gray-400 italic mt-1 capitalize">{formatPokemonName(p.name, p.frenchName).secondary}</p>
            )}
            <div className="mt-4 flex gap-2 flex-wrap">
              <Link className="btn" href={`/pokemon/${prevId}`}>← Précédent</Link>
              <Link className="btn" href={`/pokemon/${nextId}`}>Suivant →</Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {p.types.map(t => (
                <TypeBadge key={t} kind={t as BadgeKey} width={110} />
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Taille: <b>{heightM} m</b> — Poids: <b>{weightKg} kg</b>
              {p.generation ? <> — Génération: <b className="capitalize">{p.generation}</b></> : null}
            </div>
          </div>
        </div>

        {cryUrl ? (
          <div className="mt-4">
            <div className="text-sm font-semibold">Cri</div>
            <audio controls src={cryUrl} className="mt-1 w-full" />
            <p className="text-xs text-gray-500 mt-1">Si le navigateur bloque, clique “play” manuellement.</p>
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-4">Cri non disponible pour ce Pokémon (fallback).</p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold">Stats</h2>
        <div className="mt-3 space-y-2">
          {p.stats.map(s => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="w-28 text-sm text-gray-700 dark:text-gray-300 capitalize">{s.name}</div>
              <div className="flex-1 h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                <div className="h-3 bg-white" style={{ width: `${Math.min(100, (s.value / 255) * 100)}%` }} />
              </div>
              <div className="w-10 text-right text-sm">{s.value}</div>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2 mt-2 border-t-2 border-gray-300">
            <div className="w-28 text-sm font-bold text-gray-900 dark:text-gray-100">TOTAL</div>
            <div className="flex-1"></div>
            <div className="w-10 text-right text-sm font-bold text-blue-600">{p.stats.reduce((sum, s) => sum + s.value, 0)}</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <form action="/team" method="GET">
            <input type="hidden" name="add" value={p.name} />
            <button className="btn btn-primary" type="submit">Ajouter à mon équipe</button>
          </form>
          <a className="btn" href="/pokemon">Retour</a>
        </div>
      </div>

      {/* Section Notes Personnelles */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-4">📝 Mes Notes</h2>
        <PokemonNotes pokemonId={p.id} pokemonName={p.name} />
      </div>

      {/* Section Relations de types (Faiblesses/Résistances/Immunités) */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-4">Efficacité des types</h2>
        <TypeRelations
          weakTo={typeRelations.weakTo}
          resistantTo={typeRelations.resistantTo}
          immuneTo={typeRelations.immuneTo}
          strongAgainst={typeRelations.strongAgainst}
          weakAgainst={typeRelations.weakAgainst}
        />
      </div>

      {/* Section Évolutions */}
      {evolutionTree && (
        <div className="card p-5">
          <EvolutionTree
            evolutionTree={evolutionTree}
            currentPokemonId={p.id}
          />
        </div>
      )}

      {/* Section Formes alternatives (régionales et autres, hors Mega/Gigamax) */}
      {p.forms && p.forms.filter(f => !f.isMega && !f.isGmax).length > 0 && (
        <div className="card p-5">
          <PokemonForms forms={p.forms} pokemonName={p.name} />
        </div>
      )}

      {/* Section Attaques */}
      {p.moves && p.moves.length > 0 && (
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-4">Attaques</h2>
          <MovesList moves={p.moves} />
        </div>
      )}

      {/* Section Natures */}
      {p.natures && p.natures.length > 0 && (
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-4">Natures possibles</h2>
          <NaturesList natures={p.natures} />
        </div>
      )}
      </div>
    </div>
  );
}
