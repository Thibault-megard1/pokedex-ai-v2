import { NextRequest, NextResponse } from 'next/server';
import { callLLM, type LLMMessage, type LLMError } from '@/lib/llm';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  DEFAULT_CONFIG,
  type AssistantConfig,
  type KnowledgePatches,
  detectIntent,
  findMatchingPatch,
  validateAndCleanResponse,
  buildSystemPrompt,
} from '@/lib/assistantAdmin';

/**
 * Route API IA - Assistant Pokédex
 * Pourquoi l'IA: fournir des reponses conversationnelles et contextualisees.
 * Approche: LLM (Ollama local ou Mistral cloud) avec prompt systeme structure.
 * Donnees envoyees: message utilisateur + historique + config admin.
 * Sortie attendue: texte clair pour l'utilisateur (pas de JSON).
 * Limites: reponse probabiliste, dependante du modele et du prompt.
 */

// Chargement de la configuration admin de l'assistant
// Cette fonction n'utilise pas d'intelligence artificielle.
function loadConfig(): AssistantConfig {
  // Entree: rien. Sortie: config JSON (fichier) ou config par defaut.
  // Processus: lit un fichier local de config admin si disponible.
  try {
    const configPath = join(process.cwd(), 'data', 'admin', 'assistant-config.json');
    if (existsSync(configPath)) {
      const data = readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading assistant config:', error);
  }
  return DEFAULT_CONFIG;
}

// Chargement des "patchs" de connaissance admin
// Cette fonction n'utilise pas d'intelligence artificielle.
function loadPatches(): KnowledgePatches {
  // Entree: rien. Sortie: liste de correctifs (knowledge patches).
  // Processus: lit un fichier JSON local, ou retourne une liste vide.
  try {
    const patchesPath = join(process.cwd(), 'data', 'admin', 'assistant-patches.json');
    if (existsSync(patchesPath)) {
      const data = readFileSync(patchesPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading patches:', error);
  }
  return { patches: [] };
}

/**
 * POST /api/ai/assistant
 * Entree: { message, history }
 * Processus: detection d'intention, construction du prompt, appel LLM, nettoyage.
 * Sortie: { response, metadata }
 * IA: LLM (Ollama/Mistral) pour generer une reponse conversationnelle.
 * Donnees envoyees au modele: system prompt + historique + message utilisateur.
 * Liens cours IA: prompt engineering, sortie controlee, REST API.
 */
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

    // Charge config admin et correctifs de connaissance (pas d'IA)
    const config = loadConfig();
    const patches = loadPatches();

    // Applique un patch si une correction est definie (logique rule-based)
    const matchingPatch = findMatchingPatch(message, patches);
    if (matchingPatch && matchingPatch.behavior === 'replace') {
      // Return patched answer immediately
      return NextResponse.json({
        response: matchingPatch.correctedAnswer,
        metadata: {
          provider: 'patch',
          model: 'knowledge-patch',
          patched: true,
          patchId: matchingPatch.id,
        },
      });
    }

    // Detection d'intention (heuristique, pas d'IA generative)
    const userIntent = detectIntent(message, config);

    // Construction du prompt systeme et de l'historique conversationnel
    const systemPrompt = buildSystemPrompt(config, userIntent);
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
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
    
    // Appel du LLM (IA generative)
    const llmResponse = await callLLM({
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Validation/cleaning pour limiter les reponses hors-sujet
    let finalResponse = llmResponse.content;
    if (config.responseValidator.enabled) {
      finalResponse = validateAndCleanResponse(finalResponse, userIntent, config);
    }
    
    return NextResponse.json({ 
      response: finalResponse,
      metadata: {
        provider: llmResponse.provider,
        model: llmResponse.model,
        response_time_ms: llmResponse.response_time_ms,
        intent: userIntent,
        validated: config.responseValidator.enabled,
      }
    });
    
  } catch (error: any) {
    console.error('[Assistant] Error:', error);
    
    // Gestion des erreurs LLM (degrade proprement)
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
