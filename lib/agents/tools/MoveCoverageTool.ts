/**
 * Move Coverage Tool
 * 
 * Analyse les attaques pour maximiser la couverture et éviter les doublons
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
    let score = 0;
    const details: string[] = [];

    // Analyser les types du candidat comme proxy des moves
    const candidateStab = new Set(candidate.types);
    const newCoverageTypes: string[] = [];
    const improvesAgainst: string[] = [];

    // +25 points par nouveau type STAB ajouté
    candidateStab.forEach(type => {
      if (!teamCoverage.stab.has(type)) {
        score += 25;
        newCoverageTypes.push(type);
      }
    });

    if (newCoverageTypes.length > 0) {
      details.push(`⚔️ Ajoute les types STAB: ${newCoverageTypes.join(", ")}`);
    }

    // +30 points par type mal couvert que le candidat améliore
    candidate.types.forEach(attackType => {
      teamCoverage.poorCoverageAgainst.forEach(poorType => {
        const effectiveness = this.getOffensiveEffectiveness(attackType, poorType);
        if (effectiveness >= 2) {
          score += 30;
          improvesAgainst.push(poorType);
        }
      });
    });

    if (improvesAgainst.length > 0) {
      details.push(`✅ Améliore la couverture contre: ${improvesAgainst.slice(0, 3).join(", ")}`);
    }

    // +15 si le candidat a un dual-type (plus de flexibilité)
    if (candidate.types.length === 2) {
      score += 15;
      details.push(`🔀 Double type (plus de flexibilité)`);
    }

    // Bonus pour couverture de types problématiques
    const problematicTypes = ["steel", "fairy", "water", "dragon"];
    let coversProblematic = false;
    
    candidate.types.forEach(atkType => {
      problematicTypes.forEach(probType => {
        if (teamCoverage.poorCoverageAgainst.has(probType)) {
          const eff = this.getOffensiveEffectiveness(atkType, probType);
          if (eff >= 2) {
            score += 20;
            coversProblematic = true;
          }
        }
      });
    });

    if (coversProblematic) {
      details.push(`🎯 Couvre des types problématiques`);
    }

    return { score, details };
  }

  /**
   * Calcule un score de couverture offensive (0-100)
   */
  calculateOffensiveCoverageScore(coverage: MoveCoverage, teamSize: number): number {
    const coverageRatio = coverage.superEffectiveAgainst.size / this.ALL_TYPES.length;
    const diversityRatio = coverage.uniqueMoveTypes / Math.min(teamSize * 2, 10);
    const poorCoverageRatio = coverage.poorCoverageAgainst.size / this.ALL_TYPES.length;

    const score = Math.min(100, Math.max(0,
      (coverageRatio * 50) + // 50 points max pour la couverture
      (diversityRatio * 30) - // 30 points max pour la diversité
      (poorCoverageRatio * 30) // -30 points pour les faiblesses de couverture
    ));

    return Math.round(score);
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
