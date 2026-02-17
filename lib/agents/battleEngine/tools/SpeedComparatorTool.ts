/**
 * ============================================================================
 * SPEED COMPARATOR TOOL - Tool de comparaison de vitesse
 * ============================================================================
 * 
 * OBJECTIF:
 * Ce tool détermine l'ordre d'action des Pokémon pendant un tour de combat.
 * L'ordre est crucial car attaquer en premier peut faire la différence entre
 * gagner et perdre (KO avant de subir des dégâts).
 * 
 * ALGORITHME DE CALCUL DE VITESSE EFFECTIVE:
 * 1. Base Speed: statistique Speed du Pokémon (ex: 130 pour Jolteon)
 * 2. Stat Stages: multiplicateurs de -6 à +6 appliqués
 *    - +1 stage = ×1.5, +2 = ×2, +3 = ×2.5, etc.
 *    - -1 stage = ×0.66, -2 = ×0.5, etc.
 * 3. Paralysis: si paralysé, vitesse divisée par 2 (×0.5)
 * 4. Items/Abilities (non implémenté ici): Choice Scarf = ×1.5, etc.
 * 
 * ORDRE DES TOURS:
 * 1. PRIORITÉ DES MOVES (range: -7 à +5)
 *    - Exemples de priorité:
 *      * +5: Helping Hand
 *      * +4: Protect, Detect
 *      * +3: Fake Out, Extreme Speed
 *      * +2: Feint, Aqua Jet, Mach Punch
 *      * +1: Quick Attack, Bullet Punch
 *      *  0: Attaques normales (la majorité)
 *      * -1: Vital Throw
 *      * -3: Focus Punch
 *      * -6: Trick Room (attaque en dernier)
 * 2. VITESSE EFFECTIVE: si même priorité, le plus rapide attaque en premier
 * 3. TIE-BREAKER: si même vitesse ET priorité, 50/50 aléatoire
 * 
 * CAS D'USAGE:
 * - Prédire si le joueur peut KO l'adversaire avant de prendre des dégâts
 * - Décider d'utiliser une attaque prioritaire (Quick Attack) pour finir un adversaire
 * - Évaluer l'impact de la paralysie sur l'ordre des tours
 * - Choisir entre booster sa vitesse ou sa défense
 * 
 * EXEMPLE CONCRET:
 * Pikachu (Speed 90, +1 stage → 135) vs Charizard (Speed 100, paralysé → 50)
 * → Pikachu attaque en premier car 135 > 50
 * 
 * Mais si Charizard utilise Extreme Speed (+3 priority) et Pikachu Thunder (0):
 * → Charizard attaque en premier malgré sa vitesse réduite (priorité l'emporte)
 * ============================================================================
 */

export interface PokemonForSpeed {
  name: string;
  currentStats: {
    speed: number;
  };
  statStages: {
    speed: number;
  };
  statusCondition: "burn" | "poison" | "paralysis" | "sleep" | "freeze" | null;
  team: "player" | "opponent";
}

export interface MoveForSpeed {
  name: string;
  priority?: number; // -7 à +5 (0 = normal)
}

export interface SpeedComparisonResult {
  // Résultat
  firstPokemon: PokemonForSpeed;
  secondPokemon: PokemonForSpeed;
  
  // Détails
  firstEffectiveSpeed: number;
  secondEffectiveSpeed: number;
  speedDifference: number;
  wasTieBreaker: boolean;
  
  // Analyse
  breakdown: string[];
}

export interface TurnOrderResult {
  orderedPokemon: PokemonForSpeed[];
  speedDetails: Map<string, number>;
  breakdown: string[];
}

export class SpeedComparatorTool {
  /**
   * Applique le multiplicateur de stat stage (-6 à +6)
   */
  private applyStatStage(baseStat: number, stage: number): number {
    const multipliers: Record<string, number> = {
      "-6": 2/8, "-5": 2/7, "-4": 2/6, "-3": 2/5, "-2": 2/4, "-1": 2/3,
      "0": 1,
      "1": 3/2, "2": 4/2, "3": 5/2, "4": 6/2, "5": 7/2, "6": 8/2
    };
    return Math.floor(baseStat * (multipliers[stage.toString()] || 1));
  }

