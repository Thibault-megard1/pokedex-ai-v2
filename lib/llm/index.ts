/**
 * Unified LLM Provider System
 * Manages provider selection and routing
 */

import type {
  LLMProvider,
  LLMMessage,
  LLMRequest,
  LLMResponse,
  LLMError,
  LLMProviderConfig,
  LLMHealthStatus,
} from "./types";
import OllamaClient from "./ollama";
import MistralClient from "./mistral-client";

/**
 * Get provider configuration from environment variables
 */
export function getProviderConfig(): LLMProviderConfig {
  const provider = (process.env.LLM_PROVIDER?.toLowerCase() || "ollama") as LLMProvider;

  return {
    provider,
    
    // Ollama
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    ollamaModel: process.env.OLLAMA_MODEL || "mistral",
    
    // Mistral
    mistralApiKey: process.env.MISTRAL_API_KEY,
    mistralModel: process.env.MISTRAL_MODEL || "mistral-small-latest",
    
    // OpenAI (placeholder for future)
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
  };
}

/**
 * Main LLM call function - routes to appropriate provider
 * Automatically falls back to Mistral if Ollama is not running
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const config = getProviderConfig();
  let provider = config.provider;

  console.log(`[LLM] Calling provider: ${provider} with model: ${request.model || "default"}`);

  try {
    switch (provider) {
      case "ollama":
        try {
          return await callOllama(request, config);
        } catch (ollamaError: any) {
          // If Ollama is not running, fallback to Mistral
          if (ollamaError.code === "OLLAMA_NOT_RUNNING" && config.mistralApiKey) {
            console.log("[LLM] Ollama not available, falling back to Mistral...");
            return await callMistral(request, config);
          }
          throw ollamaError;
        }
      
      case "mistral":
        return await callMistral(request, config);
      
      case "openai":
        throw createProviderError(
          "PROVIDER_NOT_IMPLEMENTED",
          "OpenAI provider not yet implemented",
          provider
        );
      
      default:
        throw createProviderError(
          "PROVIDER_UNKNOWN",
          `Unknown provider: ${provider}`,
          provider
        );
    }
  } catch (error: any) {
    // If it's already an LLMError, re-throw
    if (error.code && error.provider) {
      throw error;
    }

    // Wrap unexpected errors
    throw createProviderError(
      "PROVIDER_CALL_FAILED",
      error.message || "LLM call failed",
      provider
    );
  }
}

/**
 * Call Ollama (local LLM)
 */
async function callOllama(
  request: LLMRequest,
  config: LLMProviderConfig
): Promise<LLMResponse> {
  const client = new OllamaClient(config.ollamaBaseUrl, config.ollamaModel);

  return await client.chat(request.messages, {
    model: request.model || config.ollamaModel,
    temperature: request.temperature,
    max_tokens: request.max_tokens,
    jsonMode: request.response_format?.type === "json_object",
  });
}

/**
 * Call Mistral
 */
async function callMistral(
  request: LLMRequest,
  config: LLMProviderConfig
): Promise<LLMResponse> {
  if (!config.mistralApiKey) {
    throw createProviderError(
      "MISTRAL_NO_API_KEY",
      "MISTRAL_API_KEY environment variable not set",
      "mistral"
    );
  }

  const client = new MistralClient(config.mistralApiKey, config.mistralModel);

  return await client.chat(request.messages, {
    model: request.model || config.mistralModel,
    temperature: request.temperature,
    max_tokens: request.max_tokens,
    jsonMode: request.response_format?.type === "json_object",
  });
}

/**
 * Check health status of current provider
 */
export async function checkLLMHealth(): Promise<LLMHealthStatus> {
  const config = getProviderConfig();
  const provider = config.provider;

  try {
    const startTime = Date.now();

    switch (provider) {
      case "ollama": {
        const client = new OllamaClient(config.ollamaBaseUrl, config.ollamaModel);
        const health = await client.healthCheck();
        const responseTime = Date.now() - startTime;

        if (health.healthy) {
          return {
            provider: "ollama",
            status: "online",
            message: "Ollama is running and ready",
            message_fr: "Ollama est lancé et prêt",
            model: config.ollamaModel,
            response_time_ms: responseTime,
          };
        }

        return {
          provider: "ollama",
          status: "offline",
          message: health.error || "Ollama not running",
          message_fr: "Ollama n'est pas lancé",
        };
      }

      case "mistral": {
        if (!config.mistralApiKey) {
          return {
            provider: "mistral",
            status: "error",
            message: "Mistral API key not configured",
            message_fr: "Clé API Mistral non configurée",
          };
        }

        const client = new MistralClient(config.mistralApiKey, config.mistralModel);
        const health = await client.healthCheck();
        const responseTime = Date.now() - startTime;

        if (health.healthy) {
          return {
            provider: "mistral",
            status: "online",
            message: "Mistral API is accessible",
            message_fr: "API Mistral accessible",
            model: config.mistralModel,
            response_time_ms: responseTime,
          };
        }

        return {
          provider: "mistral",
          status: "error",
          message: health.error || "Mistral API error",
          message_fr: "Erreur API Mistral",
        };
      }

      case "openai":
        return {
          provider: "openai",
          status: "error",
          message: "OpenAI provider not implemented",
          message_fr: "Provider OpenAI non implémenté",
        };

      default:
        return {
          provider: config.provider,
          status: "error",
          message: `Unknown provider: ${config.provider}`,
          message_fr: `Provider inconnu: ${config.provider}`,
        };
    }
  } catch (error: any) {
    return {
      provider,
      status: "error",
      message: error.message || "Health check failed",
      message_fr: "Échec du contrôle de santé",
    };
  }
}

/**
 * Create a standardized provider error
 */
function createProviderError(
  code: string,
  details: string,
  provider: LLMProvider
): LLMError {
  const errorMessages: Record<string, { en: string; fr: string }> = {
    PROVIDER_NOT_IMPLEMENTED: {
      en: "This provider is not yet implemented",
      fr: "Ce provider n'est pas encore implémenté",
    },
    PROVIDER_UNKNOWN: {
      en: "Unknown LLM provider",
      fr: "Provider LLM inconnu",
    },
    PROVIDER_CALL_FAILED: {
      en: "LLM provider call failed",
      fr: "Échec de l'appel au provider LLM",
    },
    MISTRAL_NO_API_KEY: {
      en: "Mistral API key not configured",
      fr: "Clé API Mistral non configurée",
    },
  };

  const messages = errorMessages[code] || {
    en: "Provider error",
    fr: "Erreur du provider",
  };

  console.error(`[Provider Error] ${code} (${provider}):`, details);

  return {
    code,
    message: messages.en,
    message_fr: messages.fr,
    provider,
    details,
  };
}

export * from "./types";
