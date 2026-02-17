/**
 * ============================================================================
 * STATUS EFFECT TOOL - Tool de gestion des statuts
 * ============================================================================
 * 
 * OBJECTIF:
 * Ce tool gère les conditions de statut (status conditions) en combat Pokémon.
 * Les status sont des effets négatifs persistants qui affectent un Pokémon.
 * 
 * RÈGLE FONDAMENTALE:
 * Un Pokémon ne peut avoir qu'UN SEUL statut primaire à la fois.
 * Mais il peut avoir PLUSIEURS statuts volatiles simultanément.
 * 
 * ============================================================================
 * STATUTS PRIMAIRES (Primary Status) - PERSISTENT APRÈS LE COMBAT
 * ============================================================================
 * 
 * 1. POISON (PSN) 🟣
 *    - Effet: Perd 1/8 de HP max par tour (12.5%)
 *    - Durée: Jusqu'à guérison (Item/Move) ou fin du combat
 *    - Moves: Poison Powder, Toxic, Poison Jab
 *    - Immunité: Types Poison et Steel
 *    - Note: Toxic (Poison grave) augmente les dégâts chaque tour (1/16, 2/16, 3/16...)
 * 
 * 2. BURN (BRN) 🔥
 *    - Effet double:
 *      a) Perd 1/16 de HP max par tour (6.25%)
 *      b) Attaque physique réduite de 50% (×0.5 Attack)
 *    - Durée: Jusqu'à guérison ou fin du combat
 *    - Moves: Will-O-Wisp, Flamethrower (10% chance), Scald (30% chance)
 *    - Immunité: Types Feu
 *    - Stratégie: Excellent pour neutraliser les sweepers physiques (Gyarados, Machamp)
 * 
 * 3. PARALYSIS (PAR) ⚡
 *    - Effet double:
 *      a) Vitesse réduite de 50% (×0.5 Speed)
 *      b) 25% de chance d'être immobilisé (ne peut pas attaquer) chaque tour
 *    - Durée: Jusqu'à guérison ou fin du combat
 *    - Moves: Thunder Wave, Body Slam (30% chance), Thunderbolt (10% chance)
 *    - Immunité: Types Électrique
 *    - Stratégie: Très puissant, ralentit ET peut empêcher d'agir
 * 
 * 4. SLEEP (SLP) 😴
 *    - Effet: Ne peut PAS attaquer (sauf Sleep Talk, Snore)
 *    - Durée: 1 à 3 tours (aléatoire)
 *    - Moves: Sleep Powder, Hypnosis, Spore (100% précision!)
 *    - Immunité: Aucune immunité de type
 *    - Note: Le plus puissant des status (immobilisation totale)
 *    - Contre: Chesto Berry, Wake-Up Slap
 * 
 * 5. FREEZE (FRZ) ❄️
 *    - Effet: Ne peut PAS attaquer (sauf certains moves Feu)
 *    - Durée: 20% de chance de dégel par tour (peut durer longtemps!)
 *    - Moves: Ice Beam (10% chance), Blizzard (10% chance)
 *    - Immunité: Types Glace
 *    - Note: Rare car difficilement infligeable (pas de move 100%)
 * 
 * ============================================================================
 * STATUTS VOLATILES (Volatile Status) - DISPARAISSENT AU SWITCH OUT
 * ============================================================================
 * 
 * 1. CONFUSION (confuse) 😵
 *    - Effet: 50% de chance de se frapper soi-même (40 power typeless attack)
 *    - Durée: 1 à 4 tours
 *    - Moves: Confuse Ray, Swagger, Dynamic Punch
 * 
 * 2. FLINCH 😱
 *    - Effet: Ne peut pas attaquer CE TOUR
 *    - Durée: 1 tour seulement
 *    - Moves: Fake Out, Iron Head (30%), Air Slash (30%)
 *    - Note: Ne fonctionne QUE si l'utilisateur est plus rapide
 * 
 * 3. INFATUATION (attract) 💕
 *    - Effet: 50% de chance de ne pas pouvoir attaquer
 *    - Durée: Jusqu'au switch
 *    - Condition: Sexes opposés requis
 * 
 * 4. LEECH SEED 🌱
 *    - Effet: Perd 1/8 HP max par tour, l'adversaire récupère ces HP
 *    - Immunité: Types Grass
 * 
 * ============================================================================
 * STRATÉGIES DE STATUS:
 * ============================================================================
 * 
 * "Stall Teams" (équipes défensives):
 * - Burn les sweepers physiques
 * - Paralyze les speedsters
 * - Toxic + Protect pour empoisonner et staller
 * 
 * "Cleric" (support):
 * - Pokémon avec Heal Bell ou Aromatherapy pour guérir toute l'équipe
 * 
 * "Status Absorber":
 * - Pokémon avec Natural Cure (ability) guérit le status au switch
 * - Pokémon avec Guts (ability) boost l'attaque si status (Heracross, Machamp)
 * 
 * PRIORITY DES STATUS EN COMPÉTITIF:
 * 1. Sleep (le plus fort, souvent banni en "Sleep Clause")
 * 2. Paralysis (ralentit ET peut immobiliser)
 * 3. Burn (réduit Attack, bon contre physiques)
 * 4. Toxic (dégâts croissants, excellent pour stall)
 * 5. Freeze (rare, peu fiable)
 * 6. Poison normal (moins bon que Toxic)
 * ============================================================================
 */