  /**
   * Calcule la vitesse effective d'un Pokémon
   */
  calculateEffectiveSpeed(pokemon: PokemonForSpeed): { speed: number; breakdown: string[] } {
    const breakdown: string[] = [];
    const baseSpeed = pokemon.currentStats.speed;
    const stage = pokemon.statStages.speed;
    
    // Appliquer les stat stages
    let effectiveSpeed = this.applyStatStage(baseSpeed, stage);
    breakdown.push(`🏃 ${pokemon.name}: Speed de base ${baseSpeed}`);
    
    if (stage !== 0) {
      breakdown.push(`   Stage ${stage >= 0 ? "+" : ""}${stage} → ${effectiveSpeed}`);
    }

    // Paralysie: -50% vitesse
    if (pokemon.statusCondition === "paralysis") {
      effectiveSpeed = Math.floor(effectiveSpeed * 0.5);
      breakdown.push(`   ⚡ Paralysie: vitesse réduite de 50% → ${effectiveSpeed}`);
    }

    return { speed: effectiveSpeed, breakdown };
  }

  /**
   * Compare deux Pokémon pour déterminer qui attaque en premier
   */
  compareSpeed(
    pokemon1: PokemonForSpeed,
    pokemon2: PokemonForSpeed,
    move1?: MoveForSpeed,
    move2?: MoveForSpeed
  ): SpeedComparisonResult {
    const breakdown: string[] = [];

    // 1. Vérifier la priorité des moves d'abord
    const priority1 = move1?.priority ?? 0;
    const priority2 = move2?.priority ?? 0;

    if (priority1 !== priority2) {
      const first = priority1 > priority2 ? pokemon1 : pokemon2;
      const second = priority1 > priority2 ? pokemon2 : pokemon1;
      const firstPrio = priority1 > priority2 ? priority1 : priority2;
      const secondPrio = priority1 > priority2 ? priority2 : priority1;

      breakdown.push(`⚡ Comparaison de priorité des moves:`);
      breakdown.push(`   ${first.name} (${move1?.name || "?"}) priority +${firstPrio}`);
      breakdown.push(`   ${second.name} (${move2?.name || "?"}) priority +${secondPrio}`);
      breakdown.push(`   → ${first.name} attaque en premier (priorité supérieure)`);

      return {
        firstPokemon: first,
        secondPokemon: second,
        firstEffectiveSpeed: this.calculateEffectiveSpeed(first).speed,
        secondEffectiveSpeed: this.calculateEffectiveSpeed(second).speed,
        speedDifference: Math.abs(firstPrio - secondPrio),
        wasTieBreaker: false,
        breakdown
      };
    }

    // 2. Calculer les vitesses effectives
    const speed1Result = this.calculateEffectiveSpeed(pokemon1);
    const speed2Result = this.calculateEffectiveSpeed(pokemon2);
    const speed1 = speed1Result.speed;
    const speed2 = speed2Result.speed;

    breakdown.push(`🏃 Comparaison de vitesse:`);
    breakdown.push(...speed1Result.breakdown);
    breakdown.push(...speed2Result.breakdown);

    // 3. Déterminer l'ordre
    let first: PokemonForSpeed;
    let second: PokemonForSpeed;
    let wasTieBreaker = false;

    if (speed1 !== speed2) {
      first = speed1 > speed2 ? pokemon1 : pokemon2;
      second = speed1 > speed2 ? pokemon2 : pokemon1;
      breakdown.push(`   → ${first.name} attaque en premier (${Math.max(speed1, speed2)} > ${Math.min(speed1, speed2)})`);
    } else {
      // Tie-breaker: 50/50 aléatoire
      wasTieBreaker = true;
      const random = Math.random() < 0.5;
      first = random ? pokemon1 : pokemon2;
      second = random ? pokemon2 : pokemon1;
      breakdown.push(`   ⚖️ Vitesses égales (${speed1}) - Tie-breaker aléatoire`);
      breakdown.push(`   → ${first.name} attaque en premier`);
    }

    return {
      firstPokemon: first,
      secondPokemon: second,
      firstEffectiveSpeed: speed1 > speed2 ? speed1 : speed2,
      secondEffectiveSpeed: speed1 > speed2 ? speed2 : speed1,
      speedDifference: Math.abs(speed1 - speed2),
      wasTieBreaker,
      breakdown
    };
  }

