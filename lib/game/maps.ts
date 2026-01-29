// Map data definitions
import type { MapData, WildEncounter } from './types';

// Professor's Lab - Starting location
export const LAB_MAP: MapData = {
  name: 'lab',
  width: 10,
  height: 8,
  tileSize: 32,
  layers: {
    ground: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 3, 3, 3, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
    ],
    collision: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
    ],
    grass: Array(8).fill(Array(10).fill(0)), // No grass in lab
  },
  npcs: [
    {
      id: 'professor',
      name: 'Professor Oak',
      x: 5,
      y: 3,
      sprite: 'professor',
      dialogues: [
        "Welcome to the world of Pokémon!",
        "I'm Professor Oak. I study Pokémon for a living.",
        "But first, tell me... are you ready to begin your journey?",
      ],
      useAI: true,
      aiContext: "You are Professor Oak, a friendly Pokémon researcher. You guide new trainers and give them their first Pokémon (Bulbasaur, Charmander, or Squirtle). Be encouraging and educational.",
      onInteract: 'starter_selection',
    },
  ],
  warps: [
    { x: 4, y: 7, targetMap: 'route1', targetX: 5, targetY: 1 },
    { x: 5, y: 7, targetMap: 'route1', targetX: 5, targetY: 1 },
  ],
};

// Route 1 - First outdoor area (EXPANDED)
export const ROUTE1_MAP: MapData = {
  name: 'route1',
  width: 20,
  height: 30,
  tileSize: 32,
  layers: {
    ground: Array(30).fill(Array(20).fill(4)), // Grass ground
    collision: [
      // Top border
      ...Array(1).fill([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      // Main walkable area with side borders
      ...Array(27).fill([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
      // Path to next route
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
      // Bottom exit
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1],
    ],
    grass: Array(30)
      .fill(null)
      .map((_, y) =>
        Array(20)
          .fill(null)
          .map((_, x) => {
            // Grass patches throughout the route
            if (y > 3 && y < 26 && x > 2 && x < 17 && Math.random() > 0.5) {
              return 1;
            }
            return 0;
          })
      ),
  },
  npcs: [
    {
      id: 'npc_youngster',
      name: 'Youngster Joey',
      x: 10,
      y: 12,
      sprite: 'npc_1',
      dialogues: [
        "My Rattata is in the top percentage of Rattata!",
        "Have you seen any rare Pokémon around here?",
      ],
      useAI: true,
      aiContext: "You are a young Pokémon trainer named Joey. You're very enthusiastic about your Rattata and love battling. Be energetic and friendly.",
    },
    {
      id: 'npc_hiker',
      name: 'Hiker Mark',
      x: 8,
      y: 20,
      sprite: 'npc_2',
      dialogues: [
        "I love hiking through these routes!",
        "The fresh air and wild Pokémon make it all worthwhile.",
      ],
      useAI: true,
      aiContext: "You are a hiker who loves the outdoors. Share tips about exploring and finding Pokémon.",
    },
  ],
  warps: [
    { x: 9, y: 29, targetMap: 'lab', targetX: 5, targetY: 7 },
    { x: 10, y: 29, targetMap: 'lab', targetX: 5, targetY: 7 },
    { x: 9, y: 28, targetMap: 'route2', targetX: 10, targetY: 2 },
    { x: 10, y: 28, targetMap: 'route2', targetX: 10, targetY: 2 },
  ],
};

// Route 2 - Second outdoor area (NEW!)
export const ROUTE2_MAP: MapData = {
  name: 'route2',
  width: 22,
  height: 25,
  tileSize: 32,
  layers: {
    ground: Array(25).fill(Array(22).fill(4)), // Grass ground
    collision: [
      // Top border with entrance
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      // Large open area
      ...Array(21).fill([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
      // Bottom with paths
      [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    ],
    grass: Array(25)
      .fill(null)
      .map((_, y) =>
        Array(22)
          .fill(null)
          .map((_, x) => {
            // Dense grass areas
            if (y > 5 && y < 20 && x > 3 && x < 18 && Math.random() > 0.4) {
              return 1;
            }
            return 0;
          })
      ),
  },
  npcs: [
    {
      id: 'npc_lass',
      name: 'Lass Anna',
      x: 11,
      y: 10,
      sprite: 'npc_1',
      dialogues: [
        "I'm training my Pokémon to become stronger!",
        "Want to battle sometime?",
      ],
      useAI: true,
      aiContext: "You are a young trainer excited about battles. You're friendly but competitive.",
    },
    {
      id: 'npc_camper',
      name: 'Camper Tom',
      x: 15,
      y: 18,
      sprite: 'npc_2',
      dialogues: [
        "I've been camping here for days!",
        "The Pokémon here are really strong.",
      ],
      useAI: true,
      aiContext: "You are an experienced camper who knows the area well. Share knowledge about the local Pokémon.",
    },
  ],
  warps: [
    { x: 9, y: 0, targetMap: 'route1', targetX: 9, targetY: 28 },
    { x: 10, y: 0, targetMap: 'route1', targetX: 10, targetY: 28 },
    { x: 11, y: 0, targetMap: 'route1', targetX: 10, targetY: 28 },
  ],
};

// Wild encounter tables
export const ENCOUNTER_TABLES: Record<string, WildEncounter[]> = {
  route1: [
    { pokemon: 16, minLevel: 2, maxLevel: 4, chance: 30 }, // Pidgey
    { pokemon: 19, minLevel: 2, maxLevel: 4, chance: 30 }, // Rattata
    { pokemon: 10, minLevel: 2, maxLevel: 3, chance: 20 }, // Caterpie
    { pokemon: 13, minLevel: 2, maxLevel: 3, chance: 15 }, // Weedle
    { pokemon: 25, minLevel: 3, maxLevel: 5, chance: 5 },  // Pikachu (rare!)
  ],
  route2: [
    { pokemon: 16, minLevel: 4, maxLevel: 6, chance: 25 }, // Pidgey (stronger)
    { pokemon: 19, minLevel: 4, maxLevel: 6, chance: 25 }, // Rattata (stronger)
    { pokemon: 17, minLevel: 5, maxLevel: 7, chance: 20 }, // Pidgeotto
    { pokemon: 20, minLevel: 5, maxLevel: 7, chance: 15 }, // Raticate
    { pokemon: 43, minLevel: 4, maxLevel: 6, chance: 10 }, // Oddish
    { pokemon: 25, minLevel: 5, maxLevel: 7, chance: 5 },  // Pikachu (rare!)
  ],
};

// Map registry
export const MAPS: Record<string, MapData> = {
  lab: LAB_MAP,
  route1: ROUTE1_MAP,
  route2: ROUTE2_MAP,
};

export function getMap(name: string): MapData | null {
  return MAPS[name] || null;
}
