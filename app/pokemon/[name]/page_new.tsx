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

  const totalStats = p.stats.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="page-bg pokedex-page" style={{ ["--bg-url" as any]: `url(${bg})` }}>
      <HistoryTracker id={p.id} name={p.name} sprite={p.sprite} />
      
      <div className="page-content pokedex-container">
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TOP SECTION – POKÉMON IDENTITY */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="pokedex-identity-section">
          <div className="pokedex-header">
            {/* Navigation */}
            <div className="pokedex-nav-buttons">
              <Link className="pokedex-nav-btn pokedex-nav-prev" href={`/pokemon/${prevId}`} title="Pokémon précédent">
                <span className="pokedex-nav-icon">◀</span>
                <span className="pokedex-nav-label">Précédent</span>
              </Link>
              <Link className="pokedex-nav-btn pokedex-nav-next" href={`/pokemon/${nextId}`} title="Pokémon suivant">
                <span className="pokedex-nav-label">Suivant</span>
                <span className="pokedex-nav-icon">▶</span>
              </Link>
            </div>

            {/* Pokémon Name & Number */}
            <div className="pokedex-title-block">
              <div className="pokedex-number">N° {String(p.id).padStart(4, '0')}</div>
              <h1 className="pokedex-name">{formatPokemonName(p.name, p.frenchName).primary}</h1>
              {formatPokemonName(p.name, p.frenchName).secondary && (
                <p className="pokedex-subtitle">{formatPokemonName(p.name, p.frenchName).secondary}</p>
              )}
            </div>

            {/* Favorite Button */}
            <div className="pokedex-favorite">
              <FavoriteButton pokemonId={p.id} pokemonName={p.name} size="lg" />
            </div>
          </div>

          {/* Main Identity Content */}
          <div className="pokedex-identity-content">
            {/* Sprite Display */}
            <div className="pokedex-sprite-container">
              {p.sprite && <img src={p.sprite} alt={p.name} className="pokedex-sprite" />}
              
              {/* Cry Player */}
              {cryUrl && (
                <div className="pokedex-cry-player">
                  <audio controls src={cryUrl} className="pokedex-audio" />
                </div>
              )}
            </div>

            {/* Meta Information */}
            <div className="pokedex-meta-info">
              {/* Types */}
              <div className="pokedex-types-container">
                <div className="pokedex-section-label">Type</div>
                <div className="pokedex-types-grid">
                  {p.types.map(t => (
                    <TypeBadge key={t} kind={t as BadgeKey} width={120} />
                  ))}
                </div>
              </div>

              {/* Physical Stats */}
              <div className="pokedex-physical-stats">
                <div className="pokedex-stat-item">
                  <div className="pokedex-stat-label">Taille</div>
                  <div className="pokedex-stat-value">{heightM} m</div>
                </div>
                <div className="pokedex-stat-item">
                  <div className="pokedex-stat-label">Poids</div>
                  <div className="pokedex-stat-value">{weightKg} kg</div>
                </div>
                {p.generation && (
                  <div className="pokedex-stat-item">
                    <div className="pokedex-stat-label">Génération</div>
                    <div className="pokedex-stat-value capitalize">{p.generation}</div>
                  </div>
                )}
              </div>

              {/* Quick Action */}
              <div className="pokedex-quick-action">
                <form action="/team" method="GET">
                  <input type="hidden" name="add" value={p.name} />
                  <button className="pokedex-team-btn" type="submit">
                    <span className="pokedex-team-icon">⚔️</span>
                    <span>Ajouter à mon équipe</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STATS SECTION – VISUAL & ANIMATED */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="pokedex-stats-section">
          <h2 className="pokedex-section-title">
            <span className="pokedex-title-icon">📊</span>
            Statistiques
          </h2>
          
          <div className="pokedex-stats-grid">
            {p.stats.map((s, index) => {
              const percentage = Math.min(100, (s.value / 255) * 100);
              const statColor = s.value >= 150 ? 'stat-exceptional' : s.value >= 100 ? 'stat-great' : s.value >= 70 ? 'stat-good' : 'stat-low';
              
              return (
                <div key={s.name} className="pokedex-stat-row">
                  <div className="pokedex-stat-name">{s.name}</div>
                  <div className="pokedex-stat-bar-container">
                    <div 
                      className={`pokedex-stat-bar ${statColor}`}
                      style={{ 
                        width: `${percentage}%`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    ></div>
                  </div>
                  <div className="pokedex-stat-number">{s.value}</div>
                </div>
              );
            })}
            
            {/* Total Stats */}
            <div className="pokedex-stat-total">
              <div className="pokedex-stat-name">TOTAL</div>
              <div className="pokedex-stat-bar-container"></div>
              <div className="pokedex-stat-number pokedex-stat-total-value">{totalStats}</div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TYPE EFFECTIVENESS SECTION */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="pokedex-effectiveness-section">
          <h2 className="pokedex-section-title">
            <span className="pokedex-title-icon">⚡</span>
            Efficacité des types
          </h2>
          
          <TypeRelations
            weakTo={typeRelations.weakTo}
            resistantTo={typeRelations.resistantTo}
            immuneTo={typeRelations.immuneTo}
            strongAgainst={typeRelations.strongAgainst}
            weakAgainst={typeRelations.weakAgainst}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* EVOLUTION TREE SECTION */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {evolutionTree && (
          <div className="pokedex-evolution-section">
            <h2 className="pokedex-section-title">
              <span className="pokedex-title-icon">🔄</span>
              Évolutions
            </h2>
            <EvolutionTree
              evolutionTree={evolutionTree}
              currentPokemonId={p.id}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FORMS SECTION (régionales et autres formes) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {p.forms && p.forms.filter(f => !f.isMega && !f.isGmax).length > 0 && (
          <div className="pokedex-forms-section">
            <h2 className="pokedex-section-title">
              <span className="pokedex-title-icon">🌍</span>
              Formes alternatives
            </h2>
            <PokemonForms forms={p.forms} pokemonName={p.name} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MOVES SECTION – TABBED */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {p.moves && p.moves.length > 0 && (
          <div className="pokedex-moves-section">
            <h2 className="pokedex-section-title">
              <span className="pokedex-title-icon">⚔️</span>
              Attaques
            </h2>
            <MovesList moves={p.moves} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* NATURES SECTION */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {p.natures && p.natures.length > 0 && (
          <div className="pokedex-natures-section">
            <h2 className="pokedex-section-title">
              <span className="pokedex-title-icon">🎯</span>
              Natures possibles
            </h2>
            <NaturesList natures={p.natures} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PERSONAL NOTES SECTION */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="pokedex-notes-section">
          <h2 className="pokedex-section-title">
            <span className="pokedex-title-icon">📝</span>
            Notes de Dresseur
          </h2>
          <PokemonNotes pokemonId={p.id} pokemonName={p.name} />
        </div>
      </div>
    </div>
  );
}
