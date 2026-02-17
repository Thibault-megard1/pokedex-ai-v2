/**
 * Team Building Agent
 * 
 * SubAgent principal pour la construction et analyse d'équipes.
 * 
 * Architecture:
 * MasterAgent (Mistral) → TeamBuildingAgent → Tools
 * 
 * Tools utilisés:
 * - TypeAnalysisTool: Analyse des types et faiblesses
 * - RoleClassifierTool: Classification des rôles
 * - SynergyTool: Analyse des synergies
 * - TeamScorerTool: Scoring global
 */

import { 
  Pokemon, 
  PokemonRole,
  getTotalStats,
  classifyRole
} from "../shared/types";

import { TypeAnalysisTool } from "../tools/TypeAnalysisTool";
import { RoleClassifierTool } from "../tools/RoleClassifierTool";
import { SynergyTool } from "../tools/SynergyTool";
import { TeamScorerTool } from "../tools/TeamScorerTool";

// ============================================================================
// TYPES
// ============================================================================

export type TeamBuildingMode = "suggest" | "analyze" | "counter" | "generate";

export interface TeamBuildingRequest {
  mode: TeamBuildingMode;
  currentTeam: Pokemon[];
  opponentTeam?: Pokemon[];
  theme?: string;
  tier?: string;
  constraints?: {
    bannedPokemon?: number[];
    requiredTypes?: string[];
    maxLegendaries?: number;
    format?: "singles" | "doubles" | "vgc";
  };
  candidatePool?: Pokemon[];
}

export interface TeamSuggestion {
  id: number;
  name: string;
  types: string[];
  stats?: { name: string; value: number }[];
  score: number;
  reasoning: string;
  breakdown?: {
    typeScore: number;
    statsScore: number;
    roleScore: number;
    coverageScore: number;
    synergyScore: number;
  };
}

export interface TeamAnalysis {
  strengths: string[];
  weaknesses: string[];
  typeDistribution: Record<string, number>;
  roleDistribution: Record<PokemonRole, number>;
  overallScore: number;
  recommendations: string[];
  grade?: "S" | "A" | "B" | "C" | "D" | "F";
}

export interface TeamBuildingResponse {
  success: boolean;
  mode: TeamBuildingMode;
  suggestion?: TeamSuggestion;
  suggestions?: TeamSuggestion[];
  analysis?: TeamAnalysis;
  team?: Pokemon[];
  counterTeam?: Pokemon[];
  generatedTeam?: Pokemon[];
  error?: string;
}

// ============================================================================
// POKEMON POOL (pour la génération)
// ============================================================================

