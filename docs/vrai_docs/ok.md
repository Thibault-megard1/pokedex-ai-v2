═══════════════════════════════════════════════════════════════════════════════
                    ARCHITECTURE COMPLÈTE - FLUX DE DONNÉES
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                            API ENDPOINTS (NextJS)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ① POST /api/team/suggest              ② POST /api/battle/ai-action         │
│     └──> app/api/team/suggest/route.ts    └──> app/api/battle/ai-action...  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
         │                                          │
         │ JSON Body:                               │ JSON Body:
         │ { team: [...] }                          │ { state: BattleState, side, config }
         │                                          │
         ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   COUCHE ORCHESTRATION - MasterAgent                        │
│                    (lib/agents/MasterAgent.ts)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  • new MasterAgent({ enableReflection: false })                            │
│  • agent.process(request)                                                  │
│      ├─> Réflexion LLM (Ollama/Mistral) si enableReflection=true          │
│      ├─> Inférence locale (fallback)                                       │
│      └─> Délégation au bon SubAgent                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
         │                                          │
         │ "team_building"                          │ "battle"
         │                                          │
         ▼                                          ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│    SUBAGENT #1               │    │    SUBAGENT #2               │
│  TeamBuildingAgent           │    │  BattleAgent                 │
│                              │    │                              │
│ (lib/agents/subAgents/       │    │ (lib/agents/subAgents/       │
│  TeamBuildingAgent.ts)       │    │  BattleAgent.ts)             │
│                              │    │                              │
│ • new TeamBuildingAgent()    │    │ • new BattleAgent()          │
│ • process(request)           │    │ • process(request)           │
│   ├─> evaluatePokemon()      │    │   ├─> executeTurn()          │
│   ├─> analyzeTeam()          │    │   ├─> evaluateAllActions()   │
│   ├─> suggestPokemon()       │    │   ├─> analyzeCurrentState()  │
│   └─> scoreTeam()            │    │   └─> autoBattle()           │
└──────────────────────────────┘    └──────────────────────────────┘
         │                                          │
         │                                          │
         ▼                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       COUCHE TOOLS - Utilitaires Métier                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TEAMBUILDING TOOLS:                    │  BATTLE TOOLS:                     │
