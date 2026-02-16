/**
 * Types et interfaces LLM.
 * Cette section ne fait pas d'IA: elle definit les contrats de donnees.
 * Liens cours IA: sorties structurees et validation des formats.
 */

export type LLMProvider = "ollama" | "mistral" | "openai";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_object";
  };
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  provider: LLMProvider;
  model: string;
  response_time_ms: number;
}

export interface LLMError {
  code: string;
  message: string;
  message_fr: string;
  provider: LLMProvider;
  details?: any;
}

export interface LLMProviderConfig {
  provider: LLMProvider;
  
  // Ollama config
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  
  // Mistral config
  mistralApiKey?: string;
  mistralModel?: string;
  
  // OpenAI config
  openaiApiKey?: string;
  openaiModel?: string;
}

export interface LLMHealthStatus {
  provider: LLMProvider;
  status: "online" | "offline" | "error";
  message: string;
  message_fr: string;
  model?: string;
  response_time_ms?: number;
}
