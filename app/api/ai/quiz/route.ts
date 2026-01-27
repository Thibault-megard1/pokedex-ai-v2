import { NextRequest, NextResponse } from 'next/server';
import { callLLM, type LLMMessage, type LLMError } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { difficulty, previousAnswers } = body;
    
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Difficulté invalide. Utilisez: easy, medium, hard' },
        { status: 400 }
      );
    }
    
    // Generate quiz question using LLM
    const difficultyText: Record<string, string> = {
      easy: 'facile - pour débutants',
      medium: 'moyenne - pour connaisseurs',
      hard: 'difficile - pour experts'
    };
    
    const prompt = `Génère une question de quiz Pokémon de difficulté ${difficultyText[difficulty]}.

${previousAnswers && previousAnswers.length > 0 ? `Questions déjà posées: ${previousAnswers.join(', ')}` : ''}

Retourne un JSON avec:
{
  "question": "la question en français",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "l'option correcte",
  "explanation": "explication de la réponse en français"
}`;

    const messages: LLMMessage[] = [
      { role: 'system', content: 'Tu es un expert Pokémon. Génère des questions de quiz intéressantes. Réponds uniquement en JSON valide.' },
      { role: 'user', content: prompt }
    ];
    
    const llmResponse = await callLLM({
      messages,
      temperature: 0.8,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });
    
    const question = JSON.parse(llmResponse.content);
    
    return NextResponse.json({
      ...question,
      metadata: {
        provider: llmResponse.provider,
        model: llmResponse.model
      }
    });
    
  } catch (error: any) {
    console.error('[Quiz Generator] Error:', error);
    
    if (error.code && error.provider) {
      const llmError = error as LLMError;
      return NextResponse.json(
        { error: llmError.message_fr },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la question' },
      { status: 500 }
    );
  }
}
