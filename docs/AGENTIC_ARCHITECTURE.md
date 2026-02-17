# Architecture Agentique - Pokedex AI v2

## Vue d'ensemble

Notre système utilise une **architecture multi-agents hiérarchique** avec un **MasterAgent** intelligent qui utilise **Ollama** pour la réflexion et délègue aux sous-agents spécialisés.

```
┌─────────────────────────────────────────────────────────────────┐
│                        MASTER AGENT                              │
│                    (Réflexion via Ollama)                        │
│                                                                  │
│  • Analyse le contexte de la requête                            │
│  • Décide quel sous-agent appeler                               │
│  • Agrège et retourne les résultats                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │                               │
┌──────────▼──────────┐         ┌──────────▼──────────┐
│  TEAM BUILDING      │         │  BATTLE AGENT       │
│  AGENT              │         │                     │
│                     │         │  • Décisions combat │
│  ┌───────────────┐  │         │  • Évaluation moves │
│  │ OurTeamAgent  │  │         │  • Prédiction ennemi│
│  │ (Notre équipe)│  │         │                     │
│  └───────────────┘  │         └──────────┬──────────┘
│  ┌───────────────┐  │                    │
│  │OpponentTeam   │  │                    │
│  │Agent (Adverse)│  │                    │
│  └───────────────┘  │                    │
└──────────┬──────────┘                    │
           │                               │
           └───────────────┬───────────────┘
                           │
              ┌────────────▼────────────┐
              │         TOOLS           │
              │     (Calculs purs)      │
              │                         │
              │ • TypeEffectivenessTool │
              │ • StatsAnalyzerTool     │
              │ • RoleClassifierTool    │
              │ • MoveCoverageTool      │
              │ • SynergyAnalyzerTool   │
              │ + Battle Tools          │
              └─────────────────────────┘
```

---

## 🧠 MASTER AGENT

**Fichier** : `lib/agents/MasterAgent.ts`

Le MasterAgent est le cerveau du système. Il utilise **Ollama** (LLM local) pour :
- Analyser la requête utilisateur
- Déterminer quelle tâche effectuer (team_building, battle, analysis)
- Déléguer au bon sous-agent
- Retourner les résultats

### Fonctionnement

```
┌────────────────────────────────────────────────────┐
│  REQUÊTE UTILISATEUR                               │
│  • Message: "Aide moi à compléter mon équipe"     │
│  • Context: { currentTeam: [...], battleState }   │
└──────────────────────┬─────────────────────────────┘
                       │
           ┌───────────▼───────────┐
           │ PHASE 1: RÉFLEXION    │
           │ (Via Ollama)          │
           │                       │
           │ Prompt → LLM → JSON   │
           │ {                     │
           │   task: "team_build", │
           │   reasoning: "...",   │
           │   confidence: 0.9     │
           │ }                     │
           └───────────┬───────────┘
                       │
           ┌───────────▼───────────┐
           │ PHASE 2: DÉLÉGATION   │
           │                       │
           │ switch(task) {        │
           │   "team_building" →   │
           │     TeamBuildingAgent │
           │   "battle" →          │
           │     BattleAgent       │
           │ }                     │
           └───────────┬───────────┘
                       │
           ┌───────────▼───────────┐
           │ PHASE 3: RÉSULTAT     │
           │                       │
           │ { success, task,      │
           │   reflection,         │
           │   response }          │
           └───────────────────────┘
```

### Code Example

```typescript
import { MasterAgent } from "@/lib/agents/MasterAgent";

const master = new MasterAgent({ enableReflection: true });

// Le MasterAgent décide automatiquement quel agent utiliser
const result = await master.process({
  message: "Suggère-moi un Pokémon pour mon équipe",
  context: {
    currentTeam: [pikachu, charizard, blastoise]
  }
});

// result.task = "team_building"
// result.teamBuildingResponse = { suggestions: [...] }
```

---

## 🏗️ TEAM BUILDING AGENT

**Fichier** : `lib/agents/subAgents/TeamBuildingAgent.ts`

Sous-agent qui gère la construction et l'optimisation des équipes.

### Sous-composants