│  • TypeAnalysisTool                     │  • BattleDecisionTool              │
│    (analyze type coverage)              │    (main decision tool)            │
│                                         │                                    │
│  • RoleClassifierTool                   │  • DamageCalculatorTool            │
│    (classify roles: sweeper, tank...)   │    (calculate damage formula)      │
│                                         │                                    │
│  • SynergyTool                          │  • SpeedComparatorTool             │
│    (analyze team synergies)             │    (compare speed/turn order)      │
│                                         │                                    │
│  • TeamScorerTool                       │  • StatusEffectTool                │
│    (aggregate scoring)                  │    (handle status effects)         │
│                                         │                                    │
│  (lib/agents/tools/)                    │  • StatModifierTool                │
│                                         │    (stat stages management)        │
│                                         │                                    │
│                                         │  (lib/agents/battleEngine/tools/)  │
│                                         │                                    │
└──────────────────────────────────────────────────────────────────────────────┘
         │                                          │
         │ return results                           │ return results
         │                                          │
         └──────────────────────────┬───────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │      Response JSON Object        │
                    │  { success, team/action, etc }  │
                    └─────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │    API Response → Client         │
                    └─────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                            INTÉGRATION LLM
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  MasterAgent Réflexion (si enableReflection=true)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. private async reflect(request) {                                       │
│      - Construit prompt système + user message                            │
│      - Appelle: this.llmClient.chat([messages])                           │
│      - Parse JSON response → ReflectionResult                             │
│    }                                                                       │
│                                                                             │
│  2. private createDefaultLLMClient() {                                     │
│      ┌─────────────────────────────────────────┐                          │
│      │ Si LLM_PROVIDER=mistral:                │                          │
│      │  └─> new MistralClient(apiKey, model)  │                          │
│      │      (lib/llm/mistral-client.ts)       │                          │
│      │                                         │                          │
│      │ Si LLM_PROVIDER=ollama (défaut):       │                          │
│      │  └─> new OllamaClient()                │                          │
│      │      (lib/llm/ollama.ts)               │                          │
│      └─────────────────────────────────────────┘                          │
│                                                                             │
│  3. Env Variables:                                                        │
│      • LLM_PROVIDER=mistral|ollama                                        │
│      • MISTRAL_API_KEY=sk-...                                            │
│      • MISTRAL_MODEL=mistral-large-latest                                │
│      • OLLAMA_BASE_URL=http://localhost:11434                            │
│      • OLLAMA_MODEL=mistral|llama2                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                        EXEMPLE D'APPEL COMPLET
═══════════════════════════════════════════════════════════════════════════════

CLIENT                          API                      MASTER AGENT
  │                              │                           │
  │ POST /api/team/suggest       │                          │
  │ { team: [...] }              │                          │
  ├─────────────────────────────>│                          │
  │                              │ new MasterAgent()        │
  │                              ├─────────────────────────>│
  │                              │                          │ reflect() [LLM]
  │                              │                          │ ✓ task="team_building"
  │                              │                          │
  │                              │ agent.process()          │
  │                              ├─────────────────────────>│
  │                              │                          │ handleTeamBuilding()
  │                              │                          │ ├─> TeamBuildingAgent
  │                              │                          │ │   ├─> TypeAnalysisTool
  │                              │                          │ │   ├─> RoleClassifierTool
  │                              │                          │ │   ├─> SynergyTool
  │                              │                          │ │   └─> TeamScorerTool
  │                              │                          │ └─> return response
  │                              │<─────────────────────────┤
  │                              │ MasterAgentResponse      │
  │<─────────────────────────────┤                          │
  │ { success, suggestions }     │                          │
  │                              │                          │


═══════════════════════════════════════════════════════════════════════════════
                         FICHIERS CLÉS À CONNAÎTRE
═══════════════════════════════════════════════════════════════════════════════

📍 ORCHESTRATION:
   • lib/agents/MasterAgent.ts ........................ Orchestrateur principal
   
📍 SUBAGENTS:
   • lib/agents/subAgents/TeamBuildingAgent.ts ....... Construction d'équipes
   • lib/agents/subAgents/BattleAgent.ts ............. Décisions de combat

📍 TEAMBUILDING TOOLS:
   • lib/agents/tools/TypeAnalysisTool.ts ........... Analyse de type coverage
   • lib/agents/tools/RoleClassifierTool.ts ........ Classification des rôles
   • lib/agents/tools/SynergyTool.ts ............... Synergies d'équipe
   • lib/agents/tools/TeamScorerTool.ts ............ Score global équipe

📍 BATTLE TOOLS:
   • lib/agents/battleEngine/tools/BattleDecisionTool.ts ........ Décisions
   • lib/agents/battleEngine/tools/DamageCalculatorTool.ts ...... Dégâts
   • lib/agents/battleEngine/tools/SpeedComparatorTool.ts ....... Vitesse
   • lib/agents/battleEngine/tools/StatusEffectTool.ts ......... Statuts
   • lib/agents/battleEngine/tools/StatModifierTool.ts ......... Boosts

📍 LLM CLIENTS:
   • lib/llm/mistral-client.ts ...................... Client Mistral API
   • lib/llm/ollama.ts ............................ Client Ollama local

📍 API ROUTES:
   • app/api/team/suggest/route.ts ................ [POST] /api/team/suggest
   • app/api/battle/ai-action/route.ts ........... [POST] /api/battle/ai-action
   • app/api/team/generate-by-type/route.ts ..... [POST] /api/team/generate-by-type

📍 HELPER:
   • lib/agents/battleEngine/agents/EnemyTeamGeneratorAgent.ts .. Génération équipes IA

═══════════════════════════════════════════════════════════════════════════════