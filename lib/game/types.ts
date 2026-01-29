// Game type definitions
import type { BattleMove, StatusCondition } from './moveSystem';

export interface GameSave {
  username: string;
  playerName: string;
  position: {
    x: number;
    y: number;
    map: string;
  };
  team: PlayerPokemon[];
  inventory: InventoryItem[];
  badges: string[];
  money: number;
  playTime: number; // seconds
  starterChosen: boolean;
  flags: Record<string, boolean>; // story flags
  lastSaved: string; // ISO date
}

export interface PlayerPokemon {
  id: number; // Pokédex number
  name: string;
  level: number;
  exp: number; // DEPRECATED: use xpTotal instead
  xpTotal?: number; // Total XP accumulated (recommended storage)
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  // Base stats for stat recalculation on level up
  baseHp?: number;
  baseAttack?: number;
  baseDefense?: number;
  baseSpeed?: number;
  // Move management
  moves: string[]; // Legacy support (will be migrated to battleMoves)
  battleMoves?: BattleMove[]; // NEW: Actual battle moves with full data
  isShiny?: boolean;
  nickname?: string;
  // Battle-only temporary states
  statusCondition?: StatusCondition;
  statusTurns?: number; // Counter for status effects (e.g., badly-poisoned, sleep duration)
  attackStage?: number; // -6 to +6
  defenseStage?: number; // -6 to +6
  speedStage?: number; // -6 to +6
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: 'pokeball' | 'potion' | 'key';
}

export interface NPCData {
  id: string;
  name: string;
  x: number;
  y: number;
  sprite: string;
  dialogues: string[]; // predefined dialogues
  useAI?: boolean; // use Ollama for dynamic responses
  aiContext?: string; // personality/role for AI
  onInteract?: string; // special event trigger
}

export interface MapData {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  layers: {
    ground: number[][];
    collision: number[][]; // 0 = walkable, 1 = blocked
    grass: number[][]; // 0 = none, 1 = tall grass (encounters)
  };
  npcs: NPCData[];
  warps: WarpData[];
}

export interface WarpData {
  x: number;
  y: number;
  targetMap: string;
  targetX: number;
  targetY: number;
}

export interface WildEncounter {
  pokemon: number; // Pokédex ID
  minLevel: number;
  maxLevel: number;
  chance: number; // 0-100
}

export interface BattleState {
  isActive: boolean;
  isWild: boolean;
  enemy: PlayerPokemon;
  playerPokemon: PlayerPokemon;
  turn: 'player' | 'enemy';
}

export const KEYBOARD_CONTROLS = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  INTERACT: ' ', // Space
  MENU: 'Escape',
  INVENTORY: 'KeyI',
  TEAM: 'KeyT',
  RUN: 'KeyR',
} as const;
