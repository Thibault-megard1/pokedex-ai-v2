/**
 * Role Classifier Tool
 * 
 * Outil pour classifier les rôles des Pokémon et analyser la distribution.
 */

import {
  Pokemon,
  PokemonRole,
  classifyRole,
  getStat,
  getTotalStats
} from "../shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface RoleDistribution {
  sweeper: number;
  wall: number;
  tank: number;
  support: number;
  pivot: number;
}

export interface RoleAnalysisResult {
  distribution: RoleDistribution;
  missingRoles: PokemonRole[];
  overloadedRoles: PokemonRole[];
  balance: number; // 0-100
  recommendations: string[];
}

export interface PokemonRoleInfo {
  pokemon: Pokemon;
  role: PokemonRole;
  confidence: number;
  alternateRoles: PokemonRole[];
}

// ============================================================================
// ROLE CLASSIFIER TOOL
// ============================================================================

export class RoleClassifierTool {
  /**
   * Classifie le rôle d'un Pokémon
   */
  classifyPokemon(pokemon: Pokemon): PokemonRoleInfo {
    const mainRole = classifyRole(pokemon);
    const alternateRoles = this.findAlternateRoles(pokemon, mainRole);
    const confidence = this.calculateRoleConfidence(pokemon, mainRole);
    
    return {
      pokemon,
      role: mainRole,
      confidence,
      alternateRoles
    };
  }

  /**
   * Analyse la distribution des rôles dans une équipe
   */
  analyzeTeamRoles(team: Pokemon[]): RoleAnalysisResult {
    const distribution: RoleDistribution = {
      sweeper: 0,
      wall: 0,
      tank: 0,
      support: 0,
      pivot: 0
    };
    
    // Compter les rôles
    for (const pokemon of team) {
      const role = classifyRole(pokemon);
      distribution[role]++;
    }
    
    // Identifier les rôles manquants et surchargés
    const missingRoles: PokemonRole[] = [];
    const overloadedRoles: PokemonRole[] = [];
    
    for (const [role, count] of Object.entries(distribution)) {
      if (count === 0) missingRoles.push(role as PokemonRole);
      if (count >= 3) overloadedRoles.push(role as PokemonRole);
    }
    
    // Calculer l'équilibre (plus c'est équilibré, plus le score est élevé)
    const values = Object.values(distribution);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const balance = Math.max(0, 100 - variance * 20);
    
    // Recommandations
    const recommendations: string[] = [];
    if (missingRoles.length > 0) {
      recommendations.push(`Rôles manquants: ${missingRoles.join(", ")}`);
    }
    if (overloadedRoles.length > 0) {
      recommendations.push(`Trop de ${overloadedRoles.join(", ")}`);
    }
    if (distribution.sweeper === 0) {
      recommendations.push("L'équipe manque de puissance offensive");
    }
    if (distribution.wall === 0 && distribution.tank === 0) {
      recommendations.push("L'équipe manque de défense");
    }
    
    return {
      distribution,
      missingRoles,
      overloadedRoles,
      balance,
      recommendations
    };
  }

  /**
   * Trouve les rôles alternatifs possibles
   */
  private findAlternateRoles(pokemon: Pokemon, mainRole: PokemonRole): PokemonRole[] {
    const alternates: PokemonRole[] = [];
    
    const atk = getStat(pokemon, "attack");
    const spAtk = getStat(pokemon, "special-attack");
    const def = getStat(pokemon, "defense");
    const spDef = getStat(pokemon, "special-defense");
    const hp = getStat(pokemon, "hp");
    const speed = getStat(pokemon, "speed");
    
    // Vérifier les rôles alternatifs basés sur les stats
    if (mainRole !== "sweeper" && (atk >= 90 || spAtk >= 90) && speed >= 80) {
      alternates.push("sweeper");
    }
    if (mainRole !== "wall" && (def >= 90 || spDef >= 90) && hp >= 80) {
      alternates.push("wall");
    }
    if (mainRole !== "tank" && hp >= 90 && (def >= 80 || spDef >= 80)) {
      alternates.push("tank");
    }
    if (mainRole !== "pivot" && speed >= 70 && (def >= 70 || spDef >= 70)) {
      alternates.push("pivot");
    }
    
    return alternates;
  }

  /**
   * Calcule la confiance dans la classification
   */
  private calculateRoleConfidence(pokemon: Pokemon, role: PokemonRole): number {
    const total = getTotalStats(pokemon);
    const atk = getStat(pokemon, "attack");
    const spAtk = getStat(pokemon, "special-attack");
    const def = getStat(pokemon, "defense");
    const spDef = getStat(pokemon, "special-defense");
    const hp = getStat(pokemon, "hp");
    const speed = getStat(pokemon, "speed");
    
    let confidence = 50; // Base
    
    switch (role) {
      case "sweeper":
        const offense = Math.max(atk, spAtk);
        if (offense >= 120) confidence += 30;
        else if (offense >= 100) confidence += 20;
        if (speed >= 100) confidence += 15;
        break;
        
      case "wall":
        if (def >= 100 || spDef >= 100) confidence += 25;
        if (def >= 120 || spDef >= 120) confidence += 15;
        if (hp >= 80) confidence += 10;
        break;
        
      case "tank":
        if (hp >= 100) confidence += 20;
        if ((def >= 80 && spDef >= 80)) confidence += 15;
        if (atk >= 80 || spAtk >= 80) confidence += 10;
        break;
        
      case "pivot":
        if (speed >= 90) confidence += 15;
        if (def >= 70 && spDef >= 70) confidence += 10;
        break;
        
      case "support":
        // Support est souvent un rôle par défaut
        if (total < 450) confidence += 10;
        break;
    }
    
    return Math.min(100, confidence);
  }

  /**
   * Trouve les Pokémon qui rempliraient un rôle manquant
   */
  findPokemonForRole(candidates: Pokemon[], targetRole: PokemonRole): Pokemon[] {
    return candidates
      .filter(p => classifyRole(p) === targetRole)
      .sort((a, b) => getTotalStats(b) - getTotalStats(a))
      .slice(0, 5);
  }
}

export default RoleClassifierTool;
