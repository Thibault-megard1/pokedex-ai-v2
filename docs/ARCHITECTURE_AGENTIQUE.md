# Architecture Agentique du Pokédex IA

## Vue d'ensemble du système multi-agents

Ce document décrit le **fonctionnement global de la structure agentique** mise en place pour le projet Pokédex IA.

---

## 🎯 Architecture Générale

Le projet implémente une **architecture multi-agents** où plusieurs systèmes d'IA collaborent pour offrir une expérience interactive et stratégique.

```
┌────────────────────────────────────────────────────────────────┐
│                    POKÉDEX IA - SYSTÈME MULTI-AGENTS           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   AGENT 1    │     │   AGENT 2    │     │   AGENT 3    │    │
│  │  Assistant   │     │ Team Builder │     │Battle Engine │    │
│  │   Mistral    │───▶│      IA      │────▶│      IA      │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                     │                     │          │
│         │                     │                     │          │
│         ▼                     ▼                     ▼          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              BASE DE DONNÉES & APIs                      │  │
│  │  • PokéAPI (données Pokémon)                             │  │
│  │  • Base locale (équipes, historique)                     │  │
│  │  • Mistral AI API (conversations)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
il faut détailler plus multi agent pour team builder donc tool (stats), tool()
```

---

## 🤖 Agent 1: Assistant Conversationnel (Mistral AI)

### Rôle
Agent conversationnel intelligent qui guide l'utilisateur et répond à ses questions sur les Pokémon.

### Localisation
- **Fichiers principaux:**
  - `lib/mistral.ts` - Client API Mistral
  - `lib/mistralAI.ts` - Logique conversationnelle
  - `app/assistant/page.tsx` - Interface utilisateur

### Fonctionnalités

#### 1. Conversation Contextuelle
```typescript
interface ConversationContext {
  historique: Message[];
  contexteUtilisateur: {
    équipeActuelle?: Pokemon[];
    pokémonFavoris?: string[];
    préférencesTypes?: string[];
  };
  modeAdmin?: boolean;
}
```

**Capacités:**
- Réponses en langage naturel
- Mémoire conversationnelle (historique)
- Compréhension du contexte utilisateur
- Support multilingue (français/anglais)

#### 2. Intégration PokéAPI
L'agent enrichit ses réponses avec des données en temps réel:
- Stats des Pokémon
- Types et faiblesses
- Évolutions
- Movesets

#### 3. Mode Admin
Fonctionnalités avancées pour les administrateurs:
- Contrôle des paramètres système
- Analyse des performances
- Gestion des logs

### Pipeline de Traitement

```
1. Question Utilisateur
   ↓
2. Analyse d'Intention (Mistral)
   ↓
3. Recherche de Contexte
   - Équipe utilisateur
   - Historique
   - Données PokéAPI
   ↓
4. Génération de Réponse
   - Mistral AI
   - Enrichissement données
   ↓
5. Post-traitement
   - Formatage
   - Liens vers ressources
   ↓
6. Affichage Utilisateur
```

### Exemple d'Interaction

```typescript
// Question utilisateur
"Quel Pokémon est efficace contre Charizard ?"

// Processus interne
1. Analyse intention → "recherche de contre"
2. Récupération données Charizard (Feu/Vol)
3. Calcul des types efficaces → Eau, Électrique, Roche
4. Génération réponse contextualisée

// Réponse agent
"Contre Charizard (Feu/Vol), je recommande :
• Pokémon Eau (×4) : Blastoise, Gyarados
• Pokémon Électrique (×2) : Pikachu, Raikou
• Pokémon Roche (×4) : Tyranitar, Rampardos"
```

---

## 🎲 Agent 2: Constructeur d'Équipe IA

### Rôle
Agent stratégique qui génère des équipes adverses optimisées basées sur l'analyse de l'équipe du joueur.

### Localisation
- **Fichier principal:** `lib/ai/teamBuilder.ts`
- **Interface:** Intégré dans `app/tournament/page.tsx`

### Architecture de Décision

