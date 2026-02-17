/**
 * LangChain Tools - Team Building
 * 
 * Outils LangChain pour l'analyse et la construction d'équipes Pokémon.
 * Utilise le pattern @tool de LangChain avec ChatMistralAI.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  Pokemon,
  getTypeEffectiveness,
  analyzeTeamWeaknesses,
  analyzeTeamResistances,
  ALL_TYPES,
  getTotalStats,
  classifyRole,
  PokemonRole
} from "../shared/types";

// ============================================================================
// SCHEMAS ZOD POUR VALIDATION
// ============================================================================

const PokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  types: z.array(z.string()),
  stats: z.array(z.object({
    name: z.string(),
    value: z.number()
  })).optional()
});

const TeamSchema = z.array(PokemonSchema);

// ============================================================================
// TYPE ANALYSIS TOOL
// ============================================================================

/**
 * Analyse les types d'une équipe Pokémon
 * Retourne les faiblesses, résistances, immunités et couverture
 */
export const typeAnalysisTool = tool(
  async (input: { team: z.infer<typeof TeamSchema> }) => {
    const { team } = input;
    
    // Analyse des faiblesses
    const weaknesses = analyzeTeamWeaknesses(team as Pokemon[]);
    
    // Analyse des résistances
    const resistances = analyzeTeamResistances(team as Pokemon[]);
    
    // Calculer les immunités
    const immunities: string[] = [];
    for (const type of ALL_TYPES) {
      const isImmune = team.some(pokemon => {
        return getTypeEffectiveness(type, pokemon.types) === 0;
      });
      if (isImmune) immunities.push(type);
    }
    
    // Couverture offensive
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
    
    const uncoveredTypes = ALL_TYPES.filter(t => !coveredTypes.has(t));
    
    // Calcul du score
    let score = 100;
    score -= weaknesses.length * 8;
    score += resistances.length * 3;
    score += immunities.length * 5;
    score -= uncoveredTypes.length * 5;
    score = Math.max(0, Math.min(100, score));
    
    return JSON.stringify({
      weaknesses,
      resistances,
      immunities,
      coverage: Array.from(coveredTypes),
      uncoveredTypes,
      score
    });
  },
  {
    name: "type_analysis",
    description: "Analyse les types d'une équipe Pokémon. Retourne les faiblesses, résistances, immunités et la couverture offensive de l'équipe.",
    schema: z.object({
      team: TeamSchema.describe("L'équipe de Pokémon à analyser")
    })
  }
);

// ============================================================================
// ROLE CLASSIFIER TOOL
// ============================================================================

/**
 * Classifie le rôle de chaque Pokémon dans l'équipe
 */
export const roleClassifierTool = tool(
  async (input: { team: z.infer<typeof TeamSchema> }) => {
    const { team } = input;
    
    const roles: Record<string, PokemonRole> = {};
    const roleDistribution: Record<PokemonRole, number> = {
      sweeper: 0,
      wall: 0,
      tank: 0,
      pivot: 0,
      support: 0
    };
    
    for (const pokemon of team) {
      const role = classifyRole(pokemon as Pokemon);
      roles[pokemon.name] = role;
      roleDistribution[role]++;
    }
    
    // Analyse de l'équilibre
    const isBalanced = Object.values(roleDistribution).filter(v => v > 0).length >= 3;
    const hasOffense = roleDistribution.sweeper >= 1;
    const hasDefense = roleDistribution.wall >= 1 || roleDistribution.tank >= 1;
    
    return JSON.stringify({
      roles,
      distribution: roleDistribution,
      isBalanced,
      hasOffense,
      hasDefense,
      recommendations: !isBalanced 
        ? ["L'équipe manque de diversité de rôles"] 
        : []
    });
  },
  {
    name: "role_classifier",
    description: "Classifie le rôle de chaque Pokémon (sweeper, wall, tank, pivot, support, utility) et analyse l'équilibre de l'équipe.",
    schema: z.object({
      team: TeamSchema.describe("L'équipe de Pokémon à classifier")
    })
  }
);

// ============================================================================
// SYNERGY ANALYSIS TOOL
// ============================================================================

/**
 * Analyse la synergie entre les Pokémon de l'équipe
 */
export const synergyTool = tool(
  async (input: { team: z.infer<typeof TeamSchema> }) => {
    const { team } = input;
    
    let synergyScore = 100;
    const issues: string[] = [];
    const strengths: string[] = [];
    
    // Vérifier les doublons de type
    const typeCount: Record<string, number> = {};
    for (const pokemon of team) {
      for (const type of pokemon.types) {
        typeCount[type] = (typeCount[type] || 0) + 1;
      }
    }
    
    for (const [type, count] of Object.entries(typeCount)) {
      if (count > 2) {
        synergyScore -= 15;
        issues.push(`Trop de Pokémon ${type} (${count})`);
      } else if (count === 2) {
        synergyScore -= 5;
      }
    }
    
    // Vérifier les faiblesses partagées
    const weaknesses = analyzeTeamWeaknesses(team as Pokemon[]);
    const multiWeaknesses = weaknesses.filter(w => 
      team.filter(p => {
        const eff = getTypeEffectiveness(w, p.types);
        return eff > 1;
      }).length >= 3
    );
    
    for (const weakness of multiWeaknesses) {
      synergyScore -= 20;
      issues.push(`Faiblesse commune critique: ${weakness}`);
    }
    
    // Bonus pour bonne couverture mutuelle
    const resistances = analyzeTeamResistances(team as Pokemon[]);
    if (resistances.length >= 10) {
      synergyScore += 10;
      strengths.push("Excellente couverture défensive");
    }
    
    // Vérifier la diversité des types
    const uniqueTypes = new Set(team.flatMap(p => p.types));
    if (uniqueTypes.size >= 8) {
      synergyScore += 15;
      strengths.push("Grande diversité de types");
    }
    
    synergyScore = Math.max(0, Math.min(100, synergyScore));
    
    return JSON.stringify({
      score: synergyScore,
      issues,
      strengths,
      typeCount,
      grade: synergyScore >= 80 ? "A" : synergyScore >= 60 ? "B" : synergyScore >= 40 ? "C" : "D"
    });
  },
  {
    name: "synergy_analysis",
    description: "Analyse la synergie d'une équipe Pokémon. Vérifie les doublons de type, faiblesses partagées et la complémentarité.",
    schema: z.object({
      team: TeamSchema.describe("L'équipe de Pokémon à analyser")
    })
  }
);

