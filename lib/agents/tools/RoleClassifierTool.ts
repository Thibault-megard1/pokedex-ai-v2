/**
 * ============================================================================
 * ROLE CLASSIFIER TOOL - Tool de classification des rôles stratégiques
 * ============================================================================
 * 
 * OBJECTIF:
 * Ce tool classifie les Pokémon dans des RÔLES STRATÉGIQUES précis.
 * Une équipe équilibrée doit avoir une DISTRIBUTION variée de rôles.
 * 
 * Contrairement au StatsAnalyzerTool qui classifie basé sur les stats brutes,
 * ce tool se concentre sur la FONCTION STRATÉGIQUE dans une équipe compétitive.
 * 
 * ============================================================================
 * LES 8 RÔLES STRATÉGIQUES
 * ============================================================================
 * 
 * 1. **LEAD** (Meneur / Starter) 🎯
 *    - Rôle: Premier Pokémon envoyé en combat
 *    - Mission:
 *      * Poser les entry hazards (Stealth Rock, Spikes)
 *      * Momentum control (Taunt, Thunder Wave)
 *      * Suicide lead (explosion après setup)
 *    - Caractéristiques:
 *      * Speed moyen-élevé (pour agir avant adversaire)
 *      * Accès à Stealth Rock ou Taunt
 *      * Souvent sacrifiable
 *    - Exemples:
 *      * Azelf: 115 Speed, Stealth Rock, Explosion
 *      * Landorus-T: Stealth Rock, U-turn (momentum)
 *      * Tapu Koko: Taunt, Electric Terrain setter
 * 
 * 2. **SWEEPER** (Balayeur) ⚔️
 *    - Rôle: Attaquant principal qui KO plusieurs Pokémon
 *    - Mission:
 *      * Setup (+2 Atk/SpA avec Swords Dance/Nasty Plot)
 *      * Balayer l'équipe adverse une fois setup
 *    - Caractéristiques:
 *      * Attaque élevée (> 110)
 *      * Speed élevée (> 90)
 *      * Accès à setup moves
 *    - Types:
 *      * **Physical Sweeper**: Garchocho, Excadrill, Mega Lucario
 *      * **Special Sweeper**: Alakazam, Volcarona, Tapu Lele
 *      * **Mixed Sweeper**: Salamence, Infernape
 *    - Stratégie:
 *      1. Switch in sur un matchup favorable
 *      2. Setup (Swords Dance, Dragon Dance, Quiver Dance)
 *      3. Sweep (KO 2-3+ Pokémon)
 * 
 * 3. **WALLBREAKER** (Brise-Mur) 🔨
 *    - Rôle: Détruire les walls/tanks adverses
 *    - Mission:
 *      * Infliger dégâts massifs aux défenseurs
 *      * Ouvrir la voie pour les sweepers
 *      * 2HKO ou OHKO les walls
 *    - Caractéristiques:
 *      * Attaque EXTRÊME (> 130)
 *      * Speed moyenne (pas prioritaire)
 *      * Grande force brute
 *    - Items typiques:
 *      * Choice Band (physique ×1.5)
 *      * Choice Specs (spécial ×1.5)
 *      * Life Orb (×1.3 avec fléxibilité)
 *    - Exemples:
 *      * Hoopa-Unbound: 160 Atk, 170 SpA (wallbreaker ultime!)
 *      * Mega Mawile: 105 Atk → Huge Power = 210 effective
 *      * Kyurem-Black: 170 Atk (nukes tout)
 * 
 * 4. **TANK** (Mur Défensif) 🛡️
 *    - Rôle: Encaisser les coups, heal, staller
 *    - Mission:
 *      * Absorber les attaques
 *      * Infliger status (Toxic, Burn)
 *      * Heal avec Recover/Roost
 *      * Poser entry hazards
 *    - Caractéristiques:
 *      * HP + Défenses élevées
 *      * Vitesse basse (pas grave)
 *      * Accès à recovery moves
 *    - Types:
 *      * **Physical Wall**: Skarmory, Hippowdon, Ferrothorn
 *      * **Special Wall**: Blissey, Chansey, Toxapex
 *      * **Mixed Wall**: Cresselia, Celesteela, Umbreon
 *    - Moves clés:
 *      * Recover/Roost (heal)
 *      * Toxic (poison lent)
 *      * Protect (stall)
 *      * Hazards (Stealth Rock, Spikes)
 * 
 * 5. **SUPPORT** (Soutien) ✨
 *    - Rôle: Aider toute l'équipe (utility)
 *    - Mission:
 *      * Heal allies (Wish, Heal Bell)
 *      * Setup Screens (Light Screen, Reflect)
 *      * Entry hazards (Stealth Rock, Spikes, Toxic Spikes)
 *      * Speed control (Thunder Wave, Tailwind)
 *      * Redirect (Follow Me, Rage Powder in Doubles)
 *    - Caractéristiques:
 *      * Stats variables (pas de pattern fixe)
 *      * Large movepool utility
 *      * Défensivement solid (pour survivre)
 *    - Exemples:
 *      * Clefable: Wish + Heal Bell + Stealth Rock
 *      * Ferrothorn: Spikes + Leech Seed + Knock Off
 *      * Amoonguss: Spore + Regenerator (heal passif)
 *      * Tapu Fini: Defog + Nature's Madness + Taunt
 * 
 * 6. **PIVOT** (Tournant) 🔄
 *    - Rôle: Maintenir le MOMENTUM (contrôle du rythme)
 *    - Mission:
 *      * Switch in safe (bons matchups)
 *      * Attaquer puis switch out (U-turn, Volt Switch)
 *      * Scouter les moves adverses
 *      * Bring in un teammate favorable
 *    - Caractéristiques:
 *      * Vitesse élevée (pour U-turn avant adversaire)
 *      * Bulk décent (pour switch in safe)
 *      * Accès à pivot moves
 *    - Moves de pivot:
 *      * U-turn (Insecte)
 *      * Volt Switch (Électrique)
 *      * Flip Turn (Eau)
 *      * Parting Shot (debuff puis switch)
 *    - Exemples:
 *      * Landorus-T: U-turn + Intimidate
 *      * Rotom-Wash: Volt Switch + Will-O-Wisp
 *      * Tornadus-T: U-turn + Defiant
 *      * Barraskewda: Flip Turn + Swift Swim
 * 
 * 7. **REVENGE KILLER** (Finisseur) ⚡
 *    - Rôle: Finir les Pokémon affaiblis
 *    - Mission:
 *      * Outspeed ET KO les menaces
 *      * Clean-up en late game
 *      * Utiliser priority moves pour bypass speed
 *    - Caractéristiques:
 *      * Speed EXTRÊME (> 115) OU priority moves
 *      * Attaque décente (pas besoin d'être énorme)
 *      * Souvent porte Choice Scarf
 *    - Priority Moves:
 *      * Aqua Jet, Mach Punch (+1)
 *      * Bullet Punch, Ice Shard (+1)
 *      * Extreme Speed (+2)
 *      * Sucker Punch (+1, mais conditionnel)
 *    - Exemples:
 *      * Weavile: 125 Speed + Ice Shard
 *      * Dragapult: 142 Speed (outspeed tout)
 *      * Mega Lucario: Extreme Speed + Adaptability
 *      * Choice Scarf Landorus: 101 Speed × 1.5 = 151
 * 
 * 8. **BALANCED** (Polyvalent) ⚖️
 *    - Rôle: Pokémon sans rôle spécialisé clair
 *    - Caractéristiques:
 *      * Stats équilibrées (rien d'exceptionnel)
 *      * Peut remplir plusieurs rôles moyennement
 *      * Flexibilité mais manque d'excellence
 *    - Exemples: Mew, Celebi (stats all 100)
 *    - Note: Généralement moins optimal en compétitif haut niveau
 * 
 * ============================================================================
 * RÔLES ESSENTIELS DANS UNE ÉQUIPE
 * ============================================================================
 * 
 * Une équipe COMPÈTE doit avoir AU MINIMUM:
 * 1. **Au moins 1 SWEEPER** (win condition)
 * 2. **Au moins 1 TANK** (pour absorber les coups)
 * 3. **Au moins 1 SUPPORT** (utilité, hazards)
 * 
 * ÉQUIPE IDÉALE (6 Pokémon):
 * - 1 Lead (setup hazards)
 * - 2 Sweepers (physical + special pour balance)
 * - 1 Wallbreaker (casser les walls adverses)
 * - 1 Tank/Wall (absorber les coups)
 * - 1 Pivot (momentum control)
 * 
 * ANTI-PATTERNS À ÉVITER:
 * - Trop de sweepers (4+): vulnérable au revenge killing
 * - Trop de tanks (3+): manque de killing power
 * - Aucun sweeper: impossible de finir le match
 * - Aucun tank: team trop fragile ("hyper offense")
 * 
 * ============================================================================
 * ALGORITHME DE CLASSIFICATION
 * ============================================================================
 * 
 * Le tool classe un Pokémon en:
 * 1. Analysant ses stats (via StatsAnalyzerTool)
 * 2. Mappant le rôle de base vers un rôle stratégique
 * 3. Considérant les speed tiers
 * 
 * Exemples de mapping:
 * - baseRole = "sweeper" + speedTier = "ultra-fast" → "revenge-killer"
 * - baseRole = "tank" + bulk = "wall" → "tank"
 * - baseRole = "pivot" + speedTier = "fast" → "pivot"
 * 
 * ============================================================================
 * SCORING D'UN CANDIDAT
 * ============================================================================
 * 
 * BONUS MASSIFS:
 * - +80 points: Ajoute un rôle MANQUANT essentiel (sweeper/tank/support)
 * - +50 points: Ajoute un rôle nouveau (plus de diversité)
 * - +30 points: Pokémon polyvalent (peut remplir 2+ rôles)
 * 
 * PÉNALITÉS:
 * - -20 points: Rôle déjà SURCHARGÉ (3+ Pokémon du même rôle)
 * - -10 points: Équipe déjà bien équilibrée (moins de besoin)
 * ============================================================================
 */

