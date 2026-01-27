import { NextRequest, NextResponse } from 'next/server';
import { callLLM, type LLMMessage, type LLMError } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message invalide' },
        { status: 400 }
      );
    }
    
    // Build conversation history
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'Tu es un assistant Pokémon expert. Tu aides les dresseurs avec des conseils, informations et analyses sur les Pokémon. Réponds en français de manière claire et amicale.'
      }
    ];
    
    // Add conversation history
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    
    // Add current message
    messages.push({ role: 'user', content: message });
    
    // Call unified LLM
    const llmResponse = await callLLM({
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return NextResponse.json({ 
      response: llmResponse.content,
      metadata: {
        provider: llmResponse.provider,
        model: llmResponse.model,
        response_time_ms: llmResponse.response_time_ms,
      }
    });
    
  } catch (error: any) {
    console.error('[Assistant] Error:', error);
    
    // Handle LLM errors gracefully
    if (error.code && error.provider) {
      const llmError = error as LLMError;
      return NextResponse.json(
        { 
          error: llmError.message_fr,
          code: llmError.code,
          provider: llmError.provider 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération de la réponse' },
      { status: 500 }
    );
  }
}
