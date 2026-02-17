═══════════════════════════════════════════════════════════════════════════════
                  SUBAGENT vs MASTERAGENT - EXPLICATION SIMPLE
═══════════════════════════════════════════════════════════════════════════════


🤖 MASTERAGENT - L'ORCHESTRATEUR PRINCIPAL
═══════════════════════════════════════════════════════════════════════════════

À QUOI ÇA SERT?
───────────────
C'est le CHEF D'ORCHESTRE qui décide:
• Quelle tâche tu veux faire? (team_building ou battle?)
• Quel SubAgent appeler pour le faire?
• Utiliser le LLM (Mistral/Ollama) pour réfléchir ou pas?

ANALOGIE #1 - Le Restaurant:
────────────────────────────
MasterAgent = Le maître d'hôtel
├─ Tu arrives: "Je veux une bonne équipe Pokémon"
├─ Maître d'hôtel pense: "Hmm, c'est une tâche de TEAM_BUILDING"
├─ Il appelle: "Chef TeamBuilding, prépare une bonne équipe!"
└─ Chef revient: "Voilà, équipe prête!"

ANALOGIE #2 - L'Hôpital:
────────────────────────
MasterAgent = L'infirmier d'accueil
├─ Patient arrive: "J'ai mal à la tête!"
├─ Infirmier décide: "C'est un cas pour le NEUROLOGUE"
├─ Il envoie au: "Service Neurologie (SubAgent)"
├─ Neurologue traite et revient avec diagnostic
└─ Infirmier présente le résultat au patient

ANALOGIE #3 - Le Détective:
────────────────────────────
MasterAgent = Chef de la police (commissaire)
├─ Quelqu'un vole une voiture → il pense: "Cas de CAMBRIOLAGE"
├─ Il appelle: "Inspecteur Cambriolage!"
├─ Inspecteur enquête et revient: "Le coupable c'est..."
└─ Chef présente: "Voici la solution!"


COMMENT ÇA MARCHE?
──────────────────

┌─────────────────────────────────────────┐
│        CLIENT (Ton App / Frontend)       │
├─────────────────────────────────────────┤
│ POST /api/team/suggest                  │
│ { team: [...] }                         │
└────────────┬────────────────────────────┘
             │ JSON Body
             ▼
┌─────────────────────────────────────────┐
│  MASTERAGENT (lib/agents/MasterAgent.ts)│
├─────────────────────────────────────────┤
│ 1. new MasterAgent()                    │
│    ├─ LLM client = Mistral ou Ollama   │
│    └─ Crée les 2 SubAgents            │
│                                         │
│ 2. agent.process(request)               │
│    ├─ Analyse: c'est quoi la tâche?    │
│    ├─ Si reflection=true:               │
│    │  └─ Appelle LLM → "Qu'est-ce que  │
│    │     l'utilisateur demande?"       │
│    ├─ Détermine: team_building/battle  │
│    └─ Appelle le bon SubAgent          │
│                                         │
│ 3. return MasterAgentResponse           │
└────────────┬────────────────────────────┘
             │
             ▼
        SUBAGENT

════════════════════════════════════════════════════════════════════════════════

🎯 SUBAGENT #1 - TeamBuildingAgent
════════════════════════════════════════════════════════════════════════════════

À QUOI ÇA SERT?
───────────────
SPÉCIALISTE de la construction d'équipes Pokémon:
• Suggère des Pokémon pour compléter l'équipe
• Analyse ton équipe
• Counter une équipe adverse
• Génère une équipe complète

ANALOGIE - Le Formateur en Gym:
────────────────────────────────
Tu viens au gym et dis: "Je veux une bonne équipe musculaire"
├─ Formateur: "Montrez-vous vos muscles"
├─ Il analyse: "Vous êtes faible aux jambes"
├─ Il propose: "3 exos de jambes pour équilibrer"
└─ Résultat: Équipe d'exercices équilibrée!

MODES DE TRAVAIL:
─────────────────

MODE 1 - SUGGEST (Suggère des Pokémon)
┌─────────────────────────────────────┐
│ Tu as: [Pikachu, Squirtle] │
│ Demande: "C'est quoi le 3e?" │
│ │
│ TeamBuildingAgent: │
│ 1. Regarde tes 2 Pokémon │
│ 2. Utilise TypeAnalysisTool │
│ → "Tu manques Grass coverage" │
│ 3. Utilise TeamScorerTool │
│ → Score chaque candidat │
│ 4. Classement: │
│ Rank 1: Venusaur (85/100) │
│ Rank 2: Exeggcutor (82/100) │
│ Rank 3: Vileplume (79/100) │
│ │
│ Réponse: "Venusaur est le meilleur"│
└─────────────────────────────────────┘

