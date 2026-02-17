# Architecture Multi-Agent (Pokedex-AI)

---

## Diagramme Mermaid

```mermaid
graph TD
    MA(MasterAgent [Mistral])
    SBA(TeamBuildingAgent)
    BA(BattleAgent)
    QA(QuizAgent)
    TA(TypeAnalysisTool)
    RA(RoleClassifierTool)
    SY(SynergyTool)
    SC(TeamScorerTool)
    BD(BattleDecisionTool)
    DC(DamageCalculatorTool)
    SP(SpeedComparatorTool)
    SE(StatusEffectTool)
    SM(StatModifierTool)

    MA --> SBA
    MA --> BA
    MA --> QA

    SBA --> TA
    SBA --> RA
    SBA --> SY
    SBA --> SC

    BA --> BD
    BA --> DC
    BA --> SP
    BA --> SE
    BA --> SM

    QA -->|Utilise| TA
    QA -->|Utilise| RA

    subgraph TeamBuildingAgent
        TA
        RA
        SY
        SC
    end

    subgraph BattleAgent
        BD
        DC
        SP
        SE
        SM
    end
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