import { Pokemon } from "./TypeEffectivenessTool";
import { PokemonRole, StatsAnalyzerTool } from "./StatsAnalyzerTool";

export type StrategicRole = 
  | "lead"          // Pokémon de tête (setup, rocks, etc.)
  | "sweeper"       // Attaquant principal
  | "wallbreaker"   // Brise les murs défensifs
  | "tank"          // Encaisse les coups
  | "support"       // Support/healing
  | "pivot"         // Switch in/out
  | "revenge-killer" // Finisseur rapide
  | "balanced";     // Polyvalent

export interface TeamRoleDistribution {
  roles: Map<StrategicRole, number>; // Rôle -> nombre de Pokémon
  missingRoles: StrategicRole[];
  overloadedRoles: StrategicRole[];
  balanceScore: number; // 0-100
}

export class RoleClassifierTool {
  private statsAnalyzer = new StatsAnalyzerTool();

  /**
   * Rôles essentiels pour une équipe équilibrée
   */
  private readonly ESSENTIAL_ROLES: StrategicRole[] = [
    "sweeper",
    "tank",
    "support"
  ];

  /**
   * Détermine le rôle stratégique d'un Pokémon
   */
  classifyStrategicRole(pokemon: Pokemon): StrategicRole {
    const baseRole = this.statsAnalyzer.classifyPokemonRole(pokemon);

    // Mappage du rôle de base vers le rôle stratégique
    if (baseRole.primary === "sweeper") {
      if (baseRole.speedTier === "ultra-fast") {
        return "revenge-killer";
      }
      return "sweeper";
    }

    if (baseRole.primary === "pivot" && baseRole.speedTier === "fast") {
      return "pivot";
    }

    if (baseRole.primary === "wallbreaker") {
      return "wallbreaker";
    }

    if (baseRole.primary === "tank" || baseRole.bulk === "wall") {
      return "tank";
    }

    if (baseRole.primary === "support") {
      return "support";
    }

    return "balanced";
  }

