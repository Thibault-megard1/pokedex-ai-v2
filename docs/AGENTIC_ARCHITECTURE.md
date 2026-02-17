# Architecture Agentique - Pokedex AI v2

## Vue d'ensemble

Notre system utilise une **architecture multi-agents** pour optimiser deux domaines clés :
1. **Team Building** : Suggérer les meilleurs Pokémon pour compléter une équipe
2. **Battle Engine** : Décider de l'action optimale (attaque/switch) en temps réel

Chaque système est composé d'**agents spécialisés** qui analysent un aspect particulier, plus un **orchestrateur** qui agrège les résultats.

---

## 🏗️ Architecture Générale

```
┌────────────────────────────────────────────────────────────────┐
│                   APPLICATION POKEDEX AI                       │
└────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌────────▼──────────┐
        │  TEAM BUILDING │         │  BATTLE ENGINE    │
        │  SYSTEM        │         │  SYSTEM           │
        └───────┬────────┘         └────────┬──────────┘
                │                           │
        ┌───────┴──────────┐       ┌────────┴────────┐
        │                  │       │                 │
   ┌────▼─────┐        ┌────▼───┐  │  ┌───────────┐  │
   │ 5 Agents │        │ Tools  │  │  │  5 Agents │  │
   │          │        │        │  │  │           │  │
   │• Type    │        │•Type   │  │  │• Damage   │  │
   │• Stats   │        │•Stats  │  │  │• Speed    │  │
   │• Role    │        │•Role   │  │  │• StatMod  │  │
   │• Coverage│        │•Move   │  │  │• Status   │  │
   │• Synergy │        │•Synergy│  │  │• Decision │  │
   └────┬─────┘        └────┬───┘  │  └─────┬─────┘  │
        │                   │      │        │        │
        └──────────┬────────┘      └───────┬─────────┘
                   │                       │
          ┌────────▼────────┐     ┌────────▼────────┐
          │ Orchestrateur   │     │ Orchestrateur   │
          │ Team Building   │     │ Battle          │
          └────────┬────────┘     └────────┬────────┘
                   │                       │
          [API /api/team/suggest]  [API /api/battle/ai-action]
```

---

## 🎯 TEAM BUILDING SYSTEM

### 📋 Architecture détaillée

```
┌─────────────────────────────────────────────────────┐
│  USER INPUT: Equipe actuelle (3-5 Pokémon)          │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼──────────┐  ┌──────▼──────────┐
   │ Candidates    │  │ Current Team    │
   │ Pool: 100+    │  │ Analysis        │
   │ Pokémon       │  │ (weaknesses,    │
   │               │  │  gaps, roles)   │
   └────┬──────────┘  └──────┬──────────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────┐
        │ EVALUATION PIPELINE      │
        └──────────┬──────────────┘
                   │
        ┌──────────┴──────────────────────────────┐
        │                                          │
   ┌────▼──────────────┐  ┌─────────────────┬────▼──────────┐
   │ TOOL LAYER        │  │ AGENT LAYER     │              │
   │ (Calculs)         │  │ (Analyse)       │              │
   │                   │  │                 │              │
   │• TypeEffectiveness│  │ TypeAnalysis    │ Score: 35%   │
   │  Tool             │  │ Agent           │              │
   │                   │◄──                 │              │
   │• StatsAnalyzer    │  │ StatsAnalysis   │ Score: 25%   │
   │  Tool             │  │ Agent           │              │
   │                   │◄──                 │              │
   │• RoleClassifier   │  │ RoleDistribution│ Score: 25%   │
   │  Tool             │  │ Agent           │              │
   │                   │◄──                 │              │
   │• MoveCoverage     │  │ MoveCoverage    │ Score: 15%   │
   │  Tool             │  │ Agent           │              │
   │                   │◄──                 │              │
   │• SynergyAnalyzer  │  │ Synergy         │ Score: (var) │
   │  Tool             │  │ Agent           │              │
   │                   │◄──                 │              │
   └───────────────────┘  └─────────────────┴──────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │ ORCHESTRATEUR           │
                         │ Team Building           │
                         │                         │
                         │ Agrège les 5 scores:   │
                         │ • Type Synergy         │
                         │ • Stats Balance        │
                         │ • Role Distribution    │
                         │ • Move Coverage        │
                         │ • Team Synergy         │
                         │                         │
                         │ Retourne Top 5         │
                         │ Candidates avec        │
                         │ breakdowns              │
                         └────────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │ JSON RESPONSE            │
                         │                         │
                         │ {                       │
                         │   suggestions: [{       │
                         │     id, name, score,   │
                         │     breakdown: {        │
                         │       type,stats,      │
                         │       role,coverage,   │
                         │       synergy          │
                         │     },                  │
                         │     reasoning: "..."   │
                         │   }],                   │
                         │   teamAnalysis: {...}  │
                         │ }                       │
                         └─────────────────────────┘
```

