# =============================================================================
# 🟢 TEAM BUILDER TOOLS
# =============================================================================
# 
# Tools spécialisés pour la génération d'équipe Pokémon
# Chaque tool effectue un calcul précis - le LLM ne fait PAS de calculs
#
# =============================================================================

from langchain_core.tools import tool
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# =============================================================================
# 📝 SCHEMAS DE DONNÉES
# =============================================================================

class Pokemon(BaseModel):
    """Schéma d'un Pokémon"""
    id: int = Field(description="Numéro du Pokédex")
    name: str = Field(description="Nom du Pokémon")
    types: List[str] = Field(description="Types du Pokémon (1-2)")
    stats: Optional[Dict[str, int]] = Field(
        default=None,
        description="Stats (hp, attack, defense, special_attack, special_defense, speed)"
    )
    moves: Optional[List[str]] = Field(default=None, description="Liste des attaques")
    ability: Optional[str] = Field(default=None, description="Talent")

class Team(BaseModel):
    """Schéma d'une équipe"""
    pokemon: List[Pokemon] = Field(description="Liste des Pokémon (max 6)")


# =============================================================================
# 🔧 TOOL 1: TypeEffectivenessTool
# =============================================================================
# Calcule l'efficacité des types pour une équipe

# Table des types (simplifiée)
TYPE_CHART: Dict[str, Dict[str, float]] = {
    "normal": {"rock": 0.5, "ghost": 0, "steel": 0.5},
    "fire": {"fire": 0.5, "water": 0.5, "grass": 2, "ice": 2, "bug": 2, "rock": 0.5, "dragon": 0.5, "steel": 2},
    "water": {"fire": 2, "water": 0.5, "grass": 0.5, "ground": 2, "rock": 2, "dragon": 0.5},
    "electric": {"water": 2, "electric": 0.5, "grass": 0.5, "ground": 0, "flying": 2, "dragon": 0.5},
    "grass": {"fire": 0.5, "water": 2, "grass": 0.5, "poison": 0.5, "ground": 2, "flying": 0.5, "bug": 0.5, "rock": 2, "dragon": 0.5, "steel": 0.5},
    "ice": {"fire": 0.5, "water": 0.5, "grass": 2, "ice": 0.5, "ground": 2, "flying": 2, "dragon": 2, "steel": 0.5},
    "fighting": {"normal": 2, "ice": 2, "poison": 0.5, "flying": 0.5, "psychic": 0.5, "bug": 0.5, "rock": 2, "ghost": 0, "dark": 2, "steel": 2, "fairy": 0.5},
    "poison": {"grass": 2, "poison": 0.5, "ground": 0.5, "rock": 0.5, "ghost": 0.5, "steel": 0, "fairy": 2},
    "ground": {"fire": 2, "electric": 2, "grass": 0.5, "poison": 2, "flying": 0, "bug": 0.5, "rock": 2, "steel": 2},
    "flying": {"electric": 0.5, "grass": 2, "fighting": 2, "bug": 2, "rock": 0.5, "steel": 0.5},
    "psychic": {"fighting": 2, "poison": 2, "psychic": 0.5, "dark": 0, "steel": 0.5},
    "bug": {"fire": 0.5, "grass": 2, "fighting": 0.5, "poison": 0.5, "flying": 0.5, "psychic": 2, "ghost": 0.5, "dark": 2, "steel": 0.5, "fairy": 0.5},
    "rock": {"fire": 2, "ice": 2, "fighting": 0.5, "ground": 0.5, "flying": 2, "bug": 2, "steel": 0.5},
    "ghost": {"normal": 0, "psychic": 2, "ghost": 2, "dark": 0.5},
    "dragon": {"dragon": 2, "steel": 0.5, "fairy": 0},
    "dark": {"fighting": 0.5, "psychic": 2, "ghost": 2, "dark": 0.5, "fairy": 0.5},
    "steel": {"fire": 0.5, "water": 0.5, "electric": 0.5, "ice": 2, "rock": 2, "steel": 0.5, "fairy": 2},
    "fairy": {"fire": 0.5, "fighting": 2, "poison": 0.5, "dragon": 2, "dark": 2, "steel": 0.5}
}

ALL_TYPES = list(TYPE_CHART.keys())