  /**
   * Analyse la distribution des rôles dans l'équipe
   */
  analyzeRoleDistribution(team: Pokemon[]): TeamRoleDistribution {
    const roles = new Map<StrategicRole, number>();

    // Compter les rôles
    team.forEach(pokemon => {
      const role = this.classifyStrategicRole(pokemon);
      roles.set(role, (roles.get(role) || 0) + 1);
    });

    // Identifier les rôles manquants
    const missingRoles: StrategicRole[] = [];
    this.ESSENTIAL_ROLES.forEach(essentialRole => {
      if (!roles.has(essentialRole) || roles.get(essentialRole) === 0) {
        missingRoles.push(essentialRole);
      }
    });

    // Identifier les rôles surchargés (>2)
    const overloadedRoles: StrategicRole[] = [];
    roles.forEach((count, role) => {
      if (count > 2) {
        overloadedRoles.push(role);
      }
    });

    // Calculer le score d'équilibre
    const balanceScore = this.calculateRoleBalance(roles, team.length);

    return {
      roles,
      missingRoles,
      overloadedRoles,
      balanceScore
    };
  }

  /**
   * Calcule un score d'équilibre des rôles (0-100)
   * ADAPTÉ pour ne pas pénaliser les équipes incomplètes
   */
  private calculateRoleBalance(
    roles: Map<StrategicRole, number>,
    teamSize: number
  ): number {
    // NOUVEAU: Pour petites équipes, base plus élevée
    // (on ne peut pas avoir tous les rôles avec 1-2 Pokémon)
    let score = teamSize <= 2 ? 70 : teamSize <= 4 ? 60 : 50;

    // Comptage des rôles présents
    const presentRoles = this.ESSENTIAL_ROLES.filter(r => roles.has(r) && roles.get(r)! > 0);
    const presentCount = presentRoles.length;

    // Rôles essentiels attendus selon taille
    const expectedRoles = Math.min(teamSize, 3); // Max 3 rôles essentiels

    // +20 si on a TOUS les rôles attendus pour cette taille
    if (presentCount >= expectedRoles) {
      score += 20;
    } else if (presentCount > 0) {
      // Bonus proportionnel aux rôles présents (pas de pénalité)
      score += (presentCount / expectedRoles) * 15;
    }

    // Bonus pour rôles additionnels (pas pénalité si manquants)
    if (roles.has("revenge-killer")) score += 10;
    if (roles.has("pivot")) score += 8;

    // Pénalité seulement pour vraie surcharge (3+ du même rôle)
    roles.forEach(count => {
      if (count >= 3) score -= 10;
    });

    // Bonus diversité pour grandes équipes
    if (teamSize >= 5 && roles.size >= 4) score += 5;

    return Math.min(100, Math.max(40, score)); // Minimum 40
  }