### 🔧 Les 5 Tools (Couche de Calcul)

| Outil | Fichier | Responsabilités |
|-------|---------|-----------------|
| **TypeEffectivenessTool** | `lib/agents/tools/TypeEffectivenessTool.ts` | Analyse couverture type, immunités, faiblesses critiques, score efficacité |
| **StatsAnalyzerTool** | `lib/agents/tools/StatsAnalyzerTool.ts` | Évalue balance HP/ATK/DEF/SPA/SPD, détecte roles (sweeper, tank, etc) |
| **RoleClassifierTool** | `lib/agents/tools/RoleClassifierTool.ts` | Classification des rôles stratégiques (lead, sweeper, wall, etc) |
| **MoveCoverageTool** | `lib/agents/tools/MoveCoverageTool.ts` | Analyse couverture offensive, STAB, types problématiques |
| **SynergyAnalyzerTool** | `lib/agents/tools/SynergyAnalyzerTool.ts` | Mesure les synergies entre Pokémon (stats, abilities, moves) |

### 👥 Les 5 Agents (Couche d'Analyse)

| Agent | Fichier | Input | Output | Poids |
|-------|---------|-------|--------|-------|
| **TypeAnalysisAgent** | `lib/agents/teamBuilding/TypeAnalysisAgent.ts` | Team + Candidates | `TypeAnalysisResult` | **35%** |
| **StatsAnalysisAgent** | `lib/agents/teamBuilding/StatsAnalysisAgent.ts` | Team + Candidates | `StatsAnalysisResult` | **25%** |
| **RoleDistributionAgent** | `lib/agents/teamBuilding/RoleDistributionAgent.ts` | Team + Candidates | `RoleDistributionResult` | **25%** |
| **MoveCoverageAgent** | `lib/agents/teamBuilding/MoveCoverageAgent.ts` | Team + Candidates | `MoveCoverageResult` | **15%** |
| **SynergyAgent** | `lib/agents/teamBuilding/SynergyAgent.ts` | Team + Candidates | `SynergyResult` | **Variable** |

### 🎼 L'Orchestrateur Team Building

**Fichier** : `lib/agents/TeamBuildingOrchestrator.ts`

**Fonctionnement** :
1. Reçoit l'équipe actuelle (3-5 Pokémon)
2. Charge pool de 100+ candidats
3. Lance les 5 agents **en parallèle**
4. Agrège les scores avec **poids pondérés**
5. Retourne Top 5 candidats avec breakdowns

**Formule de Score** :
```
Score Final = 
  (TypeScore × 0.35) +
  (StatsScore × 0.25) +
  (RoleScore × 0.25) +
  (CoverageScore × 0.15) +
  (SynergyScore × 0.XX)
```

**Endpoint API** : `POST /api/team/suggest`

---

## ⚔️ BATTLE ENGINE SYSTEM

