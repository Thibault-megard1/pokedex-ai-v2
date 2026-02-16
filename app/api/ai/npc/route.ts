/**
 * Route API IA - Dialogue NPC
 * IA: LLM local via Ollama pour generer des reponses de PNJ.
 * Donnees envoyees: nom du PNJ, contexte, message joueur, historique.
 * Sortie attendue: texte court en personnage.
 * Liens cours IA: prompt engineering, local vs cloud, REST API.
 * Limites: depend de la disponibilite d'Ollama, fallback statique.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

/**
 * POST /api/ai/npc
 * Entree: { npcName, context, playerMessage, conversationHistory }
 * Processus: build prompt -> appel Ollama -> fallback si echec.
 * Sortie: { dialogue, source }
 * Cette fonction utilise de l'IA (LLM local).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { npcName, context, playerMessage, conversationHistory } = await request.json();

    // Construction du prompt pour le LLM local
    const systemPrompt = `${context}\n\nYou are ${npcName} in a Pokémon game. Respond in character with 1-3 short sentences. Keep responses friendly and game-appropriate.`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: playerMessage || 'Hello!' },
    ];

    console.log('[NPC AI] Requesting dialogue from Ollama...');

    try {
      // Try Ollama first
      const ollamaResponse = await fetch(`${OLLAMA_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama2', // or 'mistral', 'neural-chat', etc.
          messages: messages,
          stream: false,
          options: {
            temperature: 0.8,
            max_tokens: 150,
          },
        }),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        const response = data.message?.content || data.response;
        
        console.log('[NPC AI] Ollama response received');
        return NextResponse.json({
          dialogue: response,
          source: 'ollama',
        });
      } else {
        console.warn('[NPC AI] Ollama returned error:', ollamaResponse.status);
      }
    } catch (ollamaError) {
      console.warn('[NPC AI] Ollama unavailable:', ollamaError);
    }

    // Fallback rule-based si l'IA est indisponible
    console.log('[NPC AI] Using fallback dialogue');
    const fallbackDialogues: Record<string, string[]> = {
      'Professor Oak': [
        "Bienvenue dans le monde des Pokémon ! Es-tu prêt à commencer ton aventure ?",
        "Le lien entre un dresseur et ses Pokémon est ce qui compte vraiment.",
        "Je mène des recherches sur l'évolution des Pokémon. Ton voyage m'aidera énormément !",
      ],
      'Youngster Joey': [
        "Mon Rattata fait partie du top 1% des Rattata !",
        "Tu veux te battre ? Je me suis beaucoup entraîné !",
        "As-tu attrapé des Pokémon cool récemment ?",
      ],
      default: [
        "Salut ! Belle journée, n'est-ce pas ?",
        "Le monde des Pokémon est rempli de merveilles !",
        "Bonne chance dans ton aventure, dresseur !",
      ],
    };

    const dialogues = fallbackDialogues[npcName] || fallbackDialogues.default;
    const randomDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];

    return NextResponse.json({
      dialogue: randomDialogue,
      source: 'fallback',
    });
  } catch (error) {
    console.error('[NPC AI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate dialogue', dialogue: 'Hello, trainer!' },
      { status: 500 }
    );
  }
}
