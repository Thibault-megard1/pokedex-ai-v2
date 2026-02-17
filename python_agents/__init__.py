# =============================================================================
# 🎮 POKEDEX AI - Architecture Multi-Agent Python
# =============================================================================
# 
# Structure de l'architecture :
#
# ┌─────────────────────────────────────────────────────────────────────┐
# │                    🔵 PokedexMasterAgent (DeepAgent)                │
# │                         (Orchestrateur principal)                   │
# └───────────────────────────┬───────────────────────────┬─────────────┘
#                             │                           │
#            ┌────────────────▼────────────┐  ┌──────────▼────────────────┐
#            │  🟢 TeamBuilderAgent        │  │  🔴 BattleEngineAgent     │
#            │    (CompiledSubAgent)       │  │    (CompiledSubAgent)     │
#            └─────────────┬───────────────┘  └───────────┬───────────────┘
#                          │                              │
#     ┌────────────────────┼────────────────────┐   ┌─────┼─────────────────┐
#     │  TypeAnalysisSubAgent                   │   │  DamageCalculation   │
#     │  StatsAnalysisSubAgent                  │   │  SpeedOrderSubAgent  │
#     │  RoleDistributionSubAgent               │   │  StatModifierSubAgent│
#     │  MoveCoverageSubAgent                   │   │  StatusEffectSubAgent│
#     └─────────────────────────────────────────┘   │  BattleDecisionAgent │
#                                                   └──────────────────────┘
#
# =============================================================================

from .master_agent import PokedexMasterAgent, create_pokedex_master_agent
from .team_builder.agent import TeamBuilderAgent
from .battle_engine.agent import BattleEngineAgent

__all__ = [
    "PokedexMasterAgent",
    "create_pokedex_master_agent",
    "TeamBuilderAgent",
    "BattleEngineAgent"
]

__version__ = "1.0.0"
