// Pokémon Move System
// Handles move learnsets, selection, and data retrieval

export type StatusCondition = 
  | 'burn' 
  | 'paralysis' 
  | 'poison' 
  | 'sleep' 
  | 'freeze'
  | 'badly-poisoned' // Toxic - damage increases each turn
  | 'confusion' // May hurt itself
  | 'flinch' // Skip one turn (temporary)
  | 'leech-seed' // Drains HP each turn
  | 'curse' // Ghost-type curse
  | 'trap' // Wrap, Bind, etc. - damage + can't escape
  | null;

export interface StatChange {
  stat: 'attack' | 'defense' | 'speed';
  stages: number; // -6 to +6
}

export interface MoveEffect {
  statusCondition?: StatusCondition;
  statChanges?: StatChange[];
  chance?: number; // 0-100, probability of effect triggering
  target?: 'self' | 'opponent';
}

export interface BattleMove {
  name: string;
  type: string;
  category: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number | null;
  pp: number;
  maxPp: number;
  learnLevel: number;
  effect?: MoveEffect; // NEW: Status effects and stat changes
}

export interface MoveLearnset {
  pokemonId: number;
  moves: BattleMove[];
}

// Cache for move data to avoid repeated API calls
const moveDataCache = new Map<string, any>();
const learnsetCache = new Map<number, MoveLearnset>();

/**
 * Fetch move details from PokéAPI
 */
async function fetchMoveDetails(moveName: string): Promise<BattleMove | null> {
  try {
    // Check cache first
    if (moveDataCache.has(moveName)) {
      return moveDataCache.get(moveName);
    }

    const response = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
    if (!response.ok) {
      console.warn(`[MoveSystem] Failed to fetch move: ${moveName}`);
      return null;
    }

    const data = await response.json();
    
    // Extract status effects and stat changes
    const effect: MoveEffect = {};
    
    // Check for status ailment
    if (data.meta?.ailment?.name && data.meta.ailment.name !== 'none') {
      const ailment = data.meta.ailment.name;
      const validAilments = [
        'burn', 'paralysis', 'poison', 'sleep', 'freeze',
        'badly-poisoned', 'confusion', 'flinch', 'leech-seed', 
        'curse', 'trap'
      ];
      
      if (validAilments.includes(ailment)) {
        effect.statusCondition = ailment as StatusCondition;
        effect.chance = data.meta.ailment_chance || 100;
        effect.target = 'opponent';
      }
      
      // Special handling for specific move names
      if (data.name === 'toxic') {
        effect.statusCondition = 'badly-poisoned';
      } else if (data.name.includes('leech-seed')) {
        effect.statusCondition = 'leech-seed';
      }
    }
    
    // Check for stat changes
    if (data.stat_changes && data.stat_changes.length > 0) {
      effect.statChanges = [];
      for (const statChange of data.stat_changes) {
        const statName = statChange.stat?.name;
        if (['attack', 'defense', 'speed'].includes(statName)) {
          effect.statChanges.push({
            stat: statName as 'attack' | 'defense' | 'speed',
            stages: statChange.change || 0,
          });
        }
      }
      // Determine target (self-buff or opponent debuff)
      effect.target = effect.statChanges.some(sc => sc.stages > 0) ? 'self' : 'opponent';
      effect.chance = 100; // Stat changes usually always happen
    }
    
    const moveData: BattleMove = {
      name: formatMoveName(data.name),
      type: data.type?.name ?? 'normal',
      category: data.damage_class?.name ?? 'status',
      power: data.power ?? null,
      accuracy: data.accuracy ?? null,
      pp: data.pp ?? 10,
      maxPp: data.pp ?? 10,
      learnLevel: 0, // Will be set by learnset
      effect: Object.keys(effect).length > 0 ? effect : undefined,
    };

    moveDataCache.set(moveName, moveData);
    return moveData;
  } catch (error) {
    console.error(`[MoveSystem] Error fetching move ${moveName}:`, error);
    return null;
  }
}

/**
 * Format move name for display (kebab-case to Title Case)
 */
function formatMoveName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetch Pokémon learnset from PokéAPI
 * Returns ONLY level-up moves
 */