```
┌─────────────────────────────────────────────────────┐
│              TEAM BUILDING AGENT                     │
│                                                      │
│  Modes:                                              │
│  • suggest - Suggérer des ajouts                    │
│  • analyze - Analyser l'équipe                      │
│  • counter - Générer une équipe counter             │
│  • generate - Créer une équipe complète             │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐    ┌─────────────────┐         │
│  │  OurTeamAgent   │    │ OpponentTeam    │         │
│  │                 │    │ Agent           │         │
│  │ • suggestAdd()  │    │ • analyzeMatch()│         │
│  │ • generateFull()│    │ • genCounter()  │         │
│  │ • scoreCands()  │    │ • predictStrat()│         │
│  │                 │    │ • identifyThreat│         │
│  └────────┬────────┘    └────────┬────────┘         │
│           │                      │                   │
│           └──────────┬───────────┘                   │
│                      │                               │
│           ┌──────────▼──────────┐                    │
│           │       TOOLS         │                    │
│           │ • TypeEffectiveness │                    │
│           │ • StatsAnalyzer     │                    │
│           │ • RoleClassifier    │                    │
│           │ • MoveCoverage      │                    │
│           │ • SynergyAnalyzer   │                    │
│           └─────────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

### OurTeamAgent

**Fichier** : `lib/agents/subAgents/OurTeamAgent.ts`

Spécialisé dans l'optimisation de **notre équipe**.

| Méthode | Description |
|---------|-------------|
| `suggestAdditions()` | Suggère des Pokémon pour compléter l'équipe |
| `generateFullTeam()` | Génère une équipe complète depuis zéro |
| `scoreCandidates()` | Score les candidats avec pondération |

**Poids de scoring** :
- Type: **35%**
- Role: **25%**
- Stats: **20%**
- Coverage: **15%**
- Synergy: **5%**

### OpponentTeamAgent

**Fichier** : `lib/agents/subAgents/OpponentTeamAgent.ts`

Spécialisé dans l'analyse de **l'équipe adverse**.

| Méthode | Description |
|---------|-------------|
| `analyzeMatchup()` | Analyse le matchup vs l'adversaire |
| `generateCounterTeam()` | Génère une équipe qui counter |
| `predictStrategy()` | Prédit le style de jeu adverse |
| `identifyThreats()` | Identifie les menaces principales |

---

## ⚔️ BATTLE AGENT

**Fichier** : `lib/agents/subAgents/BattleAgent.ts`

Sous-agent qui gère les décisions de combat en temps réel.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  BATTLE AGENT                        │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ process(battleState)                         │    │
│  │ → Décision optimale (move/switch)           │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ evaluateAllActions()                         │    │
│  │ → Liste ordonnée des actions possibles      │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ analyzeCurrentState()                        │    │
│  │ → Avantage, momentum, recommandations       │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ predictOpponentAction()                      │    │
│  │ → Action probable de l'adversaire           │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Wrapper autour de:                                  │
│  ┌─────────────────────────────────────────────┐    │
│  │         BATTLE ORCHESTRATOR                  │    │
│  │  (lib/agents/battleEngine/BattleOrchestrator)│   │
│  │                                              │    │
│  │  Coordonne 5 agents spécialisés:            │    │
│  │  • DamageCalculationAgent                   │    │
│  │  • SpeedOrderAgent                          │    │
│  │  • StatModifierAgent                        │    │
│  │  • StatusEffectAgent                        │    │
│  │  • BattleDecisionAgent                      │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 TOOLS (Couche de Calcul)

**Dossier** : `lib/agents/tools/`

Les Tools sont des classes de **calcul pur** sans logique métier.
Ils sont utilisés par les Agents pour obtenir des données.

### Team Building Tools

| Tool | Fichier | Responsabilité |
|------|---------|----------------|
| **TypeEffectivenessTool** | `TypeEffectivenessTool.ts` | Analyse types, faiblesses, résistances, immunités |
| **StatsAnalyzerTool** | `StatsAnalyzerTool.ts` | Analyse stats (HP, ATK, DEF, SPE...), classification |
| **RoleClassifierTool** | `RoleClassifierTool.ts` | Classification des rôles (sweeper, tank, support...) |
| **MoveCoverageTool** | `MoveCoverageTool.ts` | Couverture offensive, STAB, types problématiques |
| **SynergyAnalyzerTool** | `SynergyAnalyzerTool.ts` | Synergies entre Pokémon |

### Battle Tools

| Tool | Fichier | Responsabilité |
|------|---------|----------------|
| **DamageCalculatorTool** | `DamageCalculatorTool.ts` | Calcul dégâts (STAB, crit, effectiveness) |
| **SpeedComparatorTool** | `SpeedComparatorTool.ts` | Ordre de tour, priorités |
| **StatModifierTool** | `StatModifierTool.ts` | Gestion stages (-6 à +6) |
| **StatusEffectTool** | `StatusEffectTool.ts` | Statuts (burn, poison, paralysis...) |
| **BattleDecisionTool** | `BattleDecisionTool.ts` | Scoring actions, KO odds |

---

## 🔄 Flux de Données Complet

### Requête Team Building

```
1. USER → POST /api/team/suggest
   └── { currentTeam: [id1, id2], opponentTeam?: [...] }

2. MASTER AGENT
   ├── Réflexion Ollama → task = "team_building"
   └── Délègue à TeamBuildingAgent

3. TEAM BUILDING AGENT
   ├── Mode "suggest"
   │   ├── OurTeamAgent.suggestAdditions()
   │   │   ├── TypeEffectivenessTool.scorePokemonTypeContribution()
   │   │   ├── StatsAnalyzerTool.scorePokemonStatsBalance()
   │   │   ├── RoleClassifierTool.scorePokemonRoleContribution()
   │   │   └── MoveCoverageTool.scorePokemonMoveCoverage()
   │   └── Top 5 candidates
   │
   └── Si opponentTeam fourni:
       └── OpponentTeamAgent.analyzeMatchup()

