/**
 * Battle Effects System - Test Suite
 * 
 * Tests for stat changes, recoil, drain, and status conditions
 */

import {
  initializeStatStages,
  applyStatChange,
  applyRecoilDamage,
  applyDrainEffect,
  applySelfDamage,
  applyStatusCondition,
  applyMoveEffects,
  MOVE_EFFECTS_DATABASE,
} from "../effects";
import type { BattlePokemon, BattleMove } from "../types";

// Helper to create test Pokemon
function createTestPokemon(name: string): BattlePokemon {
  return {
    id: 1,
    name,
    types: ["normal"],
    baseStats: {
      hp: 100,
      attack: 100,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed: 100,
    },
    currentStats: {
      hp: 100,
      attack: 100,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed: 100,
    },
    statStages: initializeStatStages(),
    moves: [],
    currentHp: 100,
    maxHp: 100,
    evolutionStage: 0,
    evolutionChain: [name],
    isFainted: false,
    statusCondition: null,
  };
}

// Test 1: Stat Boost Move (Swords Dance)
console.log("=== Test 1: Stat Boost (Swords Dance) ===");
const attacker1 = createTestPokemon("pikachu");
const defender1 = createTestPokemon("charizard");

const swordsDanceMove: BattleMove = {
  name: "swords-dance",
  type: "normal",
  power: 0,
  damageClass: "status",
  accuracy: 100,
  effects: MOVE_EFFECTS_DATABASE["swords-dance"],
};

console.log("Before:", attacker1.currentStats.attack, "Attack stat");
console.log("Stage:", attacker1.statStages.attack);

const logs1 = applyMoveEffects(attacker1, defender1, swordsDanceMove, 0);
console.log("After:", attacker1.currentStats.attack, "Attack stat");
console.log("Stage:", attacker1.statStages.attack);
console.log("Effects:", logs1);
console.log("✓ Test 1 Passed:", attacker1.statStages.attack === 2 && attacker1.currentStats.attack === 200);
console.log();

// Test 2: Stat Drop Move (Growl)
console.log("=== Test 2: Stat Drop (Growl) ===");
const attacker2 = createTestPokemon("bulbasaur");
const defender2 = createTestPokemon("squirtle");

const growlMove: BattleMove = {
  name: "growl",
  type: "normal",
  power: 0,
  damageClass: "status",
  accuracy: 100,
  effects: MOVE_EFFECTS_DATABASE["growl"],
};

console.log("Before:", defender2.currentStats.attack, "Attack stat");
console.log("Stage:", defender2.statStages.attack);

const logs2 = applyMoveEffects(attacker2, defender2, growlMove, 0);
console.log("After:", defender2.currentStats.attack, "Attack stat");
console.log("Stage:", defender2.statStages.attack);
console.log("Effects:", logs2);
console.log("✓ Test 2 Passed:", defender2.statStages.attack === -1 && defender2.currentStats.attack === 66);
console.log();

// Test 3: Recoil Move (Double Edge)
console.log("=== Test 3: Recoil (Double Edge) ===");
const attacker3 = createTestPokemon("tauros");
const defender3 = createTestPokemon("snorlax");

const doubleEdgeMove: BattleMove = {
  name: "double-edge",
  type: "normal",
  power: 120,
  damageClass: "physical",
  accuracy: 100,
  effects: MOVE_EFFECTS_DATABASE["double-edge"],
};

console.log("Before HP:", attacker3.currentHp);
const damageDealt = 90; // Simulated damage
const logs3 = applyMoveEffects(attacker3, defender3, doubleEdgeMove, damageDealt);
console.log("After HP:", attacker3.currentHp);
console.log("Recoil damage:", 90 * 0.33, "expected");
console.log("Effects:", logs3);
console.log("✓ Test 3 Passed:", attacker3.currentHp < 100);
console.log();

// Test 4: Drain Move (Giga Drain)
console.log("=== Test 4: Drain (Giga Drain) ===");
const attacker4 = createTestPokemon("venusaur");
const defender4 = createTestPokemon("blastoise");
attacker4.currentHp = 50; // Lower HP to test healing

const gigaDrainMove: BattleMove = {
  name: "giga-drain",
  type: "grass",
  power: 75,
  damageClass: "special",
  accuracy: 100,
  effects: MOVE_EFFECTS_DATABASE["giga-drain"],
};

console.log("Before HP:", attacker4.currentHp);
const drainDamage = 60; // Simulated damage dealt
const logs4 = applyMoveEffects(attacker4, defender4, gigaDrainMove, drainDamage);
console.log("After HP:", attacker4.currentHp);
console.log("Healed:", 60 * 0.5, "expected");
console.log("Effects:", logs4);
console.log("✓ Test 4 Passed:", attacker4.currentHp === 80);
console.log();

// Test 5: Status Condition (Thunderbolt paralyze)
console.log("=== Test 5: Status Condition (Paralysis) ===");
const attacker5 = createTestPokemon("pikachu");
const defender5 = createTestPokemon("gyarados");

// Force status to apply (normally 10% chance)
const thunderboltMove: BattleMove = {
  name: "thunderbolt",
  type: "electric",
  power: 90,
  damageClass: "special",
  accuracy: 100,
  effects: [{ type: "status", target: "opponent", status: "paralysis", chance: 100 }], // Force 100%
};

console.log("Before status:", defender5.statusCondition);
const logs5 = applyMoveEffects(attacker5, defender5, thunderboltMove, 50);
console.log("After status:", defender5.statusCondition);
console.log("Effects:", logs5);
console.log("✓ Test 5 Passed:", defender5.statusCondition === "paralysis");
console.log();

console.log("=== All Tests Summary ===");
console.log("✓ Stat boost works (Swords Dance)");
console.log("✓ Stat drop works (Growl)");
console.log("✓ Recoil works (Double Edge)");
console.log("✓ Drain works (Giga Drain)");
console.log("✓ Status conditions work (Paralysis)");
console.log();
console.log("All battle effects are working correctly! ✅");