export async function fetchPokemonLearnset(pokemonId: number): Promise<MoveLearnset> {
  try {
    // Check cache first
    if (learnsetCache.has(pokemonId)) {
      return learnsetCache.get(pokemonId)!;
    }

    console.log(`[MoveSystem] Fetching learnset for Pokémon #${pokemonId}`);

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Pokémon #${pokemonId}`);
    }

    const pokemon = await response.json();
    const levelUpMoves: { name: string; level: number }[] = [];

    // Extract level-up moves only
    if (pokemon.moves && Array.isArray(pokemon.moves)) {
      for (const moveEntry of pokemon.moves) {
        const moveName = moveEntry.move?.name;
        if (!moveName) continue;

        // Check version details for level-up method
        for (const versionDetail of moveEntry.version_group_details ?? []) {
          const method = versionDetail.move_learn_method?.name;
          const level = versionDetail.level_learned_at ?? 0;

          if (method === 'level-up' && level >= 0) {
            levelUpMoves.push({ name: moveName, level });
            break; // Only need one version per move
          }
        }
      }
    }

    // Fetch details for all moves in parallel
    const moveDetailsPromises = levelUpMoves.map(async ({ name, level }) => {
      const details = await fetchMoveDetails(name);
      if (details) {
        details.learnLevel = level;
        return details;
      }
      return null;
    });

    const moves = (await Promise.all(moveDetailsPromises))
      .filter((move): move is BattleMove => move !== null)
      .sort((a, b) => a.learnLevel - b.learnLevel); // Sort by learn level

    const learnset: MoveLearnset = { pokemonId, moves };
    learnsetCache.set(pokemonId, learnset);

    console.log(`[MoveSystem] Loaded ${moves.length} level-up moves for Pokémon #${pokemonId}`);
    return learnset;
  } catch (error) {
    console.error(`[MoveSystem] Error fetching learnset for Pokémon #${pokemonId}:`, error);
    // Return fallback moves
    return getFallbackLearnset(pokemonId);
  }
}

/**
 * Select moves for a Pokémon based on its level
 * Returns the LAST 4 moves the Pokémon can learn at its current level
 */
export function selectMovesForLevel(learnset: MoveLearnset, level: number): BattleMove[] {
  // Filter moves that can be learned at this level
  const availableMoves = learnset.moves.filter(move => move.learnLevel <= level);

  if (availableMoves.length === 0) {
    console.warn(`[MoveSystem] No moves available for Pokémon #${learnset.pokemonId} at level ${level}, using fallback`);
    return getFallbackMoves();
  }

  // Return the last 4 moves (most recently learned)
  const selectedMoves = availableMoves.slice(-4);
  
  // Reset PP to max for each move
  selectedMoves.forEach(move => {
    move.pp = move.maxPp;
  });

  console.log(`[MoveSystem] Selected moves for Pokémon #${learnset.pokemonId} Lv.${level}:`, 
    selectedMoves.map(m => `${m.name} (Lv.${m.learnLevel})`));

  return selectedMoves;
}

/**
 * Get fallback learnset if API fails
 */
function getFallbackLearnset(pokemonId: number): MoveLearnset {
  console.warn(`[MoveSystem] Using fallback learnset for Pokémon #${pokemonId}`);
  return {
    pokemonId,
    moves: getFallbackMoves(),
  };
}

/**
 * Fallback moves if no data is available
 */
function getFallbackMoves(): BattleMove[] {
  return [
    {
      name: 'Tackle',
      type: 'normal',
      category: 'physical',
      power: 40,
      accuracy: 100,
      pp: 35,
      maxPp: 35,
      learnLevel: 1,
    },
    {
      name: 'Growl',
      type: 'normal',
      category: 'status',
      power: null,
      accuracy: 100,
      pp: 40,
      maxPp: 40,
      learnLevel: 1,
      effect: {
        statChanges: [{ stat: 'attack', stages: -1 }],
        target: 'opponent',
        chance: 100,
      },
    },
  ];
}

/**
 * Get a random move from the moveset (for enemy AI)
 */
