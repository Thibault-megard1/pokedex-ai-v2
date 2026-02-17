/**
 * ============================================================================
 * MOVE COVERAGE TOOL - Tool d'analyse de couverture des attaques
 * ============================================================================
 * 
 * OBJECTIF:
 * Ce tool analyse les ATTAQUES (moves) disponibles dans l'équipe pour
 * maximiser la COUVERTURE OFFENSIVE. Une bonne couverture signifie pouvoir
 * infliger des dégâts SUPER EFFICACES contre un maximum de types adverses.
 * 
 * DIFFÉRENCE AVEC TypeEffectivenessTool:
 * - TypeEffectivenessTool: analyse les TYPES des Pokémon (défensif + offensif)
 * - MoveCoverageTool: analyse les MOVES spécifiques (offensif pur)
 * 
 * ============================================================================
 * CONCEPTS CLÉS
 * ============================================================================
 * 
 * 1. **STAB (Same Type Attack Bonus)** ⭐
 *    - Définition: Bonus de ×1.5 quand type du move = type du Pokémon
 *    - Exemple:
 *      * Charizard (Feu/Vol) utilise Flamethrower (Feu)
 *      * Dégâts: 90 power × 1.5 STAB = 135 effective power
 *    - Importance: STAB moves sont généralement les plus puissants
 *    - Stratégie: Toujours avoir au moins 1-2 STAB moves par Pokémon
 * 
 * 2. **COVERAGE MOVES** (Moves de couverture) 🔮
 *    - Définition: Moves d'un type DIFFÉRENT du Pokémon
 *    - Objectif: Couvrir les types qui résistent aux STAB moves
 *    - Exemple:
 *      * Garchocho (Dragon/Sol)
 *      * STAB: Earthquake (Sol), Outrage (Dragon)
 *      * Problème: Steel résiste aux deux!
 *      * Solution: Fire Fang (Feu) pour coverage vs Steel
 * 
 * 3. **TYPES PROBLÉMATIQUES** (Difficult to cover) ⚠️
 *    - Certains types défensifs sont DIFFICILES à hit super efficacement:
 *      * **Steel**: Résiste à 11 types! (le plus tanky)
 *        Solution: Fire, Fighting, Ground
 *      * **Fairy**: Immunisé Dragon, résiste Fighting
 *        Solution: Steel, Poison
 *      * **Water**: Bon bulk + peu de faiblesses
 *        Solution: Electric, Grass
 *      * **Dragon**: Résiste Feu/Eau/Plante/Électrique
 *        Solution: Ice, Fairy, Dragon
 *      * **Ghost**: Immunisé Normal/Fighting
 *        Solution: Ghost, Dark
 * 
 * 4. **COVERAGE TRIOS** (BoltBeam, EdgeQuake, etc.) 💥
 *    - Combinaisons classiques de 2-3 moves pour couverture maximale:
 *    
 *    **BoltBeam** (Thunderbolt + Ice Beam):
 *    - Couvre: Eau, Sol, Vol, Plante, Dragon
 *    - Utilisé par: Starmie, Tapu Koko, Magnezone
 *    - Presque rien ne résiste aux deux
 *    
 *    **EdgeQuake** (Stone Edge + Earthquake):
 *    - Couvre: Feu, Électrique, Poison, Roche, Acier, Vol
 *    - Utilisé par: Garchocho, Landorus-T, Terrakion
 *    - Physique equivalent du BoltBeam
 *    
 *    **FightingGhost** (Close Combat + Shadow Ball):
 *    - Fighting hit: Normal, Steel, Rock, Dark, Ice
 *    - Ghost hit: Ghost, Psychic
 *    - Utilisé par: Marshadow, Lucario
 *    
 *    **FairyFighting** (Moonblast + Close Combat):
 *    - Couvre: Dragon, Dark, Normal, Steel, Rock
 *    - Utilisé par: Clefable, Tapu Bulu
 * 
 * ============================================================================
 * MOVESET OPTIMAL (4 MOVES PAR POKÉMON)
 * ============================================================================
 * 
 * Règle générale pour choisir 4 moves:
 * 
 * **Slot 1-2: STAB MOVES** (Same Type Attack Bonus)
 * - Utiliser les attaques du même type que le Pokémon
 * - Exemple pour Garchocho:
 *   * Earthquake (STAB Sol)
 *   * Outrage ou Dragon Claw (STAB Dragon)
 * 
 * **Slot 3: COVERAGE MOVE**
 * - Couvrir les types qui résistent aux STAB
 * - Exemple pour Garchocho:
 *   * Fire Fang (contre Steel qui résiste Sol + Dragon)
 * 
 * **Slot 4: UTILITY ou SETUP**
 * - Option A: Setup move (Swords Dance, Nasty Plot)
 * - Option B: Priority move (Extreme Speed, Aqua Jet)
 * - Option C: Status move (Will-O-Wisp, Thunder Wave)
 * - Option D: Deuxième coverage move
 * 
 * ============================================================================
 * EXEMPLES DE MOVESETS COMPÉTITIFS
 * ============================================================================
 * 
 * **Garchocho (Dragon/Sol):**
 * - Earthquake (STAB Sol)
 * - Outrage (STAB Dragon)
 * - Fire Fang (coverage vs Steel)
 * - Swords Dance (setup)
 * 
 * **Alakazam (Psy):**
 * - Psychic (STAB)
 * - Focus Blast (coverage vs Steel/Dark qui résistent Psy)
 * - Shadow Ball (coverage vs Ghost/Psy)
 * - Energy Ball ou Dazzling Gleam (coverage vs Dark)
 * 
 * **Ferrothorn (Plante/Acier):**
 * - Gyro Ball (STAB Acier, bénéficie de sa lenteur)
 * - Power Whip (STAB Plante)
 * - Leech Seed (utility)
 * - Stealth Rock (hazard) ou Knock Off (utility)
 * 
 * **Dragonite (Dragon/Vol):**
 * - Dragon Dance (setup)
 * - Outrage (STAB Dragon)
 * - Extreme Speed (priority, coverage vs Fairy)
 * - Earthquake (coverage vs Steel/Electric)
 * 
 * ============================================================================
 * STRATÉGIES DE COUVERTURE
 * ============================================================================
 * 
 * 1. **"6-MOVE" STRATEGY**
 *    - Chaque Pokémon a 4 moves
 *    - 6 Pokémon × 4 moves = 24 moves total
 *    - OBJECTIF: Couvrir LES 18 TYPES avec ces 24 moves
 *    - Réalité: Besoin d'au moins 10-12 types DIFFÉRENTS
 * 
 * 2. **PRIORITY TARGETS** (Cibles prioritaires)
 *    - Assurer qu'on peut hit SUPER EFFICACEMENT:
 *      * Steel (Fire, Fighting, Ground)
 *      * Fairy (Steel, Poison)
 *      * Dragon (Ice, Fairy, Dragon)
 *      * Water (Electric, Grass)
 * 
 * 3. **NO DEAD WEIGHT** (Pas de move inutile)
 *    - Éviter les moves redondants
 *    - Exemple MAUVAIS: Garchocho avec Earthquake + Bulldoze
 *      * Les deux sont Sol, redondant!
 *      * Mieux: Earthquake + Fire Fang
 * 
 * ============================================================================
 * LIMITATIONS DU TOOL
 * ============================================================================
 * 
 * IMPORTANT: Dans le contexte actuel, ce tool utilise les TYPES des Pokémon
 * comme PROXY (approximation) des moves réels.
 * 
 * POURQUOI?
 * - Les données complètes de moves ne sont pas toujours disponibles
 * - Charger tous les moves de tous les Pokémon serait très lent
 * - Les types donnent une bonne ESTIMATION de la couverture
 * 
 * ASSUMPTION:
 * - Un Pokémon Feu aura probablement des moves Feu (STAB)
 * - Un Pokémon Dragon/Sol aura probablement Earthquake + Dragon move
 * 
 * FUTURE IMPROVEMENT:
 * - Intégrer l'API PokeAPI pour récupérer les moves réels
 * - Analyser les movesets populaires (Smogon data)
 * - Permettre à l'utilisateur de choisir les moves
 * 
 * ============================================================================
 * ALGORITHME DE SCORING
 * ============================================================================
 * 
 * BONUS:
 * - +20 points: Ajoute un nouveau type STAB
 * - +50 points: Couvre un type PROBLÉMATIQUE (Steel, Fairy, Water)
 * - +30 points: Réduit les "types mal couverts" (uncovered types)
 * - +15 points: Pokémon DUAL-TYPE (plus de flexibilité)
 * 
 * PÉNALITÉS:
 * - -25 points: Type REDONDANT (déjà 3+ dans l'équipe)
 * - -15 points: N'apporte aucune nouvelle couverture
 * ============================================================================
 */

