/**
 * Synergy Analyzer Tool
 * 
 * Analyse les synergies et anti-synergies entre Pokémon
 * pour améliorer la cohésion d'équipe.
 */

import { Pokemon } from "./TypeEffectivenessTool";
import { getTypeRelations } from "@/lib/typeRelations";

export interface SynergyResult {
  score: number; // 0-100
  positiveSymergies: string[];
  negativeSymergies: string[];
  typeRedundancy: number; // 0-1 (0 = pas de redondance, 1 = très redondant)
  roleRedundancy: number; // 0-1
}

export class SynergyAnalyzerTool {
  /**
   * Analyse les synergies d'une équipe
   */
  analyzeTeamSynergy(team: Pokemon[]): SynergyResult {
    const positiveSymergies: string[] = [];
    const negativeSymergies: string[] = [];
    
    // Calculer la redondance de types
    const typeRedundancy = this.calculateTypeRedundancy(team);
    
    // Détecter les combos positifs
    this.detectPositiveCombos(team, positiveSymergies);
    
    // Détecter les anti-synergies (moins sévère pour petites équipes)
    this.detectNegativeSynergies(team, negativeSymergies);
    
    // Calculer le score final ADAPTÉ À LA TAILLE
    const score = this.calculateSynergyScore(
      positiveSymergies.length,
      negativeSymergies.length,
      typeRedundancy,
      team.length
    );
    
    return {
      score,
      positiveSymergies,
      negativeSymergies,
      typeRedundancy,
      roleRedundancy: 0.5 // TODO: implémenter
    };
  }

  /**
   * Calcule la redondance de types (0-1)
   * Plus c'est élevé, plus il y a de types dupliqués
   */
  private calculateTypeRedundancy(team: Pokemon[]): number {
    if (team.length <= 1) return 0;
    
    const typeCount = new Map<string, number>();
    let totalTypes = 0;
    
    team.forEach(pokemon => {
      pokemon.types.forEach(type => {
        typeCount.set(type, (typeCount.get(type) || 0) + 1);
        totalTypes++;
      });
    });
    
    // Calculer l'excès de duplication
    let redundancyScore = 0;
    typeCount.forEach(count => {
      if (count > 2) {
        redundancyScore += (count - 2) * 0.2; // Pénalité pour 3+ du même type
      } else if (count > 1) {
        redundancyScore += 0.1; // Petite pénalité pour doublons
      }
    });
    
    return Math.min(1, redundancyScore);
  }

  /**
   * Détecte les combos positifs entre Pokémon
   */
  private detectPositiveCombos(team: Pokemon[], synergies: string[]): void {
    // Vérifier la diversité de types (positif)
    const uniqueTypes = new Set<string>();
    team.forEach(p => p.types.forEach(t => uniqueTypes.add(t)));
    
    if (uniqueTypes.size >= 8) {
      synergies.push("Excellente diversité de types (8+)");
    }
    
    // Vérifier les complémentarités défensives
    const waterCount = team.filter(p => p.types.includes("water")).length;
    const fireCount = team.filter(p => p.types.includes("fire")).length;
    const grassCount = team.filter(p => p.types.includes("grass")).length;
    
    if (waterCount >= 1 && fireCount >= 1 && grassCount >= 1) {
      synergies.push("Core Feu-Eau-Plante équilibré");
    }
    
    // Core Défensif classique (Steel + Fairy + Dragon résiste à beaucoup)
    const steelCount = team.filter(p => p.types.includes("steel")).length;
    const fairyCount = team.filter(p => p.types.includes("fairy")).length;
    const dragonCount = team.filter(p => p.types.includes("dragon")).length;
    
    if (steelCount >= 1 && fairyCount >= 1) {
      synergies.push("Core Steel-Fairy défensif");
    }
  }

  /**
   * Détecte les anti-synergies
   */
  private detectNegativeSynergies(team: Pokemon[], antiSynergies: string[]): void {
    // Trop de même type = problème
    const typeCount = new Map<string, number>();
    team.forEach(pokemon => {
      pokemon.types.forEach(type => {
        typeCount.set(type, (typeCount.get(type) || 0) + 1);
      });
    });
    
    typeCount.forEach((count, type) => {
      if (count >= 3) {
        antiSynergies.push(`REDONDANCE: ${count}x type ${type} (vulnérabilité partagée)`);
      }
    });
    
    // Équipe trop lente ou trop rapide
    const speeds = team
      .map(p => p.stats?.find(s => s.name === "speed")?.value || 0);
    
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    
    if (avgSpeed < 50) {
      antiSynergies.push("Équipe TRÈS LENTE (avg < 50) - vulnérable aux sweepers");
    } else if (avgSpeed > 100) {
      antiSynergies.push("Équipe TRÈS RAPIDE (avg > 100) - manque de bulk");
    }
    
    // Manque de bulk
    const bulks = team.map(p => {
      const hp = p.stats?.find(s => s.name === "hp")?.value || 0;
      const def = p.stats?.find(s => s.name === "defense")?.value || 0;
      const spDef = p.stats?.find(s => s.name === "special-defense")?.value || 0;
      return (hp + def + spDef) / 3;
    });
    
    const avgBulk = bulks.reduce((a, b) => a + b, 0) / bulks.length;
    
    if (avgBulk < 60) {
      antiSynergies.push("Équipe FRAGILE (bulk < 60) - risque de sweep");
    }
  }