4. RESPONSE
   └── { suggestions: [...], analysis: {...} }
```

### Requête Battle

```
1. USER → POST /api/battle/ai-action
   └── { battleState: {...} }

2. MASTER AGENT
   ├── Réflexion Ollama → task = "battle"
   └── Délègue à BattleAgent

3. BATTLE AGENT
   ├── process(battleState)
   │   └── BattleOrchestrator.decideTurn()
   │       ├── DamageCalculationAgent
   │       ├── SpeedOrderAgent
   │       ├── StatModifierAgent
   │       ├── StatusEffectAgent
   │       └── BattleDecisionAgent
   │
   └── Décision finale

4. RESPONSE
   └── { action: "move", moveName: "Thunder", confidence: 0.92 }
```

---

## 📁 Structure des Fichiers

```
lib/agents/
├── MasterAgent.ts                  # 🧠 Cerveau principal (Ollama)
│
├── subAgents/
│   ├── index.ts                    # Exports
│   ├── TeamBuildingAgent.ts        # Sous-agent team building
│   ├── OurTeamAgent.ts             # Notre équipe
│   ├── OpponentTeamAgent.ts        # Équipe adverse
│   └── BattleAgent.ts              # Sous-agent combat
│
├── tools/                          # 🔧 Calculs purs (Team Building)
│   ├── TypeEffectivenessTool.ts
│   ├── StatsAnalyzerTool.ts
│   ├── RoleClassifierTool.ts
│   ├── MoveCoverageTool.ts
│   └── SynergyAnalyzerTool.ts
│
├── battleEngine/                   # ⚔️ Moteur de combat
│   ├── BattleOrchestrator.ts
│   ├── agents/
│   │   ├── DamageCalculationAgent.ts
│   │   ├── SpeedOrderAgent.ts
│   │   ├── StatModifierAgent.ts
│   │   ├── StatusEffectAgent.ts
│   │   └── BattleDecisionAgent.ts
│   └── tools/
│       ├── DamageCalculatorTool.ts
│       ├── SpeedComparatorTool.ts
│       ├── StatModifierTool.ts
│       ├── StatusEffectTool.ts
│       └── BattleDecisionTool.ts
│
└── teamBuilding/                   # (Legacy - à migrer)
    └── ...
```

---

## 🎯 Points Clés de l'Architecture

### 1. **Hiérarchie Claire**
```
MasterAgent (cerveau)
    ├── TeamBuildingAgent
    │   ├── OurTeamAgent
    │   └── OpponentTeamAgent
    └── BattleAgent
        └── BattleOrchestrator
            └── 5 agents spécialisés
```

### 2. **Séparation des Concerns**
- **MasterAgent** = Réflexion + Routing
- **SubAgents** = Logique métier
- **Tools** = Calculs purs

### 3. **Réflexion via Ollama**
Le MasterAgent utilise un LLM local pour:
- Comprendre le contexte
- Choisir le bon sous-agent
- Adapter la réponse

```typescript
// Prompt système pour Ollama
`Analyse la requête et détermine quelle action effectuer.
Tâches possibles:
- "team_building": Construire/optimiser une équipe
- "battle": Décision de combat
- "analysis": Analyser sans action`
```

### 4. **Fallback Sans Ollama**
Si Ollama n'est pas disponible:
```typescript
// Inférence locale basée sur les keywords
if (message.includes("équipe")) return "team_building";
if (message.includes("combat")) return "battle";
```

---

## 🚀 API Endpoints

### Team Building
```bash
POST /api/team/suggest
{
  "currentTeam": [1, 4, 7],
  "opponentTeam": [25, 94, 149]  # Optionnel
}

RESPONSE:
{
  "success": true,
  "suggestions": [
    { "id": 130, "name": "Gyarados", "score": 87 }
  ],
  "analysis": { "weaknesses": ["electric"] }
}
```

### Battle
```bash
POST /api/battle/ai-action
{
  "battleState": {
    "playerPokemon": {...},
    "opponentPokemon": {...}
  }
}

RESPONSE:
{
  "success": true,
  "action": { "type": "move", "moveName": "Thunderbolt" },
  "confidence": 0.92,
  "reasoning": "Super efficace, chance de KO 85%"
}
```

---

## 🔮 Avantages de cette Architecture

| Aspect | Bénéfice |
|--------|----------|
| **Modularité** | Chaque agent est indépendant et testable |
| **Extensibilité** | Facile d'ajouter de nouveaux sous-agents |
| **Intelligence** | Ollama permet une compréhension contextuelle |
| **Fallback** | Fonctionne même sans Ollama (inférence locale) |
| **Performance** | Tools réutilisables et cachés |
| **Maintenance** | Code organisé et séparé par responsabilité |

---

**Dernière mise à jour** : 17 février 2026
