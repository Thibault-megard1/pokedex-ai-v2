/**
 * LangChain Tools - Battle Engine
 * 
 * Outils LangChain pour les décisions de combat Pokémon.
 * Utilise le pattern @tool de LangChain avec ChatMistralAI.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getTypeEffectiveness } from "../shared/types";

// ============================================================================
// SCHEMAS ZOD POUR VALIDATION
// ============================================================================

const MoveSchema = z.object({
  name: z.string(),
  type: z.string(),
  power: z.number(),
  accuracy: z.number(),
  category: z.enum(["physical", "special", "status"]),
  pp: z.number().optional(),
  effect: z.string().optional()
});

const BattlePokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  types: z.array(z.string()),
  currentHp: z.number(),
  maxHp: z.number(),
  stats: z.object({
    attack: z.number(),
    defense: z.number(),
    spAtk: z.number(),
    spDef: z.number(),
    speed: z.number()
  }),
  moves: z.array(MoveSchema),
  status: z.string().optional(),
  statStages: z.object({
    attack: z.number(),
    defense: z.number(),
    spAtk: z.number(),
    spDef: z.number(),
    speed: z.number()
  }).optional()
});

// ============================================================================
// DAMAGE CALCULATOR TOOL
// ============================================================================

/**
 * Calcule les dégâts d'une attaque
 */
export const damageCalculatorTool = tool(
  async (input: {
    attacker: z.infer<typeof BattlePokemonSchema>;
    defender: z.infer<typeof BattlePokemonSchema>;
    move: z.infer<typeof MoveSchema>;
  }) => {
    const { attacker, defender, move } = input;
    
    if (move.category === "status") {
      return JSON.stringify({
        damage: 0,
        minDamage: 0,
        maxDamage: 0,
        effectiveness: 1,
        isStatus: true
      });
    }
    
    // Stats d'attaque et défense selon la catégorie
    const attackStat = move.category === "physical" 
      ? attacker.stats.attack 
      : attacker.stats.spAtk;
    const defenseStat = move.category === "physical"
      ? defender.stats.defense
      : defender.stats.spDef;
    
    // Modificateurs de stages
    const atkStage = attacker.statStages?.[move.category === "physical" ? "attack" : "spAtk"] || 0;
    const defStage = defender.statStages?.[move.category === "physical" ? "defense" : "spDef"] || 0;
    
    const stageMultiplier = (stage: number) => {
      if (stage >= 0) return (2 + stage) / 2;
      return 2 / (2 - stage);
    };
    
    const effectiveAtk = attackStat * stageMultiplier(atkStage);
    const effectiveDef = defenseStat * stageMultiplier(defStage);
    
    // Formule de dégâts Pokémon (simplifiée)
    const level = 50;
    let baseDamage = ((2 * level / 5 + 2) * move.power * effectiveAtk / effectiveDef) / 50 + 2;
    
    // STAB (Same Type Attack Bonus)
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;
    baseDamage *= stab;
    
    // Efficacité de type
    const effectiveness = getTypeEffectiveness(move.type, defender.types);
    baseDamage *= effectiveness;
    
    // Random factor (0.85 à 1.0)
    const minDamage = Math.floor(baseDamage * 0.85);
    const maxDamage = Math.floor(baseDamage);
    const avgDamage = Math.floor((minDamage + maxDamage) / 2);
    
    // Chance de KO
    const koChance = maxDamage >= defender.currentHp ? 1 : 
                     minDamage >= defender.currentHp ? 1 :
                     avgDamage >= defender.currentHp ? 0.5 : 0;
    
    return JSON.stringify({
      damage: avgDamage,
      minDamage,
      maxDamage,
      effectiveness,
      stab: stab > 1,
      koChance,
      isSuperEffective: effectiveness > 1,
      isNotVeryEffective: effectiveness < 1 && effectiveness > 0,
      isImmune: effectiveness === 0
    });
  },
  {
    name: "damage_calculator",
    description: "Calcule les dégâts d'une attaque Pokémon en tenant compte des types, stats, STAB et stages.",
    schema: z.object({
      attacker: BattlePokemonSchema.describe("Le Pokémon attaquant"),
      defender: BattlePokemonSchema.describe("Le Pokémon défenseur"),
      move: MoveSchema.describe("L'attaque utilisée")
    })
  }
);