import { Pokemon } from "./TypeEffectivenessTool";
import { calculateDefensiveMultiplier } from "@/lib/typeRelations";

export interface Move {
  name: string;
  type: string;
  learnMethod: string;
  levelLearnedAt?: number;
}

export interface MoveCoverage {
  stab: Set<string>; // Types avec STAB (Same Type Attack Bonus)
  coverage: Set<string>; // Types couverts par les attaques
  superEffectiveAgainst: Set<string>; // Types contre lesquels l'équipe est super efficace
  poorCoverageAgainst: Set<string>; // Types mal couverts
  uniqueMoveTypes: number; // Diversité des types d'attaques
}

export class MoveCoverageTool {
  /**
   * Tous les types Pokémon
   */
  private readonly ALL_TYPES = [
    "normal", "fire", "water", "grass", "electric", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ];

  /**
   * Extract moves from Pokemon data (si disponible)
   * Note: Dans le contexte actuel, les moves peuvent ne pas être disponibles
   * dans les données minimales. Cette méthode est préparée pour le futur.
   */
  extractMoves(pokemon: any): Move[] {
    if (!pokemon.moves || !Array.isArray(pokemon.moves)) {
      return [];
    }
    return pokemon.moves as Move[];
  }

  /**
   * Analyse la couverture des attaques d'une équipe
   * Utilise les types des Pokémon comme proxy si les moves ne sont pas disponibles
   */
  analyzeMoveCoverage(team: Pokemon[]): MoveCoverage {
    const stab = new Set<string>();
    const coverage = new Set<string>();
    const superEffectiveMap = new Map<string, number>();

    team.forEach(pokemon => {
      // Les types du Pokémon donnent du STAB
      pokemon.types.forEach(type => {
        stab.add(type);
        coverage.add(type);
      });

      // Analyser contre quels types ces attaques sont efficaces
      pokemon.types.forEach(attackType => {
        this.ALL_TYPES.forEach(defenderType => {
          const effectiveness = this.getOffensiveEffectiveness(attackType, defenderType);
          if (effectiveness >= 2) {
            superEffectiveMap.set(
              defenderType,
              (superEffectiveMap.get(defenderType) || 0) + 1
            );
          }
        });
      });
    });

    // Identifier les types mal couverts (pas super efficace)
    const poorCoverageAgainst = new Set<string>();
    this.ALL_TYPES.forEach(defenderType => {
      if (!superEffectiveMap.has(defenderType) || superEffectiveMap.get(defenderType)! < 1) {
        poorCoverageAgainst.add(defenderType);
      }
    });

    const superEffectiveAgainst = new Set(superEffectiveMap.keys());

    return {
      stab,
      coverage,
      superEffectiveAgainst,
      poorCoverageAgainst,
      uniqueMoveTypes: coverage.size
    };
  }

