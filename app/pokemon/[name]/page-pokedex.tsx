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
import PokemonSpriteDisplay from "@/components/PokemonSpriteDisplay";

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
  const totalStats = p.stats.reduce((sum, s) => sum + s.value, 0);

  const cryUrl = p.cry?.latest ?? p.cry?.legacy ?? null;

  return (
    <div className="pokedex-page" style={{ ["--bg-url" as any]: `url(${bg})` }}>
      <HistoryTracker id={p.id} name={p.name} sprite={p.sprite} />
      <div className="pokedex-container">
        {/* Section Identité du Pokémon */}
        <section className="pokedex-identity-section">
          <div className="pokedex-nav-buttons">
            <Link className="pokedex-nav-button" href={`/pokemon/${prevId}`}>
              <span>←</span>
            </Link>
            <Link className="pokedex-nav-button" href={`/pokemon/${nextId}`}>
              <span>→</span>
            </Link>
          </div>

          <div className="pokedex-header">
            <h1 className="pokedex-title">{formatPokemonName(p.name, p.frenchName).primary}</h1>
            {formatPokemonName(p.name, p.frenchName).secondary && (
              <p className="pokedex-subtitle">{formatPokemonName(p.name, p.frenchName).secondary}</p>
            )}
            <p className="pokedex-id">N° {String(p.id).padStart(3, '0')}</p>
          </div>

          <div className="pokedex-favorite-wrapper">
            <FavoriteButton pokemonId={p.id} pokemonName={p.name} size="lg" />
          </div>
        </section>

        {/* Section Sprite avec toggle shiny */}
        <section className="pokedex-sprite-section">
          <PokemonSpriteDisplay 
            sprite={p.sprite}
            shinySprite={p.shinySprite ?? null}
            name={p.name}
            pokemonId={p.id}
          />
          {cryUrl && (
            <div className="pokedex-cry-player">
              <audio controls src={cryUrl} className="pokedex-audio" />
            </div>
          )}
        </section>

        {/* Section Types et Infos */}
        <section className="pokedex-info-section">
          <div className="pokedex-types-wrapper">
            {p.types.map(t => (
              <TypeBadge key={t} kind={t as BadgeKey} width={110} />
            ))}
          </div>
          <div className="pokedex-physical-info">
            <div className="pokedex-info-item">
              <span className="pokedex-info-label">Taille</span>
              <span className="pokedex-info-value">{heightM} m</span>
            </div>
            <div className="pokedex-info-item">
              <span className="pokedex-info-label">Poids</span>
              <span className="pokedex-info-value">{weightKg} kg</span>
            </div>
            {p.generation && (
              <div className="pokedex-info-item">
                <span className="pokedex-info-label">Génération</span>
                <span className="pokedex-info-value capitalize">{p.generation}</span>
              </div>
            )}
          </div>
        </section>

        {/* Section Stats */}
        <section className="pokedex-stats-section">
          <h2 className="pokedex-section-title">Statistiques</h2>
          <div className="pokedex-stats-grid">
            {p.stats.map((s, index) => {
              const percentage = Math.min(100, (s.value / 255) * 100);
              const statColor = 
                s.value >= 150 ? 'stat-exceptional' :
                s.value >= 100 ? 'stat-great' :
                s.value >= 70 ? 'stat-good' : 'stat-low';
              
              return (
                <div 
                  key={s.name} 
                  className="pokedex-stat-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="pokedex-stat-header">
                    <span className="pokedex-stat-name">{s.name}</span>
                    <span className="pokedex-stat-value">{s.value}</span>
                  </div>
                  <div className="pokedex-stat-bar-container">
                    <div 
                      className={`pokedex-stat-bar ${statColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pokedex-stat-total">
              <span className="pokedex-stat-name">TOTAL</span>
              <span className="pokedex-stat-value">{totalStats}</span>
            </div>
          </div>
        </section>

        {/* Section Relations de types */}
        <section className="pokedex-section">
          <h2 className="pokedex-section-title">Efficacité des types</h2>
          <TypeRelations
            weakTo={typeRelations.weakTo}
            resistantTo={typeRelations.resistantTo}
            immuneTo={typeRelations.immuneTo}
            strongAgainst={typeRelations.strongAgainst}
            weakAgainst={typeRelations.weakAgainst}
          />
        </section>

        {/* Section Évolutions */}
        {evolutionTree && (
          <section className="pokedex-section">
            <EvolutionTree
              evolutionTree={evolutionTree}
              currentPokemonId={p.id}
            />
          </section>
        )}

        {/* Section Formes alternatives */}
        {p.forms && p.forms.filter(f => !f.isMega && !f.isGmax).length > 0 && (
          <section className="pokedex-section">
            <PokemonForms forms={p.forms} pokemonName={p.name} />
          </section>
        )}

        {/* Section Attaques */}
        {p.moves && p.moves.length > 0 && (
          <section className="pokedex-section">
            <h2 className="pokedex-section-title">Attaques</h2>
            <MovesList moves={p.moves} />
          </section>
        )}

        {/* Section Natures */}
        {p.natures && p.natures.length > 0 && (
          <section className="pokedex-section">
            <h2 className="pokedex-section-title">Natures possibles</h2>
            <NaturesList natures={p.natures} />
          </section>
        )}

        {/* Section Notes Personnelles */}
        <section className="pokedex-section">
          <h2 className="pokedex-section-title">📝 Mes Notes</h2>
          <PokemonNotes pokemonId={p.id} pokemonName={p.name} />
        </section>

        {/* Section Actions */}
        <section className="pokedex-actions-section">
          <form action="/team" method="GET">
            <input type="hidden" name="add" value={p.name} />
            <button className="pokedex-action-button primary" type="submit">
              Ajouter à mon équipe
            </button>
          </form>
          <a className="pokedex-action-button secondary" href="/pokemon">
            Retour
          </a>
        </section>
      </div>
    </div>
  );
}
