# Battle Agents (Battle Engine IA)

Ce document explique le fonctionnement du Battle Engine multi-agent et ses integrations.

## 1) Vue d'ensemble

Le Battle Engine est un systeme multi-agents qui simule un tour de combat et choisit une action optimale (attaque ou switch). Chaque agent se concentre sur un aspect du combat, et l'orchestrateur assemble la decision finale.

Fichiers principaux:
- lib/agents/battleEngine/tools/*.ts
- lib/agents/battleEngine/agents/*.ts
- lib/agents/battleEngine/BattleOrchestrator.ts
- lib/agents/battleEngine/agents/EnemyTeamGeneratorAgent.ts
- app/api/battle/ai-action/route.ts
- app/api/battle/generate-team/route.ts

## 2) Les 5 outils (calcul)

1) DamageCalculatorTool
- Fichier: lib/agents/battleEngine/tools/DamageCalculatorTool.ts
- Role: calcule les degats (formule Gen V+), STAB, crit, type effectiveness, burn penalty.

2) SpeedComparatorTool
- Fichier: lib/agents/battleEngine/tools/SpeedComparatorTool.ts
- Role: determine l'ordre de tour, gere les priorites, et l'impact de la paralysie.

3) StatModifierTool
- Fichier: lib/agents/battleEngine/tools/StatModifierTool.ts
- Role: gere les stages -6 a +6 et calcule les stats effectives.

4) StatusEffectTool
- Fichier: lib/agents/battleEngine/tools/StatusEffectTool.ts
- Role: gere burn, poison, paralysis, sleep, freeze, plus les effets volatiles.

5) BattleDecisionTool
- Fichier: lib/agents/battleEngine/tools/BattleDecisionTool.ts
- Role: score les actions, estime les chances de KO, evalue le switch, predit l'adversaire, calcule la win probability.

## 3) Les 5 agents (analyse)

1) DamageCalculationAgent
- Fichier: lib/agents/battleEngine/agents/DamageCalculationAgent.ts
- Utilise DamageCalculatorTool pour evaluer tous les moves et les chances de KO.

2) SpeedOrderAgent
- Fichier: lib/agents/battleEngine/agents/SpeedOrderAgent.ts
- Utilise SpeedComparatorTool pour l'ordre de tour et l'outspeed.

3) StatModifierAgent
- Fichier: lib/agents/battleEngine/agents/StatModifierAgent.ts
- Utilise StatModifierTool pour recommander boosts/debuffs.

4) StatusEffectAgent
- Fichier: lib/agents/battleEngine/agents/StatusEffectAgent.ts
- Utilise StatusEffectTool pour choisir le meilleur statut a appliquer.

5) BattleDecisionAgent
- Fichier: lib/agents/battleEngine/agents/BattleDecisionAgent.ts
- Utilise BattleDecisionTool pour la decision finale (attaque/switch).

## 4) Orchestrateur

Fichier: lib/agents/battleEngine/BattleOrchestrator.ts

Pipeline standard d'un tour:
1. SpeedOrderAgent -> ordre de tour
2. DamageCalculationAgent -> degats et KO chance
3. StatModifierAgent -> boosts/debuffs utiles
4. StatusEffectAgent -> meilleur statut
5. BattleDecisionAgent -> action finale

Sortie:
- TurnResult avec decision, confidence, analyses detaillees, logs.

## 5) Generation d'equipe adverse

Fichier: lib/agents/battleEngine/agents/EnemyTeamGeneratorAgent.ts

- Genere une equipe selon un niveau de difficulte (easy/medium/hard/nightmare).
- Cherche un bon equilibre entre couverture, roles et counters.

## 6) API d'integration

1) /api/battle/ai-action
- Fichier: app/api/battle/ai-action/route.ts
- Entree: BattleState
- Sortie: action IA + confiance + reasoning + prediction

2) /api/battle/generate-team
- Fichier: app/api/battle/generate-team/route.ts
- Entree: difficulty + equipe joueur
- Sortie: equipe adverse equilibree

## 7) Points cles de design

- Decisions explicables: reasoning et logs exposes.
- Agents specialises: chaque agent couvre un aspect critique.
- Orchestration deterministe: meme input -> meme output (rule-based).
- Extensible: ajout d'agents ou de nouvelles heuristiques possible.