  /**
   * Calcule l'efficacité offensive d'un type contre un autre
   */
  private getOffensiveEffectiveness(attackType: string, defenderType: string): number {
    return calculateDefensiveMultiplier(attackType, [defenderType]);
  }

  /**
   * Score un Pokémon candidat basé sur sa couverture d'attaques
   */
  scorePokemonMoveCoverage(
    candidate: Pokemon,
    teamCoverage: MoveCoverage
  ): { score: number; details: string[] } {
    let score = 60; // Base neutre positive
    const details: string[] = [];

    // Analyser les types du candidat comme proxy des moves
    const candidateStab = new Set(candidate.types);
    const newCoverageTypes: string[] = [];
    const improvesAgainst: string[] = [];

    // +20 points par nouveau type STAB ajouté
    candidateStab.forEach(type => {
      if (!teamCoverage.stab.has(type)) {
        score += 20;
        newCoverageTypes.push(type);
      }
    });

    if (newCoverageTypes.length > 0) {
      details.push(`⚔️ Nouveaux types STAB: ${newCoverageTypes.join(", ")}`);
    }

    // +25 points par type mal couvert que le candidat améliore (PRIORITÉ!)
    candidate.types.forEach(attackType => {
      teamCoverage.poorCoverageAgainst.forEach(poorType => {
        const effectiveness = this.getOffensiveEffectiveness(attackType, poorType);
        if (effectiveness >= 2 && improvesAgainst.length < 5) {
          score += 25;
          improvesAgainst.push(poorType);
        }
      });
    });

    if (improvesAgainst.length > 0) {
      details.push(`✅ Couvre faiblesses: ${improvesAgainst.slice(0, 3).join(", ")}`);
    }

    // +10 si le candidat a un dual-type (plus de flexibilité)
    if (candidate.types.length === 2) {
      score += 10;
      details.push(`🔀 Dual-type (couverture améliorée)`);
    }

    // Bonus pour couverture de types problématiques
    const problematicTypes = ["steel", "fairy", "water", "dragon"];
    let coversProblematic = false;
    
    candidate.types.forEach(atkType => {
      problematicTypes.forEach(probType => {
        if (teamCoverage.poorCoverageAgainst.has(probType)) {
          const eff = this.getOffensiveEffectiveness(atkType, probType);
          if (eff >= 2 && !coversProblematic) {
            score += 15;
            coversProblematic = true;
          }
        }
      });
    });

    if (coversProblematic) {
      details.push(`🎯 Couvre types problématiques (Steel/Fairy/etc.)`);
    }

    return { score: Math.max(40, Math.min(100, Math.round(score))), details };
  }

