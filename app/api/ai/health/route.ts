/**
 * GET /api/ai/health
 * Check status of configured AI provider
 */

import { NextResponse } from "next/server";
import { checkLLMHealth, getProviderConfig } from "@/lib/llm";

export async function GET() {
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
