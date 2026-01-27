import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestion, isMistralConfigured } from '@/lib/mistralAI';

export async function POST(req: NextRequest) {
  try {
    if (!isMistralConfigured()) {
      return NextResponse.json(
        { error: 'IA non configurée. Ajoutez MISTRAL_API_KEY dans .env.local' },
        { status: 503 }
      );
    }
    
    const body = await req.json();
    const { difficulty, previousAnswers } = body;
    
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Difficulté invalide. Utilisez: easy, medium, hard' },
        { status: 400 }
      );
    }
    
    const question = await generateQuizQuestion(
      difficulty as 'easy' | 'medium' | 'hard',
      previousAnswers || []
    );
    
    return NextResponse.json(question);
  } catch (error: any) {
    console.error('Quiz AI error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de la question' },
      { status: 500 }
    );
  }
}
