// Map data definitions
import type { MapData, WildEncounter } from './types';

// Warp colors for visual identification (bidirectional connections)
export const WARP_COLORS = {
  LAB_PALLETTOWN: 0x3b82f6,      // Blue - Lab entrance
  PALLETTOWN_ROUTE1: 0x10b981,   // Green - South exit
  ROUTE1_VIRIDIAN: 0x8b5cf6,     // Purple - Forest entrance
  ROUTE1_ROUTE2: 0xf59e0b,       // Orange - North connection
} as const;

// Pallet Town - Starting town (REDESIGNED!)
export const PALLET_TOWN_MAP: MapData = {
  name: 'pallettown',
  width: 30,
  height: 25,
  tileSize: 32,
  layers: {
    ground: Array(25).fill(Array(30).fill(4)), // Grass/path ground
    collision: [
      // Top border with decorative pattern
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
      // Lab area (top left)
      [1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1],
      // Central plaza
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      // Pokemon Center (left)
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
      // Bottom exit to Route 1
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    grass: Array(25)
      .fill(null)
      .map((_, y) =>
        Array(30)
          .fill(null)
          .map((_, x) => {
            return 0;
          })
      ),
  },
  npcs: [
    {
      id: 'townsperson1',
      name: 'Townsperson',
      x: 19,
      y: 6,
      sprite: 'npc_2',
      dialogues: [
        "Welcome to Pallet Town!",
        "Professor Oak's lab is to the north.",
        "This town may be small, but it has produced some great trainers.",
        "I've lived here all my life. I love the peaceful atmosphere.",
        "Did you know Red started his journey from this very town?",
      ],
      useAI: true,
      aiContext: "You are a friendly townsperson who loves talking about the town's history and gives directions.",
    },
    {
      id: 'nurse_joy',
      name: 'Nurse Joy',
      x: 5,
      y: 15,
      sprite: 'npc_1',
      dialogues: [
        "Welcome to the Pokémon Center!",
        "Would you like me to heal your Pokémon?",
        "We're here 24/7 to help trainers and their Pokémon!",
        "Taking care of Pokémon is my passion!",
        "A healthy Pokémon is a happy Pokémon!",
      ],
      useAI: false,
      onInteract: 'heal_pokemon',
    },
    {
      id: 'kid',
      name: 'Young Trainer',
      x: 24,
      y: 15,
      sprite: 'npc_1',
      dialogues: [
        "I just started my journey!",
        "The wild Pokémon are so exciting!",
        "I can't wait to explore all the different routes!",
        "Have you been to Viridian Forest yet?",
        "Being a Pokémon trainer is the best thing ever!",
      ],
      useAI: true,
      aiContext: "You are an enthusiastic young trainer who just started. Be excited about everything!",
    },
    {
      id: 'old_man',
      name: 'Old Man',
      x: 10,
      y: 19,
      sprite: 'npc_2',
      dialogues: [
        "Back in my day, we had to walk everywhere!",
        "Press P to teleport to the lab - what a luxury!",
        "Young trainers these days have it so easy.",
        "I've seen many trainers come and go from this town.",
        "The bond between trainer and Pokémon never changes.",
      ],
      useAI: true,
      aiContext: "You are an old man who reminisces about the past but also appreciates modern conveniences.",
    },
  ],
  warps: [
    // To lab (entrance at bottom of lab building)
    { x: 4, y: 5, targetMap: 'lab', targetX: 7, targetY: 9, color: WARP_COLORS.LAB_PALLETTOWN },
    { x: 5, y: 5, targetMap: 'lab', targetX: 7, targetY: 9, color: WARP_COLORS.LAB_PALLETTOWN },
    // To Route 1
    { x: 13, y: 23, targetMap: 'route1', targetX: 12, targetY: 2, color: WARP_COLORS.PALLETTOWN_ROUTE1 },
    { x: 14, y: 23, targetMap: 'route1', targetX: 12, targetY: 2, color: WARP_COLORS.PALLETTOWN_ROUTE1 },
    { x: 15, y: 23, targetMap: 'route1', targetX: 12, targetY: 2, color: WARP_COLORS.PALLETTOWN_ROUTE1 },
    { x: 16, y: 23, targetMap: 'route1', targetX: 12, targetY: 2, color: WARP_COLORS.PALLETTOWN_ROUTE1 },
  ],
};

// Professor's Lab - Starting location (REDESIGNED)
export const LAB_MAP: MapData = {
  name: 'lab',
  width: 15,
  height: 12,
  tileSize: 32,
  layers: {
    ground: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 3, 3, 3, 3, 2, 2, 3, 3, 3, 3, 2, 1],
      [1, 2, 2, 3, 3, 3, 3, 2, 2, 3, 3, 3, 3, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 3, 3, 2, 2, 2, 2, 2, 3, 3, 2, 2, 1],
      [1, 2, 2, 3, 3, 2, 2, 2, 2, 2, 3, 3, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
    ],
    collision: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
    ],
    grass: Array(12).fill(Array(15).fill(0)), // No grass in lab
  },
  npcs: [
    {
      id: 'professor',
      name: 'Professor Oak',
      x: 7,
      y: 4,
      sprite: 'professor',
      dialogues: [
        "Welcome to the world of Pokémon!",
        "I'm Professor Oak. I study Pokémon for a living.",
        "Feel free to use the P key to return here anytime!",
        "The bond between a trainer and their Pokémon is what truly matters.",
        "Your journey will help me greatly with my research!",
        "Pokémon are mysterious creatures that live alongside humans.",
      ],
      useAI: true,
      aiContext: "You are Professor Oak, a friendly Pokémon researcher. You guide new trainers and give them their first Pokémon. Mention that pressing P brings them back to the lab. Be encouraging and educational.",
      onInteract: 'starter_selection',
    },
    {
      id: 'assistant',
      name: 'Lab Assistant',
      x: 9,
      y: 8,
      sprite: 'npc_1',
      dialogues: [
        "Professor Oak is the best!",
        "We study Pokémon evolution here.",
        "Did you know some Pokémon evolve through trading?",
        "The data you collect will help us understand Pokémon better!",
        "This lab has some of the most advanced research equipment!",
      ],
      useAI: true,
      aiContext: "You are a lab assistant who helps Professor Oak. Share interesting facts about Pokémon research.",
    },
  ],
  warps: [
    { x: 7, y: 11, targetMap: 'pallettown', targetX: 4, targetY: 7, color: WARP_COLORS.LAB_PALLETTOWN },
    { x: 8, y: 11, targetMap: 'pallettown', targetX: 5, targetY: 7, color: WARP_COLORS.LAB_PALLETTOWN },
  ],
};