// ============================================================================
// SPEED COMPARATOR TOOL
// ============================================================================

/**
 * Compare la vitesse de deux Pokémon pour déterminer l'ordre d'attaque
 */
export const speedComparatorTool = tool(
  async (input: {
    pokemon1: z.infer<typeof BattlePokemonSchema>;
    pokemon2: z.infer<typeof BattlePokemonSchema>;
  }) => {
    const { pokemon1, pokemon2 } = input;
    
    const stageMultiplier = (stage: number) => {
      if (stage >= 0) return (2 + stage) / 2;
      return 2 / (2 - stage);
    };
    
    // Vitesse effective avec stages
    const speed1 = pokemon1.stats.speed * stageMultiplier(pokemon1.statStages?.speed || 0);
    const speed2 = pokemon2.stats.speed * stageMultiplier(pokemon2.statStages?.speed || 0);
    
    // Effets de statut sur la vitesse
    let effectiveSpeed1 = speed1;
    let effectiveSpeed2 = speed2;
    
    if (pokemon1.status === "paralysis") {
      effectiveSpeed1 *= 0.5;
    }
    if (pokemon2.status === "paralysis") {
      effectiveSpeed2 *= 0.5;
    }
    
    const firstAttacker = effectiveSpeed1 >= effectiveSpeed2 ? pokemon1.name : pokemon2.name;
    const speedTie = effectiveSpeed1 === effectiveSpeed2;
    
    return JSON.stringify({
      firstAttacker,
      speedTie,
      speeds: {
        [pokemon1.name]: Math.floor(effectiveSpeed1),
        [pokemon2.name]: Math.floor(effectiveSpeed2)
      },
      difference: Math.abs(effectiveSpeed1 - effectiveSpeed2)
    });
  },
  {
    name: "speed_comparator",
    description: "Compare la vitesse de deux Pokémon pour déterminer qui attaque en premier.",
    schema: z.object({
      pokemon1: BattlePokemonSchema.describe("Premier Pokémon"),
      pokemon2: BattlePokemonSchema.describe("Deuxième Pokémon")
    })
  }
);

// ============================================================================
// STATUS EFFECT TOOL
// ============================================================================

/**
 * Évalue les effets de statut et leur impact
 */
export const statusEffectTool = tool(
  async (input: {
    pokemon: z.infer<typeof BattlePokemonSchema>;
  }) => {
    const { pokemon } = input;
    
    const effects: Record<string, any> = {};
    let canMove = true;
    let damagePerTurn = 0;
    
    switch (pokemon.status) {
      case "paralysis":
        effects.paralysis = {
          cantMoveChance: 0.25,
          speedReduction: 0.5
        };
        canMove = Math.random() > 0.25;
        break;
        
      case "burn":
        effects.burn = {
          attackReduction: 0.5,
          damagePerTurn: Math.floor(pokemon.maxHp / 16)
        };
        damagePerTurn = Math.floor(pokemon.maxHp / 16);
        break;
        
      case "poison":
        effects.poison = {
          damagePerTurn: Math.floor(pokemon.maxHp / 8)
        };
        damagePerTurn = Math.floor(pokemon.maxHp / 8);
        break;
        
      case "toxic":
        effects.toxic = {
          escalatingDamage: true,
          initialDamage: Math.floor(pokemon.maxHp / 16)
        };
        damagePerTurn = Math.floor(pokemon.maxHp / 16);
        break;
        
      case "sleep":
        effects.sleep = {
          cantMove: true,
          wakeChance: 0.33
        };
        canMove = false;
        break;
        
      case "freeze":
        effects.freeze = {
          cantMove: true,
          thawChance: 0.20
        };
        canMove = false;
        break;
    }
    
    return JSON.stringify({
      status: pokemon.status || "none",
      canMove,
      damagePerTurn,
      effects,
      turnsRemaining: pokemon.status ? "unknown" : 0
    });
  },
  {
    name: "status_effect",
    description: "Évalue les effets de statut d'un Pokémon (paralysis, burn, poison, sleep, freeze).",
    schema: z.object({
      pokemon: BattlePokemonSchema.describe("Le Pokémon à analyser")
    })
  }
);

