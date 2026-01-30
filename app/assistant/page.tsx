"use client";

import { useState, useRef, useEffect } from 'react';
import type { MistralMessage } from '@/lib/mistralAI';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant Pokédex avec des connaissances précises sur :\n\n✅ Relations de types (forces/faiblesses)\n✅ Statistiques et capacités des Pokémon\n✅ Stratégies de combat\n✅ Mécaniques du jeu (STAB, EVs, IVs, etc.)\n✅ Fonctionnalités de cette application\n\nJe garde en mémoire notre conversation pour des réponses contextuelles. Posez-moi vos questions !',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);
    
    try {
      // Convert to Mistral format (excluding timestamps)
      const history: MistralMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la communication avec l\'IA');
      }
      
      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `Désolé, une erreur s'est produite: ${err.message}`,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation réinitialisée. Comment puis-je vous aider ?',
        timestamp: Date.now(),
      },
    ]);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                🤖 Assistant Pokédex IA
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Posez vos questions sur les Pokémon
              </p>
            </div>
            <button
              onClick={clearChat}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold text-sm"
            >
              🔄 Réinitialiser
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6" style={{ minHeight: '500px', maxHeight: '600px', overflowY: 'auto' }}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="text-2xl flex-shrink-0">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">🤖</div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              ⚠️ {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question... (Entrée pour envoyer)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
            >
              {loading ? '⏳' : '📤'} Envoyer
            </button>
          </div>
          
          {/* Quick Questions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <p className="text-sm text-gray-600 w-full mb-1">Questions rapides:</p>
            {[
              'Quels sont les types forts contre le type Dragon ?',
              'Comment fonctionne le STAB ?',
              'Explique-moi les EVs',
              'Où trouver le calculateur IV/EV ?',
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                disabled={loading}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">💡 Conseils d'utilisation</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Posez des questions sur les Pokémon, leurs types, statistiques, évolutions</li>
            <li>• Demandez des conseils stratégiques pour vos équipes</li>
            <li>• Découvrez comment utiliser les fonctionnalités de l'application</li>
            <li>• L'IA se souvient du contexte de la conversation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