const POKEMON_POOL: Pokemon[] = [
  { id: 149, name: "dragonite", types: ["dragon", "flying"], stats: [{ name: "hp", value: 91 }, { name: "attack", value: 134 }, { name: "defense", value: 95 }, { name: "special-attack", value: 100 }, { name: "special-defense", value: 100 }, { name: "speed", value: 80 }] },
  { id: 376, name: "metagross", types: ["steel", "psychic"], stats: [{ name: "hp", value: 80 }, { name: "attack", value: 135 }, { name: "defense", value: 130 }, { name: "special-attack", value: 95 }, { name: "special-defense", value: 90 }, { name: "speed", value: 70 }] },
  { id: 248, name: "tyranitar", types: ["rock", "dark"], stats: [{ name: "hp", value: 100 }, { name: "attack", value: 134 }, { name: "defense", value: 110 }, { name: "special-attack", value: 95 }, { name: "special-defense", value: 100 }, { name: "speed", value: 61 }] },
  { id: 94, name: "gengar", types: ["ghost", "poison"], stats: [{ name: "hp", value: 60 }, { name: "attack", value: 65 }, { name: "defense", value: 60 }, { name: "special-attack", value: 130 }, { name: "special-defense", value: 75 }, { name: "speed", value: 110 }] },
  { id: 143, name: "snorlax", types: ["normal"], stats: [{ name: "hp", value: 160 }, { name: "attack", value: 110 }, { name: "defense", value: 65 }, { name: "special-attack", value: 65 }, { name: "special-defense", value: 110 }, { name: "speed", value: 30 }] },
  { id: 212, name: "scizor", types: ["bug", "steel"], stats: [{ name: "hp", value: 70 }, { name: "attack", value: 130 }, { name: "defense", value: 100 }, { name: "special-attack", value: 55 }, { name: "special-defense", value: 80 }, { name: "speed", value: 65 }] },
  { id: 227, name: "skarmory", types: ["steel", "flying"], stats: [{ name: "hp", value: 65 }, { name: "attack", value: 80 }, { name: "defense", value: 140 }, { name: "special-attack", value: 40 }, { name: "special-defense", value: 70 }, { name: "speed", value: 70 }] },
  { id: 242, name: "blissey", types: ["normal"], stats: [{ name: "hp", value: 255 }, { name: "attack", value: 10 }, { name: "defense", value: 10 }, { name: "special-attack", value: 75 }, { name: "special-defense", value: 135 }, { name: "speed", value: 55 }] },
  { id: 373, name: "salamence", types: ["dragon", "flying"], stats: [{ name: "hp", value: 95 }, { name: "attack", value: 135 }, { name: "defense", value: 80 }, { name: "special-attack", value: 110 }, { name: "special-defense", value: 80 }, { name: "speed", value: 100 }] },
  { id: 130, name: "gyarados", types: ["water", "flying"], stats: [{ name: "hp", value: 95 }, { name: "attack", value: 125 }, { name: "defense", value: 79 }, { name: "special-attack", value: 60 }, { name: "special-defense", value: 100 }, { name: "speed", value: 81 }] },
  { id: 59, name: "arcanine", types: ["fire"], stats: [{ name: "hp", value: 90 }, { name: "attack", value: 110 }, { name: "defense", value: 80 }, { name: "special-attack", value: 100 }, { name: "special-defense", value: 80 }, { name: "speed", value: 95 }] },
  { id: 121, name: "starmie", types: ["water", "psychic"], stats: [{ name: "hp", value: 60 }, { name: "attack", value: 75 }, { name: "defense", value: 85 }, { name: "special-attack", value: 100 }, { name: "special-defense", value: 85 }, { name: "speed", value: 115 }] },
  { id: 36, name: "clefable", types: ["fairy"], stats: [{ name: "hp", value: 95 }, { name: "attack", value: 70 }, { name: "defense", value: 73 }, { name: "special-attack", value: 95 }, { name: "special-defense", value: 90 }, { name: "speed", value: 60 }] },
  { id: 197, name: "umbreon", types: ["dark"], stats: [{ name: "hp", value: 95 }, { name: "attack", value: 65 }, { name: "defense", value: 110 }, { name: "special-attack", value: 60 }, { name: "special-defense", value: 130 }, { name: "speed", value: 65 }] },
  { id: 68, name: "machamp", types: ["fighting"], stats: [{ name: "hp", value: 90 }, { name: "attack", value: 130 }, { name: "defense", value: 80 }, { name: "special-attack", value: 65 }, { name: "special-defense", value: 85 }, { name: "speed", value: 55 }] },
  { id: 65, name: "alakazam", types: ["psychic"], stats: [{ name: "hp", value: 55 }, { name: "attack", value: 50 }, { name: "defense", value: 45 }, { name: "special-attack", value: 135 }, { name: "special-defense", value: 95 }, { name: "speed", value: 120 }] },
  { id: 131, name: "lapras", types: ["water", "ice"], stats: [{ name: "hp", value: 130 }, { name: "attack", value: 85 }, { name: "defense", value: 80 }, { name: "special-attack", value: 85 }, { name: "special-defense", value: 95 }, { name: "speed", value: 60 }] },
  { id: 6, name: "charizard", types: ["fire", "flying"], stats: [{ name: "hp", value: 78 }, { name: "attack", value: 84 }, { name: "defense", value: 78 }, { name: "special-attack", value: 109 }, { name: "special-defense", value: 85 }, { name: "speed", value: 100 }] },
  { id: 9, name: "blastoise", types: ["water"], stats: [{ name: "hp", value: 79 }, { name: "attack", value: 83 }, { name: "defense", value: 100 }, { name: "special-attack", value: 85 }, { name: "special-defense", value: 105 }, { name: "speed", value: 78 }] },
  { id: 3, name: "venusaur", types: ["grass", "poison"], stats: [{ name: "hp", value: 80 }, { name: "attack", value: 82 }, { name: "defense", value: 83 }, { name: "special-attack", value: 100 }, { name: "special-defense", value: 100 }, { name: "speed", value: 80 }] }
];

