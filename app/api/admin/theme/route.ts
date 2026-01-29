import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings, saveSiteSettings } from "@/lib/siteSettings";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.message?.includes("administrateur") ? 403 : 401 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { settings } = body;
    
    if (!settings || !settings.light || !settings.dark) {
      return NextResponse.json(
        { error: "Format de paramètres invalide" },
        { status: 400 }
      );
    }
    
    await saveSiteSettings(settings);
    
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.message?.includes("administrateur") ? 403 : 401 }
    );
  }
}