  /**
   * Calcule le score de synergie (0-100)
   * ADAPTÉ à la taille de l'équipe
   */
  private calculateSynergyScore(
    positiveSynergies: number,
    negativeSynergies: number,
    typeRedundancy: number,
    teamSize: number
  ): number {
    // Base dynamique selon taille (petite équipe = score élevé par défaut)
    let score = teamSize <= 1 ? 80 : teamSize <= 2 ? 75 : teamSize <= 4 ? 70 : 65;
    
    // Bonus pour synergies positives (AUGMENTÉ)
    score += positiveSynergies * 12;
    
    // Malus pour anti-synergies (RÉDUIT et proportionnel)
    const antiSynergyPenalty = teamSize <= 2 ? 5 : teamSize <= 4 ? 8 : 10;
    score -= negativeSynergies * antiSynergyPenalty;
    
    // Malus redondance (RÉDUIT - 20 au lieu de 40)
    score -= typeRedundancy * 20;
    
    return Math.max(50, Math.min(100, Math.round(score))); // MINIMUM 50
  }

  /**
   * Score un candidat basé sur sa synergie avec l'équipe existante
   * REFACTORISÉ: Analyse PROFONDE de la complémentarité
   */
  scoreCandidateSynergy(
    candidate: Pokemon,
    team: Pokemon[]
  ): { score: number; details: string[] } {
    const details: string[] = [];
    let score = 50; // Base NEUTRE - les bonus/malus décident tout
    
    if (team.length === 0) {
      return { score: 75, details: ["Premier Pokémon de l'équipe"] };
    }
    
    // === ANALYSE DES TYPES ===
    const typeCount = new Map<string, number>();
    team.forEach(p => {
      p.types.forEach(t => {
        typeCount.set(t, (typeCount.get(t) || 0) + 1);
      });
    });
    
    // Calculer les faiblesses SPÉCIFIQUES de l'équipe
    const teamWeaknesses = this.getTeamWeaknesses(team);
    const candidateRelations = getTypeRelations(candidate.types);
    
    // === BONUS ÉNORMES pour IMMUNITÉ aux faiblesses ===
    let immunityBonus = 0;
    Array.from(teamWeaknesses).forEach(weakness => {
      if (candidateRelations.immuneTo.includes(weakness)) {
        immunityBonus += 40;
        details.push(`🛡️ IMMUNITÉ à ${weakness} (faiblesse équipe!)`);
      }
    });
    score += immunityBonus;
    
    // === BONUS FORTS pour résistances aux faiblesses ===
    let resistanceBonus = 0;
    Array.from(teamWeaknesses).forEach(weakness => {
      if (candidateRelations.resistantTo.includes(weakness)) {
        resistanceBonus += 25;
        details.push(`✅ Résiste à ${weakness} (faiblesse équipe)`);
      }
    });
    score += resistanceBonus;
    
    // === BONUS pour nouveaux types ===
    let newTypeBonus = 0;
    candidate.types.forEach(type => {
      const count = typeCount.get(type) || 0;
      if (count === 0) {
        newTypeBonus += 20;
        details.push(`✅ Nouveau type: ${type}`);
      }
    });
    score += newTypeBonus;
    
    // === MALUS pour redondance ===
    let redundancyPenalty = 0;
    candidate.types.forEach(type => {
      const count = typeCount.get(type) || 0;
      if (count === 1) {
        redundancyPenalty += 5; // Petit malus
      } else if (count >= 2) {
        redundancyPenalty += 20; // Gros malus pour 3+
        details.push(`❌ REDONDANT: ${type} déjà ${count}x`);
      }
    });
    score -= redundancyPenalty;
    
    // === MALUS pour NOUVELLES faiblesses partagées ===
    let sharedWeaknessCount = 0;
    candidateRelations.weakTo.forEach(weakType => {
      if (teamWeaknesses.has(weakType)) {
        sharedWeaknessCount++;
      }
    });
    if (sharedWeaknessCount >= 3) {
      score -= (sharedWeaknessCount - 2) * 15;
      details.push(`⚠️ Partage ${sharedWeaknessCount} faiblesses`);
    }
    
    // === BONUS équilibrage ===
    const balanceBonus = this.calculateBalanceBonus(candidate, team);
    score += balanceBonus.score;
    if (balanceBonus.reason) details.push(balanceBonus.reason);
    
    const offenseBalance = this.calculateOffenseBalance(candidate, team);
    score += offenseBalance.score;
    if (offenseBalance.reason) details.push(offenseBalance.reason);
    
    return { score: Math.max(15, Math.min(100, Math.round(score))), details };
  }

