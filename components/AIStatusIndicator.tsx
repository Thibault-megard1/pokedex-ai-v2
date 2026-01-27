/**
 * AI Status Indicator Component
 * Shows current LLM provider and status
 */

"use client";

import { useEffect, useState } from "react";

interface AIStatus {
  provider: string;
  status: {
    provider: string;
    status: "online" | "offline" | "error";
    message: string;
    message_fr: string;
    model?: string;
    response_time_ms?: number;
  };
}

export default function AIStatusIndicator() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    checkStatus();
    // Refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    try {
      const response = await fetch("/api/ai/health");
      const data = await response.json();

      if (data.success) {
        setStatus(data);
      }
    } catch (error) {
      console.error("[AI Status] Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span>IA...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span>IA indisponible</span>
      </div>
    );
  }

  const { provider, status: healthStatus } = status;

  const statusColors = {
    online: "bg-green-500 text-green-700",
    offline: "bg-orange-500 text-orange-700",
    error: "bg-red-500 text-red-700",
  };

  const statusLabels = {
    online: "En ligne",
    offline: "Hors ligne",
    error: "Erreur",
  };

  const providerNames: Record<string, string> = {
    ollama: "Ollama (Local)",
    mistral: "Mistral AI",
    openai: "OpenAI",
  };

  const color = statusColors[healthStatus.status];
  const label = statusLabels[healthStatus.status];
  const providerName = providerNames[provider] || provider;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs transition-colors hover:opacity-80"
        title="Cliquez pour plus d'infos"
      >
        <div className={`w-2 h-2 rounded-full ${color.split(" ")[0]}`}></div>
        <span className={color.split(" ")[1]}>
          IA: {label}
        </span>
      </button>

      {expanded && (
        <div 
          className="absolute top-full mt-2 right-0 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 min-w-[280px] z-50"
          style={{ backgroundColor: 'var(--overlay-bg)' }}
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Statut IA</span>
              <button
                onClick={() => setExpanded(false)}
                className="font-bold text-lg transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <hr className="border-gray-300 dark:border-gray-600" />

            <div style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Provider:</span>{" "}
              <span className="font-semibold">{providerName}</span>
            </div>

            <div style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Statut:</span>{" "}
              <span className={`font-semibold ${healthStatus.status === 'online' ? 'text-green-600 dark:text-green-400' : healthStatus.status === 'offline' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                {label}
              </span>
            </div>

            {healthStatus.model && (
              <div style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Modèle:</span>{" "}
                <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{healthStatus.model}</span>
              </div>
            )}

            {healthStatus.response_time_ms !== undefined && (
              <div style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ping:</span>{" "}
                <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                  {healthStatus.response_time_ms}ms
                </span>
              </div>
            )}

            <div className="pt-2 text-xs border-t border-gray-300 dark:border-gray-600" style={{ color: 'var(--text-secondary)' }}>
              {healthStatus.message_fr}
            </div>

            {healthStatus.status === "offline" && provider === "ollama" && (
              <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded text-xs" style={{ color: 'var(--text-primary)' }}>
                💡 <b>Astuce:</b> Lance Ollama pour utiliser l'IA locale
                gratuitement.
              </div>
            )}

            <button
              onClick={checkStatus}
              className="w-full mt-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-colors shadow-md hover:shadow-lg"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
