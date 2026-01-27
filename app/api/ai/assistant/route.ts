import { NextRequest, NextResponse } from 'next/server';
import { getAssistantResponse, isMistralConfigured, type MistralMessage } from '@/lib/mistralAI';

export async function POST(req: NextRequest) {
  try {
    if (!isMistralConfigured()) {
      return NextResponse.json(
        { error: 'IA non configurée. Ajoutez MISTRAL_API_KEY dans .env.local' },
        { status: 503 }
      );
    }
    
    const body = await req.json();
    const { message, history } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message invalide' },
        { status: 400 }
      );
    }
    
    const conversationHistory: MistralMessage[] = Array.isArray(history) ? history : [];
    
    const response = await getAssistantResponse(message, conversationHistory);
    
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Assistant AI error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de la réponse' },
      { status: 500 }
    );
  }
}
