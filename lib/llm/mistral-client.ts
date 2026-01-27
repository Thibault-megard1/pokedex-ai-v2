/**
 * Mistral Client (Wrapper for existing implementation)
 * Adapts existing MistralClient to unified LLM interface
 */

import type { LLMMessage, LLMResponse, LLMError } from "./types";

const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";
const DEFAULT_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";
const REQUEST_TIMEOUT = 30000;

interface MistralChatResponse {
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

export class MistralClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    if (!apiKey) {
      throw this.createError("MISTRAL_NO_API_KEY", "API key is required");
    }
    this.apiKey = apiKey;
    this.baseUrl = MISTRAL_BASE_URL;
    this.defaultModel = model;
  }

  /**
   * Check if Mistral API is accessible
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      // Try to list models as a health check
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        return { healthy: true };
      }

      if (response.status === 401) {
        return { healthy: false, error: "Invalid API key" };
      }

      return {
        healthy: false,
        error: `Mistral API responded with status ${response.status}`,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return { healthy: false, error: "Mistral API timeout" };
      }

      return {
        healthy: false,
        error: error.message || "Failed to connect to Mistral API",
      };
    }
  }

  /**
   * Call Mistral chat completions API
   */
  async chat(
    messages: LLMMessage[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      jsonMode?: boolean;
    } = {}
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const requestBody: any = {
        model,
        messages,
        temperature: options.temperature ?? 0.3,
      };

      if (options.max_tokens) {
        requestBody.max_tokens = options.max_tokens;
      }

      if (options.jsonMode) {
        requestBody.response_format = { type: "json_object" };
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 401) {
          throw this.createError("MISTRAL_INVALID_KEY", "Invalid API key");
        }

        const errorText = await response.text();
        throw this.createError(
          "MISTRAL_API_ERROR",
          `HTTP ${response.status}: ${errorText}`
        );
      }

      const data: MistralChatResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw this.createError("MISTRAL_NO_RESPONSE", "No choices returned");
      }

      const responseTime = Date.now() - startTime;

      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        provider: "mistral",
        model: data.model,
        response_time_ms: responseTime,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw this.createError(
          "MISTRAL_TIMEOUT",
          `Request timeout after ${REQUEST_TIMEOUT}ms`
        );
      }

      if (error.code) {
        throw error;
      }

      throw this.createError("MISTRAL_UNKNOWN_ERROR", error.message);
    }
  }

  /**
   * Create a standardized LLM error
   */
  private createError(code: string, details: string = ""): LLMError {
    const errorMessages: Record<string, { en: string; fr: string }> = {
      MISTRAL_NO_API_KEY: {
        en: "Mistral API key is required",
        fr: "Clé API Mistral requise",
      },
      MISTRAL_INVALID_KEY: {
        en: "Invalid Mistral API key",
        fr: "Clé API Mistral invalide",
      },
      MISTRAL_API_ERROR: {
        en: "Mistral API error",
        fr: "Erreur de l'API Mistral",
      },
      MISTRAL_NO_RESPONSE: {
        en: "Mistral returned no response",
        fr: "Mistral n'a renvoyé aucune réponse",
      },
      MISTRAL_TIMEOUT: {
        en: "Mistral request timeout",
        fr: "Timeout de la requête Mistral",
      },
      MISTRAL_UNKNOWN_ERROR: {
        en: "Unknown Mistral error",
        fr: "Erreur Mistral inconnue",
      },
    };

    const messages = errorMessages[code] || {
      en: "Mistral error",
      fr: "Erreur Mistral",
    };

    const error: LLMError = {
      code,
      message: messages.en,
      message_fr: messages.fr,
      provider: "mistral",
      details: details || undefined,
    };

    console.error(`[Mistral Error] ${code}:`, details);

    return error;
  }
}

export default MistralClient;
