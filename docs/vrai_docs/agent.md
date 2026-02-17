# 🤖 Architecture des Agents - Guide Complet

> Documentation complète sur l'architecture MasterAgent et SubAgents du Pokédex AI

## 📋 Table des matières

- [🎯 MasterAgent - L'Orchestrateur](#masteragent)
- [🔧 TeamBuildingAgent](#teambuilding-agent)
- [⚔️ BattleAgent](#battle-agent)
- [📊 Comparaison des Agents](#comparaison)

---

## 🎯 MasterAgent - L'Orchestrateur Principal {#masteragent}

<div align="center">

![Status](https://img.shields.io/badge/Status-Production-success)
![Type](https://img.shields.io/badge/Type-Orchestrator-blue)
![LLM](https://img.shields.io/badge/LLM-Mistral%20%7C%20Ollama-purple)

</div>

### 🎯 Rôle et Responsabilités

Le **MasterAgent** est le point d'entrée central qui :

| Responsabilité | Description |
|----------------|-------------|
| 🎭 **Classification** | Identifie le type de tâche demandée |
| 🔀 **Délégation** | Route vers le SubAgent approprié |
| 🧠 **Réflexion** | Utilise le LLM pour l'analyse complexe |
| 📊 **Agrégation** | Compile les résultats finaux |

### 🎭 Analogies pour Comprendre le MasterAgent

<table>
<tr>
<td width="33%">

#### 🍴 Le Restaurant

```
MasterAgent = Maître d'hôtel
```

**Scénario:**
1. 👤 Client: _"Je veux une bonne équipe Pokémon"_
2. 🤵 Maître: _"C'est du TEAM_BUILDING"_
3. 👨‍🍳 Appelle: _"Chef TeamBuilding!"_
4. ✅ Résultat: _"Équipe prête!"_

</td>
<td width="33%">

#### 🏥 L'Hôpital

```
MasterAgent = Infirmier d'accueil
```

**Scénario:**
1. 🤒 Patient: _"J'ai mal à la tête!"_
2. 👩‍⚕️ Infirmier: _"Cas pour le NEUROLOGUE"_
3. 👨‍⚕️ Envoi au service spécialisé
4. ✅ Diagnostic prêt

</td>
<td width="33%">

#### 🕵️ Le Détective

```
MasterAgent = Chef de police
```

**Scénario:**
1. 🚨 Vol de voiture signalé
2. 👮 Chef: _"Cas de CAMBRIOLAGE"_
3. 🔍 Inspecteur enquête
4. ✅ Coupable identifié

</td>
</tr>
</table>

### 💬 Comment ça marche ?

```mermaid
sequenceDiagram
    participant Client as 👤 Client/Frontend
    participant API as 🌐 API Endpoint
    participant Master as 🤖 MasterAgent
    participant SubAgent as 🔧 SubAgent
    
    Client->>API: POST /api/team/suggest<br/>{ team: [...] }
    API->>Master: JSON Body
    Note over Master: 1. new MasterAgent()<br/>- Init LLM (Mistral/Ollama)<br/>- Crée SubAgents
    Note over Master: 2. process(request)<br/>- Analyse la tâche<br/>- Réflexion LLM (optionnel)<br/>- Détermine type
    Master->>SubAgent: Délégation
    SubAgent-->>Master: Résultats
    Master-->>API: MasterAgentResponse
    API-->>Client: JSON Response
```

### 📦 Structure du MasterAgent

```typescript
class MasterAgent {
  private llmClient: LLMChatClient;        // Mistral ou Ollama
  private teamBuildingAgent: TeamBuildingAgent;
  private battleAgent: BattleAgent;
  
  async process(request: MasterAgentRequest): Promise<MasterAgentResponse> {
    // 1. Analyse de la requête
    // 2. Réflexion LLM (si activée)
    // 3. Délégation au SubAgent
    // 4. Retour de la réponse
  }
}
```

---

## 🔧 SubAgents - Les Spécialistes

### TeamBuildingAgent - Expert Construction d'Équipes {#teambuilding-agent}

<div align="center">

![Type](https://img.shields.io/badge/Type-SubAgent-10B981)
![Specialization](https://img.shields.io/badge/Specialization-Team%20Building-blue)

</div>

#### 🎯 Mission

Spécialiste de la construction d'équipes Pokémon avec 4 capacités principales :

| Mode | Description | Cas d'usage |
|------|-------------|-------------|
| 💡 **SUGGEST** | Suggère des Pokémon complémentaires | "À ajouter dans mon équipe ?" |
| 🔍 **ANALYZE** | Analyse une équipe complète | "Mon équipe est-elle équilibrée ?" |
| 🛡️ **COUNTER** | Crée un counter à une équipe adverse | "Comment battre cette équipe ?" |
| ✨ **GENERATE** | Génère une équipe complète | "Crée-moi une équipe !" |

#### 🎭 Analogie - Le Coach Sportif

> Tu vas au gym et dis: **"Je veux une bonne équipe musculaire"**
> 
> - 👨‍🏫 Coach: "Montre-moi tes muscles"
> - 📊 Analyse: "Tu es faible aux jambes"
> - 💡 Conseil: "3 exos de jambes pour équilibrer"
> - ✅ Résultat: Équipe d'exercices équilibrée !

---

### 📄 MODE 1 - SUGGEST (Suggestion)

**Contexte:** Tu as `[Pikachu, Squirtle]` et cherches un 3ème membre.

```mermaid
flowchart LR
    A[👥 Équipe actuelle] --> B[🔍 TypeAnalysisTool]
    B --> C{Manque Grass<br/>coverage}
    C --> D[⭐ TeamScorerTool]
    D --> E[🏆 Classement]
    
    E --> F[1️⃣ Venusaur 85/100]
    E --> G[2️⃣ Exeggcutor 82/100]
    E --> H[3️⃣ Vileplume 79/100]
    
    style F fill:#10B981,color:#fff
    style C fill:#F59E0B,color:#000
```

**Processus détaillé:**

1. 📊 **Analyse** des 2 Pokémon existants
2. 🔍 **TypeAnalysisTool** détecte: _"Manque Grass coverage"_
3. ⭐ **TeamScorerTool** évalue chaque candidat Grass
4. 🏆 **Classement** par score
5. ✅ **Réponse**: _"Venusaur est le meilleur choix"_

---

### 📄 MODE 2 - ANALYZE (Analyse Complète)

**Contexte:** Tu as une équipe de 6 Pokémon et demandes: _"C'est bon mon équipe ?"_

**Outils utilisés:**

| Outil | Fonction | Résultat |
|-------|----------|----------|
| 🎨 TypeAnalysisTool | Couverture de types | _"Couverture: 85%, Faiblesses: Ground, Rock"_ |
| 🎭 RoleClassifierTool | Classification des rôles | _"2 sweepers, 2 walls, 1 pivot, 1 support"_ |
| 🤝 SynergyTool | Synergie d'équipe | _"Mauvaise synergie: 2 electric"_ |
| ⭐ TeamScorerTool | Score global | _"Note: 72/100 → Grade: B"_ |

> **📋 Réponse finale:** _"Équipe correcte mais trop d'electrics, équilibre mieux les types"_

---

### 📄 MODE 3 - COUNTER (Counter l'Adversaire)

**Contexte:** Adversaire a `[Dragonite, Alakazam, ...]` - Comment le contrer ?

```mermaid
flowchart TD
    A[👁️ Équipe adverse] --> B{Analyse faiblesses}
    B -->|Dragonite| C[❄️ Ice/🪨 Rock]
    B -->|Alakazam| D[🌑 Dark/🐛 Bug]
    C & D --> E[🔍 Cherche counters]
    E --> F[✅ Lapras]
    E --> G[✅ Tyranitar]
    E --> H[✅ Umbreon]
    F & G & H --> I[🏆 Équipe counter prête]
    
    style I fill:#10B981,color:#fff
    style A fill:#EF4444,color:#fff
```

**Stratégie:**
1. 🎨 **TypeAnalysisTool** identifie les faiblesses de chaque ennemi
2. 🔍 **Recherche** de Pokémon avec super-effectiveness
3. 🛡️ **Sélection** de Pokémon résistants aux attaques adverses
4. ⭐ **Validation** avec TeamScorerTool

---

### 📄 MODE 4 - GENERATE (Génération Complète)

**Contexte:** _"Génère-moi une équipe de dragons légendaires!"_

<table>
<tr>
<td>

**📝 Étapes:**

1. 🔍 **Filtrage** du pool (type Dragon)
2. 🎭 **RoleClassifierTool** → Rôles variés
3. 🤝 **SynergyTool** → Synergie optimale
4. ⭐ **TeamScorerTool** → Validation finale

</td>
<td>

**🏆 Résultat:**

```json
{
  "team": [
    "Dragonite",    // Sweeper
    "Salamence",    // Sweeper
    "Garchomp",     // Physical
    "Dialga",       // Tank
    "Latios",       // Special
    "Altaria"       // Support
  ],
  "score": 88
}
```

</td>
</tr>
</table>

---

## ⚔️ BattleAgent - Expert Combat {#battle-agent}

<div align="center">

![Type](https://img.shields.io/badge/Type-SubAgent-EF4444)
![Specialization](https://img.shields.io/badge/Specialization-Battle%20Strategy-orange)

</div>

### 🎯 Mission

Spécialiste des décisions en combat temps réel :

| Capacité | Description |
|----------|-------------|
| 🎮 **Décision de Move** | Choisit l'attaque optimale |
| 🔄 **Switch Strategy** | Décide quand changer de Pokémon |
| 📊 **Win Probability** | Calcule les chances de victoire |
| 🤖 **Auto-Battle** | Simule combats complets 6v6 |

### 🎭 Analogie - Le Commentateur Sportif

> **Tour 1 du match de boxe:**
> 
> 🎤 Le commentateur analyse en direct :
> - 👊 _"Le champion A va attaquer à droite"_ (BattleDecisionTool)
> - 💥 _"Ça fera environ 80 dégâts"_ (DamageCalculatorTool)
> - ⚡ _"Le champion B sera plus rapide"_ (SpeedComparatorTool)
> - 😴 _"Attention, il est fatigué"_ (StatusEffectTool)
> - 📈 _"Probabilité de victoire: 65% pour A"_ (WinProbabilityTool)

---

### ⚙️ Méthode 1: executeTurn()

**Contexte:** `Pikachu vs Dragonite` au tour 3 - _"Qu'est-ce que je fais ?"_

```mermaid
flowchart TD
    Start[Pikachu vs Dragonite] --> A[Analyse État]
    
    subgraph Analyse
        B[StatusEffectTool]
        C[SpeedComparatorTool]
        D[BattleDecisionTool]
    end
    
    A --> B
    B -->|Pas de malus| C
    C -->|Plus rapide| D
    D --> E{Eval moves}
    
    E -->|95/100| F[⚡ Thunderbolt]
    E -->|60/100| G[💥 Thunder Wave]
    E -->|40/100| H[👊 Quick Attack]
    
    F --> I[DamageCalculatorTool]
    I --> J{118 dommages<br/>Dragonite: 120 HP<br/>98% KO}
    J --> K[✅ Réponse:<br/>THUNDERBOLT!]
    
    style F fill:#10B981,color:#fff
    style K fill:#4F46E5,color:#fff
    style J fill:#F59E0B,color:#000
```

**🎯 Décision finale:** _"Utilise **THUNDERBOLT** - Super efficace + peut KO!"_

---

### ⚙️ Méthode 2: autoBattle() - Simulation

**Contexte:** Simulation complète sans joueur humain

<table>
<tr>
<td width="50%">

**🔄 Procédure:**

```typescript
while (teamA.alive > 0 && teamB.alive > 0) {
  // Tour N
  executeTurn(teamA, teamB);
  
  if (pokemon.hp <= 0) {
    autoSwitch();
  }
  
  turn++;
}

return winner;
```

</td>
<td width="50%">

**🏆 Résultats possibles:**

- ✅ _"Joueur gagne en 6 tours!"_
- ❌ _"IA gagne en 8 tours!"_
- 🤝 _"Match nul après 100 tours"_

**📊 Statistiques:**
- Dommages totaux
- Kills par Pokémon
- MVP du match

</td>
</tr>
</table>

---

### ⚙️ Méthode 3: analyzeCurrentState()

**Contexte:** _"Analyse la situation actuelle"_

```mermaid
pie title Distribution des Avantages
    "Player" : 65
    "IA" : 35
```

**📊 Analyse détaillée:**

| Critère | Valeur | Impact |
|---------|--------|--------|
| 🏆 **Avantage** | PLAYER | 65% |
| 🔥 **Momentum** | PLAYER | Initiative |
| 💪 **Buffs** | +1 Attack | Positif |
| ⚠️ **Risques** | Faible Ground | Critique |
| 🎯 **Matchup** | Favorable | Très bon |

> **💡 Recommandations:**
> - 💥 Attaque agressivement
> - ⚠️ Attention au Ground move
> - ✅ Tu peux potentiellement KO

---

## 📊 Comparaison MasterAgent vs SubAgents {#comparaison}

<div align="center">

### Tableau Comparatif

</div>

| Critère | 🤖 MasterAgent | 🔧 SubAgents |
|---------|------------------|-------------|
| **Rôle** | 🎭 Orchestrateur | 💼 Spécialiste |
| **Niveau** | 📊 Haut niveau | 🔧 Détails techniques |
| **Décisions** | "❓ Quel SubAgent?" | "🛠️ Comment faire?" |
| **LLM** | ✅ Oui (réflexion) | ❌ Non (exécution) |
| **Nombre** | 1️⃣ Un seul | 2️⃣+ Plusieurs |
| **Fichier** | `MasterAgent.ts` | `subAgents/*.ts` |
| **Outils** | ❌ Aucun | ✅ TeamBuilding/Battle Tools |

---

### 🔄 Flux Complet - Exemple 1

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant M as 🤖 MasterAgent
    participant S as 🔧 TeamBuildingAgent<br/>(SubAgent)
    participant T as 🛠️ Tools
    
    C->>M: "Je veux une équipe!"
    Note over M: Classification:<br/>TEAM_BUILDING
    M->>S: Délégation
    S->>T: TypeAnalysisTool
    S->>T: TeamScorerTool
    S->>T: SynergyTool
    T-->>S: Résultats
    S-->>M: Top 10 Pokémon
    M-->>C: "Voici les 10 meilleurs"
```

---

### ⚔️ Flux Complet - Exemple 2

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant M as 🤖 MasterAgent
    participant B as ⚔️ BattleAgent<br/>(SubAgent)
    participant T as 🛠️ Battle Tools
    
    C->>M: "Pikachu vs Dragonite,<br/>quoi faire?"
    Note over M: Classification:<br/>BATTLE
    M->>B: Délégation
    B->>T: BattleDecisionTool
    B->>T: DamageCalculatorTool
    B->>T: SpeedComparatorTool
    T-->>B: Résultats calculs
    B-->>M: "Use THUNDERBOLT"
    M-->>C: "Attaque avec Thunderbolt!"
```

---

## 🎓 Conclusion

<div align="center">

**L'architecture multi-agent permet:**

🧩 **Modularité** • 🎯 **Spécialisation** • 🔄 **Scalabilité** • 🧑‍💻 **Maintenabilité**

</div>

> Le **MasterAgent** orchestre intelligemment les **SubAgents** spécialisés,
> qui utilisent des **Tools** précis pour accomplir des tâches complexes
> de manière efficace et maintenable.

---

<div align="center">

🔗 **Voir aussi:**
[Architecture Complète](ok.md) • [Documentation Tools](tool.md) • [Multi-Agent Diagram](multi-agent-architecture.md)

</div>