// ============================================================================
// TEAM BUILDING AGENT
// ============================================================================

export class TeamBuildingAgent {
  // Tools
  private typeAnalysisTool: TypeAnalysisTool;
  private roleClassifierTool: RoleClassifierTool;
  private synergyTool: SynergyTool;
  private teamScorerTool: TeamScorerTool;

  constructor() {
    this.typeAnalysisTool = new TypeAnalysisTool();
    this.roleClassifierTool = new RoleClassifierTool();
    this.synergyTool = new SynergyTool();
    this.teamScorerTool = new TeamScorerTool();
  }

  /**
   * Point d'entrée principal du Team Building Agent
   */
  async process(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    try {
      switch (request.mode) {
        case "suggest":
          return await this.handleSuggest(request);
        
        case "analyze":
          return await this.handleAnalyze(request);
        
        case "counter":
          return await this.handleCounter(request);
        
        case "generate":
          return await this.handleGenerate(request);
        
        default:
          return {
            success: false,
            mode: request.mode,
            error: `Mode non supporté: ${request.mode}`
          };
      }
    } catch (error: any) {
      return {
        success: false,
        mode: request.mode,
        error: error.message || "Erreur dans TeamBuildingAgent"
      };
    }
  }

  // ============================================================================
  // MODE HANDLERS
  // ============================================================================

  /**
   * Mode SUGGEST: Suggère des Pokémon pour compléter l'équipe
   */
  private async handleSuggest(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    const { currentTeam, candidatePool } = request;
    const pool = candidatePool && candidatePool.length > 0 ? candidatePool : POKEMON_POOL;
    
    // Filtrer les candidats déjà dans l'équipe
    const usedIds = new Set(currentTeam.map(p => p.id));
    const candidates = pool.filter(p => !usedIds.has(p.id));
    
    // Scorer tous les candidats avec les Tools
    const scoredCandidates = this.teamScorerTool.rankCandidates(currentTeam, candidates);
    
    // Prendre le meilleur
    const best = scoredCandidates[0];
    
    if (!best) {
      return {
        success: false,
        mode: "suggest",
        error: "Aucun candidat disponible"
      };
    }

    const suggestion: TeamSuggestion = {
      id: best.pokemon.id,
      name: best.pokemon.name,
      types: best.pokemon.types,
      stats: best.pokemon.stats,
      score: best.score,
      reasoning: best.reasoning.join(". ") || "Bonne complémentarité avec l'équipe",
      breakdown: {
        typeScore: best.breakdown.typeImprovement,
        statsScore: best.breakdown.statsValue,
        roleScore: best.breakdown.roleValue,
        coverageScore: best.breakdown.typeImprovement,
        synergyScore: best.breakdown.synergyScore
      }
    };

    // Générer aussi des suggestions supplémentaires (minimum 8)
    const suggestions: TeamSuggestion[] = scoredCandidates.slice(0, 10).map(c => ({
      id: c.pokemon.id,
      name: c.pokemon.name,
      types: c.pokemon.types,
      stats: c.pokemon.stats,
      score: c.score,
      reasoning: c.reasoning.join(". ") || "Bonne option",
      breakdown: {
        typeScore: c.breakdown.typeImprovement,
        statsScore: c.breakdown.statsValue,
        roleScore: c.breakdown.roleValue,
        coverageScore: c.breakdown.typeImprovement,
        synergyScore: c.breakdown.synergyScore
      }
    }));

    const analysis = this.buildAnalysis(currentTeam);

    return {
      success: true,
      mode: "suggest",
      suggestion,
      suggestions,
      analysis
    };
  }

