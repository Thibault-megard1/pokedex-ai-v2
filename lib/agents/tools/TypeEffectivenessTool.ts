/**
 * Type Effectiveness Tool
 * 
 * Calcule les relations de types, faiblesses, résistances et couverture offensive.
 */

import { calculateDefensiveMultiplier, getTypeRelations } from "@/lib/typeRelations";

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats?: { name: string; value: number }[];
}

export interface TypeCoverage {
  weaknesses: Map<string, number>; // Type -> multiplicateur cumulé
  resistances: Map<string, number>; // Type -> nombre de résistances
  immunities: Set<string>; // Types immunisés
  offensiveCoverage: Set<string>; // Types couverts offensivement
  uncoveredTypes: string[]; // Types non couverts
}

const ALL_TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

export class TypeEffectivenessTool {
  /**
   * Analyse la couverture de types d'une équipe
   */
  analyzeTeamTypes(team: Pokemon[]): TypeCoverage {
    const weaknesses = new Map<string, number>();
    const resistances = new Map<string, number>();
    const immunities = new Set<string>();
    const offensiveCoverage = new Set<string>();

    team.forEach(pokemon => {
      // Ajouter les types pour la couverture offensive
      pokemon.types.forEach(type => offensiveCoverage.add(type));

      // Calculer les relations défensives
      const relations = getTypeRelations(pokemon.types);

      // Agréger les faiblesses (pondérées par multiplicateur)
      relations.weakTo.forEach(type => {
        const mult = calculateDefensiveMultiplier(type, pokemon.types);
        weaknesses.set(type, (weaknesses.get(type) || 0) + mult);
      });

      // Agréger les résistances
      relations.resistantTo.forEach(type => {
        resistances.set(type, (resistances.get(type) || 0) + 1);
      });

      // Agréger les immunités
      relations.immuneTo.forEach(type => immunities.add(type));
    });

    // Identifier les types non couverts
    const uncoveredTypes = ALL_TYPES.filter(type => !offensiveCoverage.has(type));

    return {
      weaknesses,
      resistances,
      immunities,
      offensiveCoverage,
      uncoveredTypes
    };
  }

  /**
   * Score un Pokémon candidat basé sur la couverture de types
   * REFACTORISÉ: Bonus ÉNORMES pour couvrir les faiblesses d'équipe
   */
  scorePokemonTypeContribution(
    candidate: Pokemon,
    currentCoverage: TypeCoverage
  ): { score: number; details: string[] } {
    let score = 40; // Base RÉDUITE pour laisser place aux bonus
    const details: string[] = [];

    const candidateRelations = getTypeRelations(candidate.types);

    // +60 points par IMMUNITÉ à une faiblesse d'équipe (ÉNORME!)
    candidateRelations.immuneTo.forEach(immuneType => {
      if (currentCoverage.weaknesses.has(immuneType)) {
        score += 60;
        details.push(`🛡️ IMMUNITÉ contre ${immuneType} (faiblesse d'équipe!)`);
      }
    });

    // +45 points par faiblesse critique couverte (x4)
    candidateRelations.resistantTo.forEach(resistType => {
      const weaknessLevel = currentCoverage.weaknesses.get(resistType) || 0;
      if (weaknessLevel >= 4) {
        score += 45;
        details.push(`✅ Résiste à ${resistType} (faiblesse CRITIQUE x4)`);
      } else if (weaknessLevel >= 2) {
        score += 30;
        details.push(`✅ Résiste à ${resistType} (faiblesse x2)`);
      }
    });

    // +25 points par type non couvert ajouté
    candidate.types.forEach(type => {
      if (currentCoverage.uncoveredTypes.includes(type)) {
        score += 25;
        details.push(`⚡ Nouveau type offensif: ${type}`);
      }
    });

    // +20 points si le candidat est fort contre les faiblesses de l'équipe
    candidateRelations.strongAgainst.forEach(strongType => {
      if (currentCoverage.weaknesses.has(strongType)) {
        score += 20;
        details.push(`⚔️ Attaque super efficace contre ${strongType}`);
      }
    });

    // Pénalité progressive pour faiblesses TRÈS partagées (4+)
    let sharedWeaknesses = 0;
    candidateRelations.weakTo.forEach(weakType => {
      const currentWeakness = currentCoverage.weaknesses.get(weakType) || 0;
      if (currentWeakness > 0) {
        sharedWeaknesses++;
      }
    });
    
    if (sharedWeaknesses >= 4) {
      const penalty = (sharedWeaknesses - 3) * 12;
      score -= penalty;
      details.push(`⚠️ DANGER: Partage ${sharedWeaknesses} faiblesses`);
    }

    return { score: Math.max(15, Math.min(100, Math.round(score))), details };
  }

  /**
   * Identifie les faiblesses critiques de l'équipe
   */
  getCriticalWeaknesses(coverage: TypeCoverage): string[] {
    return Array.from(coverage.weaknesses.entries())
      .filter(([_, mult]) => mult >= 4) // x4 ou plus
      .map(([type]) => type);
  }

  /**
   * Calcule un score de couverture globale (0-100)
   * ADAPTÉ pour petites équipes (1-2 Pokémon)
   */
  calculateCoverageScore(coverage: TypeCoverage, teamSize: number = 1): number {
    // NOUVEAU: Base dynamique selon taille équipe
    // Petite équipe = score de base plus élevé (normal de ne pas tout couvrir)
    const baseScore = teamSize <= 1 ? 55 : teamSize <= 2 ? 50 : teamSize <= 4 ? 40 : 30;
    
    // Couverture normalisée par taille attendue
    const expectedCoverage = Math.min(teamSize * 2, 10); // Max 10 types attendus
    const actualCoverage = coverage.offensiveCoverage.size;
    const coverageRatio = Math.min(1, actualCoverage / expectedCoverage);
    
    const resistanceCount = coverage.resistances.size;
    const immunityCount = coverage.immunities.size;
    const weaknessCount = coverage.weaknesses.size;

    // Score = base + bonus - malus (mais malus réduits pour petites équipes)
    const weaknessPenaltyFactor = teamSize <= 2 ? 0.5 : teamSize <= 4 ? 0.75 : 1;
    
    const score = baseScore +
      (coverageRatio * 25) + // Jusqu'à +25 pour bonne couverture proportionnelle
      (resistanceCount * 2) + // +2 par résistance
      (immunityCount * 4) - // +4 par immunité
      (weaknessCount * weaknessPenaltyFactor); // Pénalité réduite pour petites équipes

    return Math.round(Math.min(100, Math.max(35, score))); // Minimum 35
  }
}
