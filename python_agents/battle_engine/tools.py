# =============================================================================
# 🔴 BATTLE ENGINE TOOLS
# =============================================================================
# 
# Tools spécialisés pour la simulation de combat Pokémon
# Chaque tool effectue un calcul précis - le LLM ne fait PAS de calculs
#
# =============================================================================

from langchain_core.tools import tool
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
import random
import math

# Import du type chart depuis team_builder
from ..team_builder.tools import TYPE_CHART, TYPE_WEAKNESSES, ALL_TYPES


# =============================================================================
# 📝 SCHEMAS DE DONNÉES COMBAT
# =============================================================================

class BattlePokemon(BaseModel):
    """Pokémon en combat avec HP actuels"""
    id: int
    name: str
    types: List[str]
    stats: Dict[str, int]  # hp, attack, defense, special_attack, special_defense, speed
    current_hp: int
    moves: List[Dict[str, Any]]  # name, type, power, category, accuracy
    status: Optional[str] = None  # burn, paralysis, poison, toxic, sleep, freeze
    stat_modifiers: Dict[str, int] = {}  # attack: +1, defense: -1, etc.
    ability: Optional[str] = None
    item: Optional[str] = None


class Move(BaseModel):
    """Attaque Pokémon"""
    name: str
    type: str
    power: int
    category: Literal["physical", "special", "status"]
    accuracy: int = 100
    priority: int = 0
    effects: Optional[Dict[str, Any]] = None


# =============================================================================
# 🔧 TOOL 1: DamageCalculatorTool
# =============================================================================
# Calcule les dégâts selon la formule officielle Pokémon

def _get_type_multiplier(move_type: str, defender_types: List[str]) -> float:
    """Calcule le multiplicateur de type"""
    move_type = move_type.lower()
    multiplier = 1.0
    
    for def_type in defender_types:
        def_type = def_type.lower()
        if move_type in TYPE_CHART and def_type in TYPE_CHART.get(move_type, {}):
            multiplier *= TYPE_CHART[move_type][def_type]
        # Vérifier les immunités
        if def_type == "ghost" and move_type in ["normal", "fighting"]:
            multiplier *= 0
        elif def_type == "normal" and move_type == "ghost":
            multiplier *= 0
        elif def_type == "ground" and move_type == "electric":
            multiplier *= 0
        elif def_type == "flying" and move_type == "ground":
            multiplier *= 0
        elif def_type == "dark" and move_type == "psychic":
            multiplier *= 0
        elif def_type == "fairy" and move_type == "dragon":
            multiplier *= 0
    
    return multiplier


