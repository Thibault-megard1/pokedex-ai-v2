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
   */
  scorePokemonTypeContribution(
    candidate: Pokemon,
    currentCoverage: TypeCoverage
  ): { score: number; details: string[] } {
    let score = 0;
    const details: string[] = [];

    const candidateRelations = getTypeRelations(candidate.types);

    // +40 points par faiblesse critique couverte (x4)
    candidateRelations.resistantTo.forEach(resistType => {
      const weaknessLevel = currentCoverage.weaknesses.get(resistType) || 0;
      if (weaknessLevel >= 4) {
        score += 40;
        details.push(`✅ Résiste à ${resistType} (faiblesse critique de l'équipe)`);
      } else if (weaknessLevel >= 2) {
        score += 20;
        details.push(`✅ Résiste à ${resistType} (faiblesse de l'équipe)`);
      }
    });

    // +30 points par immunité à une faiblesse d'équipe
    candidateRelations.immuneTo.forEach(immuneType => {
      if (currentCoverage.weaknesses.has(immuneType)) {
        score += 30;
        details.push(`🛡️ Immunisé contre ${immuneType} (faiblesse d'équipe)`);
      }
    });

    // +15 points par type non couvert ajouté
    candidate.types.forEach(type => {
      if (currentCoverage.uncoveredTypes.includes(type)) {
        score += 15;
        details.push(`⚡ Ajoute le type ${type} (non couvert)`);
      }
    });

    // -25 points par nouvelle faiblesse créée
    candidateRelations.weakTo.forEach(weakType => {
      const currentWeakness = currentCoverage.weaknesses.get(weakType) || 0;
      if (currentWeakness > 0) {
        score -= 25;
        details.push(`⚠️ Partage la faiblesse ${weakType}`);
      }
    });

    // +10 points si le candidat est fort contre les faiblesses de l'équipe
    candidateRelations.strongAgainst.forEach(strongType => {
      if (currentCoverage.weaknesses.has(strongType)) {
        score += 10;
        details.push(`⚔️ Fort contre ${strongType} (faiblesse d'équipe)`);
      }
    });

    return { score, details };
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
   */
  calculateCoverageScore(coverage: TypeCoverage): number {
    const coverageRatio = coverage.offensiveCoverage.size / ALL_TYPES.length;
    const weaknessCount = coverage.weaknesses.size;
    const resistanceCount = coverage.resistances.size;
    const immunityCount = coverage.immunities.size;

    const score = Math.min(100, Math.max(0,
      (coverageRatio * 40) + // 40 points max pour la couverture
      (resistanceCount * 3) + // +3 par résistance
      (immunityCount * 5) - // +5 par immunité
      (weaknessCount * 2) // -2 par faiblesse
    ));

    return Math.round(score);
  }
}