// ============================================================================
// BATTLE DECISION TOOL
// ============================================================================

/**
 * Prend la meilleure décision de combat
 */
export const battleDecisionTool = tool(
  async (input: {
    myPokemon: z.infer<typeof BattlePokemonSchema>;
    opponentPokemon: z.infer<typeof BattlePokemonSchema>;
    myTeam: z.infer<typeof BattlePokemonSchema>[];
  }) => {
    const { myPokemon, opponentPokemon, myTeam } = input;
    
    // Évaluer chaque move
    const moveScores: Array<{
      moveIndex: number;
      moveName: string;
      score: number;
      damage: number;
      reasoning: string;
    }> = [];
    
    for (let i = 0; i < myPokemon.moves.length; i++) {
      const move = myPokemon.moves[i];
      let score = 0;
      let damage = 0;
      const reasons: string[] = [];
      
      if (move.category !== "status") {
        // Calcul des dégâts
        const attackStat = move.category === "physical" 
          ? myPokemon.stats.attack 
          : myPokemon.stats.spAtk;
        const defenseStat = move.category === "physical"
          ? opponentPokemon.stats.defense
          : opponentPokemon.stats.spDef;
        
        let baseDamage = ((2 * 50 / 5 + 2) * move.power * attackStat / defenseStat) / 50 + 2;
        
        // STAB
        if (myPokemon.types.includes(move.type)) {
          baseDamage *= 1.5;
          reasons.push("STAB");
        }
        
        // Type effectiveness
        const effectiveness = getTypeEffectiveness(move.type, opponentPokemon.types);
        baseDamage *= effectiveness;
        
        damage = Math.floor(baseDamage);
        
        // Score basé sur les dégâts
        score = damage * 0.5;
        
        // Bonus KO
        if (damage >= opponentPokemon.currentHp) {
          score += 150;
          reasons.push("KO possible");
        }
        
        // Bonus type
        if (effectiveness > 1) {
          score += effectiveness === 4 ? 100 : 50;
          reasons.push(`Super efficace x${effectiveness}`);
        } else if (effectiveness < 1) {
          score -= effectiveness === 0 ? 100 : 30;
          if (effectiveness === 0) reasons.push("Immunité!");
          else reasons.push("Peu efficace");
        }
        
        // Malus précision
        score -= (100 - move.accuracy) * 0.5;
        if (move.accuracy < 100) {
          reasons.push(`Précision ${move.accuracy}%`);
        }
      } else {
        // Moves de statut
        score = 60;
        if (move.name.toLowerCase().includes("dance") || 
            move.name.toLowerCase().includes("boost")) {
          score = 70;
          reasons.push("Setup move");
        }
        if (move.effect?.includes("paralyze")) {
          score = 80;
          reasons.push("Paralyser l'adversaire");
        }
        if (move.effect?.includes("sleep")) {
          score = 90;
          reasons.push("Endormir l'adversaire");
        }
      }
      
      moveScores.push({
        moveIndex: i,
        moveName: move.name,
        score: Math.round(score),
        damage,
        reasoning: reasons.join(", ") || "Choix standard"
      });
    }
    
    // Trier par score
    moveScores.sort((a, b) => b.score - a.score);
    const bestMove = moveScores[0];
    
    // Vérifier si switch est meilleur
    let shouldSwitch = false;
    let switchTarget: string | null = null;
    
    // Si très désavantageux (aucun move > 30 points)
    if (bestMove.score < 30 && myTeam.length > 1) {
      const aliveTeam = myTeam.filter(p => p.currentHp > 0 && p.name !== myPokemon.name);
      
      for (const pokemon of aliveTeam) {
        // Vérifier si meilleur matchup
        let hasAdvantage = false;
        for (const type of pokemon.types) {
          if (getTypeEffectiveness(type, opponentPokemon.types) > 1) {
            hasAdvantage = true;
            break;
          }
        }
        
        if (hasAdvantage) {
          shouldSwitch = true;
          switchTarget = pokemon.name;
          break;
        }
      }
    }
    
    return JSON.stringify({
      decision: shouldSwitch ? {
        action: "switch",
        target: switchTarget,
        reasoning: "Meilleur matchup disponible"
      } : {
        action: "attack",
        moveIndex: bestMove.moveIndex,
        moveName: bestMove.moveName,
        damage: bestMove.damage,
        reasoning: bestMove.reasoning
      },
      moveScores: moveScores.slice(0, 4),
      shouldSwitch,
      confidence: bestMove.score > 100 ? "high" : bestMove.score > 50 ? "medium" : "low"
    });
  },
  {
    name: "battle_decision",
    description: "Prend la meilleure décision de combat (attaquer ou switch) en analysant tous les moves et le matchup.",
    schema: z.object({
      myPokemon: BattlePokemonSchema.describe("Mon Pokémon actif"),
      opponentPokemon: BattlePokemonSchema.describe("Le Pokémon adverse"),
      myTeam: z.array(BattlePokemonSchema).describe("Mon équipe complète")
    })
  }
);