```
┌─────────────────────────────────────────────────────────┐
│         AGENT TEAM BUILDER - PIPELINE                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. ANALYSE ÉQUIPE JOUEUR                                │
│     ├─ Détection types                                   │
│     ├─ Calcul faiblesses                                 │
│     ├─ Évaluation équilibre off/def                      │
│     └─ Identification menaces principales                │
│                                                           │
│  2. STRATÉGIE CONTRE                                     │
│     ├─ Sélection Pokémon anti-types                      │
│     ├─ Couverture des faiblesses joueur                  │
│     ├─ Équilibre rôles (sweeper/tank/wall)               │
│     └─ Synergies d'équipe                                │
│                                                           │
│  3. GÉNÉRATION ÉQUIPE                                    │
│     ├─ 6 Pokémon sélectionnés                            │
│     ├─ Moves optimisés (PokéAPI)                         │
│     ├─ Stats calculées (niveau)                          │
│     └─ Points évolution alloués                          │
│                                                           │
│  4. VALIDATION & AJUSTEMENT                              │
│     ├─ Vérification règles tournoi                       │
│     ├─ Équilibre types                                   │
│     └─ Scoring final                                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Algorithme de Sélection

#### Phase 1: Analyse de l'Équipe Joueur

```typescript
interface TeamAnalysis {
  // Types présents dans l'équipe
  playerTypesCovered: string[]; // ["fire", "water", "grass"]
  
  // Faiblesses critiques (×2 ou ×4)
  playerWeaknesses: string[]; // ["electric", "rock"]
  
  // Résistances de l'équipe
  playerResistances: string[]; // ["steel", "ice"]
  
  // Scores d'équilibre
  defensiveBalance: number; // 0-100
  offensiveBalance: number; // 0-100
}
```

**Calcul des Faiblesses:**
```typescript
function analyzeTeamWeaknesses(team: Pokemon[]): string[] {
  const weaknessCount: Record<string, number> = {};
  
  for (const pokemon of team) {
    for (const type of allTypes) {
      const effectiveness = calculateTypeEffectiveness(type, pokemon.types);
      if (effectiveness >= 2) {
        weaknessCount[type] = (weaknessCount[type] || 0) + 1;
      }
    }
  }
  
  // Retourne types avec ≥3 Pokémon faibles
  return Object.entries(weaknessCount)
    .filter(([_, count]) => count >= 3)
    .map(([type, _]) => type);
}
```

#### Phase 2: Scoring de Pokémon Candidats

Chaque Pokémon candidat reçoit un score basé sur:

```typescript
interface PokemonScore {
  // Score de base (stats totales)
  baseScore: number; // 0-100
  
  // Bonus couverture offensive
  offensiveBonus: number; // +20 si couvre faiblesses joueur
  
  // Bonus défensif
  defensiveBonus: number; // +15 si résiste aux types joueur
  
  // Bonus rôle
  roleBonus: number; // +10 si rôle nécessaire
  
  // Pénalités
  penalties: number; // -10 si double type, -5 si faible aux Pokémon joueur
  
  // Score final
  finalScore: number;
}
```

**Exemple de Calcul:**

```
Équipe Joueur: Charizard (Feu/Vol), Blastoise (Eau), Venusaur (Plante/Poison)
Faiblesses détectées: Électrique (×2), Roche (×4)

Candidat: Raikou (Électrique)
├─ Base Score: 75/100 (stats élevées)
├─ Offensive Bonus: +20 (super efficace vs 2 Pokémon)
├─ Defensive Bonus: +10 (résiste Vol)
├─ Role Bonus: +10 (special sweeper manquant)
├─ Penalty: -5 (faible à Blastoise)
└─ Final Score: 110/100

Candidat sélectionné: ✅ Raikou
```

#### Phase 3: Construction par Rôles

L'agent assigne des **rôles stratégiques**:

```typescript
enum PokemonRole {
  PHYSICAL_SWEEPER = "Physical Sweeper",    // Attaquant physique
  SPECIAL_SWEEPER = "Special Sweeper",      // Attaquant spécial
  TANK = "Tank",                            // Encaisseur
  WALL = "Wall",                            // Mur défensif
  PIVOT = "Pivot",                          // Pokémon de rotation
  LEAD = "Lead"                             // Pokémon d'ouverture
}
```

**Répartition Idéale:**
- 2 Sweepers (1 physique, 1 spécial)
- 1-2 Tanks
- 1 Wall
- 1-2 Pivots/Support

### Résultat Final

```typescript
interface TeamGenerationResult {
  team: BattleTeam; // Équipe IA générée
  
  reasoning: TeamReasoning[]; // Justification pour chaque Pokémon
  
