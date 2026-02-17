# =============================================================================
# 🟢 TEAM BUILDER - SUB-AGENTS
# =============================================================================
# 
# SubAgents spécialisés pour l'analyse d'équipe Pokémon
# Chaque SubAgent utilise des tools spécifiques et a un rôle précis
#
# Architecture:
#   TeamBuilderAgent
#   ├── TypeAnalysisSubAgent (TypeEffectivenessTool, WeaknessCalculatorTool)
#   ├── StatsAnalysisSubAgent (StatsAnalyzerTool)
#   ├── RoleDistributionSubAgent (RoleClassifierTool)
#   └── MoveCoverageSubAgent (MoveCoverageTool)
#
# =============================================================================

from typing import List, Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_mistralai import ChatMistralAI
from langgraph.prebuilt import create_react_agent
from langgraph.graph import StateGraph, END
import os

# Import des tools
from .tools import (
    type_effectiveness_tool,
    weakness_calculator_tool,
    stats_analyzer_tool,
    role_classifier_tool,
    move_coverage_tool
)


# =============================================================================
# 📝 SYSTEM PROMPTS POUR LES SUB-AGENTS
# =============================================================================

TYPE_ANALYSIS_SYSTEM_PROMPT = """Tu es un expert en analyse de types Pokémon.

🎯 TON RÔLE:
- Analyser les efficacités de type d'une équipe
- Identifier les faiblesses et résistances
- Proposer des améliorations de couverture défensive

⚠️ RÈGLES IMPORTANTES:
- Utilise TOUJOURS les tools pour les calculs (pas de calcul mental)
- Retourne des données structurées et précises
- Explique les résultats de manière concise

🔧 TOOLS DISPONIBLES:
- type_effectiveness_tool: Calcule l'efficacité entre types
- weakness_calculator_tool: Analyse les faiblesses d'une équipe
"""

STATS_ANALYSIS_SYSTEM_PROMPT = """Tu es un expert en analyse statistique Pokémon.

🎯 TON RÔLE:
- Analyser les statistiques de base d'une équipe
- Identifier les points forts et faibles
- Évaluer l'équilibre offensif/défensif

⚠️ RÈGLES IMPORTANTES:
- Utilise TOUJOURS stats_analyzer_tool pour les calculs
- Ne fais JAMAIS de moyenne ou calcul toi-même
- Base tes recommandations sur les données du tool

🔧 TOOLS DISPONIBLES:
- stats_analyzer_tool: Analyse complète des stats d'équipe
"""

ROLE_DISTRIBUTION_SYSTEM_PROMPT = """Tu es un expert en composition d'équipe Pokémon.

🎯 TON RÔLE:
- Classifier les rôles stratégiques (sweeper, wall, tank, support)
- Vérifier l'équilibre des rôles dans l'équipe
- Suggérer des ajustements de composition

⚠️ RÈGLES IMPORTANTES:
- Utilise TOUJOURS role_classifier_tool pour classifier
- Ne devine pas les rôles, base-toi sur les stats
- Une bonne équipe a des rôles variés

🔧 TOOLS DISPONIBLES:
- role_classifier_tool: Classifie les rôles basé sur les stats
"""

MOVE_COVERAGE_SYSTEM_PROMPT = """Tu es un expert en couverture offensive Pokémon.

🎯 TON RÔLE:
- Analyser les types d'attaques disponibles
- Identifier les types non couverts
- Suggérer des Pokémon ou moves pour combler les trous

⚠️ RÈGLES IMPORTANTES:
- Utilise TOUJOURS move_coverage_tool pour l'analyse
- Une bonne couverture = tous les types touchables en super-efficace
- Prends en compte le STAB

🔧 TOOLS DISPONIBLES:
- move_coverage_tool: Analyse la couverture offensive
"""


# =============================================================================
# 🤖 CLASSE DE BASE POUR LES SUB-AGENTS
# =============================================================================