  /**
   * Score un Pokémon candidat basé sur la distribution des rôles
   */
  scorePokemonRoleContribution(
    candidate: Pokemon,
    distribution: TeamRoleDistribution
  ): { score: number; details: string[] } {
    let score = 55; // Base neutre positive
    const details: string[] = [];

    const candidateRole = this.classifyStrategicRole(candidate);

    // +45 si le candidat remplit un rôle essentiel manquant (PRIORITÉ!)
    if (distribution.missingRoles.includes(candidateRole)) {
      score += 45;
      details.push(`🎯 Rôle ESSENTIEL manquant: ${candidateRole}`);
    }

    // +25 si le candidat ajoute de la diversité
    else if (!distribution.roles.has(candidateRole) || distribution.roles.get(candidateRole) === 0) {
      score += 25;
      details.push(`✨ Nouveau rôle: ${candidateRole}`);
    }

    // -15 si le rôle est déjà surchargé (pénalité réduite)
    else if (distribution.overloadedRoles.includes(candidateRole)) {
      score -= 15;
      details.push(`⚠️ Rôle surchargé: ${candidateRole}`);
    }

    // +12 pour les rôles versatiles
    if (candidateRole === "balanced" || candidateRole === "pivot") {
      score += 12;
      details.push(`🔄 Rôle polyvalent`);
    }

    // Bonus spéciaux pour rôles stratégiques
    if (candidateRole === "revenge-killer" && !distribution.roles.has("revenge-killer")) {
      score += 20;
      details.push(`⚡ Finisseur rapide (revenge killer)`);
    }

    if (candidateRole === "wallbreaker" && !distribution.roles.has("wallbreaker")) {
      score += 18;
      details.push(`💥 Brise-mur puissant`);
    }

    return { score: Math.max(30, Math.min(100, Math.round(score))), details };
  }

  /**
   * Recommande les rôles à rechercher
   */
  recommendRoles(distribution: TeamRoleDistribution): string[] {
    const recommendations: string[] = [];

    // Priorité aux rôles essentiels manquants
    distribution.missingRoles.forEach(role => {
      recommendations.push(`Chercher un ${role}`);
    });

    // Si l'équipe est déséquilibrée
    if (distribution.balanceScore < 50) {
      recommendations.push("Diversifier les rôles stratégiques");
    }

    // Si pas de revenge killer
    if (!distribution.roles.has("revenge-killer")) {
      recommendations.push("Ajouter un revenge killer (Pokémon ultra-rapide)");
    }

    // Si trop de même rôle
    distribution.overloadedRoles.forEach(role => {
      recommendations.push(`Réduire le nombre de ${role}`);
    });

    return recommendations;
  }

  /**
   * Génère un rapport détaillé de la distribution
   */
  generateRoleReport(distribution: TeamRoleDistribution): string {
    const report: string[] = [];
    
    report.push("=== DISTRIBUTION DES RÔLES ===");
    distribution.roles.forEach((count, role) => {
      report.push(`${role}: ${count}`);
    });
    
    report.push(`\nScore d'équilibre: ${distribution.balanceScore}/100`);
    
    if (distribution.missingRoles.length > 0) {
      report.push(`\nRôles manquants: ${distribution.missingRoles.join(", ")}`);
    }
    
    if (distribution.overloadedRoles.length > 0) {
      report.push(`\nRôles surchargés: ${distribution.overloadedRoles.join(", ")}`);
    }

    return report.join("\n");
  }
}