@tool
def type_effectiveness_tool(attacking_type: str, defending_types: List[str]) -> Dict[str, Any]:
    """
    Calcule l'efficacité d'un type d'attaque contre des types défensifs.
    
    Args:
        attacking_type: Le type de l'attaque (ex: "fire")
        defending_types: Les types du défenseur (ex: ["grass", "poison"])
    
    Returns:
        Dict avec le multiplicateur et l'explication
    """
    attacking_type = attacking_type.lower()
    defending_types = [t.lower() for t in defending_types]
    
    if attacking_type not in TYPE_CHART:
        return {"error": f"Type '{attacking_type}' inconnu", "multiplier": 1.0}
    
    multiplier = 1.0
    details = []
    
    for def_type in defending_types:
        if def_type in TYPE_CHART.get(attacking_type, {}):
            type_mult = TYPE_CHART[attacking_type][def_type]
            multiplier *= type_mult
            if type_mult > 1:
                details.append(f"{attacking_type} → {def_type}: x{type_mult} (super efficace)")
            elif type_mult < 1 and type_mult > 0:
                details.append(f"{attacking_type} → {def_type}: x{type_mult} (pas très efficace)")
            elif type_mult == 0:
                details.append(f"{attacking_type} → {def_type}: x0 (aucun effet)")
    
    effectiveness = "normal"
    if multiplier >= 4:
        effectiveness = "super_effective_4x"
    elif multiplier >= 2:
        effectiveness = "super_effective"
    elif multiplier == 0:
        effectiveness = "immune"
    elif multiplier <= 0.25:
        effectiveness = "not_effective_4x"
    elif multiplier <= 0.5:
        effectiveness = "not_effective"
    
    return {
        "attacking_type": attacking_type,
        "defending_types": defending_types,
        "multiplier": multiplier,
        "effectiveness": effectiveness,
        "details": details
    }


# =============================================================================
# 🔧 TOOL 2: WeaknessCalculatorTool
# =============================================================================
# Calcule les faiblesses et résistances d'une équipe

# Faiblesses par type (ce qui est super efficace contre ce type)
TYPE_WEAKNESSES: Dict[str, List[str]] = {
    "normal": ["fighting"],
    "fire": ["water", "ground", "rock"],
    "water": ["electric", "grass"],
    "electric": ["ground"],
    "grass": ["fire", "ice", "poison", "flying", "bug"],
    "ice": ["fire", "fighting", "rock", "steel"],
    "fighting": ["flying", "psychic", "fairy"],
    "poison": ["ground", "psychic"],
    "ground": ["water", "grass", "ice"],
    "flying": ["electric", "ice", "rock"],
    "psychic": ["bug", "ghost", "dark"],
    "bug": ["fire", "flying", "rock"],
    "rock": ["water", "grass", "fighting", "ground", "steel"],
    "ghost": ["ghost", "dark"],
    "dragon": ["ice", "dragon", "fairy"],
    "dark": ["fighting", "bug", "fairy"],
    "steel": ["fire", "fighting", "ground"],
    "fairy": ["poison", "steel"]
}

TYPE_RESISTANCES: Dict[str, List[str]] = {
    "normal": [],
    "fire": ["fire", "grass", "ice", "bug", "steel", "fairy"],
    "water": ["fire", "water", "ice", "steel"],
    "electric": ["electric", "flying", "steel"],
    "grass": ["water", "electric", "grass", "ground"],
    "ice": ["ice"],
    "fighting": ["bug", "rock", "dark"],
    "poison": ["grass", "fighting", "poison", "bug", "fairy"],
    "ground": ["poison", "rock"],
    "flying": ["grass", "fighting", "bug"],
    "psychic": ["fighting", "psychic"],
    "bug": ["grass", "fighting", "ground"],
    "rock": ["normal", "fire", "poison", "flying"],
    "ghost": ["poison", "bug"],
    "dragon": ["fire", "water", "electric", "grass"],
    "dark": ["ghost", "dark"],
    "steel": ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"],
    "fairy": ["fighting", "bug", "dark"]
}


