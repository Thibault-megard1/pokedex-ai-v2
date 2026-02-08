import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

/**
 * Admin-only API endpoint to provide battle calculation details
 * This is READ-ONLY and for inspection purposes only
 */
export async function POST(request: NextRequest) {
  // Check admin authorization
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { attacker, defender, move } = body;

    // Calculate detailed breakdown for admin view
    const attackStat = move.damageClass === "physical" 
      ? attacker.currentStats.attack 
      : attacker.currentStats.specialAttack;

    const defenseStat = move.damageClass === "physical"
      ? defender.currentStats.defense
      : defender.currentStats.specialDefense;

    const level = 50; // Default level
    const power = move.power;

    // Base damage calculation
    const baseDamage = Math.floor(
      (((2 * level / 5 + 2) * power * (attackStat / defenseStat)) / 50) + 2
    );

    // Type effectiveness (simplified)
    const effectiveness = 1; // Would use type chart in full implementation

    // STAB bonus
    const hasStab = attacker.types.includes(move.type);
    const stabMultiplier = hasStab ? 1.5 : 1;

    // Random factor range
    const randomMin = 0.85;
    const randomMax = 1.0;

    // Critical hit chance
    const critChance = 0.05; // 5%
    const critMultiplier = 1.5;

    // Final damage range
    const minDamage = Math.floor(baseDamage * effectiveness * stabMultiplier * randomMin);
    const maxDamage = Math.floor(baseDamage * effectiveness * stabMultiplier * randomMax);
    const maxCritDamage = Math.floor(maxDamage * critMultiplier);

    return NextResponse.json({
      formula: {
        base: "((2 * Level / 5 + 2) * Power * (Attack / Defense) / 50) + 2",
        components: {
          level,
          power,
          attackStat,
          defenseStat,
          baseDamage
        }
      },
      modifiers: {
        effectiveness,
        stab: {
          hasStab,
          multiplier: stabMultiplier
        },
        random: {
          min: randomMin,
          max: randomMax
        },
        critical: {
          chance: `${critChance * 100}%`,
          multiplier: critMultiplier
        }
      },
      damageRange: {
        min: minDamage,
        max: maxDamage,
        maxWithCrit: maxCritDamage
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to calculate battle debug info", details: error.message },
      { status: 500 }
    );
  }
}
