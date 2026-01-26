# Battle System Documentation

## Overview

Deterministic 6v6 Pokémon battle system with evolution point allocation.

## Data Model

### Core Types

```typescript
// Pokemon stats
interface BattlePokemonStats {
  hp, attack, defense, specialAttack, specialDefense, speed
}

// Battle move
interface BattleMove {
  name, type, power, damageClass, accuracy
}

// Battle-ready Pokemon
interface BattlePokemon {
  id, name, types, baseStats, currentStats,
  moves, currentHp, maxHp, evolutionStage,
  evolutionChain, isFainted
}

// Team with evolution allocation
interface BattleTeam {
  teamId, name, pokemon[6],
  evolutionPoints: { pokemonIndex, points }[],
  totalEvolutionPointsUsed (≤6),
  activeIndex
}

// Battle state
interface BattleState {
  battleId, team1, team2, currentTurn,
  turnHistory, isFinished, winner
}
```

## Algorithms

### 1. Team Validation

```
function validateTeam(team):
  errors = []
  
  // Rule 1: Exactly 6 Pokemon
  if team.pokemon.length != 6:
    errors.add("Must have 6 Pokemon")
  
  // Rule 2: Valid stats and moves
  for each pokemon in team.pokemon:
    if pokemon.baseStats.hp <= 0:
      errors.add("Invalid stats")
    if pokemon.moves.length == 0:
      errors.add("Must have moves")
  
  // Rule 3: Total evolution points ≤ 6
  if team.totalEvolutionPointsUsed > 6:
    errors.add("Exceeds 6 evolution points")
  
  // Rule 4: Valid evolution allocation
  for each allocation in team.evolutionPoints:
    pokemon = team.pokemon[allocation.pokemonIndex]
    maxEvolutions = pokemon.evolutionChain.length - 1
    
    if allocation.points > maxEvolutions:
      errors.add("Exceeds evolution stages")
    if allocation.points < 0:
      errors.add("Negative points")
  
  // Rule 5: Sum matches total
  calculatedSum = sum(allocation.points for allocation in team.evolutionPoints)
  if calculatedSum != team.totalEvolutionPointsUsed:
    errors.add("Point mismatch")
  
  return { valid: errors.isEmpty(), errors }
```

### 2. Apply Evolution Points

```
function applyEvolution(pokemon, points):
  maxEvolutions = pokemon.evolutionChain.length - 1
  actualPoints = clamp(points, 0, maxEvolutions)
  
  if actualPoints == 0:
    return pokemon (unchanged)
  
  newStage = actualPoints
  evolvedName = pokemon.evolutionChain[newStage]
  
  // Stat multipliers
  multipliers = {
    stage1: { hp: 1.25, attack: 1.30, ... },
    stage2: { hp: 1.55, attack: 1.70, ... }
  }
  
  evolvedStats = {
    hp: floor(baseStats.hp * multipliers[newStage].hp),
    attack: floor(baseStats.attack * multipliers[newStage].attack),
    ...
  }
  
  return {
    ...pokemon,
    name: evolvedName,
    evolutionStage: newStage,
    currentStats: evolvedStats,
    maxHp: evolvedStats.hp,
    currentHp: evolvedStats.hp
  }
```

### 3. Damage Calculation

```
function calculateDamage(attacker, defender, move):
  // Miss check
  if random(0, 100) > move.accuracy:
    return { damage: 0, effectiveness: 1, isCritical: false }
  
  // Select stats based on move type
  attackStat = move.damageClass == "physical" 
    ? attacker.currentStats.attack 
    : attacker.currentStats.specialAttack
  
  defenseStat = move.damageClass == "physical"
    ? defender.currentStats.defense
    : defender.currentStats.specialDefense
  
  level = 50
  
  // Base damage (Pokemon formula)
  baseDamage = floor(
    (((2 * level / 5 + 2) * move.power * attackStat / defenseStat) / 50) + 2
  )
  
  // Type effectiveness (multiply for each defender type)
  effectiveness = 1
  for each defenderType in defender.types:
    effectiveness *= getTypeMultiplier(move.type, defenderType)
  
  // STAB (Same Type Attack Bonus)
  stab = attacker.types.includes(move.type) ? 1.5 : 1
  
  // Critical hit (5% chance)
  isCritical = random() < 0.05
  critical = isCritical ? 1.5 : 1
  
  // Random factor (0.85 - 1.0)
  randomFactor = 0.85 + random() * 0.15
  
  finalDamage = floor(baseDamage * stab * effectiveness * critical * randomFactor)
  
  return {
    damage: max(1, finalDamage),
    effectiveness,
    isCritical
  }
```

### 4. Battle Turn Execution