class BaseSubAgent:
    """Classe de base pour les SubAgents compilés"""
    
    def __init__(
        self,
        name: str,
        system_prompt: str,
        tools: List,
        model_name: str = "mistral-large-latest",
        temperature: float = 0.1
    ):
        self.name = name
        self.system_prompt = system_prompt
        self.tools = tools
        
        # Initialiser le LLM
        self.llm = ChatMistralAI(
            api_key=os.getenv("MISTRAL_API_KEY"),
            model=model_name,
            temperature=temperature
        )
        
        # Créer l'agent React
        self.agent = create_react_agent(
            model=self.llm,
            tools=self.tools,
            state_modifier=self.system_prompt
        )
    
    def invoke(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Exécute le SubAgent avec une requête.
        
        Args:
            query: La question ou tâche pour le SubAgent
            context: Contexte additionnel (équipe, etc.)
        
        Returns:
            Dict avec le résultat de l'analyse
        """
        # Construire le message
        messages = [HumanMessage(content=query)]
        
        # Ajouter le contexte si présent
        if context:
            context_str = f"\nContexte: {context}"
            messages[0] = HumanMessage(content=query + context_str)
        
        try:
            # Invoquer l'agent
            result = self.agent.invoke({"messages": messages})
            
            # Extraire la réponse finale
            final_message = result["messages"][-1]
            
            return {
                "success": True,
                "agent": self.name,
                "result": final_message.content,
                "tools_used": self._extract_tool_calls(result["messages"])
            }
        except Exception as e:
            return {
                "success": False,
                "agent": self.name,
                "error": str(e)
            }
    
    def _extract_tool_calls(self, messages: List) -> List[str]:
        """Extrait les noms des tools appelés"""
        tool_calls = []
        for msg in messages:
            if hasattr(msg, "tool_calls"):
                for tc in msg.tool_calls:
                    tool_calls.append(tc.get("name", "unknown"))
        return tool_calls
    
    async def ainvoke(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Version async de invoke"""
        messages = [HumanMessage(content=query)]
        
        if context:
            context_str = f"\nContexte: {context}"
            messages[0] = HumanMessage(content=query + context_str)
        
        try:
            result = await self.agent.ainvoke({"messages": messages})
            final_message = result["messages"][-1]
            
            return {
                "success": True,
                "agent": self.name,
                "result": final_message.content,
                "tools_used": self._extract_tool_calls(result["messages"])
            }
        except Exception as e:
            return {
                "success": False,
                "agent": self.name,
                "error": str(e)
            }


# =============================================================================
# 🟢 SUB-AGENT 1: TypeAnalysisSubAgent
# =============================================================================

class TypeAnalysisSubAgent(BaseSubAgent):
    """
    SubAgent spécialisé dans l'analyse des types.
    
    Tools:
        - type_effectiveness_tool: Efficacité entre types
        - weakness_calculator_tool: Faiblesses d'équipe
    """
    
    def __init__(self, model_name: str = "mistral-large-latest"):
        super().__init__(
            name="TypeAnalysisSubAgent",
            system_prompt=TYPE_ANALYSIS_SYSTEM_PROMPT,
            tools=[type_effectiveness_tool, weakness_calculator_tool],
            model_name=model_name
        )
    
    def analyze_team_types(self, team: List[Dict]) -> Dict[str, Any]:
        """
        Analyse les types d'une équipe.
        
        Args:
            team: Liste des Pokémon avec leurs types
        
        Returns:
            Analyse complète des faiblesses et résistances
        """
        query = f"""Analyse les types de cette équipe Pokémon et identifie les faiblesses critiques:
        
Équipe: {team}

Utilise weakness_calculator_tool pour analyser les faiblesses de l'équipe.
Puis résume les points critiques."""
        
        return self.invoke(query)


# =============================================================================
# 🟢 SUB-AGENT 2: StatsAnalysisSubAgent
# =============================================================================

class StatsAnalysisSubAgent(BaseSubAgent):
    """
    SubAgent spécialisé dans l'analyse des statistiques.
    
    Tools:
        - stats_analyzer_tool: Analyse des stats d'équipe
    """
    
    def __init__(self, model_name: str = "mistral-large-latest"):
        super().__init__(
            name="StatsAnalysisSubAgent",
            system_prompt=STATS_ANALYSIS_SYSTEM_PROMPT,
            tools=[stats_analyzer_tool],
            model_name=model_name
        )
    
    def analyze_team_stats(self, team: List[Dict]) -> Dict[str, Any]:
        """
        Analyse les statistiques d'une équipe.
        
        Args:
            team: Liste des Pokémon avec leurs stats
        
        Returns:
            Analyse complète des stats moyennes et équilibre
        """
        query = f"""Analyse les statistiques de cette équipe Pokémon:

Équipe: {team}

Utilise stats_analyzer_tool pour obtenir les moyennes et identifier les forces/faiblesses statistiques."""
        
        return self.invoke(query)


# =============================================================================
# 🟢 SUB-AGENT 3: RoleDistributionSubAgent
# =============================================================================

class RoleDistributionSubAgent(BaseSubAgent):
    """
    SubAgent spécialisé dans la classification des rôles.
    
    Tools:
        - role_classifier_tool: Classification des rôles stratégiques
    """
    
    def __init__(self, model_name: str = "mistral-large-latest"):
        super().__init__(
            name="RoleDistributionSubAgent",
            system_prompt=ROLE_DISTRIBUTION_SYSTEM_PROMPT,
            tools=[role_classifier_tool],
            model_name=model_name
        )
    
    def classify_team_roles(self, team: List[Dict]) -> Dict[str, Any]:
        """
        Classifie les rôles de chaque Pokémon.
        
        Args:
            team: Liste des Pokémon avec leurs stats
        
        Returns:
            Classification des rôles et équilibre
        """
        query = f"""Classifie les rôles stratégiques de chaque Pokémon dans cette équipe:

Équipe: {team}

Utilise role_classifier_tool pour classifier et vérifie si l'équipe est équilibrée."""
        
        return self.invoke(query)


# =============================================================================
# 🟢 SUB-AGENT 4: MoveCoverageSubAgent
# =============================================================================

class MoveCoverageSubAgent(BaseSubAgent):
    """
    SubAgent spécialisé dans l'analyse de couverture offensive.
    
    Tools:
        - move_coverage_tool: Analyse de la couverture de types
    """
    
    def __init__(self, model_name: str = "mistral-large-latest"):
        super().__init__(
            name="MoveCoverageSubAgent",
            system_prompt=MOVE_COVERAGE_SYSTEM_PROMPT,
            tools=[move_coverage_tool],
            model_name=model_name
        )
    
    def analyze_coverage(self, team: List[Dict]) -> Dict[str, Any]:
        """
        Analyse la couverture offensive de l'équipe.
        
        Args:
            team: Liste des Pokémon avec leurs types/moves
        
        Returns:
            Analyse de la couverture et types non couverts
        """
        query = f"""Analyse la couverture offensive de cette équipe Pokémon:

Équipe: {team}

Utilise move_coverage_tool pour identifier les types que l'équipe peut toucher en super-efficace et ceux qui manquent."""
        
        return self.invoke(query)


# =============================================================================
# 📦 EXPORTS
# =============================================================================

__all__ = [
    "BaseSubAgent",
    "TypeAnalysisSubAgent",
    "StatsAnalysisSubAgent",
    "RoleDistributionSubAgent",
    "MoveCoverageSubAgent"
]
