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

// Load config functions
function loadConfig(): AssistantConfig {
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

function loadPatches(): KnowledgePatches {
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

    // Load admin configuration
    const config = loadConfig();
    const patches = loadPatches();

    // Check for knowledge patches first
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

    // Detect user intent
    const userIntent = detectIntent(message, config);

    // Build conversation history with enhanced system prompt
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
    
    // Call unified LLM
    const llmResponse = await callLLM({
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Validate and clean response
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
