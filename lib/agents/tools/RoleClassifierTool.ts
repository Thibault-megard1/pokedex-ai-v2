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
   * ADAPTÉ pour ne pas pénaliser les équipes incomplètes
   */
  private calculateRoleBalance(
    roles: Map<StrategicRole, number>,
    teamSize: number
  ): number {
    // NOUVEAU: Pour petites équipes, base plus élevée
    // (on ne peut pas avoir tous les rôles avec 1-2 Pokémon)
    let score = teamSize <= 2 ? 70 : teamSize <= 4 ? 60 : 50;

    // Comptage des rôles présents
    const presentRoles = this.ESSENTIAL_ROLES.filter(r => roles.has(r) && roles.get(r)! > 0);
    const presentCount = presentRoles.length;

    // Rôles essentiels attendus selon taille
    const expectedRoles = Math.min(teamSize, 3); // Max 3 rôles essentiels

    // +20 si on a TOUS les rôles attendus pour cette taille
    if (presentCount >= expectedRoles) {
      score += 20;
    } else if (presentCount > 0) {
      // Bonus proportionnel aux rôles présents (pas de pénalité)
      score += (presentCount / expectedRoles) * 15;
    }

    // Bonus pour rôles additionnels (pas pénalité si manquants)
    if (roles.has("revenge-killer")) score += 10;
    if (roles.has("pivot")) score += 8;

    // Pénalité seulement pour vraie surcharge (3+ du même rôle)
    roles.forEach(count => {
      if (count >= 3) score -= 10;
    });

    // Bonus diversité pour grandes équipes
    if (teamSize >= 5 && roles.size >= 4) score += 5;

    return Math.min(100, Math.max(40, score)); // Minimum 40
  }

  /**
   * Score un Pokémon candidat basé sur la distribution des rôles
   */
  scorePokemonRoleContribution(
    candidate: Pokemon,
    distribution: TeamRoleDistribution
  ): { score: number; details: string[] } {
    let score = 55; // Base neutre positive
    const details: string[] = [];

    const candidateRole = this.classifyStrategicRole(candidate);

    // +45 si le candidat remplit un rôle essentiel manquant (PRIORITÉ!)
    if (distribution.missingRoles.includes(candidateRole)) {
      score += 45;
      details.push(`🎯 Rôle ESSENTIEL manquant: ${candidateRole}`);
    }

    // +25 si le candidat ajoute de la diversité
    else if (!distribution.roles.has(candidateRole) || distribution.roles.get(candidateRole) === 0) {
      score += 25;
      details.push(`✨ Nouveau rôle: ${candidateRole}`);
    }

    // -15 si le rôle est déjà surchargé (pénalité réduite)
    else if (distribution.overloadedRoles.includes(candidateRole)) {
      score -= 15;
      details.push(`⚠️ Rôle surchargé: ${candidateRole}`);
    }

    // +12 pour les rôles versatiles
    if (candidateRole === "balanced" || candidateRole === "pivot") {
      score += 12;
      details.push(`🔄 Rôle polyvalent`);
    }

    // Bonus spéciaux pour rôles stratégiques
    if (candidateRole === "revenge-killer" && !distribution.roles.has("revenge-killer")) {
      score += 20;
      details.push(`⚡ Finisseur rapide (revenge killer)`);
    }

    if (candidateRole === "wallbreaker" && !distribution.roles.has("wallbreaker")) {
      score += 18;
      details.push(`💥 Brise-mur puissant`);
    }

    return { score: Math.max(30, Math.min(100, Math.round(score))), details };
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
