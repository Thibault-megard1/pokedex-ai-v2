import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

// Public endpoint to get current site theme settings
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
