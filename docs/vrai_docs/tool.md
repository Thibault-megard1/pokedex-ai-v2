# 🔧 Documentation des Tools LangChain

> Documentation complète de tous les tools disponibles dans l'architecture multi-agent

## 📋 Table des matières

- [🎯 Pattern Tool](#pattern-tool)
- [🔧 TeamBuilding Tools](#teambuilding-tools)
- [⚔️ Battle Tools](#battle-tools)
- [📝 Création de nouveaux tools](#creation-tools)

---

## 🎯 Pattern Tool {#pattern-tool}

### Syntaxe LangChain

Les tools sont créés avec la fonction `tool()` de `@langchain/core/tools` :

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const myTool = tool(
  // 1. Fonction async qui exécute la logique
  async (input: InputType): Promise<string> => {
    const { param1, param2 } = input;
    
    // Logique métier
    const result = await doSomething(param1, param2);
    
    // Toujours retourner une string JSON
    return JSON.stringify(result);
  },
  // 2. Métadonnées du tool
  {
    name: "my_tool_name",           // Nom unique (snake_case)
    description: "Description...",   // Description pour le LLM
    schema: z.object({              // Schéma Zod des paramètres
      param1: z.string().describe("Description param1"),
      param2: z.number().describe("Description param2")
    })
  }
);
```

### Bonnes pratiques

| Règle | Description |
|-------|-------------|
| ✅ Nom unique | Utiliser `snake_case` pour les noms |
| ✅ Description claire | Le LLM l'utilise pour décider quand appeler le tool |
| ✅ Schéma Zod | Valider tous les inputs avec `.describe()` |
| ✅ Retour JSON | Toujours `JSON.stringify()` le résultat |
| ✅ Gestion erreurs | Capturer les erreurs et retourner un message clair |

---

## 🔧 TeamBuilding Tools {#teambuilding-tools}

### 1. `type_analysis`

Analyse les faiblesses et résistances de type d'une équipe.

```typescript
export const typeAnalysisTool = tool(
  async (input: { team: SimplePokemon[] }) => {
    const { team } = input;
    
    // Calculer les faiblesses cumulées
    const weaknesses: Record<string, number> = {};
    const resistances: Record<string, number> = {};
    const coverage: string[] = [];
    
    for (const pokemon of team) {
      for (const type of pokemon.types) {
        // Ajouter les attaques couvertes
        coverage.push(type);
        
        // Calculer faiblesses/résistances
        const typeData = TYPE_CHART[type];
        for (const weak of typeData.weakTo) {
          weaknesses[weak] = (weaknesses[weak] || 0) + 1;
        }
        for (const resist of typeData.resistsTo) {
          resistances[resist] = (resistances[resist] || 0) + 1;
        }
      }
    }
    
    // Score basé sur la couverture
    const uniqueCoverage = [...new Set(coverage)];
    const coverageScore = Math.round((uniqueCoverage.length / 18) * 100);
    
    return JSON.stringify({
      weaknesses: Object.entries(weaknesses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      resistances: Object.entries(resistances)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      coverage: uniqueCoverage,
      coverageScore,
      teamSize: team.length
    });
  },
  {
    name: "type_analysis",
    description: "Analyse les types d'une équipe Pokémon pour identifier les faiblesses communes, résistances et couverture offensive",
    schema: z.object({
      team: z.array(SimplePokemonSchema)
        .min(1).max(6)
        .describe("L'équipe à analyser (1-6 Pokémon)")
    })
  }
);
```

**Input:**
```json
{
  "team": [
    { "id": 6, "name": "Charizard", "types": ["fire", "flying"] },
    { "id": 9, "name": "Blastoise", "types": ["water"] }
  ]
}
```

**Output:**
```json
{
  "weaknesses": [["rock", 2], ["electric", 1]],
  "resistances": [["fire", 2], ["grass", 1]],
  "coverage": ["fire", "flying", "water"],
  "coverageScore": 17,
  "teamSize": 2
}
```

---

### 2. `role_classifier`

Classifie les rôles stratégiques des Pokémon.

```typescript
export const roleClassifierTool = tool(
  async (input: { team: SimplePokemon[] }) => {
    const { team } = input;
    
    const roles = team.map(pokemon => {
      const stats = pokemon.stats || getDefaultStats(pokemon.id);
      
      // Déterminer le rôle basé sur les stats
      let role: string;
      if (stats.speed > 100 && stats.attack > 100) {
        role = 'physical_sweeper';
      } else if (stats.speed > 100 && stats.specialAttack > 100) {
        role = 'special_sweeper';
      } else if (stats.defense > 100 && stats.hp > 90) {
        role = 'physical_wall';
      } else if (stats.specialDefense > 100 && stats.hp > 90) {
        role = 'special_wall';
      } else if (stats.hp > 100 && stats.defense > 80 && stats.specialDefense > 80) {
        role = 'tank';
      } else {
        role = 'support';
      }
      
      return {
        name: pokemon.name,
        role,
        confidence: calculateConfidence(stats)
      };
    });
    
    // Distribution des rôles
    const distribution = roles.reduce((acc, r) => {
      acc[r.role] = (acc[r.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return JSON.stringify({
      roles,
      distribution,
      balanced: checkRoleBalance(distribution)
    });
  },
  {
    name: "role_classifier",
    description: "Classifie les rôles de chaque Pokémon (sweeper, wall, tank, support, pivot) basé sur leurs stats",
    schema: z.object({
      team: z.array(SimplePokemonSchema).describe("L'équipe à classifier")
    })
  }
);
```

**Rôles possibles:**
- `physical_sweeper` - Attaquant physique rapide
- `special_sweeper` - Attaquant spécial rapide
- `physical_wall` - Tank défense physique
- `special_wall` - Tank défense spéciale
- `tank` - Équilibré défensif
- `support` - Utilitaire/Setup
- `pivot` - Switch-in stratégique

---

### 3. `synergy_analysis`

Analyse la synergie globale de l'équipe.

```typescript
export const synergyTool = tool(
  async (input: { team: SimplePokemon[] }) => {
    const { team } = input;
    
    // Détecter les doublons de type
    const typeCount: Record<string, number> = {};
    team.forEach(p => p.types.forEach(t => {
      typeCount[t] = (typeCount[t] || 0) + 1;
    }));
    
    const duplicates = Object.entries(typeCount)
      .filter(([_, count]) => count > 1)
      .map(([type, count]) => ({ type, count }));
    
    // Faiblesses partagées
    const sharedWeaknesses = findSharedWeaknesses(team);
    
    // Synergies positives
    const cores = identifyCores(team);
    
    // Score de synergie (0-100)
    let score = 70;
    score -= duplicates.length * 5;
    score -= sharedWeaknesses.length * 10;
    score += cores.length * 10;
    score = Math.max(0, Math.min(100, score));
    
    return JSON.stringify({
      score,
      duplicates,
      sharedWeaknesses,
      cores,
      issues: generateSynergyIssues(duplicates, sharedWeaknesses)
    });
  },
  {
    name: "synergy_analysis",
    description: "Analyse la synergie d'équipe: doublons de types, faiblesses partagées, cores défensifs/offensifs",
    schema: z.object({
      team: z.array(SimplePokemonSchema).describe("L'équipe à analyser")
    })
  }
);
```

---

### 4. `team_scorer`

Score global de l'équipe avec grade.

```typescript
export const teamScorerTool = tool(
  async (input: { team: SimplePokemon[] }) => {
    const { team } = input;
    
    // Appeler les autres analyses
    const typeAnalysis = await typeAnalysisTool.invoke({ team });
    const roles = await roleClassifierTool.invoke({ team });
    const synergy = await synergyTool.invoke({ team });
    
    const parsed = {
      type: JSON.parse(typeAnalysis),
      roles: JSON.parse(roles),
      synergy: JSON.parse(synergy)
    };
    
    // Calculer le score final
    const weights = {
      coverage: 0.25,
      balance: 0.25,
      synergy: 0.30,
      diversity: 0.20
    };
    
    const scores = {
      coverage: parsed.type.coverageScore,
      balance: parsed.roles.balanced ? 80 : 50,
      synergy: parsed.synergy.score,
      diversity: calculateDiversity(team)
    };
    
    const finalScore = Math.round(
      scores.coverage * weights.coverage +
      scores.balance * weights.balance +
      scores.synergy * weights.synergy +
      scores.diversity * weights.diversity
    );
    
    // Déterminer le grade
    const grade = 
      finalScore >= 90 ? 'S' :
      finalScore >= 80 ? 'A' :
      finalScore >= 70 ? 'B' :
      finalScore >= 60 ? 'C' :
      finalScore >= 50 ? 'D' : 'F';
    
    return JSON.stringify({
      score: finalScore,
      grade,
      breakdown: scores,
      strengths: identifyStrengths(parsed),
      improvements: suggestImprovements(parsed)
    });
  },
  {
    name: "team_scorer",
    description: "Calcule un score global (0-100) et un grade (S-F) pour l'équipe avec détail par catégorie",
    schema: z.object({
      team: z.array(SimplePokemonSchema).describe("L'équipe à noter")
    })
  }
);
```

---

### 5. `pokemon_suggester`

Suggère des Pokémon pour compléter l'équipe.

```typescript
export const pokemonSuggesterTool = tool(
  async (input: { 
    currentTeam: SimplePokemon[], 
    candidatePool?: SimplePokemon[] 
  }) => {
    const { currentTeam, candidatePool } = input;
    
    // Analyser les besoins de l'équipe
    const typeAnalysis = JSON.parse(await typeAnalysisTool.invoke({ team: currentTeam }));
    const roleAnalysis = JSON.parse(await roleClassifierTool.invoke({ team: currentTeam }));
    
    // Identifier les faiblesses à couvrir
    const neededTypes = identifyNeededTypes(typeAnalysis.weaknesses);
    const neededRoles = identifyNeededRoles(roleAnalysis.distribution);
    
    // Pool de candidats (ou tous les Pokémon populaires)
    const pool = candidatePool || await getPopularPokemon();
    
    // Scorer chaque candidat
    const scored = pool.map(pokemon => {
      let score = 50;
      
      // Bonus si couvre une faiblesse
      for (const type of pokemon.types) {
        if (neededTypes.includes(type)) score += 20;
      }
      
      // Bonus si remplit un rôle manquant
      const role = classifyRole(pokemon);
      if (neededRoles.includes(role)) score += 15;
      
      // Malus si doublon de type
      const existingTypes = currentTeam.flatMap(p => p.types);
      for (const type of pokemon.types) {
        if (existingTypes.includes(type)) score -= 10;
      }
      
      return { pokemon, score, role, reasoning: generateReasoning(pokemon, score) };
    });
    
    // Top 5 suggestions
    const suggestions = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    return JSON.stringify({
      suggestions,
      neededTypes,
      neededRoles,
      currentTeamSize: currentTeam.length
    });
  },
  {
    name: "pokemon_suggester",
    description: "Suggère les meilleurs Pokémon pour compléter une équipe basé sur les faiblesses et rôles manquants",
    schema: z.object({
      currentTeam: z.array(SimplePokemonSchema).describe("L'équipe actuelle"),
      candidatePool: z.array(SimplePokemonSchema).optional()
        .describe("Pool de candidats (optionnel, sinon utilise les Pokémon populaires)")
    })
  }
);
```

---

## ⚔️ Battle Tools {#battle-tools}

### 1. `damage_calculator`

Calcule les dégâts d'une attaque.

```typescript
export const damageCalculatorTool = tool(
  async (input: DamageCalculatorInput) => {
    const { attacker, defender, move } = input;
    
    // Formule de dégâts Pokémon
    const level = attacker.level || 50;
    const attack = move.category === 'physical' 
      ? attacker.stats.attack 
      : attacker.stats.specialAttack;
    const defense = move.category === 'physical'
      ? defender.stats.defense
      : defender.stats.specialDefense;
    
    // Calcul de base
    const baseDamage = Math.floor(
      ((2 * level / 5 + 2) * move.power * attack / defense) / 50 + 2
    );
    
    // Multiplicateur de type
    const effectiveness = calculateTypeEffectiveness(move.type, defender.types);
    
    // STAB (Same Type Attack Bonus)
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;
    
    // Dégâts min/max (random 0.85-1.0)
    const minDamage = Math.floor(baseDamage * 0.85 * effectiveness * stab);
    const maxDamage = Math.floor(baseDamage * 1.0 * effectiveness * stab);
    
    // Chance de KO
    const koChance = maxDamage >= defender.stats.hp ? 100 :
                     minDamage >= defender.stats.hp ? 50 : 0;
    
    return JSON.stringify({
      minDamage,
      maxDamage,
      effectiveness,
      effectivenessText: getEffectivenessText(effectiveness),
      stab: stab > 1,
      koChance,
      hpPercent: {
        min: Math.round((minDamage / defender.stats.hp) * 100),
        max: Math.round((maxDamage / defender.stats.hp) * 100)
      }
    });
  },
  {
    name: "damage_calculator",
    description: "Calcule les dégâts exacts d'une attaque avec multiplicateurs de type, STAB et chance de KO",
    schema: DamageCalculatorSchema
  }
);
```

---

### 2. `speed_comparator`

Compare les vitesses pour l'ordre d'attaque.

```typescript
export const speedComparatorTool = tool(
  async (input: { pokemon1: BattlePokemon, pokemon2: BattlePokemon }) => {
    const { pokemon1, pokemon2 } = input;
    
    // Vitesses effectives
    const speed1 = calculateEffectiveSpeed(pokemon1);
    const speed2 = calculateEffectiveSpeed(pokemon2);
    
    // Déterminer le premier
    const first = speed1 > speed2 ? pokemon1.name :
                  speed2 > speed1 ? pokemon2.name : 'speed_tie';
    
    // Facteurs modificateurs
    const factors1 = getSpeedFactors(pokemon1);
    const factors2 = getSpeedFactors(pokemon2);
    
    return JSON.stringify({
      [pokemon1.name]: { 
        baseSpeed: pokemon1.stats.speed,
        effectiveSpeed: speed1,
        factors: factors1
      },
      [pokemon2.name]: {
        baseSpeed: pokemon2.stats.speed,
        effectiveSpeed: speed2,
        factors: factors2
      },
      first,
      speedDifference: Math.abs(speed1 - speed2)
    });
  },
  {
    name: "speed_comparator",
    description: "Compare les vitesses de deux Pokémon pour déterminer l'ordre d'attaque, incluant modificateurs",
    schema: z.object({
      pokemon1: BattlePokemonSchema.describe("Premier Pokémon"),
      pokemon2: BattlePokemonSchema.describe("Second Pokémon")
    })
  }
);
```

---

### 3. `status_effect`

Évalue les effets de statut.

```typescript
export const statusEffectTool = tool(
  async (input: { pokemon: BattlePokemon }) => {
    const { pokemon } = input;
    const status = pokemon.status;
    
    const effects = {
      paralysis: {
        speedMod: 0.5,
        skipChance: 25,
        canMove: true,
        damage: 0
      },
      burn: {
        attackMod: 0.5,
        damage: Math.floor(pokemon.stats.hp / 16),
        canMove: true
      },
      poison: {
        damage: Math.floor(pokemon.stats.hp / 8),
        canMove: true
      },
      toxic: {
        damage: Math.floor(pokemon.stats.hp / 16), // Augmente chaque tour
        canMove: true,
        stacking: true
      },
      sleep: {
        canMove: false,
        turnsRemaining: pokemon.sleepTurns || 2
      },
      freeze: {
        canMove: false,
        thawChance: 20
      }
    };
    
    const currentEffect = status ? effects[status] : null;
    
    return JSON.stringify({
      status: status || 'none',
      effect: currentEffect,
      canAttack: currentEffect?.canMove ?? true,
      damagePerTurn: currentEffect?.damage ?? 0,
      turnsToKO: currentEffect?.damage 
        ? Math.ceil(pokemon.currentHp / currentEffect.damage)
        : null
    });
  },
  {
    name: "status_effect",
    description: "Évalue les effets du statut actuel d'un Pokémon (dégâts par tour, immobilisation, modificateurs)",
    schema: z.object({
      pokemon: BattlePokemonSchema.describe("Le Pokémon à évaluer")
    })
  }
);
```

---

### 4. `battle_decision`

Tool principal de décision en combat.

```typescript
export const battleDecisionTool = tool(
  async (input: BattleDecisionInput) => {
    const { myPokemon, opponent, myTeam } = input;
    
    // Analyser chaque move possible
    const moveAnalysis = await Promise.all(
      myPokemon.moves.map(async move => {
        const damage = JSON.parse(await damageCalculatorTool.invoke({
          attacker: myPokemon,
          defender: opponent,
          move
        }));
        
        return {
          move: move.name,
          ...damage,
          score: calculateMoveScore(damage, move)
        };
      })
    );
    
    // Analyser les switchs possibles
    const switchAnalysis = myTeam
      .filter((p, i) => i !== 0 && p.currentHp > 0)
      .map(pokemon => ({
        pokemon: pokemon.name,
        score: calculateSwitchScore(pokemon, opponent),
        reasoning: generateSwitchReasoning(pokemon, opponent)
      }));
    
    // Décision optimale
    const bestMove = moveAnalysis.reduce((a, b) => a.score > b.score ? a : b);
    const bestSwitch = switchAnalysis.length > 0
      ? switchAnalysis.reduce((a, b) => a.score > b.score ? a : b)
      : null;
    
    const decision = bestMove.score >= (bestSwitch?.score || 0)
      ? { action: 'attack', move: bestMove }
      : { action: 'switch', target: bestSwitch };
    
    return JSON.stringify({
      decision,
      moveAnalysis,
      switchAnalysis,
      reasoning: generateDecisionReasoning(decision, moveAnalysis, switchAnalysis)
    });
  },
  {
    name: "battle_decision",
    description: "Analyse toutes les options (attaques et switchs) et recommande la meilleure décision tactique",
    schema: BattleDecisionSchema
  }
);
```

---

### 5. `win_probability`

Calcule la probabilité de victoire.

```typescript
export const winProbabilityTool = tool(
  async (input: { myTeam: BattlePokemon[], opponentTeam: BattlePokemon[] }) => {
    const { myTeam, opponentTeam } = input;
    
    // Facteurs de calcul
    const factors = {
      hpAdvantage: calculateHpAdvantage(myTeam, opponentTeam),
      aliveAdvantage: calculateAliveAdvantage(myTeam, opponentTeam),
      typeMatchup: calculateTypeMatchup(myTeam, opponentTeam),
      statsAdvantage: calculateStatsAdvantage(myTeam, opponentTeam)
    };
    
    // Poids des facteurs
    const weights = {
      hpAdvantage: 0.30,
      aliveAdvantage: 0.35,
      typeMatchup: 0.20,
      statsAdvantage: 0.15
    };
    
    // Score de probabilité
    let winProb = 50; // Base
    winProb += factors.hpAdvantage * weights.hpAdvantage;
    winProb += factors.aliveAdvantage * weights.aliveAdvantage;
    winProb += factors.typeMatchup * weights.typeMatchup;
    winProb += factors.statsAdvantage * weights.statsAdvantage;
    
    winProb = Math.max(5, Math.min(95, winProb)); // Clamp 5-95%
    
    return JSON.stringify({
      winProbability: Math.round(winProb),
      factors,
      myTeamStats: {
        alive: myTeam.filter(p => p.currentHp > 0).length,
        totalHp: myTeam.reduce((s, p) => s + p.currentHp, 0)
      },
      opponentTeamStats: {
        alive: opponentTeam.filter(p => p.currentHp > 0).length,
        totalHp: opponentTeam.reduce((s, p) => s + p.currentHp, 0)
      }
    });
  },
  {
    name: "win_probability",
    description: "Calcule la probabilité de victoire basée sur les HP, Pokémon KO, matchups de type et stats",
    schema: z.object({
      myTeam: z.array(BattlePokemonSchema).describe("Mon équipe"),
      opponentTeam: z.array(BattlePokemonSchema).describe("Équipe adverse")
    })
  }
);
```

---

## 📝 Création de nouveaux tools {#creation-tools}

### Template de base

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 1. Définir le schéma d'entrée
const MyToolSchema = z.object({
  param1: z.string().describe("Description du paramètre 1"),
  param2: z.number().optional().describe("Paramètre optionnel")
});

// 2. Type TypeScript (optionnel mais recommandé)
type MyToolInput = z.infer<typeof MyToolSchema>;

// 3. Créer le tool
export const myNewTool = tool(
  async (input: MyToolInput): Promise<string> => {
    const { param1, param2 } = input;
    
    try {
      // Logique métier
      const result = await myBusinessLogic(param1, param2);
      
      // Retourner JSON
      return JSON.stringify({
        success: true,
        data: result
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error.message
      });
    }
  },
  {
    name: "my_new_tool",
    description: "Description claire de ce que fait le tool pour le LLM",
    schema: MyToolSchema
  }
);

// 4. Exporter dans l'array de tools
export const myTools = [myNewTool, ...otherTools];
```

### Checklist avant commit

- [ ] Nom en `snake_case`
- [ ] Description claire et concise
- [ ] Schéma Zod complet avec `.describe()`
- [ ] Gestion des erreurs
- [ ] Retour JSON stringifié
- [ ] Tests unitaires
- [ ] Ajouté à l'export des tools

---

<div align="center">

**🔗 Voir aussi:**
[Documentation Agents](agent.md) • [Architecture Complète](ok.md)

</div>
