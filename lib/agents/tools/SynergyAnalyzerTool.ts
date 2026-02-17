/**
 * ============================================================================
 * SYNERGY ANALYZER TOOL - Tool d'analyse de synergie d'équipe
 * ============================================================================
 * 
 * OBJECTIF:
 * Ce tool mesure la SYNERGIE globale de l'équipe - à quel point les Pokémon
 * TRAVAILLENT BIEN ENSEMBLE. Une bonne synergie signifie que chaque Pokémon
 * COMPLÈTE les autres plutôt que de les dupliquer.
 * 
 * DÉFINITIONS:
 * - **SYNERGIE POSITIVE**: Les Pokémon se complètent et couvrent leurs faiblesses
 * - **ANTI-SYNERGIE**: Les Pokémon partagent les mêmes faiblesses ou rôles
 * - **REDONDANCE**: Duplication inutile de fonctions/types
 * 
 * ============================================================================
 * SYNERGIES POSITIVES (Ce qu'on VEUT dans une équipe)
 * ============================================================================
 * 
 * 1. **CORE TEAMS** (Duos/Trios complémentaires) 💚
 *    
 *    **FWG CORE (Fire-Water-Grass)** - LE CLASSIQUE
 *    - Feu bat: Plante, Acier, Glace, Insecte
 *    - Eau bat: Feu, Sol, Roche
 *    - Plante bat: Eau, Sol, Roche
 *    - Synergie: Chacun couvre les faiblesses des autres
 *    - Exemple: Charizard + Blastoise + Venusaur (starters Kanto)
 *    - Score: +50 points si ce core est présent
 *    
 *    **STEEL-FAIRY CORE** - META MODERNE
 *    - Acier: Résiste à 11 types (défense incroyable)
 *    - Fée: Immunisé Dragon + tue Dragon
 *    - Synergie:
 *      * Acier couvre faiblesse Poison/Acier de Fée
 *      * Fée couvre faiblesse Combat/Feu de Acier
 *    - Exemple: Magearna + Tapu Fini, Heatran + Clefable
 *    - Score: +60 points (très fort en compétitif)
 *    
 *    **DRAGON-STEEL-FAIRY TRIANGLE**
 *    - Dragon: Puissance offensive brute
 *    - Acier: Mur défensif
 *    - Fée: Couvre faiblesse Dragon du Dragon
 *    - Synergie: Offense + Défense + Anti-Dragon
 *    - Exemple: Garchocho + Ferrothorn + Clefable
 *    
 *    **REGENERATOR CORE** - STALL TEAMS
 *    - Plusieurs Pokémon avec l'ability Regenerator
 *    - Regenerator: heal 33% HP au switch out
 *    - Synergie: Switch en boucle = heal infini
 *    - Exemple: Tornadus-T + Amoonguss + Toxapex
 *    
 *    **VoltTurn CORE** - MOMENTUM TEAMS
 *    - Plusieurs Pokémon avec Volt Switch ou U-turn
 *    - Synergie: Maintenir le contrôle du rythme constamment
 *    - Switch in le bon counter à chaque fois
 *    - Exemple: Landorus-T + Rotom-W + Scizor
 * 
 * 2. **DIVERSITÉ DE TYPES** 🌈
 *    - OBJECTIF: Maximum de types DIFFÉRENTS dans l'équipe
 *    - 6-8 types: Décent
 *    - 9-10 types: Bon
 *    - 11+ types: Excellent!
 *    - 12+ types: Parfait (rare, dual-types bien choisis)
 *    - Score: +40 points si 8+ types uniques
 * 
 * 3. **SPEED TIERS VARIÉS** ⚡
 *    - MÉLANGE de Pokémon rapides ET lents
 *    - Rapides: Pour outspeed et KO
 *    - Lents: Pour tanker et staller
 *    - Éviter d'avoir QUE des rapides ou QUE des lents
 *    - Score: +30 points si bon mix
 * 
 * 4. **PHYSICAL + SPECIAL BALANCE** 💥
 *    - Mix d'attaquants PHYSIQUES et SPÉCIAUX
 *    - Pourquoi?
 *      * Évite d'être wall par un seul type de défense
 *      * Blissey wall les spéciaux → besoin de physiques
 *      * Skarmory wall les physiques → besoin de spéciaux
 *    - Idéal: 3 physiques + 3 spéciaux
 *    - Score: +35 points si bien équilibré
 * 
 * 5. **WEATHER SYNERGY** ☀️☔
 *    - Si l'équipe utilise une météo (Sun, Rain, Sand, Hail):
 *      * TOUS les Pokémon doivent en bénéficier
 *    - **Rain Team**:
 *      * Types Eau: +50% puissance moves Eau
 *      * Swift Swim: ×2 Speed sous pluie
 *      * Thunder: 100% accuracy
 *      * Exemple: Politoed (setter) + Kingdra + Mega Swampert
 *    - **Sun Team**:
 *      * Types Feu: +50% puissance moves Feu
 *      * Chlorophyll: ×2 Speed au soleil
 *      * Solar Beam: pas de charge
 *      * Exemple: Torkoal (setter) + Venusaur + Charizard
 * 
 * ============================================================================
 * ANTI-SYNERGIES (Ce qu'on VEUT ÉVITER)
 * ============================================================================
 * 
 * 1. **FAIBLESSES PARTAGÉES** ❌
 *    - PROBLÈME: Plusieurs Pokémon faibles au MÊME type
 *    - Conséquence: Un seul Pokémon adversaire peut menacer toute l'équipe
 *    - Exemple MAUVAIS:
 *      * Équipe: Charizard + Talonflame + Moltres (tous Feu/Vol)
 *      * Problème: TOUS x4 faibles à Roche (Stealth Rock = mort)
 *    - Exemple MAUVAIS 2:
 *      * Équipe avec 4 Pokémon faibles à Électrique
 *      * Un Raikou peut sweep toute l'équipe
 *    - SOLUTION: Limiter à MAX 2 Pokémon avec même faiblesse
 *    - Pénalité: -40 points
 * 
 * 2. **REDONDANCE DE TYPES** 🔁
 *    - PROBLÈME: 3+ Pokémon du MÊME TYPE
 *    - Conséquence: Couverture offensive limitée
 *    - Exemple: 3 Pokémon Eau dans une équipe → tous weak à Électrique
 *    - EXCEPTION: Mono-type teams (challenge volontaire)
 *    - Pénalité: -30 points
 * 
 * 3. **STEALTH ROCK WEAKNESS** 🪨
 *    - PROBLÈME: Plusieurs Pokémon x4 weak à Roche
 *    - Stealth Rock: Entry hazard qui inflige dégâts au switch
 *      * Normal: 12.5% HP
 *      * x2 weak: 25% HP
 *      * x4 weak: 50% HP!! (dévastateur)
 *    - Exemple MAUVAIS: Volcarona + Charizard + Moltres
 *      * Tous perdent 50% HP au switch si Stealth Rock est posé
 *    - SOLUTION:
 *      * MAX 1 Pokémon x4 weak Roche par équipe
 *      * Avoir un "Rapid Spin" ou "Defog" user pour enlever hazards
 *    - Pénalité: -50 points
 * 
 * 4. **ALL FAST / ALL SLOW TEAMS** 🐢🐇
 *    - PROBLÈME: Tous les Pokémon ont la même speed tier
 *    - **All Fast (Hyper Offense)**:
 *      * Problème: Fragiles, no bulk
 *      * Vulnérable aux priority moves
 *      * Si un tank setup (Calm Mind), difficile à piercer
 *    - **All Slow (Stall)**:
 *      * Problème: Vulnérable aux setup sweepers
 *      * Pas de revenge killers
 *      * Taunt les bloque complètement
 *    - Pénalité: -35 points
 * 
 * 5. **RÔLE REDONDANCE** 🔄
 *    - PROBLÈME: 4+ Pokémon avec le MÊME rôle
 *    - Exemple: 4 Sweepers physiques
 *      * Vulnérable à un Physical wall (Skarmory)
 *      * Manque de utility (healing, hazards)
 *    - SOLUTION: Diversifier les rôles
 *    - Pénalité: -30 points
 * 
 * ============================================================================
 * ALGORITHME DE CALCUL DU SCORE DE SYNERGIE (0-100)
 * ============================================================================
 * 
 * **BASE SCORE** (adapté à la taille d'équipe):
 * - 1 Pokémon: 80 (pas de synergie possible, mais OK)
 * - 2 Pokémon: 70
 * - 3 Pokémon: 60
 * - 4 Pokémon: 55
 * - 5 Pokémon: 50
 * - 6 Pokémon: 50 (base neutre)
 * 
 * **AJUSTEMENTS**:
 * 1. +Points pour synergies positives (cores, diversité)
 * 2. -Points pour anti-synergies (redondance, faiblesses)
 * 3. Final score = clamped entre 0-100
 * 
 * **INTERPRÉTATION**:
 * - 0-30: Équipe très faible (faiblesses majeures)
 * - 31-50: Équipe moyenne (quelques problèmes)
 * - 51-70: Bonne équipe (synergie décente)
 * - 71-85: Très bonne équipe (bien équilibrée)
 * - 86-100: Équipe exceptionnelle (synergie parfaite)
 * 
 * ============================================================================
 * SCORING D'UN CANDIDAT
 * ============================================================================
 * 
 * Quand on évalue un nouveau Pokémon:
 * 1. Calcule synergie ACTUELLE de l'équipe
 * 2. Simule l'ajout du candidat
 * 3. Recalcule la synergie
 * 4. Score = (nouvelle_synergie - ancienne_synergie) × 2
 * 
 * BONUS:
 * - +70 points: Complète un core (FWG, Steel-Fairy)
 * - +50 points: Réduit significativement les faiblesses communes
 * - +40 points: Ajoute diversité de types
 * 
 * PÉNALITÉS:
 * - -60 points: Crée une faiblesse commune critique
 * - -40 points: Augmente la redondance de types
 * - -35 points: Déséquilibre la speed distribution
 * ============================================================================
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