MODE 2 - ANALYZE (Analyse une équipe)
┌─────────────────────────────────────┐
│ Tu as: [6 Pokémon] │
│ Demande: "C'est bon mon équipe?" │
│ │
│ TeamBuildingAgent: │
│ 1. Utilise TypeAnalysisTool │
│ → "Couverture: 85%, Faiblesses: │
│ Ground, Rock" │
│ 2. Utilise RoleClassifierTool │
│ → "Types: 2 sweepers, 2 walls, │
│ 1 pivot, 1 support" │
│ 3. Utilise SynergyTool │
│ → "Mauvaise synergie: 2 electric"│
│ 4. Utilise TeamScorerTool │
│ → Note: 72/100 → Grade: B │
│ │
│ Réponse: "Équipe correcte mais │
│ trop d'electrics, équilibre mieux" │
└─────────────────────────────────────┘

MODE 3 - COUNTER (Counter l'adversaire)
┌─────────────────────────────────────┐
│ Adversaire a: [Dragonite, Alakazam]│
│ Demande: "Fais-moi une équipe pour │
│ le counter!" │
│ │
│ TeamBuildingAgent: │
│ 1. Utilise TypeAnalysisTool │
│ → "Dragonite faible à Ice/Rock" │
│ → "Alakazam faible à Dark/Bug" │
│ 2. Cherche Pokémon qui: │
│ ✓ Frappent super-efficace │
│ ✓ Résistent à leurs attaques │
│ 3. Sélectionne automatiquement │
│ Lapras (Ice), Tyranitar (Rock) │
│ Alakazam counter, etc. │
│ │
│ Réponse: "Voici une équipe pour │
│ counter: [...]" │
└─────────────────────────────────────┘

MODE 4 - GENERATE (Crée une équipe)
┌─────────────────────────────────────┐
│ Demande: "Génère-moi une équipe de │
│ dragons legendaires!" │
│ │
│ TeamBuildingAgent: │
│ 1. Filter le pool: sur-dragons │
│ 2. Utilise RoleClassifierTool │
│ → Sélectionne roles variés │
│ 3. Utilise SynergyTool │
│ → Assemble une bonne équipe │
│ 4. Utilise TeamScorerTool │
│ → Valide la note globale │
│ │
│ Réponse: "Voici une équipe dragons │
│ équilibrée: [Dragonite, Salamence]"│
└─────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════

🎯 SUBAGENT #2 - BattleAgent
════════════════════════════════════════════════════════════════════════════════

À QUOI ÇA SERT?
───────────────
SPÉCIALISTE des décisions pendant le combat:
• Décide quel move utiliser au tour X
• Décide s'il faut switch de Pokémon
• Évalue la probabilité de gagner
• Simule des combats complets 6v6

ANALOGIE - Le Commentateur de Sport:
─────────────────────────────────────
Tour 1 du match de boxe:
Commentateur analysé:
├─ "Le champion A va attaquer à droite (BattleDecisionTool)"
├─ "Ça fera environ 80 dégâts (DamageCalculatorTool)"
├─ "Le champion B sera plus rapide (SpeedComparatorTool)"
├─ "Attention, il est fatigué (StatusEffectTool)"
└─ "Probabilité de victoire: 65% pour A (WinProbabilityTool)"

MÉTHODES PRINCIPALES:
──────────────────────

MÉTHODE 1 - executeTurn()
┌─────────────────────────────────────┐
│ Ton Pikachu vs Dragonite (tour 3) │
│ Demande: "Qu'est-ce que je fais?" │
│ │
│ BattleAgent: │
│ 1. Utilise StatusEffectTool │
│ → "Pas de malus, tu peux agir" │
│ 2. Utilise SpeedComparatorTool │
│ → "Tu es plus rapide, tu attaques│
│ en premier" │
│ 3. Utilise BattleDecisionTool │
│ → Évalue TOUS les moves: │
│ • Thunderbolt: 95/100 (super │
│ efficace contre Flying) │
│ • Thunder Wave: 60/100 │
│ • Quick Attack: 40/100 │
│ → Meilleur: Thunderbolt │
│ 4. Utilise DamageCalculatorTool │
│ → "Thunderbolt fait 118 dégâts" │
│ → "Dragonite a 120 HP" │
│ → "98% de chance de KO!" │
│ │
│ Réponse: "Utilise THUNDERBOLT!" │
│ Raison: "Super-efficace + peut KO" │
└─────────────────────────────────────┘

MÉTHODE 2 - autoBattle() [Simulation]
┌─────────────────────────────────────┐
│ Demande: "Simule le combat complet" │
│ (sans joueur humain) │
│ │
│ BattleAgent: │
│ Tour 1: │
│ ✓ executeTurn() → "Utilise move X" │
│ ✓ Applique dégâts │
│ ✓ IA adverse répond │
│ │
│ Tour 2: │
│ ✓ Même processus │
│ ✓ Quelqu'un meurt? → Switch auto │
│ │
│ ... (tant qu'il y a des Pokémon) │
│ │
│ Résultat final: │
│ "Joueur gagne en 6 tours!" │
│ "IA gagne en 8 tours!" │
│ "Match nul après 100 tours" │
└─────────────────────────────────────┘

MÉTHODE 3 - analyzeCurrentState()
┌─────────────────────────────────────┐
│ Demande: "Analyse la situation" │
│ │
│ BattleAgent répond: │
│ Avantage: PLAYER (65%) │
│ Momentum: PLAYER (tu as l'initiative)│
│ Facteurs critiques: │
│ ✓ Tu as +1 Attack │
│ ✗ Tu es faible à Ground │
│ ✓ L'IA est faible contre toi │
│ Recommandations: │
│ • Attaque agressivement │
│ • Attention au Ground move │
│ • Tu peux potentiellement KO │
└─────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════

📊 MASTERAGENT vs SUBAGENT - RÉSUMÉ COMPARATIF
════════════════════════════════════════════════════════════════════════════════

─────────────────────────────────────────────────────────────
RÔLE Orchestrateur Spécialiste
NIVEAU Haut niveau Détails techniques
DÉCISIONS Quel SubAgent? Comment faire?
LLM Oui (réflexion) Non (exécution)
NOMBRE 1 seul 2 (ou plus)
─────────────────────────────────────────────────────────────
Exemple #1:

CLIENT: "Je veux une équipe!"
↓
MASTERAGENT: "OK, c'est TEAM_BUILDING"
↓
SUBAGENT (TeamBuildingAgent): "Je vais scorer tous les candidats"
↓
TOOLS: "TypeAnalysisTool dit..."
↓
RÉPONSE: "Voici les 10 meilleurs Pokémon"

─────────────────────────────────────────────────────────────
Exemple #2:

CLIENT: "Pikachu vs Dragonite, quoi faire?"
↓
MASTERAGENT: "C'est BATTLE"
↓
SUBAGENT (BattleAgent): "Je évalue les options"
↓
TOOLS: "DamageCalculator dit 120 dégâts"
"SpeedComparator dit tu attaques en premier"
"BattleDecision dit Thunderbolt"
↓
RÉPONSE: "Utilise THUNDERBOLT (95/100)"

════════════════════════════════════════════════════════════════════════════════

🔗 FLUX COMPLET - D'ACCUEIL À RÉPONSE
════════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────┐
│ 1. CLIENT envoie requête JSON │
│ POST /api/team/suggest │
│ { team: [Pikachu, Squirtle] } │
└────────────────────┬─────────────────────────────────────────┘
│
┌────────────────────▼─────────────────────────────────────────┐
│ 2. MASTERAGENT reçoit │
│ • task: "team_building" (détecté) │
│ • enableReflection: false (pour performance) │
│ • Crée les Tools + SubAgents │
└────────────────────┬─────────────────────────────────────────┘
│
┌────────────────────▼─────────────────────────────────────────┐
│ 3. MASTERAGENT.process() │
│ • Si reflection=true: Appelle LLM Mistral/Ollama │
│ • Parse: "C'est TEAM_BUILDING" │
│ • Appelle: handleTeamBuilding() │
└────────────────────┬─────────────────────────────────────────┘
│
┌────────────────────▼─────────────────────────────────────────┐
│ 4. SUBAGENT (TeamBuildingAgent) reçoit │
│ • currentTeam: [Pikachu, Squirtle] │
│ • mode: "suggest" │
│ • handleSuggest() │
└────────────────────┬─────────────────────────────────────────┘
│
┌────────────────────▼─────────────────────────────────────────┐
│ 5. TEAMBUILDING AGENT utilise les TOOLS │
│ • TypeAnalysisTool.analyzeTeam() │
│ → "Tu manques Grass" │
│ • RoleClassifierTool.classify() │
│ → "Pikachu=Sweeper, Squirtle=Wall" │
│ • SynergyTool.analyzeSynergy() │
│ → "Bonne synergie, types variés" │
│ • TeamScorerTool.rankCandidates() │
│ → Score chaque pokemon possible │
│ → Ranking: [Venusaur:85, Exeggutor:82, ...] │
└────────────────────┬─────────────────────────────────────────┘
│
┌────────────────────▼─────────────────────────────────────────┐
│ 6. TOOLS retournent les résultats │
│ → Best = Venusaur (Grass type) │
│ → Top 10 suggestions avec scores │
│ → Analysis de l'équipe finale │
└────────────────────┬─────────────────────────────────────────┘
│
┌────────────────────▼─────────────────────────────────────────┐
│ 7. SUBAGENT assemble la réponse │
│ { │
│ success: true, │
│ suggestions: [Venusaur, Exeggutor, ...], │
│ analysis: { strengths, weaknesses, grade } │
│ } │
└────────────────────┬─────────────────────────────────────────┘
│
┌────────────────────▼─────────────────────────────────────────┐
│ 8. MASTERAGENT retourne au CLIENT │
│ { │
│ success: true, │
│ task: "team_building", │
│ teamBuildingResponse: {...} │
│ } │
└────────────────────┬─────────────────────────────────────────┘
│
┌────────────────────▼─────────────────────────────────────────┐
│ 9. API /api/team/suggest retourne au CLIENT │
│ HTTP 200 │
│ { success, suggestions, analysis } │
└────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════

💡 CAS D'USAGE - DES SCÉNARIOS RÉELS
════════════════════════════════════════════════════════════════════════════════

SCÉNARIO 1 - "Suggère-moi un 3e Pokémon"
─────────────────────────────────────────
Client: POST /api/team/suggest
Body: { team: [Pikachu, Squirtle] }

Flux:
MasterAgent → "C'est SUGGEST"
→ TeamBuildingAgent → handleSuggest()
→ TypeAnalysisTool: "Manques Grass"
→ TeamScorerTool: "Venusaur=85, Exeggutor=82, ..."
→ Retour: Top 10

Réponse: "Top suggestions: Venusaur (85/100), Exeggutor..."

SCÉNARIO 2 - "Analyse mon équipe"
──────────────────────────────────
Client: POST /api/team/suggest
Body: { team: [6 pokemons], mode: "analyze" }

Flux:
MasterAgent → "C'est ANALYZE"
→ TeamBuildingAgent → handleAnalyze()
→ TypeAnalysisTool: "Couverture: 85%"
→ RoleClassifierTool: "Distribution: 2 sweeper, 2 wall..."
→ SynergyTool: "Mauvaise synergie: 3 electrics"
→ TeamScorerTool: "Score: 72/100 = Grade B"
→ Retour: Analyse complète

Réponse: "Grade: B - Trop d'electrics, équilibre mieux"

SCÉNARIO 3 - "Qu'est-ce que je fais au combat?"
────────────────────────────────────────────────
Client: POST /api/battle/ai-action
Body: { state: battleState }

Flux:
MasterAgent → "C'est BATTLE"
→ BattleAgent → executeTurn()
→ StatusEffectTool: "Pas paralysé"
→ SpeedComparatorTool: "Tu attaques en premier"
→ BattleDecisionTool: "Meilleur move = Thunderbolt"
→ DamageCalculatorTool: "118-145 dégâts"
→ Retour: Décision + analyse

Réponse: "Utilise THUNDERBOLT (super efficace contre Flying)"

════════════════════════════════════════════════════════════════════════════════

📋 RÉSUMÉ FINAL - EN 30 SECONDES
════════════════════════════════════════════════════════════════════════════════

MasterAgent:
= Le MANAGER qui décide quelle équipe (SubAgent) appeler
= Utilise LLM pour penser ("Is this team_building or battle?")
= Appelle le bon SubAgent

TeamBuildingAgent (SubAgent #1):
= EXPERT en équipes
= Suggère / Analyse / Counter / Génère
= Utilise TypeAnalysisTool, RoleClassifierTool, etc.

BattleAgent (SubAgent #2):
= EXPERT en combat
= Décide: quel move / switch?
= Utilise BattleDecisionTool, DamageCalculator, etc.

Tools:
= Les OUTILS spécialisés que les SubAgents utilisent
= Jamais appelés directement par le client
= Toujours appelés par un SubAgent

════════════════════════════════════════════════════════════════════════════════