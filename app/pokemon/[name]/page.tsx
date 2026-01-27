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
      <HistoryTracker id={p.id} name={p.frenchName || p.name} sprite={p.sprite} />
      <div className="pokedex-container">
        
        {/* Hero Section - Identité Principale avec Sprite Centré */}
        <section className="pokedex-hero-section">
          {/* Navigation */}
          <div className="pokedex-nav-buttons">
            <Link className="pokedex-nav-button" href={`/pokemon/${prevId}`}>
              ← Précédent
            </Link>
            <Link className="pokedex-nav-button" href={`/pokemon/${nextId}`}>
              Suivant →
            </Link>
          </div>

          {/* Titre et Numéro Centrés */}
          <div className="pokedex-hero-header">
            <div className="pokedex-number-badge">N° {String(p.id).padStart(3, '0')}</div>
            <h1 className="pokedex-hero-title">{formatPokemonName(p.name, p.frenchName).primary}</h1>
            {formatPokemonName(p.name, p.frenchName).secondary && (
              <p className="pokedex-hero-subtitle">{formatPokemonName(p.name, p.frenchName).secondary}</p>
            )}
          </div>

          {/* Sprite Agrandi et Centré */}
          <div className="pokedex-hero-sprite">
            <PokemonSpriteDisplay 
              sprite={p.sprite}
              shinySprite={p.shinySprite ?? null}
              name={p.name}
              pokemonId={p.id}
            />
          </div>

          {/* Types et Infos de Base - Compact et Centré */}
          <div className="pokedex-hero-info">
            <div className="pokedex-hero-types">
              {p.types.map(t => (
                <TypeBadge key={t} kind={t as BadgeKey} width={120} />
              ))}
            </div>
            
            <div className="pokedex-hero-stats">
              <div className="pokedex-hero-stat">
                <span className="label">Taille</span>
                <span className="value">{heightM} m</span>
              </div>
              <div className="pokedex-hero-stat-divider"></div>
              <div className="pokedex-hero-stat">
                <span className="label">Poids</span>
                <span className="value">{weightKg} kg</span>
              </div>
              {p.generation && (
                <>
                  <div className="pokedex-hero-stat-divider"></div>
                  <div className="pokedex-hero-stat">
                    <span className="label">Génération</span>
                    <span className="value capitalize">{p.generation}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions Rapides */}
          <div className="pokedex-hero-actions">
            <FavoriteButton pokemonId={p.id} pokemonName={p.name} size="lg" />
            {cryUrl && (
              <div className="pokedex-cry-player">
                <audio controls src={cryUrl} className="pokedex-audio" />
              </div>
            )}
          </div>
        </section>

        {/* Section Stats - Optimisée */}
        <section className="pokedex-stats-section">
          <h2 className="pokedex-section-title">📊 Statistiques</h2>
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
                  className="pokedex-stat-row"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <span className="pokedex-stat-name">{s.name}</span>
                  <div className="pokedex-stat-bar-container">
                    <div 
                      className={`pokedex-stat-bar ${statColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="pokedex-stat-number">{s.value}</span>
                </div>
              );
            })}
            <div className="pokedex-stat-total">
              <span className="pokedex-stat-name">TOTAL</span>
              <div></div>
              <span className="pokedex-stat-total-value">{totalStats}</span>
            </div>
          </div>
        </section>

        {/* Section Relations de types - Optimisée */}
        <section className="pokedex-effectiveness-section">
          <h2 className="pokedex-section-title">⚔️ Efficacité des types</h2>
          <TypeRelations
            weakTo={typeRelations.weakTo}
            resistantTo={typeRelations.resistantTo}
            immuneTo={typeRelations.immuneTo}
            strongAgainst={typeRelations.strongAgainst}
            weakAgainst={typeRelations.weakAgainst}
          />
        </section>

        {/* Section Évolutions - Optimisée */}
        {evolutionTree && (
          <section className="pokedex-evolution-section">
            <EvolutionTree
              evolutionTree={evolutionTree}
              currentPokemonId={p.id}
            />
          </section>
        )}

        {/* Section Formes alternatives */}
        {p.forms && p.forms.filter(f => !f.isMega && !f.isGmax).length > 0 && (
          <section className="pokedex-forms-section">
            <PokemonForms forms={p.forms} pokemonName={p.name} />
          </section>
        )}

        {/* Section Attaques */}
        {p.moves && p.moves.length > 0 && (
          <section className="pokedex-moves-section">
            <h2 className="pokedex-section-title">⚡ Attaques</h2>
            <MovesList moves={p.moves} />
          </section>
        )}

        {/* Section Natures */}
        {p.natures && p.natures.length > 0 && (
          <section className="pokedex-natures-section">
            <h2 className="pokedex-section-title">🎭 Natures possibles</h2>
            <NaturesList natures={p.natures} />
          </section>
        )}

        {/* Section Notes Personnelles */}
        <section className="pokedex-notes-section">
          <h2 className="pokedex-section-title">📝 Mes Notes</h2>
          <PokemonNotes pokemonId={p.id} pokemonName={p.name} />
        </section>

        {/* Section Actions - Optimisée */}
        <section className="pokedex-actions-section">
          <form action="/team" method="GET" className="pokedex-action-form">
            <input type="hidden" name="add" value={p.name} />
            <button className="pokedex-action-button primary" type="submit">
              ➕ Ajouter à mon équipe
            </button>
          </form>
          <a className="pokedex-action-button secondary" href="/pokemon">
            ← Retour à la liste
          </a>
        </section>
      </div>
    </div>
  );
}