@tool
def weakness_calculator_tool(team: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcule les faiblesses et résistances cumulées d'une équipe.
    
    Args:
        team: Liste de Pokémon avec leurs types (ex: [{"name": "Pikachu", "types": ["electric"]}])
    
    Returns:
        Dict avec faiblesses communes, résistances et score de couverture
    """
    weakness_count: Dict[str, int] = {t: 0 for t in ALL_TYPES}
    resistance_count: Dict[str, int] = {t: 0 for t in ALL_TYPES}
    
    for pokemon in team:
        types = [t.lower() for t in pokemon.get("types", [])]
        
        # Calculer les faiblesses du Pokémon
        pokemon_weaknesses = set()
        pokemon_resistances = set()
        
        for poke_type in types:
            for weak in TYPE_WEAKNESSES.get(poke_type, []):
                pokemon_weaknesses.add(weak)
            for resist in TYPE_RESISTANCES.get(poke_type, []):
                pokemon_resistances.add(resist)
        
        # Retirer les résistances des faiblesses (si un type résiste et est faible)
        final_weaknesses = pokemon_weaknesses - pokemon_resistances
        
        for weak in final_weaknesses:
            weakness_count[weak] += 1
        for resist in pokemon_resistances:
            resistance_count[resist] += 1
    
    # Identifier les faiblesses critiques (3+ Pokémon faibles)
    critical_weaknesses = [t for t, count in weakness_count.items() if count >= 3]
    
    # Identifier les faiblesses moyennes (2 Pokémon faibles)
    moderate_weaknesses = [t for t, count in weakness_count.items() if count == 2]
    
    # Types bien couverts (résistances >= 2)
    well_covered = [t for t, count in resistance_count.items() if count >= 2]
    
    # Score de défense (100 - penalités)
    score = 100
    score -= len(critical_weaknesses) * 15
    score -= len(moderate_weaknesses) * 5
    score += len(well_covered) * 3
    score = max(0, min(100, score))
    
    return {
        "team_size": len(team),
        "critical_weaknesses": critical_weaknesses,
        "moderate_weaknesses": moderate_weaknesses,
        "well_covered_types": well_covered,
        "weakness_details": {t: c for t, c in weakness_count.items() if c > 0},
        "resistance_details": {t: c for t, c in resistance_count.items() if c > 0},
        "defense_score": score,
        "recommendations": _generate_weakness_recommendations(critical_weaknesses, moderate_weaknesses)
    }


def _generate_weakness_recommendations(critical: List[str], moderate: List[str]) -> List[str]:
    """Génère des recommandations basées sur les faiblesses"""
    recommendations = []
    
    if critical:
        recommendations.append(f"⚠️ Faiblesses critiques à {', '.join(critical)}. Ajoutez un Pokémon résistant.")
    
    if moderate:
        recommendations.append(f"⚡ Faiblesses modérées à {', '.join(moderate)}. Considérez la couverture.")
    
    if not critical and not moderate:
        recommendations.append("✅ Bonne couverture défensive!")
    
    return recommendations


# =============================================================================
# 🔧 TOOL 3: StatsAnalyzerTool
# =============================================================================
# Analyse les statistiques d'une équipe

@tool
def stats_analyzer_tool(team: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyse les statistiques d'une équipe Pokémon.
    
    Args:
        team: Liste de Pokémon avec leurs stats
              (ex: [{"name": "Pikachu", "stats": {"hp": 35, "attack": 55, ...}}])
    
    Returns:
        Dict avec moyennes, points forts/faibles et recommandations
    """
    if not team:
        return {"error": "Équipe vide"}
    
    # Stats par défaut si non fournies
    default_stats = {"hp": 80, "attack": 80, "defense": 80, "special_attack": 80, "special_defense": 80, "speed": 80}
    
    # Collecter toutes les stats
    all_stats: Dict[str, List[int]] = {
        "hp": [], "attack": [], "defense": [],
        "special_attack": [], "special_defense": [], "speed": []
    }
    
    for pokemon in team:
        stats = pokemon.get("stats", default_stats)
        for stat_name in all_stats.keys():
            # Gérer les variantes de noms
            value = stats.get(stat_name) or stats.get(stat_name.replace("_", "")) or default_stats[stat_name]
            all_stats[stat_name].append(value)
    
    # Calculer les moyennes
    averages = {stat: sum(values) / len(values) for stat, values in all_stats.items()}
    
    # Identifier les points forts (moyenne > 90)
    strengths = [stat for stat, avg in averages.items() if avg >= 90]
    
    # Identifier les points faibles (moyenne < 70)
    weaknesses = [stat for stat, avg in averages.items() if avg < 70]
    
    # Calculer le BST moyen (Base Stat Total)
    bst_per_pokemon = [sum(pokemon.get("stats", default_stats).values()) for pokemon in team]
    avg_bst = sum(bst_per_pokemon) / len(bst_per_pokemon)
    
    # Score de stats (basé sur BST et équilibre)
    stat_score = min(100, int((avg_bst / 600) * 100))
    
    # Balance offensive/défensive
    offensive_avg = (averages["attack"] + averages["special_attack"]) / 2
    defensive_avg = (averages["defense"] + averages["special_defense"]) / 2
    
    if offensive_avg > defensive_avg + 20:
        balance = "offensive"
    elif defensive_avg > offensive_avg + 20:
        balance = "defensive"
    else:
        balance = "balanced"
    
    return {
        "team_size": len(team),
        "stat_averages": {k: round(v, 1) for k, v in averages.items()},
        "average_bst": round(avg_bst, 1),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "team_balance": balance,
        "offensive_power": round(offensive_avg, 1),
        "defensive_power": round(defensive_avg, 1),
        "speed_tier": _get_speed_tier(averages["speed"]),
        "stat_score": stat_score
    }


def _get_speed_tier(avg_speed: float) -> str:
    """Détermine le tier de vitesse"""
    if avg_speed >= 110:
        return "very_fast"
    elif avg_speed >= 90:
        return "fast"
    elif avg_speed >= 70:
        return "average"
    elif avg_speed >= 50:
        return "slow"
    else:
        return "very_slow"


# =============================================================================
# 🔧 TOOL 4: RoleClassifierTool
# =============================================================================
# Classifie les rôles stratégiques des Pokémon

ROLE_THRESHOLDS = {
    "physical_sweeper": {"attack": 100, "speed": 90},
    "special_sweeper": {"special_attack": 100, "speed": 90},
    "physical_wall": {"defense": 100, "hp": 80},
    "special_wall": {"special_defense": 100, "hp": 80},
    "mixed_wall": {"defense": 80, "special_defense": 80, "hp": 100},
    "tank": {"hp": 90, "attack": 80, "defense": 80},
    "support": {"hp": 80},  # Défaut si rien d'autre
    "pivot": {"speed": 70}  # Pokémon polyvalent
}


@tool
def role_classifier_tool(team: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Classifie le rôle stratégique de chaque Pokémon dans l'équipe.
    
    Args:
        team: Liste de Pokémon avec leurs stats
    
    Returns:
        Dict avec le rôle de chaque Pokémon et la distribution des rôles
    """
    default_stats = {"hp": 80, "attack": 80, "defense": 80, "special_attack": 80, "special_defense": 80, "speed": 80}
    
    roles = []
    role_distribution: Dict[str, int] = {}
    
    for pokemon in team:
        name = pokemon.get("name", "Unknown")
        stats = pokemon.get("stats", default_stats)
        
        # Déterminer le rôle
        role = _classify_single_pokemon(stats)
        
        roles.append({
            "name": name,
            "role": role,
            "confidence": _calculate_role_confidence(stats, role)
        })
        
        role_distribution[role] = role_distribution.get(role, 0) + 1
    
    # Vérifier l'équilibre des rôles
    has_sweeper = any(r["role"] in ["physical_sweeper", "special_sweeper"] for r in roles)
    has_wall = any(r["role"] in ["physical_wall", "special_wall", "mixed_wall"] for r in roles)
    has_tank = any(r["role"] == "tank" for r in roles)
    
    balance_issues = []
    if not has_sweeper:
        balance_issues.append("Manque d'attaquant rapide (sweeper)")
    if not has_wall:
        balance_issues.append("Manque de mur défensif")
    
    is_balanced = has_sweeper and has_wall
    
    return {
        "pokemon_roles": roles,
        "role_distribution": role_distribution,
        "is_balanced": is_balanced,
        "balance_issues": balance_issues,
        "recommendations": _generate_role_recommendations(role_distribution)
    }


def _classify_single_pokemon(stats: Dict[str, int]) -> str:
    """Classifie un seul Pokémon basé sur ses stats"""
    atk = stats.get("attack", 80)
    spa = stats.get("special_attack", 80)
    spd = stats.get("speed", 80)
    hp = stats.get("hp", 80)
    defe = stats.get("defense", 80)
    spdef = stats.get("special_defense", 80)
    
    # Sweepers
    if spd >= 90:
        if atk >= 100 and atk > spa:
            return "physical_sweeper"
        if spa >= 100:
            return "special_sweeper"
    
    # Walls
    if defe >= 100 and hp >= 80:
        return "physical_wall"
    if spdef >= 100 and hp >= 80:
        return "special_wall"
    if defe >= 80 and spdef >= 80 and hp >= 90:
        return "mixed_wall"
    
    # Tank
    if hp >= 90 and (atk >= 80 or spa >= 80) and (defe >= 70 or spdef >= 70):
        return "tank"
    
    # Pivot
    if spd >= 70 and (atk >= 70 or spa >= 70):
        return "pivot"
    
    return "support"


def _calculate_role_confidence(stats: Dict[str, int], role: str) -> str:
    """Calcule la confiance dans la classification"""
    # Simplifié pour l'exemple
    return "high" if role != "support" else "medium"


def _generate_role_recommendations(distribution: Dict[str, int]) -> List[str]:
    """Génère des recommandations sur les rôles"""
    recommendations = []
    
    sweeper_count = distribution.get("physical_sweeper", 0) + distribution.get("special_sweeper", 0)
    wall_count = distribution.get("physical_wall", 0) + distribution.get("special_wall", 0) + distribution.get("mixed_wall", 0)
    
    if sweeper_count == 0:
        recommendations.append("Ajoutez un sweeper pour la pression offensive")
    elif sweeper_count >= 4:
        recommendations.append("Trop de sweepers, ajoutez de la défense")
    
    if wall_count == 0:
        recommendations.append("Ajoutez un mur pour absorber les coups")
    
    return recommendations


# =============================================================================
# 🔧 TOOL 5: MoveCoverageTool
# =============================================================================
# Analyse la couverture offensive des attaques

@tool
def move_coverage_tool(team: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyse la couverture offensive de l'équipe basée sur les types d'attaques.
    
    Args:
        team: Liste de Pokémon avec leurs moves ou types
              (ex: [{"name": "Pikachu", "types": ["electric"], "moves": ["Thunderbolt", "Iron Tail"]}])
    
    Returns:
        Dict avec la couverture de types et les trous dans la couverture
    """
    # Types couverts par l'équipe (basé sur les types des Pokémon si pas de moves)
    covered_types: set = set()
    type_sources: Dict[str, List[str]] = {}
    
    for pokemon in team:
        name = pokemon.get("name", "Unknown")
        types = pokemon.get("types", [])
        moves = pokemon.get("moves", [])
        
        # Ajouter les types STAB
        for poke_type in types:
            poke_type = poke_type.lower()
            covered_types.add(poke_type)
            if poke_type not in type_sources:
                type_sources[poke_type] = []
            type_sources[poke_type].append(f"{name} (STAB)")
    
    # Calculer quels types ne sont PAS couverts en super-efficace
    super_effective_against: Dict[str, List[str]] = {}
    
    for attack_type in covered_types:
        for def_type, weaknesses in TYPE_WEAKNESSES.items():
            if attack_type in weaknesses:
                if def_type not in super_effective_against:
                    super_effective_against[def_type] = []
                super_effective_against[def_type].append(attack_type)
    
    # Types non couverts (aucune attaque super-efficace)
    uncovered_types = [t for t in ALL_TYPES if t not in super_effective_against]
    
    # Score de couverture
    coverage_score = int((len(super_effective_against) / len(ALL_TYPES)) * 100)
    
    return {
        "team_size": len(team),
        "attacking_types_available": list(covered_types),
        "types_hit_super_effective": list(super_effective_against.keys()),
        "uncovered_types": uncovered_types,
        "type_coverage_details": {k: v for k, v in super_effective_against.items()},
        "coverage_score": coverage_score,
        "coverage_percentage": f"{len(super_effective_against)}/{len(ALL_TYPES)} types",
        "recommendations": _generate_coverage_recommendations(uncovered_types)
    }


def _generate_coverage_recommendations(uncovered: List[str]) -> List[str]:
    """Génère des recommandations pour améliorer la couverture"""
    recommendations = []
    
    if len(uncovered) == 0:
        recommendations.append("✅ Excellente couverture offensive!")
    elif len(uncovered) <= 3:
        recommendations.append(f"Bonne couverture. Non couverts: {', '.join(uncovered)}")
    else:
        recommendations.append(f"⚠️ {len(uncovered)} types non couverts: {', '.join(uncovered[:5])}")
        
        # Suggérer des types pour combler
        if "steel" in uncovered:
            recommendations.append("Ajoutez une attaque Feu, Combat ou Sol")
        if "fairy" in uncovered:
            recommendations.append("Ajoutez une attaque Poison ou Acier")
    
    return recommendations


# =============================================================================
# 📦 EXPORT DE TOUS LES TOOLS
# =============================================================================

TEAM_BUILDER_TOOLS = [
    type_effectiveness_tool,
    weakness_calculator_tool,
    stats_analyzer_tool,
    role_classifier_tool,
    move_coverage_tool
]

__all__ = [
    "type_effectiveness_tool",
    "weakness_calculator_tool",
    "stats_analyzer_tool",
    "role_classifier_tool",
    "move_coverage_tool",
    "TEAM_BUILDER_TOOLS",
    "TYPE_CHART",
    "TYPE_WEAKNESSES",
    "TYPE_RESISTANCES"
]
