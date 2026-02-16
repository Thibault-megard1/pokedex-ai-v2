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
      // Pallet Town NPCs
      'Townsperson': [
        "Welcome to Pallet Town! It's a quiet, peaceful place.",
        "Professor Oak's lab is just to the north. He's quite famous!",
        "This town may be small, but it has produced some great trainers.",
        "I've lived here all my life. I love the peaceful atmosphere.",
        "Did you know Red started his journey from this very town?",
      ],
      'Nurse Joy': [
        "Welcome to the Pokémon Center! We restore your Pokémon to full health.",
        "Your Pokémon look tired. Shall I heal them for you?",
        "We're here 24/7 to help trainers and their Pokémon!",
        "Taking care of Pokémon is my passion!",
        "A healthy Pokémon is a happy Pokémon!",
      ],
      'Young Trainer': [
        "I just started my journey! Everything is so exciting!",
        "The wild Pokémon are so cool! I caught a Pidgey yesterday!",
        "I can't wait to explore all the different routes!",
        "Have you been to Viridian Forest yet? I heard it's full of Bug Pokémon!",
        "Being a Pokémon trainer is the best thing ever!",
      ],
      'Old Man': [
        "Back in my day, we had to walk everywhere!",
        "Press P to teleport to the lab - what a luxury!",
        "Young trainers these days have it so easy with all this technology.",
        "I've seen many trainers come and go from this town over the years.",
        "The bond between trainer and Pokémon never changes, though.",
      ],

      // Lab NPCs
      'Professor Oak': [
        "Welcome to the world of Pokémon! Are you ready to start your adventure?",
        "The bond between a trainer and their Pokémon is what truly matters.",
        "I'm conducting research on Pokémon evolution. Your journey will help me greatly!",
        "Remember, you can press P to return here anytime you need!",
        "Pokémon are mysterious creatures that live alongside humans.",
        "Your Pokédex will record data on every Pokémon you encounter!",
      ],
      'Lab Assistant': [
        "Professor Oak is the best! I've learned so much working here.",
        "We study Pokémon evolution here. It's fascinating!",
        "Did you know some Pokémon evolve through trading?",
        "The data you collect will help us understand Pokémon better!",
        "This lab has some of the most advanced research equipment!",
      ],

      // Route 1 NPCs
      'Youngster Joey': [
        "My Rattata is in the top percentage of Rattata!",
        "Want to battle? I've been training really hard!",
        "Have you seen any rare Pokémon around here?",
        "I call my Rattata 'Top Percentage' because it's so special!",
        "Route 1 is great for training beginning trainers!",
      ],
      'Bug Catcher Rick': [
        "I love Bug Pokémon! Want to battle?",
        "My Caterpie will evolve soon! I can't wait!",
        "Bug-types are underrated. They're actually quite strong!",
        "Have you caught any Bug Pokémon yet?",
        "Once my Caterpie evolves into Butterfree, I'll be unstoppable!",
      ],
      'Hiker Mark': [
        "I love hiking through these routes!",
        "The fresh air and wild Pokémon make it all worthwhile.",
        "Nothing beats the feeling of exploring the great outdoors!",
        "I've traveled many routes, and each one is unique.",
        "The journey is just as important as the destination!",
      ],

      // Viridian Forest NPCs
      'Bug Catcher Sam': [
        "This forest is full of Bug Pokémon!",
        "Want to battle? My team is strong!",
        "I've been catching Bug Pokémon all day!",
        "Viridian Forest is a Bug Catcher's paradise!",
        "My Weedle knows Poison Sting now!",
      ],
      'Bug Catcher Dan': [
        "My Weedle is going to evolve soon!",
        "Let's battle so it gains experience!",
        "Bug Pokémon may seem weak, but they evolve quickly!",
        "I can't wait for my Weedle to become a Beedrill!",
        "Training in this forest is perfect for Bug-types!",
      ],
      'Lass Emma': [
        "I got lost in this forest...",
        "But at least I'm finding lots of Pokémon!",
        "This forest is so big! Have you seen the exit?",
        "Being lost isn't so bad when you're catching Pokémon!",
        "I should have brought a map... but this is an adventure!",
      ],
      'Picnicker Lisa': [
        "I came here for a picnic, but there are so many trainers!",
        "Do you want to battle?",
        "This forest would be perfect for a lunch break!",
        "I love Pokémon battles almost as much as I love picnics!",
        "After all these battles, I'm getting hungry!",
      ],
      'Bug Catcher Benny': [
        "I've been hiding here waiting for strong trainers!",
        "Let's battle!",
        "Surprise! Bet you didn't expect to find me here!",
        "The best battles come from unexpected encounters!",
        "This is the perfect hiding spot for ambush battles!",
      ],

      // Route 2 NPCs
      'Lass Anna': [
        "I'm training my Pokémon to become stronger!",
        "Want to battle sometime?",
        "Every battle makes me and my Pokémon stronger!",
        "I'm going to be a Pokémon Master one day!",
        "Training is hard work, but it's so rewarding!",
      ],
      'Camper Tom': [
        "I've been camping here for days!",
        "The Pokémon here are really strong.",
        "There's nothing like sleeping under the stars with your Pokémon!",
        "Camping lets you really bond with your team.",
        "I've seen some rare Pokémon around here at night!",
      ],

      // Default fallback for any unlisted NPCs
      default: [
        "Hello! Nice day, isn't it?",
        "The world of Pokémon is full of wonders!",
        "Good luck on your adventure, trainer!",
        "Have you caught any interesting Pokémon lately?",
        "Keep training hard with your Pokémon!",
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