// ============================================================================
// WIN PROBABILITY TOOL
// ============================================================================

/**
 * Calcule la probabilité de victoire
 */
export const winProbabilityTool = tool(
  async (input: {
    myTeam: z.infer<typeof BattlePokemonSchema>[];
    opponentTeam: z.infer<typeof BattlePokemonSchema>[];
  }) => {
    const { myTeam, opponentTeam } = input;
    
    // HP totaux restants
    const myTotalHp = myTeam.reduce((acc, p) => acc + p.currentHp, 0);
    const oppTotalHp = opponentTeam.reduce((acc, p) => acc + p.currentHp, 0);
    
    // Pokémon vivants
    const myAlive = myTeam.filter(p => p.currentHp > 0).length;
    const oppAlive = opponentTeam.filter(p => p.currentHp > 0).length;
    
    // Stats moyennes
    const myAvgStats = myTeam.reduce((acc, p) => 
      acc + p.stats.attack + p.stats.spAtk + p.stats.speed, 0) / myTeam.length;
    const oppAvgStats = opponentTeam.reduce((acc, p) => 
      acc + p.stats.attack + p.stats.spAtk + p.stats.speed, 0) / opponentTeam.length;
    
    // Calcul de probabilité
    let winProb = 0.5;
    
    // Avantage HP
    const hpRatio = myTotalHp / (myTotalHp + oppTotalHp);
    winProb += (hpRatio - 0.5) * 0.4;
    
    // Avantage nombre
    const aliveRatio = myAlive / (myAlive + oppAlive);
    winProb += (aliveRatio - 0.5) * 0.3;
    
    // Avantage stats
    const statsRatio = myAvgStats / (myAvgStats + oppAvgStats);
    winProb += (statsRatio - 0.5) * 0.3;
    
    winProb = Math.max(0.01, Math.min(0.99, winProb));
    
    return JSON.stringify({
      winProbability: Math.round(winProb * 100),
      factors: {
        hpAdvantage: Math.round((hpRatio - 0.5) * 100),
        numberAdvantage: Math.round((aliveRatio - 0.5) * 100),
        statsAdvantage: Math.round((statsRatio - 0.5) * 100)
      },
      myState: {
        alive: myAlive,
        totalHp: myTotalHp
      },
      opponentState: {
        alive: oppAlive,
        totalHp: oppTotalHp
      },
      prediction: winProb > 0.6 ? "favorable" : winProb < 0.4 ? "défavorable" : "équilibré"
    });
  },
  {
    name: "win_probability",
    description: "Calcule la probabilité de victoire en comparant les deux équipes.",
    schema: z.object({
      myTeam: z.array(BattlePokemonSchema).describe("Mon équipe"),
      opponentTeam: z.array(BattlePokemonSchema).describe("L'équipe adverse")
    })
  }
);

// ============================================================================
// EXPORT ALL TOOLS
// ============================================================================

export const battleTools = [
  damageCalculatorTool,
  speedComparatorTool,
  statusEffectTool,
  battleDecisionTool,
  winProbabilityTool
];