  analysis: TeamAnalysis; // Analyse complète
}
```

**Exemple de Raisonnement:**

```json
{
  "pokemonName": "tyranitar",
  "role": "Tank",
  "reason": "Counters player's Flying types with Rock moves",
  "counters": ["charizard", "pidgeot"],
  "coverageTypes": ["rock", "dark"]
}
```

---

## ⚔️ Agent 3: Moteur de Combat IA

### Rôle
Agent tactique qui prend des décisions de combat en temps réel pendant les batailles.

### Localisation
- **Fichiers principaux:**
  - `lib/battle/engine.ts` - Moteur de combat
  - `lib/battle/ai.ts` - IA de sélection de moves
  - `lib/battle/damage.ts` - Calculs de dégâts
  - `lib/battle/effects.ts` - Effets des capacités

### Architecture de Décision en Combat

```
┌─────────────────────────────────────────────────────────┐
│         AGENT BATTLE IA - TOUR DE COMBAT                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. ÉVALUATION SITUATION                                 │
│     ├─ HP Pokémon actifs                                 │
│     ├─ Modifications stats (stages)                      │
│     ├─ Conditions de statut                              │
│     └─ Pokémon restants                                  │
│                                                           │
│  2. SCORING DES MOVES                                    │
│     ├─ Efficacité type (×0.25 à ×4)                      │
│     ├─ STAB (×1.5)                                       │
│     ├─ Stats attaquant/défenseur                         │
│     ├─ Précision move                                    │
│     ├─ HP adversaire (finisher)                          │
│     ├─ Historique moves (variété)                        │
│     └─ Effets secondaires                                │
│                                                           │
│  3. SÉLECTION MOVE                                       │
│     ├─ Best move (80% chances)                           │
│     └─ 2nd best (20% chances) → variété                  │
│                                                           │
│  4. EXÉCUTION                                            │
│     ├─ Calcul dégâts                                     │
│     ├─ Application effets                                │
│     └─ Mise à jour état bataille                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Algorithme de Sélection de Move

#### Fonction de Score

```typescript
function evaluateMoveScore(
  move: BattleMove,
  attacker: BattlePokemon,
  defender: BattlePokemon
): number {
  let score = 0;
  
  // 1. Efficacité de type
  const typeEffectiveness = calculateTypeEffectiveness(move.type, defender.types);
  score += typeEffectiveness * 50;
  
  // 2. Puissance ajustée par stats
  if (move.damageClass === "physical") {
    const atkRatio = attacker.currentStats.attack / defender.currentStats.defense;
    score += move.power * atkRatio * 0.5;
  } else if (move.damageClass === "special") {
    const spAtkRatio = attacker.currentStats.specialAttack / defender.currentStats.specialDefense;
    score += move.power * spAtkRatio * 0.5;
  }
  
  // 3. STAB (Same Type Attack Bonus)
  if (attacker.types.includes(move.type)) {
    score += 25;
  }
  
  // 4. Précision
  score *= (move.accuracy / 100);
  
  // 5. HP adversaire faible (finisher)
  const opponentHpPercent = defender.currentHp / defender.maxHp;
  if (opponentHpPercent < 0.3) {
    score *= 1.5;
  }
  
  // 6. Pénalité utilisation récente
  if (attacker.lastUsedMoves?.includes(move.name)) {
    const timesUsed = attacker.lastUsedMoves.filter(m => m === move.name).length;
    score *= Math.pow(0.7, timesUsed); // -30% par utilisation
  }
  
  // 7. Bonus effets secondaires
  if (move.effects && move.effects.length > 0) {
    score *= 1.1;
  }
  
  // 8. Éviter moves de statut si déjà appliqué
  if (move.damageClass === "status") {
    const wouldApplyStatus = move.effects?.some(e => 
      e.type === "status" && defender.statusCondition === e.status
    );
    if (wouldApplyStatus) {
      score = 0; // Ne pas réappliquer même statut
    } else {
      score = 40; // Score de base pour moves de statut
    }
  }
  
  return score;
}
```

#### Exemples de Décision

**Situation 1: Début de combat**
```
Attaquant: Charizard (HP: 155/155)
Défenseur: Venusaur (HP: 160/160)

Moves disponibles:
├─ Flamethrower (Feu, 90, STAB) → Score: 135
│   ├─ Type: ×2 (efficace) = +100
│   ├─ STAB: +25
│   └─ Puissance: +10
├─ Air Slash (Vol, 75, STAB) → Score: 95
├─ Dragon Claw (Dragon, 80) → Score: 70
└─ Earthquake (Sol, 100) → Score: 85

Choix IA: Flamethrower ✅
```

**Situation 2: Adversaire affaibli**
```
Attaquant: Raikou (HP: 145/150)
Défenseur: Gyarados (HP: 25/180) ← 14% HP

Moves disponibles:
├─ Thunderbolt (Électrique, 90, STAB) → Score: 180
│   ├─ Type: ×4 (super efficace) = +200
│   ├─ STAB: +25
│   ├─ HP bas: ×1.5 = +45
│   └─ Total: One-hit KO garanti
├─ Thunder Wave (statut) → Score: 40
└─ Calm Mind (boost) → Score: 40

Choix IA: Thunderbolt ✅ (finisher)
```