### 📋 Architecture détaillée

```
┌──────────────────────────────────────────────┐
│  BATTLE STATE                                 │
│  • Current Pokémon (yours/opponent's)        │
│  • HP, Stages (-6 to +6)                      │
│  • Status (burn, poison, paralysis, etc)     │
│  • Active Moves                               │
│  • Weather/Environment                        │
└──────────────┬───────────────────────────────┘
               │
       ┌───────▼────────────────┐
       │ DECISION NEEDED        │
       │ • Which move to use?   │
       │ • Switch Pokémon?      │
       │ • Predict opponent?    │
       └───────┬────────────────┘
               │
       ┌───────▼───────────────────────────┐
       │ EVALUATION PIPELINE                │
       └───────┬───────────────────────────┘
               │
     ┌─────────┴─────────────────────────────────┐
     │                                           │
┌────▼──────────────┐  ┌────────────────────┬───▼─────────┐
│ TOOL LAYER        │  │ AGENT LAYER        │             │
│ (Calculs)         │  │ (Analyse)          │             │
│                   │  │                    │             │
│• DamageCalculator │  │ DamageCalculation  │ Évalue DMG  │
│  Tool             │  │ Agent              │ & KO chance │
│                   │◄──                    │             │
│• SpeedComparator  │  │ SpeedOrder         │ Ordre de    │
│  Tool             │  │ Agent              │ tour + PR   │
│                   │◄──                    │             │
│• StatModifier     │  │ StatModifier       │ Stats effec │
│  Tool             │  │ Agent              │             │
│                   │◄──                    │             │
│• StatusEffect     │  │ StatusEffect       │ Effets stat │
│  Tool             │  │ Agent              │             │
│                   │◄──                    │             │
│• BattleDecision   │  │ BattleDecision     │ Scoring &   │
│  Tool             │  │ Agent              │ win %       │
│                   │◄──                    │             │
└───────────────────┘  └────────────────────┴─────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │ ORCHESTRATEUR BATTLE        │
                   │                             │
                   │ • Évalue tous les moves    │
                   │ • Estime les KO odds       │
                   │ • Évalue les switches      │
                   │ • Décide action optimale   │
                   │ • Retourne avec explication│
                   └──────────────┬──────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │ JSON RESPONSE                │
                   │                             │
                   │ {                           │
                   │   action: "move"|"switch"  │
                   │   targetMove: "Thunder"    │
                   │   targetPokemon: 25        │
                   │   reasoning: "...",         │
                   │   probability: 0.85,        │
                   │   damageRange: [30,50]     │
                   │ }                           │
                   └─────────────────────────────┘
```

### 🔧 Les 5 Tools (Couche de Calcul)

| Outil | Fichier | Responsabilités |
|-------|---------|-----------------|
| **DamageCalculatorTool** | `lib/agents/battleEngine/tools/DamageCalculatorTool.ts` | Calcul dégâts (Gen V+), STAB, CRIT, effectiveness, burn penalty |
| **SpeedComparatorTool** | `lib/agents/battleEngine/tools/SpeedComparatorTool.ts` | Ordre de tour, priorités, paralysie impact |
| **StatModifierTool** | `lib/agents/battleEngine/tools/StatModifierTool.ts` | Stages (-6 à +6), calcul stats effectives |
| **StatusEffectTool** | `lib/agents/battleEngine/tools/StatusEffectTool.ts` | Burn, poison, paralysis, sleep, freeze, volatiles |
| **BattleDecisionTool** | `lib/agents/battleEngine/tools/BattleDecisionTool.ts` | Scoring actions, KO odds, switch evaluation, prediction |

### 👥 Les 5 Agents (Couche d'Analyse)

