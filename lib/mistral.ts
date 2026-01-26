/**
 * Mistral AI Integration
 * REST API client for calling Mistral Chat Completions with structured outputs
 */

import type { QuizResult } from "./quiz";

// ============================================================================
// TYPES
// ============================================================================

interface MistralMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MistralRequest {
  model: string;
  messages: MistralMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_object";
  };
}

interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// JSON SCHEMA FOR STRUCTURED OUTPUT
// ============================================================================

export const QUIZ_RESULT_SCHEMA = {
  type: "object",
  required: ["primary", "alternatives", "traits_inferred"],
  properties: {
    primary: {
      type: "object",
      required: ["id", "name", "confidence", "reasons"],
      properties: {
        id: { type: "number" },
        name: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reasons: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 5
        }
      }
    },
    alternatives: {
      type: "array",
      minItems: 0,
      maxItems: 2,
      items: {
        type: "object",
        required: ["id", "name", "confidence", "reasons"],
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasons: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 3
          }
        }
      }
    },
    traits_inferred: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 8
    }
  }
};

// ============================================================================
// API CLIENT
// ============================================================================

export class MistralClient {
  private apiKey: string;
  private baseUrl: string = "https://api.mistral.ai/v1";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Mistral API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Call Mistral Chat Completions API with structured output
   */
  async chatCompletion(
    messages: MistralMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
    } = {}
  ): Promise<string> {
    const {
      model = "mistral-small-latest",
      temperature = 0.3,
      maxTokens = 2000,
      jsonMode = true
    } = options;

    const request: MistralRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    // Enable JSON mode for structured output
    if (jsonMode) {
      request.response_format = { type: "json_object" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API error (${response.status}): ${errorText}`);
      }

      const data: MistralResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from Mistral API");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Mistral API call failed:", error);
      throw error;
    }
  }

  /**
   * Analyze quiz answers and return Pokémon match
   */
  async analyzeQuiz(
    userAnswers: string,
    pokemonCandidates: string
  ): Promise<QuizResult> {
    const systemPrompt = `You are a Pokémon personality analyst. Your task is to match a person to a Pokémon based on their personality quiz answers.

STRICT RULES:
1. You MUST output valid JSON following the exact schema provided
2. You MUST only choose Pokémon IDs from the provided candidate list
3. You MUST NOT invent Pokémon IDs or names that don't exist in the list
4. The confidence score must be between 0 and 1
5. Provide clear, specific reasons for each match
6. Infer 3-8 personality traits from the answers
7. Do NOT request or reference sensitive personal data

OUTPUT FORMAT (JSON):
{
  "primary": {
    "id": <number from candidate list>,
    "name": "<exact name from candidate list>",
    "confidence": <0-1>,
    "reasons": ["reason 1", "reason 2", ...]
  },
  "alternatives": [
    {
      "id": <number>,
      "name": "<name>",
      "confidence": <0-1>,
      "reasons": ["reason 1", ...]
    }
  ],
  "traits_inferred": ["trait1", "trait2", ...]
}

CANDIDATE POKÉMON LIST:
${pokemonCandidates}`;

    const userPrompt = `Based on these quiz answers, determine which Pokémon best matches this person's personality:

${userAnswers}

Analyze the answers and select the Pokémon that best represents this personality. Consider:
- Their social energy and preferences
- Their values and motivations
- Their approach to challenges
- Their emotional style
- Their ideal environment

Return your analysis as JSON following the schema.`;

    const messages: MistralMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const responseText = await this.chatCompletion(messages, {
      model: "mistral-small-latest",
      temperature: 0.3,
      maxTokens: 2000,
      jsonMode: true
    });

    // Parse and validate the JSON response
    try {
      const result: QuizResult = JSON.parse(responseText);
      
      // Basic validation
      if (!result.primary || !result.primary.id || !result.primary.name) {
        throw new Error("Invalid response structure: missing primary match");
      }

      if (!Array.isArray(result.alternatives)) {
        result.alternatives = [];
      }

      if (!Array.isArray(result.traits_inferred)) {
        result.traits_inferred = [];
      }

      return result;
    } catch (error) {
      console.error("Failed to parse Mistral response:", responseText);
      throw new Error("Failed to parse AI response as valid JSON");
    }
  }
}

/**
 * Simple validator for quiz results
 */
export function validateQuizResult(result: any): result is QuizResult {
  if (!result || typeof result !== "object") return false;
  
  // Validate primary match
  if (!result.primary || typeof result.primary !== "object") return false;
  if (typeof result.primary.id !== "number") return false;
  if (typeof result.primary.name !== "string") return false;
  if (typeof result.primary.confidence !== "number") return false;
  if (!Array.isArray(result.primary.reasons)) return false;
  
  // Validate alternatives
  if (!Array.isArray(result.alternatives)) return false;
  for (const alt of result.alternatives) {
    if (typeof alt.id !== "number") return false;
    if (typeof alt.name !== "string") return false;
    if (typeof alt.confidence !== "number") return false;
    if (!Array.isArray(alt.reasons)) return false;
  }
  
  // Validate traits
  if (!Array.isArray(result.traits_inferred)) return false;
  
  return true;
}