  /**
   * Mode ANALYZE: Analyse une équipe
   */
  private async handleAnalyze(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    const analysis = this.buildAnalysis(request.currentTeam);

    // Si équipe adverse fournie, analyser le matchup
    if (request.opponentTeam && request.opponentTeam.length > 0) {
      const matchup = this.analyzeMatchup(request.currentTeam, request.opponentTeam);
      analysis.recommendations = [
        ...analysis.recommendations,
        ...matchup.recommendations
      ];
    }

    return {
      success: true,
      mode: "analyze",
      analysis
    };
  }

  /**
   * Mode COUNTER: Génère une équipe pour contrer l'adversaire
   */
  private async handleCounter(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    if (!request.opponentTeam || request.opponentTeam.length === 0) {
      return {
        success: false,
        mode: "counter",
        error: "Équipe adverse requise pour le mode counter"
      };
    }

    const counterTeam = this.generateCounterTeam(request.opponentTeam);

    return {
      success: true,
      mode: "counter",
      counterTeam,
      team: counterTeam,
      analysis: this.buildAnalysis(counterTeam)
    };
  }

  /**
   * Mode GENERATE: Génère une équipe complète
   */
  private async handleGenerate(request: TeamBuildingRequest): Promise<TeamBuildingResponse> {
    const generatedTeam = this.generateTeam(request.candidatePool, request.theme);

    return {
      success: true,
      mode: "generate",
      generatedTeam,
      team: generatedTeam,
      analysis: this.buildAnalysis(generatedTeam)
    };
  }

  // ============================================================================
  // INTERNAL METHODS (using Tools)
  // ============================================================================

  /**
   * Construit une analyse complète avec les Tools
   */
  private buildAnalysis(team: Pokemon[]): TeamAnalysis {
    const scoreResult = this.teamScorerTool.scoreTeam(team);
    
    return {
      strengths: scoreResult.typeAnalysis.resistances.slice(0, 3).map(t => `Résiste à ${t}`),
      weaknesses: scoreResult.typeAnalysis.weaknesses.map(t => `Faible à ${t}`),
      typeDistribution: this.getTypeDistribution(team),
      roleDistribution: scoreResult.roleAnalysis.distribution,
      overallScore: scoreResult.overall,
      recommendations: scoreResult.recommendations,
      grade: scoreResult.grade
    };
  }