// ============================================================================
// TEAM SCORER TOOL
// ============================================================================

/**
 * Calcule un score global pour l'équipe
 */
export const teamScorerTool = tool(
  async (input: { team: z.infer<typeof TeamSchema> }) => {
    const { team } = input;
    
    // Analyse de type
    const weaknesses = analyzeTeamWeaknesses(team as Pokemon[]);
    const resistances = analyzeTeamResistances(team as Pokemon[]);
    
    // Stats totales
    let totalStats = 0;
    for (const pokemon of team) {
      if (pokemon.stats) {
        totalStats += pokemon.stats.reduce((acc, s) => acc + s.value, 0);
      }
    }
    const avgStats = totalStats / team.length;
    
    // Role distribution
    const roles: PokemonRole[] = team.map(p => classifyRole(p as Pokemon));
    const uniqueRoles = new Set(roles).size;
    
    // Calcul des scores partiels
    const typeScore = Math.max(0, 100 - weaknesses.length * 10 + resistances.length * 3);
    const statsScore = Math.min(100, (avgStats / 500) * 100);
    const roleScore = (uniqueRoles / 6) * 100;
    
    // Score total pondéré
    const overallScore = Math.round(
      typeScore * 0.35 +
      statsScore * 0.30 +
      roleScore * 0.35
    );
    
    // Grade
    let grade: string;
    if (overallScore >= 90) grade = "S";
    else if (overallScore >= 80) grade = "A";
    else if (overallScore >= 70) grade = "B";
    else if (overallScore >= 60) grade = "C";
    else if (overallScore >= 50) grade = "D";
    else grade = "F";
    
    return JSON.stringify({
      overallScore,
      grade,
      breakdown: {
        typeScore: Math.round(typeScore),
        statsScore: Math.round(statsScore),
        roleScore: Math.round(roleScore)
      },
      strengths: resistances.slice(0, 3).map(r => `Résiste à ${r}`),
      weaknesses: weaknesses.slice(0, 3).map(w => `Faible à ${w}`)
    });
  },
  {
    name: "team_scorer",
    description: "Calcule un score global (0-100) pour une équipe Pokémon avec grade (S/A/B/C/D/F) et analyse détaillée.",
    schema: z.object({
      team: TeamSchema.describe("L'équipe de Pokémon à scorer")
    })
  }
);

// ============================================================================
// POKEMON SUGGESTER TOOL
// ============================================================================

/**
 * Suggère des Pokémon pour compléter une équipe
 */
export const pokemonSuggesterTool = tool(
  async (input: { 
    currentTeam: z.infer<typeof TeamSchema>; 
    candidatePool: z.infer<typeof TeamSchema>;
    count?: number;
  }) => {
    const { currentTeam, candidatePool, count = 5 } = input;
    
    // Analyse de l'équipe actuelle
    const weaknesses = analyzeTeamWeaknesses(currentTeam as Pokemon[]);
    const currentTypes = new Set(currentTeam.flatMap(p => p.types));
    
    // Score chaque candidat
    const scoredCandidates = candidatePool.map(candidate => {
      let score = 50; // Base score
      
      // Bonus si types non présents
      for (const type of candidate.types) {
        if (!currentTypes.has(type)) {
          score += 15;
        }
      }
      
      // Bonus si aide contre les faiblesses
      for (const weakness of weaknesses) {
        if (getTypeEffectiveness(weakness, candidate.types) < 1) {
          score += 10; // Résiste à une faiblesse
        }
      }
      
      // Bonus pour stats élevées
      if (candidate.stats) {
        const total = candidate.stats.reduce((acc, s) => acc + s.value, 0);
        score += Math.min(20, total / 30);
      }
      
      return {
        ...candidate,
        score: Math.round(score),
        reasoning: `Apporte ${candidate.types.filter(t => !currentTypes.has(t)).join(', ') || 'complémentarité'}`
      };
    });
    
    // Trier et retourner les meilleurs
    const sorted = scoredCandidates.sort((a, b) => b.score - a.score);
    
    return JSON.stringify({
      suggestions: sorted.slice(0, count).map(s => ({
        id: s.id,
        name: s.name,
        types: s.types,
        score: s.score,
        reasoning: s.reasoning
      }))
    });
  },
  {
    name: "pokemon_suggester",
    description: "Suggère des Pokémon pour compléter une équipe, en fonction des faiblesses et types manquants.",
    schema: z.object({
      currentTeam: TeamSchema.describe("L'équipe actuelle"),
      candidatePool: TeamSchema.describe("Pool de Pokémon candidats"),
      count: z.number().optional().describe("Nombre de suggestions (défaut: 5)")
    })
  }
);

// ============================================================================
// EXPORT ALL TOOLS
// ============================================================================

export const teamBuildingTools = [
  typeAnalysisTool,
  roleClassifierTool,
  synergyTool,
  teamScorerTool,
  pokemonSuggesterTool
];