  /**
   * Obtient les faiblesses communes de l'équipe
   */
  private getTeamWeaknesses(team: Pokemon[]): Set<string> {
    const weaknesses = new Set<string>();
    
    team.forEach(pokemon => {
      const relations = getTypeRelations(pokemon.types);
      relations.weakTo.forEach(type => weaknesses.add(type));
    });
    
    return weaknesses;
  }

  /**
   * Évalue la valeur défensive du candidat
   */
  private getCandidateDefensiveValue(
    candidate: Pokemon,
    teamWeaknesses: Set<string>
  ): { resistsTeamWeaknesses: number; sharesWeaknesses: number } {
    const candidateRelations = getTypeRelations(candidate.types);
    
    let resistsTeamWeaknesses = 0;
    Array.from(teamWeaknesses).forEach(weakness => {
      if (candidateRelations.resistantTo.includes(weakness) || 
          candidateRelations.immuneTo.includes(weakness)) {
        resistsTeamWeaknesses++;
      }
    });
    
    const sharesWeaknesses = candidateRelations.weakTo.filter(w => 
      teamWeaknesses.has(w)
    ).length;
    
    return { resistsTeamWeaknesses, sharesWeaknesses };
  }

  /**
   * Calcule le bonus d'équilibrage vitesse/bulk
   */
  private calculateBalanceBonus(
    candidate: Pokemon,
    team: Pokemon[]
  ): { score: number; reason?: string } {
    const teamSpeeds = team.map(p => 
      p.stats?.find(s => s.name === "speed")?.value || 0
    );
    const avgSpeed = teamSpeeds.reduce((a, b) => a + b, 0) / teamSpeeds.length;
    const candidateSpeed = candidate.stats?.find(s => s.name === "speed")?.value || 0;
    
    // Équipe lente + candidat rapide = bon
    if (avgSpeed < 65 && candidateSpeed > 95) {
      return { score: 15, reason: "⚡ Ajoute vitesse (équipe lente)" };
    }
    
    // Équipe rapide + candidat tank = bon
    if (avgSpeed > 95 && candidateSpeed < 65) {
      const hp = candidate.stats?.find(s => s.name === "hp")?.value || 0;
      const def = candidate.stats?.find(s => s.name === "defense")?.value || 0;
      const bulk = (hp + def) / 2;
      
      if (bulk > 80) {
        return { score: 15, reason: "🛡️ Ajoute bulk (équipe rapide)" };
      }
    }
    
    return { score: 0 };
  }

  /**
   * Calcule le bonus d'équilibrage offense
   */
  private calculateOffenseBalance(
    candidate: Pokemon,
    team: Pokemon[]
  ): { score: number; reason?: string } {
    const candidateAtk = candidate.stats?.find(s => s.name === "attack")?.value || 0;
    const candidateSpAtk = candidate.stats?.find(s => s.name === "special-attack")?.value || 0;
    const candidateIsPhy = candidateAtk > candidateSpAtk;
    
    // Calculer le biais de l'équipe
    let teamPhyTotal = 0;
    let teamSpAtkTotal = 0;
    
    team.forEach(p => {
      teamPhyTotal += p.stats?.find(s => s.name === "attack")?.value || 0;
      teamSpAtkTotal += p.stats?.find(s => s.name === "special-attack")?.value || 0;
    });
    
    const avgPhy = teamPhyTotal / team.length;
    const avgSpAtk = teamSpAtkTotal / team.length;
    const teamBias = avgPhy - avgSpAtk;
    
    // Équipe trop physique + candidat spécial = bon
    if (teamBias > 30 && !candidateIsPhy && candidateSpAtk > 90) {
      return { score: 12, reason: "✨ Équilibre avec Sp.Atk" };
    }
    
    // Équipe trop spéciale + candidat physique = bon
    if (teamBias < -30 && candidateIsPhy && candidateAtk > 90) {
      return { score: 12, reason: "💪 Équilibre avec Atk" };
    }
    
    return { score: 0 };
  }
}