// Route 1 - First outdoor area (UPDATED - connects Pallet Town to Viridian)
export const ROUTE1_MAP: MapData = {
  name: 'route1',
  width: 20,
  height: 30,
  tileSize: 32,
  layers: {
    ground: Array(30).fill(Array(20).fill(4)), // Grass ground
    collision: [
      // Top border with entrance from Viridian
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
      // Main walkable area with side borders
      ...Array(25).fill([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
      // Path to Pallet Town
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      // Bottom exit
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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
        "Want to battle? I've been training really hard!",
        "I call my Rattata 'Top Percentage' because it's so special!",
        "Route 1 is great for training beginning trainers!",
      ],
      useAI: true,
      aiContext: "You are a young Pokémon trainer named Joey. You're very enthusiastic about your Rattata and love battling. Be energetic and friendly.",
    },
    {
      id: 'npc_trainer_bug',
      name: 'Bug Catcher Rick',
      x: 7,
      y: 18,
      sprite: 'npc_2',
      dialogues: [
        "I love Bug Pokémon! Want to battle?",
        "My Caterpie will evolve soon!",
        "Bug-types are underrated. They're actually quite strong!",
        "Have you caught any Bug Pokémon yet?",
        "Once my Caterpie evolves into Butterfree, I'll be unstoppable!",
      ],
      useAI: true,
      aiContext: "You are a bug catcher who specializes in Bug-type Pokémon. You're competitive and eager to battle.",
      onInteract: 'trainer_battle',
    },
    {
      id: 'npc_hiker',
      name: 'Hiker Mark',
      x: 14,
      y: 20,
      sprite: 'npc_2',
      dialogues: [
        "I love hiking through these routes!",
        "The fresh air and wild Pokémon make it all worthwhile.",
        "Nothing beats the feeling of exploring the great outdoors!",
        "I've traveled many routes, and each one is unique.",
        "The journey is just as important as the destination!",
      ],
      useAI: true,
      aiContext: "You are a hiker who loves the outdoors. Share tips about exploring and finding Pokémon.",
    },
  ],
  warps: [
    // To Viridian Forest
    { x: 8, y: 0, targetMap: 'viridianforest', targetX: 12, targetY: 38, color: WARP_COLORS.ROUTE1_VIRIDIAN },
    { x: 9, y: 0, targetMap: 'viridianforest', targetX: 12, targetY: 38, color: WARP_COLORS.ROUTE1_VIRIDIAN },
    { x: 10, y: 0, targetMap: 'viridianforest', targetX: 12, targetY: 38, color: WARP_COLORS.ROUTE1_VIRIDIAN },
    { x: 11, y: 0, targetMap: 'viridianforest', targetX: 12, targetY: 38, color: WARP_COLORS.ROUTE1_VIRIDIAN },
    // To Pallet Town
    { x: 9, y: 29, targetMap: 'pallettown', targetX: 12, targetY: 17, color: WARP_COLORS.PALLETTOWN_ROUTE1 },
    { x: 10, y: 29, targetMap: 'pallettown', targetX: 12, targetY: 17, color: WARP_COLORS.PALLETTOWN_ROUTE1 },
  ],
};

// Viridian Forest - Large forest area (NEW!)
export const VIRIDIAN_FOREST_MAP: MapData = {
  name: 'viridianforest',
  width: 25,
  height: 40,
  tileSize: 32,
  layers: {
    ground: Array(40).fill(Array(25).fill(5)), // Forest floor
    collision: [
      // Complex forest layout with trees (represented by 1s)
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
      [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1],
      [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1],
      [1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1],
      [1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1],
      [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      // Bottom exit to Route 1
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    grass: Array(40)
      .fill(null)
      .map((_, y) =>
        Array(25)
          .fill(null)
          .map((_, x) => {
            // Dense grass throughout the forest
            if (y > 0 && y < 37 && x > 0 && x < 24 && Math.random() > 0.3) {
              return 1;
            }
            return 0;
          })
      ),
  },
  npcs: [
    {
      id: 'bug_catcher1',
      name: 'Bug Catcher Sam',
      x: 8,
      y: 5,
      sprite: 'npc_2',
      dialogues: [
        "This forest is full of Bug Pokémon!",
        "Want to battle? My team is strong!",
        "I've been catching Bug Pokémon all day!",
        "Viridian Forest is a Bug Catcher's paradise!",
        "My Weedle knows Poison Sting now!",
      ],
      useAI: true,
      aiContext: "You are an enthusiastic bug catcher. Challenge trainers to battles and brag about your Bug-type Pokémon.",
      onInteract: 'trainer_battle',
    },
    {
      id: 'bug_catcher2',
      name: 'Bug Catcher Dan',
      x: 15,
      y: 12,
      sprite: 'npc_2',
      dialogues: [
        "My Weedle is going to evolve soon!",
        "Let's battle so it gains experience!",
        "Bug Pokémon may seem weak, but they evolve quickly!",
        "I can't wait for my Weedle to become a Beedrill!",
        "Training in this forest is perfect for Bug-types!",
      ],
      useAI: true,
      aiContext: "You are a determined bug catcher training your Pokémon to evolve. Be competitive and focused.",
      onInteract: 'trainer_battle',
    },
    {
      id: 'lass_forest',
      name: 'Lass Emma',
      x: 12,
      y: 20,
      sprite: 'npc_1',
      dialogues: [
        "I got lost in this forest...",
        "But at least I'm finding lots of Pokémon!",
        "This forest is so big! Have you seen the exit?",
        "Being lost isn't so bad when you're catching Pokémon!",
        "I should have brought a map... but this is an adventure!",
      ],
      useAI: true,
      aiContext: "You are a young trainer who got a bit lost but is making the best of it. Be cheerful despite the situation.",
    },
    {
      id: 'picnicker',
      name: 'Picnicker Lisa',
      x: 18,
      y: 28,
      sprite: 'npc_1',
      dialogues: [
        "I came here for a picnic, but there are so many trainers!",
        "Do you want to battle?",
        "This forest would be perfect for a lunch break!",
        "I love Pokémon battles almost as much as I love picnics!",
        "After all these battles, I'm getting hungry!",
      ],
      useAI: true,
      aiContext: "You are a friendly picnicker who enjoys casual Pokémon battles. Be lighthearted and fun.",
      onInteract: 'trainer_battle',
    },
    {
      id: 'hidden_trainer',
      name: 'Bug Catcher Benny',
      x: 6,
      y: 33,
      sprite: 'npc_2',
      dialogues: [
        "I've been hiding here waiting for strong trainers!",
        "Let's battle!",
        "Surprise! Bet you didn't expect to find me here!",
        "The best battles come from unexpected encounters!",
        "This is the perfect hiding spot for ambush battles!",
      ],
      useAI: true,
      aiContext: "You are a sneaky bug catcher who likes to surprise trainers. Be playful and challenging.",
      onInteract: 'trainer_battle',
    },
  ],
  warps: [
    // To Route 1
    { x: 11, y: 39, targetMap: 'route1', targetX: 10, targetY: 1, color: WARP_COLORS.ROUTE1_VIRIDIAN },
    { x: 12, y: 39, targetMap: 'route1', targetX: 10, targetY: 1, color: WARP_COLORS.ROUTE1_VIRIDIAN },
    { x: 13, y: 39, targetMap: 'route1', targetX: 10, targetY: 1, color: WARP_COLORS.ROUTE1_VIRIDIAN },
  ],
};

// Route 2 - Second outdoor area (EXPANDED)
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
        "Every battle makes me and my Pokémon stronger!",
        "I'm going to be a Pokémon Master one day!",
        "Training is hard work, but it's so rewarding!",
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
        "There's nothing like sleeping under the stars with your Pokémon!",
        "Camping lets you really bond with your team.",
        "I've seen some rare Pokémon around here at night!",
      ],
      useAI: true,
      aiContext: "You are an experienced camper who knows the area well. Share knowledge about the local Pokémon.",
    },
  ],
  warps: [
    { x: 9, y: 0, targetMap: 'route1', targetX: 9, targetY: 28, color: WARP_COLORS.ROUTE1_ROUTE2 },
    { x: 10, y: 0, targetMap: 'route1', targetX: 10, targetY: 28, color: WARP_COLORS.ROUTE1_ROUTE2 },
    { x: 11, y: 0, targetMap: 'route1', targetX: 10, targetY: 28, color: WARP_COLORS.ROUTE1_ROUTE2 },
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
  viridianforest: [
    { pokemon: 10, minLevel: 3, maxLevel: 5, chance: 30 }, // Caterpie
    { pokemon: 13, minLevel: 3, maxLevel: 5, chance: 30 }, // Weedle
    { pokemon: 11, minLevel: 5, maxLevel: 7, chance: 15 }, // Metapod
    { pokemon: 14, minLevel: 5, maxLevel: 7, chance: 15 }, // Kakuna
    { pokemon: 16, minLevel: 4, maxLevel: 6, chance: 8 },  // Pidgey
    { pokemon: 25, minLevel: 5, maxLevel: 8, chance: 2 },  // Pikachu (very rare!)
  ],
  route2: [
    { pokemon: 16, minLevel: 4, maxLevel: 6, chance: 25 }, // Pidgey (stronger)
    { pokemon: 19, minLevel: 4, maxLevel: 6, chance: 25 }, // Rattata (stronger)
    { pokemon: 17, minLevel: 5, maxLevel: 7, chance: 20 }, // Pidgeotto
    { pokemon: 20, minLevel: 5, maxLevel: 7, chance: 15 }, // Raticate
    { pokemon: 43, minLevel: 4, maxLevel: 6, chance: 10 }, // Oddish
    { pokemon: 25, minLevel: 5, maxLevel: 7, chance: 5 },  // Pikachu (rare!)
  ],
  pallettown: [], // No wild encounters in town
};

// Map registry
export const MAPS: Record<string, MapData> = {
  pallettown: PALLET_TOWN_MAP,
  lab: LAB_MAP,
  route1: ROUTE1_MAP,
  viridianforest: VIRIDIAN_FOREST_MAP,
  route2: ROUTE2_MAP,
};

export function getMap(name: string): MapData | null {
  return MAPS[name] || null;
}
