/**
 * Type Analysis Tool
 * 
 * Outil pour analyser les relations de type dans une équipe.
 * - Faiblesses de l'équipe
 * - Résistances de l'équipe
 * - Couverture offensive
 */

import {
  Pokemon,
  getTypeEffectiveness,
  analyzeTeamWeaknesses,
  analyzeTeamResistances,
  ALL_TYPES
} from "../shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface TypeAnalysisResult {
  weaknesses: string[];
  resistances: string[];
  immunities: string[];
  coverage: string[];
  uncoveredTypes: string[];
  score: number;
}

export interface TypeMatchupResult {
  effectiveness: number;
  isWeakness: boolean;
  isResistance: boolean;
  isImmunity: boolean;
}

// ============================================================================
// TYPE ANALYSIS TOOL
// ============================================================================

export class TypeAnalysisTool {
  /**
   * Analyse complète des types d'une équipe
   */
  analyzeTeam(team: Pokemon[]): TypeAnalysisResult {
    const weaknesses = analyzeTeamWeaknesses(team);
    const resistances = analyzeTeamResistances(team);
    
    // Calculer les immunités
    const immunities: string[] = [];
    for (const type of ALL_TYPES) {
      const isImmune = team.some(pokemon => {
        return getTypeEffectiveness(type, pokemon.types) === 0;
      });
      if (isImmune) immunities.push(type);
    }
    
    // Calculer la couverture offensive
    const coverage = this.calculateOffensiveCoverage(team);
    const uncoveredTypes = ALL_TYPES.filter(t => 
      !coverage.some(c => getTypeEffectiveness(c, [t]) > 1)
    );
    
    // Score global (0-100)
    let score = 100;
    score -= weaknesses.length * 8;
    score += resistances.length * 3;
    score += immunities.length * 5;
    score -= uncoveredTypes.length * 5;
    score = Math.max(0, Math.min(100, score));
    
    return {
      weaknesses,
      resistances,
      immunities,
      coverage,
      uncoveredTypes,
      score
    };
  }

  /**
   * Calcule la couverture offensive de l'équipe
   */
  calculateOffensiveCoverage(team: Pokemon[]): string[] {
    const coveredTypes = new Set<string>();
    
    for (const pokemon of team) {
      for (const attackType of pokemon.types) {
        for (const defenseType of ALL_TYPES) {
          if (getTypeEffectiveness(attackType, [defenseType]) > 1) {
            coveredTypes.add(defenseType);
          }
        }
      }
    }
    
    return Array.from(coveredTypes);
  }

  /**
   * Analyse le matchup entre deux types
   */
  analyzeMatchup(attackType: string, defenseTypes: string[]): TypeMatchupResult {
    const effectiveness = getTypeEffectiveness(attackType, defenseTypes);
    
    return {
      effectiveness,
      isWeakness: effectiveness > 1,
      isResistance: effectiveness > 0 && effectiveness < 1,
      isImmunity: effectiveness === 0
    };
  }

  /**
   * Trouve les types qui amélioreraient l'équipe
   */
  findBeneficialTypes(team: Pokemon[]): string[] {
    const analysis = this.analyzeTeam(team);
    const beneficialTypes: string[] = [];
    
    // Types qui résistent aux faiblesses de l'équipe
    for (const weakness of analysis.weaknesses) {
      for (const type of ALL_TYPES) {
        if (getTypeEffectiveness(weakness, [type]) < 1) {
          if (!beneficialTypes.includes(type)) {
            beneficialTypes.push(type);
          }
        }
      }
    }
    
    return beneficialTypes.slice(0, 5); // Top 5
  }

  /**
   * Évalue l'ajout d'un Pokémon à l'équipe
   */
  evaluateAddition(team: Pokemon[], candidate: Pokemon): {
    improvement: number;
    reasoning: string[];
  } {
    const beforeAnalysis = this.analyzeTeam(team);
    const afterAnalysis = this.analyzeTeam([...team, candidate]);
    
    const improvement = afterAnalysis.score - beforeAnalysis.score;
    const reasoning: string[] = [];
    
    // Nouvelles résistances
    const newResistances = afterAnalysis.resistances.filter(
      r => !beforeAnalysis.resistances.includes(r)
    );
    if (newResistances.length > 0) {
      reasoning.push(`Ajoute résistances: ${newResistances.join(", ")}`);
    }
    
    // Nouvelles couvertures
    const newCoverage = afterAnalysis.coverage.filter(
      c => !beforeAnalysis.coverage.includes(c)
    );
    if (newCoverage.length > 0) {
      reasoning.push(`Améliore couverture: ${newCoverage.join(", ")}`);
    }
    
    // Faiblesses réduites
    const reducedWeaknesses = beforeAnalysis.weaknesses.filter(
      w => !afterAnalysis.weaknesses.includes(w)
    );
    if (reducedWeaknesses.length > 0) {
      reasoning.push(`Réduit faiblesses: ${reducedWeaknesses.join(", ")}`);
    }
    
    return { improvement, reasoning };
  }
}

export default TypeAnalysisTool;