```
function executeTurn(state):
  if state.isFinished:
    return state
  
  // Determine attack order by Speed
  firstTeam, secondTeam = determineTurnOrder(state.team1, state.team2)
  
  // Select moves (AI for both if not provided)
  firstMove = selectMove(firstTeam.activePokemon)
  secondMove = selectMove(secondTeam.activePokemon)
  
  state.currentTurn++
  
  // First attack
  turn1 = executeAttack(firstTeam, secondTeam, firstMove)
  state.turnHistory.push(turn1)
  
  if turn1.fainted:
    nextIndex = getNextActivePokemon(secondTeam)
    if nextIndex == -1:
      state.isFinished = true
      state.winner = firstTeam.teamId
      return state
    secondTeam.activeIndex = nextIndex
  
  // Second attack (if first attacker still alive)
  if !firstTeam.activePokemon.isFainted:
    turn2 = executeAttack(secondTeam, firstTeam, secondMove)
    state.turnHistory.push(turn2)
    
    if turn2.fainted:
      nextIndex = getNextActivePokemon(firstTeam)
      if nextIndex == -1:
        state.isFinished = true
        state.winner = secondTeam.teamId
        return state
      firstTeam.activeIndex = nextIndex
  
  return state
```

### 5. Winner Determination

```
function determineWinner(state):
  team1Remaining = count(p for p in state.team1.pokemon if !p.isFainted)
  team2Remaining = count(p for p in state.team2.pokemon if !p.isFainted)
  
  if team1Remaining == 0:
    return state.team2.teamId
  
  if team2Remaining == 0:
    return state.team1.teamId
  
  // Timeout fallback (after max turns)
  team1TotalHp = sum(p.currentHp for p in state.team1.pokemon)
  team2TotalHp = sum(p.currentHp for p in state.team2.pokemon)
  
  return team1TotalHp > team2TotalHp 
    ? state.team1.teamId 
    : state.team2.teamId
```

### 6. AI Move Selection

```
function chooseMove(attacker, defender):
  scores = []
  
  for each move in attacker.moves:
    score = 0
    
    // Factor 1: Type effectiveness
    effectiveness = calculateTypeEffectiveness(move.type, defender.types)
    score += effectiveness * 50
    
    // Factor 2: Move power
    score += move.power * 0.5
    
    // Factor 3: STAB
    if attacker.types.includes(move.type):
      score += 25
    
    // Factor 4: Accuracy
    score *= move.accuracy / 100
    
    // Factor 5: Finish weak opponents
    if defender.currentHp / defender.maxHp < 0.3:
      score *= 1.5
    
    scores.push({ move, score })
  
  return scores.max(by: score).move
```

## Battle Flow

### Initialization
1. Validate both teams (6 Pokemon each, valid evolution points)
2. Apply evolution points to all Pokemon
3. Set active Pokemon (index 0 for both teams)
4. Initialize battle state

### Turn Loop
```
while !battle.isFinished:
  1. Determine attack order (by Speed)
  2. First Pokemon attacks
     - Calculate damage
     - Apply damage to defender
     - Check if defender fainted
     - If all 6 fainted → battle ends
     - Else switch to next Pokemon
  
  3. Second Pokemon attacks (if alive)
     - Same process
  
  4. Check win condition
  5. Increment turn counter
  6. Continue or end
```

### Win Conditions
- All 6 opponent Pokemon fainted
- Timeout (100 turns): Winner = team with most total HP remaining

### Example Flow
```
Turn 1:
  - Charizard (Speed 100) vs Blastoise (Speed 78)
  - Charizard attacks first with Flamethrower
    * Type: Fire vs Water → 0.5x effectiveness
    * Damage: 45
  - Blastoise attacks with Surf
    * Type: Water vs Fire → 2x effectiveness  
    * Damage: 120
  - Charizard faints
  - Player switches to Venusaur

Turn 2:
  - Venusaur (Speed 80) vs Blastoise (Speed 78)
  - Venusaur attacks first with Solar Beam
    * Type: Grass vs Water → 2x effectiveness
    * Damage: 180
  - Blastoise faints
  - AI switches to Pidgeot
  
... continues until one team has 0 Pokemon remaining
```

## Key Features

✅ **Deterministic**: Same inputs = same outputs (except for controlled randomness)  
✅ **Fair**: Both players follow identical rules  
✅ **Scalable**: Can run Player vs Player or Player vs AI  
✅ **Stateless**: Each battle state is self-contained  
✅ **Auditable**: Full turn history tracked  

## Implementation Files

- `lib/battle/types.ts` - Type definitions
- `lib/battle/validation.ts` - Team validation
- `lib/battle/evolution.ts` - Evolution point system
- `lib/battle/damage.ts` - Damage calculation
- `lib/battle/ai.ts` - AI decision logic
- `lib/battle/engine.ts` - Core battle orchestration
