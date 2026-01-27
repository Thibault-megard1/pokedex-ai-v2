/**
 * Mistral AI Integration for Pokémon features
 * 
 * All AI features use the Mistral API with server-side calls only.
 * API key must be set in .env.local as MISTRAL_API_KEY
 */

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest'; // or 'mistral-medium' for better quality

export interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Mistral AI API
 */
export async function callMistral(
  messages: MistralMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' };
  } = {}
): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY non configurée. Veuillez l\'ajouter dans .env.local');
  }
  
  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
        response_format: options.responseFormat,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Mistral API error: ${errorData.error || response.statusText}`);
    }
    
    const data: MistralResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Aucune réponse de l\'IA');
    }
    
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('Mistral API call failed:', error);
    throw new Error(`Erreur IA: ${error.message}`);
  }
}

/**
 * Parse JSON response from AI
 */
export function parseAIJson<T>(response: string): T {
  try {
    // Remove markdown code blocks if present
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse AI JSON:', response);
    throw new Error('Réponse IA invalide');
  }
}

/**
 * Check if Mistral API is configured
 */
export function isMistralConfigured(): boolean {
  return !!process.env.MISTRAL_API_KEY;
}

/**
 * Get AI-powered team suggestions
 */
export async function getTeamSuggestions(
  currentTeam: { id: number; name: string }[],
  evolutionPoints: number = 0
): Promise<{
  suggestions: {
    id: number;
    name: string;
    role: string;
    reason: string;
  }[];
  notes: string[];
}> {
  const teamDescription = currentTeam.length > 0
    ? currentTeam.map(p => p.name).join(', ')
    : 'aucun Pokémon';
    
  const messages: MistralMessage[] = [
    {
      role: 'system',
      content: `Tu es un expert stratégique Pokémon. Tu dois suggérer des Pokémon pour compléter une équipe de combat compétitif.
      
Règles:
- L'équipe doit avoir 6 Pokémon au total
- Privilégie la couverture de types
- Équilibre les rôles: sweeper, tank, support
- Considère les synergies entre Pokémon
- Réponds UNIQUEMENT en JSON valide, en français

Format de réponse JSON:
{
  "suggestions": [
    {"id": 25, "name": "pikachu", "role": "Sweeper spécial", "reason": "Couverture électrique, vitesse élevée"}
  ],
  "notes": ["Note stratégique 1", "Note stratégique 2"]
}`,
    },
    {
      role: 'user',
      content: `Équipe actuelle (${currentTeam.length}/6): ${teamDescription}
      
Points d'évolution disponibles: ${evolutionPoints}

Suggère des Pokémon pour compléter cette équipe à 6. Fournis ${6 - currentTeam.length} suggestions.`,
    },
  ];
  
  const response = await callMistral(messages, {
    temperature: 0.8,
    maxTokens: 1500,
    responseFormat: { type: 'json_object' },
  });
  
  return parseAIJson(response);
}

/**
 * Generate battle commentary
 */
export async function getBattleCommentary(
  turn: number,
  event: string,
  context: {
    attacker?: string;
    defender?: string;
    move?: string;
    damage?: number;
    ko?: boolean;
  }
): Promise<string> {
  const messages: MistralMessage[] = [
    {
      role: 'system',
      content: `Tu es un commentateur Pokémon enthousiaste. Fournis un commentaire court (1-2 phrases max) en français sur l'action en cours.
      
Style: Dynamique, passionné, informatif.
Longueur: Maximum 150 caractères.`,
    },
    {
      role: 'user',
      content: `Tour ${turn}: ${event}
      
${context.attacker ? `Attaquant: ${context.attacker}` : ''}
${context.defender ? `Défenseur: ${context.defender}` : ''}
${context.move ? `Capacité: ${context.move}` : ''}
${context.damage ? `Dégâts: ${context.damage}` : ''}
${context.ko ? 'KO!' : ''}`,
    },
  ];
  
  const response = await callMistral(messages, {
    temperature: 0.9,
    maxTokens: 100,
  });
  
  return response.trim();
}

/**
 * Pokédex assistant chat
 */
export async function getAssistantResponse(
  userMessage: string,
  conversationHistory: MistralMessage[] = []
): Promise<string> {
  const messages: MistralMessage[] = [
    {
      role: 'system',
      content: `Tu es un assistant Pokédex expert. Tu aides les utilisateurs avec des questions sur les Pokémon, les types, les stratégies, et la navigation dans l'application.
      
Connaissance:
- Tous les Pokémon et leurs caractéristiques
- Tableaux des types et efficacités
- Stratégies de combat compétitif
- Fonctionnalités de l'application Pokédex AI Pro

Règles:
- Réponds en français
- Sois concis mais informatif
- Si tu ne connais pas une info spécifique, suggère où la trouver dans l'app
- Ne réponds PAS aux questions non liées aux Pokémon`,
    },
    ...conversationHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];
  
  const response = await callMistral(messages, {
    temperature: 0.7,
    maxTokens: 500,
  });
  
  return response.trim();
}

/**
 * Generate adaptive quiz question
 */
export async function generateQuizQuestion(
  difficulty: 'easy' | 'medium' | 'hard',
  previousAnswers: { question: string; correct: boolean }[] = []
): Promise<{
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}> {
  const performanceSummary = previousAnswers.length > 0
    ? `Réponses précédentes: ${previousAnswers.filter(a => a.correct).length}/${previousAnswers.length} correctes`
    : 'Première question';
    
  const messages: MistralMessage[] = [
    {
      role: 'system',
      content: `Tu génères des questions de quiz Pokémon adaptatives.
      
Difficulté: ${difficulty}
- easy: Types, noms de base, informations générales
- medium: Stats, évolutions, capacités
- hard: Stratégie avancée, mécaniques de jeu

Format JSON requis:
{
  "question": "Question en français",
  "choices": ["Choix 1", "Choix 2", "Choix 3", "Choix 4"],
  "correctIndex": 0,
  "explanation": "Explication de la réponse"
}`,
    },
    {
      role: 'user',
      content: `Génère une question de difficulté ${difficulty}.
      
${performanceSummary}

La question doit être différente des précédentes.`,
    },
  ];
  
  const response = await callMistral(messages, {
    temperature: 0.8,
    maxTokens: 500,
    responseFormat: { type: 'json_object' },
  });
  
  return parseAIJson(response);
}
