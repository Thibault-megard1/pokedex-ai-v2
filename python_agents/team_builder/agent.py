# =============================================================================
# 🟢 TEAM BUILDER AGENT (CompiledSubAgent)
# =============================================================================
# 
# Agent principal pour la génération et l'analyse d'équipes Pokémon
# Orchestre les SubAgents spécialisés pour une analyse complète
#
# Architecture:
#   TeamBuilderAgent (ce fichier)
#   ├── TypeAnalysisSubAgent
#   ├── StatsAnalysisSubAgent
#   ├── RoleDistributionSubAgent
#   └── MoveCoverageSubAgent
#
# =============================================================================

from typing import List, Dict, Any, Optional, Literal
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_mistralai import ChatMistralAI
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel, Field
import os
import json

# Import des SubAgents
from .sub_agents import (
    TypeAnalysisSubAgent,
    StatsAnalysisSubAgent,
    RoleDistributionSubAgent,
    MoveCoverageSubAgent
)

# Import des tools directs
from .tools import TEAM_BUILDER_TOOLS


# =============================================================================
# 📝 SYSTEM PROMPT
# =============================================================================

TEAM_BUILDER_SYSTEM_PROMPT = """Tu es le TeamBuilderAgent, un expert en création d'équipes Pokémon compétitives.

🎯 TON RÔLE:
- Analyser des équipes existantes
- Générer des équipes optimisées
- Donner des conseils stratégiques

🔧 TES CAPACITÉS:
Tu as accès à 4 sous-agents spécialisés:
1. TypeAnalysis - Analyse des faiblesses/résistances de type
2. StatsAnalysis - Analyse des statistiques de l'équipe
3. RoleDistribution - Classification des rôles (sweeper, wall, etc.)
4. MoveCoverage - Analyse de la couverture offensive

⚠️ RÈGLES CRITIQUES:
- DÉLÈGUE les calculs aux SubAgents, ne calcule JAMAIS toi-même
- Utilise les tools pour toute donnée numérique
- Synthétise les résultats des SubAgents de manière claire
- Retourne TOUJOURS une explication stratégique

📊 FORMAT DE RÉPONSE:
1. Résumé de l'analyse
2. Points forts de l'équipe
3. Points faibles et risques
4. Recommandations concrètes
"""


# =============================================================================
# 📝 SCHEMAS DE RÉPONSE
# =============================================================================

class TeamAnalysisResult(BaseModel):
    """Résultat d'une analyse d'équipe"""
    success: bool
    team_size: int
    type_analysis: Dict[str, Any] = Field(description="Analyse des types")
    stats_analysis: Dict[str, Any] = Field(description="Analyse des stats")
    role_analysis: Dict[str, Any] = Field(description="Analyse des rôles")
    coverage_analysis: Dict[str, Any] = Field(description="Analyse couverture")
    overall_score: int = Field(ge=0, le=100, description="Score global 0-100")
    grade: str = Field(description="Grade S/A/B/C/D/F")
    strengths: List[str] = Field(description="Points forts")
    weaknesses: List[str] = Field(description="Points faibles")
    recommendations: List[str] = Field(description="Recommandations")
    strategic_summary: str = Field(description="Résumé stratégique")


class TeamGenerationResult(BaseModel):
    """Résultat d'une génération d'équipe"""
    success: bool
    team: List[Dict[str, Any]] = Field(description="L'équipe générée")
    strategy: str = Field(description="Stratégie de l'équipe")
    synergies: List[str] = Field(description="Synergies clés")
    how_to_play: str = Field(description="Comment jouer l'équipe")


# =============================================================================
# 🤖 TEAM BUILDER AGENT
# =============================================================================

