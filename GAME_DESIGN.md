# Game Design - Pokémon Systems

Complete documentation of Pokémon game mechanics and design systems.

---

## 📋 Table of Contents

1. [Battle System](#battle-system)
2. [Evolution System](#evolution-system)
3. [Tournament Mode](#tournament-mode)
4. [Team Building](#team-building)
5. [Type Effectiveness](#type-effectiveness)
6. [Stats & Calculations](#stats--calculations)
7. [Phaser Game](#phaser-game)

---

## Battle System

### 6v6 Team Battles

The core battle system simulates complete 6-on-6 Pokémon battles.

**Rules:**
- Each trainer has exactly 6 Pokémon
- Battles are turn-based
- Speed determines turn order
- When a Pokémon faints, next Pokémon automatically enters
- Battle ends when all Pokémon on one team faint

**Damage Calculation:**
```
Damage = ((((2 * Level / 5 + 2) * Power * A/D) / 50) + 2) * Modifiers

Where:
- Level = Pokémon level (typically 50, 75, or 100)
- Power = Move power
- A = Attack (Physical) or Sp. Attack (Special)
- D = Defense (Physical) or Sp. Defense (Special)

Modifiers:
- Type Effectiveness (0, 0.25, 0.5, 1, 2, 4)
- STAB (Same Type Attack Bonus): 1.5x
- Random Factor: 0.85-1.0
- Critical Hit: 1.5x (5% chance)
```

**Implementation:**
- `lib/battle/engine.ts` - Battle state management
- `lib/battle/damage.ts` - Damage calculation
- `lib/battle/ai.ts` - AI move selection

---

## Evolution System

### Evolution Points Mechanic

Teams have a **6-point evolution budget** to allocate across their 6 Pokémon.

**Rules:**
- Total evolution points: **6 max**
- Each Pokémon can evolve up to its chain length
- Example: Bulbasaur → Ivysaur (1 point) → Venusaur (2 points)
- Pikachu → Raichu (1 point max, only 2 in chain)

**Strategic Considerations:**
- **Concentrate:** Give 2 points to 3 Pokémon (create powerhouses)
- **Spread:** Give 1 point to 6 Pokémon (balanced evolution)
- **Mixed:** Some fully evolved, others base form (strategic advantage)

**Stat Boost:**
Evolution increases base stats by ~15-25% depending on the Pokémon.

**Implementation:**
- `lib/battle/evolution.ts` - Evolution allocation logic
- `lib/battle/validation.ts` - Team validation

---

## Tournament Mode

### AI Opponent Team Generation

**Goal:** Generate the BEST possible opposing team to counter the player's team.

**Algorithm:**
1. **Analyze player team:**
   - Identify type weaknesses (types that deal 2x+ damage)
   - Identify type resistances (types that deal 0.5x damage)
   - Calculate defensive/offensive balance scores

2. **Select counter Pokémon:**
   - Prioritize Pokémon with types that exploit player weaknesses
   - Add Pokémon that resist player's offensive types
   - Ensure type diversity (don't duplicate types)
   - Balance roles (sweepers, tanks, walls, pivots)

3. **Score candidates:**
   - +20 points: Has type that exploits player weakness
   - +15 points: Resists player types
   - +10 points: Adds new type coverage
   - +5 points per stat > 100

4. **Select top 6:**
   - Sort by score
   - Pick highest-scoring Pokémon
   - Apply evolution points optimally

**Tournament Rules:**
- Allow Legendaries: Yes/No
- Allow Mega Evolutions: Yes/No
- Allow Gigantamax: Yes/No
- Target Level: 50, 75, or 100

**Competitive Pokémon Pool:**
- **Physical Sweepers:** Garchomp, Salamence, Metagross, Tyranitar, Scizor, Lucario
- **Special Sweepers:** Gengar, Alakazam, Espeon, Magnezone, Hydreigon, Chandelure
- **Defensive Tanks:** Snorlax, Blissey, Ferrothorn, Skarmory, Hippowdon, Toxapex
- **Fast Pivots:** Jolteon, Aerodactyl, Crobat, Weavile, Starmie, Greninja
- **Balanced:** Dragonite, Milotic, Arcanine, Umbreon, Vaporeon, Slowbro

**Implementation:**
- `lib/ai/teamBuilder.ts` - AI team generation
- Deterministic (not random)
- Explainable reasoning for each Pokémon selected

**Admin View:**
Shows AI reasoning:
- Why each Pokémon was selected
- Which player Pokémon it counters
- Type coverage analysis
- Defensive/offensive balance scores

---

## Team Building

### Team Composition

**Requirements:**
- Exactly 6 Pokémon
- No duplicates
- Max 6 evolution points total
- Each Pokémon has 4 moves

**Roles to Consider:**
1. **Physical Sweeper** - High Attack + Speed
2. **Special Sweeper** - High Sp. Attack + Speed
3. **Physical Wall** - High HP + Defense
4. **Special Wall** - High HP + Sp. Defense
5. **Tank** - High HP + both defenses
6. **Pivot** - Fast, versatile

**Type Coverage:**
Aim to cover all 18 types with your 6 Pokémon:
- Offensive: Can your team hit all types effectively?
- Defensive: Can your team resist most incoming attacks?

**Common Weaknesses to Avoid:**
- ❌ All Pokémon weak to Fire
- ❌ All Pokémon weak to Water
- ❌ All Pokémon weak to Electric
- ❌ No Fast Pokémon (< 80 Speed)
- ❌ No Defensive Pokémon (< 80 Defense/Sp. Def)

---

## Type Effectiveness

### Type Chart

18 Pokémon types with unique interactions:

**Super Effective (2x damage):**
- Fire → Grass, Ice, Bug, Steel
- Water → Fire, Ground, Rock
- Electric → Water, Flying
- Grass → Water, Ground, Rock
- Ice → Grass, Ground, Flying, Dragon
- Fighting → Normal, Ice, Rock, Dark, Steel
- Poison → Grass, Fairy
- Ground → Fire, Electric, Poison, Rock, Steel
- Flying → Grass, Fighting, Bug
- Psychic → Fighting, Poison
- Bug → Grass, Psychic, Dark
- Rock → Fire, Ice, Flying, Bug
- Ghost → Psychic, Ghost
- Dragon → Dragon
- Dark → Psychic, Ghost
- Steel → Ice, Rock, Fairy
- Fairy → Fighting, Dragon, Dark

**Not Very Effective (0.5x damage):**
(Inverse of above, plus immunities)

**Immune (0x damage):**
- Normal/Fighting → Ghost
- Ghost → Normal
- Psychic → Dark
- Ground → Flying
- Dragon → Fairy
- Poison → Steel

**Implementation:**
- `lib/typeRelations.ts` - Complete type chart
- `calculateDefensiveMultiplier()` - Computes effectiveness

---

## Stats & Calculations

### Base Stats

Every Pokémon has 6 base stats:
- **HP** - Hit Points (health)
- **Attack** - Physical attack power
- **Defense** - Physical defense
- **Special Attack** - Special attack power
- **Special Defense** - Special defense
- **Speed** - Turn order priority

**Stat Ranges:**
- Low: 30-50
- Average: 60-80
- High: 90-110
- Legendary: 120-150+

### IV/EV Calculator

**IVs (Individual Values):**
- Range: 0-31 per stat
- Random, inherent to each Pokémon
- Cannot be changed

**EVs (Effort Values):**
- Range: 0-252 per stat
- Max total: 510 across all stats
- Gained through training

**Formula:**
```
HP = floor(((2 * Base + IV + floor(EV/4)) * Level) / 100) + Level + 10

Other Stats = (floor(((2 * Base + IV + floor(EV/4)) * Level) / 100) + 5) * Nature
```

**Natures:**
25 natures that boost one stat (+10%) and lower another (-10%):
- Adamant: +Attack, -Sp. Attack
- Modest: +Sp. Attack, -Attack
- Jolly: +Speed, -Sp. Attack
- Timid: +Speed, -Attack
- (and 21 more...)

**Implementation:**
- `lib/ivEvCalculator.ts` - Stat calculations
- `app/tools/iv-ev/page.tsx` - Calculator UI

---

## Phaser Game

### Top-Down Adventure Game

A complete Pokémon-style adventure game built with Phaser 3.

**Features:**
- ✅ Keyboard-controlled player movement
- ✅ Tilemap-based world (Tiled JSON)
- ✅ NPC interactions (AI-powered dialogue)
- ✅ Wild Pokémon encounters (tall grass)
- ✅ Turn-based battles
- ✅ Save/load system
- ✅ In-game menu (Team, Bag, Pause)

**Controls:**
- Arrow Keys: Move
- SPACE: Interact with NPCs
- ESC: Pause menu
- T: Team screen
- I: Inventory
- R: Run (in battle)

**Scenes:**
1. **BootScene** - Load assets
2. **MenuScene** - Title screen
3. **GameScene** - Overworld gameplay
4. **BattleScene** - Wild battles

**Wild Encounters:**
- Random when walking in tall grass
- Encounter rate: ~10% per step
- Pokémon level based on area
- Can run from battle (R key)

**Battle Mechanics:**
- Turn-based combat
- 4 moves per Pokémon
- Type effectiveness applies
- XP and leveling system
- Move learning on level up

**Save System:**
- Auto-save on key events
- Manual save via menu
- Per-user saves: `data/game-saves/{username}.json`
- Saves: position, team, inventory, progress flags

**NPC Dialogue:**
- AI-powered (Ollama/Mistral)
- Context-aware responses
- Personality per NPC
- Fallback dialogue if AI offline

**Implementation:**
- `lib/game/` - Game engine
- `lib/game/scenes/` - Phaser scenes
- `public/game/assets/` - Sprites, tiles, audio
- `app/game/page.tsx` - React integration

---

## Design Philosophy

### Determinism

**No RNG in Team Generation:**
- AI opponent team is DETERMINISTIC
- Same player team → same AI team
- Reasoning is clear and explainable

**Minimal RNG in Battle:**
- Damage random factor: 0.85-1.0 (15% variance)
- Critical hit: 5% chance
- Move accuracy: Check against move's accuracy stat

### Balance

**Evolution Points:**
- 6 points forces strategic choices
- Cannot fully evolve all 6 Pokémon
- Creates diverse team compositions

**Type Coverage:**
- 18 types ensure no single Pokémon dominates
- Every type has strengths and weaknesses
- Balanced teams perform better

**Stats:**
- No Pokémon has high stats in everything
- Fast Pokémon are fragile (Glass Cannons)
- Tanky Pokémon are slow (Walls)
- Balanced Pokémon are versatile but not exceptional

---

## Future Enhancements

### Planned Features

1. **Items in Battle:**
   - Potions, Full Restores
   - Status healers
   - X Attack, X Defense buffs

2. **Status Conditions:**
   - Burn (lower Attack, damage over time)
   - Paralysis (lower Speed, chance to not move)
   - Sleep (cannot move for 1-3 turns)
   - Freeze, Poison

3. **Weather Effects:**
   - Rain (boost Water, nerf Fire)
   - Sun (boost Fire, nerf Water)
   - Sandstorm (damage over time)
   - Hail (damage over time)

4. **Abilities:**
   - Passive effects (Intimidate, Levitate)
   - Triggered effects (Overgrow, Torrent)

5. **Held Items:**
   - Choice Band (+50% Attack, lock move)
   - Life Orb (+30% damage, 10% recoil)
   - Leftovers (heal 1/16 HP per turn)

6. **Online Battles:**
   - PvP matchmaking
   - Ranked ladder
   - Replay system

---

**See Also:**
- [BATTLE_SYSTEM.md](BATTLE_SYSTEM.md) - Detailed battle mechanics
- [GAME_GUIDE.md](GAME_GUIDE.md) - Phaser game implementation
- [STRUCTURE.md](STRUCTURE.md) - Project architecture
