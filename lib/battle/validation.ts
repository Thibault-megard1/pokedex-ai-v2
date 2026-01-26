/**
 * Battle System - Team Validation
 * 
 * Validates team composition and evolution point allocation
 */

import type { BattleTeam, TeamValidationResult, ValidationError } from "./types";

/**
 * Validates a battle team before starting a battle
 */
export function validateTeam(team: BattleTeam): TeamValidationResult {
  const errors: ValidationError[] = [];

  // Rule 1: Must have exactly 6 Pokémon
  if (team.pokemon.length !== 6) {
    errors.push({
      field: "pokemon",
      message: `Team must have exactly 6 Pokémon (found ${team.pokemon.length})`
    });
  }

  // Rule 2: All Pokémon must have valid base stats
  team.pokemon.forEach((pokemon, index) => {
    if (!pokemon.baseStats || pokemon.baseStats.hp <= 0) {
      errors.push({
        field: `pokemon[${index}].baseStats`,
        message: `Pokémon ${pokemon.name} has invalid base stats`
      });
    }
    
    // Must have at least 1 move
    if (!pokemon.moves || pokemon.moves.length === 0) {
      errors.push({
        field: `pokemon[${index}].moves`,
        message: `Pokémon ${pokemon.name} must have at least 1 move`
      });
    }
  });

  // Rule 3: Total evolution points must be ≤ 6
  if (team.totalEvolutionPointsUsed > 6) {
    errors.push({
      field: "evolutionPoints",
      message: `Total evolution points used (${team.totalEvolutionPointsUsed}) exceeds maximum (6)`
    });
  }

  // Rule 4: Evolution point allocation must be valid
  team.evolutionPoints.forEach(allocation => {
    const pokemon = team.pokemon[allocation.pokemonIndex];
    
    if (!pokemon) {
      errors.push({
        field: `evolutionPoints[${allocation.pokemonIndex}]`,
        message: `Invalid Pokémon index: ${allocation.pokemonIndex}`
      });
      return;
    }

    // Check if Pokémon can evolve
    const maxEvolutions = pokemon.evolutionChain.length - 1;
    if (maxEvolutions === 0 && allocation.points > 0) {
      errors.push({
        field: `evolutionPoints[${allocation.pokemonIndex}]`,
        message: `Pokémon ${pokemon.name} cannot evolve`
      });
    }

    // Check if evolution points exceed available stages
    if (allocation.points > maxEvolutions) {
      errors.push({
        field: `evolutionPoints[${allocation.pokemonIndex}]`,
        message: `Pokémon ${pokemon.name} can only evolve ${maxEvolutions} times (allocated ${allocation.points})`
      });
    }

    // Points must be non-negative
    if (allocation.points < 0) {
      errors.push({
        field: `evolutionPoints[${allocation.pokemonIndex}]`,
        message: `Evolution points cannot be negative`
      });
    }
  });

  // Rule 5: Sum of allocated points must equal totalEvolutionPointsUsed
  const calculatedTotal = team.evolutionPoints.reduce((sum, a) => sum + a.points, 0);
  if (calculatedTotal !== team.totalEvolutionPointsUsed) {
    errors.push({
      field: "evolutionPoints",
      message: `Evolution point mismatch: allocated ${calculatedTotal} but totalEvolutionPointsUsed is ${team.totalEvolutionPointsUsed}`
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a battle can start
 */
export function validateBattle(team1: BattleTeam, team2: BattleTeam): TeamValidationResult {
  const errors: ValidationError[] = [];

  const team1Validation = validateTeam(team1);
  const team2Validation = validateTeam(team2);

  if (!team1Validation.valid) {
    errors.push({
      field: "team1",
      message: `Team 1 validation failed: ${team1Validation.errors.map(e => e.message).join(", ")}`
    });
  }

  if (!team2Validation.valid) {
    errors.push({
      field: "team2",
      message: `Team 2 validation failed: ${team2Validation.errors.map(e => e.message).join(", ")}`
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