| Agent | Fichier | Responsabilités |
|-------|---------|-----------------|
| **DamageCalculationAgent** | `lib/agents/battleEngine/agents/DamageCalculationAgent.ts` | Évalue tous les moves, chances KO |
| **SpeedOrderAgent** | `lib/agents/battleEngine/agents/SpeedOrderAgent.ts` | Ordre de tour, outspeeding |
| **StatModifierAgent** | `lib/agents/battleEngine/agents/StatModifierAgent.ts` | Impact des stages sur efficacité |
| **StatusEffectAgent** | `lib/agents/battleEngine/agents/StatusEffectAgent.ts` | Impact des statuts |
| **BattleDecisionAgent** | `lib/agents/battleEngine/agents/BattleDecisionAgent.ts` | Décision finale (move/switch) |

### 🎼 L'Orchestrateur Battle

**Fichier** : `lib/agents/battleEngine/BattleOrchestrator.ts`

**Fonctionnement** :
1. Reçoit l'état du combat (Pokémon, HP, stages, statuts)
2. Lance les 5 agents en parallèle
3. Synthétise une décision (move + raison)
4. Retourne action optimale avec probabilités

**Endpoint API** : `POST /api/battle/ai-action`

---

## 🔄 Flux de Données - Team Building

```
1. USER
   └─→ POST /api/team/suggest
       └─→ { currentTeam: [id1, id2, id3] }

2. ORCHESTRATOR
   ├─→ Charge candidats (100+ Pokémon)
   └─→ Analyse team actuelle

3. AGENTS (PARALLÈLE)
   ├─→ TypeAnalysisAgent.evaluateCandidates()
   ├─→ StatsAnalysisAgent.evaluateCandidates()
   ├─→ RoleDistributionAgent.evaluateCandidates()
   ├─→ MoveCoverageAgent.evaluateCandidates()
   └─→ SynergyAgent.evaluateCandidates()

4. AGGREGATION
   ├─→ Combine scores (poids)
   ├─→ Trie candidates
   └─→ Génère top 5

5. RESPONSE
   └─→ JSON avec suggestions + analysis
       └─→ Frontend affiche recommendations
```

---

## 🔄 Flux de Données - Battle

```
1. USER / BATTLE STATE
   └─→ POST /api/battle/ai-action
       └─→ { battleState: {...}, currentPokemon: {...} }

2. ORCHESTRATOR
   └─→ Parse battle state
   
3. AGENTS (PARALLÈLE)
   ├─→ DamageCalculationAgent.evaluate()
   ├─→ SpeedOrderAgent.evaluate()
   ├─→ StatModifierAgent.evaluate()
   ├─→ StatusEffectAgent.evaluate()
   └─→ BattleDecisionAgent.evaluate()

4. DECISION
   ├─→ Score chaque action
   ├─→ Évalue KO odds
   └─→ Sélectionne optimale

5. RESPONSE
   └─→ JSON avec action + probabilités
       └─→ Frontend execute le move
```

---

## 📊 Comparaison: Team Building vs Battle Engine

| Aspect | Team Building | Battle Engine |
|--------|---------------|---------------|
| **Timing** | Asynchrone | Synchrone (temps réel) |
| **Horizon** | Long terme (team complète) | Court terme (1 tour) |
| **État** | Static | Dynamique (HP, stages, statuts) |
| **Agents** | 5 (analyzes complémentaires) | 5 (couvrent aspects combat) |
| **Score** | Multi-critères (35% + 25% + ...) | Binaire (action best-scored) |
| **Complexité** | 100+ candidats | 4-8 moves/switches |
| **API Endpoint** | `/api/team/suggest` | `/api/battle/ai-action` |

---

## 🎯 Points Clés d'Architecture