**Situation 3: Variété forcée**
```
Attaquant: Metagross
LastUsedMoves: ["meteor-mash", "meteor-mash", "meteor-mash"]

Moves disponibles:
├─ Meteor Mash → Score: 120 × 0.7³ = 41 (pénalité spam)
├─ Earthquake → Score: 95
├─ Zen Headbutt → Score: 85
└─ Bullet Punch → Score: 70

Choix IA: Earthquake ✅ (variété encouragée)
```

---

## 🔄 Interaction entre Agents

### Flux de Travail Global

```
┌────────────────────────────────────────────────────────────────┐
│                    WORKFLOW COMPLET                             │
└────────────────────────────────────────────────────────────────┘

1. UTILISATEUR crée équipe
   ↓
2. AGENT ASSISTANT aide à la composition
   - Suggestions basées préférences
   - Analyse synergies
   ↓
3. AGENT TEAM BUILDER génère adversaire
   - Analyse équipe joueur
   - Construit contre-équipe optimale
   - Justifie chaque choix
   ↓
4. AGENT BATTLE gère le combat
   - Sélection intelligente moves
   - Adaptation tactique
   - Gestion switching
   ↓
5. RÉSULTAT & APPRENTISSAGE
   - Statistiques sauvegardées
   - Feedback assistant
   - Amélioration suggestions futures
```

### Communication Inter-Agents

```typescript
// Agent Assistant → Team Builder
interface AssistantToTeamBuilder {
  userPreferences: {
    favoriteTypes: string[];
    playstyle: "offensive" | "defensive" | "balanced";
    experienceLevel: "beginner" | "intermediate" | "expert";
  };
  currentTeam: Pokemon[];
}

// Team Builder → Battle Engine
interface TeamBuilderToBattle {
  generatedTeam: BattleTeam;
  strategyNotes: string;
  expectedWeaknesses: string[];
  counters: Record<string, string[]>; // Pokémon joueur → Pokémon IA qui le contre
}

// Battle Engine → Assistant
interface BattleToAssistant {
  battleLog: BattleTurn[];
  winner: string;
  statistics: {
    totalTurns: number;
    criticalHits: number;
    effectiveness: Record<string, number>;
  };
  suggestions: string[]; // Suggestions d'amélioration
}
```

---

## 📊 Système de Feedback et Apprentissage

### Collecte de Données

```typescript
interface BattleData {
  // Contexte
  playerTeam: Pokemon[];
  aiTeam: Pokemon[];
  tournamentRules: TournamentRules;
  
  // Résultat
  winner: "player" | "ai";
  totalTurns: number;
  
  // Métriques
  averageDamagePerTurn: number;
  moveEffectiveness: Record<string, number>;
  typeCoverage: Record<string, number>;
  
  // Comportement IA
  aiDecisions: AIDecision[];
  switchingPatterns: SwitchPattern[];
}
```

### Amélioration Continue

Le système collecte et analyse:
1. **Taux de victoire** par type d'équipe
2. **Efficacité des moves** sélectionnés
3. **Patterns de switching** optimaux
4. **Contre-stratégies** réussies

Ces données peuvent être utilisées pour:
- Ajuster les poids de scoring
- Améliorer la sélection de moves
- Optimiser la génération d'équipes
- Personnaliser les suggestions assistant

---

## 🎮 Modes de Fonctionnement

### Mode Standard (Utilisateur Normal)

```
1. Assistant conversationnel actif
2. Team Builder génère adversaire
3. Battle Engine mode standard
4. Suggestions post-combat
```

### Mode Admin

```
1. Assistant avec contrôles avancés
2. Debug panels visibles
3. Logs détaillés génération équipe
4. Analytics temps réel combat
5. Override paramètres IA
```

**Activation:**
```typescript
// components/AdminViewProvider.tsx
const adminViewEnabled = true; // Mode admin

// Fonctionnalités débloquées:
- Panneau de debug IA
- Logs de raisonnement équipe
- Métriques de scoring moves
- Contrôle paramètres combat
```

---

## 🔧 Paramètres et Configuration

### Configuration Agent Assistant

