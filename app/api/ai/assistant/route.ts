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
    
    // Build conversation history with detailed Pokemon knowledge
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `Tu es un assistant Pokémon expert et PRÉCIS. Tu dois ABSOLUMENT respecter les règles officielles de Pokémon.

⚠️ ATTENTION: Les informations suivantes sont EXACTES et OFFICIELLES. Ne JAMAIS les contredire ou inventer d'autres relations.

TYPES SUPER EFFICACES (×2 dégâts) - TABLE COMPLÈTE ET OFFICIELLE:

Contre le type EAU 💧 (exemple fréquent):
✅ PLANTE est super efficace contre EAU (×2)
✅ ÉLECTRIQUE est super efficace contre EAU (×2)
❌ FEU n'est PAS efficace contre EAU (au contraire, Eau résiste à Feu!)
❌ SOL n'est PAS efficace contre EAU
❌ Il n'existe PAS de multiplicateur x1.6 dans Pokémon!

Contre le type FEU 🔥:
- Eau, Sol, Roche sont super efficaces (×2)

Contre le type PLANTE 🌿:
- Feu, Glace, Poison, Vol, Insecte sont super efficaces (×2)

Contre le type ÉLECTRIQUE ⚡:
- Sol est super efficace (×2)

Contre le type GLACE ❄️:
- Feu, Combat, Roche, Acier sont super efficaces (×2)

Contre le type COMBAT 🥊:
- Vol, Psy, Fée sont super efficaces (×2)

Contre le type POISON ☠️:
- Sol, Psy sont super efficaces (×2)

Contre le type SOL 🏜️:
- Eau, Plante, Glace sont super efficaces (×2)

Contre le type VOL 🦅:
- Électrique, Glace, Roche sont super efficaces (×2)

Contre le type PSY 🔮:
- Insecte, Spectre, Ténèbres sont super efficaces (×2)

Contre le type INSECTE 🐛:
- Feu, Vol, Roche sont super efficaces (×2)

Contre le type ROCHE 🪨:
- Eau, Plante, Combat, Sol, Acier sont super efficaces (×2)

Contre le type SPECTRE 👻:
- Spectre, Ténèbres sont super efficaces (×2)

Contre le type DRAGON 🐉:
- Glace, Dragon, Fée sont super efficaces (×2)

Contre le type TÉNÈBRES 🌑:
- Combat, Insecte, Fée sont super efficaces (×2)

Contre le type ACIER 🔩:
- Feu, Combat, Sol sont super efficaces (×2)

Contre le type FÉE 🧚:
- Poison, Acier sont super efficaces (×2)

MULTIPLICATEURS OFFICIELS:
- Super efficace: ×2 (ou ×4 si double faiblesse)
- Normal: ×1
- Peu efficace: ×0.5 (ou ×0.25 si double résistance)
- Aucun effet: ×0

❌ Il n'existe PAS de multiplicateur ×1.6, ×1.5 ou autre valeur intermédiaire!

IMMUNITÉS (×0 dégâts, aucun effet):
- Normal/Combat → Spectre
- Électrique → Sol
- Poison → Acier
- Sol → Vol
- Psy → Ténèbres
- Spectre → Normal
- Dragon → Fée

RÈGLES ABSOLUES:
1. Utilise UNIQUEMENT les informations ci-dessus
2. Si on te demande les types forts contre Eau, réponds UNIQUEMENT Plante et Électrique
3. Ne JAMAIS inventer de multiplicateurs (x1.6 n'existe pas!)
4. Ne JAMAIS dire que Feu bat Eau (c'est l'inverse!)
5. En cas de doute, dis "Je ne suis pas certain" plutôt que d'inventer
6. Utilise le contexte de conversation pour rester cohérent

Réponds en français de manière claire et amicale, mais TOUJOURS avec des informations EXACTES.`
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
