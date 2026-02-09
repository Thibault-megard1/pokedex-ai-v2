"use client";

import { useState, useEffect } from 'react';
import type { AssistantConfig, KnowledgePatches } from '@/lib/assistantAdmin';

interface AssistantAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssistantAdminPanel({ isOpen, onClose }: AssistantAdminPanelProps) {
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [patches, setPatches] = useState<KnowledgePatches | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'guardrails' | 'rules' | 'patches'>('guardrails');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  async function loadConfig() {
    setLoading(true);
    try {
      const [configRes, patchesRes] = await Promise.all([
        fetch('/api/admin/assistant-config'),
        fetch('/api/admin/assistant-patches'),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      if (patchesRes.ok) {
        const patchesData = await patchesRes.json();
        setPatches(patchesData);
      }
    } catch (error) {
      console.error('Failed to load admin config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!config) return;

    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/assistant-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setSaveStatus('error');
    }
  }

  async function savePatches() {
    if (!patches) return;

    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/assistant-patches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patches),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save patches:', error);
      setSaveStatus('error');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              ⚙️ Assistant Pokédex IA – Admin
            </h2>
            <p className="text-orange-100 text-sm mt-1">
              Contrôle et correction des sorties de l'assistant
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-2">⚙️</div>
              <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
            </div>
          </div>
        )}

        {!loading && config && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setActiveTab('guardrails')}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'guardrails'
                    ? 'border-b-2 border-orange-600 text-orange-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                🛡️ Guardrails
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'rules'
                    ? 'border-b-2 border-orange-600 text-orange-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                📋 Règles système
              </button>
              <button
                onClick={() => setActiveTab('patches')}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'patches'
                    ? 'border-b-2 border-orange-600 text-orange-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                🔧 Patches de connaissance
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Guardrails Tab */}
              {activeTab === 'guardrails' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                      ℹ️ À propos des Guardrails
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      Les guardrails contrôlent le comportement général de l'assistant et s'appliquent à toutes les réponses.
                    </p>
                  </div>

                  {Object.entries(config.guardrails).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => {
                          setConfig({
                            ...config,
                            guardrails: {
                              ...config.guardrails,
                              [key]: e.target.checked,
                            },
                          });
                        }}
                        className="mt-1 w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {key === 'strictAnswerOnly' && 'Répondre strictement à la question posée'}
                          {key === 'noRankingsUnlessAsked' && 'Pas de classements sans demande explicite'}
                          {key === 'alwaysFrench' && 'Toujours en français'}
                          {key === 'admitUncertainty' && 'Admettre l\'incertitude'}
                          {key === 'preferBulletLists' && 'Préférer les listes à puces'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {key === 'strictAnswerOnly' && 'Ne pas ajouter de commentaires ou résumés non sollicités'}
                          {key === 'noRankingsUnlessAsked' && 'Ne pas dire "le meilleur", "le plus fort" sans demande'}
                          {key === 'alwaysFrench' && 'Toutes les réponses en français'}
                          {key === 'admitUncertainty' && 'Dire "je ne suis pas sûr" plutôt qu\'inventer'}
                          {key === 'preferBulletLists' && 'Utiliser des bullet points pour les listes de types'}
                        </div>
                      </div>
                    </label>
                  ))}

                  <div className="border-t pt-4">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                      Validation des réponses
                    </h4>
                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.responseValidator.enabled}
                        onChange={(e) => {
                          setConfig({
                            ...config,
                            responseValidator: {
                              ...config.responseValidator,
                              enabled: e.target.checked,
                            },
                          });
                        }}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          Activer le validateur de réponses
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Post-traite les réponses pour retirer les phrases indésirables
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Rules Tab */}
              {activeTab === 'rules' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                      ℹ️ À propos des Règles système
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      Ces règles sont injectées dans le prompt système de l'assistant.
                    </p>
                  </div>

                  {config.systemRules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-700"
                    >
                      <label className="flex items-start gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(e) => {
                            const newRules = [...config.systemRules];
                            newRules[index] = { ...rule, enabled: e.target.checked };
                            setConfig({ ...config, systemRules: newRules });
                          }}
                          className="mt-1 w-5 h-5"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => {
                              const newRules = [...config.systemRules];
                              newRules[index] = { ...rule, name: e.target.value };
                              setConfig({ ...config, systemRules: newRules });
                            }}
                            className="font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-orange-500 outline-none w-full"
                          />
                        </div>
                      </label>
                      <textarea
                        value={rule.description}
                        onChange={(e) => {
                          const newRules = [...config.systemRules];
                          newRules[index] = { ...rule, description: e.target.value };
                          setConfig({ ...config, systemRules: newRules });
                        }}
                        className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Patches Tab */}
              {activeTab === 'patches' && patches && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                      ℹ️ À propos des Patches de connaissance
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      Les patches remplacent automatiquement certaines réponses pour garantir l'exactitude.
                    </p>
                  </div>

                  {patches.patches.map((patch, index) => (
                    <div
                      key={patch.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={patch.enabled}
                            onChange={(e) => {
                              const newPatches = [...patches.patches];
                              newPatches[index] = { ...patch, enabled: e.target.checked };
                              setPatches({ ...patches, patches: newPatches });
                            }}
                            className="w-5 h-5"
                          />
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            Patch #{index + 1} - {patch.scope}
                          </span>
                        </label>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          patch.behavior === 'replace'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {patch.behavior}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Déclencheur (regex):
                          </label>
                          <input
                            type="text"
                            value={patch.trigger}
                            onChange={(e) => {
                              const newPatches = [...patches.patches];
                              newPatches[index] = { ...patch, trigger: e.target.value };
                              setPatches({ ...patches, patches: newPatches });
                            }}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Réponse corrigée:
                          </label>
                          <textarea
                            value={patch.correctedAnswer}
                            onChange={(e) => {
                              const newPatches = [...patches.patches];
                              newPatches[index] = { ...patch, correctedAnswer: e.target.value };
                              setPatches({ ...patches, patches: newPatches });
                            }}
                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-orange-500 outline-none"
                            rows={4}
                          />
                        </div>
                        
                        {patch.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Note: {patch.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {saveStatus === 'saved' && <span className="text-green-600">✓ Sauvegardé</span>}
                {saveStatus === 'saving' && <span className="text-blue-600">⏳ Sauvegarde...</span>}
                {saveStatus === 'error' && <span className="text-red-600">✕ Erreur</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={activeTab === 'patches' ? savePatches : saveConfig}
                  disabled={saveStatus === 'saving'}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                >
                  💾 Sauvegarder
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
