# Team Building ML Agents

Ce document explique le fonctionnement des agents de team building (multi-agents heuristiques) et leur pipeline dans le projet.

## 1) Vue d'ensemble

Le module de team building est un systeme multi-agents base sur des heuristiques (pas de modele ML entrainne). Chaque agent analyse un angle precis (types, stats, roles, coverage des attaques, synergie) et l'orchestrateur agrege tout pour fournir des suggestions de Pokemon.

Fichiers principaux:
- lib/agents/TeamBuildingOrchestrator.ts
- lib/agents/teamBuilding/TypeAnalysisAgent.ts
- lib/agents/teamBuilding/StatsAnalysisAgent.ts
- lib/agents/teamBuilding/RoleDistributionAgent.ts
- lib/agents/teamBuilding/MoveCoverageAgent.ts
- lib/agents/teamBuilding/SynergyAgent.ts
- lib/agents/tools/*.ts (outils de calcul)
- app/api/team/suggest/route.ts (exposition API)

## 2) Pipeline global

1. L'API /api/team/suggest recoit une equipe partielle (Pokemon + types + stats).
2. TeamBuildingOrchestrator lance 5 agents d'analyse en parallele.
3. Chaque agent produit un score et des recommandations.
4. L'orchestrateur calcule un score global avec des poids dynamiques.
5. Les candidats sont scannes (pool) et scores, puis classes.

Schema simplifie:

```
Team (current)
  -> TypeAnalysisAgent
  -> StatsAnalysisAgent
  -> RoleDistributionAgent
  -> MoveCoverageAgent
  -> SynergyAgent
       \-------------------------------/
                Orchestrator
             (weights + ranking)
                      |
                Suggestions
```

## 3) Orchestrateur (TeamBuildingOrchestrator)

Fichier: lib/agents/TeamBuildingOrchestrator.ts

Responsabilites:
- Lance les analyses d'equipe (analyzeTeam)
- Calcule le score global (overallScore)
- Evalue des candidats (evaluateCandidates)
- Agrege les recommandations

Poids (priorites) par defaut:
- Synergie: 0.35
- Types: 0.30
- Roles: 0.15
- Stats: 0.10
- Coverage attaques: 0.10

Poids dynamiques selon la taille d'equipe:
- Petite equipe (1-2): synergie et types encore plus forts, stats reduites.
- Equipe moyenne (3-4): reequilibrage progressif.
- Equipe presque complete (5+): tous les axes comptent davantage.

Resultat:
- TeamAnalysis (scores + recommandations)
- CandidateScore (score total + breakdown + details + reasoning)

## 4) Agents et outils

### 4.1 TypeAnalysisAgent
Fichier: lib/agents/teamBuilding/TypeAnalysisAgent.ts
Outil: lib/agents/tools/TypeEffectivenessTool.ts

Ce que l'agent fait:
- Analyse la couverture offensive et defensive des types.
- Detecte les faiblesses critiques (x4).
- Calcule un coverageScore adapte a la taille d'equipe.
- Score un candidat selon son apport de types.

Points importants du scoring:
- Bonus massif pour immunites qui couvrent une faiblesse d'equipe.
- Bonus fort pour resistances contre les faiblesses critiques.
- Bonus pour nouveaux types offensifs.
- Penalite progressive si le candidat partage trop de faiblesses.

### 4.2 StatsAnalysisAgent
Fichier: lib/agents/teamBuilding/StatsAnalysisAgent.ts
Outil: lib/agents/tools/StatsAnalyzerTool.ts

Ce que l'agent fait:
- Analyse les stats moyennes (HP, Atk, Def, SpA, SpD, Speed).
- Identifie les gaps (vitesse, bulk, biais physique/special).
- Score les candidats pour equilibrer la team.

Points importants:
- Les stats brutes ont un poids reduit.
- Bonus si le candidat corrige une equipe trop lente ou trop rapide.
- Bonus si le candidat corrige le biais physique/special.
- Bonus si l'equipe manque de bulk et que le candidat est un wall/bulky.

### 4.3 RoleDistributionAgent
Fichier: lib/agents/teamBuilding/RoleDistributionAgent.ts
Outil: lib/agents/tools/RoleClassifierTool.ts

Ce que l'agent fait:
- Classifie les roles strategiques (sweeper, tank, support, pivot, revenge-killer, etc.).
- Detecte les roles manquants et surcharges.
- Score un candidat selon sa contribution aux roles.

Points importants:
- Bonus tres fort si un role essentiel manque (sweeper/tank/support).
- Bonus pour role nouveau ou polyvalent.
- Penalite reduite si un role est surrepresente.

### 4.4 MoveCoverageAgent
Fichier: lib/agents/teamBuilding/MoveCoverageAgent.ts
Outil: lib/agents/tools/MoveCoverageTool.ts

Ce que l'agent fait:
- Approxime la couverture offensive via les types (proxy des moves).
- Calcule un coverageScore adapte a la taille d'equipe.
- Identifie des types problematiques (steel, fairy, water, dragon, ghost).

Points importants:
- Bonus pour nouveaux types STAB.
- Bonus fort si le candidat couvre des types mal couverts.
- Bonus pour dual-type (flexibilite).

### 4.5 SynergyAgent
Fichier: lib/agents/teamBuilding/SynergyAgent.ts
Outil: lib/agents/tools/SynergyAnalyzerTool.ts

Ce que l'agent fait:
- Mesure la synergie globale (score 0-100).
- Detecte synergies positives (ex: core feu-eau-plante).
- Detecte anti-synergies (ex: redondance de types, equipe trop lente).

Points importants du scoring:
- Score de base adapte a la taille d'equipe.
- Bonus plus fort pour synergies positives.
- Penalites reduites pour petites equipes.
- Penalite si redondance de types.

## 5) API d'integration

Fichier: app/api/team/suggest/route.ts

Fonctionnement:
- Recoit une equipe partielle du joueur (Pokemon + types + stats).
- Cree un pool de candidats via un set de Pokemon preselectionnes.
- Fetch les stats de candidats via PokeAPI.
- Lance l'orchestrateur et renvoie les top suggestions.

Reponse typique:
- suggestions: liste des Pokemon recommandes + score + reasoning
- analysis: scores globaux, faiblesses critiques, roles manquants, etc.

## 6) Team Builder IA (generation equipe adverse)

Fichier: lib/ai/teamBuilder.ts

Ceci est un autre module rule-based, distinct du multi-agent team building. Il sert a generer une equipe adverse pour un mode tournoi.

Etapes principales:
1. Analyse de l'equipe joueur (faiblesses, resistances, stats moyennes).
2. Score des candidats contre l'equipe joueur.
3. Selection d'une equipe ennemie avec roles et coverage.
4. Generation de moves (PokeAPI) ou fallback par defaut.

Parametres principaux:
- TournamentRules (allowLegendaries, allowMegas, allowGigantamax, targetLevel)
- TeamGenerationResult (team + reasoning + analysis)

## 7) Points cles de design

- Heuristiques explicables: chaque score fournit des details et une raison.
- Poids dynamiques: l'equipe n'est pas penalisee quand elle est incomplete.
- Synergie et types prioritaires: pour eviter les suggestions redondantes.
- Module extensible: ajout d'agents ou d'heuristiques possible sans casser le pipeline.
