/**
 * GET /api/ai/health
 * Verifie l'etat du fournisseur IA configure.
 * Cette fonction utilise une verification technique, pas un LLM.
 * Liens cours IA: monitoring d'un service IA, REST API.
 */

import { NextResponse } from "next/server";
import { checkLLMHealth, getProviderConfig } from "@/lib/llm";

export async function GET() {
  // Entree: aucune. Sortie: status du provider IA.
  // Cette fonction n'utilise pas d'intelligence artificielle.
  try {
    const config = getProviderConfig();
    const health = await checkLLMHealth();

    return NextResponse.json({
      success: true,
      provider: config.provider,
      status: health,
    });
  } catch (error: any) {
    console.error("[AI Health Check] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Health check failed",
        error_fr: "Échec du contrôle de santé",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