export type PrimaryStatus = "burn" | "poison" | "paralysis" | "sleep" | "freeze" | null;
export type VolatileStatus = "confusion" | "flinch" | "infatuation" | "seeded" | null;

export interface StatusState {
  primaryStatus: PrimaryStatus;
  sleepTurns?: number; // 2-5 tours
  toxicCounter?: number; // Pour poison grave (croissant)
  volatileStatuses: VolatileStatus[];
  confusionTurns?: number;
}

export interface StatusApplicationResult {
  success: boolean;
  status: PrimaryStatus | VolatileStatus;
  message: string;
  reason?: string;
  breakdown: string[];
}

export interface TurnStartEffect {
  damage: number;
  damagePercent: number;
  canAct: boolean;
  statusCleared: boolean;
  effects: string[];
  breakdown: string[];
}

export interface StatusAnalysis {
  targetName: string;
  currentStatus: PrimaryStatus;
  volatileStatuses: VolatileStatus[];
  turnsRemaining?: number;
  canReceiveStatus: boolean;
  immunities: string[];
  vulnerabilities: string[];
  breakdown: string[];
}

export class StatusEffectTool {
  /**
   * Crée un état de statut par défaut (aucun statut)
   */
  createDefaultStatusState(): StatusState {
    return {
      primaryStatus: null,
      volatileStatuses: []
    };
  }

  /**
   * Vérifie si un Pokémon est immunisé à un statut
   */
  checkImmunity(
    targetTypes: string[],
    status: PrimaryStatus
  ): { isImmune: boolean; reason?: string } {
    const typeArray = targetTypes.map(t => t.toLowerCase());

    switch (status) {
      case "burn":
        if (typeArray.includes("fire")) {
          return { isImmune: true, reason: "Les types Feu ne peuvent pas être brûlés" };
        }
        break;
      case "poison":
        if (typeArray.includes("poison") || typeArray.includes("steel")) {
          return { isImmune: true, reason: "Les types Poison et Acier ne peuvent pas être empoisonnés" };
        }
        break;
      case "paralysis":
        if (typeArray.includes("electric")) {
          return { isImmune: true, reason: "Les types Électrique ne peuvent pas être paralysés" };
        }
        break;
      case "freeze":
        if (typeArray.includes("ice")) {
          return { isImmune: true, reason: "Les types Glace ne peuvent pas être gelés" };
        }
        break;
      case "sleep":
        // Pas d'immunité de type pour sleep
        break;
    }

    return { isImmune: false };
  }

