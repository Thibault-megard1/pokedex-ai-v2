import { NextRequest, NextResponse } from 'next/server';
import { callLLM, type LLMMessage, type LLMError } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
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
    
    // Build prompt for team suggestions
    const teamDescription = currentTeam.map((p: any) => 
      `${p.name} (${p.types?.join('/')}) - Stats: HP ${p.hp}, Atk ${p.attack}, Def ${p.defense}`
    ).join('\n');
    
    const prompt = `Tu es un expert en stratégie Pokémon. Analyse cette équipe et suggère 3 Pokémon pour la compléter.

ÉQUIPE ACTUELLE:
${teamDescription}

Points d'évolution disponibles: ${evolutionPoints || 0}

Analyse:
1. Les faiblesses de type non couvertes
2. Le manque de rôles (attaquant, défenseur, support)
3. La synergie possible

Retourne un JSON avec:
{
  "suggestions": [
    {
      "name": "nom du pokemon",
      "reason": "raison en français",
      "priority": "high|medium|low"
    }
  ],
  "analysis": "analyse générale de l'équipe en français"
}`;

    const messages: LLMMessage[] = [
      { role: 'system', content: 'Tu es un stratège Pokémon expert. Réponds uniquement en JSON valide.' },
      { role: 'user', content: prompt }
    ];
    
    const llmResponse = await callLLM({
      messages,
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });
    
    const suggestions = JSON.parse(llmResponse.content);
    
    return NextResponse.json({
      ...suggestions,
      metadata: {
        provider: llmResponse.provider,
        model: llmResponse.model
      }
    });
    
  } catch (error: any) {
    console.error('[Team Builder] Error:', error);
    
    if (error.code && error.provider) {
      const llmError = error as LLMError;
      return NextResponse.json(
        { error: llmError.message_fr },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la génération des suggestions' },
      { status: 500 }
    );
  }
}