  /**
   * Calcule un score de couverture offensive (0-100)
   * ADAPTÉ pour petites équipes - ne pénalise pas le manque de couverture
   */
  calculateOffensiveCoverageScore(coverage: MoveCoverage, teamSize: number): number {
    // NOUVEAU: Base dynamique selon taille (petite équipe = score de base plus élevé)
    const baseScore = teamSize <= 1 ? 60 : teamSize <= 2 ? 50 : teamSize <= 4 ? 40 : 30;
    
    // Couverture normalisée par taille attendue
    const expectedCoverage = Math.min(teamSize * 3, 12); // Max 12 types attendus pour une équipe complète
    const actualCoverage = coverage.superEffectiveAgainst.size;
    const coverageRatio = Math.min(1, actualCoverage / expectedCoverage);
    
    // Diversité normalisée
    const expectedDiversity = Math.min(teamSize * 2, 8);
    const diversityRatio = Math.min(1, coverage.uniqueMoveTypes / expectedDiversity);
    
    // Pénalité RÉDUITE pour mauvaise couverture (proportionnelle à la taille)
    const penaltyFactor = teamSize <= 2 ? 0.3 : teamSize <= 4 ? 0.5 : 0.8;
    const poorCoveragePenalty = penaltyFactor * coverage.poorCoverageAgainst.size;

    const score = baseScore +
      (coverageRatio * 25) + // Jusqu'à +25 pour bonne couverture proportionnelle
      (diversityRatio * 15) - // Jusqu'à +15 pour diversité
      poorCoveragePenalty;   // Pénalité réduite

    return Math.round(Math.min(100, Math.max(40, score))); // Minimum 40
  }

  /**
   * Identifie les types que l'équipe peine à contrer
   */
  identifyProblemTypes(coverage: MoveCoverage): string[] {
    // Types vraiment problématiques = pas de super efficacité ET communs en métagame
    const commonThreats = ["steel", "fairy", "water", "dragon", "ghost"];
    
    return commonThreats.filter(type => 
      coverage.poorCoverageAgainst.has(type)
    );
  }

  /**
   * Recommande des types d'attaques à ajouter
   */
  recommendMoveTypes(coverage: MoveCoverage): string[] {
    const recommendations: string[] = [];

    const problemTypes = this.identifyProblemTypes(coverage);
    
    if (problemTypes.includes("steel")) {
      recommendations.push("Ajouter des attaques Feu, Combat ou Sol");
    }
    if (problemTypes.includes("fairy")) {
      recommendations.push("Ajouter des attaques Poison ou Acier");
    }
    if (problemTypes.includes("water")) {
      recommendations.push("Ajouter des attaques Électrik ou Plante");
    }
    if (problemTypes.includes("dragon")) {
      recommendations.push("Ajouter des attaques Glace, Dragon ou Fée");
    }

    if (coverage.uniqueMoveTypes < 6) {
      recommendations.push("Diversifier les types d'attaques");
    }

    return recommendations;
  }

  /**
   * Génère un rapport de couverture
   */
  generateCoverageReport(coverage: MoveCoverage, teamSize: number): string {
    const report: string[] = [];
    
    report.push("=== COUVERTURE OFFENSIVE ===");
    report.push(`Types STAB: ${coverage.stab.size} (${Array.from(coverage.stab).join(", ")})`);
    report.push(`Types couverts: ${coverage.superEffectiveAgainst.size}/${this.ALL_TYPES.length}`);
    report.push(`Types mal couverts: ${coverage.poorCoverageAgainst.size}`);
    
    const score = this.calculateOffensiveCoverageScore(coverage, teamSize);
    report.push(`\nScore de couverture: ${score}/100`);
    
    const problemTypes = this.identifyProblemTypes(coverage);
    if (problemTypes.length > 0) {
      report.push(`\nTypes problématiques: ${problemTypes.join(", ")}`);
    }

    return report.join("\n");
  }
}