  /**
   * Détermine l'ordre de tour pour tous les Pokémon (combat multiple)
   */
  determineTurnOrder(
    pokemon: PokemonForSpeed[],
    moves?: Map<string, MoveForSpeed> // Map pokemonName -> move
  ): TurnOrderResult {
    const breakdown: string[] = [];
    const speedDetails = new Map<string, number>();

    // Calculer toutes les vitesses
    const pokemonWithSpeed = pokemon.map(p => {
      const { speed, breakdown: speedBreakdown } = this.calculateEffectiveSpeed(p);
      speedDetails.set(p.name, speed);
      breakdown.push(...speedBreakdown);
      return { pokemon: p, speed, priority: moves?.get(p.name)?.priority ?? 0 };
    });

    // Trier par priorité puis par vitesse
    pokemonWithSpeed.sort((a, b) => {
      // D'abord par priorité (décroissant)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Ensuite par vitesse (décroissant)
      if (a.speed !== b.speed) {
        return b.speed - a.speed;
      }
      // Tie-breaker aléatoire
      return Math.random() - 0.5;
    });

    breakdown.push(`\n📋 Ordre des tours:`);
    pokemonWithSpeed.forEach((p, index) => {
      const prioStr = p.priority !== 0 ? ` (priority ${p.priority >= 0 ? "+" : ""}${p.priority})` : "";
      breakdown.push(`   ${index + 1}. ${p.pokemon.name} - Speed ${p.speed}${prioStr}`);
    });

    return {
      orderedPokemon: pokemonWithSpeed.map(p => p.pokemon),
      speedDetails,
      breakdown
    };
  }

  /**
   * Vérifie si un Pokémon peut outspeed l'autre avec/sans boost
   */
  canOutspeedWith(
    slower: PokemonForSpeed,
    faster: PokemonForSpeed,
    options: {
      withAgility?: boolean; // +2 stages
      withParalysis?: boolean; // -50% sur adversaire
      withChoiceScarf?: boolean; // x1.5 vitesse
    } = {}
  ): { canOutspeed: boolean; requiredBoost: number; breakdown: string[] } {
    const breakdown: string[] = [];
    
    const slowerSpeed = this.calculateEffectiveSpeed(slower).speed;
    const fasterSpeed = this.calculateEffectiveSpeed(faster).speed;

    breakdown.push(`🔍 Analyse de dépassement:`);
    breakdown.push(`   ${slower.name}: ${slowerSpeed} speed`);
    breakdown.push(`   ${faster.name}: ${fasterSpeed} speed`);

    // Simuler les boosts
    let boostedSlowerSpeed = slowerSpeed;
    let reducedFasterSpeed = fasterSpeed;

    if (options.withAgility) {
      boostedSlowerSpeed = this.applyStatStage(slower.currentStats.speed, slower.statStages.speed + 2);
      if (slower.statusCondition === "paralysis") {
        boostedSlowerSpeed = Math.floor(boostedSlowerSpeed * 0.5);
      }
      breakdown.push(`   Avec Agility (+2): ${boostedSlowerSpeed}`);
    }

    if (options.withChoiceScarf) {
      boostedSlowerSpeed = Math.floor(boostedSlowerSpeed * 1.5);
      breakdown.push(`   Avec Choice Scarf (x1.5): ${boostedSlowerSpeed}`);
    }

    if (options.withParalysis) {
      reducedFasterSpeed = Math.floor(fasterSpeed * 0.5);
      breakdown.push(`   Adversaire paralysé: ${reducedFasterSpeed}`);
    }

    const canOutspeed = boostedSlowerSpeed > reducedFasterSpeed;
    
    // Calculer le boost requis
    let requiredBoost = 0;
    for (let boost = 1; boost <= 6; boost++) {
      const testSpeed = this.applyStatStage(slower.currentStats.speed, slower.statStages.speed + boost);
      const finalSpeed = slower.statusCondition === "paralysis" ? Math.floor(testSpeed * 0.5) : testSpeed;
      if (finalSpeed > fasterSpeed) {
        requiredBoost = boost;
        break;
      }
    }

    if (requiredBoost > 0 && requiredBoost <= 6) {
      breakdown.push(`   → Boost requis pour outspeed: +${requiredBoost} stages`);
    } else if (canOutspeed) {
      breakdown.push(`   → Peut outspeed avec les options données ✓`);
    } else {
      breakdown.push(`   → Impossible d'outspeed (même avec +6 stages)`);
    }

    return { canOutspeed, requiredBoost, breakdown };
  }
}