  /**
   * Applique un statut primaire
   */
  applyPrimaryStatus(
    currentState: StatusState,
    newStatus: PrimaryStatus,
    targetTypes: string[],
    targetName: string
  ): { newState: StatusState; result: StatusApplicationResult } {
    const breakdown: string[] = [];
    const newState = { ...currentState, volatileStatuses: [...currentState.volatileStatuses] };

    // Vérifier si déjà affecté par un statut primaire
    if (currentState.primaryStatus !== null) {
      return {
        newState: currentState,
        result: {
          success: false,
          status: newStatus,
          message: `${targetName} a déjà un statut !`,
          reason: `Affecté par: ${currentState.primaryStatus}`,
          breakdown: [`⚠️ ${targetName} est déjà ${currentState.primaryStatus}`]
        }
      };
    }

    // Vérifier les immunités
    const immunity = this.checkImmunity(targetTypes, newStatus);
    if (immunity.isImmune) {
      return {
        newState: currentState,
        result: {
          success: false,
          status: newStatus,
          message: `${targetName} est immunisé !`,
          reason: immunity.reason,
          breakdown: [`🛡️ ${immunity.reason}`]
        }
      };
    }

    // Appliquer le statut
    newState.primaryStatus = newStatus;
    
    switch (newStatus) {
      case "sleep":
        newState.sleepTurns =  Math.floor(Math.random() * 4) + 2; // 2-5 tours
        breakdown.push(`😴 ${targetName} s'est endormi pour ${newState.sleepTurns} tours !`);
        break;
      case "burn":
        breakdown.push(`🔥 ${targetName} est brûlé ! (-1/16 HP par tour, ATK -50%)`);
        break;
      case "poison":
        breakdown.push(`☠️ ${targetName} est empoisonné ! (-1/8 HP par tour)`);
        break;
      case "paralysis":
        breakdown.push(`⚡ ${targetName} est paralysé ! (Speed -50%, 25% immobilisation)`);
        break;
      case "freeze":
        breakdown.push(`❄️ ${targetName} est gelé ! (10% dégel par tour)`);
        break;
    }

    return {
      newState,
      result: {
        success: true,
        status: newStatus,
        message: `${targetName} est ${newStatus} !`,
        breakdown
      }
    };
  }

  /**
   * Applique un statut volatile
   */
  applyVolatileStatus(
    currentState: StatusState,
    volatileStatus: VolatileStatus,
    targetName: string
  ): { newState: StatusState; result: StatusApplicationResult } {
    const breakdown: string[] = [];
    const newState = { ...currentState, volatileStatuses: [...currentState.volatileStatuses] };

    if (!volatileStatus) {
      return { newState: currentState, result: { success: false, status: null, message: "Pas de statut", breakdown: [] } };
    }

    // Vérifier si déjà affecté
    if (newState.volatileStatuses.includes(volatileStatus)) {
      return {
        newState: currentState,
        result: {
          success: false,
          status: volatileStatus,
          message: `${targetName} est déjà ${volatileStatus} !`,
          breakdown: [`⚠️ Déjà affecté par ${volatileStatus}`]
        }
      };
    }

    newState.volatileStatuses.push(volatileStatus);
    
    switch (volatileStatus) {
      case "confusion":
        newState.confusionTurns = Math.floor(Math.random() * 4) + 2; // 2-5 tours
        breakdown.push(`💫 ${targetName} est confus ! (33% auto-dégâts pendant ${newState.confusionTurns} tours)`);
        break;
      case "flinch":
        breakdown.push(`😨 ${targetName} a fléchi ! (passe son tour)`);
        break;
      case "infatuation":
        breakdown.push(`💕 ${targetName} est sous le charme ! (50% immobilisation)`);
        break;
      case "seeded":
        breakdown.push(`🌱 ${targetName} est parasité ! (-1/8 HP drain par tour)`);
        break;
    }

    return {
      newState,
      result: {
        success: true,
        status: volatileStatus,
        message: `${targetName} subit ${volatileStatus} !`,
        breakdown
      }
    };
  }