### 1. **Séparation des Concerns**
- **Tools** = Calculs purs (pas d'orchestration)
- **Agents** = Analyse (utilise tools, structure résultats)
- **Orchestrators** = Décisions (agrège agents)

### 2. **Parallélisation**
- Les 5 agents tournent **en parallèle** (pas dépendances)
- Réduit latence (crucial pour battle en temps réel)

### 3. **Poids Configurables**
- Team Building: 35% Type, 25% Stats, 25% Role, 15% Coverage, XX% Synergy
- Facilite ajustement via configuration

### 4. **Reasoning Explicite**
- Chaque suggestion inclut **pourquoi** (breakdown + details)
- User comprend la logique

### 5. **Cache & Performance**
- Pokémon data: cache mémoire 5 min (1-5ms)
- Battle decisions: <100ms pour temps réel
- Team suggestions: 500-1000ms acceptable

---

## 📁 Arborescence des Fichiers

```
lib/agents/
├── tools/
│   ├── TypeEffectivenessTool.ts
│   ├── StatsAnalyzerTool.ts
│   ├── RoleClassifierTool.ts
│   ├── MoveCoverageTool.ts
│   └── SynergyAnalyzerTool.ts
│
├── teamBuilding/
│   ├── TypeAnalysisAgent.ts
│   ├── StatsAnalysisAgent.ts
│   ├── RoleDistributionAgent.ts
│   ├── MoveCoverageAgent.ts
│   ├── SynergyAgent.ts
│   └── [TeamBuildingOrchestrator.ts => ../TeamBuildingOrchestrator.ts]
│
├── battleEngine/
│   ├── tools/
│   │   ├── DamageCalculatorTool.ts
│   │   ├── SpeedComparatorTool.ts
│   │   ├── StatModifierTool.ts
│   │   ├── StatusEffectTool.ts
│   │   └── BattleDecisionTool.ts
│   │
│   ├── agents/
│   │   ├── DamageCalculationAgent.ts
│   │   ├── SpeedOrderAgent.ts
│   │   ├── StatModifierAgent.ts
│   │   ├── StatusEffectAgent.ts
│   │   └── BattleDecisionAgent.ts
│   │
│   ├── BattleOrchestrator.ts
│   └── index.ts
│
├── TeamBuildingOrchestrator.ts
└── index.ts

app/api/
├── team/
│   └── suggest/
│       └── route.ts
│
└── battle/
    ├── ai-action/
    │   └── route.ts
    └── generate-team/
        └── route.ts
```

---

## 🚀 Utilisation des Endpoints

### Team Building
```bash
POST /api/team/suggest
Content-Type: application/json

{
  "currentTeam": [1, 4, 7],  // IDs Pokémon actuels
  "teamSize": 3              // Optionnel
}

RESPONSE:
{
  "suggestions": [
    {
      "id": 25,
      "name": "Pikachu",
      "score": 87.5,
      "breakdown": {
        "typeScore": 35,
        "statsScore": 25,
        "roleScore": 22,
        "coverageScore": 13.5,
        "synergyScore": 8
      },
      "details": ["Covers flying weakness", "Great speed..."],
      "reasoning": "Excellent speed form with..."
    }
    // ... 4 more candidates
  ],
  "teamAnalysis": {...}
}
```

### Battle Engine
```bash
POST /api/battle/ai-action
Content-Type: application/json

{
  "battleState": {...},
  "currentPokemon": {...},
  "opponentTeam": [...]
}

RESPONSE:
{
  "action": "move",
  "targetMove": "Thunder",
  "targetPokemon": null,
  "probability": 0.92,
  "damageRange": [45, 52],
  "reasoning": "Thunder has 92% chance to KO opponent's water type"
}
```

---

## 🔮 Améliorations Futures

- [ ] **Machine Learning**: Apprendre des patterns gagnants
- [ ] **Metagame Awareness**: Adapter aux tendances compétitives
- [ ] **Live Battle Analytics**: Apprendre du comportement de l'adversaire
- [ ] **Multi-turn Planning**: Prévoir 2-3 tours à l'avance
- [ ] **ELO Weighting**: Adapter difficulté selon skill player

---

**Dernière mise à jour** : 17 février 2026
