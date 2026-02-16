'use client';

import { useEffect, useState } from 'react';
import { SettingsManager, GameSettings, DEFAULT_SETTINGS } from '@/lib/game/SettingsManager';

interface GameSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameSettingsPanel({ isOpen, onClose }: GameSettingsPanelProps) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      setSettings(SettingsManager.get());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = SettingsManager.subscribe(setSettings);
    return unsubscribe;
  }, []);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    SettingsManager.save({ [key]: value });
  };

  const resetSettings = () => {
    if (confirm('Reset all settings to default?')) {
      SettingsManager.reset();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-4 border-blue-400 p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Game Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Animations Toggle */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-400 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Animations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enable sprite animations and effects
                </p>
              </div>
              <button
                onClick={() => updateSetting('animations', !settings.animations)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.animations ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.animations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sound Effects Toggle */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-400 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Sound Effects</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Play sound effects during gameplay
                </p>
              </div>
              <button
                onClick={() => updateSetting('soundEffects', !settings.soundEffects)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.soundEffects ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Text Speed */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-400 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Text Speed</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as const).map(speed => (
                <button
                  key={speed}
                  onClick={() => updateSetting('textSpeed', speed)}
                  className={`py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                    settings.textSpeed === speed
                      ? 'bg-green-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Battle Log Verbosity */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-2 border-yellow-400 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Battle Log Detail
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(['simple', 'detailed'] as const).map(verbosity => (
                <button
                  key={verbosity}
                  onClick={() => updateSetting('battleLogVerbosity', verbosity)}
                  className={`py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                    settings.battleLogVerbosity === verbosity
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {verbosity.charAt(0).toUpperCase() + verbosity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Controls */}
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 border-2 border-indigo-400 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Volume</h3>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Music</label>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {settings.musicVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume}
                  onChange={e => updateSetting('musicVolume', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300">SFX</label>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {settings.sfxVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sfxVolume}
                  onChange={e => updateSetting('sfxVolume', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={resetSettings}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          Settings are saved automatically
        </p>
      </div>
    </div>
  );
}
