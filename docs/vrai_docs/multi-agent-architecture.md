# Architecture Multi-Agent (Pokedex-AI)

---

## Diagramme Mermaid

```mermaid
graph TB
    MA[MasterAgent<br/>Mistral LLM]
    
    subgraph " "
        direction TB
        SBA[TeamBuildingAgent<br/>Construction d'équipes]
        subgraph "Tools TeamBuilding"
            TA[TypeAnalysisTool<br/>Analyse des types]
            RA[RoleClassifierTool<br/>Classification des rôles]
            SY[SynergyTool<br/>Analyse des synergies]
            SC[TeamScorerTool<br/>Scoring d'équipe]
        end
        SBA --> TA
        SBA --> RA
        SBA --> SY
        SBA --> SC
    end
    
    subgraph " "
        direction TB
        BA[BattleAgent<br/>Gestion des combats]
        subgraph "Tools Battle"
            BD[BattleDecisionTool<br/>Décisions tactiques]
            DC[DamageCalculatorTool<br/>Calcul des dégâts]
            SP[SpeedComparatorTool<br/>Comparaison vitesse]
            SE[StatusEffectTool<br/>Effets de statut]
            SM[StatModifierTool<br/>Modificateurs stats]
        end
        BA --> BD
        BA --> DC
        BA --> SP
        BA --> SE
        BA --> SM
    end
    
    subgraph " "
        direction TB
        QA[QuizAgent<br/>Quiz et apprentissage]
        QA -.->|Utilise| TA
        QA -.->|Utilise| RA
    end

    MA ==> SBA
    MA ==> BA
    MA ==> QA

    classDef masterStyle fill:#4F46E5,stroke:#312E81,stroke-width:3px,color:#fff
    classDef agentStyle fill:#10B981,stroke:#065F46,stroke-width:2px,color:#fff
    classDef toolStyle fill:#F59E0B,stroke:#92400E,stroke-width:2px,color:#000
    
    class MA masterStyle
    class SBA,BA,QA agentStyle
    class TA,RA,SY,SC,BD,DC,SP,SE,SM toolStyle
```

---

## Explication

- **MasterAgent (Mistral)** : Agent principal, reçoit les requêtes utilisateur et délègue aux sous-agents.
- **SubAgents** :
    - TeamBuildingAgent : Gère la construction et l'analyse d'équipe.
    - BattleAgent : Gère la logique de combat.
    - QuizAgent : Gère les quiz et l'apprentissage.
- **Tools** : Chaque agent utilise des outils spécialisés pour l'analyse, le scoring, la décision, etc.

Ce schéma montre la hiérarchie et les interactions : le MasterAgent orchestre, les SubAgents exécutent des tâches complexes, et les Tools réalisent des analyses précises.

---

> Diagramme généré automatiquement — modifiable pour ajouter d'autres agents ou outils.