export function selectRandomMove(moves: BattleMove[]): BattleMove {
  // Filter out moves with 0 PP
  const usableMoves = moves.filter(move => move.pp > 0);
  
  if (usableMoves.length === 0) {
    console.warn('[MoveSystem] No usable moves, returning Struggle');
    return {
      name: 'Struggle',
      type: 'normal',
      category: 'physical',
      power: 50,
      accuracy: 100,
      pp: 1,
      maxPp: 1,
      learnLevel: 0,
    };
  }

  const randomIndex = Math.floor(Math.random() * usableMoves.length);
  return usableMoves[randomIndex];
}

/**
 * Calculate damage based on move and Pokémon stats
 * Enhanced damage formula with higher output
 */
export function calculateMoveDamage(
  attackerLevel: number,
  attackerAttack: number,
  defenderDefense: number,
  move: BattleMove,
  typeEffectiveness: number = 1.0,
  attackerStatStage: number = 0, // -6 to +6
  defenderStatStage: number = 0  // -6 to +6
): number {
  // Status moves deal no damage
  if (move.category === 'status' || move.power === null) {
    return 0;
  }

  // Apply stat stage multipliers (2x at +6, 0.5x at -6)
  const attackMultiplier = Math.max(0.25, 1 + (attackerStatStage * 0.25));
  const defenseMultiplier = Math.max(0.25, 1 + (defenderStatStage * 0.25));
  
  const effectiveAttack = attackerAttack * attackMultiplier;
  const effectiveDefense = defenderDefense / defenseMultiplier;

  // Enhanced damage formula (2.5x base multiplier for higher damage)
  const baseDamage = ((2 * attackerLevel / 5 + 2) * move.power * (effectiveAttack / effectiveDefense)) / 50 + 2;
  const enhancedDamage = baseDamage * 2.5; // INCREASED DAMAGE
  
  // Apply type effectiveness
  const finalDamage = Math.floor(enhancedDamage * typeEffectiveness);
  
  // Add random factor (85-100%)
  const randomFactor = 0.85 + Math.random() * 0.15;
  
  return Math.max(1, Math.floor(finalDamage * randomFactor));
}

/**
 * Calculate stage multiplier for stat changes
 * Stages range from -6 to +6
 */
export function getStatStageMultiplier(stage: number): number {
  stage = Math.max(-6, Math.min(6, stage)); // Clamp to -6...+6
  if (stage >= 0) {
    return (2 + stage) / 2;
  } else {
    return 2 / (2 - stage);
  }
}

/**
 * Get status condition display name
 */
export function getStatusName(status: StatusCondition): string {
  if (!status) return '';
  const names: Record<string, string> = {
    burn: 'BRN',
    paralysis: 'PAR',
    poison: 'PSN',
    sleep: 'SLP',
    freeze: 'FRZ',
    'badly-poisoned': 'TOX',
    confusion: 'CNF',
    flinch: 'FLN',
    'leech-seed': 'SED',
    curse: 'CRS',
    trap: 'TRP',
  };
  return names[status] || '';
}

/**
 * Get status condition color
 */
export function getStatusColor(status: StatusCondition): number {
  if (!status) return 0xffffff;
  const colors: Record<string, number> = {
    burn: 0xff6b00,       // Orange
    paralysis: 0xffd700,  // Yellow
    poison: 0x9333ea,     // Purple
    sleep: 0x6b7280,      // Gray
    freeze: 0x60a5fa,     // Blue
    'badly-poisoned': 0xa855f7, // Dark Purple
    confusion: 0xf59e0b,  // Amber
    flinch: 0x94a3b8,     // Slate
    'leech-seed': 0x22c55e, // Green
    curse: 0x7c3aed,      // Violet
    trap: 0x78716c,       // Stone
  };
  return colors[status] || 0xffffff;
}

/**
 * Check if move effect triggers (based on chance)
 */
export function checkEffectTrigger(effect?: MoveEffect): boolean {
  if (!effect || !effect.chance) return false;
  return Math.random() * 100 < effect.chance;
}

/**
 * Calculate end-of-turn status damage
 * Returns damage amount and optional message
 */
