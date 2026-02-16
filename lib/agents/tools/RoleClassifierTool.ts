/**
 * Role Classifier Tool
 * 
 * Classifie et gère les rôles stratégiques dans l'équipe
 */

import { Pokemon } from "./TypeEffectivenessTool";
import { PokemonRole, StatsAnalyzerTool } from "./StatsAnalyzerTool";

export type StrategicRole = 
  | "lead"          // Pokémon de tête (setup, rocks, etc.)
  | "sweeper"       // Attaquant principal
  | "wallbreaker"   // Brise les murs défensifs
  | "tank"          // Encaisse les coups
  | "support"       // Support/healing
  | "pivot"         // Switch in/out
  | "revenge-killer" // Finisseur rapide
  | "balanced";     // Polyvalent

export interface TeamRoleDistribution {
  roles: Map<StrategicRole, number>; // Rôle -> nombre de Pokémon
  missingRoles: StrategicRole[];
  overloadedRoles: StrategicRole[];
  balanceScore: number; // 0-100
}

export class RoleClassifierTool {
  private statsAnalyzer = new StatsAnalyzerTool();

  /**
   * Rôles essentiels pour une équipe équilibrée
   */
  private readonly ESSENTIAL_ROLES: StrategicRole[] = [
    "sweeper",
    "tank",
    "support"
  ];

  /**
   * Détermine le rôle stratégique d'un Pokémon
   */
  classifyStrategicRole(pokemon: Pokemon): StrategicRole {
    const baseRole = this.statsAnalyzer.classifyPokemonRole(pokemon);

    // Mappage du rôle de base vers le rôle stratégique
    if (baseRole.primary === "sweeper") {
      if (baseRole.speedTier === "ultra-fast") {
        return "revenge-killer";
      }
      return "sweeper";
    }

    if (baseRole.primary === "pivot" && baseRole.speedTier === "fast") {
      return "pivot";
    }

    if (baseRole.primary === "wallbreaker") {
      return "wallbreaker";
    }

    if (baseRole.primary === "tank" || baseRole.bulk === "wall") {
      return "tank";
    }

    if (baseRole.primary === "support") {
      return "support";
    }

    return "balanced";
  }

  /**
   * Analyse la distribution des rôles dans l'équipe
   */
  analyzeRoleDistribution(team: Pokemon[]): TeamRoleDistribution {
    const roles = new Map<StrategicRole, number>();

    // Compter les rôles
    team.forEach(pokemon => {
      const role = this.classifyStrategicRole(pokemon);
      roles.set(role, (roles.get(role) || 0) + 1);
    });

    // Identifier les rôles manquants
    const missingRoles: StrategicRole[] = [];
    this.ESSENTIAL_ROLES.forEach(essentialRole => {
      if (!roles.has(essentialRole) || roles.get(essentialRole) === 0) {
        missingRoles.push(essentialRole);
      }
    });

    // Identifier les rôles surchargés (>2)
    const overloadedRoles: StrategicRole[] = [];
    roles.forEach((count, role) => {
      if (count > 2) {
        overloadedRoles.push(role);
      }
    });

    // Calculer le score d'équilibre
    const balanceScore = this.calculateRoleBalance(roles, team.length);

    return {
      roles,
      missingRoles,
      overloadedRoles,
      balanceScore
    };
  }

  /**
   * Calcule un score d'équilibre des rôles (0-100)
   */
  private calculateRoleBalance(
    roles: Map<StrategicRole, number>,
    teamSize: number
  ): number {
    let score = 50; // Score de base

    // +20 si tous les rôles essentiels sont présents
    const hasAllEssential = this.ESSENTIAL_ROLES.every(role => 
      roles.has(role) && roles.get(role)! > 0
    );
    if (hasAllEssential) {
      score += 20;
    } else {
      // -10 par rôle essentiel manquant
      score -= (3 - this.ESSENTIAL_ROLES.filter(r => roles.has(r)).length) * 10;
    }

    // +15 si au moins un revenge killer
    if (roles.has("revenge-killer")) {
      score += 15;
    }

    // +10 si au moins un pivot
    if (roles.has("pivot")) {
      score += 10;
    }

    // -15 par rôle surchargé
    roles.forEach(count => {
      if (count > 2) {
        score -= 15;
      }
    });

    // +5 si bonne diversité (4+ rôles différents pour une équipe de 6)
    if (teamSize >= 6 && roles.size >= 4) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score un Pokémon candidat basé sur la distribution des rôles
   */
  scorePokemonRoleContribution(
    candidate: Pokemon,
    distribution: TeamRoleDistribution
  ): { score: number; details: string[] } {
    let score = 0;
    const details: string[] = [];

    const candidateRole = this.classifyStrategicRole(candidate);

    // +50 si le candidat remplit un rôle essentiel manquant
    if (distribution.missingRoles.includes(candidateRole)) {
      score += 50;
      details.push(`🎯 Remplit le rôle manquant: ${candidateRole}`);
    }

    // +30 si le candidat ajoute de la diversité
    if (!distribution.roles.has(candidateRole) || distribution.roles.get(candidateRole) === 0) {
      score += 30;
      details.push(`✨ Ajoute un nouveau rôle: ${candidateRole}`);
    }

    // -20 si le rôle est déjà surchargé
    if (distribution.overloadedRoles.includes(candidateRole)) {
      score -= 20;
      details.push(`⚠️ Rôle déjà surchargé: ${candidateRole}`);
    }

    // +10 pour les rôles versatiles
    if (candidateRole === "balanced" || candidateRole === "pivot") {
      score += 10;
      details.push(`🔄 Rôle polyvalent`);
    }

    // Bonus spéciaux
    if (candidateRole === "revenge-killer" && !distribution.roles.has("revenge-killer")) {
      score += 25;
      details.push(`⚡ Ajoute un finisseur rapide`);
    }

    if (candidateRole === "wallbreaker" && !distribution.roles.has("wallbreaker")) {
      score += 20;
      details.push(`💥 Ajoute un brise-mur`);
    }

    return { score, details };
  }

  /**
   * Recommande les rôles à rechercher
   */
  recommendRoles(distribution: TeamRoleDistribution): string[] {
    const recommendations: string[] = [];

    // Priorité aux rôles essentiels manquants
    distribution.missingRoles.forEach(role => {
      recommendations.push(`Chercher un ${role}`);
    });

    // Si l'équipe est déséquilibrée
    if (distribution.balanceScore < 50) {
      recommendations.push("Diversifier les rôles stratégiques");
    }

    // Si pas de revenge killer
    if (!distribution.roles.has("revenge-killer")) {
      recommendations.push("Ajouter un revenge killer (Pokémon ultra-rapide)");
    }

    // Si trop de même rôle
    distribution.overloadedRoles.forEach(role => {
      recommendations.push(`Réduire le nombre de ${role}`);
    });

    return recommendations;
  }

  /**
   * Génère un rapport détaillé de la distribution
   */
  generateRoleReport(distribution: TeamRoleDistribution): string {
    const report: string[] = [];
    
    report.push("=== DISTRIBUTION DES RÔLES ===");
    distribution.roles.forEach((count, role) => {
      report.push(`${role}: ${count}`);
    });
    
    report.push(`\nScore d'équilibre: ${distribution.balanceScore}/100`);
    
    if (distribution.missingRoles.length > 0) {
      report.push(`\nRôles manquants: ${distribution.missingRoles.join(", ")}`);
    }
    
    if (distribution.overloadedRoles.length > 0) {
      report.push(`\nRôles surchargés: ${distribution.overloadedRoles.join(", ")}`);
    }

    return report.join("\n");
  }
}
