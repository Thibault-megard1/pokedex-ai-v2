/**
 * API Route: /api/pokedex-metadata
 * Returns all generation/version metadata for the Pokédex selector
 */

import { NextResponse } from "next/server";
import { getAllMetadata } from "@/lib/pokedexMetadata.server";

export async function GET() {
  try {
    const metadata = await getAllMetadata();
    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error fetching Pokédex metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