export function calculateStatusDamage(
  pokemon: { hp: number; maxHp: number; statusCondition: StatusCondition; level?: number },
  turnCount: number = 0
): { damage: number; message: string } {
  if (!pokemon.statusCondition) {
    return { damage: 0, message: '' };
  }

  const maxHp = pokemon.maxHp;
  let damage = 0;
  let message = '';

  switch (pokemon.statusCondition) {
    case 'burn':
      damage = Math.floor(maxHp / 16); // 1/16 of max HP
      message = 'hurt by its burn!';
      break;

    case 'poison':
      damage = Math.floor(maxHp / 8); // 1/8 of max HP
      message = 'hurt by poison!';
      break;

    case 'badly-poisoned':
      // Toxic: increases damage each turn (1/16, 2/16, 3/16...)
      damage = Math.floor((maxHp * (turnCount + 1)) / 16);
      damage = Math.min(damage, Math.floor(maxHp / 2)); // Cap at 50%
      message = 'badly poisoned!';
      break;

    case 'leech-seed':
      damage = Math.floor(maxHp / 8); // 1/8 of max HP drained
      message = 'hurt by Leech Seed!';
      break;

    case 'curse':
      damage = Math.floor(maxHp / 4); // 1/4 of max HP
      message = 'afflicted by the curse!';
      break;

    case 'trap':
      damage = Math.floor(maxHp / 8); // 1/8 of max HP
      message = 'hurt by the trap!';
      break;

    case 'confusion':
      // No passive damage, but may hurt itself when attacking
      message = 'is confused!';
      break;

    case 'sleep':
    case 'freeze':
    case 'paralysis':
    case 'flinch':
      // No passive damage
      break;
  }

  return { damage, message };
}

/**
 * Check if Pokémon can act this turn (considering status)
 * Returns { canAct: boolean, message: string }
 */
export function canPokemonAct(pokemon: {
  statusCondition: StatusCondition;
  name: string;
}): { canAct: boolean; message: string; removeStatus?: boolean } {
  if (!pokemon.statusCondition) {
    return { canAct: true, message: '' };
  }

  switch (pokemon.statusCondition) {
    case 'sleep':
      // 1-3 turns of sleep (simplified: 33% chance to wake up each turn)
      if (Math.random() < 0.33) {
        return {
          canAct: true,
          message: `${pokemon.name} woke up!`,
          removeStatus: true,
        };
      }
      return { canAct: false, message: `${pokemon.name} is fast asleep!` };

    case 'freeze':
      // 20% chance to thaw each turn
      if (Math.random() < 0.2) {
        return {
          canAct: true,
          message: `${pokemon.name} thawed out!`,
          removeStatus: true,
        };
      }
      return { canAct: false, message: `${pokemon.name} is frozen solid!` };

    case 'paralysis':
      // 25% chance to be fully paralyzed
      if (Math.random() < 0.25) {
        return { canAct: false, message: `${pokemon.name} is paralyzed! It can't move!` };
      }
      return { canAct: true, message: '' };

    case 'flinch':
      // Flinch only lasts one turn
      return {
        canAct: false,
        message: `${pokemon.name} flinched!`,
        removeStatus: true,
      };

    case 'confusion':
      // 50% chance to hit itself (33% of attack power as damage)
      if (Math.random() < 0.5) {
        return {
          canAct: false,
          message: `${pokemon.name} hurt itself in its confusion!`,
        };
      }
      // 33% chance to snap out of confusion
      if (Math.random() < 0.33) {
        return {
          canAct: true,
          message: `${pokemon.name} snapped out of confusion!`,
          removeStatus: true,
        };
      }
      return { canAct: true, message: '' };

    default:
      return { canAct: true, message: '' };
  }
}

/**
 * Preload moves for specific Pokémon IDs (for performance)
 */
export async function preloadMoves(pokemonIds: number[]): Promise<void> {
  console.log(`[MoveSystem] Preloading moves for ${pokemonIds.length} Pokémon`);
  const promises = pokemonIds.map(id => fetchPokemonLearnset(id));
  await Promise.all(promises);
  console.log('[MoveSystem] Preloading complete');
}

/**
 * Clear move cache (useful for testing or memory management)
 */
export function clearMoveCache(): void {
  moveDataCache.clear();
  learnsetCache.clear();
  console.log('[MoveSystem] Cache cleared');
}