@tool
def damage_calculator_tool(
    attacker: Dict[str, Any],
    defender: Dict[str, Any],
    move: Dict[str, Any],
    weather: Optional[str] = None,
    terrain: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calcule les dégâts d'une attaque selon la formule officielle Pokémon.
    
    Args:
        attacker: Le Pokémon attaquant avec ses stats
        defender: Le Pokémon défenseur avec ses stats et HP
        move: L'attaque utilisée (name, type, power, category)
        weather: Météo actuelle (sun, rain, sandstorm, hail, none)
        terrain: Terrain actuel (electric, grassy, psychic, misty, none)
    
    Returns:
        Dict avec les dégâts calculés, chance de KO et détails
    """
    # Extraire les données
    level = attacker.get("level", 50)
    move_power = move.get("power", 0)
    move_type = move.get("type", "normal").lower()
    category = move.get("category", "physical").lower()
    accuracy = move.get("accuracy", 100)
    
    # Si move de statut, pas de dégâts
    if category == "status" or move_power == 0:
        return {
            "is_status_move": True,
            "damage": {"min": 0, "max": 0},
            "ko_chance": 0,
            "effectiveness": "status"
        }
    
    # Stats d'attaque et défense
    attacker_stats = attacker.get("stats", {})
    defender_stats = defender.get("stats", {})
    
    if category == "physical":
        attack_stat = attacker_stats.get("attack", 100)
        defense_stat = defender_stats.get("defense", 100)
    else:  # special
        attack_stat = attacker_stats.get("special_attack", 100)
        defense_stat = defender_stats.get("special_defense", 100)
    
    # Appliquer les modificateurs de stats
    attack_modifier = attacker.get("stat_modifiers", {}).get("attack" if category == "physical" else "special_attack", 0)
    defense_modifier = defender.get("stat_modifiers", {}).get("defense" if category == "physical" else "special_defense", 0)
    
    # Conversion modificateur -> multiplicateur
    modifier_table = {-6: 2/8, -5: 2/7, -4: 2/6, -3: 2/5, -2: 2/4, -1: 2/3, 0: 1, 1: 3/2, 2: 4/2, 3: 5/2, 4: 6/2, 5: 7/2, 6: 8/2}
    attack_stat *= modifier_table.get(attack_modifier, 1)
    defense_stat *= modifier_table.get(defense_modifier, 1)
    
    # Brûlure réduit l'attaque physique
    if attacker.get("status") == "burn" and category == "physical":
        attack_stat *= 0.5
    
    # Formule de dégâts de base
    base_damage = ((2 * level / 5 + 2) * move_power * attack_stat / defense_stat) / 50 + 2
    
    # STAB (Same Type Attack Bonus)
    attacker_types = [t.lower() for t in attacker.get("types", [])]
    stab = 1.5 if move_type in attacker_types else 1.0
    
    # Multiplicateur de type
    defender_types = [t.lower() for t in defender.get("types", [])]
    type_mult = _get_type_multiplier(move_type, defender_types)
    
    # Météo
    weather_mult = 1.0
    if weather == "sun":
        if move_type == "fire":
            weather_mult = 1.5
        elif move_type == "water":
            weather_mult = 0.5
    elif weather == "rain":
        if move_type == "water":
            weather_mult = 1.5
        elif move_type == "fire":
            weather_mult = 0.5
    
    # Dégâts finaux (avec random 0.85-1.0)
    modifier = stab * type_mult * weather_mult
    min_damage = int(base_damage * modifier * 0.85)
    max_damage = int(base_damage * modifier * 1.0)
    
    # Calcul du KO
    defender_hp = defender.get("current_hp", defender_stats.get("hp", 100))
    ko_chance = 0
    if max_damage >= defender_hp:
        if min_damage >= defender_hp:
            ko_chance = 100
        else:
            # Approximation linéaire
            ko_chance = int(((max_damage - defender_hp) / (max_damage - min_damage + 1)) * 100)
    
    # Déterminer l'efficacité
    if type_mult >= 4:
        effectiveness_text = "super_effective_4x"
    elif type_mult >= 2:
        effectiveness_text = "super_effective"
    elif type_mult == 0:
        effectiveness_text = "immune"
    elif type_mult <= 0.25:
        effectiveness_text = "not_effective_4x"
    elif type_mult <= 0.5:
        effectiveness_text = "not_effective"
    else:
        effectiveness_text = "normal"
    
    # Pourcentage de HP
    hp_percent_min = round((min_damage / defender_hp) * 100, 1) if defender_hp > 0 else 0
    hp_percent_max = round((max_damage / defender_hp) * 100, 1) if defender_hp > 0 else 0
    
    return {
        "move_name": move.get("name", "Unknown"),
        "move_type": move_type,
        "category": category,
        "damage": {
            "min": min_damage,
            "max": max_damage,
            "average": int((min_damage + max_damage) / 2)
        },
        "hp_damage_percent": {
            "min": hp_percent_min,
            "max": hp_percent_max
        },
        "ko_chance": ko_chance,
        "effectiveness": effectiveness_text,
        "type_multiplier": type_mult,
        "stab_applied": stab > 1,
        "weather_modifier": weather_mult,
        "accuracy": accuracy,
        "hit_probability": accuracy,
        "details": {
            "attacker": attacker.get("name", "Unknown"),
            "defender": defender.get("name", "Unknown"),
            "defender_hp": defender_hp
        }
    }


# =============================================================================
# 🔧 TOOL 2: SpeedComparatorTool
# =============================================================================
# Détermine l'ordre d'attaque

@tool
def speed_comparator_tool(
    pokemon1: Dict[str, Any],
    pokemon2: Dict[str, Any],
    move1_priority: int = 0,
    move2_priority: int = 0,
    weather: Optional[str] = None,
    trick_room: bool = False
) -> Dict[str, Any]:
    """
    Compare les vitesses de deux Pokémon pour déterminer qui attaque en premier.
    
    Args:
        pokemon1: Premier Pokémon avec ses stats
        pokemon2: Second Pokémon avec ses stats
        move1_priority: Priorité de l'attaque du Pokémon 1 (-7 à +5)
        move2_priority: Priorité de l'attaque du Pokémon 2
        weather: Météo actuelle (pour Swift Swim, Chlorophyll, etc.)
        trick_room: Si Trick Room est actif (inverse l'ordre)
    
    Returns:
        Dict avec l'ordre d'attaque et les détails
    """
    # Vitesses de base
    stats1 = pokemon1.get("stats", {})
    stats2 = pokemon2.get("stats", {})
    
    base_speed1 = stats1.get("speed", 100)
    base_speed2 = stats2.get("speed", 100)
    
    # Modificateurs de stats
    speed_mod1 = pokemon1.get("stat_modifiers", {}).get("speed", 0)
    speed_mod2 = pokemon2.get("stat_modifiers", {}).get("speed", 0)
    
    modifier_table = {-6: 2/8, -5: 2/7, -4: 2/6, -3: 2/5, -2: 2/4, -1: 2/3, 0: 1, 1: 3/2, 2: 4/2, 3: 5/2, 4: 6/2, 5: 7/2, 6: 8/2}
    
    effective_speed1 = base_speed1 * modifier_table.get(speed_mod1, 1)
    effective_speed2 = base_speed2 * modifier_table.get(speed_mod2, 1)
    
    # Paralysie réduit la vitesse de 50%
    if pokemon1.get("status") == "paralysis":
        effective_speed1 *= 0.5
    if pokemon2.get("status") == "paralysis":
        effective_speed2 *= 0.5
    
    # Talents de vitesse météo (simplifié)
    ability1 = pokemon1.get("ability", "").lower()
    ability2 = pokemon2.get("ability", "").lower()
    
    if weather == "sun":
        if ability1 == "chlorophyll":
            effective_speed1 *= 2
        if ability2 == "chlorophyll":
            effective_speed2 *= 2
    elif weather == "rain":
        if ability1 == "swift swim":
            effective_speed1 *= 2
        if ability2 == "swift swim":
            effective_speed2 *= 2
    elif weather == "sandstorm":
        if ability1 == "sand rush":
            effective_speed1 *= 2
        if ability2 == "sand rush":
            effective_speed2 *= 2
    
    # Items de vitesse (simplifié)
    item1 = pokemon1.get("item", "").lower()
    item2 = pokemon2.get("item", "").lower()
    
    if item1 == "choice scarf":
        effective_speed1 *= 1.5
    if item2 == "choice scarf":
        effective_speed2 *= 1.5
    
    # Priorité des attaques (priorité > vitesse)
    if move1_priority != move2_priority:
        if move1_priority > move2_priority:
            first = pokemon1.get("name", "Pokemon 1")
            reason = f"Priorité +{move1_priority} > +{move2_priority}"
        else:
            first = pokemon2.get("name", "Pokemon 2")
            reason = f"Priorité +{move2_priority} > +{move1_priority}"
    else:
        # Comparer les vitesses
        if trick_room:
            # Trick Room inverse l'ordre
            if effective_speed1 < effective_speed2:
                first = pokemon1.get("name", "Pokemon 1")
                reason = "Plus lent (Trick Room actif)"
            elif effective_speed2 < effective_speed1:
                first = pokemon2.get("name", "Pokemon 2")
                reason = "Plus lent (Trick Room actif)"
            else:
                first = "speed_tie"
                reason = "Égalité de vitesse (50/50)"
        else:
            if effective_speed1 > effective_speed2:
                first = pokemon1.get("name", "Pokemon 1")
                reason = "Plus rapide"
            elif effective_speed2 > effective_speed1:
                first = pokemon2.get("name", "Pokemon 2")
                reason = "Plus rapide"
            else:
                first = "speed_tie"
                reason = "Égalité de vitesse (50/50)"
    
    return {
        "first_to_act": first,
        "reason": reason,
        "speed_comparison": {
            pokemon1.get("name", "Pokemon 1"): {
                "base_speed": base_speed1,
                "effective_speed": int(effective_speed1),
                "modifier": speed_mod1,
                "move_priority": move1_priority
            },
            pokemon2.get("name", "Pokemon 2"): {
                "base_speed": base_speed2,
                "effective_speed": int(effective_speed2),
                "modifier": speed_mod2,
                "move_priority": move2_priority
            }
        },
        "trick_room_active": trick_room,
        "weather": weather,
        "speed_difference": abs(int(effective_speed1 - effective_speed2))
    }


# =============================================================================
# 🔧 TOOL 3: StatModifierTool
# =============================================================================
# Gère les modifications de statistiques en combat

STAT_MODIFIER_LIMITS = {"min": -6, "max": 6}


@tool
def stat_modifier_tool(
    pokemon: Dict[str, Any],
    stat_changes: Dict[str, int]
) -> Dict[str, Any]:
    """
    Applique des modifications de statistiques à un Pokémon.
    
    Args:
        pokemon: Le Pokémon à modifier
        stat_changes: Dict des changements (ex: {"attack": +2, "defense": -1})
    
    Returns:
        Dict avec les nouveaux modificateurs et l'effet réel
    """
    current_modifiers = pokemon.get("stat_modifiers", {}).copy()
    applied_changes = {}
    final_modifiers = {}
    messages = []
    
    valid_stats = ["attack", "defense", "special_attack", "special_defense", "speed", "accuracy", "evasion"]
    
    for stat, change in stat_changes.items():
        stat = stat.lower().replace(" ", "_")
        
        if stat not in valid_stats:
            messages.append(f"Stat '{stat}' invalide, ignorée")
            continue
        
        current = current_modifiers.get(stat, 0)
        new_value = current + change
        
        # Appliquer les limites
        if new_value > STAT_MODIFIER_LIMITS["max"]:
            new_value = STAT_MODIFIER_LIMITS["max"]
            if current == STAT_MODIFIER_LIMITS["max"]:
                messages.append(f"{stat.replace('_', ' ').title()} ne peut plus monter!")
                applied_changes[stat] = 0
            else:
                applied_changes[stat] = STAT_MODIFIER_LIMITS["max"] - current
                messages.append(f"{stat.replace('_', ' ').title()} augmente fortement!")
        elif new_value < STAT_MODIFIER_LIMITS["min"]:
            new_value = STAT_MODIFIER_LIMITS["min"]
            if current == STAT_MODIFIER_LIMITS["min"]:
                messages.append(f"{stat.replace('_', ' ').title()} ne peut plus baisser!")
                applied_changes[stat] = 0
            else:
                applied_changes[stat] = STAT_MODIFIER_LIMITS["min"] - current
                messages.append(f"{stat.replace('_', ' ').title()} baisse drastiquement!")
        else:
            applied_changes[stat] = change
            if change > 0:
                msg = "augmente" if change == 1 else "augmente fortement" if change == 2 else "augmente drastiquement"
            else:
                msg = "baisse" if change == -1 else "baisse fortement" if change == -2 else "baisse drastiquement"
            messages.append(f"{stat.replace('_', ' ').title()} {msg}!")
        
        final_modifiers[stat] = new_value
    
    # Calculer les multiplicateurs réels
    modifier_table = {
        -6: 0.25, -5: 0.29, -4: 0.33, -3: 0.4, -2: 0.5, -1: 0.67,
        0: 1.0,
        1: 1.5, 2: 2.0, 3: 2.5, 4: 3.0, 5: 3.5, 6: 4.0
    }
    
    actual_multipliers = {stat: modifier_table.get(mod, 1.0) for stat, mod in final_modifiers.items()}
    
    return {
        "pokemon": pokemon.get("name", "Unknown"),
        "previous_modifiers": current_modifiers,
        "changes_applied": applied_changes,
        "new_modifiers": final_modifiers,
        "actual_multipliers": actual_multipliers,
        "messages": messages
    }


# =============================================================================
# 🔧 TOOL 4: StatusEffectTool
# =============================================================================
# Gère les effets de statut

STATUS_EFFECTS = {
    "burn": {
        "damage_per_turn": 1/16,  # Fraction des HP max
        "attack_modifier": 0.5,   # Sur attaque physique
        "can_move": True
    },
    "paralysis": {
        "speed_modifier": 0.5,
        "skip_chance": 25,  # % de chance de ne pas bouger
        "can_move": True
    },
    "poison": {
        "damage_per_turn": 1/8,
        "can_move": True
    },
    "toxic": {
        "damage_per_turn_base": 1/16,  # Augmente chaque tour
        "stacking": True,
        "can_move": True
    },
    "sleep": {
        "can_move": False,
        "min_turns": 1,
        "max_turns": 3,
        "wake_moves": ["Sleep Talk", "Snore"]
    },
    "freeze": {
        "can_move": False,
        "thaw_chance": 20,  # % par tour
        "thaw_moves": ["Flame Wheel", "Sacred Fire", "Flare Blitz", "Scald"]
    }
}


@tool
def status_effect_tool(
    pokemon: Dict[str, Any],
    new_status: Optional[str] = None,
    turn_number: int = 1
) -> Dict[str, Any]:
    """
    Évalue les effets d'un statut sur un Pokémon.
    
    Args:
        pokemon: Le Pokémon avec son statut actuel
        new_status: Nouveau statut à appliquer (optionnel)
        turn_number: Numéro du tour actuel (pour toxic stacking)
    
    Returns:
        Dict avec les effets du statut et les actions possibles
    """
    current_status = pokemon.get("status", None)
    stats = pokemon.get("stats", {})
    max_hp = stats.get("hp", 100)
    current_hp = pokemon.get("current_hp", max_hp)
    pokemon_types = [t.lower() for t in pokemon.get("types", [])]
    
    result = {
        "pokemon": pokemon.get("name", "Unknown"),
        "current_status": current_status,
        "new_status_applied": None,
        "status_prevented": None,
        "can_attack": True,
        "damage_this_turn": 0,
        "stat_effects": {},
        "turns_to_ko": None,
        "messages": []
    }
    
    # Vérifier l'immunité aux statuts
    immunities = {
        "poison": ["poison", "steel"],
        "toxic": ["poison", "steel"],
        "burn": ["fire"],
        "paralysis": ["electric"],  # Gen 6+
        "freeze": ["ice"]
    }
    
    # Appliquer un nouveau statut
    if new_status:
        new_status = new_status.lower()
        
        # Déjà un statut?
        if current_status:
            result["status_prevented"] = f"Déjà {current_status}"
            result["messages"].append(f"{pokemon.get('name')} a déjà le statut {current_status}!")
        # Vérifier immunité
        elif new_status in immunities and any(t in immunities[new_status] for t in pokemon_types):
            result["status_prevented"] = f"Immunité type {pokemon_types}"
            result["messages"].append(f"Ça n'affecte pas {pokemon.get('name')}...")
        else:
            result["new_status_applied"] = new_status
            result["current_status"] = new_status
            current_status = new_status
            result["messages"].append(f"{pokemon.get('name')} est maintenant {new_status}!")
    
    # Calculer les effets du statut actuel
    if current_status and current_status in STATUS_EFFECTS:
        effect = STATUS_EFFECTS[current_status]
        
        # Dégâts par tour
        if "damage_per_turn" in effect:
            damage = int(max_hp * effect["damage_per_turn"])
            result["damage_this_turn"] = damage
            result["messages"].append(f"{pokemon.get('name')} subit {damage} dégâts de {current_status}!")
            
            # Tours avant KO par statut
            if damage > 0:
                result["turns_to_ko"] = math.ceil(current_hp / damage)
        
        # Toxic (dégâts croissants)
        if current_status == "toxic":
            toxic_damage = int(max_hp * (1/16) * turn_number)
            toxic_damage = min(toxic_damage, int(max_hp * 15/16))  # Cap à 15/16
            result["damage_this_turn"] = toxic_damage
            result["toxic_turn"] = turn_number
            result["messages"].append(f"Toxic: {toxic_damage} dégâts (tour {turn_number})")
        
        # Modificateurs de stats
        if "attack_modifier" in effect:
            result["stat_effects"]["attack_multiplier"] = effect["attack_modifier"]
        if "speed_modifier" in effect:
            result["stat_effects"]["speed_multiplier"] = effect["speed_modifier"]
        
        # Peut attaquer?
        if not effect.get("can_move", True):
            result["can_attack"] = False
            result["messages"].append(f"{pokemon.get('name')} ne peut pas bouger!")
            
            # Chance de se réveiller/dégeler
            if current_status == "freeze" and effect.get("thaw_chance"):
                result["thaw_chance"] = effect["thaw_chance"]
            elif current_status == "sleep":
                result["wake_up_info"] = {"min_turns": effect["min_turns"], "max_turns": effect["max_turns"]}
        
        # Paralysie - chance de skip
        if current_status == "paralysis" and effect.get("skip_chance"):
            result["skip_chance"] = effect["skip_chance"]
            result["messages"].append(f"{effect['skip_chance']}% de chance de ne pas bouger")
    
    return result


# =============================================================================
# 🔧 TOOL 5: MoveEvaluatorTool
# =============================================================================
# Évalue la meilleure attaque à utiliser

@tool
def move_evaluator_tool(
    attacker: Dict[str, Any],
    defender: Dict[str, Any],
    weather: Optional[str] = None,
    terrain: Optional[str] = None
) -> Dict[str, Any]:
    """
    Évalue toutes les attaques disponibles et recommande la meilleure.
    
    Args:
        attacker: Le Pokémon attaquant avec ses moves
        defender: Le Pokémon défenseur
        weather: Météo actuelle
        terrain: Terrain actuel
    
    Returns:
        Dict avec le classement des attaques et la recommandation
    """
    moves = attacker.get("moves", [])
    
    if not moves:
        return {
            "error": "Aucune attaque disponible",
            "recommendation": None
        }
    
    evaluations = []
    
    for move in moves:
        # Calculer les dégâts pour chaque move
        damage_result = damage_calculator_tool.invoke({
            "attacker": attacker,
            "defender": defender,
            "move": move,
            "weather": weather,
            "terrain": terrain
        })
        
        # Score basé sur plusieurs facteurs
        score = 0
        
        # Dégâts moyens (facteur principal)
        avg_damage = damage_result.get("damage", {}).get("average", 0)
        score += avg_damage * 2
        
        # Bonus KO potentiel
        ko_chance = damage_result.get("ko_chance", 0)
        if ko_chance == 100:
            score += 500  # KO garanti = priorité maximale
        elif ko_chance > 0:
            score += ko_chance * 3
        
        # Bonus efficacité
        effectiveness = damage_result.get("type_multiplier", 1)
        score += effectiveness * 50
        
        # Malus précision
        accuracy = damage_result.get("accuracy", 100)
        if accuracy < 100:
            score *= (accuracy / 100)
        
        # Catégorie (vérifier si l'attaquant est physique ou spécial)
        attacker_stats = attacker.get("stats", {})
        atk = attacker_stats.get("attack", 80)
        spa = attacker_stats.get("special_attack", 80)
        category = move.get("category", "physical")
        
        # Bonus si le move utilise la meilleure stat
        if category == "physical" and atk > spa:
            score += 30
        elif category == "special" and spa > atk:
            score += 30
        
        evaluations.append({
            "move": move.get("name", "Unknown"),
            "type": move.get("type", "normal"),
            "category": category,
            "power": move.get("power", 0),
            "accuracy": accuracy,
            "damage": damage_result.get("damage", {}),
            "ko_chance": ko_chance,
            "effectiveness": damage_result.get("effectiveness", "normal"),
            "score": round(score, 1)
        })
    
    # Trier par score
    evaluations.sort(key=lambda x: x["score"], reverse=True)
    
    best_move = evaluations[0] if evaluations else None
    
    return {
        "attacker": attacker.get("name", "Unknown"),
        "defender": defender.get("name", "Unknown"),
        "move_rankings": evaluations,
        "best_move": best_move["move"] if best_move else None,
        "best_score": best_move["score"] if best_move else 0,
        "recommendation": _generate_move_recommendation(best_move, evaluations)
    }


def _generate_move_recommendation(best: Dict, all_moves: List[Dict]) -> str:
    """Génère une recommandation textuelle"""
    if not best:
        return "Aucune attaque disponible"
    
    if best.get("ko_chance", 0) == 100:
        return f"🎯 {best['move']} - KO GARANTI!"
    elif best.get("ko_chance", 0) > 50:
        return f"🎯 {best['move']} - {best['ko_chance']}% de chance de KO"
    elif best.get("effectiveness") == "super_effective_4x":
        return f"💥 {best['move']} - Super efficace x4!"
    elif best.get("effectiveness") == "super_effective":
        return f"👍 {best['move']} - Super efficace"
    else:
        return f"📊 {best['move']} - Meilleur dégât moyen"


# =============================================================================
# 🔧 TOOL 6: SwitchStrategyTool
# =============================================================================
# Évalue s'il faut switch et vers quel Pokémon

@tool
def switch_strategy_tool(
    active_pokemon: Dict[str, Any],
    opponent: Dict[str, Any],
    team: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Évalue si un switch est recommandé et vers quel Pokémon.
    
    Args:
        active_pokemon: Le Pokémon actuellement en jeu
        opponent: Le Pokémon adverse
        team: L'équipe complète (Pokémon de réserve)
    
    Returns:
        Dict avec la recommandation de switch et les scores de chaque option
    """
    # Filtrer les Pokémon disponibles (pas KO, pas actif)
    available = [p for p in team if p.get("current_hp", 0) > 0 and p.get("name") != active_pokemon.get("name")]
    
    if not available:
        return {
            "should_switch": False,
            "reason": "Aucun Pokémon de remplacement disponible",
            "switch_options": []
        }
    
    opponent_types = [t.lower() for t in opponent.get("types", [])]
    active_types = [t.lower() for t in active_pokemon.get("types", [])]
    
    # Évaluer le matchup actuel
    current_matchup_score = _evaluate_matchup(active_types, opponent_types)
    
    # Évaluer chaque option de switch
    switch_options = []
    
    for pokemon in available:
        pokemon_types = [t.lower() for t in pokemon.get("types", [])]
        
        # Score de matchup
        matchup_score = _evaluate_matchup(pokemon_types, opponent_types)
        
        # Bonus si résiste aux types adverses
        resistance_bonus = 0
        for opp_type in opponent_types:
            if any(opp_type in TYPE_WEAKNESSES.get(poke_type, []) for poke_type in pokemon_types):
                resistance_bonus -= 30  # Faible à ce type
            # Vérifier résistances (simplifié)
            for poke_type in pokemon_types:
                if opp_type in TYPE_CHART.get(poke_type, {}) and TYPE_CHART[poke_type][opp_type] < 1:
                    resistance_bonus += 20
        
        # HP restants
        hp_percent = pokemon.get("current_hp", 100) / pokemon.get("stats", {}).get("hp", 100) * 100
        hp_bonus = hp_percent * 0.5
        
        total_score = matchup_score + resistance_bonus + hp_bonus
        
        switch_options.append({
            "name": pokemon.get("name", "Unknown"),
            "types": pokemon_types,
            "hp_remaining": round(hp_percent, 1),
            "matchup_score": matchup_score,
            "resistance_bonus": resistance_bonus,
            "total_score": round(total_score, 1),
            "reasoning": _generate_switch_reasoning(matchup_score, resistance_bonus, opponent)
        })
    
    # Trier par score
    switch_options.sort(key=lambda x: x["total_score"], reverse=True)
    
    best_switch = switch_options[0] if switch_options else None
    
    # Décider si le switch vaut le coup
    should_switch = False
    reason = ""
    
    if best_switch:
        improvement = best_switch["total_score"] - current_matchup_score
        
        if current_matchup_score < -50:
            should_switch = True
            reason = f"Matchup très défavorable ({current_matchup_score}), switch recommandé"
        elif improvement > 30:
            should_switch = True
            reason = f"{best_switch['name']} a un bien meilleur matchup (+{round(improvement)})"
        elif active_pokemon.get("current_hp", 100) < 30:
            should_switch = True
            reason = "HP critiques, préservez votre Pokémon"
        else:
            reason = "Le Pokémon actuel peut rester"
    
    return {
        "current_pokemon": active_pokemon.get("name", "Unknown"),
        "current_matchup_score": round(current_matchup_score, 1),
        "should_switch": should_switch,
        "reason": reason,
        "best_switch": best_switch["name"] if best_switch else None,
        "switch_options": switch_options
    }


def _evaluate_matchup(my_types: List[str], opponent_types: List[str]) -> float:
    """Évalue un matchup de types (positif = avantageux)"""
    score = 50  # Neutre
    
    # Mon avantage offensif
    for my_type in my_types:
        for opp_type in opponent_types:
            if my_type in TYPE_CHART and opp_type in TYPE_CHART.get(my_type, {}):
                mult = TYPE_CHART[my_type].get(opp_type, 1)
                if mult > 1:
                    score += 30
                elif mult < 1:
                    score -= 15
                elif mult == 0:
                    pass  # Immunité offensive
    
    # Désavantage défensif
    for opp_type in opponent_types:
        for my_type in my_types:
            if my_type in TYPE_WEAKNESSES and opp_type in TYPE_WEAKNESSES[my_type]:
                score -= 40  # Je suis faible
    
    return score


def _generate_switch_reasoning(matchup_score: float, resistance_bonus: float, opponent: Dict) -> str:
    """Génère une explication du switch"""
    opp_name = opponent.get("name", "l'adversaire")
    
    if matchup_score > 80:
        return f"Excellent matchup contre {opp_name}"
    elif matchup_score > 50:
        return f"Bon matchup contre {opp_name}"
    elif resistance_bonus > 30:
        return f"Résiste bien aux attaques de {opp_name}"
    elif matchup_score < 30:
        return f"Matchup défavorable contre {opp_name}"
    else:
        return "Matchup neutre"


# =============================================================================
# 📦 EXPORT DE TOUS LES TOOLS
# =============================================================================

BATTLE_ENGINE_TOOLS = [
    damage_calculator_tool,
    speed_comparator_tool,
    stat_modifier_tool,
    status_effect_tool,
    move_evaluator_tool,
    switch_strategy_tool
]

__all__ = [
    "damage_calculator_tool",
    "speed_comparator_tool",
    "stat_modifier_tool",
    "status_effect_tool",
    "move_evaluator_tool",
    "switch_strategy_tool",
    "BATTLE_ENGINE_TOOLS",
    "STATUS_EFFECTS"
]