```typescript
// lib/mistralAI.ts
const ASSISTANT_CONFIG = {
  model: "mistral-large-latest",
  temperature: 0.7, // Créativité réponses
  maxTokens: 1000,
  systemPrompt: "Tu es un expert Pokémon...",
  contextWindow: 10, // Nombre messages historique
};
```

### Configuration Team Builder

```typescript
// lib/ai/teamBuilder.ts
const TEAM_BUILDER_CONFIG = {
  // Poids scoring
  offensiveBonusWeight: 20,
  defensiveBonusWeight: 15,
  roleBonusWeight: 10,
  
  // Contraintes
  maxSameType: 2, // Max 2 Pokémon même type
  minTypeCoverage: 8, // Min 8 types différents couverts
  
  // Stratégies
  preferSTAB: true,
  balancePhysicalSpecial: true,
  includeStatusMoves: false,
};
```

### Configuration Battle AI

```typescript
// lib/battle/ai.ts
const BATTLE_AI_CONFIG = {
  // Randomisation
  bestMoveChance: 0.8, // 80% meilleur move
  secondBestChance: 0.2, // 20% 2e meilleur
  
  // Pénalités
  repeatMovePenalty: 0.7, // -30% par répétition
  
  // Seuils
  lowHpThreshold: 0.3, // 30% HP = critique
  finisherBonus: 1.5, // ×1.5 bonus si HP bas
  
  // Historique
  moveHistorySize: 3, // Mémoriser 3 derniers moves
};
```

---

## 📈 Métriques et Performance

### Métriques Agent Assistant

```typescript
interface AssistantMetrics {
  // Utilisation
  totalConversations: number;
  averageMessagesPerSession: number;
  
  // Performance
  averageResponseTime: number; // ms
  apiCallsPerDay: number;
  
  // Qualité
  userSatisfactionScore: number; // 0-5
  taskCompletionRate: number; // %
}
```

### Métriques Team Builder

```typescript
interface TeamBuilderMetrics {
  // Efficacité
  averageGenerationTime: number; // ms
  successRate: number; // % équipes valides
  
  // Équilibre
  averageTypesCovered: number;
  averageDefensiveBalance: number;
  averageOffensiveBalance: number;
  
  // Résultats
  winRateAgainstPlayer: number; // %
  averageTurnsPerBattle: number;
}
```

### Métriques Battle AI

```typescript
interface BattleAIMetrics {
  // Décisions
  totalDecisionsMade: number;
  averageDecisionTime: number; // ms
  
  // Efficacité
  moveAccuracy: number; // % moves réussis
  averageDamagePerTurn: number;
  criticalHitRate: number; // %
  
  // Stratégie
  moveVariety: number; // Diversité moves utilisés
  optimalMoveSelectionRate: number; // %
  switchingFrequency: number; // Par combat
}
```

---

## 🚀 Évolutions Futures

### Améliorations Planifiées

#### 1. Machine Learning Integration
```
Actuellement: Règles fixes + heuristiques
Future: Apprentissage par renforcement

- Entraînement sur milliers de combats
- Adaptation style joueur
- Méta-apprentissage stratégies
```

#### 2. Assistant Proactif
```
Actuellement: Réactif (répond questions)
Future: Proactif (suggère actions)

- Détection moments opportuns
- Suggestions contextuelles
- Alertes stratégiques
```

#### 3. Multi-Agent Collaboration Avancée
```
Actuellement: Pipeline séquentiel
Future: Collaboration temps réel

- Agents communiquent pendant combat
- Ajustements dynamiques stratégie
- Consensus décisions critiques
```

---

## 📚 Conclusion

### Points Clés de l'Architecture

✅ **Modularité**: Chaque agent est indépendant et remplaçable  
✅ **Scalabilité**: Ajout facile de nouveaux agents  
✅ **Maintenabilité**: Code bien structuré et documenté  
✅ **Performance**: Calculs optimisés, caching agressif  
✅ **Extensibilité**: Configuration paramétrable  

### Bénéfices Utilisateur

🎮 **Expérience Enrichie**: IA adaptative et challengeante  
💡 **Apprentissage**: Suggestions et feedback constructifs  
⚡ **Performance**: Réponses rapides, batailles fluides  
🎯 **Stratégie**: Adversaires intelligents et variés  

### Technologies Clés

- **Mistral AI**: Assistant conversationnel
- **PokéAPI**: Données officielles Pokémon
- **TypeScript**: Typage fort, sécurité
- **React**: Interface réactive
- **Next.js**: Framework full-stack

---

**Version:** 1.0.0  
**Date:** 2026-02-16  
**Auteurs:** Équipe Pokédex IA  
**Licence:** Projet Académique ISEN