class TeamBuilderAgent:
    """
    Agent compilé pour la construction et l'analyse d'équipes Pokémon.
    
    Utilise des SubAgents spécialisés pour chaque aspect de l'analyse:
    - TypeAnalysisSubAgent: Faiblesses et résistances
    - StatsAnalysisSubAgent: Statistiques et équilibre
    - RoleDistributionSubAgent: Rôles stratégiques
    - MoveCoverageSubAgent: Couverture offensive
    
    Example:
        ```python
        agent = TeamBuilderAgent()
        
        # Analyser une équipe
        result = agent.analyze_team([
            {"name": "Pikachu", "types": ["electric"]},
            {"name": "Charizard", "types": ["fire", "flying"]}
        ])
        
        # Générer une équipe
        team = agent.generate_team(strategy="hyper_offense")
        ```
    """
    
    def __init__(
        self,
        model_name: str = "mistral-large-latest",
        temperature: float = 0.1,
        verbose: bool = False
    ):
        """
        Initialise le TeamBuilderAgent.
        
        Args:
            model_name: Modèle Mistral à utiliser
            temperature: Température pour la génération
            verbose: Afficher les logs détaillés
        """
        self.model_name = model_name
        self.temperature = temperature
        self.verbose = verbose
        
        # Initialiser le LLM principal
        self.llm = ChatMistralAI(
            api_key=os.getenv("MISTRAL_API_KEY"),
            model=model_name,
            temperature=temperature
        )
        
        # Initialiser les SubAgents
        self.type_agent = TypeAnalysisSubAgent(model_name)
        self.stats_agent = StatsAnalysisSubAgent(model_name)
        self.role_agent = RoleDistributionSubAgent(model_name)
        self.coverage_agent = MoveCoverageSubAgent(model_name)
        
        # Créer l'agent React avec tous les tools
        self.agent = create_react_agent(
            model=self.llm,
            tools=TEAM_BUILDER_TOOLS,
            state_modifier=TEAM_BUILDER_SYSTEM_PROMPT
        )
        
        if self.verbose:
            print(f"✅ TeamBuilderAgent initialisé avec {model_name}")
    
    # =========================================================================
    # 📊 MÉTHODE PRINCIPALE: ANALYSE D'ÉQUIPE
    # =========================================================================
    
    def analyze_team(self, team: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyse complète d'une équipe Pokémon.
        
        Utilise tous les SubAgents pour une analyse exhaustive:
        1. Analyse des types (faiblesses/résistances)
        2. Analyse des statistiques
        3. Classification des rôles
        4. Analyse de la couverture offensive
        
        Args:
            team: Liste des Pokémon avec leurs propriétés
                  Ex: [{"name": "Pikachu", "types": ["electric"], "stats": {...}}]
        
        Returns:
            Dict avec l'analyse complète et les recommandations
        """
        if self.verbose:
            print(f"🔍 Analyse d'une équipe de {len(team)} Pokémon...")
        
        results = {
            "success": True,
            "team_size": len(team),
            "team_summary": [p.get("name", "?") for p in team]
        }
        
        try:
            # 1. Analyse des types
            if self.verbose:
                print("  📊 TypeAnalysisSubAgent...")
            type_result = self.type_agent.analyze_team_types(team)
            results["type_analysis"] = type_result
            
            # 2. Analyse des stats
            if self.verbose:
                print("  📊 StatsAnalysisSubAgent...")
            stats_result = self.stats_agent.analyze_team_stats(team)
            results["stats_analysis"] = stats_result
            
            # 3. Classification des rôles
            if self.verbose:
                print("  📊 RoleDistributionSubAgent...")
            role_result = self.role_agent.classify_team_roles(team)
            results["role_analysis"] = role_result
            
            # 4. Couverture offensive
            if self.verbose:
                print("  📊 MoveCoverageSubAgent...")
            coverage_result = self.coverage_agent.analyze_coverage(team)
            results["coverage_analysis"] = coverage_result
            
            # 5. Synthèse avec le LLM
            synthesis = self._synthesize_analysis(results)
            results.update(synthesis)
            
            if self.verbose:
                print(f"✅ Analyse terminée. Score: {results.get('overall_score', '?')}/100")
            
        except Exception as e:
            results["success"] = False
            results["error"] = str(e)
            if self.verbose:
                print(f"❌ Erreur: {e}")
        
        return results
    
    def _synthesize_analysis(self, results: Dict) -> Dict[str, Any]:
        """Synthétise les résultats des SubAgents"""
        # Extraire les données clés
        type_data = results.get("type_analysis", {}).get("result", "")
        stats_data = results.get("stats_analysis", {}).get("result", "")
        role_data = results.get("role_analysis", {}).get("result", "")
        coverage_data = results.get("coverage_analysis", {}).get("result", "")
        
        # Prompt de synthèse
        synthesis_prompt = f"""Synthétise cette analyse d'équipe Pokémon:

ANALYSE DES TYPES:
{type_data}

ANALYSE DES STATS:
{stats_data}

ANALYSE DES RÔLES:
{role_data}

ANALYSE DE LA COUVERTURE:
{coverage_data}

Retourne un JSON avec:
- overall_score (0-100)
- grade (S/A/B/C/D/F)
- strengths (liste de points forts)
- weaknesses (liste de points faibles)
- recommendations (liste de conseils)
- strategic_summary (résumé en 2-3 phrases)
"""
        
        try:
            response = self.llm.invoke([HumanMessage(content=synthesis_prompt)])
            
            # Parser la réponse JSON
            content = response.content
            
            # Tenter d'extraire le JSON
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0]
            elif "{" in content:
                start = content.index("{")
                end = content.rindex("}") + 1
                json_str = content[start:end]
            else:
                json_str = "{}"
            
            data = json.loads(json_str)
            
            return {
                "overall_score": data.get("overall_score", 50),
                "grade": data.get("grade", "C"),
                "strengths": data.get("strengths", []),
                "weaknesses": data.get("weaknesses", []),
                "recommendations": data.get("recommendations", []),
                "strategic_summary": data.get("strategic_summary", "Analyse non disponible")
            }
            
        except Exception as e:
            return {
                "overall_score": 50,
                "grade": "C",
                "strengths": [],
                "weaknesses": [],
                "recommendations": ["Erreur lors de la synthèse"],
                "strategic_summary": f"Erreur: {str(e)}"
            }
    
    # =========================================================================
    # 🎮 GÉNÉRATION D'ÉQUIPE
    # =========================================================================
    
    def generate_team(
        self,
        strategy: Literal["balanced", "hyper_offense", "stall", "bulky_offense", "weather"] = "balanced",
        constraints: Optional[Dict[str, Any]] = None,
        must_include: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Génère une équipe Pokémon optimisée.
        
        Args:
            strategy: Style de jeu voulu
                - "balanced": Équipe polyvalente
                - "hyper_offense": Offensive pure, sweepers rapides
                - "stall": Défensive, régénération, hazards
                - "bulky_offense": Tanks offensifs
                - "weather": Basée sur la météo
            constraints: Contraintes additionnelles
                - {"tier": "OU", "no_legends": True, ...}
            must_include: Pokémon obligatoires dans l'équipe
        
        Returns:
            Dict avec l'équipe générée et les explications
        """
        if self.verbose:
            print(f"🎮 Génération d'équipe '{strategy}'...")
        
        # Templates d'équipes par stratégie
        team_templates = {
            "balanced": {
                "roles_needed": ["physical_sweeper", "special_sweeper", "physical_wall", "special_wall", "pivot", "support"],
                "description": "Équipe équilibrée avec réponse à tout"
            },
            "hyper_offense": {
                "roles_needed": ["physical_sweeper", "physical_sweeper", "special_sweeper", "special_sweeper", "lead", "revenge_killer"],
                "description": "Pression offensive maximale"
            },
            "stall": {
                "roles_needed": ["physical_wall", "special_wall", "cleric", "hazard_setter", "spinblocker", "phazer"],
                "description": "Défense et usure progressive"
            },
            "bulky_offense": {
                "roles_needed": ["tank", "tank", "physical_sweeper", "special_sweeper", "pivot", "support"],
                "description": "Tanks qui frappent fort"
            },
            "weather": {
                "roles_needed": ["weather_setter", "weather_abuser", "weather_abuser", "sweeper", "wall", "support"],
                "description": "Exploite la météo pour dominer"
            }
        }
        
        template = team_templates.get(strategy, team_templates["balanced"])
        
        # Construire le prompt de génération
        generation_prompt = f"""Génère une équipe Pokémon compétitive.

STRATÉGIE: {strategy}
DESCRIPTION: {template['description']}
RÔLES NÉCESSAIRES: {template['roles_needed']}

{'POKÉMON OBLIGATOIRES: ' + str(must_include) if must_include else ''}
{'CONTRAINTES: ' + str(constraints) if constraints else ''}

Pour chaque Pokémon de l'équipe, fournis:
- name: Nom du Pokémon
- types: Types (1-2)
- role: Rôle dans l'équipe
- item: Objet recommandé
- ability: Talent
- nature: Nature
- moves: 4 attaques
- evs: Répartition des EVs
- reason: Pourquoi ce Pokémon

Retourne un JSON avec:
- team: Liste des 6 Pokémon
- strategy_summary: Résumé de la stratégie
- synergies: Synergies clés entre les Pokémon
- how_to_play: Guide rapide pour jouer l'équipe
"""
        
        try:
            response = self.llm.invoke([HumanMessage(content=generation_prompt)])
            content = response.content
            
            # Parser la réponse
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0]
            elif "{" in content:
                start = content.index("{")
                end = content.rindex("}") + 1
                json_str = content[start:end]
            else:
                json_str = "{}"
            
            data = json.loads(json_str)
            
            result = {
                "success": True,
                "strategy": strategy,
                "team": data.get("team", []),
                "strategy_summary": data.get("strategy_summary", ""),
                "synergies": data.get("synergies", []),
                "how_to_play": data.get("how_to_play", "")
            }
            
            if self.verbose:
                print(f"✅ Équipe générée avec {len(result['team'])} Pokémon")
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "strategy": strategy,
                "error": str(e)
            }
    
    # =========================================================================
    # 🔧 MÉTHODES UTILITAIRES
    # =========================================================================
    
    def suggest_pokemon(
        self,
        current_team: List[Dict[str, Any]],
        role_needed: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Suggère des Pokémon pour compléter une équipe.
        
        Args:
            current_team: L'équipe actuelle
            role_needed: Rôle spécifique recherché (optionnel)
        
        Returns:
            Liste de suggestions avec raisons
        """
        # Analyser l'équipe actuelle
        analysis = self.analyze_team(current_team)
        
        # Construire le prompt
        suggestion_prompt = f"""Basé sur cette analyse d'équipe:

ÉQUIPE ACTUELLE: {[p.get('name') for p in current_team]}
FAIBLESSES: {analysis.get('weaknesses', [])}
RÔLES MANQUANTS: Identifie les rôles manquants
{'RÔLE RECHERCHÉ: ' + role_needed if role_needed else ''}

Suggère 5 Pokémon qui compléteraient bien cette équipe.

Pour chaque suggestion:
- name: Nom
- types: Types
- role: Rôle qu'il remplirait
- why: Pourquoi il complète bien l'équipe
- synergy_with: Avec quels membres il a de la synergie
"""
        
        try:
            response = self.llm.invoke([HumanMessage(content=suggestion_prompt)])
            
            return {
                "success": True,
                "current_team": [p.get("name") for p in current_team],
                "current_analysis": {
                    "weaknesses": analysis.get("weaknesses", []),
                    "grade": analysis.get("grade", "?")
                },
                "suggestions": response.content
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def counter_team(self, opponent_team: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Génère une équipe pour contrer une équipe adverse.
        
        Args:
            opponent_team: L'équipe adverse à contrer
        
        Returns:
            Équipe de contre avec explications
        """
        # Analyser l'équipe adverse
        opponent_analysis = self.analyze_team(opponent_team)
        
        counter_prompt = f"""Génère une équipe pour CONTRER cette équipe adverse:

ÉQUIPE ADVERSE: {[p.get('name') for p in opponent_team]}
LEURS FORCES: {opponent_analysis.get('strengths', [])}
LEURS FAIBLESSES: {opponent_analysis.get('weaknesses', [])}

Crée une équipe de 6 Pokémon qui exploite leurs faiblesses.
Pour chaque Pokémon, explique comment il contre l'adversaire.
"""
        
        try:
            response = self.llm.invoke([HumanMessage(content=counter_prompt)])
            
            return {
                "success": True,
                "opponent_team": [p.get("name") for p in opponent_team],
                "opponent_weaknesses": opponent_analysis.get("weaknesses", []),
                "counter_strategy": response.content
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    # =========================================================================
    # 📤 INTERFACE POUR LE MASTER AGENT
    # =========================================================================
    
    def invoke(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Interface standard pour être appelé par le MasterAgent.
        
        Args:
            request: Dict avec:
                - action: "analyze", "generate", "suggest", "counter"
                - team: Équipe (pour analyze, suggest)
                - opponent_team: Équipe adverse (pour counter)
                - strategy: Stratégie (pour generate)
                - constraints: Contraintes (optionnel)
        
        Returns:
            Résultat de l'action
        """
        action = request.get("action", "analyze")
        
        if action == "analyze":
            return self.analyze_team(request.get("team", []))
        
        elif action == "generate":
            return self.generate_team(
                strategy=request.get("strategy", "balanced"),
                constraints=request.get("constraints"),
                must_include=request.get("must_include")
            )
        
        elif action == "suggest":
            return self.suggest_pokemon(
                current_team=request.get("team", []),
                role_needed=request.get("role_needed")
            )
        
        elif action == "counter":
            return self.counter_team(request.get("opponent_team", []))
        
        else:
            return {
                "success": False,
                "error": f"Action '{action}' non reconnue. Actions valides: analyze, generate, suggest, counter"
            }


# =============================================================================
# 📦 EXPORTS
# =============================================================================

__all__ = [
    "TeamBuilderAgent",
    "TeamAnalysisResult",
    "TeamGenerationResult"
]
