/**
 * Ollama Client (Local LLM)
 * Free, runs locally on http://localhost:11434
 */

import type { LLMMessage, LLMResponse, LLMError } from "./types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "mistral";
const REQUEST_TIMEOUT = 30000; // 30 seconds

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaChatResponse {
  id?: string;
  object?: string;
  created?: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl: string = OLLAMA_BASE_URL, model: string = DEFAULT_MODEL) {
    this.baseUrl = baseUrl;
    this.defaultModel = model;
  }

  /**
   * Check if Ollama is running and accessible
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        return { healthy: true };
      }

      return {
        healthy: false,
        error: `Ollama responded with status ${response.status}`,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return {
          healthy: false,
          error: "Ollama connection timeout (is it running?)",
        };
      }

      return {
        healthy: false,
        error: error.message || "Failed to connect to Ollama",
      };
    }
  }

  /**
   * Call Ollama chat endpoint (OpenAI-compatible API)
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
      // First check if Ollama is running
      const health = await this.healthCheck();
      if (!health.healthy) {
        throw this.createError("OLLAMA_NOT_RUNNING", health.error);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      // Use OpenAI-compatible endpoint
      const requestBody: any = {
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        stream: false,
      };

      if (options.max_tokens) {
        requestBody.max_tokens = options.max_tokens;
      }

      if (options.jsonMode) {
        requestBody.format = "json";
      }

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw this.createError(
          "OLLAMA_API_ERROR",
          `HTTP ${response.status}: ${errorText}`
        );
      }

      const data: OllamaChatResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw this.createError("OLLAMA_NO_RESPONSE", "No choices returned");
      }

      const responseTime = Date.now() - startTime;

      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        provider: "ollama",
        model: data.model || model,
        response_time_ms: responseTime,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw this.createError(
          "OLLAMA_TIMEOUT",
          `Request timeout after ${REQUEST_TIMEOUT}ms`
        );
      }

      // Re-throw if already an LLMError
      if (error.code) {
        throw error;
      }

      // Wrap unexpected errors
      throw this.createError("OLLAMA_UNKNOWN_ERROR", error.message);
    }
  }

  /**
   * Create a standardized LLM error
   */
  private createError(code: string, details: string = ""): LLMError {
    const errorMessages: Record<string, { en: string; fr: string }> = {
      OLLAMA_NOT_RUNNING: {
        en: "Ollama is not running. Please start Ollama and try again.",
        fr: "Ollama n'est pas lancé. Démarre Ollama et réessaie.",
      },
      OLLAMA_API_ERROR: {
        en: "Ollama API error",
        fr: "Erreur de l'API Ollama",
      },
      OLLAMA_NO_RESPONSE: {
        en: "Ollama returned no response",
        fr: "Ollama n'a renvoyé aucune réponse",
      },
      OLLAMA_TIMEOUT: {
        en: "Ollama request timeout",
        fr: "Timeout de la requête Ollama",
      },
      OLLAMA_UNKNOWN_ERROR: {
        en: "Unknown Ollama error",
        fr: "Erreur Ollama inconnue",
      },
    };

    const messages = errorMessages[code] || {
      en: "Ollama error",
      fr: "Erreur Ollama",
    };

    const error: LLMError = {
      code,
      message: messages.en,
      message_fr: messages.fr,
      provider: "ollama",
      details: details || undefined,
    };

    console.error(`[Ollama Error] ${code}:`, details);

    return error;
  }
}

export default OllamaClient;
