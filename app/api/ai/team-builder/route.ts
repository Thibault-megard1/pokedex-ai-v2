import { NextRequest, NextResponse } from 'next/server';
import { getTeamSuggestions, isMistralConfigured } from '@/lib/mistralAI';

export async function POST(req: NextRequest) {
  try {
    if (!isMistralConfigured()) {
      return NextResponse.json(
        { error: 'IA non configurée. Ajoutez MISTRAL_API_KEY dans .env.local' },
        { status: 503 }
      );
    }
    
    const body = await req.json();
    const { currentTeam, evolutionPoints } = body;
    
    if (!Array.isArray(currentTeam)) {
      return NextResponse.json(
        { error: 'currentTeam doit être un tableau' },
        { status: 400 }
      );
    }
    
    if (currentTeam.length >= 6) {
      return NextResponse.json(
        { error: 'L\'équipe est déjà complète' },
        { status: 400 }
      );
    }
    
    const suggestions = await getTeamSuggestions(currentTeam, evolutionPoints || 0);
    
    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error('Team builder AI error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération des suggestions' },
      { status: 500 }
    );
  }
}