  /**
   * Calcule les effets en début de tour
   */
  processStartOfTurn(
    state: StatusState,
    targetMaxHp: number,
    targetName: string
  ): { newState: StatusState; effects: TurnStartEffect } {
    const breakdown: string[] = [];
    const effects: string[] = [];
    const newState = { ...state, volatileStatuses: [...state.volatileStatuses] };
    
    let damage = 0;
    let canAct = true;
    let statusCleared = false;

    // === STATUTS PRIMAIRES ===
    switch (state.primaryStatus) {
      case "sleep":
        if (state.sleepTurns && state.sleepTurns > 1) {
          newState.sleepTurns = state.sleepTurns - 1;
          canAct = false;
          effects.push("endormi");
          breakdown.push(`😴 ${targetName} dort profondément... (${newState.sleepTurns} tours restants)`);
        } else {
          newState.primaryStatus = null;
          newState.sleepTurns = undefined;
          statusCleared = true;
          effects.push("réveillé");
          breakdown.push(`☀️ ${targetName} se réveille !`);
        }
        break;

      case "freeze":
        // 10% de chance de dégeler
        if (Math.random() < 0.1) {
          newState.primaryStatus = null;
          statusCleared = true;
          effects.push("dégelé");
          breakdown.push(`🌡️ ${targetName} a dégelé !`);
        } else {
          canAct = false;
          effects.push("gelé");
          breakdown.push(`❄️ ${targetName} est gelé et ne peut pas bouger !`);
        }
        break;

      case "paralysis":
        // 25% de ne pas agir
        if (Math.random() < 0.25) {
          canAct = false;
          effects.push("paralysé");
          breakdown.push(`⚡ ${targetName} est paralysé et ne peut pas bouger !`);
        }
        break;

      case "poison":
        damage = Math.floor(targetMaxHp / 8);
        effects.push("empoisonné");
        breakdown.push(`☠️ ${targetName} souffre du poison ! (-${damage} HP)`);
        break;

      case "burn":
        damage = Math.floor(targetMaxHp / 16);
        effects.push("brûlé");
        breakdown.push(`🔥 ${targetName} souffre de la brûlure ! (-${damage} HP)`);
        break;
    }

    // === STATUTS VOLATILES ===
    if (newState.volatileStatuses.includes("flinch")) {
      canAct = false;
      effects.push("fléchi");
      breakdown.push(`😨 ${targetName} a fléchi !`);
      // Flinch ne dure qu'un tour
      newState.volatileStatuses = newState.volatileStatuses.filter(s => s !== "flinch");
    }

    if (newState.volatileStatuses.includes("confusion")) {
      if (state.confusionTurns && state.confusionTurns > 1) {
        newState.confusionTurns = state.confusionTurns - 1;
        // 33% de s'auto-infliger des dégâts
        if (Math.random() < 0.33) {
          canAct = false;
          const selfDamage = Math.floor(targetMaxHp / 8);
          damage += selfDamage;
          effects.push("auto-dégâts confusion");
          breakdown.push(`💫 ${targetName} se blesse dans sa confusion ! (-${selfDamage} HP)`);
        }
      } else {
        newState.volatileStatuses = newState.volatileStatuses.filter(s => s !== "confusion");
        newState.confusionTurns = undefined;
        effects.push("confusion terminée");
        breakdown.push(`✨ ${targetName} n'est plus confus !`);
      }
    }

    if (newState.volatileStatuses.includes("infatuation")) {
      // 50% de ne pas agir
      if (Math.random() < 0.5) {
        canAct = false;
        effects.push("immobilisé par l'amour");
        breakdown.push(`💕 ${targetName} est paralysé par l'amour !`);
      }
    }

    if (newState.volatileStatuses.includes("seeded")) {
      const drainDamage = Math.floor(targetMaxHp / 8);
      damage += drainDamage;
      effects.push("drainé");
      breakdown.push(`🌱 Leech Seed draine ${targetName} ! (-${drainDamage} HP)`);
    }

    const damagePercent = (damage / targetMaxHp) * 100;

    return {
      newState,
      effects: {
        damage,
        damagePercent: Math.round(damagePercent * 10) / 10,
        canAct,
        statusCleared,
        effects,
        breakdown
      }
    };
  }

  /**
   * Guérit un statut primaire
   */
  cureStatus(
    state: StatusState,
    targetName: string
  ): { newState: StatusState; breakdown: string[] } {
    const breakdown: string[] = [];
    const newState = { ...state, volatileStatuses: [...state.volatileStatuses] };

    if (state.primaryStatus) {
      breakdown.push(`💊 ${targetName} est guéri de ${state.primaryStatus} !`);
      newState.primaryStatus = null;
      newState.sleepTurns = undefined;
      newState.toxicCounter = undefined;
    } else {
      breakdown.push(`${targetName} n'a aucun statut à guérir`);
    }

    return { newState, breakdown };
  }