  /**
   * Calcule la distribution des types
   */
  private getTypeDistribution(team: Pokemon[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    for (const pokemon of team) {
      for (const type of pokemon.types) {
        distribution[type] = (distribution[type] || 0) + 1;
      }
    }
    return distribution;
  }

  /**
   * Analyse le matchup contre une équipe adverse
   */
  private analyzeMatchup(ourTeam: Pokemon[], opponentTeam: Pokemon[]): { score: number; recommendations: string[] } {
    const ourAnalysis = this.typeAnalysisTool.analyzeTeam(ourTeam);
    const theirAnalysis = this.typeAnalysisTool.analyzeTeam(opponentTeam);
    
    const recommendations: string[] = [];
    
    // Vérifier si nos faiblesses sont exploitées par l'adversaire
    const exploitableWeaknesses = ourAnalysis.weaknesses.filter(w =>
      opponentTeam.some(p => p.types.includes(w))
    );
    
    if (exploitableWeaknesses.length > 0) {
      recommendations.push(`Attention: l'adversaire peut exploiter ${exploitableWeaknesses.join(", ")}`);
    }
    
    // Vérifier nos avantages
    const ourAdvantages = theirAnalysis.weaknesses.filter(w =>
      ourTeam.some(p => p.types.includes(w))
    );
    
    if (ourAdvantages.length > 0) {
      recommendations.push(`Avantage: ${ourAdvantages.join(", ")} contre l'adversaire`);
    }
    
    const score = 50 + ourAdvantages.length * 10 - exploitableWeaknesses.length * 10;
    
    return { score, recommendations };
  }

  /**
   * Génère une contre-équipe
   */
  private generateCounterTeam(opponentTeam: Pokemon[]): Pokemon[] {
    const opponentAnalysis = this.typeAnalysisTool.analyzeTeam(opponentTeam);
    const counterTeam: Pokemon[] = [];
    const usedIds = new Set<number>();
    
    // Trouver des Pokémon qui résistent aux types adverses et les frappent super efficacement
    const scoredCandidates = POKEMON_POOL.map(candidate => {
      let score = 0;
      
      // Résistance aux types adverses
      for (const opponent of opponentTeam) {
        for (const type of opponent.types) {
          const typeAnalysis = this.typeAnalysisTool.analyzeMatchup(type, candidate.types);
          if (typeAnalysis.isResistance) score += 10;
          if (typeAnalysis.isImmunity) score += 15;
        }
      }
      
      // Efficacité offensive contre les faiblesses adverses
      for (const candidateType of candidate.types) {
        for (const weakness of opponentAnalysis.weaknesses) {
          const matchup = this.typeAnalysisTool.analyzeMatchup(candidateType, [weakness]);
          if (matchup.isWeakness) score += 8;
        }
      }
      
      // Bonus pour les stats
      score += getTotalStats(candidate) / 50;
      
      return { candidate, score };
    });
    
    // Trier et sélectionner les 6 meilleurs
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    for (const { candidate } of scoredCandidates) {
      if (!usedIds.has(candidate.id)) {
        counterTeam.push(candidate);
        usedIds.add(candidate.id);
        if (counterTeam.length >= 6) break;
      }
    }
    
    return counterTeam;
  }

  /**
   * Génère une équipe équilibrée
   */
  private generateTeam(candidatePool?: Pokemon[], theme?: string): Pokemon[] {
    const pool = candidatePool && candidatePool.length > 0 ? candidatePool : POKEMON_POOL;
    const team: Pokemon[] = [];
    const usedIds = new Set<number>();
    
    // Objectif: avoir tous les rôles représentés
    const targetRoles: PokemonRole[] = ["sweeper", "wall", "tank", "pivot", "support", "sweeper"];
    
    for (const targetRole of targetRoles) {
      if (team.length >= 6) break;
      
      // Trouver le meilleur candidat pour ce rôle
      const candidates = pool
        .filter(p => !usedIds.has(p.id))
        .filter(p => classifyRole(p) === targetRole || team.length >= 4); // Flexible après 4
      
      if (candidates.length > 0) {
        // Scorer avec les Tools
        const ranked = this.teamScorerTool.rankCandidates(team, candidates);
        const best = ranked[0]?.pokemon;
        
        if (best) {
          team.push(best);
          usedIds.add(best.id);
        }
      }
    }
    
    // Compléter si nécessaire
    while (team.length < 6) {
      const remaining = pool.filter(p => !usedIds.has(p.id));
      if (remaining.length === 0) break;
      
      const ranked = this.teamScorerTool.rankCandidates(team, remaining);
      if (ranked[0]) {
        team.push(ranked[0].pokemon);
        usedIds.add(ranked[0].pokemon.id);
      } else {
        break;
      }
    }
    
    return team;
  }
}

export default TeamBuildingAgent;