  /**
   * Analyse le statut d'un Pokémon
   */
  analyzeStatus(
    state: StatusState,
    targetTypes: string[],
    targetName: string
  ): StatusAnalysis {
    const breakdown: string[] = [`📋 Analyse de statut de ${targetName}:`];
    const immunities: string[] = [];
    const vulnerabilities: string[] = [];

    // Statut actuel
    if (state.primaryStatus) {
      breakdown.push(`   Statut actuel: ${state.primaryStatus}`);
      if (state.sleepTurns) {
        breakdown.push(`   Tours de sommeil restants: ${state.sleepTurns}`);
      }
    } else {
      breakdown.push(`   Aucun statut primaire`);
    }

    if (state.volatileStatuses.length > 0) {
      breakdown.push(`   Statuts volatiles: ${state.volatileStatuses.join(", ")}`);
    }

    // Immunités selon les types
    const possibleStatuses: ("burn" | "poison" | "paralysis" | "freeze" | "sleep")[] = ["burn", "poison", "paralysis", "freeze", "sleep"];
    possibleStatuses.forEach(status => {
      const immunity = this.checkImmunity(targetTypes, status);
      if (immunity.isImmune) {
        immunities.push(`${status} (${immunity.reason})`);
      } else {
        vulnerabilities.push(status as string);
      }
    });

    if (immunities.length > 0) {
      breakdown.push(`   🛡️ Immunités: ${immunities.join(", ")}`);
    }
    breakdown.push(`   ⚠️ Vulnérable à: ${vulnerabilities.join(", ")}`);

    const canReceiveStatus = state.primaryStatus === null;
    breakdown.push(`   ${canReceiveStatus ? "✅ Peut recevoir un statut" : "❌ A déjà un statut"}`);

    return {
      targetName,
      currentStatus: state.primaryStatus,
      volatileStatuses: state.volatileStatuses,
      turnsRemaining: state.sleepTurns,
      canReceiveStatus,
      immunities: immunities.map(i => i.split(" ")[0]),
      vulnerabilities,
      breakdown
    };
  }

  /**
   * Évalue la valeur stratégique d'infliger un statut
   */
  evaluateStatusValue(
    status: PrimaryStatus,
    targetTypes: string[],
    targetRole: "attacker" | "defender" | "sweeper" | "tank" | "support",
    targetCurrentHpPercent: number
  ): { value: number; reasoning: string[]; breakdown: string[] } {
    const breakdown: string[] = [];
    const reasoning: string[] = [];
    let value = 50; // Base

    // Vérifier immunité
    const immunity = this.checkImmunity(targetTypes, status);
    if (immunity.isImmune) {
      return {
        value: 0,
        reasoning: [`Immunité: ${immunity.reason}`],
        breakdown: [`❌ Valeur: 0 - ${immunity.reason}`]
      };
    }

    switch (status) {
      case "burn":
        if (targetRole === "attacker" || targetRole === "sweeper") {
          value += 30;
          reasoning.push("Brûlure très efficace contre les attaquants physiques");
        }
        // Moins utile si HP bas (KO bientôt)
        if (targetCurrentHpPercent < 30) {
          value -= 20;
          reasoning.push("HP bas - mieux vaut KO directement");
        }
        break;

      case "poison":
        if (targetRole === "tank" || targetRole === "defender") {
          value += 25;
          reasoning.push("Poison excellent contre les tanks à gros HP");
        }
        if (targetCurrentHpPercent > 70) {
          value += 15;
          reasoning.push("HP élevé - le poison a le temps d'agir");
        }
        break;

      case "paralysis":
        if (targetRole === "sweeper") {
          value += 40;
          reasoning.push("Paralysie neutralise les sweepers rapides");
        }
        break;

      case "sleep":
        value += 35;
        reasoning.push("Sleep est toujours très fort (désactive le Pokémon)");
        break;

      case "freeze":
        value += 40;
        reasoning.push("Freeze est le meilleur statut (difficile à enlever)");
        break;
    }

    breakdown.push(`📊 Valeur de ${status} contre ${targetRole}: ${value}/100`);
    reasoning.forEach(r => breakdown.push(`   - ${r}`));

    return { value, reasoning, breakdown };
  }
}
